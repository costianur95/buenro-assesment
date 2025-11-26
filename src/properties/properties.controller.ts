import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { Types } from "mongoose";
import { PropertiesService } from "./properties.service";

@ApiTags("properties")
@Controller("properties")
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new property" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "PROP123456" },
        sourceId: { type: "string", example: "507f1f77bcf86cd799439011" },
        city: { type: "string", example: "New York" },
        availability: { type: "boolean", example: true },
        price: { type: "number", example: 250 },
        rawData: {
          type: "object",
          example: { name: "Luxury Apartment", rooms: 3 },
        },
      },
      required: ["id", "sourceId", "city", "availability", "price"],
    },
  })
  @ApiResponse({ status: 201, description: "Property created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input" })
  create(
    @Body()
    createPropertyDto: {
      id: string;
      sourceId: string;
      city: string;
      availability: boolean;
      price: number;
      rawData?: Record<string, any>;
    },
  ) {
    return this.propertiesService.create({
      ...createPropertyDto,
      sourceId: new Types.ObjectId(createPropertyDto.sourceId),
    });
  }

  @Get()
  @ApiOperation({ summary: "Get all properties" })
  @ApiQuery({
    name: "city",
    required: false,
    type: String,
    description: "Filter by city",
  })
  @ApiQuery({
    name: "availability",
    required: false,
    type: Boolean,
    description: "Filter by availability",
  })
  @ApiQuery({
    name: "sourceId",
    required: false,
    type: String,
    description: "Filter by data source ID",
  })
  @ApiResponse({
    status: 200,
    description: "Properties retrieved successfully",
  })
  findAll(
    @Query("city") city?: string,
    @Query("availability") availability?: string,
    @Query("sourceId") sourceId?: string,
  ) {
    if (city) {
      return this.propertiesService.findByCity(city);
    }
    if (availability !== undefined) {
      return this.propertiesService.findAvailable(availability === "true");
    }
    if (sourceId) {
      return this.propertiesService.findBySourceId(sourceId);
    }
    return this.propertiesService.findAll();
  }

  @Post("query")
  @ApiOperation({ summary: "Query properties with flexible filters" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "PROP123456" },
        sourceId: { type: "string", example: "507f1f77bcf86cd799439011" },
        city: { type: "string", example: "New York" },
        availability: { type: "boolean", example: true },
        minPrice: { type: "number", example: 100 },
        maxPrice: { type: "number", example: 500 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Properties matching the query criteria",
  })
  query(
    @Body()
    queryDto: {
      id?: string;
      sourceId?: string;
      city?: string;
      availability?: boolean;
      minPrice?: number;
      maxPrice?: number;
    },
  ) {
    return this.propertiesService.query(queryDto);
  }

  @Get("statistics")
  @ApiOperation({ summary: "Get properties statistics" })
  @ApiResponse({
    status: 200,
    description: "Statistics retrieved successfully",
    schema: {
      type: "object",
      properties: {
        total: { type: "number", example: 100 },
        available: { type: "number", example: 75 },
        unavailable: { type: "number", example: 25 },
        pricing: {
          type: "object",
          properties: {
            averagePrice: { type: "number", example: 250 },
            minPrice: { type: "number", example: 100 },
            maxPrice: { type: "number", example: 1000 },
          },
        },
      },
    },
  })
  getStatistics() {
    return this.propertiesService.getStatistics();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a property by ID" })
  @ApiParam({ name: "id", type: "string", description: "Property ID" })
  @ApiResponse({ status: 200, description: "Property retrieved successfully" })
  @ApiResponse({ status: 404, description: "Property not found" })
  findOne(@Param("id") id: string) {
    return this.propertiesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a property" })
  @ApiParam({ name: "id", type: "string", description: "Property ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        sourceId: { type: "string", example: "507f1f77bcf86cd799439011" },
        city: { type: "string", example: "Los Angeles" },
        availability: { type: "boolean", example: false },
        price: { type: "number", example: 300 },
        rawData: { type: "object", example: { updated: true } },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Property updated successfully" })
  @ApiResponse({ status: 404, description: "Property not found" })
  update(
    @Param("id") id: string,
    @Body()
    updatePropertyDto: {
      sourceId?: string;
      city?: string;
      availability?: boolean;
      price?: number;
      rawData?: Record<string, any>;
    },
  ) {
    const { sourceId, ...rest } = updatePropertyDto;
    const updateData = {
      ...rest,
      ...(sourceId && { sourceId: new Types.ObjectId(sourceId) }),
    };
    return this.propertiesService.update(id, updateData);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a property" })
  @ApiParam({ name: "id", type: "string", description: "Property ID" })
  @ApiResponse({ status: 200, description: "Property deleted successfully" })
  @ApiResponse({ status: 404, description: "Property not found" })
  remove(@Param("id") id: string) {
    return this.propertiesService.remove(id);
  }
}
