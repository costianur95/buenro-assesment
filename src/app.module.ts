import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { IngestionModule } from "./ingestion/ingestion.module";
import { DataSourcesModule } from "./data-sources/data-sources.module";
import { PropertiesModule } from "./properties/properties.module";

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ||
        "mongodb://admin:password123@localhost:27017/buenro?authSource=admin",
    ),
    ScheduleModule.forRoot(),
    DataSourcesModule,
    IngestionModule,
    PropertiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
