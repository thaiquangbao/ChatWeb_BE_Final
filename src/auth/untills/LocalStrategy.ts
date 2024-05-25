import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Services } from 'src/untills/constain';
import { IAuthService } from '../auth';
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(Services.AUTH) private readonly authServices: IAuthService,
  ) {
    super({ usernameFiled: 'email' });
  }
  async validate(email: string, passWord: string) {
    const result = await this.authServices.validateUser({ email, passWord });
    return result;
  }
}
