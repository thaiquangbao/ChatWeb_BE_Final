import { Module } from '@nestjs/common';
import { GroupRoomsController } from './group-rooms.controller';
import { GroupRoomsService } from './group-rooms.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UsersSchema } from '../entities/users';
import { Messages, MessagesSchema } from '../entities/Message';
import { GroupRooms, GroupRoomsSchema } from '../entities/Groups';
import { Services } from '../untills/constain';
import { UsersModule } from '../users/users.module';
import { Rooms, RoomsSchema } from '../entities/Rooms';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GroupRooms.name, schema: GroupRoomsSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UsersSchema }]),
    MongooseModule.forFeature([
      { name: Messages.name, schema: MessagesSchema },
    ]),
    UsersModule,
    MongooseModule.forFeature([{ name: Rooms.name, schema: RoomsSchema }]),
  ],
  controllers: [GroupRoomsController],
  providers: [
    {
      provide: Services.GROUPS,
      useClass: GroupRoomsService,
    },
  ],
  exports: [
    {
      provide: Services.GROUPS,
      useClass: GroupRoomsService,
    },
  ],
})
export class GroupRoomsModule { }
