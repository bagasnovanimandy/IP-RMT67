// TDD: Test for middleware/authorization.js
// Target: 100% coverage for canManageBooking and adminOnly

const request = require("supertest");
const express = require("express");
const { Booking } = require("../../models");
const { canManageBooking, adminOnly } = require("../../middleware/authorization");

// Mock models
jest.mock("../../models", () => ({
  Booking: {
    findByPk: jest.fn(),
  },
}));

describe("Authorization Middleware", () => {
  describe("canManageBooking", () => {
    let app;

    // Set timeout for all tests in this suite
    jest.setTimeout(10000);

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        // Mock req.user
        req.user = { id: 1, role: "customer" };
        next();
      });
      app.patch("/bookings/:id", canManageBooking, (req, res) => {
        res.json({ booking: req.booking });
      });
      jest.clearAllMocks();
    });

    afterAll(async () => {
      // Cleanup: wait for any pending operations
      await Promise.resolve();
    });

    it("should allow owner to manage their booking", async () => {
      const mockBooking = {
        id: 1,
        UserId: 1, // Same as req.user.id
        status: "pending",
      };

      Booking.findByPk.mockResolvedValue(mockBooking);

      const response = await request(app)
        .patch("/bookings/1")
        .expect(200);

      expect(response.body.booking).toEqual(mockBooking);
      expect(Booking.findByPk).toHaveBeenCalledWith("1"); // Route params are strings
    });

    it("should allow admin to manage any booking", async () => {
      const appAdmin = express();
      appAdmin.use(express.json());
      appAdmin.use((req, res, next) => {
        req.user = { id: 2, role: "admin" }; // Admin user
        next();
      });
      appAdmin.patch("/bookings/:id", canManageBooking, (req, res) => {
        res.json({ booking: req.booking });
      });

      const mockBooking = {
        id: 1,
        UserId: 1, // Different user, but admin can access
        status: "pending",
      };

      Booking.findByPk.mockResolvedValue(mockBooking);

      const response = await request(appAdmin)
        .patch("/bookings/1")
        .expect(200);

      expect(response.body.booking).toEqual(mockBooking);
    });

    it("should return 404 when booking not found", async () => {
      Booking.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .patch("/bookings/999")
        .expect(404);

      expect(response.body.message).toBe("Booking not found");
      expect(Booking.findByPk).toHaveBeenCalledWith("999"); // Route params are strings
    });

    it("should return 403 when user is not owner and not admin", async () => {
      const appOtherUser = express();
      appOtherUser.use(express.json());
      appOtherUser.use((req, res, next) => {
        req.user = { id: 999, role: "customer" }; // Different user
        next();
      });
      appOtherUser.patch("/bookings/:id", canManageBooking, (req, res) => {
        res.json({ booking: req.booking });
      });

      const mockBooking = {
        id: 1,
        UserId: 1, // Different from req.user.id
        status: "pending",
      };

      Booking.findByPk.mockResolvedValue(mockBooking);

      const response = await request(appOtherUser)
        .patch("/bookings/1")
        .expect(403);

      expect(response.body.message).toBe("Forbidden");
    });

    it("should handle database errors", async () => {
      const appWithErrorHandler = express();
      appWithErrorHandler.use(express.json());
      appWithErrorHandler.use((req, res, next) => {
        req.user = { id: 1, role: "customer" };
        next();
      });
      appWithErrorHandler.patch("/bookings/:id", canManageBooking, (req, res) => {
        res.json({ booking: req.booking });
      });
      appWithErrorHandler.use((err, req, res, next) => {
        res.status(500).json({ message: err.message });
      });

      const dbError = new Error("Database error");
      Booking.findByPk.mockRejectedValue(dbError);

      const response = await request(appWithErrorHandler)
        .patch("/bookings/1")
        .expect(500);

      expect(response.body.message).toBe("Database error");
    });
  });

  describe("adminOnly", () => {
    it("should allow admin user", (done) => {
      const req = {
        user: { id: 1, role: "admin" },
      };
      const res = {};
      const next = jest.fn(() => {
        expect(next).toHaveBeenCalled();
        done();
      });

      adminOnly(req, res, next);
    });

    it("should deny customer user", async () => {
      const req = {
        user: { id: 1, role: "customer" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      adminOnly(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Admin only" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should deny when user is undefined", async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      adminOnly(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Admin only" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should deny when user.role is not admin", async () => {
      const req = {
        user: { id: 1, role: "user" }, // Different role
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      adminOnly(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Admin only" });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

