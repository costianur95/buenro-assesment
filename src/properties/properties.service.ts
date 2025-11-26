import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Property, PropertyDocument } from "../schemas/property.schema";

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
  ) {}

  async create(createPropertyDto: {
    id: string;
    sourceId: Types.ObjectId;
    city: string;
    availability: boolean;
    price: number;
    rawData?: Record<string, any>;
  }) {
    const property = new this.propertyModel(createPropertyDto);
    return property.save();
  }

  async findAll() {
    return this.propertyModel.find().exec();
  }

  async findOne(id: string) {
    return this.propertyModel.findOne({ id }).exec();
  }

  async findByCity(city: string) {
    return this.propertyModel.find({ city }).exec();
  }

  async findAvailable(availability: boolean) {
    return this.propertyModel.find({ availability }).exec();
  }

  async findBySourceId(sourceId: string | Types.ObjectId) {
    const objectId =
      typeof sourceId === "string" ? new Types.ObjectId(sourceId) : sourceId;
    return this.propertyModel.find({ sourceId: objectId }).exec();
  }

  async update(
    id: string,
    updatePropertyDto: {
      sourceId?: Types.ObjectId;
      city?: string;
      availability?: boolean;
      price?: number;
      rawData?: Record<string, any>;
    },
  ) {
    return this.propertyModel
      .findOneAndUpdate({ id }, updatePropertyDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return this.propertyModel.findOneAndDelete({ id }).exec();
  }

  async query(filters: {
    id?: string;
    sourceId?: string | Types.ObjectId;
    city?: string;
    availability?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const query: Record<
      string,
      | string
      | number
      | boolean
      | Types.ObjectId
      | Record<string, number | string>
    > = {};

    if (filters.id) {
      query.id = filters.id;
    }

    if (filters.sourceId) {
      query.sourceId =
        typeof filters.sourceId === "string"
          ? new Types.ObjectId(filters.sourceId)
          : filters.sourceId;
    }

    if (filters.city) {
      query.city = { $regex: filters.city, $options: "i" }; // Case-insensitive search
    }

    if (filters.availability !== undefined) {
      query.availability = filters.availability;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) {
        query.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.price.$lte = filters.maxPrice;
      }
    }

    return this.propertyModel.find(query).limit(100).exec();
  }

  async getStatistics() {
    const total = await this.propertyModel.countDocuments().exec();
    const available = await this.propertyModel
      .countDocuments({ availability: true })
      .exec();
    const unavailable = await this.propertyModel
      .countDocuments({ availability: false })
      .exec();

    const avgPrice = await this.propertyModel
      .aggregate<Array<number>>([
        {
          $group: {
            _id: null,
            averagePrice: { $avg: "$price" },
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
          },
        },
      ])
      .exec();

    return {
      total,
      available,
      unavailable,
      pricing: avgPrice.length > 0 ? avgPrice[0] : null,
    };
  }
}
