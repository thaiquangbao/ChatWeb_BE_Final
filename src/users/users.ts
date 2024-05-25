import {
  CreateUsers,
  UsersPromise,
  ValidAccount,
} from '../auth/dtos/Users.dto';
import { User } from '../entities/users';
import {
  CreateRoomsParams,
  CreateUserDetails,
  FindUserByEmail,
  ValidateUser,
} from '../untills/types';

export interface IUserService {
  createUser(userDetail: CreateUserDetails);
  findUsers(informationUser: FindUserByEmail): Promise<User>;
  sendMail(authDTO: CreateUserDetails);
  validVertical(validCode: ValidAccount);
  findUsersByEmail(roomsParams: CreateRoomsParams): Promise<UsersPromise>;
  takeAccount(account: ValidateUser);
  deleteAccount(id: string);
  findOneUsers(email: ValidateUser): Promise<CreateUsers>;
}
