import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Services } from '../untills/constain';
import { UsersModule } from '../users/users.module';
import { LocalStrategy } from './untills/LocalStrategy';
import { SessionSerializer } from './untills/SessionSerializer';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UsersSchema } from '../entities/users';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CloudinaryProvider } from '../cloudinary/cloudinary.provider';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MessagesModule } from '../messages/messages.module';
import { RoomModule } from '../room/room.module';
import { Rooms, RoomsSchema } from '../entities/Rooms';
import { Messages, MessagesSchema } from '../entities/Message';
import { UserOnline, UserOnlineSchema } from '../entities/UserOnline';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: User.name, schema: UsersSchema }]),
    MongooseModule.forFeature([
      { name: UserOnline.name, schema: UserOnlineSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: config.get<string | number>('JWT_EXPIRES'),
          },
        };
      },
    }),
    MessagesModule,
    RoomModule,
    CloudinaryModule,
    MongooseModule.forFeature([{ name: Rooms.name, schema: RoomsSchema }]),
    MongooseModule.forFeature([
      { name: Messages.name, schema: MessagesSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    LocalStrategy,
    SessionSerializer,
    {
      provide: Services.AUTH,
      useClass: AuthService,
    },
    CloudinaryService,
    CloudinaryProvider,
  ],
})
export class AuthModule { }
