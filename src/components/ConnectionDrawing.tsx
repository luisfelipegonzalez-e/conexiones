import React from 'react';

export default function ConnectionDrawing({ activeModule }: { activeModule: string }) {
  if (activeModule === 'Shear Tab') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 400 300" className="opacity-90">
         {/* Columna HSS10X6X3/8 */}
         <rect x="150" y="20" width="100" height="260" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4,4" />
         <rect x="155" y="25" width="90" height="250" fill="#475569" stroke="#334155" strokeWidth="2" />
         
         {/* Viga W18X35 */}
         <rect x="245" y="80" width="130" height="140" fill="#0f766e" stroke="#115e59" strokeWidth="2" />
         <rect x="245" y="75" width="130" height="10" fill="#115e59" stroke="#0f766e" strokeWidth="1" />
         <rect x="245" y="215" width="130" height="10" fill="#115e59" stroke="#0f766e" strokeWidth="1" />

         {/* Shear Tab */}
         <rect x="245" y="90" width="40" height="120" fill="#d97706" stroke="#b45309" strokeWidth="2" />

         {/* Pernos (2x2 grid) */}
         {[120, 180].map(y => (
           [260, 275].map(x => (
             <g key={`${x}-${y}`}>
               <circle cx={x} cy={y} r="4" fill="#0f172a" />
               <circle cx={x} cy={y} r="2" fill="#94a3b8" />
             </g>
           ))
         ))}

         {/* Soldadura (Filete perimetral) */}
         <path d="M 245 90 L 245 210" stroke="#fbbf24" strokeWidth="3" strokeDasharray="4,2" />
         
         {/* Tags */}
         <text x="160" y="45" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">HSS10X6X3/8</text>
         <text x="300" y="150" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">W18X35</text>
         <text x="290" y="100" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">tp = 3/8"</text>
      </svg>
    );
  }

  if (activeModule === 'Double Angle') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 400 300" className="opacity-90">
         {/* Viga Principal */}
         <rect x="150" y="20" width="80" height="260" fill="#475569" stroke="#334155" strokeWidth="2" />
         
         {/* Viga Secundaria */}
         <rect x="230" y="100" width="140" height="100" fill="#0f766e" stroke="#115e59" strokeWidth="2" />

         {/* Double Angles */}
         <rect x="230" y="110" width="30" height="80" fill="#d97706" stroke="#b45309" strokeWidth="2" />
         
         {/* Pernos Viga Principal */}
         {[130, 150, 170].map(y => (
           <circle key={`v1-${y}`} cx="245" cy={y} r="4" fill="#0f172a" />
         ))}
         {/* Tags */}
         <text x="280" y="150" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">Double Angle</text>
      </svg>
    );
  }
  
  if (activeModule === 'Base Plate') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 400 300" className="opacity-90">
         {/* Pedestal */}
         <rect x="100" y="200" width="200" height="80" fill="#64748b" stroke="#475569" strokeWidth="2" />
         
         {/* Base Plate */}
         <rect x="120" y="180" width="160" height="20" fill="#d97706" stroke="#b45309" strokeWidth="2" />

         {/* Columna */}
         <rect x="170" y="20" width="60" height="160" fill="#0f766e" stroke="#115e59" strokeWidth="2" />

         {/* Anclajes */}
         <rect x="140" y="150" width="6" height="80" fill="#0f172a" />
         <rect x="254" y="150" width="6" height="80" fill="#0f172a" />
         
         <text x="175" y="100" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">Columna</text>
         <text x="140" y="240" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">Pedestal / Base Plate</text>
      </svg>
    );
  }

  // Default End Plate SVG (End Plate & Moment Connection)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 400 300" className="opacity-90">
       {/* Columna HEB-450 (Side View) */}
       <rect x="150" y="20" width="100" height="260" fill="#475569" stroke="#334155" strokeWidth="2" />
       <rect x="140" y="20" width="10" height="260" fill="#334155" stroke="#1e293b" strokeWidth="1" />
       <rect x="250" y="20" width="10" height="260" fill="#334155" stroke="#1e293b" strokeWidth="1" />
       <line x1="200" y1="20" x2="200" y2="280" stroke="#94a3b8" strokeWidth="1" strokeDasharray="5,5" />
       
       {/* Viga IPE-450 */}
       <rect x="260" y="60" width="130" height="180" fill="#0f766e" stroke="#115e59" strokeWidth="2" />
       <rect x="260" y="50" width="130" height="10" fill="#115e59" stroke="#0f766e" strokeWidth="1" />
       <rect x="260" y="240" width="130" height="10" fill="#115e59" stroke="#0f766e" strokeWidth="1" />
       <line x1="260" y1="150" x2="390" y2="150" stroke="#5eead4" strokeWidth="1" strokeDasharray="5,5" />

       {/* End Plate */}
       <rect x="250" y="30" width="15" height="240" fill="#d97706" stroke="#b45309" strokeWidth="2" />
       
       {/* Rigidizadores */}
       <polygon points="265,50 320,50 265,15" fill="#16a34a" stroke="#15803d" strokeWidth="1" opacity="0.8" />
       <polygon points="265,250 320,250 265,285" fill="#16a34a" stroke="#15803d" strokeWidth="1" opacity="0.8" />

       {/* Placas de continuidad */}
       <rect x="150" y="50" width="100" height="10" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
       <rect x="150" y="240" width="100" height="10" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />

       {/* Pernos */}
       {[60, 100, 200, 240].map((y, i) => (
         <g key={i}>
           <circle cx="257.5" cy={y} r="5" fill="#0f172a" />
           <rect x="252.5" y={y-3} width="10" height="6" fill="#1e293b" />
           <path d={`M 262.5 ${y} L 275 ${y}`} stroke="#cbd5e1" strokeWidth="1" />
         </g>
       ))}

       {/* Dimensions */}
       <g stroke="#94a3b8" strokeWidth="1">
         <line x1="275" y1="60" x2="275" y2="240" />
         <line x1="272" y1="60" x2="278" y2="60" />
         <line x1="272" y1="240" x2="278" y2="240" />
         <text x="285" y="155" fill="#94a3b8" fontSize="12" fontFamily="sans-serif">d = 450</text>
       </g>
    </svg>
  );
}
