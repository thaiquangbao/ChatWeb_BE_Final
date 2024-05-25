import { UsersPromise } from '../auth/dtos/Users.dto';
import { GroupRooms } from '../entities/Groups';
import {
  CreateGroupParams,
  Franchiser,
  KickGroups,
  UpdateGroups,
} from '../untills/types';
import { CallGroups } from './dtos/group.dto';

export interface IGroups {
  createGroups(
    userCreate: UsersPromise,
    createGroupParams: CreateGroupParams,
  ): Promise<GroupRooms>;
  getGroups(userCreate: UsersPromise): Promise<GroupRooms[]>;
  getGroupsById(id: string): Promise<GroupRooms>;
  deleteGroups(user: UsersPromise, idRooms: string);
  leaveGroups(user: UsersPromise, idRooms: string);
  inviteToGroups(user: UsersPromise, idRooms: string, participants: string[]);
  updateGroups(
    user: UsersPromise,
    updateGroups: UpdateGroups,
  ): Promise<GroupRooms>;
  kickGroups(userAction: UsersPromise, kickGroups: KickGroups);
  franchiseLeader(userAction: UsersPromise, franchiser: Franchiser);
  callGroup(id: string): Promise<CallGroups>;
  cancelCallGroup(id: string): Promise<CallGroups>;
  rejectedCallGroup(id: string, userOut: string): Promise<CallGroups>;
  acceptCallGroup(
    id: string,
    userAccept: string,
    nameAccept: string,
    userCall: string,
  ): Promise<CallGroups>;
  memberReturnHome(email: string): Promise<UsersPromise>;
  rejectRequestGroup(userReject: string): Promise<CallGroups>;
}
