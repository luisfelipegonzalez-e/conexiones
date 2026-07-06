import { ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/utils';
import DesignGauge from './DesignGauge';

export default function ResultsPanel({ activeModule }: { activeModule: string }) {
  if (activeModule === 'Shear Tab') {
    return (
      <div className="w-80 shrink-0 flex flex-col gap-4 overflow-hidden">
        {/* Gauge Card */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 shadow-xl shrink-0">
           <h3 className="text-xs font-bold text-white tracking-wider mb-6">RESUMEN DE DISEÑO</h3>
           <div className="flex items-center gap-6">
             <DesignGauge value={0.72} />
             <div className="flex flex-col gap-1">
               <div className="flex items-center gap-2">
                 <span className="text-[15px] font-semibold text-green-500">Diseño OK</span>
               </div>
               <p className="text-[11px] text-gray-400 leading-relaxed mb-1">
                 Todos los componentes cumplen
               </p>
               <p className="text-[10px] text-gray-500">
                 Según AISC 360-16<br/> y NSR-10
               </p>
             </div>
           </div>
        </div>

        {/* AISC Checks */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl shadow-xl flex-1 flex flex-col overflow-hidden">
           <div className="p-4 border-b border-[#1f2937]">
             <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">VERIFICACIONES AISC 360</h3>
           </div>
           <div className="flex-1 overflow-auto p-1 scrollbar-hide">
             <table className="w-full text-left">
               <thead>
                 <tr className="text-[10px] text-gray-500 border-b border-[#1f2937]">
                   <th className="px-3 py-2 font-medium">Verificación</th>
                   <th className="px-3 py-2 font-medium text-right">DCR</th>
                   <th className="px-3 py-2 font-medium text-center">Estado</th>
                 </tr>
               </thead>
               <tbody>
                 <CheckRow label="Cortante en pernos" dcr={0.58} status="ok" />
                 <CheckRow label="Aplastamiento en platina" dcr={0.61} status="ok" />
                 <CheckRow label="Aplastamiento en alma (viga)" dcr={0.45} status="ok" />
                 <CheckRow label="Block shear" dcr={0.72} status="ok" />
                 <CheckRow label="Flexión en platina" dcr={0.72} status="warning" />
                 <CheckRow label="Soldadura (FEXX)" dcr={0.47} status="ok" />
               </tbody>
             </table>
           </div>
           <div className="p-3 border-t border-[#1f2937]">
              <button className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white bg-[#1a2333] hover:bg-[#2d3748] py-2 rounded-lg transition-colors border border-[#2d3748]">
                Ver memoria de cálculo <ArrowUpRight size={14} />
              </button>
           </div>
        </div>

        {/* NSR-10 */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 shadow-xl shrink-0">
           <h3 className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-2">NSR-10</h3>
           <div className="flex flex-col gap-2">
             <div className="flex justify-between items-center text-xs text-gray-300">
               <span>Ω0 (Zona III)</span>
               <span className="font-medium">2.50</span>
             </div>
             <div className="flex justify-between items-center text-xs text-gray-300">
               <span>V amplificado = V × Ω0</span>
               <span className="font-medium">187.5 kip</span>
             </div>
             <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-[#1f2937]">
               <span className="text-gray-400">Efecto sísmico</span>
               <span className="text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Considerado</span>
             </div>
           </div>
        </div>

        {/* Natural Language Report */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 shadow-xl shrink-0">
           <h3 className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-2">REPORTE EN LENGUAJE NATURAL</h3>
           <p className="text-xs text-gray-300 leading-relaxed mb-3">
             La conexión cumple satisfactoriamente todas las verificaciones según AISC 360-16.
           </p>
           <p className="text-xs text-gray-400 leading-relaxed mb-4">
             La verificación más crítica corresponde a flexión en platina (DCR = 0.72). 
             Existe un adecuado margen de seguridad en todos los componentes.
           </p>
           <button className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white bg-[#1a2333] hover:bg-[#2d3748] py-1.5 border border-[#2d3748] rounded-lg transition-colors">
             Ver recomendaciones
           </button>
        </div>

      </div>
    );
  }

  // Default Results Panel for End Plate and generic modules
  return (
    <div className="w-80 shrink-0 flex flex-col gap-4 overflow-hidden">
      
      {/* Gauge Card */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 shadow-xl shrink-0">
         <h3 className="text-xs font-bold text-white tracking-wider mb-6">RESUMEN DE DISEÑO</h3>
         <div className="flex items-center gap-6">
           <DesignGauge value={0.72} />
           <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
               <span className="text-[15px] font-semibold text-green-500">Diseño OK</span>
             </div>
             <p className="text-[11px] text-gray-400 leading-relaxed mb-1">
               Todos los componentes cumplen
             </p>
             <p className="text-[10px] text-gray-500">
               Según {activeModule === 'End Plate' || activeModule === 'Moment Connection' ? 'AISC 358-16' : 'AISC 360-16'}<br/> y AISC 360-16
             </p>
           </div>
         </div>
      </div>

      {/* AISC Checks */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl shadow-xl flex-1 flex flex-col overflow-hidden">
         <div className="p-4 border-b border-[#1f2937]">
           <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">VERIFICACIONES {activeModule === 'End Plate' || activeModule === 'Moment Connection' ? 'AISC 358' : 'AISC 360'}</h3>
         </div>
         <div className="flex-1 overflow-auto p-1 scrollbar-hide">
           <table className="w-full text-left">
             <thead>
               <tr className="text-[10px] text-gray-500 border-b border-[#1f2937]">
                 <th className="px-3 py-2 font-medium">Verificación</th>
                 <th className="px-3 py-2 font-medium text-right">DCR</th>
                 <th className="px-3 py-2 font-medium text-center">Estado</th>
               </tr>
             </thead>
             <tbody>
               {activeModule === 'End Plate' || activeModule === 'Moment Connection' ? (
                 <>
                   <CheckRow label="Límites Precalificación" dcr={0.41} status="ok" />
                   <CheckRow label="Geometría Conexión" dcr={0.65} status="ok" />
                   <CheckRow label="Corte en pernos" dcr={0.31} status="ok" />
                   <CheckRow label="Espesor Placa" dcr={0.72} status="warning" />
                   <CheckRow label="Desgarramiento" dcr={0.45} status="ok" />
                   <CheckRow label="Fluencia Ala Columna" dcr={0.58} status="ok" />
                   <CheckRow label="Placas de Continuidad" dcr={0.67} status="ok" />
                   <CheckRow label="Cortante panel nodal" dcr={0.55} status="ok" />
                   <CheckRow label="Soldadura (CJP)" dcr={0.47} status="ok" />
                 </>
               ) : activeModule === 'Base Plate' ? (
                 <>
                   <CheckRow label="Presión en concreto" dcr={0.65} status="ok" />
                   <CheckRow label="Espesor placa base" dcr={0.72} status="warning" />
                   <CheckRow label="Tracción en anclajes" dcr={0.42} status="ok" />
                   <CheckRow label="Cortante en anclajes" dcr={0.35} status="ok" />
                   <CheckRow label="Arrancamiento anclaje" dcr={0.58} status="ok" />
                 </>
               ) : (
                 <>
                   <CheckRow label="Corte en pernos" dcr={0.31} status="ok" />
                   <CheckRow label="Espesor Placa" dcr={0.72} status="warning" />
                   <CheckRow label="Desgarramiento" dcr={0.45} status="ok" />
                 </>
               )}
             </tbody>
           </table>
         </div>
         <div className="p-3 border-t border-[#1f2937]">
            <button className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white bg-[#1a2333] hover:bg-[#2d3748] py-2 rounded-lg transition-colors border border-[#2d3748]">
              Ver memoria de cálculo <ArrowUpRight size={14} />
            </button>
         </div>
      </div>

      {/* Natural Language Report */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 shadow-xl shrink-0">
         <h3 className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-2">REPORTE EN LENGUAJE NATURAL</h3>
         <p className="text-xs text-gray-300 leading-relaxed mb-3">
           La conexión precalificada <strong className="text-white">{activeModule}</strong> cumple satisfactoriamente todas las verificaciones según normativa aplicable.
         </p>
         <p className="text-xs text-gray-400 leading-relaxed mb-4">
           La verificación más crítica rige con DCR = 0.72. 
           Existe un adecuado margen de seguridad en todos los componentes.
         </p>
         <button className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white bg-[#1a2333] hover:bg-[#2d3748] py-1.5 border border-[#2d3748] rounded-lg transition-colors">
           Ver recomendaciones
         </button>
      </div>

    </div>
  );
}

function CheckRow({ label, dcr, status }: { label: string; dcr: number; status: 'ok' | 'warning' | 'fail' }) {
  const statusColor = {
    ok: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]',
    warning: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]',
    fail: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
  };

  return (
    <tr className="text-xs text-gray-300 hover:bg-[#1a2333] transition-colors border-b border-[#1f2937]/50 last:border-0 rounded">
      <td className="px-3 py-2.5 rounded-l">{label}</td>
      <td className="px-3 py-2.5 text-right font-medium">{dcr.toFixed(2)}</td>
      <td className="px-3 py-2.5 rounded-r">
        <div className="flex justify-center">
          <div className={cn("w-2 h-2 rounded-full", statusColor[status])} />
        </div>
      </td>
    </tr>
  );
}
