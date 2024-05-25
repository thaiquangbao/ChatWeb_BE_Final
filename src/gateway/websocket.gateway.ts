import { Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { IRoomsService } from '../room/room';
import { Services } from '../untills/constain';
import { IMessageService } from '../messages/messages';
import mongoose, { Model } from 'mongoose';
import { Messages } from '../entities/Message';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../entities/users';
import { MessagesGroup } from '../entities/MessagesGroup';
import { UserOnline } from '../entities/UserOnline';
import { RoomsCall } from '../room/dto/RoomDTO.dto';
import { Rooms } from '../entities/Rooms';
import { GroupRooms } from '../entities/Groups';
import { IGroups } from '../group-rooms/group';
import { ListRooms } from '../untills/types';
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  },
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @InjectModel(Messages.name) private readonly messagesModel: Model<Messages>,
    @InjectModel(User.name) private readonly usersModel: Model<User>,
    @Inject(Services.MESSAGES)
    private readonly messagesService: IMessageService,
    @Inject(Services.ROOMS)
    private readonly roomsService: IRoomsService,
    @InjectModel(MessagesGroup.name)
    private messageGroupsModel: Model<MessagesGroup>,
    @InjectModel(UserOnline.name) private userOnlineModel: Model<UserOnline>,
    @InjectModel(Rooms.name) private readonly roomsModel: Model<Rooms>,
    @InjectModel(GroupRooms.name) private groupsModel: Model<GroupRooms>,
    @Inject(Services.GROUPS)
    private readonly groupsService: IGroups,
  ) { }
  async handleDisconnect(@ConnectedSocket() client: any) {
    console.log('Người dùng đã out');
    console.log(`${client.session} của disconnect`);
    this.server.emit('disConnected', { status: client.session });
    if (client.handshake.auth.rooms) {
      console.log('mượt ròi');
      return this.server.emit(`userLeaveStatus`, {
        status: client.session,
        rooms: client.handshake.auth.rooms,
      });
    }
    if (client.handshake.auth.roomsVideo) {
      console.log('mượt ròi 2');
      return this.server.emit(`userLeaveVideoStatus`, {
        status: client.session,
        roomsVideo: client.handshake.auth.roomsVideo,
      });
    }
    if (client.handshake.auth.group) {
      console.log('mượt ròi 3');
      return this.server.emit(`memberLeaveGroupStatus${client.session}`, {
        status: client.session,
        group: client.handshake.auth.group,
        userLeave: client.handshake.auth.userLeave,
      });
    }
  }
  async handleConnection(client: any, ...args: any[]) {
    //console.log(client.id);
    client.emit('connected', { status: client.session });
    //console.log(client);
  }

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('createMessage')
  handleCreateMessage(@MessageBody() data: any) {
    console.log('createdMessages');
  }
  @SubscribeMessage('outMeetVoice')
  async handleOutMeet(
    @MessageBody() data: any,
    @ConnectedSocket() client: any,
  ) {
    console.log(data.idRooms);
    client.handshake.auth = {
      rooms: data.idRooms,
    };
  }
  @SubscribeMessage('preJoinHome')
  async handleJoinMeet(
    @MessageBody() data: any,
    @ConnectedSocket() client: any,
  ) {
    const find2User = await this.roomsModel.findById(data.user);
    console.log(find2User.id);
    const userOnlineCreator = await this.roomsService.onlineReturnHome(
      find2User.creator,
    );
    const userOnlineRecipient = await this.roomsService.onlineReturnHome(
      find2User.recipient,
    );
    this.server.emit(`userOnlineMeetOut`, {
      sd: userOnlineCreator,
      td: userOnlineRecipient,
    });
    client.handshake.auth = {};
    userOnlineCreator.forEach(async (room) => {
      this.server.emit(`userOnlineAfterMeetO${room.id}`, userOnlineCreator);
    });
    userOnlineRecipient.forEach(async (room) => {
      return this.server.emit(
        `userOnlineAfterMeetT${room.id}`,
        userOnlineRecipient,
      );
    });
  }
  @SubscribeMessage('outMeetVideo')
  async handleOutMeetVideo(
    @MessageBody() data: any,
    @ConnectedSocket() client: any,
  ) {
    console.log(data.idRooms);
    client.handshake.auth = {
      roomsVideo: data.idRooms,
    };
  }
  @SubscribeMessage('preJoinHomeVideo')
  async handleJoinMeetVideo(
    @MessageBody() data: any,
    @ConnectedSocket() client: any,
  ) {
    const find2User = await this.roomsModel.findById(data.user);
    console.log(find2User.id);
    const userOnlineCreator = await this.roomsService.onlineReturnHome(
      find2User.creator,
    );
    const userOnlineRecipient = await this.roomsService.onlineReturnHome(
      find2User.recipient,
    );
    this.server.emit(`userOnlineMeetOutVideo`, {
      sd: userOnlineCreator,
      td: userOnlineRecipient,
    });
    client.handshake.auth = {};
    userOnlineCreator.forEach(async (room) => {
      this.server.emit(
        `userOnlineAfterMeetVideoO${room.id}`,
        userOnlineCreator,
      );
    });
    userOnlineRecipient.forEach(async (room) => {
      return this.server.emit(
        `userOnlineAfterMeetVideoT${room.id}`,
        userOnlineRecipient,
      );
    });
  }
  @OnEvent('messages.create')
  async handleMessagesCreateEvent(payload: any) {
    //console.log('Đã vào được chức năng tạo messages');
    this.server.emit(payload.rooms._id, await payload);
  }
  @OnEvent('rooms.create')
  handleRoomsCreateEvent(payload: any) {
    //console.log('Đã vào được chức năng tạo messages');
    this.server.emit(payload.creator.email, payload);
    if (payload.creator.email !== payload.recipient.email) {
      return this.server.emit(payload.recipient.email, payload);
    }
  }
  @OnEvent('rooms.get')
  handleRoomsGetEvent(payload: any) {
    // console.log('Đã vào được chức năng get Phòng');
    this.server.emit('getRooms', payload);
  }
  @OnEvent('messages.create')
  async handleMessagesUpdateEvent(payload: any) {
    if (payload.message.author.email === payload.rooms.creator.email) {
      return this.server.emit(
        payload.message.rooms.recipient.email,
        await payload,
      );
    } else {
      return this.server.emit(
        payload.message.rooms.creator.email,
        await payload,
      );
    }
  }
  @SubscribeMessage('onRoomJoin')
  async onJoinRooms(@MessageBody() data: any, @ConnectedSocket() client: any) {
    console.log('Đã tham gia phòng');
    client.join(data.roomsId);
    console.log(client.session);
    client.to(data.roomsId).emit(`userJoin${data.roomsId}`);
  }
  @SubscribeMessage('onRoomLeave')
  async onLeaveRooms(@MessageBody() data: any, @ConnectedSocket() client: any) {
    console.log('Đã rời tham gia phòng');
    client.join(data.roomsId);
    console.log(client.session);
    client.to(data.roomsId).emit(`userLeave${data.roomsId}`);
  }
  @SubscribeMessage('onUserTyping')
  async handleUserTyping(@MessageBody() data: any) {
    const result = await this.roomsService.findById(data.roomsId);
    if (result.creator.phoneNumber === data.phoneNumber) {
      return this.server
        .to(data.roomsId)
        .emit(`${result.recipient.phoneNumber}${data.roomsId}`);
    }
    if (data.phoneNumber === result.recipient.phoneNumber) {
      this.server
        .to(data.roomsId)
        .emit(`${result.creator.phoneNumber}${data.roomsId}`);
    }
  }
  @OnEvent('messages.deleted')
  async handleMessagesDeleteEvent(payload: any) {
    this.server.emit(`deleteMessage${payload.roomsUpdate._id}`, await payload);
  }
  @OnEvent('messages.deleted')
  async handleLastMessagesUpdateEvent(payload: any) {
    this.server.emit(
      `updateLastMessages${payload.userActions}`,
      await payload.roomsUpdate,
    );
    if (payload.userActions === payload.roomsUpdate.recipient.email) {
      return this.server.emit(
        `updateLastMessages${payload.roomsUpdate.creator.email}`,
        await payload.roomsUpdate,
      );
    }
    if (payload.userActions === payload.roomsUpdate.creator.email) {
      return this.server.emit(
        `updateLastMessages${payload.roomsUpdate.recipient.email}`,
        await payload.roomsUpdate,
      );
    }
  }
  @OnEvent('messages.updated')
  async handleUpdatedMessagesEvent(payload: any) {
    const messagesCN = await this.messagesService.getMessages(
      payload.roomsUpdate._id,
    );
    const payLoading = {
      dataLoading: payload,
      messagesCN,
    };
    this.server.emit(`updatedMessage${payload.roomsUpdate._id}`, payLoading);
  }
  @OnEvent('messages.updated')
  async handleUpdatedEvent(payload: any) {
    this.server.emit(
      `updateLastMessagesed${payload.email}`,
      await payload.roomsUpdate,
    );
    if (payload.email === payload.roomsUpdate.recipient.email) {
      return this.server.emit(
        `updateLastMessagesed${payload.roomsUpdate.creator.email}`,
        await payload.roomsUpdate,
      );
    }
    if (payload.email === payload.roomsUpdate.creator.email) {
      return this.server.emit(
        `updateLastMessagesed${payload.roomsUpdate.recipient.email}`,
        await payload.roomsUpdate,
      );
    }
  }
  @OnEvent('accept.friends')
  async handleAcceptFriend(payload: any) {
    const idRooms = payload.roomsUpdateMessage._id;
    const idP = idRooms.toString();
    this.server.emit(`acceptFriends${idP}`, await payload.roomsUpdateMessage);
  }
  @OnEvent('accept.friends')
  async handleSeeAddFriend(payload: any) {
    this.server.emit(
      `updateSendedFriend${payload.emailUserActions}`,
      await payload.roomsUpdateMessage,
    );
    console.log(payload.emailUserActions);
    if (
      payload.emailUserActions === payload.roomsUpdateMessage.recipient.email
    ) {
      console.log(payload.roomsUpdateMessage.creator.email);
      return this.server.emit(
        `updateSendedFriend${payload.roomsUpdateMessage.creator.email}`,
        await payload.roomsUpdateMessage,
      );
    }
    if (payload.emailUserActions === payload.roomsUpdateMessage.creator.email) {
      console.log(payload.roomsUpdateMessage.recipient.email);
      return this.server.emit(
        `updateSendedFriend${payload.roomsUpdateMessage.recipient.email}`,
        await payload.roomsUpdateMessage,
      );
    }
  }
  @OnEvent('accept.friends')
  async handleSeeAddFriendRoom(payload: any) {
    const idRooms = payload.roomsUpdateMessage._id;
    const idP = idRooms.toString();
    this.server.emit(
      `updateSendedFriend${idP}${payload.emailUserActions}`,
      await payload.roomsUpdateMessage,
    );
    if (
      payload.emailUserActions === payload.roomsUpdateMessage.recipient.email
    ) {
      return this.server.emit(
        `updateSendedFriend${idP}${payload.roomsUpdateMessage.creator.email}`,
        await payload.roomsUpdateMessage,
      );
    }
    if (payload.emailUserActions === payload.roomsUpdateMessage.creator.email) {
      return this.server.emit(
        `updateSendedFriend${idP}${payload.roomsUpdateMessage.recipient.email}`,
        await payload.roomsUpdateMessage,
      );
    }
  }
  @OnEvent('accept.friends')
  async handleAddFriendGroup(payload: any) {
    this.server.emit(
      `updateAcceptFriendsGroups${payload.userSend.email}`,
      await payload.roomsUpdateMessage,
    );
    if (payload.userSend.email !== payload.userAccept.email) {
      return this.server.emit(
        `updateAcceptFriendsGroups${payload.userAccept.email}`,
        await payload.roomsUpdateMessage,
      );
    }
  }
  @OnEvent('rooms.delete')
  async handleDeleteRooms(payload: any) {
    const idRooms = payload._id;
    const idP = idRooms.toString();
    this.server.emit(`deleteRooms${idP}`, await payload);
  }
  @OnEvent('unfriends.friends')
  async handleDeleteUnfriendsRooms(payload: any) {
    const customer = {
      emailUserActions: payload.emailUserActions,
      userActions: payload.userActions,
      userAccept: payload.userAccept,
      roomsUpdate: payload.roomsUpdate,
      reload: false,
    };
    this.server.emit(`unfriends${payload.emailUserActions}`, customer);
    if (payload.emailUserActions === payload.userActions.email) {
      return this.server.emit(
        `unfriends${payload.userAccept.email}`,
        await payload,
      );
    }
    if (payload.emailUserActions === payload.userAccept.email) {
      return this.server.emit(
        `unfriends${payload.userActions.email}`,
        await payload,
      );
    }
  }
  @OnEvent('unfriends.friends')
  async handleDeleteUnfriendsGroups(payload: any) {
    this.server.emit(
      `updateUnFriendsGroups${payload.userActions.email}`,
      await payload,
    );
    if (payload.userActions.email !== payload.userAccept.email) {
      return this.server.emit(
        `updateUnFriendsGroups${payload.userAccept.email}`,
        await payload,
      );
    }
  }
  @OnEvent('send.friends')
  async handleSendFriendRooms(payload: any) {
    const action = {
      emailUserActions: payload.userActions.email,
      userActions: payload.userSend,
      userAccept: payload.userAccept,
      reload: true,
    };
    this.server.emit(`sendfriends${payload.userActions.email}`, action);
    if (payload.userActions.email === payload.userSend.email) {
      return this.server.emit(
        `sendfriends${payload.userAccept.email}`,
        await payload,
      );
    }
    if (payload.userActions.email === payload.userAccept.email) {
      return this.server.emit(
        `sendfriends${payload.userActions.email}`,
        await payload,
      );
    }
  }
  @OnEvent('undo.friends')
  async handleUndoFriendRooms(payload: any) {
    this.server.emit(`undo${payload.emailUserActions}`, payload);
    if (payload.emailUserActions === payload.userActions.email) {
      return this.server.emit(`undo${payload.userAccept.email}`, await payload);
    }
    if (payload.emailUserActions === payload.userAccept.email) {
      return this.server.emit(
        `undo${payload.userActions.email}`,
        await payload,
      );
    }
  }
  @OnEvent('messages.emoji')
  async handleEmoji(payload: any) {
    const newMess = await this.messagesModel.findById(payload.idMessages);
    const dataMessages = {
      idMessages: payload.idMessages,
      messagesUpdate: newMess,
      roomsUpdate: payload.roomsUpdate,
    };
    return this.server.emit(`emoji${payload.roomsUpdate.id}`, dataMessages);
  }
  @OnEvent('groups.create')
  async handleGroupsCreateEvent(payload: any) {
    //console.log('Đã vào được chức năng tạo messages');
    this.server.emit(`createGroups${payload.creator.email}`, payload);
    payload.participants.forEach((participant) => {
      if (payload.creator.email !== participant.email) {
        return this.server.emit(`createGroups${participant.email}`, payload);
      }
    });
  }
  @OnEvent('delete.groups')
  async handleGroupsDeleteEvent(payload: any) {
    //console.log('Đã vào được chức năng tạo messages');
    this.server.emit(`deleteGroups${payload.creator.email}`, payload);
    payload.participants.forEach((participant) => {
      if (payload.creator.email !== participant.email) {
        return this.server.emit(`deleteGroups${participant.email}`, payload);
      }
    });
  }
  @OnEvent('leave.groups')
  async handleGroupsLeaveEvent(payload: any) {
    //console.log('Đã vào được chức năng tạo messages');
    this.server.emit(`leaveGroups${payload.userLeave}`, payload);
    payload.groupsUpdate.participants.forEach((participant) => {
      if (payload.groupsUpdate.creator.email !== participant.email) {
        return this.server.emit(`leaveGroups${participant.email}`, payload);
      }
    });
    if (payload.userLeave !== payload.groupsUpdate.creator.email) {
      return this.server.emit(
        `leaveGroups${payload.groupsUpdate.creator.email}`,
        payload,
      );
    }
  }
  @OnEvent('leave.groups')
  async handleGroupsIdLeaveEvent(payload: any) {
    //console.log('Đã vào được chức năng tạo messages');
    this.server.emit(`leaveGroupsId${payload.groupsUpdate._id}`, payload);
  }
  @OnEvent('messagesGroups.create')
  async handleMessagesGroupsCreateEvent(payload: any) {
    this.server.emit(payload.groups._id, await payload);
  }
  @OnEvent('messagesGroups.create')
  async handleMessagesGroupsEvent(payload: any) {
    this.server.emit(
      `createMessageGroups${payload.groups.creator.email}`,
      payload,
    );
    payload.groups.participants.forEach((participant) => {
      if (payload.groups.creator.email !== participant.email) {
        return this.server.emit(
          `createMessageGroups${participant.email}`,
          payload,
        );
      }
    });
  }
  @OnEvent('messages-group.emoji')
  async handleEmojiGroupsEvent(payload: any) {
    const newMess = await this.messageGroupsModel.findById(payload.idMessages);
    const dataMessages = {
      idMessages: payload.idMessages,
      messagesUpdate: newMess,
      groupsUpdate: payload.groupsUpdate,
    };
    return this.server.emit(
      `emojiGroup${payload.groupsUpdate._id}`,
      dataMessages,
    );
  }
  @OnEvent('messages-group.deleted')
  async handleMessagesGroupsDeleteEvent(payload: any) {
    this.server.emit(
      `deleteMessageGroup${payload.groupsUpdate._id}`,
      await payload,
    );
  }
  @OnEvent('messages-group.deleted')
  async handleLastMessagesGroupsDeleteEvent(payload: any) {
    this.server.emit(
      `deleteLastMessagesGroups${payload.groupsUpdate.creator.email}`,
      await payload,
    );
    payload.groupsUpdate.participants.forEach((participant) => {
      if (payload.groupsUpdate.creator.email !== participant.email) {
        return this.server.emit(
          `deleteLastMessagesGroups${participant.email}`,
          payload,
        );
      }
    });
  }
  @OnEvent('messages-groups.recall')
  async handleMessagesGroupsRecallEvent(payload: any) {
    this.server.emit(
      `recallMessageGroup${payload.groupsUpdate._id}`,
      await payload,
    );
  }
  @OnEvent('messages-groups.recall')
  async handleLastMessagesGroupsRecallEvent(payload: any) {
    this.server.emit(
      `recallLastMessagesGroups${payload.groupsUpdate.creator.email}`,
      await payload,
    );
    payload.groupsUpdate.participants.forEach((participant) => {
      if (payload.groupsUpdate.creator.email !== participant.email) {
        return this.server.emit(
          `recallLastMessagesGroups${participant.email}`,
          payload,
        );
      }
    });
  }
  @OnEvent('attend.groups')
  async handleAttendGroupsEvent(payload: any) {
    this.server.emit(`attendGroup${payload.groupsUpdate._id}`, await payload);
  }
  @OnEvent('attend.groups')
  async handleAttendGroupsMessagesEvent(payload: any) {
    this.server.emit(
      `attendMessagesGroup${payload.groupsUpdate.creator.email}`,
      await payload,
    );
    payload.groupsUpdate.participants.forEach((participant) => {
      if (payload.groupsUpdate.creator.email !== participant.email) {
        return this.server.emit(
          `attendMessagesGroup${participant.email}`,
          payload,
        );
      }
    });
    payload.userAttends.forEach((participant) => {
      if (payload.groupsUpdate.creator.email !== participant.email) {
        return this.server.emit(
          `attendMessagesGroupsss${participant.email}`,
          payload,
        );
      }
    });
  }
  @OnEvent('messagesGroups.createWithFeedBack')
  async handleMessagesGroupsCreateWithFeedBackEvent(payload: any) {
    this.server.emit(`feedBackGroup${payload.groups._id}`, await payload);
  }
  @OnEvent('messagesGroups.createWithFeedBack')
  async handleMessagesGroupsWithFeedBackEvent(payload: any) {
    this.server.emit(
      `feedBackLastMessagesGroup${payload.groups.creator.email}`,
      payload,
    );
    payload.groups.participants.forEach((participant) => {
      if (payload.groups.creator.email !== participant.email) {
        return this.server.emit(
          `feedBackLastMessagesGroup${participant.email}`,
          payload,
        );
      }
    });
  }
  @OnEvent('update.groups')
  async handleUpdateGroups(payload: any) {
    this.server.emit(`updateGroup${payload._id}`, await payload);
  }
  @OnEvent('update.groups')
  async handleUpdateUserGroups(payload: any) {
    this.server.emit(
      `updateAttendGroup${payload.creator.email}`,
      await payload,
    );
    payload.participants.forEach((participant) => {
      if (payload.creator.email !== participant.email) {
        return this.server.emit(
          `updateAttendGroup${participant.email}`,
          payload,
        );
      }
    });
  }
  @OnEvent('kick-users.groups')
  async handleKickGroups(payload: any) {
    this.server.emit(`kickOutGroup${payload.groupsUpdate._id}`, await payload);
  }
  @OnEvent('kick-users.groups')
  async handleKickUserGroups(payload: any) {
    this.server.emit(
      `updateKickGroup${payload.groupsUpdate.creator.email}`,
      await payload,
    );
    this.server.emit(`updateKickGroup${payload.userKicked}`, await payload);
    payload.groupsUpdate.participants.forEach((participant) => {
      if (payload.groupsUpdate.creator.email !== participant.email) {
        return this.server.emit(`updateKickGroup${participant.email}`, payload);
      }
    });
  }
  @OnEvent('franchise.groups')
  async handleFranchiseGroups(payload: any) {
    this.server.emit(
      `franchiseGroup${payload.groupsUpdate._id}`,
      await payload,
    );
  }
  @OnEvent('franchise.groups')
  async handleFranchiseUserGroups(payload: any) {
    this.server.emit(
      `updateFranchiseGroup${payload.groupsUpdate.creator.email}`,
      await payload,
    );
    payload.groupsUpdate.participants.forEach((participant) => {
      if (payload.groupsUpdate.creator.email !== participant.email) {
        return this.server.emit(
          `updateFranchiseGroup${participant.email}`,
          payload,
        );
      }
    });
  }
  @SubscribeMessage('onOnline')
  async onUserOnline(@MessageBody() data: any, @ConnectedSocket() client: any) {
    const userOnline = await this.roomsService.online(data.user);

    const existUser = await this.userOnlineModel.findOne({
      email: data.user.email,
    });
    if (!existUser) {
      const dataDB = {
        email: data.user.email,
        session: client.session,
      };
      console.log('hihi');
      await (await this.userOnlineModel.create(dataDB)).save();
    } else if (existUser.session !== client.session) {
      console.log('hí');
      await this.userOnlineModel.updateMany(
        { email: data.user.email },
        { $set: { session: client.session } },
      );
    }
    this.server.emit(`userOnlineStatus`, userOnline);
    userOnline.forEach(async (room) => {
      return this.server.emit(`userOnlineRoom${room.id}`, await userOnline);
    });
  }
  @SubscribeMessage('onOffline')
  async onUserOffline(@MessageBody() data: any) {
    console.log('Đã zô đây nha');
    console.log(`${data.user} của out phòng`);
    const findUserOnline = await this.userOnlineModel.findOne({
      session: data.user,
    });
    if (findUserOnline) {
      const userOffline = await this.roomsService.offline(findUserOnline.email);
      this.server.emit(`userOfflineStatus`, userOffline);
      userOffline.forEach(async (room) => {
        return this.server.emit(`userOfflineRoom${room.id}`, await userOffline);
      });
    }
  }
  @OnEvent('offline.user')
  async handleOfflineUser(payload: any) {
    const findUserOnline = await this.userOnlineModel.findOne({
      email: payload.email,
    });
    if (findUserOnline) {
      await this.userOnlineModel.deleteMany({ email: payload.email });
      const userOffline = await this.roomsService.offline(findUserOnline.email);
      this.server.emit(`signOutUser`, findUserOnline);
      userOffline.forEach(async (room) => {
        return this.server.emit(`signOutRoom${room.id}`, await userOffline);
      });
    }
  }
  @OnEvent('acceptUser.friends')
  async handleAcceptUserFriend(payload: any) {
    const idRooms = payload.roomsUpdateMessage._id;
    const idP = idRooms.toString();
    return this.server.emit(`acceptUserFriends${idP}`, await payload);
  }
  @OnEvent('acceptUser.friends')
  async handleAcceptUserFriendAll(payload: any) {
    this.server.emit(
      `acceptUserFriendsAll${payload.roomsUpdateMessage.creator.email}`,
      await payload,
    );
    if (payload.roomsUpdateMessage.creator.email !== payload.emailUserActions) {
      return this.server.emit(
        `acceptUserFriendsAll${payload.emailUserActions}`,
        await payload,
      );
    }
  }
  @OnEvent('acceptUser.friends')
  async handleAcceptUserIdFriendAll(payload: any) {
    this.server.emit(
      `acceptUserFriendsItem${payload.roomsUpdateMessage.creator.email}`,
      await payload,
    );
    if (payload.roomsUpdateMessage.creator.email !== payload.emailUserActions) {
      return this.server.emit(
        `acceptUserFriendsItem${payload.emailUserActions}`,
        await payload,
      );
    }
  }
  @OnEvent('unfriendUser.friends')
  async handleUnFriendUserAll(payload: any) {
    const customer = {
      emailUserActions: payload.emailUserActions,
      userActions: payload.userActions,
      userAccept: payload.userAccept,
      roomsUpdate: payload.roomsUpdate,
      reload: false,
    };
    this.server.emit(`unFriendsUserAll${payload.emailUserActions}`, customer);
    if (payload.emailUserActions === payload.userActions.email) {
      return this.server.emit(
        `unFriendsUserAll${payload.userAccept.email}`,
        await payload,
      );
    }
    if (payload.emailUserActions === payload.userAccept.email) {
      return this.server.emit(
        `unFriendsUserAll${payload.userActions.email}`,
        await payload,
      );
    }
  }
  @OnEvent('undoUser.friends')
  async handleUndoFriendUserAll(payload: any) {
    this.server.emit(`undoFriendsUserAll${payload.emailUserActions}`, payload);
    if (payload.emailUserActions === payload.userActions.email) {
      return this.server.emit(
        `undoFriendsUserAll${payload.userAccept.email}`,
        await payload,
      );
    }
    if (payload.emailUserActions === payload.userAccept.email) {
      return this.server.emit(
        `undoFriendsUserAll${payload.userActions.email}`,
        await payload,
      );
    }
  }
  @OnEvent('messagesRooms.createWithFeedBack')
  async handleRoomsCreateWithFeedBackEvent(payload: any) {
    this.server.emit(`feedBackRooms${payload.rooms.id}`, await payload);
  }
  @OnEvent('messagesRooms.createWithFeedBack')
  async handleRoomsWithFeedBackEvent(payload: any) {
    this.server.emit(
      `feedBackLastMessagesRooms${payload.rooms.creator.email}`,
      payload,
    );
    if (payload.rooms.creator.email !== payload.rooms.recipient.email) {
      return this.server.emit(
        `feedBackLastMessagesRooms${payload.rooms.recipient.email}`,
        payload,
      );
    }
  }
  @SubscribeMessage('userCallVoice')
  async onUserCallVoice(@MessageBody() data: any) {
    const findRooms = await this.roomsService.findById(data.idRooms);
    const userAlreadyOnline = await this.userOnlineModel.findOne({
      email: data.userReciveCall,
    });
    if (!userAlreadyOnline) {
      const dataError = { errorStatus: true };
      return this.server.emit(`userCallVoice${data.userCall.email}`, dataError);
    }
    const roomsExistsCall = await this.roomsModel.find({
      $or: [
        { 'recipient.email': data.userCall.email },
        { 'creator.email': data.userCall.email },
      ],
      call: true,
    });
    const existCalling = await this.usersModel.findOne({
      email: data.userCall.email,
    });
    if (roomsExistsCall.length > 0 || existCalling.calling === true) {
      const dataErrorCall = { errorCall: true };
      return this.server.emit(
        `userCallVoice${data.userCall.email}`,
        dataErrorCall,
      );
    }
    const roomsWithCall = await this.roomsModel.find({
      $or: [
        { 'recipient.email': data.userReciveCall },
        { 'creator.email': data.userReciveCall },
      ],
      call: true,
    });
    const existCallingRecive = await this.usersModel.findOne({
      email: data.userReciveCall,
    });
    if (roomsWithCall.length > 0 || existCallingRecive.calling === true) {
      const dataError = { error: true };
      return this.server.emit(`userCallVoice${data.userCall.email}`, dataError);
    }
    const settingRooms: RoomsCall = {
      recipient: findRooms.recipient, // Add the required 'id' property
      creator: findRooms.creator,
    };
    const actionCall = await this.roomsService.call(settingRooms);
    const dataPayload = {
      roomCall: actionCall,
      userCall: data.userCall,
    };
    this.server.emit(`userCallVoice${data.userCall.email}`, dataPayload);
    if (data.userCall.email === actionCall.creator.email) {
      this.server.emit(
        `userCallVoiceRecipient${actionCall.recipient.email}`,
        dataPayload,
      );
    } else {
      this.server.emit(
        `userCallVoiceRecipient${actionCall.creator.email}`,
        dataPayload,
      );
    }
  }
  @SubscribeMessage('rejectedVoiceCall')
  async onRejectedCallVoice(@MessageBody() data: any) {
    const findRooms = await this.roomsService.findById(data.idRooms);
    if (findRooms.call !== true || findRooms.call === null) {
      const dataError = { error: true };
      return this.server.emit(
        `userRejectedCallVoice${data.userReject.email}`,
        dataError,
      );
    }
    const settingRooms: RoomsCall = {
      recipient: findRooms.recipient,
      creator: findRooms.creator,
    };
    const actionCall = await this.roomsService.rejectedCall(settingRooms);
    const dataPayload = {
      roomCall: actionCall,
      userReject: data.userReject,
    };
    this.server.emit(
      `userRejectedCallVoice${data.userReject.email}`,
      dataPayload,
    );
    if (data.userReject.email === actionCall.creator.email) {
      this.server.emit(
        `userRejectedCallVoiceRecipient${actionCall.recipient.email}`,
        dataPayload,
      );
    } else {
      this.server.emit(
        `userRejectedCallVoiceRecipient${actionCall.creator.email}`,
        dataPayload,
      );
    }
  }
  @SubscribeMessage('cancelVoiceCall')
  async onCancelCallVoice(@MessageBody() data: any) {
    const findRooms = await this.roomsService.findById(data.idRooms);
    if (findRooms.call !== true) {
      const dataError = { error: true };
      return this.server.emit(
        `userCancelCallVoice${data.userCancel.email}`,
        dataError,
      );
    }
    const settingRooms: RoomsCall = {
      recipient: findRooms.recipient,
      creator: findRooms.creator,
    };
    const actionCall = await this.roomsService.cancelCall(settingRooms);
    const dataPayload = {
      roomCall: actionCall,
      userCancel: data.userCancel,
    };
    this.server.emit(
      `userCancelCallVoice${dataPayload.userCancel.email}`,
      dataPayload,
    );
    return this.server.emit(
      `userCancelCallVoiceRecipient${data.userReciveCall}`,
      dataPayload,
    );
  }
  @SubscribeMessage('userAcceptCallVoice')
  async onAcceptCallVoice(@MessageBody() data: any) {
    const findRooms = await this.roomsService.findById(data.idRooms);
    if (findRooms.call !== true) {
      const dataError = { error: true };
      return this.server.emit(
        `userAttendCallVoice${data.userInCall.email}`,
        dataError,
      );
    }
    const dataPayload = {
      userInCall: data.userInCall,
      roomCall: findRooms,
      idRooms: data.idRooms,
    };
    this.server.emit(
      `userAttendCallVoice${data.userInCall.email}`,
      dataPayload,
    );
    if (data.userInCall.email === findRooms.creator.email) {
      this.server.emit(
        `userAttendCallVoiceRecipient${findRooms.recipient.email}`,
        dataPayload,
      );
    } else {
      this.server.emit(
        `userAttendCallVoiceRecipient${findRooms.creator.email}`,
        dataPayload,
      );
    }
  }
  @SubscribeMessage('leave-callVoice')
  async onLeaveCallVoice(@MessageBody() data: any) {
    const findRooms = await this.roomsService.findById(data.idRooms);
    if (findRooms.call !== true || findRooms.call === null) {
      const dataError = { error: true };
      return this.server.emit(`outCallVoice${data.userLeave.email}`, dataError);
    }
    const settingRooms: RoomsCall = {
      recipient: findRooms.recipient,
      creator: findRooms.creator,
    };
    const actionCall = await this.roomsService.cancelCall(settingRooms);
    const dataPayload = {
      roomCall: actionCall,
      userLeave: data.userLeave,
    };

    this.server.emit(`outCallVoice${actionCall.creator.email}`, dataPayload);
    return this.server.emit(
      `outCallVoice${actionCall.recipient.email}`,
      dataPayload,
    );
  }
  @SubscribeMessage('leave-callVideo')
  async onLeaveCallVideo(@MessageBody() data: any) {
    const findRooms = await this.roomsService.findById(data.idRooms);
    if (findRooms.call !== true || findRooms.call === null) {
      const dataError = { error: true };
      return this.server.emit(`outCallVideo${data.userLeave.email}`, dataError);
    }
    const settingRooms: RoomsCall = {
      recipient: findRooms.recipient,
      creator: findRooms.creator,
    };
    const actionCall = await this.roomsService.cancelCall(settingRooms);
    const dataPayload = {
      roomCall: actionCall,
      userLeave: data.userLeave,
    };

    this.server.emit(`outCallVideo${actionCall.creator.email}`, dataPayload);
    return this.server.emit(
      `outCallVideo${actionCall.recipient.email}`,
      dataPayload,
    );
  }
  @SubscribeMessage('userCallVideo')
  async onUserCallVideo(@MessageBody() data: any) {
    const findRooms = await this.roomsService.findById(data.idRooms);
    const userAlreadyOnline = await this.userOnlineModel.findOne({
      email: data.userReciveCall,
    });
    if (!userAlreadyOnline) {
      const dataError = { errorStatus: true };
      return this.server.emit(`userCallVideo${data.userCall.email}`, dataError);
    }
    const roomsExistsCall = await this.roomsModel.find({
      $or: [
        { 'recipient.email': data.userCall.email },
        { 'creator.email': data.userCall.email },
      ],
      call: true,
    });
    const existCalling = await this.usersModel.findOne({
      email: data.userCall.email,
    });
    if (roomsExistsCall.length > 0 || existCalling.calling === true) {
      const dataErrorCall = { errorCall: true };
      return this.server.emit(
        `userCallVideo${data.userCall.email}`,
        dataErrorCall,
      );
    }
    const roomsWithCall = await this.roomsModel.find({
      $or: [
        { 'recipient.email': data.userReciveCall },
        { 'creator.email': data.userReciveCall },
      ],
      call: true,
    });
    const existCallingRecieve = await this.usersModel.findOne({
      email: data.userReciveCall,
    });
    if (roomsWithCall.length > 0 || existCallingRecieve.calling === true) {
      const dataError = { error: true };
      return this.server.emit(`userCallVideo${data.userCall.email}`, dataError);
    }
    const settingRooms: RoomsCall = {
      recipient: findRooms.recipient, // Add the required 'id' property
      creator: findRooms.creator,
    };
    const actionCall = await this.roomsService.call(settingRooms);
    const dataPayload = {
      roomCall: actionCall,
      userCall: data.userCall,
    };
    this.server.emit(`userCallVideo${data.userCall.email}`, dataPayload);
    if (data.userCall.email === actionCall.creator.email) {
      this.server.emit(
        `userCallVideoRecipient${actionCall.recipient.email}`,
        dataPayload,
      );
    } else {
      this.server.emit(
        `userCallVideoRecipient${actionCall.creator.email}`,
        dataPayload,
      );
    }
  }
  @SubscribeMessage('cancelVideoCall')
  async onCancelCallVideo(@MessageBody() data: any) {
    const findRooms = await this.roomsService.findById(data.idRooms);
    if (findRooms.call !== true) {
      const dataError = { error: true };
      return this.server.emit(
        `userCancelVideoCall${data.userCancel.email}`,
        dataError,
      );
    }
    const settingRooms: RoomsCall = {
      recipient: findRooms.recipient,
      creator: findRooms.creator,
    };
    const actionCall = await this.roomsService.cancelCall(settingRooms);
    const dataPayload = {
      roomCall: actionCall,
      userCancel: data.userCancel,
    };
    this.server.emit(
      `userCancelVideoCall${dataPayload.userCancel.email}`,
      dataPayload,
    );
    return this.server.emit(
      `userCancelVideoCallRecipient${data.userReciveCall}`,
      dataPayload,
    );
  }
  @SubscribeMessage('rejectedVideoCall')
  async onRejectedCallVideo(@MessageBody() data: any) {
    const findRooms = await this.roomsService.findById(data.idRooms);
    if (findRooms.call !== true || findRooms.call === null) {
      const dataError = { error: true };
      return this.server.emit(
        `userRejectedCallVideo${data.userReject.email}`,
        dataError,
      );
    }
    const settingRooms: RoomsCall = {
      recipient: findRooms.recipient,
      creator: findRooms.creator,
    };
    const actionCall = await this.roomsService.rejectedCall(settingRooms);
    const dataPayload = {
      roomCall: actionCall,
      userReject: data.userReject,
    };
    this.server.emit(
      `userRejectedCallVideo${data.userReject.email}`,
      dataPayload,
    );
    if (data.userReject.email === actionCall.creator.email) {
      this.server.emit(
        `userRejectedCallVideoRecipient${actionCall.recipient.email}`,
        dataPayload,
      );
    } else {
      this.server.emit(
        `userRejectedCallVideoRecipient${actionCall.creator.email}`,
        dataPayload,
      );
    }
  }
  @SubscribeMessage('userAcceptCallVideo')
  async onAcceptCallVideo(@MessageBody() data: any) {
    const findRooms = await this.roomsService.findById(data.idRooms);
    if (findRooms.call !== true) {
      const dataError = { error: true };
      return this.server.emit(
        `userAttendCallVideo${data.userInCall.email}`,
        dataError,
      );
    }
    const dataPayload = {
      userInCall: data.userInCall,
      roomCall: findRooms,
      idRooms: data.idRooms,
    };
    this.server.emit(
      `userAttendCallVideo${data.userInCall.email}`,
      dataPayload,
    );
    if (data.userInCall.email === findRooms.creator.email) {
      this.server.emit(
        `userAttendCallVideoRecipient${findRooms.recipient.email}`,
        dataPayload,
      );
    } else {
      this.server.emit(
        `userAttendCallVideoRecipient${findRooms.creator.email}`,
        dataPayload,
      );
    }
  }
  @SubscribeMessage('userCallGroup')
  async onUserCallGroup(@MessageBody() data: any) {
    const findGroups = await this.groupsModel.findById(data.idGroups);
    const existInGroup = await this.groupsModel.findOne({
      _id: data.idGroups,
      attendCallGroup: { $elemMatch: { email: data.userCall.email } },
    });
    console.log(existInGroup);
    const userIsCalling = await this.usersModel.findOne({
      email: data.userCall.email,
    });
    if (userIsCalling.calling === true || userIsCalling.online !== true) {
      const dataErrorCall = { errorCallGroup: true }; // bạn đó có cuộc gọi khác trong group khác
      return this.server.emit(
        `userCallGroups${data.userCall.email}`,
        dataErrorCall,
      );
    }
    if (findGroups.attendCallGroup.length > 0) {
      const dataCalling = {
        callingGroup: true,
        group: findGroups,
        idGroups: data.idGroups,
      }; // bạn đó có cuộc gọi khác trong group khác
      return this.server.emit(
        `userCallGroups${data.userCall.email}`,
        dataCalling,
      );
    }
    if (existInGroup) {
      const dataErrorCall = { existCallGroup: true }; // bạn đó có cuộc gọi khác trong group khác
      return this.server.emit(
        `userCallGroups${data.userCall.email}`,
        dataErrorCall,
      );
    }
    if (findGroups.creator.email === data.userCall.email) {
      const resultOnline = await Promise.all(
        findGroups.participants.map(async (user) => {
          const userCanCall = await this.usersModel.findOne({
            email: user.email,
            online: true,
          });
          return userCanCall;
        }),
      );
      const onlineUsers = resultOnline.filter((users) => users !== null);
      /* console.log('.... creator:' + onlineUsers); */
      const resultNotCalling = await Promise.all(
        findGroups.participants.map(async (user) => {
          const userCanCall = await this.usersModel.findOne({
            email: user.email,
            online: true,
            calling: false,
          });
          return userCanCall;
        }),
      );
      const isBusyUsers = resultNotCalling.filter((users) => users !== null);
      /* console.log('.... creator:' + isBusyUsers); */
      if (onlineUsers.length <= 0 || isBusyUsers.length <= 0) {
        const dataError2 = { errorNotUserOnline: true };
        return this.server.emit(
          `userCallGroups${data.userCall.email}`,
          dataError2,
        );
      }
    }
    if (findGroups.creator.email !== data.userCall.email) {
      const resultOnline = await Promise.all(
        findGroups.participants
          .filter((participant) => participant.email !== data.userCall.email)
          .map(async (user) => {
            const userCanCall = await this.usersModel.findOne({
              email: user.email,
              online: true,
            });
            return userCanCall;
          }),
      );
      const onlineCreator = await this.usersModel.findOne({
        email: findGroups.creator.email,
        online: true,
      });
      const onlineUsers = resultOnline.filter((users) => users !== null);
      const resultNotCalling2 = await Promise.all(
        findGroups.participants
          .filter((participant) => participant.email !== data.userCall.email)
          .map(async (user) => {
            const userCanCall = await this.usersModel.findOne({
              email: user.email,
              online: true,
              calling: false,
            });
            return userCanCall;
          }),
      );
      const isBusyCreator = await this.usersModel.findOne({
        email: findGroups.creator.email,
        calling: false,
      });
      const isBusyUsers = resultNotCalling2.filter((users) => users !== null);
      /* console.log('.... recipient1:' + onlineUsers);
      console.log('.... recipient2:' + onlineCreator); */
      if (
        (onlineUsers.length <= 0 && !onlineCreator) ||
        (isBusyUsers.length <= 0 && !isBusyCreator)
      ) {
        const dataError2 = { errorNotUserOnline: true };
        return this.server.emit(
          `userCallGroups${data.userCall.email}`,
          dataError2,
        );
      }
    }
    const actionCall = await this.groupsService.callGroup(findGroups.id);
    const dataPayload = {
      groupCall: actionCall,
      userCall: data.userCall,
    };
    this.server.emit(`userCallGroups${data.userCall.email}`, dataPayload);
    if (data.userCall.email === actionCall.creator.email) {
      const participantPromises = actionCall.participants.map(
        async (participant) => {
          // Thực hiện các truy vấn cùng một lúc
          const [userAlreadyOnline, usersExistsCall, usersExistsCallGroups] =
            await Promise.all([
              this.usersModel.findOne({
                email: participant.email,
                online: true,
              }),
              this.roomsModel.find({
                $or: [
                  { 'recipient.email': participant.email },
                  { 'creator.email': participant.email },
                ],
                call: true,
              }),
              await this.groupsModel.find({
                $and: [
                  {
                    _id: { $ne: findGroups._id },
                  },
                  {
                    attendCallGroup: {
                      $elemMatch: { email: participant.email },
                    },
                  },
                ],
              }),
            ]);

          // Kiểm tra điều kiện
          if (
            userAlreadyOnline &&
            usersExistsCall.length <= 0 &&
            usersExistsCallGroups.length <= 0
          ) {
            // Phát ra sự kiện nếu điều kiện đúng
            this.server.emit(
              `userCallGroupsRecipient${participant.email}`,
              dataPayload,
            );
          }
        },
      );
      await Promise.all(participantPromises);
    } else {
      const alreadySend = await this.userAlreadyCallGroup(
        actionCall.creator.email,
        findGroups.id,
      );
      if (alreadySend === true) {
        this.server.emit(
          `userCallGroupsRecipient${actionCall.creator.email}`,
          dataPayload,
        );
      }
      const userReciveCallGroup = actionCall.participants
        .filter((participant) => participant.email !== data.userCall.email)
        .map(async (participant) => {
          const alreadySendParticipant = await this.userAlreadyCallGroup(
            participant.email,
            findGroups.id,
          );
          if (alreadySendParticipant === true) {
            this.server.emit(
              `userCallGroupsRecipient${participant.email}`,
              dataPayload,
            );
          }
        });
      await Promise.all(userReciveCallGroup);
    }
  }
  userAlreadyCallGroup = async (email: string, idGroups: string) => {
    const id = new mongoose.Types.ObjectId(idGroups);
    const [userAlreadyOnline, usersExistsCall, usersExistsCallGroups] =
      await Promise.all([
        this.usersModel.findOne({
          email: email,
          online: true,
        }),
        this.roomsModel.find({
          $or: [{ 'recipient.email': email }, { 'creator.email': email }],
          call: true,
        }),
        this.groupsModel.find({
          $and: [
            {
              _id: { $ne: id },
            },
            {
              attendCallGroup: {
                $elemMatch: { email: email },
              },
            },
          ],
        }),
      ]);

    // Kiểm tra điều kiện
    if (
      userAlreadyOnline &&
      usersExistsCall.length <= 0 &&
      usersExistsCallGroups.length <= 0
    ) {
      // Phát ra sự kiện nếu điều kiện đúng
      return true;
    }
    return false;
  };
  @SubscribeMessage('cancelCallGroup')
  async onCancelCallGroup(@MessageBody() data: any) {
    const findGroups = await this.groupsModel.findById(data.idGroups);
    const userIsCalling = await this.usersModel.findOne({
      email: data.userCancel.email,
    });
    if (findGroups.callGroup !== true && userIsCalling.calling !== true) {
      const dataError = { error: true };
      return this.server.emit(
        `userCancelCallGroups${data.userCancel.email}`,
        dataError,
      );
    }
    const actionCall = await this.groupsService.cancelCallGroup(findGroups.id);
    this.server.emit(
      `userCancelCallGroups${data.userCancel.email}`,
      actionCall,
    );
    findGroups.attendCallGroup
      .filter((participant) => participant.email !== data.userCancel.email)
      .map(async (participant) => {
        this.server.emit(
          `userCancelCallGroupsRecipient${participant.email}`,
          actionCall,
        );
      });
  }
  @SubscribeMessage('rejectedCallGroups')
  async onRejectCallGroup(@MessageBody() data: any) {
    const findGroups = await this.groupsModel.findById(data.idGroups);
    const userIsCalling = await this.usersModel.findOne({
      email: data.userReject.email,
    });
    const existCallGroup = await this.groupsModel.findById(data.idGroups, {
      attendCallGroup: {
        $elemMatch: { email: data.userReject.email },
      },
    });
    if (
      findGroups.callGroup !== true ||
      findGroups.callGroup === null ||
      userIsCalling.calling !== true ||
      !existCallGroup
    ) {
      const dataError = { error: true };
      return this.server.emit(
        `userRejectCallGroups${data.userReject.email}`,
        dataError,
      );
    }
    const actionCall = await this.groupsService.rejectedCallGroup(
      findGroups.id,
      userIsCalling.email,
    );
    const dataOuted = {
      groupUpdated: actionCall,
      userNotAttend: userIsCalling.fullName,
    };
    this.server.emit(`userRejectCallGroups${data.userReject.email}`, dataOuted);
    actionCall.attendCallGroup
      .filter((participant) => participant.email !== data.userReject.email)
      .map(async (participant) => {
        this.server.emit(
          `userRejectCallGroupsRecipient${participant.email}`,
          dataOuted,
        );
      });
    if (actionCall.attendCallGroup.length <= 1) {
      const dataError1 = { errorNullUser: true };
      await this.groupsService.cancelCallGroup(findGroups.id);
      return this.server.emit(
        `userRejectCallGroupsRecipient${actionCall.attendCallGroup[0].email}`,
        dataError1,
      );
    }
  }
  @SubscribeMessage('userAcceptCallGroup')
  async onAcceptCallGroup(@MessageBody() data: any) {
    const findGroups = await this.groupsModel.findById(data.idGroups);
    if (findGroups.callGroup !== true) {
      const dataError = { error: true };
      return this.server.emit(
        `userAttendCallGroup${data.userInCall.email}`,
        dataError,
      );
    }
    const intoCallGroup = await this.groupsService.acceptCallGroup(
      findGroups.id,
      data.userInCall.email,
      data.userInCall.fullName,
      data.userCall,
    );
    const dataPayload = {
      idGroups: data.idGroups,
      userInCall: data.userInCall,
      groupCall: intoCallGroup,
    };
    this.server.emit(
      `userAttendCallGroup${data.userInCall.email}`,
      dataPayload,
    );
    const groupExist = await this.groupsModel.findById(findGroups._id);
    const quantityUserAttend = groupExist.attendCallGroup.filter(
      (user) => user.acceptCall,
    ).length;
    if (quantityUserAttend === 2) {
      return this.server.emit(
        `userAttendCallGroupOwner${data.userCall}`,
        dataPayload,
      );
    }
  }
  @SubscribeMessage('leave-callGroup')
  async onLeaveCallGroup(@MessageBody() data: any) {
    const actionCall = await this.groupsService.rejectedCallGroup(
      data.idGroup,
      data.userLeave.email,
    );
    const dataPayload = {
      groupCall: actionCall,
      userLeave: data.userLeave,
    };
    this.server.emit(`outCallGroup${data.userLeave.email}`, dataPayload);
    if (actionCall.attendCallGroup.length === 1) {
      const notAttend = await this.groupsService.cancelCallGroup(data.idGroup);
      const dataPayload2 = {
        groupCall: notAttend,
        userLeave: data.userLeave,
      };
      return this.server.emit(
        `outCallGroupLastUser${actionCall.attendCallGroup[0].email}`,
        dataPayload2,
      );
    }
  }
  @SubscribeMessage('memberOutMeetGroup')
  async handleOutMeetGroup(
    @MessageBody() data: any,
    @ConnectedSocket() client: any,
  ) {
    console.log(data.idGroup);
    client.handshake.auth = {
      group: data.idGroup,
      userLeave: data.user.email,
    };
  }
  @SubscribeMessage('preJoinMemberHomeGroup')
  async handleJoinMemberMeetGroup(
    @MessageBody() data: any,
    @ConnectedSocket() client: any,
  ) {
    const findUser = await this.usersModel.findOne({ email: data.userLeave });
    const userOnlineRecipient = await this.groupsService.memberReturnHome(
      findUser.email,
    );
    this.server.emit(
      `memberOnlineMeetOut${userOnlineRecipient.email}`,
      findUser,
    );
    const findOnline: ListRooms[] = await this.roomsModel.find({
      $or: [
        { 'recipient.email': data.userLeave },
        { 'creator.email': data.userLeave },
      ],
    });
    client.handshake.auth = {};
    findUser.friends.forEach(async (friend) => {
      return this.server.emit(
        `memberOnlineAfterMeetGroup${friend.email}`,
        userOnlineRecipient,
      );
    });
    findOnline.forEach(async (room) => {
      return this.server.emit(`userOnlineAfterMeetGroup${room.id}`, findOnline);
    });
  }
  @SubscribeMessage('userCanAttendCallGroups')
  async handleAttendMeetGroup(@MessageBody() data: any) {
    const findGroups = await this.groupsModel.findById(data.idGroups);
    if (findGroups.callGroup !== true) {
      const dataError = { error: true };
      return this.server.emit(
        `userAttendCallGroups${data.user.email}`,
        dataError,
      );
    }
    const dataPush = {
      email: data.user.email,
      fullName: data.user.fullName,
      acceptCall: true,
    };
    await this.usersModel.findOneAndUpdate(
      { email: data.user.email },
      { calling: true },
    );
    const addCallGroup = await this.groupsModel.findByIdAndUpdate(
      data.idGroups,
      { $push: { attendCallGroup: dataPush } },
      { new: true },
    );
    return this.server.emit(
      `userAttendCallGroups${data.user.email}`,
      addCallGroup,
    );
  }
}
