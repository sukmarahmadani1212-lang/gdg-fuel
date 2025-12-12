export interface FuelLog {
  id: string;
  date: string;
  unitName: string; // Nama Unit/Kendaraan (IO)
  type: 'KM' | 'HM'; // Kilometer atau Hour Meter
  initialReading: number; // KM/HM Awal
  finalReading: number; // KM/HM Akhir
  distance: number; // Pemakaian (Akhir - Awal) aka Selisih
  standardRatio: number; // Rasio dari PDF
  calculatedFuel: number; // Total Solar A (Hitungan Rumus)
  actualFuel: number; // Total Solar B (Isian Manual)
}

export interface AnalysisResult {
  summary: string;
  status: 'efficient' | 'average' | 'wasteful';
  recommendations: string[];
}

export interface UnitDefinition {
  io: string;
  type: 'KM' | 'HM';
  ratio: number;
}