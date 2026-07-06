import { FileDown, Maximize2 } from 'lucide-react';
import ConnectionDrawing from './ConnectionDrawing';

export default function MainView({ onExportPdf, isGeneratingPdf, activeModule }: { onExportPdf: () => void, isGeneratingPdf: boolean, activeModule: string }) {
  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Visualizer Panel */}
      <div className="flex-1 bg-[#111827] border border-[#1f2937] rounded-xl flex flex-col overflow-hidden relative shadow-xl">
        <div className="h-12 border-b border-[#1f2937] flex items-center px-2">
          <button className="px-4 py-1.5 text-sm font-medium text-blue-500 border-b-2 border-blue-500 bg-blue-500/5 rounded-t-md">
            VISTA 2D
          </button>
          <button className="px-4 py-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">
            VISTA 3D
          </button>
          <div className="ml-auto flex gap-2 pr-2">
             <button className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-[#1a2333] transition-colors">
               <Maximize2 size={16} />
             </button>
          </div>
        </div>
        
        {/* Connection Drawing SVG */}
        <div className="flex-1 bg-[#090e17] flex border-b border-[#1f2937] items-center justify-center p-8 relative">
           <div className="w-[400px] h-[300px]">
             <ConnectionDrawing activeModule={activeModule} />
           </div>
           
           {/* Dimension Tags Floating */}
           <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#1a2333]/80 p-2 rounded border border-[#2d3748] text-xs text-gray-300">
             {activeModule === 'Shear Tab' ? (
               <>Viga: W18X35<br/>Columna: HSS10X6X3/8</>
             ) : activeModule === 'Double Angle' ? (
               <>Viga Sop.: W16X26<br/>Viga Prin.: W21X44</>
             ) : activeModule === 'Base Plate' ? (
               <>Columna: W12X96<br/>Base: 18x20x1.5"</>
             ) : (
               <>Viga: IPE 450<br/>Columna: HEB 450</>
             )}
           </div>
        </div>
      </div>

      {/* Bottom Panel Split */}
      <div className="h-64 flex gap-4 shrink-0">
        
        {/* PDF Preview */}
        <div className="flex-1 bg-[#111827] border border-[#1f2937] rounded-xl flex flex-col overflow-hidden shadow-xl">
           <div className="p-3 border-b border-[#1f2937] flex items-center justify-between">
             <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">VISTA PREVIA DEL INFORME PDF</h3>
             <button onClick={onExportPdf} className="text-gray-400 hover:text-white transition-colors">
               <FileDown size={14} />
             </button>
           </div>
           <div className="flex-1 bg-[#1a2333]/30 p-4 flex gap-3 overflow-x-auto justify-center">
             {/* Thumbnail Pages */}
             {[1, 2, 3].map(page => (
               <div key={page} className="w-32 h-full bg-white relative rounded shadow-sm border border-gray-300 flex flex-col p-2 shrink-0">
                 <div className="w-full h-1 bg-blue-800 mb-2"></div>
                 <div className="w-3/4 h-0.5 bg-gray-400 mb-1"></div>
                 <div className="w-1/2 h-0.5 bg-gray-400 mb-4"></div>
                 <div className="flex-1 bg-gray-100 rounded border border-gray-200"></div>
                 <div className="w-full h-0.5 bg-gray-300 mt-2"></div>
               </div>
             ))}
           </div>
           <div className="p-3 border-t border-[#1f2937]">
             <button onClick={onExportPdf} disabled={isGeneratingPdf} className={`w-full py-1.5 flex items-center justify-center gap-2 text-sm text-gray-300 ${isGeneratingPdf ? 'bg-[#2d3748] cursor-wait' : 'bg-[#1a2333] hover:bg-[#2d3748]'} border border-[#2d3748] rounded-lg transition-colors shadow`}>
               {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'} <FileDown size={14} />
             </button>
           </div>
        </div>

        {/* Info Box */}
        <div className="flex-1 bg-[#111827] border border-[#1f2937] rounded-xl flex flex-col overflow-hidden shadow-xl">
           <div className="p-3 border-b border-[#1f2937]">
             <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">INFORMACIÓN GENERAL</h3>
           </div>
           <div className="p-4 flex flex-col gap-3 flex-1 overflow-auto">
             <InfoRow label="Proyecto:" value="Edificio Corporativo" />
             <InfoRow label="Descripción:" value={`Conexión ${activeModule}`} />
             <InfoRow label="Diseñador:" value="A. Valencia" />
             <InfoRow label="Fecha:" value="16 Junio 2026" />
             <InfoRow label="Normas:" value={activeModule === 'End Plate' || activeModule === 'Moment Connection' ? 'AISC 358-16, AISC 360-16' : 'AISC 360-16'} />
             <InfoRow label="Unidades:" value={activeModule === 'Shear Tab' || activeModule === 'Double Angle' || activeModule === 'Base Plate' ? 'Pulgadas, Kip' : 'Milimetros, Tonnef'} />
           </div>
           <div className="p-3 border-t border-[#1f2937] text-center">
             <button className="text-xs text-blue-500 hover:text-blue-400 font-medium tracking-wide">
               Editar información
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-200 font-medium">{value}</span>
    </div>
  );
}
