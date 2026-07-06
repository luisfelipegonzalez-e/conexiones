import React from 'react';
import ConnectionDrawing from './ConnectionDrawing';

export default function ReportImage({ description, activeModule }: { description: string, activeModule: string }) {
  
  if (description.includes("VISTA 3D")) {
    return (
       <svg viewBox="0 0 400 300" className="w-full h-full">
         <g transform="translate(200, 150) rotate(-30) skewX(30)">
           {/* Simple isometric drawing of H column */}
           <rect x="-80" y="-120" width="160" height="20" fill="#475569" stroke="#1e293b"/>
           <rect x="-20" y="-100" width="40" height="200" fill="#475569" stroke="#1e293b"/>
           <rect x="-80" y="100" width="160" height="20" fill="#475569" stroke="#1e293b"/>
         </g>
         <text x="200" y="280" textAnchor="middle" fill="#64748b" fontSize="14" fontStyle="italic">Vista 3D Isométrica</text>
       </svg>
    )
  }
  
  if (description.includes("Sección HEB")) {
    return (
       <svg viewBox="0 0 200 200" className="w-full h-full">
         <rect x="50" y="20" width="100" height="20" fill="#334155" />
         <rect x="90" y="40" width="20" height="120" fill="#334155" />
         <rect x="50" y="160" width="100" height="20" fill="#334155" />
         
         <line x1="40" y1="20" x2="40" y2="180" stroke="#64748b" />
         <text x="20" y="100" fill="#64748b" fontSize="12">dc</text>
         
         <line x1="50" y1="10" x2="150" y2="10" stroke="#64748b" />
         <text x="100" y="8" fill="#64748b" fontSize="12" textAnchor="middle">bcf</text>
       </svg>
    );
  }

  if (description.includes("perfil viga")) {
    return (
       <svg viewBox="0 0 200 200" className="w-full h-full">
         <rect x="60" y="20" width="80" height="20" fill="#0f766e" />
         <rect x="95" y="40" width="10" height="120" fill="#0f766e" />
         <rect x="60" y="160" width="80" height="20" fill="#0f766e" />
         
         <line x1="50" y1="20" x2="50" y2="180" stroke="#64748b" />
         <text x="35" y="100" fill="#64748b" fontSize="12">d</text>
         
         <line x1="60" y1="10" x2="140" y2="10" stroke="#64748b" />
         <text x="100" y="8" fill="#64748b" fontSize="12" textAnchor="middle">bf</text>
       </svg>
    );
  }

  if (description.includes("Tabla 6.1") || description.includes("Yield Line Mechanism Parameter")) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white p-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-2 text-sm text-slate-700">Parámetro</th>
              <th className="border border-slate-300 p-2 text-sm text-slate-700">Valor Mínimo</th>
              <th className="border border-slate-300 p-2 text-sm text-slate-700">Valor Máximo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 p-2 text-sm font-mono text-slate-600">t_p</td>
              <td className="border border-slate-300 p-2 text-sm text-slate-600">1/2 in</td>
              <td className="border border-slate-300 p-2 text-sm text-slate-600">2 in</td>
            </tr>
            <tr className="bg-slate-50">
              <td className="border border-slate-300 p-2 text-sm font-mono text-slate-600">b_p</td>
              <td className="border border-slate-300 p-2 text-sm text-slate-600">7 in</td>
              <td className="border border-slate-300 p-2 text-sm text-slate-600">15 in</td>
            </tr>
            <tr>
              <td className="border border-slate-300 p-2 text-sm font-mono text-slate-600">g</td>
              <td className="border border-slate-300 p-2 text-sm text-slate-600">3 in</td>
              <td className="border border-slate-300 p-2 text-sm text-slate-600">6 in</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (description.includes("Detalle isométrico")) {
    return (
      <svg viewBox="0 0 400 300" className="w-full h-full">
         <g transform="translate(180, 160) rotate(-20) skewX(20) scale(0.9)">
           {/* Columna */}
           <rect x="-80" y="-120" width="160" height="20" fill="#475569" stroke="#1e293b"/>
           <rect x="-20" y="-100" width="40" height="200" fill="#475569" stroke="#1e293b"/>
           <rect x="-80" y="100" width="160" height="20" fill="#475569" stroke="#1e293b"/>
           {/* Viga */}
           <rect x="80" y="-30" width="120" height="15" fill="#0f766e" stroke="#115e59"/>
           <rect x="80" y="-15" width="120" height="70" fill="#0f766e" stroke="#115e59" opacity="0.8"/>
           <rect x="80" y="55" width="120" height="15" fill="#0f766e" stroke="#115e59"/>
           {/* Esfuerzos */}
           <polygon points="120,-30 160,-60 140,-30" fill="#ef4444" opacity="0.7"/>
           <polygon points="120,70 160,100 140,70" fill="#3b82f6" opacity="0.7"/>
         </g>
         <text x="200" y="280" textAnchor="middle" fill="#64748b" fontSize="12" fontStyle="italic">Distribución de Esfuerzos</text>
      </svg>
    );
  }

  if (description.includes("Vista lateral zona protegida")) {
    return (
      <svg viewBox="0 0 400 300" className="w-full h-full">
         <rect x="100" y="50" width="40" height="200" fill="#475569" stroke="#334155" />
         <rect x="140" y="120" width="200" height="60" fill="#0f766e" stroke="#115e59" />
         <rect x="140" y="100" width="20" height="100" fill="#d97706" />
         
         {/* Zona Protegida */}
         <rect x="180" y="110" width="100" height="80" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5"/>
         <text x="230" y="90" textAnchor="middle" fill="#ef4444" fontSize="12">Zona Protegida (Sh)</text>
         <path d="M 180 100 L 180 105 M 280 100 L 280 105 M 180 102 L 280 102" stroke="#ef4444" strokeWidth="1"/>
      </svg>
    );
  }

  if (description.includes("Dimensionamiento placa extrema")) {
    return (
      <svg viewBox="0 0 400 300" className="w-full h-full">
         <rect x="150" y="50" width="100" height="200" fill="#d97706" stroke="#b45309" strokeWidth="2" />
         {/* Pernos */}
         <circle cx="170" cy="80" r="6" fill="#0f172a" />
         <circle cx="230" cy="80" r="6" fill="#0f172a" />
         <circle cx="170" cy="120" r="6" fill="#0f172a" />
         <circle cx="230" cy="120" r="6" fill="#0f172a" />
         <circle cx="170" cy="180" r="6" fill="#0f172a" />
         <circle cx="230" cy="180" r="6" fill="#0f172a" />
         <circle cx="170" cy="220" r="6" fill="#0f172a" />
         <circle cx="230" cy="220" r="6" fill="#0f172a" />

         {/* Cotas */}
         <line x1="140" y1="80" x2="140" y2="120" stroke="#64748b" />
         <text x="130" y="105" fill="#64748b" fontSize="10" textAnchor="end">pfi</text>
         <line x1="170" y1="40" x2="230" y2="40" stroke="#64748b" />
         <text x="200" y="30" fill="#64748b" fontSize="10" textAnchor="middle">g</text>
      </svg>
    );
  }

  if (description.includes("cuerpo libre en la rótula plástica")) {
    return (
      <svg viewBox="0 0 400 300" className="w-full h-full">
         <rect x="150" y="140" width="200" height="20" fill="#0f766e" stroke="#115e59" opacity="0.5"/>
         <circle cx="200" cy="150" r="8" fill="#ef4444" />
         
         <path d="M 200 150 Q 230 110 260 150" fill="none" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow)" />
         <text x="230" y="100" textAnchor="middle" fill="#3b82f6" fontSize="12">M_pr</text>
         
         <line x1="200" y1="150" x2="200" y2="200" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow)" />
         <text x="220" y="180" fill="#ef4444" fontSize="12">V_u</text>

         <defs>
           <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
             <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
           </marker>
         </defs>
      </svg>
    );
  }

  if (description.includes("Yield Line Pattern")) {
    return (
      <svg viewBox="0 0 400 300" className="w-full h-full">
         {/* Flange face */}
         <rect x="120" y="50" width="160" height="200" fill="#475569" stroke="#334155" />
         
         {/* Yield lines */}
         <path d="M 120 100 L 160 150 L 120 200" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4,4" />
         <path d="M 280 100 L 240 150 L 280 200" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4,4" />
         <line x1="160" y1="150" x2="240" y2="150" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4,4" />
         
         {/* Bolt holes */}
         <circle cx="160" cy="100" r="5" fill="#0f172a" />
         <circle cx="240" cy="100" r="5" fill="#0f172a" />
         <circle cx="160" cy="200" r="5" fill="#0f172a" />
         <circle cx="240" cy="200" r="5" fill="#0f172a" />
      </svg>
    );
  }

  if (description.includes("soldadura AWS")) {
    return (
      <svg viewBox="0 0 400 300" className="w-full h-full">
         <rect x="150" y="100" width="50" height="150" fill="#475569" stroke="#334155" />
         <rect x="200" y="160" width="100" height="20" fill="#0f766e" stroke="#115e59" />
         {/* Weld symbol */}
         <path d="M 200 160 L 220 120 L 280 120" fill="none" stroke="#cbd5e1" strokeWidth="1" />
         <polygon points="200,160 205,150 195,150" fill="#cbd5e1" />
         {/* Flags/symbols */}
         <path d="M 240 120 L 240 110 L 250 120 z" fill="none" stroke="#cbd5e1" />
         <circle cx="230" cy="120" r="4" fill="none" stroke="#cbd5e1" />
         <text x="250" y="115" fill="#cbd5e1" fontSize="10">CJP</text>
      </svg>
    );
  }

  if (description.includes("despiece")) {
    return (
      <svg viewBox="0 0 400 300" className="w-full h-full">
         <rect x="50" y="50" width="300" height="200" fill="none" stroke="#94a3b8" strokeWidth="1" />
         {/* Drawing border & title block */}
         <rect x="250" y="220" width="100" height="30" fill="none" stroke="#94a3b8" strokeWidth="1" />
         <line x1="250" y1="235" x2="350" y2="235" stroke="#94a3b8" strokeWidth="1" />
         
         <rect x="150" y="100" width="40" height="100" fill="#475569" />
         <rect x="190" y="130" width="80" height="40" fill="#0f766e" />
         <rect x="185" y="120" width="10" height="60" fill="#d97706" />

         <line x1="150" y1="90" x2="190" y2="90" stroke="#64748b" strokeWidth="1" />
         <text x="170" y="85" fill="#64748b" fontSize="8" textAnchor="middle">COL.</text>

         <text x="300" y="230" fill="#94a3b8" fontSize="8" textAnchor="middle">PLANO DE DESPIECE</text>
         <text x="300" y="245" fill="#94a3b8" fontSize="6" textAnchor="middle">ESCALA 1:10</text>
      </svg>
    );
  }

  // Fallback for others: reuse ConnectionDrawing or generic structural SVG
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
        <ConnectionDrawing activeModule={activeModule} />
      </div>
      <span className="text-slate-500 font-semibold italic text-sm mt-2">
        Figura: {description}
      </span>
    </div>
  );
}
