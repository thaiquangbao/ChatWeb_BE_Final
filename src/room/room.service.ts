import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IRoomsService } from './room';

import { InjectModel } from '@nestjs/mongoose';
import { Rooms } from '../entities/Rooms';
import { Model } from 'mongoose';
import { UsersPromise } from '../auth/dtos/Users.dto';
import { CreateRoomsParams, ListRooms } from '../untills/types';
import { IUserService } from '../users/users';
import { Services } from '../untills/constain';
import { User } from '../entities/users';
import { Messages } from '../entities/Message';
import { RoomsCall, RoomsPromise } from './dto/RoomDTO.dto';
// import { RoomsPromise } from './dto/RoomDTO.dto';

@Injectable()
export class RoomService implements IRoomsService {
  constructor(
    @InjectModel(Rooms.name) private roomsModel: Model<Rooms>,
    @Inject(Services.USERS) private readonly userService: IUserService,
    @InjectModel(User.name) private usersModel: Model<User>,
    @InjectModel(Messages.name) private messagesModel: Model<Messages>,
  ) { }
  async onlineReturnHome(user: User): Promise<ListRooms[]> {
    try {
      await this.roomsModel.updateMany(
        {
          'creator.email': user.email,
        },
        { $set: { 'creator.online': true } },
      );
      await this.roomsModel.updateMany(
        {
          'recipient.email': user.email,
        },
        { $set: { 'recipient.online': true } },
      );
      await this.usersModel.updateOne({ email: user.email }, { online: true });
      const findOnline: ListRooms[] = await this.roomsModel.find({
        $or: [
          { 'recipient.email': user.email },
          { 'creator.email': user.email },
        ],
      });
      return findOnline;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
  async rejectedCall(room: RoomsCall): Promise<RoomsPromise> {
    const result: RoomsPromise = await this.roomsModel.findOneAndUpdate(
      {
        'recipient.email': room.recipient.email,
        'creator.email': room.creator.email,
      },
      { $set: { call: false } },
    );
    await this.usersModel.updateOne(
      { email: room.creator.email },
      { calling: false },
    );
    await this.usersModel.updateOne(
      { email: room.recipient.email },
      { calling: false },
    );
    return result;
  }
  async cancelCall(room: RoomsCall): Promise<Rooms> {
    const result = await this.roomsModel.findOneAndUpdate(
      {
        'recipient.email': room.recipient.email,
        'creator.email': room.creator.email,
      },
      { $set: { call: false } },
    );
    await this.usersModel.updateOne(
      { email: room.creator.email },
      { calling: false },
    );
    await this.usersModel.updateOne(
      { email: room.recipient.email },
      { calling: false },
    );
    return result;
  }
  async call(room: RoomsCall): Promise<RoomsPromise> {
    const result: RoomsPromise = await this.roomsModel.findOneAndUpdate(
      {
        'recipient.email': room.recipient.email,
        'creator.email': room.creator.email,
      },
      { $set: { call: true } },
    );
    await this.usersModel.updateOne(
      { email: room.creator.email },
      { calling: true },
    );
    await this.usersModel.updateOne(
      { email: room.recipient.email },
      { calling: true },
    );
    return result;
  }
  async offline(email: string): Promise<ListRooms[]> {
    try {
      const user = await this.usersModel.findOne({ email: email });
      await this.roomsModel.updateMany(
        {
          'creator.email': user.email,
        },
        { $set: { 'creator.online': false } },
      );
      await this.roomsModel.updateMany(
        {
          'recipient.email': user.email,
        },
        { $set: { 'recipient.online': false } },
      );
      await this.usersModel.updateOne({ email: user.email }, { online: false });
      const findOffline: ListRooms[] = await this.roomsModel.find({
        $or: [
          { 'recipient.email': user.email },
          { 'creator.email': user.email },
        ],
      });
      return findOffline;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
  async online(user: UsersPromise): Promise<ListRooms[]> {
    try {
      await this.roomsModel.updateMany(
        {
          'creator.email': user.email,
        },
        { $set: { 'creator.online': true } },
      );
      await this.roomsModel.updateMany(
        {
          'recipient.email': user.email,
        },
        { $set: { 'recipient.online': true } },
      );
      await this.usersModel.updateOne({ email: user.email }, { online: true });
      const findOnline: ListRooms[] = await this.roomsModel.find({
        $or: [
          { 'recipient.email': user.email },
          { 'creator.email': user.email },
        ],
      });
      return findOnline;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
  async deleteRooms(roomsId: string) {
    const findRooms = await this.roomsModel.findById(roomsId);
    if (!findRooms) {
      throw new HttpException('Rooms not exist', HttpStatus.NOT_FOUND);
    }
    const deleteRooms = await this.roomsModel.findOneAndDelete(findRooms._id);
    return deleteRooms;
  }
  async findById(id: string): Promise<Rooms> {
    const rooms = await this.roomsModel.findOne({ _id: id });
    return rooms;
  }
  async getRooms(id: string): Promise<Rooms[]> {
    try {
      const rooms = await this.roomsModel.find({
        $or: [{ 'recipient._id': id }, { 'creator._id': id }],
      });

      return rooms;
    } catch (error) {
      return error;
    }
  }
  async isCreated(
    userId: string,
    recipientId: string,
  ): Promise<Rooms | undefined> {
    const existingRoom = await this.roomsModel.findOne({
      $or: [
        {
          'creator._id': userId,
          'recipient._id': recipientId,
        },
        {
          'creator._id': recipientId,
          'recipient._id': userId,
        },
      ],
    });
    return existingRoom;
  }
  async createRooms(
    user: UsersPromise,
    roomsParams: CreateRoomsParams,
  ): Promise<Rooms> {
    try {
      const dataRecipient = await this.usersModel.findOne({
        email: roomsParams.email,
      });
      if (!dataRecipient) {
        throw new HttpException('User not exist', HttpStatus.NOT_FOUND);
      }
      if (user.id === dataRecipient.id) {
        throw new HttpException(
          'Cannot create Rooms with yourself',
          HttpStatus.BAD_REQUEST,
        );
      }

      const existed = await this.isCreated(user.id, dataRecipient.id);

      if (existed) {
        throw new HttpException(
          'Đã tạo phòng với User này ròi',
          HttpStatus.BAD_REQUEST,
        );
      }
      user.sended = true;
      const newRooms = await this.roomsModel.create({
        recipient: dataRecipient,
        creator: user,
      });
      const rooms = await newRooms.save();
      return rooms;
    } catch (err) {
      return err;
    }
  }
  // getRooms(id: string): Promise<RoomsPromise[]> {
  //   throw new Error('Method not implemented.');
  // }
  // findById(id: string): Promise<RoomsPromise> {
  //   throw new Error('Method not implemented.');
  // }
  // hasAccess(params: AccessParams): Promise<boolean> {
  //   throw new Error('Method not implemented.');
  // }

  // save(rooms: RoomsPromise): Promise<RoomsPromise> {
  //   throw new Error('Method not implemented.');
  // }
  // getMessages(params: GetConversationMessagesParams): Promise<RoomsPromise> {
  //   throw new Error('Method not implemented.');
  // }
}
