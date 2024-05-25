import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './users';
import { Messages } from './Message';
export interface UserAttends {
  email: string;
  fullName: string;
  acceptCall: boolean;
}
@Schema({
  timestamps: true,
})
export class GroupRooms {
  @Prop({ type: String, default: '' })
  nameGroups: string;
  @Prop({ type: Array })
  participants: User[];
  @Prop({ type: User })
  creator: User;
  @Prop({ type: Array, default: () => [] })
  messages: Messages[];
  @Prop({ type: Object, default: '' })
  lastMessageSent: Messages;
  @Prop({ type: String, default: '' })
  avtGroups: string;
  @Prop({ type: Boolean, default: false })
  callGroup: boolean;
  @Prop({ type: Array, default: () => [] })
  attendCallGroup: UserAttends[];
}
export const GroupRoomsSchema = SchemaFactory.createForClass(GroupRooms);
