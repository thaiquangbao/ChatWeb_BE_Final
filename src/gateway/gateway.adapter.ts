import { IoAdapter } from '@nestjs/platform-socket.io';
import { AuthenticatedSocket } from '../untills/interfaces';
import * as cookie from 'cookie';
import * as cookieParser from 'cookie-parser';
// MideleWare cho cái websocket
export class WebsocketAdapter extends IoAdapter {
  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options);
    server.use(async (socket: AuthenticatedSocket, next) => {
      const { cookie: clientCookie } = socket.handshake.headers;
      if (!clientCookie) {
        console.log('Clients has not cookie');
        return next(new Error('Not Authenticated'));
      }
      const { Session_JS } = cookie.parse(clientCookie);
      if (!Session_JS) {
        console.log('Session Không hợp lệ');
        return next(new Error('Not Authenticated'));
      }
      //console.log(Session_JS);
      const signedCookie = cookieParser.signedCookie(
        Session_JS,
        process.env.SESSION_SECURITY,
      );
      if (!signedCookie) {
        return next(new Error('Error signing cookie'));
      }
      socket.session = Session_JS;
      next();
    });

    return server;
  }
}
