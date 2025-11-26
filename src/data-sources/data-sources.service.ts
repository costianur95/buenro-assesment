import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { DataSource, DataSourceDocument } from "../schemas/data-source.schema";

@Injectable()
export class DataSourcesService {
  constructor(
    @InjectModel(DataSource.name)
    private dataSourceModel: Model<DataSourceDocument>,
  ) {}

  async create(createDataSourceDto: {
    name: string;
    url: string;
    isActive?: boolean;
    description?: string;
    ingestionSchema?: Record<string, string>;
  }) {
    const dataSource = new this.dataSourceModel(createDataSourceDto);
    return dataSource.save();
  }

  async findAll() {
    return this.dataSourceModel.find().exec();
  }

  async findActive() {
    return this.dataSourceModel.find({ isActive: true }).exec();
  }

  async findOne(id: string) {
    return this.dataSourceModel.findById(id).exec();
  }

  async update(
    id: string,
    updateDataSourceDto: {
      name?: string;
      url?: string;
      isActive?: boolean;
      description?: string;
      ingestionSchema?: Record<string, string>;
    },
  ) {
    return this.dataSourceModel
      .findByIdAndUpdate(id, updateDataSourceDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return this.dataSourceModel.findByIdAndDelete(id).exec();
  }
}
