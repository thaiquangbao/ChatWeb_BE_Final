import { IsNotEmpty, IsString } from 'class-validator';
import { UsersPromise } from '../../auth/dtos/Users.dto';
import { Rooms } from '../../entities/Rooms';
import { Messages } from '../../entities/Message';

export class MessagesDTO {
  content: string;
  author: UsersPromise;
}
export class CreateMessagesDTO {
  @IsNotEmpty()
  @IsString()
  content: string;
  @IsNotEmpty()
  @IsString()
  roomsID: string;
}
export class RoomMessages {
  roomsId: string;
}
export class RoomAfterDeleteMessages {
  rooms: Rooms;
  isSuccess: boolean;
}
export class MessagesUpdate {
  id: string;
  messages: Messages;
}
export class MessagesRoomsUpdate {
  idMessages: string;
  messagesUpdate: Messages;
  roomsUpdate: Rooms;
}
export class ForwardMessagesDTO {
  idRooms?: string[];
  idGroups?: string[];
}
