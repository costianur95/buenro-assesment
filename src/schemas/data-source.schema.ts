import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type DataSourceDocument = HydratedDocument<DataSource>;

@Schema({ timestamps: true })
export class DataSource {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description?: string;

  @Prop({ type: Object })
  ingestionSchema: Record<string, string>;
}

export const DataSourceSchema = SchemaFactory.createForClass(DataSource);
