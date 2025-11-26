# Buenro Data Ingestion Service

## Overview

A **NestJS-based data ingestion service** that automatically fetches, transforms, and stores data from multiple sources into MongoDB. The application is designed to handle JSON data from various sources (such as S3 buckets, APIs, etc.) with different structures and unify them using configurable ingestion schemas.

### Key Features

- **Multi-Source Ingestion**: Fetch data from multiple sources simultaneously (S3 JSONs, REST APIs, etc.)
- **Schema Mapping**: Transform heterogeneous data structures into a unified format using `ingestionSchema`
- **Automated Processing**: Runs every 10 minutes via cron job
- **Dynamic Configuration**: Add, update, or remove data sources through REST API without redeployment
- **Dockerized**: Easy deployment with Docker Compose
- **MongoDB Storage**: Persistent data storage with automatic schema management

## Technology Stack

- **Framework**: NestJS 11.x
- **Database**: MongoDB 7.0
- **Language**: TypeScript
- **API Documentation**: Swagger/OpenAPI
- **Scheduling**: @nestjs/schedule
- **HTTP Client**: Axios

## Quick Start with Docker

### Prerequisites

- Docker and Docker Compose installed on your machine

### 1. Start the Application

```bash
docker-compose up -d
```

This will start two services:
- **MongoDB**: Running on port `27017`
- **NestJS App**: Running on port `3000`

### 2. Verify Services

```bash
# Check if containers are running
docker ps

# View application logs
docker-compose logs -f app

# View MongoDB logs
docker-compose logs -f mongodb
```

### 3. Access API Documentation

Full API documentation is available via Swagger UI at:
```
http://localhost:3000/api
```

### 4. Stop the Application

```bash
docker-compose down
```

To remove volumes (delete all data):
```bash
docker-compose down -v
```

## How Ingestion Schema Works

The `ingestionSchema` is a key-value mapping that transforms source data into a unified structure. It uses dot notation to access nested properties.

### Format

```json
{
  "targetField": "sourceField.nestedField"
}
```

### Example 1: Source with Nested Address

**Source JSON Structure:**
```json
{
  "id": "123456",
  "name": "Property A",
  "address": {
    "country": "USA",
    "city": "New York"
  },
  "isAvailable": true,
  "priceForNight": 250
}
```

**Ingestion Schema:**
```json
{
  "id": "id",
  "city": "address.city",
  "availability": "isAvailable",
  "price": "priceForNight"
}
```

**Result in Database:**
```json
{
  "id": "123456",
  "city": "New York",
  "availability": true,
  "price": 250
}
```

### Example 2: Source with Flat Structure

**Source JSON Structure:**
```json
{
  "id": "abc123xy",
  "city": "Los Angeles",
  "availability": false,
  "priceSegment": "high",
  "pricePerNight": 450
}
```

**Ingestion Schema:**
```json
{
  "id": "id",
  "city": "city",
  "availability": "availability",
  "price": "pricePerNight"
}
```

**Result in Database:**
```json
{
  "id": "abc123xy",
  "city": "Los Angeles",
  "availability": false,
  "price": 450
}
```

## Configuring Data Sources

Data sources are managed through the REST API at `/data-sources`. Each source requires a URL and an optional `ingestionSchema` to transform the data.

### Data Source Model

```typescript
{
  name: string;              // Display name for the source
  url: string;               // URL to fetch JSON data (S3, API, etc.)
  isActive: boolean;         // Whether to include in ingestion runs
  description?: string;      // Optional description
  ingestionSchema?: object;  // Field mapping configuration
}
```

### API Endpoints

#### Create a Data Source

```bash
POST http://localhost:3000/data-sources
Content-Type: application/json

{
  "name": "S3 Source 1",
  "url": "https://my-bucket.s3.amazonaws.com/properties-source1.json",
  "isActive": true,
  "description": "Properties with nested address structure",
  "ingestionSchema": {
    "id": "id",
    "city": "address.city",
    "availability": "isAvailable",
    "price": "priceForNight"
  }
}
```

#### Create Second Source

```bash
POST http://localhost:3000/data-sources
Content-Type: application/json

{
  "name": "S3 Source 2",
  "url": "https://my-bucket.s3.amazonaws.com/properties-source2.json",
  "isActive": true,
  "description": "Properties with flat structure",
  "ingestionSchema": {
    "id": "id",
    "city": "city",
    "availability": "availability",
    "price": "pricePerNight"
  }
}
```


## Automated Ingestion Process

### How It Works

1. **Scheduler**: Every 10 minutes, the cron job triggers the ingestion process
2. **Fetch Sources**: Retrieves all active data sources from MongoDB
3. **Parallel Processing**: Fetches JSON data from all source URLs simultaneously
4. **Transform**: Applies the `ingestionSchema` to map fields to the unified structure
5. **Store**: Saves transformed data to the `properties` collection in MongoDB
6. **Logging**: Records success/failure for each source

### Manual Trigger

You can also trigger ingestion manually via the API:

```bash
POST http://localhost:3000/ingestion/trigger
```

