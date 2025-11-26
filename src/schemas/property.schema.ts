import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PropertyDocument = HydratedDocument<Property>;

@Schema({ timestamps: true })
export class Property {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ type: Types.ObjectId, ref: "DataSource", required: true })
  sourceId: Types.ObjectId;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  availability: boolean;

  @Prop({ required: true })
  price: number;

  @Prop({ type: Object })
  rawData: Record<string, any>;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
