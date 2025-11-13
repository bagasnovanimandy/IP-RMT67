const express = require("express");
const { Op } = require("sequelize");
const { analyzePrompt, pingGemini, MODEL_NAME } = require("../helpers/gemini");
const { Vehicle, Branch } = require("../models");

const router = express.Router();

/**
 * GET /api/ai/ping
 * Test koneksi ke Gemini API
 */
router.get("/ping", async (req, res) => {
  try {
    const result = await pingGemini("balas 1 kata: ok");
    return res.status(200).json({
      ok: true,
      model: MODEL_NAME,
      text: result.text,
    });
  } catch (err) {
    // Cek apakah error dari Gemini
    const isAIError = err.message?.startsWith("AI_ERROR:");
    
    if (isAIError) {
      return res.status(500).json({
        ok: false,
        source: "gemini",
        message: err.message.replace("AI_ERROR: ", ""),
      });
    }
    
    // Error lainnya (server error)
    return res.status(500).json({
      ok: false,
      source: "server",
      message: err.message || "Internal server error",
    });
  }
});

/**
 * POST /api/ai/recommend
 * body: { prompt: string }
 * return: {
 *   reason: string,
 *   filters: { city, min, max, type, people, days },
 *   data: Vehicle[],
 *   meta: { total }
 * }
 */
router.post("/recommend", async (req, res, next) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: "Prompt tidak boleh kosong" });
    }

    // 1) Analisis prompt via Gemini (termasuk ekstraksi originCity)
    const ai = await analyzePrompt(prompt);
    
    // Ambil originCity dari AI analysis (bukan dari request body)
    const originCity = ai?.originCity || undefined;
    
    // Fallback parsing sederhana jika AI gagal (dari notes error)
    const isAIFailed = ai?.notes?.includes("Error during analysis");
    
    // Extract people dari prompt secara manual jika AI gagal
    let extractedPeople = undefined;
    if (isAIFailed) {
      // Regex untuk mencari pola "X orang", "X people", "keluarga X", dll
      const peoplePatterns = [
        /(\d+)\s*orang/i,           // "6 orang"
        /keluarga\s*(\d+)\s*orang/i, // "keluarga 6 orang"
        /keluarga\s*(\d+)/i,         // "keluarga 6"
        /(\d+)\s*people/i,          // "6 people"
        /(\d+)\s*penumpang/i,        // "6 penumpang"
        /(\d+)\s*person/i,           // "6 person"
      ];
      
      for (const pattern of peoplePatterns) {
        const match = prompt.match(pattern);
        if (match) {
          extractedPeople = parseInt(match[1], 10);
          if (!isNaN(extractedPeople) && extractedPeople >= 1) {
            break;
          }
        }
      }
    }
    
    const city = ai?.city || undefined;
    const type = ai?.type || undefined;
    const days = ai?.days || undefined;
    const min = ai?.budgetPerDay?.min || undefined;
    const max = ai?.budgetPerDay?.max || undefined;

    // Normalisasi people: Number(ai.people); bila NaN atau < 1, set undefined
    // Gunakan extractedPeople jika AI gagal
    let people = extractedPeople !== undefined ? extractedPeople : Number(ai?.people);
    if (isNaN(people) || people < 1) {
      people = undefined;
    }

    // 2) Bangun kondisi query vehicles
    const where = {};

    // Harga
    if (min || max) {
      if (min && max) where.dailyPrice = { [Op.between]: [+min, +max] };
      else if (min) where.dailyPrice = { [Op.gte]: +min };
      else if (max) where.dailyPrice = { [Op.lte]: +max };
    }

    // Type kendaraan (kolom "type" atau ikut name/brand)
    if (type) {
      const term = `%${type}%`;
      where[Op.or] = [
        { type: { [Op.iLike]: term } },
        { name: { [Op.iLike]: term } },
        { brand: { [Op.iLike]: term } },
      ];
    }

    // Hard filter seat: seat >= people jika people terdefinisi
    if (people !== undefined) {
      where.seat = { [Op.gte]: people };
    }

    // Jika people >= 6, exclude city car/hatchback
    if (people >= 6) {
      const excludeTerms = ["Ayla", "Agya", "Brio", "Calya", "Sigra", "Karimun", "Spark", "Go+"];
      // Exclude jika name, brand, atau type mengandung salah satu term
      const excludeConditions = excludeTerms.map(term => ({
        [Op.or]: [
          { name: { [Op.iLike]: `%${term}%` } },
          { brand: { [Op.iLike]: `%${term}%` } },
          { type: { [Op.iLike]: `%${term}%` } },
        ],
      }));
      
      // Gabungkan dengan Op.and untuk exclude semua terms
      if (where[Op.and]) {
        where[Op.and].push({ [Op.not]: { [Op.or]: excludeConditions } });
      } else {
        where[Op.and] = [{ [Op.not]: { [Op.or]: excludeConditions } }];
      }
    }

    // 3) Include branch + filter city
    // Prioritas: originCity (lokasi awal dari AI) > city (destination dari AI analysis)
    // Jika originCity ada, gunakan untuk filter branch (cabang terdekat dengan lokasi awal)
    const branchCity = originCity || city || undefined;
    const include = [
      {
        model: Branch,
        required: false,
        where: branchCity ? { city: branchCity } : undefined,
        attributes: ["id", "name", "city", "address"],
      },
    ];

    let rows = await Vehicle.findAll({
      where,
      include,
      order: [["dailyPrice", "ASC"]],
      limit: 18,
    });

    // Fallback: bila hasil kosong dan people ada, relaks ke seat >= people - 1 tapi minimal 5
    if (rows.length === 0 && people !== undefined) {
      const relaxedSeat = Math.max(people - 1, 5);
      const relaxedWhere = { ...where };
      relaxedWhere.seat = { [Op.gte]: relaxedSeat };
      
      // Hapus exclude city car jika ada (untuk fallback)
      if (relaxedWhere[Op.and]) {
        relaxedWhere[Op.and] = relaxedWhere[Op.and].filter(cond => {
          // Hapus kondisi exclude city car (yang memiliki Op.not)
          return !cond[Op.not];
        });
      }

      rows = await Vehicle.findAll({
        where: relaxedWhere,
        include,
        order: [["dailyPrice", "ASC"]],
        limit: 18,
      });
    }

    return res.status(200).json({
      reason: ai?.notes || "Analisis AI",
      filters: {
        city: branchCity || null,
        originCity: originCity || null,
        min: min ? +min : null,
        max: max ? +max : null,
        type: type || null,
        people: people !== undefined ? +people : null,
        days: days ? +days : null,
      },
      data: rows,
      meta: { total: rows.length },
    });
  } catch (err) {
    // Cek apakah error dari Gemini API (upstream)
    const isAIError = err.message?.startsWith("AI_ERROR:");
    
    if (isAIError) {
      // Return 502 Bad Gateway untuk AI service unavailable
      return res.status(502).json({
        message: "AI service unavailable",
        detail: err.message.replace("AI_ERROR: ", ""),
      });
    }
    
    // Error lainnya (server error) - teruskan ke errorHandler
    next(err);
  }
});

module.exports = router;
