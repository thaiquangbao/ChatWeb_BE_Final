import { CreateRoomsParams, ListRooms } from '../untills/types';
import { UsersPromise } from '../auth/dtos/Users.dto';
import { Rooms } from '../entities/Rooms';
import { RoomsCall, RoomsPromise } from './dto/RoomDTO.dto';
import { User } from '../entities/users';
// import { RoomsPromise } from './dto/RoomDTO.dto';

export interface IRoomsService {
  createRooms(
    user: UsersPromise,
    roomsParams: CreateRoomsParams,
  ): Promise<Rooms>;
  getRooms(id: string): Promise<Rooms[]>;
  findById(id: string): Promise<Rooms | undefined>;
  // hasAccess(params: AccessParams): Promise<boolean>;
  isCreated(userId: string, recipientId: string): Promise<Rooms | undefined>;
  deleteRooms(roomsId: string);
  online(user: UsersPromise): Promise<ListRooms[]>;
  offline(email: string): Promise<ListRooms[]>;
  call(room: RoomsCall): Promise<RoomsPromise>;
  rejectedCall(room: RoomsCall): Promise<RoomsPromise>;
  cancelCall(room: RoomsCall): Promise<Rooms>;
  onlineReturnHome(user: User): Promise<ListRooms[]>;
  // save(rooms: RoomsPromise): Promise<RoomsPromise>;
  // getMessages(params: GetConversationMessagesParams): Promise<RoomsPromise>;
  //update(params: UpdateConversationParams);
}
