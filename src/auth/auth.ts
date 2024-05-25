import { User } from 'src/entities/users';
import {
  findAuth,
  UpdateImageAvatar,
  UpdateImageBg,
  UpdatePassWord,
  UpdateUserDetails,
  ValidateUserDetails,
} from '../untills/types';

export interface IAuthService {
  validateUser(createUserDetail: ValidateUserDetails): Promise<User | null>;
  findAuthenticate(findAuthenticate: findAuth): Promise<User | null>;
  updateValidUser(id: string, updateUser: UpdateUserDetails): Promise<User>;
  updateImagesUserAVT(
    fileAvatar?: Express.Multer.File,
  ): Promise<UpdateImageAvatar>;
  updateImagesUserBg(
    fileBackground?: Express.Multer.File,
  ): Promise<UpdateImageBg>;
  updatePassWord(id: string, updatePassword: UpdatePassWord): Promise<boolean>;
}
