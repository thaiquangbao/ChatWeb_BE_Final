import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
// Tạo middleware cho phần login
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext) {
    const result = (await super.canActivate(context)) as boolean; //Sử dụng Guard để xác thực và bảo vệ các guard
    const request = context.switchToHttp().getRequest();
    await super.logIn(request); // Xác thực thành công th2i sẽ được qua tới route tiếp theo
    return result;
  }
}
// dùng để kiểm tra người dùng đã qua bước xác thực hay chưa
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<any> {
    const req = context.switchToHttp().getRequest();
    return req.isAuthenticated();
  }
}
