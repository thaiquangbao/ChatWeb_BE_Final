import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './users';
import { Rooms } from './Rooms';
export interface AnswerMessages {
  author: string;
  content: string;
  idMessages: string;
  fullName: string;
}
@Schema({
  timestamps: true,
})
export class Messages {
  @Prop({ type: String })
  content: string;
  @Prop({ type: User })
  author: User;
  @Prop({ type: Object })
  rooms: Rooms;
  @Prop({ type: String, default: '' })
  emoji: string;
  @Prop({ type: Object, default: () => ({}) })
  answerMessage: AnswerMessages;
}
export const MessagesSchema = SchemaFactory.createForClass(Messages);
