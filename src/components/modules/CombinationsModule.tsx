import React, { useState } from 'react';
import { Layers, Plus, Trash2, RefreshCw, Save, Check, Settings2, FileText } from 'lucide-react';

interface LoadCombination {
  id: string;
  name: string;
  factors: Record<string, number>;
}

const DEFAULT_LOAD_CASES = [
  { id: 'D', name: 'Carga Muerta (D)' },
  { id: 'L', name: 'Carga Viva (L)' },
  { id: 'Lr', name: 'Carga Viva de Cubierta (Lr)' },
  { id: 'S', name: 'Nieve (S)' },
  { id: 'R', name: 'Lluvia (R)' },
  { id: 'W', name: 'Viento (W)' },
  { id: 'E', name: 'Sismo (E)' }
];

const ASCE_LRFD_COMBINATIONS: LoadCombination[] = [
  { id: 'lrfd1', name: 'LRFD 1: 1.4D', factors: { D: 1.4 } },
  { id: 'lrfd2', name: 'LRFD 2: 1.2D + 1.6L + 0.5(Lr|S|R)', factors: { D: 1.2, L: 1.6, Lr: 0.5 } },
  { id: 'lrfd3', name: 'LRFD 3: 1.2D + 1.6(Lr|S|R) + (L|0.5W)', factors: { D: 1.2, Lr: 1.6, L: 1.0 } },
  { id: 'lrfd4', name: 'LRFD 4: 1.2D + 1.0W + L + 0.5(Lr|S|R)', factors: { D: 1.2, W: 1.0, L: 1.0, Lr: 0.5 } },
  { id: 'lrfd5', name: 'LRFD 5: 1.2D + 1.0E + L + 0.2S', factors: { D: 1.2, E: 1.0, L: 1.0, S: 0.2 } },
  { id: 'lrfd6', name: 'LRFD 6: 0.9D + 1.0W', factors: { D: 0.9, W: 1.0 } },
  { id: 'lrfd7', name: 'LRFD 7: 0.9D + 1.0E', factors: { D: 0.9, E: 1.0 } },
];

const ASCE_ASD_COMBINATIONS: LoadCombination[] = [
  { id: 'asd1', name: 'ASD 1: D', factors: { D: 1.0 } },
  { id: 'asd2', name: 'ASD 2: D + L', factors: { D: 1.0, L: 1.0 } },
  { id: 'asd3', name: 'ASD 3: D + (Lr|S|R)', factors: { D: 1.0, Lr: 1.0 } },
  { id: 'asd4', name: 'ASD 4: D + 0.75L + 0.75(Lr|S|R)', factors: { D: 1.0, L: 0.75, Lr: 0.75 } },
  { id: 'asd5', name: 'ASD 5: D + (0.6W|0.7E)', factors: { D: 1.0, W: 0.6 } },
  { id: 'asd6a', name: 'ASD 6a: D + 0.75L + 0.75(0.6W) + 0.75(Lr|S|R)', factors: { D: 1.0, L: 0.75, W: 0.45, Lr: 0.75 } },
  { id: 'asd6b', name: 'ASD 6b: D + 0.75L + 0.75(0.7E) + 0.75S', factors: { D: 1.0, L: 0.75, E: 0.525, S: 0.75 } },
  { id: 'asd7', name: 'ASD 7: 0.6D + 0.6W', factors: { D: 0.6, W: 0.6 } },
  { id: 'asd8', name: 'ASD 8: 0.6D + 0.7E', factors: { D: 0.6, E: 0.7 } },
];

