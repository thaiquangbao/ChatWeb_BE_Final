import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';
import { Messages } from './Message';
import { GroupRooms } from './Groups';

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ type: String, required: true })
  fullName: string;
  @Prop({ type: String })
  gender: string;
  @Prop({ type: String })
  background: string;
  @Prop({ type: String, required: true })
  phoneNumber: string;
  @Prop({ type: String, required: true })
  email: string;
  @Prop({ type: String, required: true })
  @Exclude() // mật khảu sẻ k hiển thị trên màn hình
  passWord: string;
  @Prop({ type: String, required: true })
  dateOfBirth: string;
  @Prop({ type: String, required: true })
  avatar: string;
  @Prop({ type: Array })
  messages: Messages[];
  @Prop({ type: Array, default: () => [] })
  friends: User[];
  @Prop({ type: Boolean, default: false })
  sended: boolean;
  @Prop({ type: Array, default: () => [] })
  sendFriend: User[];
  @Prop({ type: Array, default: () => [] })
  waitAccept: User[];
  @Prop({ type: Array, default: () => [] })
  groupRooms: GroupRooms[];
  @Prop({ type: Boolean, default: false })
  online: boolean;
  @Prop({ type: Boolean, default: false })
  calling: boolean;
}
export const UsersSchema = SchemaFactory.createForClass(User);
