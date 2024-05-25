import { Injectable } from '@nestjs/common';
import { AuthenticatedSocket } from '../untills/interfaces';

export interface IGatewaySession {
  getSocketSession(id: string);
  setUserSocket(id: string, socket: AuthenticatedSocket): void;
  removeUserSocket(id: string): void;
  getSockets(): Map<string, AuthenticatedSocket>;
}
@Injectable()
export class GateWaySessionManager implements IGatewaySession {
  private readonly sessions: Map<string, AuthenticatedSocket> = new Map();
  getSocketSession(id: string) {
    return this.sessions.get(id);
  }
  setUserSocket(userId: string, socket: AuthenticatedSocket) {
    this.sessions.set(userId, socket);
  }
  removeUserSocket(userId: string) {
    this.sessions.delete(userId);
  }
  getSockets(): Map<string, AuthenticatedSocket> {
    return this.sessions;
  }
}
