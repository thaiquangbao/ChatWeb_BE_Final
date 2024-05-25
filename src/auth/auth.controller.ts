import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Routes, Services } from '../untills/constain';
import { IAuthService } from './auth';
import {
  CreateUsers,
  findAuthenticated,
  UpdateUser,
  UsersPromise,
  ValidAccount,
} from './dtos/Users.dto';
import { IUserService } from '../users/users';
import { AuthenticatedGuard, LocalAuthGuard } from './untills/Guards';
import { Response, Request } from 'express';
import {
  AuthenticatedRequest,
  CreateUserDetails,
  UpdatePassWord,
} from 'src/untills/types';
import { AuthUser } from 'src/untills/decorater';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventEmitter2 } from '@nestjs/event-emitter';
@Controller(Routes.AUTH)
export class AuthController {
  constructor(
    @Inject(Services.AUTH) private authService: IAuthService,
    @Inject(Services.USERS) private userService: IUserService,
    private readonly events: EventEmitter2,
  ) { }
  @Post('register')
  async register(@Body() authDTO: CreateUsers, @Res() res: Response) {
    const result = await this.userService.createUser(authDTO);
    try {
      res.cookie('token', result.token, { httpOnly: true });
      res.status(HttpStatus.OK).send(result);
    } catch (error) {
      res.status(error);
    }
  }
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Res() res: Response) {
    return res.send(HttpStatus.OK);
  }
  @Get('status')
  @UseGuards(AuthenticatedGuard)
  async status(@Req() req: Request, @Res() res: Response) {
    const cookie = req.cookies.Session_JS;
    const auth = req.user;
    const respondData = {
      cookie,
      auth,
    };
    this.events.emit('online.user', respondData);
    res.send(respondData);
  }
  @Get('checkCookie')
  async check(@Req() req: Request, @Res() res: Response) {
    const cookieExist = req.cookies.Session_JS;
    if (!cookieExist) {
      res.send(HttpStatus.OK);
    } else {
      res.send(HttpStatus.BAD_GATEWAY);
    }
  }
  @Post('statusValid')
  async validCode(@Body() validCode: ValidAccount, @Res() res: Response) {
    try {
      const result = await this.userService.validVertical(validCode);
      res.status(HttpStatus.OK).clearCookie('token').send(result);
    } catch (error) {
      res.status(HttpStatus.CONFLICT).send({ message: 'Mã không đúng' });
    }
  }
  @Post('sendMail')
  async sendCode(@Body() user: CreateUserDetails, @Res() res: Response) {
    const result = await this.userService.sendMail(user);
    if (result === true) {
      try {
        res.send(HttpStatus.OK);
      } catch (error) {
        res
          .status(HttpStatus.CONFLICT)
          .send({ message: 'Không thể gửi email' });
      }
    } else {
      res.send(HttpStatus.BAD_GATEWAY);
    }
  }
  @Post('findAuth')
  async findAuth(
    @Body() findAuthenticate: findAuthenticated,
    @Res() res: Response,
  ) {
    const result = await this.authService.findAuthenticate(findAuthenticate);
    return res.status(200).send(result);
  }
  @Post('logout')
  @UseGuards(AuthenticatedGuard)
  logout(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    this.events.emit('offline.user', req.user);
    req.logout((err: any) => {
      return err ? res.send(400) : res.send(200);
    });
  }
  @Post('updateImageAVT')
  @UseInterceptors(
    FileInterceptor('fileAvatar'), // Sử dụng FileInterceptor cho một file
  )
  async updateImageAVT(
    @UploadedFile() fileAvatar: Express.Multer.File, // Sử dụng @UploadedFile() cho một file
  ) {
    try {
      const imageNew = await this.authService.updateImagesUserAVT(fileAvatar);
      return imageNew;
    } catch (error) {
      console.log(error);
    }
  }
  @Post('updateImageBg')
  @UseGuards(AuthenticatedGuard)
  @UseInterceptors(
    FileInterceptor('fileBackground'), // Sử dụng FileInterceptor cho một file
  )
  async updateImageBg(
    @UploadedFile() fileBackground: Express.Multer.File, // Sử dụng @UploadedFile() cho một file
  ) {
    try {
      const imageNew =
        await this.authService.updateImagesUserBg(fileBackground);
      return imageNew;
    } catch (error) {
      console.log(error);
    }
  }
  @Put('updateUser/:id')
  @UseGuards(AuthenticatedGuard)
  async updateUser(
    @Param('id') id: string,
    @Body() user: UpdateUser,
    @AuthUser() userAuth: UsersPromise,
    @Res() res: Response,
  ) {
    try {
      if (id !== userAuth.id) {
        return res.status(400).send('Not Your Account');
      }
      const updatedUser = await this.authService.updateValidUser(id, user);
      return res.send(updatedUser).status(200);
    } catch (error) {
      console.log(error);
    }
  }
  @Patch('updatedPassword/:id')
  @UseGuards(AuthenticatedGuard)
  async updatePassword(
    @Param('id') id: string,
    @Body() user: UpdatePassWord,
    @AuthUser() userAuth: UsersPromise,
    @Res() res: Response,
  ) {
    try {
      if (id !== userAuth.id) {
        return res.status(400).send('Not Your Account');
      }
      const updatePassword = await this.authService.updatePassWord(id, user);
      return res.send(updatePassword).status(200);
    } catch (error) {
      return res.send(error);
    }
  }
}
