import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IAuthService } from './auth';
import {
  findAuth,
  UpdateImageAvatar,
  UpdateImageBg,
  UpdatePassWord,
  UpdateUserDetails,
  ValidateUserDetails,
} from 'src/untills/types';
import { IUserService } from '../users/users';
import { Services } from '../untills/constain';
import { compareHas, hashPassword } from '../untills/helpers';
import mongoose, { Model } from 'mongoose';
import { User } from '../entities/users';
import { InjectModel } from '@nestjs/mongoose';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Messages } from '../entities/Message';
import { Rooms } from '../entities/Rooms';
@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(Services.USERS) private readonly userService: IUserService,
    @InjectModel(User.name) private userEntity: Model<User>,
    @InjectModel(Messages.name) private messagesEntity: Model<Messages>,
    @InjectModel(Rooms.name) private roomsEntity: Model<Rooms>,
    private cloudinaryService: CloudinaryService,
  ) { }
  async updatePassWord(
    id: string,
    updatePassword: UpdatePassWord,
  ): Promise<boolean> {
    const { passWord, oldPassWord } = updatePassword;
    const userUpdate = await this.userEntity.findById(id);
    if (!userUpdate) {
      throw new HttpException('Undefined', HttpStatus.NOT_FOUND);
    }
    const isPasswordValid = await compareHas(oldPassWord, userUpdate.passWord);
    if (!isPasswordValid) {
      throw new HttpException(
        'PassWord is not defined',
        HttpStatus.BAD_REQUEST,
      );
    }
    const newPassWord = await hashPassword(passWord);
    const objectIdRoomId = new mongoose.Types.ObjectId(id);
    const updateUserPassword = await this.userEntity.updateOne(
      { _id: objectIdRoomId },
      { passWord: newPassWord },
    );
    if (updateUserPassword) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }
  async updateImagesUserBg(
    fileBackground?: Express.Multer.File,
  ): Promise<UpdateImageBg> {
    let uploadFileBackground: any;
    if (fileBackground) {
      uploadFileBackground = await this.cloudinaryService.uploadFileFromBuffer(
        fileBackground.buffer,
      );
      if (!uploadFileBackground) {
        throw new HttpException(
          'Lưu background không thành công',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    return uploadFileBackground.url;
  }
  async updateImagesUserAVT(
    fileAvatar?: Express.Multer.File,
  ): Promise<UpdateImageAvatar> {
    // Upload và cập nhật avatar mới nếu được cung cấp
    let uploadFileAvatar: any;
    if (fileAvatar) {
      uploadFileAvatar = await this.cloudinaryService.uploadFileFromBuffer(
        fileAvatar.buffer,
      );
      if (!uploadFileAvatar) {
        throw new HttpException(
          'Lưu ảnh không thành công',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    // Upload và cập nhật background mới nếu được cung cấp

    return uploadFileAvatar.url;
  }
  async updateValidUser(
    id: string,
    updateUser: UpdateUserDetails,
  ): Promise<User> {
    const { fullName, dateOfBirth, gender, avatar, background, avtUrl, bgUrl } =
      updateUser;
    const validUser = await this.userEntity.findById(id);
    if (!validUser) {
      throw new HttpException('Undefined', HttpStatus.NOT_FOUND);
    }
    if (
      validUser.avatar !==
      'https://th.bing.com/th/id/OIP.dOTjvq_EwW-gR9sO5voajQHaHa?rs=1&pid=ImgDetMain' &&
      validUser.avatar &&
      avtUrl
    ) {
      //console.log('rơi vào đây 1');
      // Xóa ảnh cũ trên Cloudinary nếu có
      const parts = validUser.avatar.split('/');
      const desired_part = parts.slice(-2).join('/');
      const desired = desired_part.split('.').slice(0, -1).join('.');
      await this.cloudinaryService.deleteImage(desired);
    }
    if (
      validUser.background !==
      'https://th.bing.com/th/id/OIP.dOTjvq_EwW-gR9sO5voajQHaHa?rs=1&pid=ImgDetMain' &&
      validUser.background &&
      bgUrl
    ) {
      // console.log('rơi vào đây 2');
      // Xóa ảnh nền cũ trên Cloudinary nếu có
      const parts = validUser.background.split('/');
      const desired_part = parts.slice(-2).join('/');
      const desired = desired_part.split('.').slice(0, -1).join('.');
      await this.cloudinaryService.deleteImage(desired);
    }
    // Cập nhật dữ liệu, chỉ thêm các trường mới nếu chúng tồn tại
    const dataUpdate: any = { fullName, dateOfBirth, gender };
    if (!avtUrl) {
      dataUpdate.avatar = avatar;
    } else {
      dataUpdate.avatar = avtUrl;
    }
    if (!bgUrl) {
      dataUpdate.background = background;
    } else {
      dataUpdate.background = bgUrl;
    }
    const updatedData = await this.userEntity.findByIdAndUpdate(
      id,
      dataUpdate,
      { new: true },
    );
    const roomsUser = await this.roomsEntity.find({
      $or: [{ 'creator._id': id }, { 'recipient._id': id }],
    });
    const messagesUser = await this.messagesEntity.find({
      where: { 'author._id': id },
    });
    if (roomsUser) {
      //console.log('rơi vào đây 3');
      await this.roomsEntity.updateMany(
        { 'recipient._id': id },
        { $set: { recipient: updatedData } },
      );
      // Cập nhật các phòng mà user là creator
      await this.roomsEntity.updateMany(
        { 'creator._id': id },
        { $set: { creator: updatedData } },
      );
    }
    if (messagesUser) {
      // console.log('rơi vào đây 4');
      await this.messagesEntity.updateMany(
        { 'author._id': id },
        { $set: { author: updatedData } },
      );
    }
    return updatedData;
  }
  async findAuthenticate(findAuthenticate: findAuth): Promise<User> {
    const { email, phoneNumber } = findAuthenticate;
    if (!email) {
      const findByPhoneNumber = await this.userEntity.findOne({
        phoneNumber: phoneNumber,
      });
      return findByPhoneNumber;
    } else if (!phoneNumber) {
      const findByEmail = await this.userEntity.findOne({ email: email });
      return findByEmail;
    } else {
      throw new HttpException('Undefine', HttpStatus.BAD_REQUEST);
    }
  }
  async validateUser(userDetails: ValidateUserDetails) {
    const user = await this.userService.findUsers({ email: userDetails.email });
    if (!user)
      throw new HttpException('Invalid Credentials', HttpStatus.UNAUTHORIZED);
    const isPasswordValid = await compareHas(
      userDetails.passWord,
      user.passWord,
    );
    return isPasswordValid ? user : null;
  }
}
