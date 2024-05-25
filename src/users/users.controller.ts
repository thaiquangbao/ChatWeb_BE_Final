import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Routes } from '../untills/constain';
import { Services } from '../untills/constain';
import { IUserService } from './users';
import { ValidateUser } from '../untills/types';

@Controller(Routes.USERS)
export class UsersController {
  constructor(@Inject(Services.USERS) private userService: IUserService) { }
  @Post('forgotAccount')
  async forgotPassword(@Body() emailUser: ValidateUser, @Res() res: Response) {
    try {
      const takeUser = await this.userService.takeAccount(emailUser);
      return res.send(takeUser).status(200);
    } catch (error) {
      return res.send(error);
    }
  }
  @Delete('deleteUser/:id')
  async deleteUser(@Param('id') id: string, @Res() res: Response) {
    try {
      const updatePassword = await this.userService.deleteAccount(id);
      res.clearCookie('Session_JS');
      return res.send(updatePassword).status(200);
    } catch (error) {
      return res.send(error);
    }
  }
  @Get('removeCookie')
  async removeCookie(@Req() req: Request, @Res() res: Response) {
    const cookieExist = req.cookies.Session_JS;
    if (cookieExist) {
      res.clearCookie('Session_JS');
      res.send(HttpStatus.OK);
    } else {
      res.send(HttpStatus.ACCEPTED);
    }
  }
  @Get('removeToken')
  async removeToken(@Req() req: Request, @Res() res: Response) {
    const cookieExist = req.cookies.token;
    if (cookieExist) {
      res.clearCookie('token');
      res.send(HttpStatus.OK);
    } else {
      res.send(HttpStatus.ACCEPTED);
    }
  }
  @Get('getToken')
  async getToken(@Req() req: Request, @Res() res: Response) {
    const cookieExist = req.cookies.token;
    if (cookieExist) {
      res.send(HttpStatus.OK);
    } else {
      res.send(HttpStatus.BAD_GATEWAY);
    }
  }
}
