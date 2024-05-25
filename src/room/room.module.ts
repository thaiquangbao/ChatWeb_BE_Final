import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { Services } from '../untills/constain';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Rooms, RoomsSchema } from '../entities/Rooms';
import { User, UsersSchema } from '../entities/users';
import { Messages, MessagesSchema } from '../entities/Message';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: Rooms.name, schema: RoomsSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UsersSchema }]),
    MongooseModule.forFeature([
      { name: Messages.name, schema: MessagesSchema },
    ]),
  ],
  controllers: [RoomController],
  providers: [
    {
      provide: Services.ROOMS,
      useClass: RoomService,
    },
  ],
  exports: [
    {
      provide: Services.ROOMS,
      useClass: RoomService,
    },
  ],
})
export class RoomModule { }
