// TDD: Test for helpers/bcrypt.js
// Target: 100% coverage for hashPassword and comparePassword

const { hashPassword, comparePassword } = require("../../helpers/bcrypt");

describe("Bcrypt Helper", () => {
  describe("hashPassword", () => {
    it("should hash a plain password", () => {
      const plainPassword = "password123";
      const hashed = hashPassword(plainPassword);
      
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe("string");
      expect(hashed).not.toBe(plainPassword);
      expect(hashed.length).toBeGreaterThan(20); // bcrypt hash is long
    });

    it("should generate different hashes for same password (salt)", () => {
      const plainPassword = "password123";
      const hash1 = hashPassword(plainPassword);
      const hash2 = hashPassword(plainPassword);
      
      // Different salts should produce different hashes
      expect(hash1).not.toBe(hash2);
    });

    it("should hash empty string", () => {
      const hashed = hashPassword("");
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe("string");
    });

    it("should hash special characters", () => {
      const specialPassword = "!@#$%^&*()";
      const hashed = hashPassword(specialPassword);
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(specialPassword);
    });
  });

  describe("comparePassword", () => {
    it("should return true for matching password", () => {
      const plainPassword = "password123";
      const hashed = hashPassword(plainPassword);
      const result = comparePassword(plainPassword, hashed);
      
      expect(result).toBe(true);
    });

    it("should return false for non-matching password", () => {
      const plainPassword = "password123";
      const wrongPassword = "wrongpassword";
      const hashed = hashPassword(plainPassword);
      const result = comparePassword(wrongPassword, hashed);
      
      expect(result).toBe(false);
    });

    it("should return false for empty password with valid hash", () => {
      const plainPassword = "password123";
      const hashed = hashPassword(plainPassword);
      const result = comparePassword("", hashed);
      
      expect(result).toBe(false);
    });

    it("should return false for valid password with empty hash", () => {
      const plainPassword = "password123";
      const result = comparePassword(plainPassword, "");
      
      expect(result).toBe(false);
    });

    it("should handle case-sensitive passwords", () => {
      const plainPassword = "Password123";
      const hashed = hashPassword(plainPassword);
      
      expect(comparePassword("Password123", hashed)).toBe(true);
      expect(comparePassword("password123", hashed)).toBe(false);
    });
  });

  describe("Integration: hash and compare", () => {
    it("should hash and compare correctly in sequence", () => {
      const passwords = ["test1", "test2", "test3"];
      
      passwords.forEach((password) => {
        const hashed = hashPassword(password);
        expect(comparePassword(password, hashed)).toBe(true);
        expect(comparePassword("wrong", hashed)).toBe(false);
      });
    });
  });
});

