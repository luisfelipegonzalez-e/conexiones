import React from 'react';
import { ChevronDown, ArrowRight, ArrowLeft } from 'lucide-react';

export default function InputForms({ activeModule }: { activeModule: string }) {
  if (activeModule === 'Shear Tab') {
    return (
      <div className="w-80 shrink-0 flex flex-col bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1f2937] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white tracking-wide">1. DATOS DE ENTRADA</h2>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 flex flex-col gap-6">
          <Section title="CARGA">
            <div className="flex flex-col gap-3">
              <NumberInput label="Cortante de diseño, V" value="75" unit="kip" />
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Dirección del cortante</label>
                <div className="flex bg-[#1a2333] rounded-lg p-0.5 border border-[#2d3748]">
                  <button className="px-3 py-1 bg-[#252f40] rounded-md text-white shadow"><ArrowLeft size={14}/></button>
                  <button className="px-3 py-1 text-gray-400 hover:text-white"><ArrowRight size={14}/></button>
                </div>
              </div>
            </div>
          </Section>
          <Section title="PERFILES">
            <div className="flex flex-col gap-3">
              <SelectInput label="Viga (W)" value="W18X35" />
              <SelectInput label="Columna (HSS Rectangular)" value="HSS10X6X3/8" />
            </div>
          </Section>
          <Section title="PLATINA (SHEAR TAB)">
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <SelectInput label="Material" value="A36" className="flex-1" />
                <SelectInput label="Espesor, tp" value="3/8&quot;" className="flex-1" />
              </div>
              <div className="flex gap-3">
                <NumberInput label="Altura, h" value="12" unit="in" className="flex-1" />
                <NumberInput label="Longitud, L" value="6" unit="in" className="flex-1" />
              </div>
            </div>
          </Section>
          <Section title="PERNOS">
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <SelectInput label="Tipo de perno" value="A325" className="flex-1" />
                <SelectInput label="Diámetro" value="3/4&quot;" className="flex-1" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Número de filas</label>
                <div className="flex bg-[#1a2333] rounded-lg p-0.5 border border-[#2d3748]">
                  <button className="flex-1 px-2 py-1 text-gray-400 hover:text-white text-xs">1</button>
                  <button className="flex-1 px-2 py-1 bg-blue-600 rounded-md text-white text-xs shadow">2</button>
                  <button className="flex-1 px-2 py-1 text-gray-400 hover:text-white text-xs">3</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Número por fila</label>
                <div className="flex bg-[#1a2333] rounded-lg p-0.5 border border-[#2d3748]">
                  <button className="flex-1 px-2 py-1 text-gray-400 hover:text-white text-xs">2</button>
                  <button className="flex-1 px-2 py-1 bg-blue-600 rounded-md text-white text-xs shadow">3</button>
                  <button className="flex-1 px-2 py-1 text-gray-400 hover:text-white text-xs">4</button>
                </div>
              </div>
            </div>
          </Section>
          <Section title="SÍSMICA (NSR-10)">
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <SelectInput label="Zona sísmica" value="III" className="flex-1" />
                <NumberInput label="Ω0 (automático)" value="2.50" unit="i" className="flex-1" />
              </div>
            </div>
          </Section>
        </div>
      </div>
    );
  }

  // Default to End Plate 4ES forms or generic placeholders
  return (
    <div className="w-80 shrink-0 flex flex-col bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-[#1f2937] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white tracking-wide">1. DATOS DE ENTRADA</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 flex flex-col gap-6">
        
        {activeModule === 'End Plate' || activeModule === 'Moment Connection' ? (
          <>
            <Section title="CARGAS">
              <div className="flex flex-col gap-3">
                <NumberInput label="Cortante gravitacional, Vg" value="10.86" unit="tonnef" />
                <NumberInput label="Cortante sísmico, Vs" value="30.64" unit="tonnef" />
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Tensión</label>
                  <div className="flex bg-[#1a2333] rounded-lg p-0.5 border border-[#2d3748]">
                    <button className="px-3 py-1 bg-[#252f40] rounded-md text-white shadow"><ArrowLeft size={14}/></button>
                    <button className="px-3 py-1 text-gray-400 hover:text-white"><ArrowRight size={14}/></button>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="PERFILES">
              <div className="flex flex-col gap-3">
                <SelectInput label="Viga (IPE)" value="IPE-450" />
                <SelectInput label="Columna (HEB)" value="HEB-450" />
                <SelectInput label="Material Viga" value="ASTM A36 (250 MPa)" />
                <SelectInput label="Material Columna" value="ASTM A36 (250 MPa)" />
              </div>
            </Section>

            <Section title="GEOMETRÍA END-PLATE">
              <div className="flex flex-col gap-3">
                <SelectInput label="Material" value="ASTM A36" />
                <div className="flex gap-3">
                  <SelectInput label="Espesor, tp" value="31 mm" className="flex-1" />
                  <NumberInput label="Ancho, bp" value="250" unit="mm" className="flex-1" />
                </div>
              </div>
            </Section>

            <Section title="PERNOS">
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <SelectInput label="Tipo" value="A490" className="flex-1" />
                  <SelectInput label="Diámetro" value="1 1/4&quot;" className="flex-1" />
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">Dist. horiz. (g)</label>
                  <div className="flex">
                    <input type="text" value="140" readOnly className="w-full bg-[#1a2333] text-white rounded-l-lg px-3 py-1.5 text-sm border border-[#2d3748] focus:outline-none" />
                    <span className="bg-[#2d3748] border border-l-0 border-[#2d3748] rounded-r-lg px-2 py-1.5 text-xs text-gray-400 flex items-center">mm</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">Dist. vert. (pfi, pfo)</label>
                  <div className="flex bg-[#1a2333] rounded-lg p-0.5 border border-[#2d3748]">
                    <button className="flex-1 px-2 py-1 bg-[#252f40] rounded-md text-white text-xs shadow">50 mm</button>
                    <button className="flex-1 px-2 py-1 text-gray-400 hover:text-white text-xs">60 mm</button>
                  </div>
                </div>
              </div>
            </Section>
            
            <Section title="SÍSMICA (AISC 358-16)">
              <div className="flex flex-col gap-3">
                 <div className="flex justify-between items-center bg-[#1a2333] border border-[#2d3748] rounded-lg p-2.5">
                   <span className="text-xs text-gray-300">Factor Sobre-Resis. (Ry)</span>
                   <span className="text-xs font-semibold text-white">1.50</span>
                 </div>
              </div>
            </Section>
          </>
        ) : activeModule === 'Double Angle' ? (
          <>
            <Section title="CARGAS">
              <div className="flex flex-col gap-3">
                <NumberInput label="Cortante, V_u" value="45" unit="kip" />
              </div>
            </Section>
            <Section title="PERFILES">
              <div className="flex flex-col gap-3">
                <SelectInput label="Viga Soportada" value="W16X26" />
                <SelectInput label="Viga Principal" value="W21X44" />
              </div>
            </Section>
            <Section title="ÁNGULOS">
              <div className="flex flex-col gap-3">
                <SelectInput label="Tamaño" value="2L 4X3.5X3/8" />
                <NumberInput label="Longitud" value="11.5" unit="in" />
              </div>
            </Section>
          </>
        ) : (
          <>
            <Section title="CARGAS">
              <div className="flex flex-col gap-3">
                <NumberInput label="Axial, P_u" value="250" unit="kip" />
                <NumberInput label="Momento, M_u" value="100" unit="kip-ft" />
              </div>
            </Section>
            <Section title="COLUMNA Y PEDESTAL">
              <div className="flex flex-col gap-3">
                <SelectInput label="Columna" value="W12X96" />
                <SelectInput label="f'c del concreto" value="4000 psi" />
              </div>
            </Section>
            <Section title="PLACA BASE">
              <div className="flex flex-col gap-3">
                <NumberInput label="B" value="18" unit="in" />
                <NumberInput label="N" value="20" unit="in" />
                <SelectInput label="Grosor tp" value="1 1/2 in" />
              </div>
            </Section>
            <Section title="ANCLAJES">
              <div className="flex flex-col gap-3">
                <SelectInput label="Cantidad y Diám." value="4 - 1 1/4&quot;" />
                <SelectInput label="Material" value="ASTM F1554 Gr 36" />
              </div>
            </Section>
          </>
        )}

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function NumberInput({ label, value, unit, className }: { label: string; value: string; unit: string; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs text-gray-400 block mb-1.5">{label}</label>
      <div className="flex">
        <input 
          type="text" 
          value={value} 
          readOnly 
          className="w-full bg-[#1a2333] text-white rounded-l-lg px-3 py-1.5 text-sm border border-[#2d3748] focus:border-blue-500 focus:outline-none" 
        />
        <div className="bg-[#1a2333] border border-l-0 border-[#2d3748] rounded-r-lg px-3 py-1.5 text-xs text-gray-500 flex items-center justify-center">
          {unit}
        </div>
      </div>
    </div>
  );
}

function SelectInput({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
      <div className={className}>
        <label className="text-xs text-gray-400 block mb-1.5">{label}</label>
        <div className="relative">
          <select className="w-full appearance-none bg-[#1a2333] text-white rounded-lg pl-3 pr-8 py-1.5 text-sm border border-[#2d3748] focus:border-blue-500 focus:outline-none cursor-pointer">
            <option>{value}</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <ChevronDown size={14} />
          </div>
        </div>
      </div>
  );
}
