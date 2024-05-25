import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IMessageService } from './messages';
import { Messages } from '../entities/Message';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  AnswerMessagesSingle,
  CreateMessageParams,
  CreateMessageResponse,
  DeleteMessages,
  ForwardMessages,
  UpdateEmoji,
  UpdateMessages,
} from '../untills/types';
import { Rooms } from '../entities/Rooms';
import { RoomsPromise } from '../room/dto/RoomDTO.dto';
import { MessagesRoomsUpdate } from './dto/Messages.dto';
import { UsersPromise } from '../auth/dtos/Users.dto';
import { GroupRooms } from '../entities/Groups';

@Injectable()
export class MessagesService implements IMessageService {
  constructor(
    @InjectModel(Messages.name) private readonly messagesModel: Model<Messages>,
    @InjectModel(Rooms.name) private roomsModel: Model<Rooms>,
    @InjectModel(GroupRooms.name) private groupsModel: Model<GroupRooms>,
  ) { }
  async forwardMessages(
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
  async feedbackMessagesSingle(
    id: string,
    answerMessages: AnswerMessagesSingle,
    user: UsersPromise,
  ) {
    const { content, idMessages } = answerMessages;
    const objectIdRoomId = new mongoose.Types.ObjectId(id);
    const rooms = await this.roomsModel
      .findOne({ _id: objectIdRoomId })
      .populate('creator')
      .populate('recipient');
    if (!rooms) {
      throw new HttpException('Rooms not exist', HttpStatus.BAD_REQUEST);
    }
    const objectIdMessageRoomsId = new mongoose.Types.ObjectId(idMessages);
    const findMessagesFeedBack = await this.messagesModel.findById(
      objectIdMessageRoomsId,
    );
    if (!findMessagesFeedBack) {
      throw new HttpException(
        'Messages feedback not exist',
        HttpStatus.BAD_REQUEST,
      );
    }
    const { recipient, creator } = rooms;
    const exists = recipient.email === user.email;
    if (creator.email !== user.email && !exists) {
      throw new HttpException('Not create Messages', HttpStatus.BAD_REQUEST);
    }
    const newMessage = await this.messagesModel.create({
      content: content,
      rooms: rooms,
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
    const updated = await this.roomsModel.findOneAndUpdate(
      { _id: rooms._id },
      {
        $set: { lastMessageSent: dataLastMessages },
        $push: { messages: dataMessage },
      },
      { new: true },
    );
    //return messageSave;
    return { message: messageSave, rooms: updated };
  }
  async iconOnMessages(
    id: string,
    updateEmoji: UpdateEmoji,
  ): Promise<MessagesRoomsUpdate> {
    try {
      const { newEmoji, idMessages, idLastMessageSent, email } = updateEmoji;
      const objectIdMessage = new mongoose.Types.ObjectId(idMessages);
      const findRooms = await this.roomsModel.findById(id);
      if (!findRooms) {
        throw new HttpException('Phòng không tồn tại', HttpStatus.BAD_REQUEST);
      }
      const findMessages = await this.messagesModel.findById(objectIdMessage);
      if (!findMessages) {
        throw new HttpException(
          'Tin nhắn không tồn tại',
          HttpStatus.BAD_REQUEST,
        );
      }
      const updateMessage = await this.messagesModel.updateOne(
        { _id: findMessages.id },
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
        const objectIdRoomId = new mongoose.Types.ObjectId(idMessages);
        const dataMessageUpdate = {
          'messages.$.emoji': newEmoji, // Chỉ cập nhật nội dung
          'messages.$.content': findMessages.content,
          'messages.$.updatedAt': new Date(), // Cập nhật thời gian cập nhật
          // Cập nhật thông tin tác giả nếu cần
          'messages.$.email': email,
          'messages.$.author': findMessages.author.fullName,
        };
        const newLastMessages = {
          _id: objectIdRoomId,
          content: findMessages.content,
          emoji: newEmoji,
          author: {
            email: email,
            fullName: findMessages.author.fullName,
          },
          updatedAt: new Date(),
        };
        const updatedRooms = await this.roomsModel.findOneAndUpdate(
          { _id: id, 'messages._id': objectIdMessage }, // Lọc theo id của room và id của tin nhắn trong mảng messages
          { $set: dataMessageUpdate }, // Cập nhật nội dung tin nhắn
          { new: true },
        );
        if (!updatedRooms) {
          throw new HttpException(
            'Không thể cập nhật tin nhắn last',
            HttpStatus.CONFLICT,
          );
        }
        // // Cập nhật lastMessageSent với thông tin từ message cuối cùng hoặc đặt là đối tượng rỗng nếu không còn messages
        const objRoomNew = new mongoose.Types.ObjectId(id);
        const resultLastMessage = await this.roomsModel.findOneAndUpdate(
          { _id: objRoomNew },
          { $set: { lastMessageSent: newLastMessages } },
          { new: true },
        );
        return {
          idMessages: findMessages.id,
          messagesUpdate: findMessages,
          roomsUpdate: resultLastMessage,
        };
      }
      const dataUpdate1 = {
        'messages.$.emoji': newEmoji, // Chỉ cập nhật nội dung
        'messages.$.content': findMessages.content,
        'messages.$.updatedAt': new Date(), // Cập nhật thời gian cập nhật
        // Cập nhật thông tin tác giả nếu cần
        'messages.$.email': email,
        'messages.$.author': findMessages.author.fullName,
      };
      const updatedRooms1 = await this.roomsModel.findOneAndUpdate(
        { _id: id, 'messages._id': objectIdMessage }, // Lọc theo id của room và id của tin nhắn trong mảng messages
        { $set: dataUpdate1 }, // Cập nhật nội dung tin nhắn
        { new: true },
      );
      return {
        idMessages: findMessages.id,
        messagesUpdate: findMessages,
        roomsUpdate: updatedRooms1,
      };
    } catch (error) {
      console.log(error);
    }
  }
  async updateMessage(
    fullName: string,
    id: string,
    informationUpdateMessage: UpdateMessages,
  ) {
    const { newMessages, idMessages, idLastMessageSent, email } =
      informationUpdateMessage;
    const findRooms: RoomsPromise = await this.roomsModel.findById(id);
    if (!findRooms) {
      throw new HttpException('Phòng không tồn tại', HttpStatus.BAD_REQUEST);
    }
    const findMessages = await this.messagesModel.findById(idMessages);
    if (!findMessages) {
      throw new HttpException('Tin nhắn không tồn tại', HttpStatus.BAD_REQUEST);
    }
    if (findMessages.author.email !== email) {
      throw new HttpException(
        'Bạn không phải là chủ tin nhắn',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updateMessage = await this.messagesModel.updateOne(
      { _id: findMessages.id },
      { content: newMessages },
      { new: true },
    );
    if (!updateMessage) {
      throw new HttpException(
        'Không thể cập nhật tin nhắn',
        HttpStatus.CONFLICT,
      );
    }
    if (findMessages.id === idLastMessageSent) {
      const objectIdRoomId = new mongoose.Types.ObjectId(idMessages);
      const dataMessageUpdate = {
        'messages.$.content': newMessages, // Chỉ cập nhật nội dung
        'messages.$.updatedAt': new Date(), // Cập nhật thời gian cập nhật
        // Cập nhật thông tin tác giả nếu cần
        'messages.$.email': email,
        'messages.$.author': fullName,
      };
      const newLastMessages = {
        _id: objectIdRoomId,
        content: newMessages,
        author: {
          email: email,
          fullName: fullName,
        },
        updatedAt: new Date(),
      };
      const updatedRooms = await this.roomsModel.findOneAndUpdate(
        { _id: id, 'messages._id': findMessages._id }, // Lọc theo id của room và id của tin nhắn trong mảng messages
        { $set: dataMessageUpdate }, // Cập nhật nội dung tin nhắn
        { new: true },
      );
      if (!updatedRooms) {
        throw new HttpException(
          'Không thể cập nhật tin nhắn last',
          HttpStatus.CONFLICT,
        );
      }
      // // Cập nhật lastMessageSent với thông tin từ message cuối cùng hoặc đặt là đối tượng rỗng nếu không còn messages
      const resultLastMessage = await this.roomsModel.findByIdAndUpdate(
        id,
        { $set: { lastMessageSent: newLastMessages } },
        { new: true },
      );
      return resultLastMessage;
    }
    const dataMessageUpdate1 = {
      'messages.$.content': newMessages, // Chỉ cập nhật nội dung
      'messages.$.updatedAt': new Date(), // Cập nhật thời gian cập nhật
      // Cập nhật thông tin tác giả nếu cần
      'messages.$.email': email,
      'messages.$.author': fullName,
    };
    const updatedRooms1 = await this.roomsModel.findOneAndUpdate(
      { _id: id, 'messages._id': findMessages._id }, // Lọc theo id của room và id của tin nhắn trong mảng messages
      { $set: dataMessageUpdate1 }, // Cập nhật nội dung tin nhắn
      { new: true },
    );
    return updatedRooms1;
  }
  async deleteMessages(id: string, informationMess: DeleteMessages) {
    const { idMessages, idLastMessageSent, email } = informationMess;
    const findRooms: RoomsPromise = await this.roomsModel.findById(id);
    if (!findRooms) {
      throw new HttpException('Phòng không tồn tại', HttpStatus.BAD_REQUEST);
    }
    const findMessages = await this.messagesModel.findById(idMessages);
    if (!findMessages) {
      throw new HttpException('Tin nhắn không tồn tại', HttpStatus.BAD_REQUEST);
    }
    if (findMessages.author.email !== email) {
      throw new HttpException(
        'Bạn không phải là chủ tin nhắn',
        HttpStatus.BAD_REQUEST,
      );
    }
    const deletedCount = await this.messagesModel.deleteOne({
      _id: findMessages.id,
    });
    if (deletedCount.deletedCount < 1 || !deletedCount.deletedCount) {
      throw new HttpException(
        'Không thể xóa mess bước trước không thành công',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (findMessages.id === idLastMessageSent) {
      const objectIdRoomId = new mongoose.Types.ObjectId(idMessages);
      const dataMessageRemove = { _id: objectIdRoomId };
      // Xóa message và cập nhật lastMessageSent trong một bước, nếu có thể
      const updatedRoom = await this.roomsModel.findOneAndUpdate(
        { _id: id },
        { $pull: { messages: dataMessageRemove } },
        { new: true },
      );

      // Kiểm tra messages để xác định lastMessageSent mới
      const lastMessage =
        updatedRoom.messages.length > 0
          ? updatedRoom.messages[updatedRoom.messages.length - 1]
          : {};

      // Cập nhật lastMessageSent với thông tin từ message cuối cùng hoặc đặt là đối tượng rỗng nếu không còn messages
      const resultLastMessage = await this.roomsModel.findByIdAndUpdate(
        id,
        { $set: { lastMessageSent: lastMessage } },
        { new: true },
      );

      return {
        roomsUpdate: resultLastMessage,
        idMessages: idMessages,
        userActions: email,
      };
    }
    const objectIdRoomId = new mongoose.Types.ObjectId(idMessages);
    const dataMessageRemove = { _id: objectIdRoomId };
    const updateRooms = await this.roomsModel.findOneAndUpdate(
      { _id: id },
      { $pull: { messages: dataMessageRemove } },
      { new: true },
    );
    return {
      roomsUpdate: updateRooms,
      idMessages: idMessages,
      userActions: email,
    };
  }
  async getMessages(id: string): Promise<Messages[]> {
    const objectIdRoomId = new mongoose.Types.ObjectId(id);
    const messages = await this.messagesModel.find({
      'rooms._id': objectIdRoomId,
    });
    return messages;
  }
  async createMessages(
    params: CreateMessageParams,
  ): Promise<CreateMessageResponse> {
    const { user, content, roomsID } = params;
    const rooms = await this.roomsModel
      .findOne({ _id: roomsID })
      .populate('creator')
      .populate('recipient');
    if (!rooms) {
      throw new HttpException('Room not exist', HttpStatus.BAD_REQUEST);
    }
    const { recipient, creator } = rooms;
    // if (creator.email !== user.email && recipient.email !== user.email) {
    //   throw new HttpException('Not create Messages', HttpStatus.BAD_REQUEST);
    // }
    if (creator.email !== user.email && recipient.email !== user.email) {
      throw new HttpException('Not create Messages', HttpStatus.BAD_REQUEST);
    }
    const newMessage = await this.messagesModel.create({
      content: content,
      rooms: rooms,
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
    const updated = await this.roomsModel.findOneAndUpdate(
      { _id: rooms.id },
      {
        $set: { lastMessageSent: dataLastMessages },
        $push: { messages: dataMessage },
      },
      { new: true },
    );
    //return messageSave;
    return { message: messageSave, rooms: updated };
  }
}
