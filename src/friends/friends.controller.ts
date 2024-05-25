import {
  Body,
  Controller,
  Inject,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Routes, Services } from '../untills/constain';
import { IFriendsService } from './friends';
import { AuthenticatedGuard } from '../auth/untills/Guards';
import { AuthUser } from '../untills/decorater';
import { UsersPromise } from '../auth/dtos/Users.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FindRooms, SendFriendInvitations } from '../untills/types';
import { IdWantMakeFriend, IdWantUndo } from './dto/friendDto';
@Controller(Routes.FRIENDS)
@UseGuards(AuthenticatedGuard)
export class FriendsController {
  constructor(
    @Inject(Services.FRIENDS) private readonly friendsService: IFriendsService,
    private readonly events: EventEmitter2,
  ) { }
  @Post()
  async sendFriends(
    @Body() friend: IdWantMakeFriend,
    @AuthUser() userAuth: UsersPromise,
    @Res() res: Response,
  ) {
    try {
      const sended = await this.friendsService.sendFriendInvitations(
        friend.id,
        userAuth.id,
      );
      this.events.emit('send.friends', sended);
      return res.status(200).send(sended);
    } catch (error) {
      return res.status(400).send(error);
    }
  }
  @Post('accept/:id')
  @UseGuards(AuthenticatedGuard)
  async acceptFriends(
    @Param() id: string,
    @AuthUser() userAuth: UsersPromise,
    @Body() rooms: FindRooms,
    @Res() res: Response,
  ) {
    try {
      const accepted = await this.friendsService.acceptFriends(
        id,
        userAuth.id,
        rooms.idRooms,
      );
      this.events.emit('accept.friends', accepted);
      return res.status(200).send(accepted);
    } catch (error) {
      return res.status(400).send(error);
    }
  }
  @Post('unfriends/:id')
  @UseGuards(AuthenticatedGuard)
  async unfriends(
    @Param() id: string,
    @Body() rooms: SendFriendInvitations,
    @AuthUser() userAuth: UsersPromise,
    @Res() res: Response,
  ) {
    try {
      const deleteFriends = await this.friendsService.unfriends(
        id,
        userAuth.id,
        rooms.id,
      );
      this.events.emit('unfriends.friends', deleteFriends);
      return res.send(deleteFriends).status(200);
    } catch (error) {
      return res.send(error);
    }
  }
  @Post('undo')
  @UseGuards(AuthenticatedGuard)
  async undo(
    @Body() id: IdWantUndo,
    @AuthUser() userAuth: UsersPromise,
    @Res() res: Response,
  ) {
    try {
      const undoFriends = await this.friendsService.undoFriends(
        id.id,
        userAuth.id,
        id.idRooms,
      );
      this.events.emit('undo.friends', undoFriends);
      return res.send(undoFriends).status(200);
    } catch (error) {
      return res.send(error);
    }
  }
  @Post('acceptUser')
  async acceptFriendsCR(
    @Body() friend: IdWantMakeFriend,
    @AuthUser() userAuth: UsersPromise,
    @Res() res: Response,
  ) {
    try {
      const accepted = await this.friendsService.acceptFriendsCR(
        friend.id,
        userAuth.id,
      );
      this.events.emit('acceptUser.friends', accepted);
      return res.status(200).send(accepted);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  @Post('unfriendUser')
  async unfriendsCR(
    @Body() friend: IdWantMakeFriend,
    @AuthUser() userAuth: UsersPromise,
    @Res() res: Response,
  ) {
    try {
      const unfriend = await this.friendsService.unfriendsCR(
        friend.id,
        userAuth.id,
      );
      this.events.emit('unfriendUser.friends', unfriend);
      return res.status(200).send(unfriend);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  @Post('undoUser')
  async undoFriendsCR(
    @Body() friend: IdWantMakeFriend,
    @AuthUser() userAuth: UsersPromise,
    @Res() res: Response,
  ) {
    try {
      const undoUser = await this.friendsService.undoFriendsCR(
        friend.id,
        userAuth.id,
      );
      this.events.emit('undoUser.friends', undoUser);
      return res.status(200).send(undoUser);
    } catch (error) {
      return res.status(400).send(error);
    }
  }
}
