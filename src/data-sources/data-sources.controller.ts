import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { DataSourcesService } from "./data-sources.service";

@ApiTags("data-sources")
@Controller("data-sources")
export class DataSourcesController {
  constructor(private readonly dataSourcesService: DataSourcesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new data source" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "My S3 Bucket" },
        url: {
          type: "string",
          example: "https://my-bucket.s3.amazonaws.com/data.json",
        },
        isActive: { type: "boolean", example: true },
        description: { type: "string", example: "Production data source" },
        ingestionSchema: {
          type: "object",
          example: { city: "address.city" },
        },
      },
      required: ["name", "url"],
    },
  })
  @ApiResponse({ status: 201, description: "Data source created successfully" })
  create(
    @Body()
    createDataSourceDto: {
      name: string;
      url: string;
      isActive?: boolean;
      description?: string;
      ingestionSchema?: Record<string, string>;
    },
  ) {
    return this.dataSourcesService.create(createDataSourceDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all data sources" })
  @ApiResponse({ status: 200, description: "Returns all data sources" })
  findAll() {
    return this.dataSourcesService.findAll();
  }

  @Get("active")
  @ApiOperation({ summary: "Get only active data sources" })
  @ApiResponse({ status: 200, description: "Returns active data sources" })
  findActive() {
    return this.dataSourcesService.findActive();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a data source by ID" })
  @ApiParam({ name: "id", type: "string", description: "Data source ID" })
  @ApiResponse({ status: 200, description: "Returns a data source" })
  @ApiResponse({ status: 404, description: "Data source not found" })
  findOne(@Param("id") id: string) {
    return this.dataSourcesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a data source" })
  @ApiParam({ name: "id", type: "string", description: "Data source ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "My S3 Bucket" },
        url: {
          type: "string",
          example: "https://my-bucket.s3.amazonaws.com/data.json",
        },
        isActive: { type: "boolean", example: true },
        description: { type: "string", example: "Production data source" },
        ingestionSchema: {
          type: "object",
          example: { city: "address.city" },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Data source updated successfully",
  })
  @ApiResponse({ status: 404, description: "Data source not found" })
  update(
    @Param("id") id: string,
    @Body()
    updateDataSourceDto: {
      name?: string;
      url?: string;
      isActive?: boolean;
      description?: string;
      ingestionSchema?: Record<string, string>;
    },
  ) {
    return this.dataSourcesService.update(id, updateDataSourceDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a data source" })
  @ApiParam({ name: "id", type: "string", description: "Data source ID" })
  @ApiResponse({
    status: 200,
    description: "Data source deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Data source not found" })
  remove(@Param("id") id: string) {
    return this.dataSourcesService.remove(id);
  }
}
