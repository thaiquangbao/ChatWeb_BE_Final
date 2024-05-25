import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class MiddlewareService implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.token;
    console.log(token);
    if (token) {
      try {
        console.log('Ok có token');
        next();
      } catch (err) {
        throw new HttpException(err, HttpStatus.CONFLICT);
      }
    } else {
      // Nếu không có token, chuyển hướng hoặc xử lý theo logic của bạn
      throw new HttpException('Error', HttpStatus.CONFLICT);
    }
  }
}
