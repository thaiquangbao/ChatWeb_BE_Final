import { Module } from '@nestjs/common';
import { MessagingGateway } from './websocket.gateway';
import { RoomModule } from '../room/room.module';
import { MessagesModule } from '../messages/messages.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Messages, MessagesSchema } from '../entities/Message';
import { User, UsersSchema } from '../entities/users';
import { MessagesGroup, MessagesGroupSchema } from '../entities/MessagesGroup';
import { Rooms, RoomsSchema } from '../entities/Rooms';
import { UserOnline, UserOnlineSchema } from '../entities/UserOnline';
import { GroupRooms, GroupRoomsSchema } from '../entities/Groups';
import { GroupRoomsModule } from '../group-rooms/group-rooms.module';

@Module({
  imports: [
    RoomModule,
    MessagesModule,
    GroupRoomsModule,
    MongooseModule.forFeature([{ name: User.name, schema: UsersSchema }]),
    MongooseModule.forFeature([
      { name: UserOnline.name, schema: UserOnlineSchema },
    ]),
    MongooseModule.forFeature([
      { name: Messages.name, schema: MessagesSchema },
    ]),
    MongooseModule.forFeature([
      { name: MessagesGroup.name, schema: MessagesGroupSchema },
    ]),
    MongooseModule.forFeature([{ name: Rooms.name, schema: RoomsSchema }]),
    MongooseModule.forFeature([
      { name: GroupRooms.name, schema: GroupRoomsSchema },
    ]),
  ],
  providers: [
    MessagingGateway,
    // {
    //   provide: Services.GATEWAY_SESSION_MANAGER,
    //   useClass: GateWaySessionManager,
    // },
    // MessagesService,
  ],
})
export class GatewayModule { }
