import { Module } from "@nestjs/common";
import { IngestionService } from "./ingestion.service";
import { IngestionController } from "./ingestion.controller";
import { DataSourcesModule } from "../data-sources/data-sources.module";
import { PropertiesModule } from "../properties/properties.module";

@Module({
  imports: [DataSourcesModule, PropertiesModule],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
