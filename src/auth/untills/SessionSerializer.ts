/* eslint-disable @typescript-eslint/ban-types */
import { Inject, Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { Services } from '../../untills/constain';
import { IUserService } from '../../users/users';
import { CheckUsers } from '../dtos/Users.dto';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(
    @Inject(Services.USERS)
    private readonly userService: IUserService,
  ) {
    super();
  }
  // đăng nhập thành công và thông tin người dùng cần được lưu trữ trong session
  serializeUser(user: CheckUsers, done: Function) {
    done(null, user);
  }
  // Gửi den961 server về thông tin người dùng vừa nhập lưu trữ trong session và dùng thông tin đó để check trong database
  async deserializeUser(user: CheckUsers, done: Function) {
    const userDb = await this.userService.findUsers({ email: user.email });
    return userDb ? done(null, userDb) : done(null, null);
  }
}