export default function CombinationsModule() {
  const [combinations, setCombinations] = useState<LoadCombination[]>(ASCE_LRFD_COMBINATIONS);
  const [selectedCode, setSelectedCode] = useState<'LRFD' | 'ASD'>('LRFD');

  const handleGenerate = (code: 'LRFD' | 'ASD') => {
    setSelectedCode(code);
    setCombinations(code === 'LRFD' ? [...ASCE_LRFD_COMBINATIONS] : [...ASCE_ASD_COMBINATIONS]);
  };

  const handleAddCustom = () => {
    const newCombo: LoadCombination = {
      id: `custom_${Date.now()}`,
      name: `Personalizada ${combinations.length + 1}`,
      factors: { D: 1.0 }
    };
    setCombinations([...combinations, newCombo]);
  };

  const handleRemove = (id: string) => {
    setCombinations(combinations.filter(c => c.id !== id));
  };

  const handleUpdateFactor = (comboId: string, caseId: string, value: number) => {
    setCombinations(combinations.map(combo => {
      if (combo.id === comboId) {
        const newFactors = { ...combo.factors };
        if (value === 0 || isNaN(value)) {
          delete newFactors[caseId];
        } else {
          newFactors[caseId] = value;
        }
        return { ...combo, factors: newFactors };
      }
      return combo;
    }));
  };

  const handleUpdateName = (comboId: string, name: string) => {
    setCombinations(combinations.map(combo => {
      if (combo.id === comboId) return { ...combo, name };
      return combo;
    }));
  };

  const handleDownloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nombre Combinacion," + DEFAULT_LOAD_CASES.map(lc => lc.id).join(",") + "\n";
    
    combinations.forEach(combo => {
      let row = `"${combo.name}",`;
      row += DEFAULT_LOAD_CASES.map(lc => combo.factors[lc.id] || 0).join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `combinaciones_carga_${selectedCode.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b1121] text-slate-200">
      <div className="flex items-center justify-between p-6 border-b border-[#1f2937] bg-[#0d1527]">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Layers className="text-blue-500" />
            Combinaciones de Carga
          </h1>
          <p className="text-sm text-slate-400">
            Define y gestiona las combinaciones de carga para el análisis estructural.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-[#1f2937] text-slate-300 rounded-lg hover:bg-[#2d3748] text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <Save size={16} /> Exportar CSV
          </button>
          <button
            onClick={() => handleGenerate('LRFD')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              selectedCode === 'LRFD' 
                ? 'bg-blue-600 text-white' 
                : 'bg-[#1f2937] text-slate-300 hover:bg-[#2d3748]'
            }`}
          >
            <RefreshCw size={16} /> ASCE 7 LRFD
          </button>
          <button
            onClick={() => handleGenerate('ASD')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              selectedCode === 'ASD' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-[#1f2937] text-slate-300 hover:bg-[#2d3748]'
            }`}
          >
            <RefreshCw size={16} /> ASCE 7 ASD
          </button>
          <button
            onClick={handleAddCustom}
            className="px-4 py-2 bg-[#1f2937] text-slate-200 rounded-lg hover:bg-slate-700 text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Nueva
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f172a] border-b border-[#1f2937] text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="p-4 font-semibold w-64">Nombre Combinación</th>
                  {DEFAULT_LOAD_CASES.map(lc => (
                    <th key={lc.id} className="p-4 font-semibold text-center w-24" title={lc.name}>
                      {lc.id}
                    </th>
                  ))}
                  <th className="p-4 font-semibold w-16 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2937]">
                {combinations.map((combo) => (
                  <tr key={combo.id} className="hover:bg-[#1a2333] transition-colors">
                    <td className="p-3">
                      <input
                        type="text"
                        value={combo.name}
                        onChange={(e) => handleUpdateName(combo.id, e.target.value)}
                        className="w-full bg-transparent border-none text-slate-200 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                      />
                    </td>
                    {DEFAULT_LOAD_CASES.map(lc => (
                      <td key={lc.id} className="p-3">
                        <div className="flex justify-center">
                          <input
                            type="number"
                            step="0.05"
                            value={combo.factors[lc.id] || ''}
                            onChange={(e) => handleUpdateFactor(combo.id, lc.id, parseFloat(e.target.value))}
                            placeholder="-"
                            className="w-16 bg-[#0b1121] border border-[#2d3748] rounded text-center text-sm py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                      </td>
                    ))}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRemove(combo.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {combinations.length === 0 && (
                  <tr>
                    <td colSpan={DEFAULT_LOAD_CASES.length + 2} className="p-8 text-center text-slate-500">
                      No hay combinaciones definidas. Genera combinaciones desde la barra superior o añade una personalizada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 bg-blue-900/20 border border-blue-900/50 rounded-lg p-4 flex items-start gap-3">
          <FileText className="text-blue-400 mt-0.5 shrink-0" size={18} />
          <div className="text-sm text-blue-200/80 leading-relaxed">
            <strong className="text-blue-300">Nota sobre Combinaciones:</strong> Estas combinaciones se basan en ASCE 7. Revisa y ajusta los factores según las necesidades específicas de tu proyecto, especialmente para consideraciones de dirección de viento, sismo ortogonal (100% + 30%), y factores de importancia.
          </div>
        </div>
      </div>
    </div>
  );
}
