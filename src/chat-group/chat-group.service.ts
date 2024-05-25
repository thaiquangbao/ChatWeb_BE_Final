import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IMessageGroupsService } from './chat-group';
import mongoose, { Model } from 'mongoose';
import { GroupRooms } from '../entities/Groups';
import { InjectModel } from '@nestjs/mongoose';
import {
  AnswerMessagesGroups,
  CreateMessageGroupParams,
  CreateMessageRoomsResponse,
  DeleteMessages,
  ForwardMessages,
  UpdateEmoji,
  UpdateGroupsMessages,
} from '../untills/types';
import { MessagesGroup } from '../entities/MessagesGroup';
import { UsersPromise } from '../auth/dtos/Users.dto';
import { MessagesGroupsUpdate } from './dtos/chat-group.dto';
import { Rooms } from '../entities/Rooms';

@Injectable()
export class ChatGroupService implements IMessageGroupsService {
  constructor(
    @InjectModel(GroupRooms.name) private groupsModel: Model<GroupRooms>,
    @InjectModel(MessagesGroup.name)
    private messageGroupsModel: Model<MessagesGroup>,
    @InjectModel(Rooms.name) private roomsModel: Model<Rooms>,
  ) { }
  async forwardMessagesGroups(
    infoMessages: ForwardMessages,
  ): Promise<ForwardMessages> {
    const { idRooms, idGroups } = infoMessages;
    let groupsPromise = [];
    let roomsPromise = [];
    if (idRooms.length > 0) {
      const roomsRequest = idRooms.map(async (id) => {
        const rooms = await this.roomsModel.findById(id);
        return rooms.id;
      });
      roomsPromise = (await Promise.all(roomsRequest)).map((room) => {
        return room;
      });
    }
    if (idGroups.length > 0) {
      const groupsRequest = idGroups.map(async (id) => {
        const groups = await this.groupsModel.findById(id);
        return groups.id;
      });
      groupsPromise = (await Promise.all(groupsRequest)).map((group) => {
        return group;
      });
    }
    return { idRooms: roomsPromise, idGroups: groupsPromise };
  }
  async iconOnMessages(
    id: string,
    updateEmoji: UpdateEmoji,
  ): Promise<MessagesGroupsUpdate> {
    try {
      const { newEmoji, idMessages, idLastMessageSent, email } = updateEmoji;
      const objectIdMessage = new mongoose.Types.ObjectId(idMessages);
      const objectIdGroups = new mongoose.Types.ObjectId(id);
      const findGroups = await this.groupsModel.findById(objectIdGroups);
      if (!findGroups) {
        throw new HttpException('Groups không tồn tại', HttpStatus.BAD_REQUEST);
      }
      const findMessages =
        await this.messageGroupsModel.findById(objectIdMessage);
      if (!findMessages) {
        throw new HttpException(
          'Tin nhắn không tồn tại',
          HttpStatus.BAD_REQUEST,
        );
      }
      const updateMessage = await this.messageGroupsModel.updateOne(
        { _id: findMessages._id },
        { emoji: newEmoji },
        { new: true },
      );
      if (updateMessage.modifiedCount <= 0) {
        throw new HttpException(
          'Không thể cập nhật tin nhắn',
          HttpStatus.CONFLICT,
        );
      }
      if (idMessages === idLastMessageSent) {
        const dataMessageUpdate = {
          'messages.$.emoji': newEmoji, // Chỉ cập nhật nội dung
          'messages.$.content': findMessages.content,
          'messages.$.updatedAt': new Date(), // Cập nhật thời gian cập nhật
          // Cập nhật thông tin tác giả nếu cần
          'messages.$.email': email,
          'messages.$.author': findMessages.author.fullName,
          'messages.$.answerMessage': findMessages.answerMessage,
        };
        const newLastMessages = {
          _id: findMessages._id,
          content: findMessages.content,
          emoji: newEmoji,
          author: {
            email: email,
            fullName: findMessages.author.fullName,
          },
          answerMessage: findMessages.answerMessage,
          updatedAt: new Date(),
        };
        const updatedGroups = await this.groupsModel.findOneAndUpdate(
          { _id: findGroups._id, 'messages._id': objectIdMessage }, // Lọc theo id của room và id của tin nhắn trong mảng messages
          { $set: dataMessageUpdate }, // Cập nhật nội dung tin nhắn
          { new: true },
        );
        if (!updatedGroups) {
          throw new HttpException(
            'Không thể cập nhật tin nhắn last',
            HttpStatus.CONFLICT,
          );
        }
        // // Cập nhật lastMessageSent với thông tin từ message cuối cùng hoặc đặt là đối tượng rỗng nếu không còn messages
        const objRoomNew = new mongoose.Types.ObjectId(id);
        const resultLastMessage = await this.groupsModel.findOneAndUpdate(
          { _id: objRoomNew },
          { $set: { lastMessageSent: newLastMessages } },
          { new: true },
        );
        return {
          idMessages: findMessages.id,
          messagesUpdate: findMessages,
          groupsUpdate: resultLastMessage,
        };
      }
      const dataUpdate1 = {
        'messages.$.emoji': newEmoji, // Chỉ cập nhật nội dung
        'messages.$.content': findMessages.content,
        'messages.$.updatedAt': new Date(), // Cập nhật thời gian cập nhật
        // Cập nhật thông tin tác giả nếu cần
        'messages.$.email': email,
        'messages.$.author': findMessages.author.fullName,
        'messages.$.answerMessage': findMessages.answerMessage,
      };
      const updatedRooms1 = await this.groupsModel.findOneAndUpdate(
        { _id: findGroups._id, 'messages._id': objectIdMessage }, // Lọc theo id của room và id của tin nhắn trong mảng messages
        { $set: dataUpdate1 }, // Cập nhật nội dung tin nhắn
        { new: true },
      );
      return {
        idMessages: findMessages.id,
        messagesUpdate: findMessages,
        groupsUpdate: updatedRooms1,
      };
    } catch (error) {
      console.log(error);
    }
  }
  async feedbackMessages(
    id: string,
    answerMessages: AnswerMessagesGroups,
    user: UsersPromise,
  ) {
    const { content, idMessages } = answerMessages;
    const objectIdGroupId = new mongoose.Types.ObjectId(id);
    const groups = await this.groupsModel
      .findOne({ _id: objectIdGroupId })
      .populate('creator')
      .populate('participants');
    if (!groups) {
      throw new HttpException('Groups not exist', HttpStatus.BAD_REQUEST);
    }
    const objectIdMessageGroupId = new mongoose.Types.ObjectId(idMessages);
    const findMessagesFeedBack = await this.messageGroupsModel.findById(
      objectIdMessageGroupId,
    );
    if (!findMessagesFeedBack) {
      throw new HttpException(
        'Messages feedback not exist',
        HttpStatus.BAD_REQUEST,
      );
    }
    const { participants, creator } = groups;
    const exists = participants.some((item) => item.email === user.email);
    if (creator.email !== user.email && !exists) {
      throw new HttpException('Not create Messages', HttpStatus.BAD_REQUEST);
    }
    const newMessage = await this.messageGroupsModel.create({
      content: content,
      groups: groups,
      author: user,
      answerMessage: {
        author: findMessagesFeedBack.author.email,
        content: findMessagesFeedBack.content,
        idMessages: findMessagesFeedBack._id,
        fullName: findMessagesFeedBack.author.fullName,
      },
    });
    const messageSave = await newMessage.save();
    const dataMessage = {
      _id: messageSave._id,
      content: messageSave.content,
      emoji: messageSave.emoji,
      author: messageSave.author.fullName,
      email: messageSave.author.email,
      answerMessage: {
        author: findMessagesFeedBack.author.email,
        content: findMessagesFeedBack.content,
        idMessages: findMessagesFeedBack._id,
        fullName: findMessagesFeedBack.author.fullName,
      },
      createdAt: new Date(),
    };
    const dataAuth = {
      email: messageSave.author.email,
      fullName: messageSave.author.fullName,
    };
    //rooms.lastMessageSent = messageSave;
    const dataLastMessages = {
      _id: messageSave._id,
      content: messageSave.content,
      emoji: messageSave.emoji,
      author: dataAuth,
      answerMessage: {
        author: findMessagesFeedBack.author.email,
        content: findMessagesFeedBack.content,
        idMessages: findMessagesFeedBack._id,
        fullName: findMessagesFeedBack.author.fullName,
      },
      createdAt: new Date(),
    };
    // Cập nhật lại lastMessage vào phòng chat bỏ id messges vào trong đó
    const updated = await this.groupsModel.findOneAndUpdate(
      { _id: groups.id },
      {
        $set: { lastMessageSent: dataLastMessages },
        $push: { messages: dataMessage },
      },
      { new: true },
    );
    //return messageSave;
    return { message: messageSave, groups: updated };
  }
  async recallMessage(
    fullName: string,
    id: string,
    informationUpdateMessage: UpdateGroupsMessages,
  ) {
    const { idMessages, idLastMessageSent, email } = informationUpdateMessage;
    const objectIdGroupId = new mongoose.Types.ObjectId(id);
    const findGroups = await this.groupsModel.findById(objectIdGroupId);
    if (!findGroups) {
      throw new HttpException('Group không tồn tại', HttpStatus.BAD_REQUEST);
    }
    const objectIMessagesGroupId = new mongoose.Types.ObjectId(idMessages);
    const findGroupMessages = await this.messageGroupsModel.findById(
      objectIMessagesGroupId,
    );
    if (!findGroupMessages) {
      throw new HttpException('Tin nhắn không tồn tại', HttpStatus.BAD_REQUEST);
    }
    if (findGroupMessages.author.email !== email) {
      throw new HttpException(
        'Bạn không phải là chủ tin nhắn',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updateMessage = await this.messageGroupsModel.updateOne(
      { _id: findGroupMessages._id },
      { content: '', answerMessage: {} },
      { new: true },
    );
    if (!updateMessage) {
      throw new HttpException(
        'Không thể cập nhật tin nhắn',
        HttpStatus.CONFLICT,
      );
    }
    if (findGroupMessages.id === idLastMessageSent) {
      const dataMessageUpdate = {
        'messages.$.content': '', // Chỉ cập nhật nội dung
        'messages.$.updatedAt': new Date(), // Cập nhật thời gian cập nhật
        // Cập nhật thông tin tác giả nếu cần
        'messages.$.email': email,
        'messages.$.author': fullName,
      };
      const newLastMessages = {
        _id: findGroupMessages._id,
        content: '',
        author: {
          email: email,
          fullName: fullName,
        },
        updatedAt: new Date(),
      };
      const updatedRooms = await this.groupsModel.findOneAndUpdate(
        { _id: findGroups._id, 'messages._id': findGroupMessages._id }, // Lọc theo id của room và id của tin nhắn trong mảng messages
        { $set: dataMessageUpdate }, // Cập nhật nội dung tin nhắn
        { new: true },
      );
      if (!updatedRooms) {
        throw new HttpException(
          'Không thể cập nhật tin nhắn last',
          HttpStatus.CONFLICT,
        );
      }
      const resultLastMessage = await this.groupsModel.findByIdAndUpdate(
        findGroups._id,
        { $set: { lastMessageSent: newLastMessages } },
        { new: true },
      );
      return resultLastMessage;
    }
    const dataMessageUpdate1 = {
      'messages.$.content': '', // Chỉ cập nhật nội dung
      'messages.$.updatedAt': new Date(), // Cập nhật thời gian cập nhật
      // Cập nhật thông tin tác giả nếu cần
      'messages.$.email': email,
      'messages.$.author': fullName,
    };
    const updatedRooms1 = await this.groupsModel.findOneAndUpdate(
      { _id: findGroups._id, 'messages._id': findGroupMessages._id }, // Lọc theo id của room và id của tin nhắn trong mảng messages
      { $set: dataMessageUpdate1 }, // Cập nhật nội dung tin nhắn
      { new: true },
    );
    return updatedRooms1;
  }
  async deleteMessages(id: string, informationMess: DeleteMessages) {
    const { idMessages, idLastMessageSent, email } = informationMess;
    const objectIdGroupId = new mongoose.Types.ObjectId(id);
    const findGroups = await this.groupsModel.findById(objectIdGroupId);
    if (!findGroups) {
      throw new HttpException('Groups not exist', HttpStatus.BAD_REQUEST);
    }
    const objectIMessagesGroupId = new mongoose.Types.ObjectId(idMessages);
    const findMessages = await this.messageGroupsModel.findById(
      objectIMessagesGroupId,
    );
    if (!findMessages) {
      throw new HttpException('Tin nhắn không tồn tại', HttpStatus.BAD_REQUEST);
    }
    if (findMessages.author.email !== email) {
      throw new HttpException(
        'Bạn không phải là chủ tin nhắn',
        HttpStatus.BAD_REQUEST,
      );
    }
    const deletedCount = await this.messageGroupsModel.deleteOne({
      _id: findMessages._id,
    });
    if (deletedCount.deletedCount < 1 || !deletedCount.deletedCount) {
      throw new HttpException(
        'Không thể xóa mess bước trước không thành công',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (findMessages.id === idLastMessageSent) {
      const dataMessageRemove = { _id: findMessages._id };
      // Xóa message và cập nhật lastMessageSent trong một bước, nếu có thể
      const updatedRoom = await this.groupsModel.findOneAndUpdate(
        { _id: findGroups._id },
        { $pull: { messages: dataMessageRemove } },
        { new: true },
      );

      // Kiểm tra messages để xác định lastMessageSent mới
      const lastMessage =
        updatedRoom.messages.length > 0
          ? updatedRoom.messages[updatedRoom.messages.length - 1]
          : {};

      // Cập nhật lastMessageSent với thông tin từ message cuối cùng hoặc đặt là đối tượng rỗng nếu không còn messages
      const resultLastMessage = await this.groupsModel.findByIdAndUpdate(
        findGroups._id,
        { $set: { lastMessageSent: lastMessage } },
        { new: true },
      );

      return {
        groupsUpdate: resultLastMessage,
        idMessages: idMessages,
        userActions: email,
      };
    }
    const dataMessageRemove = { _id: objectIMessagesGroupId };
    const updateGroups = await this.groupsModel.findOneAndUpdate(
      { _id: findGroups._id },
      { $pull: { messages: dataMessageRemove } },
      { new: true },
    );
    return {
      groupsUpdate: updateGroups,
      idMessages: idMessages,
      userActions: email,
    };
  }
  async getMessagesGroup(id: string): Promise<MessagesGroup[]> {
    const objectIdRoomId = new mongoose.Types.ObjectId(id);
    const messages = await this.messageGroupsModel.find({
      'groups._id': objectIdRoomId,
    });
    return messages;
  }
  async createMessagesForGroup(
    createMessageParams: CreateMessageGroupParams,
  ): Promise<CreateMessageRoomsResponse> {
    const { content, groupsID, user } = createMessageParams;
    const groups = await this.groupsModel
      .findOne({ _id: groupsID })
      .populate('creator')
      .populate('participants');
    if (!groups) {
      throw new HttpException('Group not exist', HttpStatus.BAD_REQUEST);
    }
    const { participants, creator } = groups;
    // if (creator.email !== user.email && recipient.email !== user.email) {
    //   throw new HttpException('Not create Messages', HttpStatus.BAD_REQUEST);
    // }
    const exists = participants.some((item) => item.email === user.email);
    if (creator.email !== user.email && !exists) {
      throw new HttpException('Not create Messages', HttpStatus.BAD_REQUEST);
    }
    const newMessage = await this.messageGroupsModel.create({
      content: content,
      groups: groups,
      author: user,
    });
    const messageSave = await newMessage.save();
    const dataMessage = {
      _id: messageSave._id,
      content: messageSave.content,
      emoji: messageSave.emoji,
      author: messageSave.author.fullName,
      email: messageSave.author.email,
      createdAt: new Date(),
    };
    const dataAuth = {
      email: messageSave.author.email,
      fullName: messageSave.author.fullName,
    };
    //rooms.lastMessageSent = messageSave;
    const dataLastMessages = {
      _id: messageSave._id,
      content: messageSave.content,
      emoji: messageSave.emoji,
      author: dataAuth,
      createdAt: new Date(),
    };
    // Cập nhật lại lastMessage vào phòng chat bỏ id messges vào trong đó
    const updated = await this.groupsModel.findOneAndUpdate(
      { _id: groups.id },
      {
        $set: { lastMessageSent: dataLastMessages },
        $push: { messages: dataMessage },
      },
      { new: true },
    );
    //return messageSave;
    return { message: messageSave, groups: updated };
  }
}