## Environment Variables

Configuration is handled through environment variables in `docker-compose.yml`:

```yaml
app:
  environment:
    - PORT=3000
    - MONGODB_URI=mongodb://admin:password123@mongodb:27017/buenro?authSource=admin

mongodb:
  environment:
    - MONGO_INITDB_ROOT_USERNAME=admin
    - MONGO_INITDB_ROOT_PASSWORD=password123
    - MONGO_INITDB_DATABASE=buenro
```

**Note**: For production, move credentials to `.env` file and use secrets management.

### View Logs

```bash
# Application logs
docker-compose logs -f app

# MongoDB logs
docker-compose logs -f mongodb

# All logs
docker-compose logs -f
```

### Check Ingestion Status

Monitor the logs during ingestion cycles (every 10 minutes) to see:
- Which sources were processed
- How many records were ingested
- Any errors or warnings

## Known Limitations and Future Improvements

### Current Implementation Constraints

This application was built as a proof of concept with time constraints, focusing primarily on the **ingestion schema mapping system**. While functional, it has several known limitations:

#### Performance Issues

- **No Deduplication**: The system always inserts new entries with each iteration, leading to duplicate data
- **Inefficient Writes**: Inserts up to 100 entries in parallel without batch write optimization

### Proposed Architecture for Production

#### Option 1: Enhanced MongoDB Architecture

If staying with MongoDB as the primary database:

**1. Replication for Read Performance**
- Add MongoDB replica sets to distribute read queries
- Enable efficient data retrieval across multiple nodes

**2. Sharding for Write Performance**
- Implement sharding based on `city` field
- Distribute write operations across shards for horizontal scaling

**3. Indexing Strategy**
- Add compound indexes on frequently queried fields (`city`, `availability`, `price`)
- Create TTL indexes for data expiration if needed
- Index on `id` field for deduplication checks

**4. Batch Write Operations**
- Replace individual inserts with `bulkWrite()` operations
- Process records in batches of 500-1000 entries
- Significantly reduces database connection overhead

#### Option 2: Event-Driven AWS Architecture (Recommended for Scale)

For high-volume production workloads with proper deduplication:

```
┌─────────────┐     ┌──────────┐     ┌─────────────┐     ┌──────────────┐
│   Sources   │────▶│ Ingestion│────▶│   AWS SQS   │────▶│  Lambda 1    │
│  (S3/APIs)  │     │  Service │     │   Queue     │     │  (Processor) │
└─────────────┘     └──────────┘     └─────────────┘     └──────┬───────┘
                                                                  │
                                                                  ▼
                                                          ┌──────────────┐
                                                          │  DynamoDB    │
                                                          │  (id + hash) │
                                                          └──────┬───────┘
                                                                  │
                                                          DynamoDB Stream
                                                                  │
                                                                  ▼
                                                          ┌──────────────┐
                                                          │  Lambda 2    │
                                                          │  (Updater)   │
                                                          └──────┬───────┘
                                                                  │
                                                                  ▼
                                                          ┌──────────────┐
                                                          │   MongoDB    │
                                                          │  (Final DB)  │
                                                          └──────────────┘
```

**Architecture Components:**

1. **AWS SQS (Message Queue)**
   - Ingestion service writes messages to SQS instead of directly to MongoDB
   - Decouples data fetching from processing
   - Handles traffic spikes and provides retry mechanisms
   - Supports unlimited scaling

2. **Lambda 1 - DynamoDB Processor**
   - Triggered by SQS messages
   - Computes content hash (MD5/SHA256) of the data payload
   - Queries DynamoDB table by `id`
   - **If entry not found**: Creates new DynamoDB entry with `id` and `contentHash`
   - **If hash changed**: Updates DynamoDB entry with new hash
   - **If hash unchanged**: Ignores (no update needed)

3. **DynamoDB Table Structure**
   ```json
   {
     "id": "string (partition key)",
     "contentHash": "string",
     "lastModified": "timestamp"
   }
   ```

4. **DynamoDB Streams**
   - Captures all INSERT and UPDATE operations
   - Triggers Lambda 2 only when data actually changes

5. **Lambda 2 - MongoDB Updater**
   - Receives changed records from DynamoDB Stream
   - Performs upsert operations to MongoDB
   - Only updates records that have actually changed
   - Significantly reduces MongoDB write load

**Benefits of AWS Architecture:**

- ✅ **Deduplication**: Content hashing prevents unnecessary updates
- ✅ **Scalability**: Serverless components handle unlimited load
- ✅ **Cost-Effective**: Pay only for actual processing
- ✅ **Fault Tolerant**: SQS retries, DLQ for failed messages
- ✅ **Reduced MongoDB Load**: Only changed records reach the database
- ✅ **Decoupled**: Each component can scale independently

#### Option 3: Elasticsearch for Analytics

For use cases requiring full-text search and analytics:

- Replace or complement MongoDB with Elasticsearch
- Benefit from built-in indexing and aggregation capabilities
- Enable complex search queries on ingested data
- Better suited for time-series data analysis
