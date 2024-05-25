import { UsersPromise } from '../auth/dtos/Users.dto';
import { Messages } from '../entities/Message';
import { Rooms } from '../entities/Rooms';
import { Request } from 'express';
import { GroupRooms } from '../entities/Groups';
import { MessagesGroup } from '../entities/MessagesGroup';
import { User } from '../entities/users';
export type CreateUserDetails = {
  fullName: string;
  phoneNumber: string;
  email: string;
  passWord: string;
  dateOfBirth: string;
  avatar: string;
  gender: string;
  background: string;
};
export type ValidateUserDetails = {
  email: string;
  passWord: string;
};
export type FindUserByEmail = Partial<{
  id: string;
  email: string;
}>;
export type ValidateUser = {
  email: string;
};
export type ValidCode = {
  fullName: string;
  phoneNumber: string;
  email: string;
  passWord: string;
  dateOfBirth: string;
  avatar: string;
  code: string;
};
export type ListRooms = {
  id: string;
  recipient: User;
  creator: User;
  messages: Messages[];
  lastMessageSent: Messages;
  friend: boolean;
};
export type CreateRoomsParams = {
  email: string;
  message: string;
};
export type AccessParams = {
  id: string;
  userId: string;
};
export type GetConversationMessagesParams = {
  id: string;
  limit: number;
};
export interface AuthenticatedRequest extends Request {
  user: UsersPromise;
}
export type RoomsIdentityType = 'authors' | 'recipient';
export type CreateMessageParams = {
  //id: string;
  content: string;
  roomsID: string;
  user: UsersPromise;
};
export type CreateMessageResponse = {
  message: Messages;
  rooms: Rooms;
};
export type findAuth = {
  email?: string;
  phoneNumber?: string;
};
export type DeleteMessages = {
  idMessages: string;
  idLastMessageSent: string;
  email: string;
};
export type UpdateMessages = {
  newMessages: string;
  idMessages: string;
  idLastMessageSent: string;
  email: string;
};
export type UpdateGroupsMessages = {
  idMessages: string;
  idLastMessageSent: string;
  email: string;
};
export type UpdateEmoji = {
  newEmoji: string;
  idMessages: string;
  idLastMessageSent: string;
  email: string;
};
export type UpdateUserDetails = {
  fullName: string;
  dateOfBirth: string;
  avatar: string;
  gender: string;
  background: string;
  avtUrl?: string;
  bgUrl?: string;
};
export type UpdatePassWord = {
  passWord: string;
  oldPassWord: string;
};
export type UpdateImageAvatar = {
  avtUrl: string;
};
export type UpdateImageBg = {
  bgUrl: string;
};
export type DeleteUser = {
  email: string;
};
export type SendFriendInvitations = {
  id: string;
};
export type FindRooms = {
  idRooms: string;
};
export interface AnswerMessagesGroups {
  content: string;
  idMessages: string;
}
export type CreateGroupParams = {
  participants: string[];
  nameGroups?: string;
  avtGroups?: string;
};
export type FetchGroupParams = {
  idGroups: string;
};
export type CreateMessageGroupParams = {
  //id: string;
  content: string;
  groupsID: string;
  user: UsersPromise;
};
export type CreateMessageRoomsResponse = {
  message: MessagesGroup;
  groups: GroupRooms;
};
export type AttendGroupParams = {
  participants: string[];
};
export type UpdateGroups = {
  idGroups: string;
  nameGroups?: string;
  avtGroups?: string;
};
export type KickGroups = {
  idGroups: string;
  idUserKick: string;
};
export type Franchiser = {
  idGroups: string;
  idUserFranchise: string;
};
export interface AnswerMessagesSingle {
  content: string;
  idMessages: string;
}
export interface UserAttends {
  email: string;
  fullName: string;
  acceptCall: boolean;
}
export type GroupOne = {
  id: string;
  participants: User[];
  creator: User;
  callGroup: boolean;
  attendCallGroup: UserAttends[];
};
export type UserReject = {
  idGroups: string;
  userOut: string;
};
export type ForwardMessages = {
  idRooms?: string[];
  idGroups?: string[];
};
