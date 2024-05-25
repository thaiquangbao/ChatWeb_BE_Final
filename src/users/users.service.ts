import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IUserService } from './users';
import {
  CreateRoomsParams,
  CreateUserDetails,
  FindUserByEmail,
  ValidateUser,
} from '../untills/types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../entities/users';
import { hashPassword } from '../untills/helpers';
import {
  CheckUsers,
  CreateUsers,
  UsersPromise,
  ValidAccount,
} from '../auth/dtos/Users.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { Messages } from '../entities/Message';
import { Rooms } from '../entities/Rooms';

@Injectable()
export class UsersService implements IUserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private mailService: MailerService,
    private jwtService: JwtService,
    @InjectModel(Messages.name) private messagesEntity: Model<Messages>,
    @InjectModel(Rooms.name) private roomsEntity: Model<Rooms>,
  ) { }
  async findOneUsers(email: ValidateUser): Promise<CreateUsers> {
    const users = await this.userModel.findOne({ email: email.email });
    return users;
  }
  async deleteAccount(id: string) {
    const userExist = await this.userModel.findById(id);
    if (!userExist) {
      throw new HttpException('Undefined', HttpStatus.NOT_FOUND);
    }
    const deleteUser = await this.userModel.deleteOne({
      email: userExist.email,
    });
    if (!deleteUser) {
      throw new HttpException(
        'Xóa phòng không thành công',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const roomsUser = await this.roomsEntity.find({
      $or: [
        { 'creator.email': userExist.email },
        { 'recipient.email': userExist.email },
      ],
    });
    const messagesUser = await this.messagesEntity.find({
      where: { 'author.email': userExist.email },
    });
    if (roomsUser) {
      await this.roomsEntity.deleteMany({ 'recipient.email': userExist.email });
      // Cập nhật các phòng mà user là creator
      await this.roomsEntity.deleteMany({ 'creator.email': userExist.email });
    }
    if (messagesUser) {
      await this.messagesEntity.deleteMany({ 'author.email': userExist.email });
    }
    if (deleteUser.deletedCount > 0) {
      return true;
    } else {
      return false;
    }
  }
  findUsersByEmail(roomsParams: CreateRoomsParams): Promise<UsersPromise> {
    return this.userModel.findOne(roomsParams);
  }
  private generatedCode: string = '';
  findUsers(informationUser: FindUserByEmail): Promise<User> {
    return this.userModel.findOne(informationUser);
  }
  async takeAccount(account: ValidateUser) {
    const existUser = await this.userModel.findOne({ email: account.email });
    if (!existUser) {
      throw new HttpException('User không tồn tại', HttpStatus.NOT_FOUND);
    }
    this.generatedCode = this.generateRandomString(6);
    const newPassword = await hashPassword(this.generatedCode);
    const updatedPassUser = await this.userModel.updateOne(
      {
        email: existUser.email,
      },
      { passWord: newPassword },
    );
    if (!updatedPassUser) {
      throw new HttpException(
        'Update password không thành công',
        HttpStatus.CONFLICT,
      );
    }
    const send = await this.mailService.sendMail({
      to: account.email,
      from: 'haisancomnieuphanthiet@gmail.com',
      subject: 'Welcome to ZEN CHAT',
      html: `<b>ZEN CHAT: Mật khẩu mới của bạn là: ${this.generatedCode}</b>`,
      context: {
        name: '',
      },
    });
    if (send) {
      return true;
    } else {
      return false;
    }
  }
  private generateRandomString(length: number): string {
    const characters = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
    return result;
  }
  async createUser(userDetail: CreateUserDetails) {
    const existingUser = await this.userModel.findOne({
      email: userDetail.email,
    });
    const existingPhone = await this.userModel.findOne({
      phoneNumber: userDetail.phoneNumber,
    });
    if (existingUser) {
      throw new HttpException('Email nãy đã được sử dụng', HttpStatus.CONFLICT);
    }
    if (existingPhone) {
      throw new HttpException(
        'PhoneNumber is already in use',
        HttpStatus.CONFLICT,
      );
    }
    const token = this.jwtService.sign({ id: '98324986328' });
    return { token, userDetail };
  }
  async findUser(findUserParams: CheckUsers): Promise<User> {
    const result = await this.userModel.findOne(findUserParams);
    return result;
  }
  async sendMail(authDTO: CreateUserDetails): Promise<boolean> {
    this.generatedCode = this.generateRandomString(6);
    const send = await this.mailService.sendMail({
      to: authDTO.email,
      from: 'haisancomnieuphanthiet@gmail.com',
      subject: 'Welcome to ZEN CHAT',
      html: `<b>ZEN CHAT: Mã xác nhận của bạn là ${this.generatedCode}</b>`,
      context: {
        name: authDTO.fullName,
      },
    });
    if (send) {
      return true;
    } else {
      return false;
    }
  }
  async validVertical(validCode: ValidAccount) {
    //const userId = this.userEntity.findOne({ email: user.email });
    if (validCode.code !== this.generatedCode) {
      throw new HttpException('Mã không đúng', HttpStatus.CONFLICT);
    }
    const password = await hashPassword(validCode.passWord);
    const result = await this.userModel.create({
      fullName: validCode.fullName,
      phoneNumber: validCode.phoneNumber,
      email: validCode.email,
      passWord: password,
      dateOfBirth: validCode.dateOfBirth,
      avatar: validCode.avatar,
      background: validCode.background,
      gender: validCode.gender,
    });
    console.log('UserService.createUser');
    return result.save();
  }
}
