import { Rooms } from '../../entities/Rooms';
import { User } from '../../entities/users';

export class SendFriendDto {
  userActions: User;
  userSend: User;
  userAccept: User;
}
export class IdWantMakeFriend {
  id: string;
}
export class AcceptFriendDto {
  emailUserActions: string;
  userSend: User;
  userAccept: User;
  roomsUpdateMessage: Rooms;
}
export class DeleteFriendDto {
  emailUserActions: string;
  userActions: User;
  userAccept: User;
  roomsUpdate?: string;
  reload?: boolean;
}
export class IdWantUndo {
  id: string;
  idRooms: string;
}
