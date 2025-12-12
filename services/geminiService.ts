import { GoogleGenAI } from "@google/genai";
import { FuelLog, AnalysisResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFuelLogs = async (logs: FuelLog[]): Promise<AnalysisResult> => {
  if (logs.length === 0) {
    return {
      summary: "Belum ada data yang cukup untuk dianalisis.",
      status: 'average',
      recommendations: ["Tambahkan data pengisian solar untuk memulai analisis."]
    };
  }

  // Prepare prompt context
  // Note: ratio here implies efficiency calculated from Actual Fuel B for analysis purposes
  const logsText = logs.slice(-10).map(log => {
    const calculatedEfficiency = log.actualFuel > 0 ? (log.distance / log.actualFuel).toFixed(2) : "N/A";
    return `- Tgl: ${log.date}, Unit: ${log.unitName}, Tipe: ${log.type}, Jarak: ${log.distance}, Solar B (Act): ${log.actualFuel}L, Rasio Act: ${calculatedEfficiency}, Std Rasio: ${log.standardRatio}`;
  }).join("\n");

  const prompt = `
    Bertindaklah sebagai ahli manajemen armada dan efisiensi bahan bakar.
    Analisis data log pengisian solar berikut ini:
    ${logsText}

    Berikan output dalam format JSON valid saja (tanpa markdown code block) dengan skema:
    {
      "summary": "Ringkasan singkat kinerja armada dan tren efisiensi dalam Bahasa Indonesia.",
      "status": "efficient" | "average" | "wasteful",
      "recommendations": ["Saran 1", "Saran 2", "Saran 3"]
    }

    Aturan:
    - Bandingkan konsumsi aktual (Solar B) dengan ekspektasi berdasarkan Standard Rasio.
    - Berikan saran teknis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Gagal menganalisis data saat ini.",
      status: 'average',
      recommendations: ["Periksa koneksi internet.", "Coba lagi nanti."]
    };
  }
};