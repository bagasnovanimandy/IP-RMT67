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
      expect(findAllCall.where).toHaveProperty(Op.and);
      
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

  describe("Edge cases", () => {
    test("Prompt kosong harus return 400", async () => {
      await request(app)
        .post("/api/ai/recommend")
        .send({ prompt: "" })
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
  });
});

