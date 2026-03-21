import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude } from 'class-transformer';

export type UserDocument = HydratedDocument<User> & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  @Exclude()
  passwordHash: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ default: null, type: String })
  @Exclude()
  refreshTokenHash: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
