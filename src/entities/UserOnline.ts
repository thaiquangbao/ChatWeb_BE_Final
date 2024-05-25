import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class UserOnline {
  @Prop({ type: String, required: true })
  email: string;
  @Prop({ type: String, required: true })
  session: string;
}
export const UserOnlineSchema = SchemaFactory.createForClass(UserOnline);
