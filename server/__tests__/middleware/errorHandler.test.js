// TDD: Test for middleware/errorHandler.js
// Target: 100% coverage for errorHandler and parseSequelize

const errorHandler = require("../../middleware/errorHandler");

describe("Error Handler Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    process.env.NODE_ENV = "test"; // Not production
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  describe("Standard HTTP errors", () => {
    it("should handle BadRequest error (400)", () => {
      const error = new Error("Bad request");
      error.name = "BadRequest";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Bad request" });
    });

    it("should handle Unauthorized error (401)", () => {
      const error = new Error("Unauthorized");
      error.name = "Unauthorized";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should handle Forbidden error (403)", () => {
      const error = new Error("Forbidden");
      error.name = "Forbidden";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    });

    it("should handle NotFound error (404)", () => {
      const error = new Error("Not found");
      error.name = "NotFound";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Not found" });
    });
  });

  describe("Sequelize errors", () => {
    it("should handle SequelizeValidationError with errors array", () => {
      const error = {
        name: "SequelizeValidationError",
        errors: [
          { message: "Email is required", path: "email", type: "notNull" },
          { message: "Name is invalid", path: "name", type: "Validation error" },
        ],
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email is required, Name is invalid",
      });
    });

    it("should handle SequelizeUniqueConstraintError", () => {
      const error = {
        name: "SequelizeUniqueConstraintError",
        message: "Email must be unique",
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email must be unique",
      });
    });

    it("should handle Sequelize error with empty errors array", () => {
      const error = {
        name: "SequelizeDatabaseError",
        errors: [],
        message: "Database connection failed",
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Database connection failed",
      });
    });

    it("should handle Sequelize error with error.path and error.type", () => {
      const error = {
        name: "SequelizeValidationError",
        errors: [
          { path: "email", type: "notNull" }, // No message
        ],
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "email: notNull",
      });
    });

    it("should preserve status code for Sequelize errors if not 500", () => {
      const error = {
        name: "SequelizeValidationError",
        errors: [{ message: "Validation failed" }],
      };
      // If error has name that maps to status, it should use that
      // But parseSequelize changes 500 to 400
      error.name = "BadRequest"; // This maps to 400
      error.errors = [{ message: "Sequelize error" }];

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Unknown errors", () => {
    it("should handle unknown error as 500", () => {
      const error = new Error("Unknown error");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Unknown error" });
    });

    it("should handle error without message", () => {
      const error = {};

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });

    it("should log error in development mode", () => {
      const originalConsole = console.error;
      console.error = jest.fn();

      const error = new Error("Test error");
      process.env.NODE_ENV = "development";

      errorHandler(error, req, res, next);

      expect(console.error).toHaveBeenCalledWith("ERR:", error);
      expect(res.status).toHaveBeenCalledWith(500);

      console.error = originalConsole;
      process.env.NODE_ENV = "test";
    });

    it("should not log error in production mode", () => {
      const originalConsole = console.error;
      console.error = jest.fn();

      const error = new Error("Test error");
      process.env.NODE_ENV = "production";

      errorHandler(error, req, res, next);

      expect(console.error).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);

      console.error = originalConsole;
      process.env.NODE_ENV = "test";
    });
  });

  describe("Edge cases", () => {
    it("should handle null error", () => {
      errorHandler(null, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });

    it("should handle error with null message", () => {
      const error = { message: null };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
  });
});

