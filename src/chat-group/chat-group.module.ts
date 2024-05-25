import { Module } from '@nestjs/common';
import { ChatGroupController } from './chat-group.controller';
import { ChatGroupService } from './chat-group.service';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupRooms, GroupRoomsSchema } from '../entities/Groups';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Services } from '../untills/constain';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CloudinaryProvider } from '../cloudinary/cloudinary.provider';
import { MessagesGroup, MessagesGroupSchema } from '../entities/MessagesGroup';
import { Messages, MessagesSchema } from '../entities/Message';
import { Rooms, RoomsSchema } from '../entities/Rooms';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GroupRooms.name, schema: GroupRoomsSchema },
    ]),
    MongooseModule.forFeature([
      { name: MessagesGroup.name, schema: MessagesGroupSchema },
    ]),
    MongooseModule.forFeature([
      { name: Messages.name, schema: MessagesSchema },
    ]),
    MongooseModule.forFeature([{ name: Rooms.name, schema: RoomsSchema }]),
    CloudinaryModule,
  ],
  controllers: [ChatGroupController],
  providers: [
    {
      provide: Services.CHATGROUPS,
      useClass: ChatGroupService,
    },
    CloudinaryService,
    CloudinaryProvider,
  ],
  exports: [
    {
      provide: Services.CHATGROUPS,
      useClass: ChatGroupService,
    },
  ],
})
export class ChatGroupModule { }
