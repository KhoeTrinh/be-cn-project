import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Index extends Document {
  @Prop({ required: true })
  index: number;
}

export const IndexSchema = SchemaFactory.createForClass(Index);
