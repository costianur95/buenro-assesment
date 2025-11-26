import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import axios from "axios";
import pLimit from "p-limit";
import { DataSourcesService } from "../data-sources/data-sources.service";
import { PropertiesService } from "../properties/properties.service";
import { Types } from "mongoose";

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private dataSourcesService: DataSourcesService,
    private propertiesService: PropertiesService,
  ) {}

  // Runs every 10 minutes
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleDataIngestion() {
    this.logger.log("Starting data ingestion from multiple sources...");

    // Fetch active data sources from database
    const dataSources = await this.dataSourcesService.findActive();

    if (dataSources.length === 0) {
      this.logger.warn("No active data sources found in database");
      return;
    }

    this.logger.log(`Found ${dataSources.length} active data sources`);

    const ingestionPromises = dataSources.map((source) =>
      this.ingestFromSource(
        source.url,
        source.name,
        source._id,
        source.ingestionSchema,
      ),
    );

    const results = await Promise.allSettled(ingestionPromises);

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    this.logger.log(
      `Data ingestion completed. Successful: ${successful}, Failed: ${failed}`,
    );
  }

  private async ingestFromSource(
    sourceUrl: string,
    sourceName: string,
    sourceId: Types.ObjectId,
    ingestionSchema: Record<string, string>,
  ): Promise<void> {
    try {
      this.logger.debug(`Fetching data from: ${sourceName} (${sourceUrl})`);

      const response = await axios.get(sourceUrl, {
        timeout: 30000, // 30 seconds timeout
      });

      const rawData = response.data as Array<Record<string, unknown>>;

      // Limit concurrency to 50 parallel operations
      const limit = pLimit(100);

      await Promise.all(
        rawData.map((item) =>
          limit(async () => {
            const mappedData = Object.keys(ingestionSchema).reduce(
              (acc, key) => {
                this.addProperty(acc, key, item, ingestionSchema[key]);
                return acc;
              },
              {} as {
                id: string;
                city: string;
                availability: boolean;
                price: number;
              },
            );

            await this.propertiesService.create({
              ...mappedData,
              sourceId,
              rawData: item,
            });
          }),
        ),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.logger.error(
        `Failed to ingest data from ${sourceName}: ${errorMessage}`,
      );

      throw error;
    }
  }

  /**
   * Add property to target object based on source path
   * @param object - Target object to add property to
   * @param propertyName - Name of the property to add
   * @param source - Source object to get property value from
   * @param propertyValue - Path to property value in source object
   */
  public addProperty(
    object: Record<string, unknown>,
    propertyName: string,
    source: Record<string, unknown>,
    propertyValue: string,
  ) {
    // get the value from the source object
    let value = this.getSourceValue(source, propertyValue);
    const propertyNames = propertyName.split(".");
    // we need to create another version since reverse is mutating initial array
    const reversedPropertyNames = propertyName.split(".").reverse();
    // construct an object based on the schema provided as input
    const newObject = reversedPropertyNames.reduce((acc, propertyName) => {
      acc = { [propertyName]: value };
      value = { ...acc };
      return acc;
    }, {});

    // update the target object with the new object
    propertyNames.reduce(
      (
        acc: {
          newObject: Record<string, unknown>;
          object: Record<string, unknown>;
        },
        propertyName,
      ) => {
        // if the property is not already present in the target object, add it
        if (!acc.object[propertyName]) {
          acc.object[propertyName] = acc.newObject[propertyName];
        }
        // if we don't need to assign new property then we need to advance deeper on both target and source objects
        return {
          newObject: acc.newObject[propertyName],
          object: acc.object[propertyName],
        };
      },
      { newObject, object },
    );
  }

  public getSourceValue(
    source: Record<string, unknown>,
    propertyValue: string,
  ) {
    const propertyNames = propertyValue.split(".");
    return propertyNames.reduce((acc, propertyName) => {
      if (!acc) {
        return undefined;
      }
      return acc[propertyName];
    }, source);
  }

  // Manual trigger method (can be called via API)
  // used for debugging
  async triggerIngestion() {
    this.logger.log("Manually triggered data ingestion");
    await this.handleDataIngestion();
    return { message: "Data ingestion triggered successfully" };
  }
}
