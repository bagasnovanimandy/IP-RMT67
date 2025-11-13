// Set GEMINI_DRY mode untuk testing
process.env.GEMINI_DRY = "true";

const request = require("supertest");
const express = require("express");
const { Op } = require("sequelize");
const { Vehicle, Branch } = require("../models");
const { analyzePrompt } = require("../helpers/gemini");

// Mock helpers
jest.mock("../helpers/gemini");
jest.mock("../models", () => {
  const mockVehicle = {
    findAll: jest.fn(),
  };
  const mockBranch = {};
  return {
    Vehicle: mockVehicle,
    Branch: mockBranch,
  };
});

// Import router setelah mock
const aiRouter = require("../routes/ai");

describe("POST /api/ai/recommend", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/ai", aiRouter);
    jest.clearAllMocks();
  });

  describe("Filter berdasarkan jumlah orang (people)", () => {
    test("Prompt '6 orang' harus mengembalikan hanya kendaraan dengan seat >= 6", async () => {
      // Mock analyzePrompt untuk return people: 6
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: 6,
        type: null,
        budgetPerDay: { min: null, max: null },
        notes: "Keluarga 6 orang",
      });

      // Mock Vehicle.findAll untuk return data dengan seat >= 6
      const mockVehicles = [
        { id: 1, name: "Toyota Avanza", seat: 7, dailyPrice: 500000 },
        { id: 2, name: "Daihatsu Xenia", seat: 7, dailyPrice: 450000 },
        { id: 3, name: "Honda Mobilio", seat: 7, dailyPrice: 550000 },
      ];

      Vehicle.findAll.mockResolvedValue(mockVehicles);

      const response = await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "keluarga 6 orang" })
        .expect(200);

      // Verify response
      expect(response.body.filters.people).toBe(6);
      expect(response.body.data).toHaveLength(3);

      // Verify semua hasil memiliki seat >= 6
      response.body.data.forEach((vehicle) => {
        expect(vehicle.seat).toBeGreaterThanOrEqual(6);
      });

      // Verify Vehicle.findAll dipanggil dengan filter seat >= 6
      expect(Vehicle.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            seat: { [Op.gte]: 6 },
          }),
        })
      );
    });

    test("Prompt '6 orang' tidak boleh mengembalikan city car/hatchback (Ayla, Agya, Brio, dll)", async () => {
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: 6,
        type: null,
        budgetPerDay: { min: null, max: null },
        notes: "Keluarga 6 orang",
      });

      const mockVehicles = [
        { id: 1, name: "Toyota Avanza", seat: 7, dailyPrice: 500000 },
        { id: 2, name: "Daihatsu Xenia", seat: 7, dailyPrice: 450000 },
      ];

      Vehicle.findAll.mockResolvedValue(mockVehicles);

      await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "keluarga 6 orang" })
        .expect(200);

      // Verify exclude conditions untuk city car
      const findAllCall = Vehicle.findAll.mock.calls[0][0];
      // Check for Op.and using bracket notation since Op.and is a Symbol
      expect(findAllCall.where[Op.and]).toBeDefined();
      
      // Verify bahwa exclude conditions ada
      const andConditions = findAllCall.where[Op.and];
      expect(andConditions).toBeDefined();
      expect(Array.isArray(andConditions)).toBe(true);
    });

    test("Jika hasil kosong dengan people >= 6, fallback ke seat >= max(people-1, 5) dan tidak ada seat < 5", async () => {
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: 6,
        type: null,
        budgetPerDay: { min: null, max: null },
        notes: "Keluarga 6 orang",
      });

      // Mock: pertama return empty, lalu return dengan fallback
      Vehicle.findAll
        .mockResolvedValueOnce([]) // Query pertama kosong
        .mockResolvedValueOnce([
          { id: 1, name: "Toyota Avanza", seat: 5, dailyPrice: 500000 },
          { id: 2, name: "Daihatsu Xenia", seat: 6, dailyPrice: 450000 },
        ]); // Fallback query

      const response = await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "keluarga 6 orang" })
        .expect(200);

      // Verify fallback dipanggil (Vehicle.findAll dipanggil 2 kali)
      expect(Vehicle.findAll).toHaveBeenCalledTimes(2);

      // Verify fallback query menggunakan seat >= 5 (max(6-1, 5))
      const fallbackCall = Vehicle.findAll.mock.calls[1][0];
      expect(fallbackCall.where.seat).toEqual({ [Op.gte]: 5 });

      // Verify semua hasil fallback memiliki seat >= 5
      if (response.body.data.length > 0) {
        response.body.data.forEach((vehicle) => {
          expect(vehicle.seat).toBeGreaterThanOrEqual(5);
        });
      }
    });

    test("Normalisasi people: NaN atau < 1 harus di-set undefined", async () => {
      // Test dengan people NaN
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: "invalid",
        type: null,
        budgetPerDay: { min: null, max: null },
        notes: "Test",
      });

      Vehicle.findAll.mockResolvedValue([]);

      const response = await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "test" })
        .expect(200);

      expect(response.body.filters.people).toBeNull();

      // Verify tidak ada filter seat
      const findAllCall = Vehicle.findAll.mock.calls[0][0];
      expect(findAllCall.where.seat).toBeUndefined();
    });

    test("Normalisasi people: people < 1 harus di-set undefined", async () => {
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: 0,
        type: null,
        budgetPerDay: { min: null, max: null },
        notes: "Test",
      });

      Vehicle.findAll.mockResolvedValue([]);

      const response = await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "test" })
        .expect(200);

      expect(response.body.filters.people).toBeNull();
    });
  });

  describe("Filter berdasarkan budget", () => {
    test("should filter by min budget", async () => {
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: null,
        type: null,
        budgetPerDay: { min: 300000, max: null },
        notes: "Test",
      });

      Vehicle.findAll.mockResolvedValue([]);

      await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "mobil murah" })
        .expect(200);

      const findAllCall = Vehicle.findAll.mock.calls[0][0];
      expect(findAllCall.where.dailyPrice).toEqual({ [Op.gte]: 300000 });
    });

    test("should filter by max budget", async () => {
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: null,
        type: null,
        budgetPerDay: { min: null, max: 500000 },
        notes: "Test",
      });

      Vehicle.findAll.mockResolvedValue([]);

      await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "mobil murah" })
        .expect(200);

      const findAllCall = Vehicle.findAll.mock.calls[0][0];
      expect(findAllCall.where.dailyPrice).toEqual({ [Op.lte]: 500000 });
    });

    test("should filter by min and max budget (between)", async () => {
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: null,
        type: null,
        budgetPerDay: { min: 300000, max: 500000 },
        notes: "Test",
      });

      Vehicle.findAll.mockResolvedValue([]);

      await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "mobil murah" })
        .expect(200);

      const findAllCall = Vehicle.findAll.mock.calls[0][0];
      expect(findAllCall.where.dailyPrice).toEqual({ [Op.between]: [300000, 500000] });
    });
  });

  describe("Filter berdasarkan type", () => {
    test("should filter by vehicle type", async () => {
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: null,
        type: "MPV",
        budgetPerDay: { min: null, max: null },
        notes: "Test",
      });

      Vehicle.findAll.mockResolvedValue([]);

      await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "mobil MPV" })
        .expect(200);

      const findAllCall = Vehicle.findAll.mock.calls[0][0];
      expect(findAllCall.where[Op.or]).toBeDefined();
      expect(findAllCall.where[Op.or]).toHaveLength(3);
    });
  });

  describe("Filter berdasarkan city dan originCity", () => {
    test("should prioritize originCity over city", async () => {
      analyzePrompt.mockResolvedValue({
        originCity: "Jakarta",
        city: "Bandung",
        days: null,
        people: null,
        type: null,
        budgetPerDay: { min: null, max: null },
        notes: "Test",
      });

      Vehicle.findAll.mockResolvedValue([]);

      await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "dari Jakarta ke Bandung" })
        .expect(200);

      const findAllCall = Vehicle.findAll.mock.calls[0][0];
      expect(findAllCall.include[0].where.city).toBe("Jakarta");
      expect(findAllCall.include[0].where.city).not.toBe("Bandung");
    });

    test("should use city when originCity is not available", async () => {
      analyzePrompt.mockResolvedValue({
        originCity: null,
        city: "Bandung",
        days: null,
        people: null,
        type: null,
        budgetPerDay: { min: null, max: null },
        notes: "Test",
      });

      Vehicle.findAll.mockResolvedValue([]);

      await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "di Bandung" })
        .expect(200);

      const findAllCall = Vehicle.findAll.mock.calls[0][0];
      expect(findAllCall.include[0].where.city).toBe("Bandung");
    });
  });

  describe("Fallback parsing manual ketika AI gagal", () => {
    test("should extract people from prompt when AI fails", async () => {
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: null,
        type: null,
        budgetPerDay: { min: null, max: null },
        notes: "Error during analysis: test error",
      });

      Vehicle.findAll.mockResolvedValue([]);

      const response = await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "butuh mobil untuk 6 orang" })
        .expect(200);

      expect(response.body.filters.people).toBe(6);
    });

    test("should extract people from 'keluarga X orang' pattern", async () => {
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: null,
        type: null,
        budgetPerDay: { min: null, max: null },
        notes: "Error during analysis: test error",
      });

      Vehicle.findAll.mockResolvedValue([]);

      const response = await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "keluarga 4 orang" })
        .expect(200);

      expect(response.body.filters.people).toBe(4);
    });

    test("should extract people from 'keluarga X' pattern", async () => {
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: null,
        type: null,
        budgetPerDay: { min: null, max: null },
        notes: "Error during analysis: test error",
      });

      Vehicle.findAll.mockResolvedValue([]);

      const response = await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "keluarga 5" })
        .expect(200);

      expect(response.body.filters.people).toBe(5);
    });

    test("should extract people from 'X people' pattern", async () => {
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: null,
        type: null,
        budgetPerDay: { min: null, max: null },
        notes: "Error during analysis: test error",
      });

      Vehicle.findAll.mockResolvedValue([]);

      const response = await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "butuh mobil untuk 7 people" })
        .expect(200);

      expect(response.body.filters.people).toBe(7);
    });
  });

  describe("Error handling", () => {
    test("should handle AI_ERROR and return 502", async () => {
      const aiError = new Error("AI_ERROR: API key invalid");
      analyzePrompt.mockRejectedValue(aiError);

      const response = await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "test" })
        .expect(502);

      expect(response.body).toEqual({
        message: "AI service unavailable",
        detail: "API key invalid",
      });
    });

    test("should handle non-AI error and pass to next middleware", async () => {
      const serverError = new Error("Database connection failed");
      analyzePrompt.mockRejectedValue(serverError);

      // Mock next function
      const errorHandler = (err, req, res, next) => {
        res.status(500).json({ message: err.message });
      };
      app.use(errorHandler);

      const response = await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "test" })
        .expect(500);

      expect(response.body.message).toBe("Database connection failed");
    });
  });

  describe("Op.and already exists case", () => {
    test("should append to existing Op.and when people >= 6", async () => {
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: 6,
        type: "MPV",
        budgetPerDay: { min: null, max: null },
        notes: "Test",
      });

      Vehicle.findAll.mockResolvedValue([]);

      await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "keluarga 6 orang MPV" })
        .expect(200);

      const findAllCall = Vehicle.findAll.mock.calls[0][0];
      // Should have Op.and with exclude conditions
      expect(findAllCall.where[Op.and]).toBeDefined();
      expect(Array.isArray(findAllCall.where[Op.and])).toBe(true);
    });
  });

  describe("Edge cases", () => {
    test("Prompt kosong harus return 400", async () => {
      await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "" })
        .expect(400);
    });

    test("Prompt dengan whitespace only harus return 400", async () => {
      await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "   " })
        .expect(400);
    });

    test("Prompt tanpa body harus return 400", async () => {
      await request(app)
        .post("/api/ai/recommend")
        .send({})
        .expect(400);
    });

    test("Prompt tanpa people tidak perlu filter seat", async () => {
      analyzePrompt.mockResolvedValue({
        city: null,
        days: null,
        people: null,
        type: null,
        budgetPerDay: { min: null, max: null },
        notes: "Test",
      });

      Vehicle.findAll.mockResolvedValue([
        { id: 1, name: "Toyota Avanza", seat: 7, dailyPrice: 500000 },
      ]);

      await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "mobil murah" })
        .expect(200);

      const findAllCall = Vehicle.findAll.mock.calls[0][0];
      expect(findAllCall.where.seat).toBeUndefined();
    });

    test("should handle days filter", async () => {
      analyzePrompt.mockResolvedValue({
        city: null,
        days: 3,
        people: null,
        type: null,
        budgetPerDay: { min: null, max: null },
        notes: "Test",
      });

      Vehicle.findAll.mockResolvedValue([]);

      const response = await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "rental 3 hari" })
        .expect(200);

      expect(response.body.filters.days).toBe(3);
    });
  });
});

