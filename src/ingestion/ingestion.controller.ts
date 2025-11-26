import { Controller, Post } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { IngestionService } from "./ingestion.service";

@ApiTags("ingestion")
@Controller("ingestion")
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post("trigger")
  @ApiOperation({
    summary: "Manually trigger data ingestion from all active sources",
  })
  @ApiResponse({ status: 200, description: "Ingestion triggered successfully" })
  async triggerIngestion() {
    return this.ingestionService.triggerIngestion();
  }
}
