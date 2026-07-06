import React from 'react';
import { Settings, Tool, Hammer, Construction, Activity, Cpu } from 'lucide-react';

export default function PlaceholderModule({ moduleName }: { moduleName: string }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0b1121] h-full p-8">
      <div className="max-w-md w-full bg-[#111827] border border-[#1f2937] rounded-xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
          <Cpu size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-white tracking-wide mb-2">
          Módulo {moduleName}
        </h2>
        
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          Este módulo de ingeniería estructural avanzada se encuentra actualmente en desarrollo por nuestro equipo técnico. 
          Estará disponible en la próxima actualización de la plataforma.
        </p>
        
        <div className="w-full bg-[#0a101f] border border-[#1f2937] rounded-lg p-4">
          <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
            <Activity size={16} className="text-emerald-500" />
            <span>Estado del desarrollo</span>
            <span className="ml-auto font-mono text-emerald-500">68%</span>
          </div>
          <div className="w-full h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full w-[68%] relative">
              <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
