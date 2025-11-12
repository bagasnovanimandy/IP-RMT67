const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- Inisialisasi Model ---
const apiKey = process.env.GEMINI_API_KEY;
const GEMINI_DRY = process.env.GEMINI_DRY === "true";

if (!apiKey && !GEMINI_DRY) {
  throw new Error("GEMINI_API_KEY is missing in environment variables.");
}

let genAI = null;
let model = null;
const MODEL_NAME = "gemini-2.5-flash";

if (!GEMINI_DRY && apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: MODEL_NAME });
}

// --- System Prompt untuk Ekstraksi Data ---

/**
 * Membangun system prompt untuk menginstruksikan Gemini mengekstrak data JSON.
 * @param {string} userPrompt - Prompt mentah dari pengguna.
 * @returns {string} Prompt lengkap untuk Gemini.
 */
function buildSystemPrompt(userPrompt) {
  // Gunakan instruksi yang lebih ringkas dan fokus pada JSON output
  return `
You are an assistant that extracts car rental needs from a user prompt.
Output only a valid JSON object (NO backticks, NO explanations, NO surrounding text) with the following schema:

{
  "city": string | null,          // City for pickup, e.g.: "Jakarta", "Bandung"
  "days": number | null,          // Estimated rental duration in days (if mentioned)
  "people": number | null,        // Number of passengers (if mentioned)
  "type": string | null,          // MPV | SUV | VAN | CityCar | Commuter | null
  "budgetPerDay": { "min": number | null, "max": number | null }, // Budget in IDR (numbers only)
  "notes": string                 // Brief summary/interpretation of the request (max 100 chars)
}

Extraction Rules:
- Fill 'null' if uncertain.
- budgetPerDay.min/max must be plain numbers (Rupiah, no separators).
- Budget inference: "murah" (~350000 max); "hemat" (300000-400000); "premium" (>600000 min).
- Type inference: 'keluarga' (>5 people) -> MPV; 'rombongan/elf/hiace' -> VAN/Commuter; 'offroad/gr sport' -> SUV.
- City keywords: Jakarta, Bandung, Surabaya, Bali, Yogyakarta, Semarang, Malang, Solo.
- Days: Extract the number if mentioned (e.g., "3 hari" -> 3).

User prompt to analyze:
"""${userPrompt}"""
`.trim();
}

// --- Fungsi Utama ---

/**
 * Memanggil Gemini untuk menganalisis prompt dan mengembalikan objek hasil parse (bukan string).
 * Menggunakan JSON mode untuk output yang lebih reliable.
 * @param {string} userPrompt - Prompt yang dimasukkan pengguna.
 * @returns {Promise<object>} Objek kriteria persewaan mobil.
 */
async function analyzePrompt(userPrompt) {
  // Dry run mode: return dummy object tanpa panggil API
  if (GEMINI_DRY) {
    return {
      city: null,
      days: null,
      people: null,
      type: null,
      budgetPerDay: { min: null, max: null },
      notes: "Dry run mode (Gemini disabled)",
    };
  }

  const prompt = buildSystemPrompt(userPrompt);

  try {
    const result = await model.generateContent({
      contents: [prompt],
      config: {
        responseMimeType: "application/json", // Meminta output JSON secara eksplisit
      },
    });

    const text = result?.response?.text?.() || "{}";

    // Karena kita menggunakan responseMimeType: "application/json",
    // hasilnya seharusnya sudah bersih dari code fences dan siap di-parse.
    const parsed = JSON.parse(text);

    return parsed;
  } catch (e) {
    // Deteksi apakah error berasal dari Gemini API
    const isGeminiError = 
      e.stack?.includes("generativelanguage.googleapis.com") ||
      e.message?.includes("generativelanguage.googleapis.com") ||
      e.name === "GoogleGenerativeAIError" ||
      (e.constructor && e.constructor.name === "GoogleGenerativeAIError");

    // Logging dengan format yang konsisten
    console.error("[AI] model=%s err=%s", MODEL_NAME, e?.message || "Unknown error");

    // Jika error dari Gemini, throw error dengan prefix AI_ERROR
    if (isGeminiError) {
      const aiError = new Error(`AI_ERROR: ${e.message || "Unknown Gemini API error"}`);
      aiError.originalError = e;
      throw aiError;
    }

    // Error lainnya (parsing, dll) - return fallback
    let errorMessage = e.message || "Unknown error";
    if (errorMessage.includes("API_KEY") || errorMessage.includes("API key") || errorMessage.includes("authentication")) {
      errorMessage = "GEMINI_API_KEY tidak valid atau tidak ditemukan. Pastikan file .env berisi GEMINI_API_KEY yang valid.";
    } else if (errorMessage.includes("fetching") || errorMessage.includes("network") || errorMessage.includes("ECONNREFUSED")) {
      errorMessage = "Tidak dapat terhubung ke Google Generative AI API. Periksa koneksi internet atau API key.";
    }

    // Fallback yang aman dan jelas jika terjadi kegagalan
    return {
      city: null,
      days: null,
      people: null,
      type: null,
      budgetPerDay: { min: null, max: null },
      notes: "Error during analysis: " + errorMessage.slice(0, 150) + (errorMessage.length > 150 ? "..." : ""),
    };
  }
}

/**
 * Test koneksi ke Gemini API dengan prompt sederhana
 * @param {string} testPrompt - Prompt untuk test (default: "balas 1 kata: ok")
 * @returns {Promise<{text: string}>} Response text dari Gemini
 */
async function pingGemini(testPrompt = "balas 1 kata: ok") {
  // Dry run mode: return dummy response
  if (GEMINI_DRY) {
    return { text: "ok (dry run)" };
  }

  if (!model) {
    throw new Error("Gemini model not initialized. Check GEMINI_API_KEY.");
  }

  try {
    const result = await model.generateContent({
      contents: [testPrompt],
    });

    const text = result?.response?.text?.() || "";
    return { text };
  } catch (e) {
    // Deteksi apakah error berasal dari Gemini API
    const isGeminiError = 
      e.stack?.includes("generativelanguage.googleapis.com") ||
      e.message?.includes("generativelanguage.googleapis.com") ||
      e.name === "GoogleGenerativeAIError" ||
      (e.constructor && e.constructor.name === "GoogleGenerativeAIError");

    console.error("[AI] ping model=%s err=%s", MODEL_NAME, e?.message || "Unknown error");

    if (isGeminiError) {
      const aiError = new Error(`AI_ERROR: ${e.message || "Unknown Gemini API error"}`);
      aiError.originalError = e;
      throw aiError;
    }

    throw e;
  }
}

module.exports = { analyzePrompt, pingGemini, MODEL_NAME };
