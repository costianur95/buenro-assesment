import { Test, TestingModule } from "@nestjs/testing";
import { IngestionService } from "./ingestion.service";
import { DataSourcesService } from "../data-sources/data-sources.service";

describe("IngestionService - Mapping Methods", () => {
  let service: IngestionService;

  beforeEach(async () => {
    const mockDataSourcesService = {
      findActive: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: DataSourcesService,
          useValue: mockDataSourcesService,
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getSourceValue", () => {
    it("should get simple property value", () => {
      const source = {
        name: "John Doe",
        age: 30,
      };

      const result = service.getSourceValue(source, "name");
      expect(result).toBe("John Doe");
    });

    it("should get nested property value with dot notation", () => {
      const source = {
        user: {
          name: "John Doe",
          age: 30,
        },
      };

      const result = service.getSourceValue(source, "user.name");
      expect(result).toBe("John Doe");
    });

    it("should get deeply nested property value", () => {
      const source = {
        user: {
          profile: {
            personal: {
              name: "John Doe",
            },
          },
        },
      };

      const result = service.getSourceValue(
        source,
        "user.profile.personal.name",
      );
      expect(result).toBe("John Doe");
    });

    it("should get nested object", () => {
      const source = {
        user: {
          address: {
            city: "New York",
            country: "USA",
          },
        },
      };

      const result = service.getSourceValue(source, "user.address");
      expect(result).toEqual({
        city: "New York",
        country: "USA",
      });
    });

    it("should return undefined for non-existent property", () => {
      const source = {
        name: "John",
      };

      const result = service.getSourceValue(source, "age");
      expect(result).toBeUndefined();
    });

    it("should return undefined for non-existent nested property", () => {
      const source = {
        user: {
          name: "John",
        },
      };

      const result = service.getSourceValue(source, "user.address.city");
      expect(result).toBeUndefined();
    });

    it("should handle null values in path", () => {
      const source = {
        user: null,
      };

      const result = service.getSourceValue(source, "user.name");
      expect(result).toBeUndefined();
    });
  });

  describe("addProperty", () => {
    it("should add simple property to target object", () => {
      const target = {};
      const source = {
        name: "John Doe",
        age: 30,
      };

      service.addProperty(target, "userName", source, "name");
      expect(target).toHaveProperty("userName", "John Doe");
    });

    it("should add property with nested source path", () => {
      const target = {};
      const source = {
        user: {
          name: "John Doe",
          address: {
            city: "New York",
          },
        },
      };

      service.addProperty(target, "city", source, "user.address.city");
      expect(target).toHaveProperty("city", "New York");
    });

    it("should create nested property in target", () => {
      const target = {};
      const source = {
        name: "John Doe",
      };

      service.addProperty(target, "user.name", source, "name");
      expect(target).toEqual({
        user: {
          name: "John Doe",
        },
      });
    });

    it("should create deeply nested property in target", () => {
      const target = {};
      const source = {
        name: "John Doe",
      };

      service.addProperty(target, "user.profile.personal.name", source, "name");
      expect(target).toEqual({
        user: {
          profile: {
            personal: {
              name: "John Doe",
            },
          },
        },
      });
    });

    it("should map nested source to nested target", () => {
      const target = {};
      const source = {
        person: {
          details: {
            fullName: "John Doe",
          },
        },
      };

      service.addProperty(
        target,
        "user.name",
        source,
        "person.details.fullName",
      );
      expect(target).toEqual({
        user: {
          name: "John Doe",
        },
      });
    });

    it("should handle multiple properties on same target", () => {
      const target = {};
      const source = {
        id: 123,
        name: "John Doe",
        email: "john@example.com",
      };

      service.addProperty(target, "userId", source, "id");
      service.addProperty(target, "userName", source, "name");
      service.addProperty(target, "userEmail", source, "email");

      expect(target).toEqual({
        userId: 123,
        userName: "John Doe",
        userEmail: "john@example.com",
      });
    });

    it("should handle multiple nested properties", () => {
      const target = {};
      const source = {
        id: 123,
        name: "John Doe",
        city: "NYC",
        country: "USA",
      };

      service.addProperty(target, "user.id", source, "id");
      service.addProperty(target, "user.name", source, "name");
      service.addProperty(target, "location.city", source, "city");
      service.addProperty(target, "location.country", source, "country");

      expect(target).toEqual({
        user: {
          id: 123,
          name: "John Doe",
        },
        location: {
          city: "NYC",
          country: "USA",
        },
      });
    });

    it("should not overwrite existing nested structures", () => {
      const target = {
        user: {
          id: 123,
        },
      };
      const source = {
        name: "John Doe",
      };

      service.addProperty(target, "user.name", source, "name");

      expect(target).toEqual({
        user: {
          id: 123,
          name: "John Doe",
        },
      });
    });

    it("should handle numeric values", () => {
      const target = {};
      const source = {
        age: 30,
        score: 95.5,
      };

      service.addProperty(target, "userAge", source, "age");
      service.addProperty(target, "userScore", source, "score");

      expect(target).toEqual({
        userAge: 30,
        userScore: 95.5,
      });
    });

    it("should handle boolean values", () => {
      const target = {};
      const source = {
        isActive: true,
        isVerified: false,
      };

      service.addProperty(target, "active", source, "isActive");
      service.addProperty(target, "verified", source, "isVerified");

      expect(target).toEqual({
        active: true,
        verified: false,
      });
    });

    it("should handle null values", () => {
      const target = {};
      const source = {
        name: "John",
        middleName: null,
      };

      service.addProperty(target, "userName", source, "name");
      service.addProperty(target, "middleName", source, "middleName");

      expect(target).toEqual({
        userName: "John",
        middleName: null,
      });
    });

    it("should handle array values", () => {
      const target = {};
      const source = {
        tags: ["javascript", "typescript", "nodejs"],
      };

      service.addProperty(target, "userTags", source, "tags");

      expect(target).toEqual({
        userTags: ["javascript", "typescript", "nodejs"],
      });
    });

    it("should handle object values", () => {
      const target = {};
      const source = {
        address: {
          street: "123 Main St",
          city: "New York",
        },
      };

      service.addProperty(target, "userAddress", source, "address");

      expect(target).toEqual({
        userAddress: {
          street: "123 Main St",
          city: "New York",
        },
      });
    });
  });

  describe("Real-world mapping scenarios", () => {
    it("should transform JSONPlaceholder user data", () => {
      const target = {};
      const source = {
        id: 1,
        name: "Leanne Graham",
        username: "Bret",
        email: "leanne@example.com",
        address: {
          street: "Kulas Light",
          city: "Gwenborough",
          zipcode: "92998-3874",
          geo: {
            lat: "-37.3159",
            lng: "81.1496",
          },
        },
        company: {
          name: "Romaguera-Crona",
        },
      };

      service.addProperty(target, "userId", source, "id");
      service.addProperty(target, "userName", source, "name");
      service.addProperty(target, "userEmail", source, "email");
      service.addProperty(target, "city", source, "address.city");
      service.addProperty(target, "zipcode", source, "address.zipcode");
      service.addProperty(target, "latitude", source, "address.geo.lat");
      service.addProperty(target, "longitude", source, "address.geo.lng");
      service.addProperty(target, "companyName", source, "company.name");

      expect(target).toEqual({
        userId: 1,
        userName: "Leanne Graham",
        userEmail: "leanne@example.com",
        city: "Gwenborough",
        zipcode: "92998-3874",
        latitude: "-37.3159",
        longitude: "81.1496",
        companyName: "Romaguera-Crona",
      });
    });

    it("should flatten and restructure complex data", () => {
      const target = {};
      const source = {
        product: {
          id: "PROD-123",
          details: {
            name: "Laptop",
            brand: "TechCorp",
            specs: {
              cpu: "Intel i7",
              ram: "16GB",
              storage: "512GB SSD",
            },
          },
          pricing: {
            base: 999,
            currency: "USD",
            discount: 10,
          },
        },
      };

      service.addProperty(target, "item.id", source, "product.id");
      service.addProperty(target, "item.name", source, "product.details.name");
      service.addProperty(
        target,
        "item.brand",
        source,
        "product.details.brand",
      );
      service.addProperty(
        target,
        "specs.cpu",
        source,
        "product.details.specs.cpu",
      );
      service.addProperty(
        target,
        "specs.ram",
        source,
        "product.details.specs.ram",
      );
      service.addProperty(
        target,
        "price.amount",
        source,
        "product.pricing.base",
      );
      service.addProperty(
        target,
        "price.currency",
        source,
        "product.pricing.currency",
      );

      expect(target).toEqual({
        item: {
          id: "PROD-123",
          name: "Laptop",
          brand: "TechCorp",
        },
        specs: {
          cpu: "Intel i7",
          ram: "16GB",
        },
        price: {
          amount: 999,
          currency: "USD",
        },
      });
    });
  });
});
