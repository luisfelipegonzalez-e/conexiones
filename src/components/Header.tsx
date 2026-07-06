import { CheckCircle2, Download, Menu, Moon, Save, Share2 } from 'lucide-react';

export default function Header({ onExportPdf, isGeneratingPdf, activeModule }: { onExportPdf: () => void, isGeneratingPdf: boolean, activeModule: string }) {
  const getSubTitle = () => {
    switch (activeModule) {
      case 'Shear Tab': return 'Shear Tab Soldada a Columna HSS';
      case 'Double Angle': return 'Conexión a Cortante';
      case 'End Plate': return 'Pórtico Especial a Momento (SMF) - IPE a HEB';
      case 'Moment Connection': return 'Conexión Rígida a Momento';
      case 'Base Plate': return 'Placa Base de Columna';
      default: return '';
    }
  };

  const getTitle = () => {
    switch (activeModule) {
      case 'Shear Tab': return 'Conexión Viga-Columna a Cortante';
      case 'Double Angle': return 'Conexión con Doble Ángulo';
      case 'End Plate': return 'Conexión precalificada end plate 4ES';
      case 'Moment Connection': return 'Conexión a Momento';
      case 'Base Plate': return 'Diseño de Placa Base';
      default: return activeModule;
    }
  };

  return (
    <header className="h-16 shrink-0 border-b border-[#1f2937] bg-[#0b1121] px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-gray-400 hover:text-white">
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-white leading-tight">
            {getTitle()}
          </h1>
          <p className="text-xs text-gray-400">{getSubTitle()}</p>
        </div>
        
        <div className="hidden sm:flex items-center gap-1.5 bg-green-500/10 text-green-500 px-3 py-1.5 rounded-full border border-green-500/20 ml-4">
          <CheckCircle2 size={14} className="fill-green-500 text-[#0b1121]" />
          <span className="text-xs font-medium">Diseño OK</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border border-transparent">
          <Save size={16} />
          Guardar
        </button>
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border border-transparent">
          <Share2 size={16} />
          Compartir
        </button>
        <button 
          onClick={onExportPdf}
          disabled={isGeneratingPdf}
          className={`flex items-center gap-2 px-4 py-1.5 ${isGeneratingPdf ? 'bg-blue-800 cursor-wait' : 'bg-blue-600 hover:bg-blue-500'} text-white text-sm font-medium rounded-lg transition-colors`}
        >
          {isGeneratingPdf ? 'Generando...' : 'Exportar PDF'} <Download size={16} />
        </button>
        <div className="w-px h-6 bg-gray-800 mx-1"></div>
        <button className="text-gray-400 hover:text-white rounded-full p-1.5 hover:bg-gray-800 transition-colors">
          <Moon size={18} />
        </button>
        <button className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shrink-0 ml-1">
          CR
        </button>
      </div>
    </header>
  );
}
