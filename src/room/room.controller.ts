import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthenticatedGuard } from '../auth/untills/Guards';
import { Routes, Services } from '../untills/constain';
import { IRoomsService } from './room';
import { RoomDTO, RoomsCall } from './dto/RoomDTO.dto';
import { UsersPromise } from '../auth/dtos/Users.dto';
import { AuthUser } from '../untills/decorater';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller(Routes.ROOMS)
@UseGuards(AuthenticatedGuard)
export class RoomController {
  constructor(
    @Inject(Services.ROOMS) private readonly roomsService: IRoomsService,
    private readonly events: EventEmitter2,
  ) { }
  @Post()
  async createRooms(
    @AuthUser() user: UsersPromise,
    @Body() createRooms: RoomDTO,
  ) {
    try {
      const rooms = await this.roomsService.createRooms(user, createRooms);
      this.events.emit('rooms.create', rooms);
      console.log('createRooms');
      return rooms;
    } catch (error) {
      return error;
    }
  }
  @Get()
  async getRooms(@AuthUser() { id }: UsersPromise) {
    const rooms = this.roomsService.getRooms(id);
    this.events.emit('rooms.get', rooms);
    return this.roomsService.getRooms(id);
  }
  @Get(':id')
  async getRoomsById(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.roomsService.findById(id);
      console.log(result);
      return res.send(result);
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
    return this.roomsService.findById(id);
  }
  @Delete(':id/:idRooms')
  async deleteRooms(
    @AuthUser() user: UsersPromise,
    @Param('id') id: string,
    @Param('idRooms') idRooms: string,
    @Res() res: Response,
  ) {
    try {
      if (id !== user.id) {
        throw new HttpException(
          'Bạn không có quyền xóa phòng',
          HttpStatus.BAD_REQUEST,
        );
      }
      const deleteRooms = await this.roomsService.deleteRooms(idRooms);
      this.events.emit('rooms.delete', deleteRooms);
      return res.send(deleteRooms).status(200);
    } catch (error) {
      return res.send(error);
    }
  }
  @Post('cancelCall')
  async cancelCall(@Body() rooms: RoomsCall) {
    try {
      const cancelCall = await this.roomsService.cancelCall(rooms);
      return cancelCall;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
}
