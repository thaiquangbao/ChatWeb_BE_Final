import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IGroups } from './group';
import {
  CreateGroupParams,
  Franchiser,
  GroupOne,
  KickGroups,
  UpdateGroups,
} from '../untills/types';
import { UsersPromise } from '../auth/dtos/Users.dto';
import { GroupRooms } from '../entities/Groups';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../entities/users';
import mongoose, { Model } from 'mongoose';
import { IUserService } from '../users/users';
import { Services } from '../untills/constain';
import { CallGroups } from './dtos/group.dto';
import { Rooms } from '../entities/Rooms';

@Injectable()
export class GroupRoomsService implements IGroups {
  constructor(
    @InjectModel(User.name) private usersModel: Model<User>,
    @InjectModel(GroupRooms.name) private groupsModel: Model<GroupRooms>,
    @Inject(Services.USERS) private readonly userService: IUserService,
    @InjectModel(Rooms.name) private roomsModel: Model<Rooms>,
  ) { }
  async rejectRequestGroup(userReject: string): Promise<CallGroups> {
    const existGroups = await this.groupsModel.findOne({
      attendCallGroup: { $elemMatch: { email: userReject } },
    });
    const dataOut = { email: userReject };
    const result: GroupOne = await this.groupsModel.findByIdAndUpdate(
      existGroups.id,
      {
        $pull: { attendCallGroup: dataOut },
      },
      { new: true },
    );
    await this.usersModel.updateOne({ email: userReject }, { calling: false });
    return result;
  }
  async memberReturnHome(email: string): Promise<UsersPromise> {
    const userExist = await this.usersModel.findOne({
      email: email,
    });
    await this.roomsModel.updateMany(
      {
        'creator.email': userExist.email,
      },
      { $set: { 'creator.online': true } },
    );
    await this.roomsModel.updateMany(
      {
        'recipient.email': userExist.email,
      },
      { $set: { 'recipient.online': true } },
    );
    const newUser: UsersPromise = await this.usersModel.findOneAndUpdate(
      { email: userExist.email },
      { online: true },
      { new: true },
    );
    return newUser;
  }
  async acceptCallGroup(
    id: string,
    userAccept: string,
    nameAccept: string,
    userCall: string,
  ): Promise<CallGroups> {
    const existGroups = await this.groupsModel.findById(id);
    const result: GroupOne = await this.groupsModel.findOneAndUpdate(
      { _id: existGroups._id, 'attendCallGroup.email': userAccept },
      {
        $set: {
          'attendCallGroup.$.email': userAccept,
          'attendCallGroup.$.fullName': nameAccept,
          'attendCallGroup.$.acceptCall': true,
        },
      },
      { new: true },
    );
    const findUserCall = await this.usersModel.findOne({ email: userCall });
    const findUserAttend = await this.groupsModel.findOne({
      _id: existGroups._id,
      attendCallGroup: {
        $elemMatch: { email: findUserCall.email, acceptCall: true },
      },
    });
    if (!findUserAttend) {
      await this.groupsModel.findOneAndUpdate(
        { _id: existGroups._id, 'attendCallGroup.email': findUserCall.email },
        {
          $set: {
            'attendCallGroup.$.email': findUserCall.email,
            'attendCallGroup.$.fullName': findUserCall.fullName,
            'attendCallGroup.$.acceptCall': true,
          },
        },
        { new: true },
      );
    }

    return result;
  }
  async rejectedCallGroup(id: string, userOut: string): Promise<CallGroups> {
    const existGroups = await this.groupsModel.findById(id);
    const dataOut = { email: userOut };
    const result: GroupOne = await this.groupsModel.findByIdAndUpdate(
      existGroups.id,
      {
        $pull: { attendCallGroup: dataOut },
      },
      { new: true },
    );
    await this.usersModel.updateOne({ email: userOut }, { calling: false });
    return result;
  }
  async cancelCallGroup(id: string): Promise<CallGroups> {
    const existGroups = await this.groupsModel.findById(id);
    await Promise.all(
      existGroups.attendCallGroup.map((participant) => {
        return this.usersModel.updateOne(
          { email: participant.email },
          { calling: false },
        );
      }),
    );
    const result: GroupOne = await this.groupsModel.findByIdAndUpdate(
      existGroups.id,
      {
        $set: { callGroup: false, attendCallGroup: [] },
      },
      { new: true },
    );
    return result;
  }
  async callGroup(id: string): Promise<CallGroups> {
    const existGroups = await this.groupsModel.findById(id);
    //const editParticipants = [...existGroups.participants, existGroups.creator];
    const result: GroupOne = await this.groupsModel.findByIdAndUpdate(
      existGroups.id,
      {
        $set: {
          callGroup: true,
        },
      },
      { new: true },
    );
    const userOnline = await this.usersModel.findOne({
      email: existGroups.creator.email,
      online: true,
    });
    if (userOnline && userOnline.calling === false) {
      await this.usersModel.updateOne(
        { email: existGroups.creator.email },
        { calling: true },
      );
      const dataCreator = {
        email: existGroups.creator.email,
        fullName: existGroups.creator.fullName,
        acceptCall: false,
      };
      await this.groupsModel.updateOne(
        { _id: existGroups._id },
        { $push: { attendCallGroup: dataCreator } },
      );
    }
    await Promise.all(
      existGroups.participants.map(async (participant) => {
        const userOnlineReci = await this.usersModel.findOne({
          email: participant.email,
          online: true,
        });
        if (userOnlineReci && userOnlineReci.calling === false) {
          await this.usersModel.findOneAndUpdate(
            { email: participant.email },
            { calling: true },
          );
          const dataCreator = {
            email: participant.email,
            fullName: participant.fullName,
            acceptCall: false,
          };
          await this.groupsModel.updateOne(
            { _id: existGroups._id },
            { $push: { attendCallGroup: dataCreator } },
          );
        }
      }),
    );
    return result;
  }
  async franchiseLeader(userAction: UsersPromise, franchiser: Franchiser) {
    const { idGroups, idUserFranchise } = franchiser;
    const objectIdGroupId = new mongoose.Types.ObjectId(idGroups);
    const existGroups = await this.groupsModel.findById(objectIdGroupId);
    if (!existGroups) {
      throw new HttpException('Groups not exist', HttpStatus.BAD_REQUEST);
    }
    const objectIdCreatorId = new mongoose.Types.ObjectId(userAction.id);
    const fileOwnGroups = await this.groupsModel.findOne({
      _id: existGroups._id,
      'creator._id': objectIdCreatorId,
    });
    if (!fileOwnGroups) {
      throw new HttpException('You Not Creator Rooms', HttpStatus.BAD_REQUEST);
    }
    const objectIdAttendId = new mongoose.Types.ObjectId(idUserFranchise);
    const findAttendGroups = await this.groupsModel.findOne({
      _id: existGroups._id,
      participants: { $elemMatch: { _id: objectIdAttendId } },
    });
    if (!findAttendGroups) {
      throw new HttpException('User is not in Groups', HttpStatus.BAD_REQUEST);
    }
    const userFranchise = {
      _id: objectIdAttendId,
    };
    const findCreatorNew = await this.usersModel.findById(objectIdAttendId);
    const updateCreator = { creator: findCreatorNew };
    const newCreator = await this.groupsModel.updateOne(
      { _id: existGroups._id },
      { creator: updateCreator.creator },
    );
    if (newCreator.modifiedCount <= 0) {
      throw new HttpException(
        'Updates creator not success',
        HttpStatus.CONFLICT,
      );
    }
    const pullParticipants = await this.groupsModel.updateOne(
      { _id: existGroups._id },
      {
        $pull: { participants: userFranchise },
      },
    );
    if (pullParticipants.modifiedCount <= 0) {
      throw new HttpException(
        'Updates participants not success',
        HttpStatus.CONFLICT,
      );
    }
    const updateParticipants = await this.groupsModel.findByIdAndUpdate(
      existGroups._id,
      {
        $push: { participants: fileOwnGroups.creator },
      },
      { new: true },
    );
    return {
      userCreatorNew: findCreatorNew.email,
      userAction: fileOwnGroups.creator.email,
      groupsUpdate: updateParticipants,
    };
  }
  async kickGroups(userAction: UsersPromise, kickGroups: KickGroups) {
    const { idGroups, idUserKick } = kickGroups;
    const objectIdGroupId = new mongoose.Types.ObjectId(idGroups);
    const existGroups = await this.groupsModel.findById(objectIdGroupId);
    if (!existGroups) {
      throw new HttpException('Groups not exist', HttpStatus.BAD_REQUEST);
    }
    const objectIdCreatorId = new mongoose.Types.ObjectId(userAction.id);
    const fileOwnGroups = await this.groupsModel.findOne({
      _id: existGroups._id,
      'creator._id': objectIdCreatorId,
    });
    if (!fileOwnGroups) {
      throw new HttpException('You Not Creator Rooms', HttpStatus.BAD_REQUEST);
    }
    const objectIdAttendId = new mongoose.Types.ObjectId(idUserKick);
    const findAttendGroups = await this.groupsModel.findOne({
      _id: existGroups._id,
      participants: { $elemMatch: { _id: objectIdAttendId } },
    });
    if (!findAttendGroups) {
      throw new HttpException('User is not in Groups', HttpStatus.BAD_REQUEST);
    }
    const userKicked = {
      _id: objectIdAttendId,
    };
    const pullParticipants = await this.groupsModel.findByIdAndUpdate(
      existGroups._id,
      { $pull: { participants: userKicked } },
      { new: true },
    );
    const findUserKick = await this.usersModel.findById(objectIdAttendId);
    return {
      userAction: userAction.email,
      userKicked: findUserKick.email,
      groupsUpdate: pullParticipants,
    };
  }
  async updateGroups(
    user: UsersPromise,
    updateGroups: UpdateGroups,
  ): Promise<GroupRooms> {
    const { idGroups, nameGroups, avtGroups } = updateGroups;
    const objectIdGroupId = new mongoose.Types.ObjectId(idGroups);
    const existGroups = await this.groupsModel.findById(objectIdGroupId);
    if (!existGroups) {
      throw new HttpException('Groups not exist', HttpStatus.BAD_REQUEST);
    }
    const objectIdUserAction = new mongoose.Types.ObjectId(user.id);
    const fileOwnGroups = await this.groupsModel.findOne({
      _id: existGroups._id,
      $or: [
        { 'creator._id': objectIdUserAction },
        { participants: { $elemMatch: { _id: objectIdUserAction } } },
      ],
    });
    if (!fileOwnGroups) {
      throw new HttpException(
        'Bạn không phải thành viên trong nhóm',
        HttpStatus.BAD_REQUEST,
      );
    }
    const updateGroupsUser = await this.groupsModel.updateOne(
      { _id: existGroups._id },
      { nameGroups: nameGroups, avtGroups: avtGroups },
      { new: true },
    );
    if (updateGroupsUser.modifiedCount <= 0) {
      throw new HttpException('Không thể cập nhật Groups', HttpStatus.CONFLICT);
    }
    const result = await this.groupsModel.findById(existGroups._id);
    return result;
  }
  async inviteToGroups(
    user: UsersPromise,
    idRooms: string,
    participants: string[],
  ) {
    const objectIdGroupId = new mongoose.Types.ObjectId(idRooms);
    const fileGroups = await this.groupsModel.findOne({
      _id: objectIdGroupId,
    });
    if (!fileGroups) {
      throw new HttpException('Not exist Groups', HttpStatus.BAD_REQUEST);
    }
    const objectIdParticipantsId = new mongoose.Types.ObjectId(user.id);
    const fileOwnGroups = await this.groupsModel.findOne({
      _id: fileGroups._id,
      $or: [
        { 'creator._id': objectIdParticipantsId },
        { participants: { $elemMatch: { _id: objectIdParticipantsId } } },
      ],
    });
    if (!fileOwnGroups) {
      throw new HttpException(
        'Bạn không phải thành viên trong nhóm',
        HttpStatus.BAD_REQUEST,
      );
    }
    const userAttendGroups = participants.map((phoneNumber) => {
      return this.usersModel.findOne({ phoneNumber: phoneNumber });
    });
    const usersPromise = (await Promise.all(userAttendGroups)).filter(
      (user) => {
        return user;
      },
    );
    const pushParticipants = await this.groupsModel.findByIdAndUpdate(
      fileGroups._id,
      { $push: { participants: { $each: usersPromise } } },
      { new: true },
    );
    return {
      userAttends: usersPromise,
      userAction: user.email,
      groupsUpdate: pushParticipants,
    };
  }
  async deleteGroups(user: UsersPromise, idRooms: string) {
    const objectIdGroupId = new mongoose.Types.ObjectId(idRooms);
    const fileGroups = await this.groupsModel.findOne({
      _id: objectIdGroupId,
    });
    if (!fileGroups) {
      throw new HttpException('Not exist Groups', HttpStatus.BAD_REQUEST);
    }
    const objectIdCreatorId = new mongoose.Types.ObjectId(user.id);
    const fileOwnGroups = await this.groupsModel.findOne({
      _id: fileGroups._id,
      'creator._id': objectIdCreatorId,
    });
    if (!fileOwnGroups) {
      throw new HttpException('You Not Creator Rooms', HttpStatus.BAD_REQUEST);
    }
    const deleteGroups =
      await this.groupsModel.findByIdAndDelete(objectIdGroupId);
    return deleteGroups;
  }
  async leaveGroups(user: UsersPromise, idRooms: string) {
    const objectIdGroupId = new mongoose.Types.ObjectId(idRooms);
    const fileGroups = await this.groupsModel.findOne({
      _id: objectIdGroupId,
    });
    if (!fileGroups) {
      throw new HttpException('Not exist Groups', HttpStatus.BAD_REQUEST);
    }
    const objectIdParticipantsId = new mongoose.Types.ObjectId(user.id);
    const fileOwnGroups = await this.groupsModel.findOne({
      _id: fileGroups._id,
      'creator._id': objectIdParticipantsId,
    });
    if (fileOwnGroups) {
      throw new HttpException(
        'Bạn là chủ phòng bạn không thể rời đi',
        HttpStatus.BAD_REQUEST,
      );
    }
    const idParticipants = {
      _id: objectIdParticipantsId,
    };
    const pullParticipants = await this.groupsModel.findByIdAndUpdate(
      fileGroups._id,
      { $pull: { participants: idParticipants } },
      { new: true },
    );
    return { userLeave: user.email, groupsUpdate: pullParticipants };
  }
  async getGroupsById(id: string): Promise<GroupRooms> {
    const result = await this.groupsModel.findById(id);
    return result;
  }
  async getGroups(userCreate: UsersPromise): Promise<GroupRooms[]> {
    const objectId = new mongoose.Types.ObjectId(userCreate.id);
    const result = this.groupsModel.find({
      $or: [
        { 'creator._id': userCreate.id },
        { participants: { $elemMatch: { _id: objectId } } },
      ],
    });
    return result;
  }
  async createGroups(
    userCreate: UsersPromise,
    createGroupParams: CreateGroupParams,
  ): Promise<GroupRooms> {
    const usersPromise = createGroupParams.participants.map((phoneNumber) => {
      return this.usersModel.findOne({ phoneNumber: phoneNumber });
    });
    // lộc các giá trị không hợp lệ
    const users = (await Promise.all(usersPromise)).filter((user) => {
      return user;
    });
    const createGroups = await this.groupsModel.create({
      creator: userCreate,
      participants: users,
      nameGroups: createGroupParams.nameGroups,
      avtGroups:
        'https://www.pngall.com/wp-content/uploads/9/Society-PNG-Pic.png',
    });
    const newGroups = await createGroups.save();
    return newGroups;
  }
}
