import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, ChevronDown } from 'lucide-react';
import { FuelLog } from '../types';
import { UNIT_DATA } from '../unitData';

interface AddLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: FuelLog) => void;
  existingLogs: FuelLog[];
}

export const AddLogModal: React.FC<AddLogModalProps> = ({ isOpen, onClose, onSave, existingLogs }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    unitName: '',
    type: 'KM' as 'KM' | 'HM',
    initialReading: '',
    finalReading: '',
    standardRatio: 0,
    actualFuel: '',
  });

  const [calculatedSolarA, setCalculatedSolarA] = useState<string>('');
  
  // Search state
  const [filteredUnits, setFilteredUnits] = useState(UNIT_DATA);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        unitName: '',
        type: 'KM',
        initialReading: '',
        finalReading: '',
        standardRatio: 0,
        actualFuel: '',
      });
      setCalculatedSolarA('');
      setFilteredUnits(UNIT_DATA);
      setShowSuggestions(false);
    }
  }, [isOpen]);

  // Handle Search Input Change
  const handleUnitNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, unitName: value }));
    
    const filtered = UNIT_DATA.filter(unit => 
      unit.io.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUnits(filtered);
    setShowSuggestions(true);
  };

  // Handle Selection from Dropdown
  const selectUnit = (unit: typeof UNIT_DATA[0]) => {
    const selectedIO = unit.io;
    let initial = '';

    // Find last reading for this unit
    if (selectedIO) {
      const unitLogs = existingLogs
        .filter(log => log.unitName === selectedIO)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (unitLogs.length > 0) {
        initial = unitLogs[0].finalReading.toString();
      }
    }

    setFormData(prev => ({
      ...prev,
      unitName: selectedIO,
      type: unit.type,
      standardRatio: unit.ratio,
      initialReading: initial,
      finalReading: '' 
    }));
    setShowSuggestions(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Auto Calculate Solar A
  useEffect(() => {
    const start = parseFloat(formData.initialReading);
    const end = parseFloat(formData.finalReading);
    const ratio = formData.standardRatio;

    if (!isNaN(start) && !isNaN(end) && !isNaN(ratio) && ratio > 0 && end > start) {
      const diff = end - start;
      let result = 0;
      if (formData.type === 'KM') {
        // (Akhir - Awal) / Rasio
        result = diff / ratio;
      } else {
        // (Akhir - Awal) * Rasio
        result = diff * ratio;
      }
      setCalculatedSolarA(result.toFixed(2));
    } else {
      setCalculatedSolarA('');
    }
  }, [formData.initialReading, formData.finalReading, formData.standardRatio, formData.type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = parseFloat(formData.initialReading);
    const end = parseFloat(formData.finalReading);
    const actualFuel = parseFloat(formData.actualFuel);
    const calcFuel = parseFloat(calculatedSolarA);

    if (isNaN(start) || isNaN(end) || isNaN(actualFuel) || !formData.unitName) {
      alert("Mohon lengkapi semua data!");
      return;
    }

    if (end < start) {
      alert("Pembacaan akhir harus lebih besar dari awal!");
      return;
    }

    const distance = end - start;

    const newLog: FuelLog = {
      id: crypto.randomUUID(),
      date: formData.date,
      unitName: formData.unitName,
      type: formData.type,
      initialReading: start,
      finalReading: end,
      distance,
      standardRatio: formData.standardRatio,
      calculatedFuel: isNaN(calcFuel) ? 0 : calcFuel,
      actualFuel: actualFuel
    };

    onSave(newLog);
    onClose();
  };

  const startVal = parseFloat(formData.initialReading);
  const endVal = parseFloat(formData.finalReading);
  const currentDifference = (!isNaN(startVal) && !isNaN(endVal)) ? (endVal - startVal).toFixed(1) : '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Input Data Solar
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal</label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            {/* Searchable Unit Input */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Pilih Unit (IO)</label>
              <div className="relative">
                <input
                  type="text"
                  name="unitName"
                  placeholder="Ketik Unit..."
                  required
                  autoComplete="off"
                  value={formData.unitName}
                  onChange={handleUnitNameChange}
                  onFocus={() => {
                    setFilteredUnits(
                        formData.unitName 
                        ? UNIT_DATA.filter(u => u.io.toLowerCase().includes(formData.unitName.toLowerCase()))
                        : UNIT_DATA
                    );
                    setShowSuggestions(true);
                  }}
                  onBlur={() => {
                      // Small delay to allow click event on suggestion to process
                      setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                
                {showSuggestions && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto left-0">
                    {filteredUnits.length > 0 ? (
                      filteredUnits.map((unit) => (
                        <button
                          key={unit.io}
                          type="button"
                          onClick={() => selectUnit(unit)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="font-medium text-gray-900">{unit.io}</div>
                          <div className="text-[10px] text-gray-500 flex justify-between">
                             <span>{unit.type}</span>
                             <span>Rasio: {unit.ratio}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">Unit tidak ditemukan</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-medium text-gray-700 mb-1">Tipe Meter</label>
               <input 
                 type="text" 
                 value={formData.type} 
                 readOnly 
                 className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 font-medium"
               />
             </div>
             <div>
               <label className="block text-xs font-medium text-gray-700 mb-1">Rasio Standar</label>
               <input 
                 type="number" 
                 value={formData.standardRatio} 
                 readOnly 
                 className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 font-medium"
               />
             </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Awal</label>
              <input
                type="number"
                name="initialReading"
                placeholder="0"
                step="0.1"
                required
                value={formData.initialReading}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Akhir</label>
              <input
                type="number"
                name="finalReading"
                placeholder="0"
                step="0.1"
                required
                value={formData.finalReading}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Selisih</label>
              <input
                type="text"
                readOnly
                value={currentDifference}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 focus:outline-none cursor-not-allowed font-medium text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">Total Solar A (Est)</label>
                <div className="relative">
                <input
                    type="text"
                    readOnly
                    value={calculatedSolarA}
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 font-bold outline-none"
                />
                <span className="absolute right-3 top-2 text-blue-400 text-sm">L</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Otomatis: {formData.type === 'KM' ? 'Jarak / Rasio' : 'Jarak x Rasio'}</p>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Total Solar B (Manual)</label>
                <div className="relative">
                <input
                    type="number"
                    name="actualFuel"
                    placeholder="0"
                    step="0.1"
                    required
                    value={formData.actualFuel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="absolute right-3 top-2 text-gray-400 text-sm">L</span>
                </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 mt-2"
          >
            <Save className="w-5 h-5" />
            Simpan Data
          </button>
        </form>
      </div>
    </div>
  );
};