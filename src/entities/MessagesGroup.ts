import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './users';
import { GroupRooms } from './Groups';

export interface AnswerMessages {
  author: string;
  content: string;
  idMessages: string;
  fullName: string;
}
@Schema({
  timestamps: true,
})
export class MessagesGroup {
  @Prop({ type: String })
  content: string;
  @Prop({ type: User })
  author: User;
  @Prop({ type: Object })
  groups: GroupRooms;
  @Prop({ type: String, default: '' })
  emoji: string;
  @Prop({ type: Object, default: () => ({}) })
  answerMessage: AnswerMessages;
}
export const MessagesGroupSchema = SchemaFactory.createForClass(MessagesGroup);
