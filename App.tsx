import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Fuel, 
  TrendingUp, 
  Gauge, 
  Activity, 
  Trash2, 
  Sparkles,
  Search,
  AlertCircle,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { FuelLog, AnalysisResult } from './types';
import { StatCard } from './components/StatCard';
import { AddLogModal } from './components/AddLogModal';
import { analyzeFuelLogs } from './services/geminiService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const App: React.FC = () => {
  const [logs, setLogs] = useState<FuelLog[]>(() => {
    const saved = localStorage.getItem('solarTrackLogs');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Persist logs
  useEffect(() => {
    localStorage.setItem('solarTrackLogs', JSON.stringify(logs));
  }, [logs]);

  const handleAddLog = (newLog: FuelLog) => {
    setLogs(prev => [newLog, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleDeleteLog = (id: string) => {
    if (confirm('Yakin ingin menghapus data ini?')) {
      setLogs(prev => prev.filter(log => log.id !== id));
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeFuelLogs(logs);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  // Derived Statistics
  const stats = useMemo(() => {
    if (logs.length === 0) return { totalFuel: 0, totalDistance: 0, avgRatio: 0 };
    const totalFuel = logs.reduce((acc, log) => acc + log.actualFuel, 0); // Use Actual Fuel
    const totalDistance = logs.reduce((acc, log) => acc + log.distance, 0);
    const avgRatio = totalDistance / totalFuel;
    return { totalFuel, totalDistance, avgRatio };
  }, [logs]);

  // Filter logs for table
  const filteredLogs = logs.filter(log => 
    log.unitName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.date.includes(searchTerm)
  );

  // Prepare Chart Data
  const chartData = [...logs].reverse().map(log => ({
    date: new Date(log.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    efficiency: log.actualFuel > 0 ? parseFloat((log.distance / log.actualFuel).toFixed(2)) : 0,
    unit: log.unitName
  }));

  // --- Export Functions ---

  const downloadExcel = () => {
    if (filteredLogs.length === 0) return alert("Tidak ada data untuk diunduh.");
    
    // Create CSV content
    const headers = ["Tanggal", "Unit", "Tipe", "Meter Awal", "Meter Akhir", "Selisih", "Rasio Std", "Solar A (Est)", "Solar B (Act)"];
    const rows = filteredLogs.map(log => [
      log.date,
      log.unitName,
      log.type,
      log.initialReading,
      log.finalReading,
      log.distance,
      log.standardRatio,
      log.calculatedFuel,
      log.actualFuel
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Solar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    if (filteredLogs.length === 0) return alert("Tidak ada data untuk diunduh.");

    const doc = new jsPDF();
    doc.text("Laporan Harian Pengisian Solar", 14, 15);
    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

    const tableColumn = ["Tanggal", "Unit", "Tipe", "Awal", "Akhir", "Selisih", "Rasio", "Solar A", "Solar B"];
    const tableRows = filteredLogs.map(log => [
      log.date,
      log.unitName,
      log.type,
      log.initialReading,
      log.finalReading,
      log.distance,
      log.standardRatio,
      log.calculatedFuel.toFixed(2),
      log.actualFuel
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] } // Blue header
    });

    doc.save(`Laporan_Solar_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Fuel className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">SolarTrack <span className="text-blue-600">Pro</span></h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Input Data</span>
            <span className="sm:hidden">Baru</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Solar B (Aktual)" 
            value={`${stats.totalFuel.toLocaleString('id-ID')} L`}
            subValue="Realisasi pengisian"
            icon={Fuel}
            colorClass="bg-orange-500"
          />
          <StatCard 
            title="Total Jarak/Durasi" 
            value={`${stats.totalDistance.toLocaleString('id-ID')}`}
            subValue="KM atau HM gabungan"
            icon={Gauge}
            colorClass="bg-blue-500"
          />
          <StatCard 
            title="Rata-rata Efisiensi (Act)" 
            value={isNaN(stats.avgRatio) ? '0.00' : stats.avgRatio.toFixed(2)}
            subValue="Berdasarkan Solar B"
            icon={Activity}
            colorClass={stats.avgRatio > 3 ? "bg-green-500" : "bg-yellow-500"} 
          />
        </div>

        {/* Charts & AI Analysis Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-500" />
                Tren Efisiensi (Aktual)
              </h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRatio" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="efficiency" stroke="#2563eb" fillOpacity={1} fill="url(#colorRatio)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Smart Analysis
              </h2>
              <button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || logs.length === 0}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  isAnalyzing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {isAnalyzing ? 'Menganalisis...' : 'Analisis Sekarang'}
              </button>
            </div>
            
            <div className="flex-1 bg-gray-50 rounded-xl p-4 overflow-y-auto min-h-[200px]">
              {analysis ? (
                <div className="space-y-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    analysis.status === 'efficient' ? 'bg-green-100 text-green-700' :
                    analysis.status === 'wasteful' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    <Activity className="w-3 h-3" />
                    Status: {analysis.status === 'efficient' ? 'Efisien' : analysis.status === 'wasteful' ? 'Boros' : 'Rata-rata'}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {analysis.summary}
                  </p>
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Rekomendasi</h4>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 bg-white p-2 rounded border border-gray-100">
                          <span className="text-blue-500 font-bold">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-3">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <Sparkles className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm max-w-[200px]">Klik tombol analisis untuk mendapatkan wawasan efisiensi dari Gemini AI.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900">Riwayat Pengisian</h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
               <div className="flex gap-2">
                 <button onClick={downloadExcel} className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-200 hover:bg-green-100">
                   <FileSpreadsheet className="w-4 h-4" /> Excel
                 </button>
                 <button onClick={downloadPDF} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200 hover:bg-red-100">
                   <FileDown className="w-4 h-4" /> PDF
                 </button>
               </div>
               <div className="relative">
                <input 
                  type="text" 
                  placeholder="Cari Unit atau Tanggal..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Awal</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Akhir</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Selisih</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Rasio</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right text-blue-600">Solar A (Est)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right text-green-600">Solar B (Act)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: '2-digit', year: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100">
                          {log.unitName}
                        </span>
                        <span className="ml-1 text-[10px] text-gray-400">{log.type}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-right font-mono">
                        {log.initialReading.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-right font-mono">
                        {log.finalReading.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-right font-mono font-bold bg-gray-50/50">
                        {log.distance.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-right">
                         {log.standardRatio}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-600 text-right font-bold">
                        {log.calculatedFuel.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600 text-right font-bold border-l border-gray-100 bg-green-50/20">
                        {log.actualFuel.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400 bg-gray-50/30">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-gray-300" />
                        <p>Tidak ada data ditemukan.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <AddLogModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddLog} 
        existingLogs={logs}
      />
    </div>
  );
};

export default App;