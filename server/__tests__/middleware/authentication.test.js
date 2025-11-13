// TDD: Test for middleware/authentication.js
// Target: 100% coverage for authentication middleware

const request = require("supertest");
const express = require("express");
const { User } = require("../../models");
const { signToken } = require("../../helpers/jwt");
const { verifyToken } = require("../../helpers/jwt");
const authentication = require("../../middleware/authentication");

// Mock models
jest.mock("../../models", () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

// Mock only verifyToken, keep signToken real for generating test tokens
jest.mock("../../helpers/jwt", () => {
  const actual = jest.requireActual("../../helpers/jwt");
  return {
    ...actual,
    verifyToken: jest.fn(),
  };
});

describe("Authentication Middleware", () => {
  let app;

  // Set timeout for all tests in this suite
  jest.setTimeout(10000);

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(authentication);
    app.get("/protected", (req, res) => {
      res.json({ user: req.user });
    });
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup: wait for any pending operations
    await Promise.resolve();
  });

  describe("Successful authentication", () => {
    it("should authenticate user with valid token", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        role: "customer",
        name: "Test User",
      };
      const token = signToken({ id: 1 });

      verifyToken.mockReturnValue({ id: 1 });
      User.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/protected")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.user).toEqual({
        id: 1,
        email: "test@example.com",
        role: "customer",
        name: "Test User",
      });
      expect(verifyToken).toHaveBeenCalledWith(token);
      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: ["id", "email", "role", "name"],
      });
    });

    it("should return 401 when token is missing Bearer prefix", async () => {
      const token = signToken({ id: 2 });
      
      // When Authorization header doesn't have "Bearer " prefix,
      // the split will result in token being undefined
      const response = await request(app)
        .get("/protected")
        .set("Authorization", token) // No Bearer prefix - will fail
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
      expect(verifyToken).not.toHaveBeenCalled();
    });
  });

  describe("Authentication failures", () => {
    it("should return 401 when no token provided", async () => {
      const response = await request(app)
        .get("/protected")
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
      expect(verifyToken).not.toHaveBeenCalled();
      expect(User.findByPk).not.toHaveBeenCalled();
    });

    it("should return 401 when Authorization header is missing", async () => {
      const response = await request(app)
        .get("/protected")
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 401 when token is invalid (JsonWebTokenError)", async () => {
      const invalidToken = "invalid.token.here";
      const jwtError = new Error("Invalid token");
      jwtError.name = "JsonWebTokenError";

      verifyToken.mockImplementation(() => {
        throw jwtError;
      });

      const response = await request(app)
        .get("/protected")
        .set("Authorization", `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.message).toBe("Invalid token or token expired");
      expect(User.findByPk).not.toHaveBeenCalled();
    });

    it("should return 401 when token is expired (TokenExpiredError)", async () => {
      const expiredToken = "expired.token.here";
      const expiredError = new Error("Token expired");
      expiredError.name = "TokenExpiredError";

      verifyToken.mockImplementation(() => {
        throw expiredError;
      });

      const response = await request(app)
        .get("/protected")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toBe("Invalid token or token expired");
      expect(User.findByPk).not.toHaveBeenCalled();
    });

    it("should return 401 when user not found in database", async () => {
      const token = signToken({ id: 999 });

      verifyToken.mockReturnValue({ id: 999 });
      User.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get("/protected")
        .set("Authorization", `Bearer ${token}`)
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
      expect(User.findByPk).toHaveBeenCalledWith(999, {
        attributes: ["id", "email", "role", "name"],
      });
    });
  });

  describe("Error handling", () => {
    it("should pass other errors to next middleware", async () => {
      const token = signToken({ id: 1 });
      const dbError = new Error("Database connection failed");

      verifyToken.mockReturnValue({ id: 1 });
      User.findByPk.mockRejectedValue(dbError);

      // Create app with error handler
      const appWithErrorHandler = express();
      appWithErrorHandler.use(express.json());
      appWithErrorHandler.use(authentication);
      appWithErrorHandler.get("/protected", (req, res) => {
        res.json({ user: req.user });
      });
      appWithErrorHandler.use((err, req, res, next) => {
        res.status(500).json({ message: err.message });
      });

      const response = await request(appWithErrorHandler)
        .get("/protected")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);

      expect(response.body.message).toBe("Database connection failed");
    });

    it("should handle empty Authorization header", async () => {
      const response = await request(app)
        .get("/protected")
        .set("Authorization", "")
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should handle Authorization header with only Bearer", async () => {
      const response = await request(app)
        .get("/protected")
        .set("Authorization", "Bearer ")
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });
  });
});

