// TDD: Test for helpers/jwt.js
// Target: 100% coverage for signToken and verifyToken

const { signToken, verifyToken } = require("../../helpers/jwt");

describe("JWT Helper", () => {
  describe("signToken", () => {
    it("should generate a valid JWT token", () => {
      const payload = { id: 1, email: "test@example.com" };
      const token = signToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should generate different tokens for different payloads", () => {
      const token1 = signToken({ id: 1 });
      const token2 = signToken({ id: 2 });
      
      expect(token1).not.toBe(token2);
    });

    it("should generate token with empty payload", () => {
      const token = signToken({});
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });
  });

  describe("verifyToken", () => {
    it("should verify and decode a valid token", () => {
      const payload = { id: 1, email: "test@example.com" };
      const token = signToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.iat).toBeDefined(); // JWT adds iat (issued at)
    });

    it("should throw error for invalid token", () => {
      const invalidToken = "invalid.token.here";
      
      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    it("should throw error for malformed token", () => {
      const malformedToken = "not.a.jwt";
      
      expect(() => {
        verifyToken(malformedToken);
      }).toThrow();
    });

    it("should throw error for empty token", () => {
      expect(() => {
        verifyToken("");
      }).toThrow();
    });

    it("should throw error for null/undefined token", () => {
      expect(() => {
        verifyToken(null);
      }).toThrow();
      
      expect(() => {
        verifyToken(undefined);
      }).toThrow();
    });
  });

  describe("Integration: sign and verify", () => {
    it("should sign and verify token correctly", () => {
      const originalPayload = { id: 123, role: "admin" };
      const token = signToken(originalPayload);
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe(originalPayload.id);
      expect(decoded.role).toBe(originalPayload.role);
    });
  });
});

