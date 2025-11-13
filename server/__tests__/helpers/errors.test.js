// TDD: Test for helpers/errors.js
// Target: 100% coverage for all custom error classes

const { BadRequest, Unauthorized, Forbidden, NotFound } = require("../../helpers/errors");

describe("Custom Error Classes", () => {
  describe("BadRequest", () => {
    it("should create BadRequest error with default message", () => {
      const error = new BadRequest();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BadRequest);
      expect(error.name).toBe("BadRequest");
      expect(error.message).toBe("Bad Request");
    });

    it("should create BadRequest error with custom message", () => {
      const customMessage = "Invalid input data";
      const error = new BadRequest(customMessage);
      
      expect(error.name).toBe("BadRequest");
      expect(error.message).toBe(customMessage);
    });

    it("should be throwable", () => {
      expect(() => {
        throw new BadRequest("Test error");
      }).toThrow(BadRequest);
    });
  });

  describe("Unauthorized", () => {
    it("should create Unauthorized error with default message", () => {
      const error = new Unauthorized();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(Unauthorized);
      expect(error.name).toBe("Unauthorized");
      expect(error.message).toBe("Unauthorized");
    });

    it("should create Unauthorized error with custom message", () => {
      const customMessage = "Invalid credentials";
      const error = new Unauthorized(customMessage);
      
      expect(error.name).toBe("Unauthorized");
      expect(error.message).toBe(customMessage);
    });

    it("should be throwable", () => {
      expect(() => {
        throw new Unauthorized("Test error");
      }).toThrow(Unauthorized);
    });
  });

  describe("Forbidden", () => {
    it("should create Forbidden error with default message", () => {
      const error = new Forbidden();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(Forbidden);
      expect(error.name).toBe("Forbidden");
      expect(error.message).toBe("Forbidden");
    });

    it("should create Forbidden error with custom message", () => {
      const customMessage = "Access denied";
      const error = new Forbidden(customMessage);
      
      expect(error.name).toBe("Forbidden");
      expect(error.message).toBe(customMessage);
    });

    it("should be throwable", () => {
      expect(() => {
        throw new Forbidden("Test error");
      }).toThrow(Forbidden);
    });
  });

  describe("NotFound", () => {
    it("should create NotFound error with default message", () => {
      const error = new NotFound();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NotFound);
      expect(error.name).toBe("NotFound");
      expect(error.message).toBe("Not Found");
    });

    it("should create NotFound error with custom message", () => {
      const customMessage = "Resource not found";
      const error = new NotFound(customMessage);
      
      expect(error.name).toBe("NotFound");
      expect(error.message).toBe(customMessage);
    });

    it("should be throwable", () => {
      expect(() => {
        throw new NotFound("Test error");
      }).toThrow(NotFound);
    });
  });

  describe("Error inheritance", () => {
    it("should all extend Error class", () => {
      expect(new BadRequest()).toBeInstanceOf(Error);
      expect(new Unauthorized()).toBeInstanceOf(Error);
      expect(new Forbidden()).toBeInstanceOf(Error);
      expect(new NotFound()).toBeInstanceOf(Error);
    });

    it("should have correct error names", () => {
      expect(new BadRequest().name).toBe("BadRequest");
      expect(new Unauthorized().name).toBe("Unauthorized");
      expect(new Forbidden().name).toBe("Forbidden");
      expect(new NotFound().name).toBe("NotFound");
    });
  });
});

