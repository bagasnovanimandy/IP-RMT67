// TDD: Test for routes/ai.js - GET /api/ai/ping endpoint
process.env.GEMINI_DRY = "true";

const request = require("supertest");
const express = require("express");
const { pingGemini, MODEL_NAME } = require("../helpers/gemini");

// Mock helpers
jest.mock("../helpers/gemini");

const aiRouter = require("../routes/ai");

describe("GET /api/ai/ping", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/ai", aiRouter);
    jest.clearAllMocks();
  });

  it("should successfully ping Gemini and return response", async () => {
    pingGemini.mockResolvedValue({ text: "ok" });

    const response = await request(app)
      .get("/api/ai/ping")
      .expect(200);

    expect(response.body).toEqual({
      ok: true,
      model: MODEL_NAME,
      text: "ok",
    });
    expect(pingGemini).toHaveBeenCalledWith("balas 1 kata: ok");
  });

  it("should handle AI_ERROR from Gemini and return 500 with gemini source", async () => {
    const aiError = new Error("AI_ERROR: API key invalid");
    pingGemini.mockRejectedValue(aiError);

    const response = await request(app)
      .get("/api/ai/ping")
      .expect(500);

    expect(response.body).toEqual({
      ok: false,
      source: "gemini",
      message: "API key invalid",
    });
  });

  it("should handle non-AI error and return 500 with server source", async () => {
    const serverError = new Error("Internal server error");
    pingGemini.mockRejectedValue(serverError);

    const response = await request(app)
      .get("/api/ai/ping")
      .expect(500);

    expect(response.body).toEqual({
      ok: false,
      source: "server",
      message: "Internal server error",
    });
  });

  it("should handle error without message and return default message", async () => {
    const errorWithoutMessage = new Error();
    errorWithoutMessage.message = undefined;
    pingGemini.mockRejectedValue(errorWithoutMessage);

    const response = await request(app)
      .get("/api/ai/ping")
      .expect(500);

    expect(response.body).toEqual({
      ok: false,
      source: "server",
      message: "Internal server error",
    });
  });
});

