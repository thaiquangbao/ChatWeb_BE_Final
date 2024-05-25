import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { Services } from '../untills/constain';
import { MongooseModule } from '@nestjs/mongoose';
import { Rooms, RoomsSchema } from '../entities/Rooms';
import { User, UsersSchema } from '../entities/users';
import { RoomModule } from '../room/room.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rooms.name, schema: RoomsSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UsersSchema }]),
    RoomModule,
  ],
  controllers: [FriendsController],
  providers: [
    {
      provide: Services.FRIENDS,
      useClass: FriendsService,
    },
  ],
  exports: [
    {
      provide: Services.FRIENDS,
      useClass: FriendsService,
    },
  ],
})
export class FriendsModule { }
