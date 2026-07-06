import React from 'react';
import { Box, Component, Droplets, Layers, LayoutGrid, Ruler, Search, Settings, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar({ activeModule, onModuleChange }: { activeModule: string, onModuleChange: (mod: string) => void }) {
  return (
    <aside className="w-64 bg-[#090e17] border-r border-[#1f2937] flex flex-col h-full overflow-y-auto scrollbar-hide py-4 shrink-0">
      <div className="px-6 mb-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Hexagon className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-white tracking-wide">Gora</span>
      </div>

      <Section title="CONEXIONES">
        <NavItem active={activeModule === 'Shear Tab'} onClick={() => onModuleChange('Shear Tab')} icon={<Component size={18} />} label="Shear Tab" />
        <NavItem active={activeModule === 'Double Angle'} onClick={() => onModuleChange('Double Angle')} icon={<Layers size={18} />} label="Double Angle" />
        <NavItem active={activeModule === 'End Plate'} onClick={() => onModuleChange('End Plate')} icon={<LayoutGrid size={18} />} label="End Plate" />
        <NavItem active={activeModule === 'Moment Connection'} onClick={() => onModuleChange('Moment Connection')} icon={<Box size={18} />} label="Moment Connection" />
        <NavItem active={activeModule === 'Base Plate'} onClick={() => onModuleChange('Base Plate')} icon={<Droplets size={18} />} label="Base Plate" />
      </Section>

      <Section title="ACERO">
        <NavItem active={activeModule === 'Vigas'} onClick={() => onModuleChange('Vigas')} icon={<Ruler size={18} />} label="Vigas" />
        <NavItem active={activeModule === 'Columnas'} onClick={() => onModuleChange('Columnas')} icon={<Activity size={18} />} label="Columnas" />
        <NavItem active={activeModule === 'Placas Base'} onClick={() => onModuleChange('Placas Base')} icon={<Layers size={18} />} label="Placas Base" />
        <NavItem active={activeModule === 'Perfiles'} onClick={() => onModuleChange('Perfiles')} icon={<Search size={18} />} label="Perfiles" />
      </Section>

      <Section title="CARGAS">
        <NavItem active={activeModule === 'Casos de Carga'} onClick={() => onModuleChange('Casos de Carga')} icon={<Layers size={18} />} label="Casos de Carga" />
        <NavItem active={activeModule === 'Combinaciones'} onClick={() => onModuleChange('Combinaciones')} icon={<Component size={18} />} label="Combinaciones" />
      </Section>

      <Section title="SÍSMICA">
        <NavItem active={activeModule === 'Parámetros AISC'} onClick={() => onModuleChange('Parámetros AISC')} icon={<Activity size={18} />} label="Parámetros AISC" />
      </Section>

      <Section title="HERRAMIENTAS">
        <NavItem active={activeModule === 'Calculadora'} onClick={() => onModuleChange('Calculadora')} icon={<LayoutGrid size={18} />} label="Calculadora" />
        <NavItem active={activeModule === 'Materiales'} onClick={() => onModuleChange('Materiales')} icon={<Box size={18} />} label="Materiales" />
      </Section>

      <div className="mt-auto px-4">
        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-600/20 p-1.5 rounded-lg">
              <Hexagon className="w-4 h-4 text-blue-500" />
            </div>
            <span className="font-semibold text-white">Gora Pro</span>
          </div>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            Desbloquea todas las herramientas y reportes avanzados.
          </p>
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg text-sm transition-colors">
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="px-6 text-xs font-semibold text-gray-500 mb-2 tracking-wider">{title}</h3>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-6 py-2 text-sm text-left transition-colors relative group",
        active ? "text-blue-500 bg-blue-500/10" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
      )}
    >
      {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />}
      <span className={cn("shrink-0", active ? "text-blue-500" : "text-gray-400 group-hover:text-gray-200")}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function Hexagon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
}
