import React, { useState } from 'react';
import { Activity, Calculator, Settings2, FileText, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ColumnsModule() {
  const [length, setLength] = useState(3.0); // m
  const [kx, setKx] = useState(1.0);
  const [ky, setKy] = useState(1.0);
  const [fy, setFy] = useState(345); // MPa
  const [E] = useState(200000); // MPa
  const [pu, setPu] = useState(1000); // kN demand

  const [section, setSection] = useState({
    name: 'W200x46',
    A: 5890, // mm2
    rx: 88.1, // mm
    ry: 51.3, // mm
    d: 203, // mm
    bf: 203, // mm
    tf: 11.0, // mm
    tw: 7.2, // mm
  });

  // Calculations (AISC 360)
  const Lx_mm = length * 1000;
  const Ly_mm = length * 1000;

  const KLrx = (kx * Lx_mm) / section.rx;
  const KLry = (ky * Ly_mm) / section.ry;
  const KLr_max = Math.max(KLrx, KLry);

  const Fe = (Math.PI * Math.PI * E) / (KLr_max * KLr_max);

  const slendernessLimit = 4.71 * Math.sqrt(E / fy);
  let Fcr = 0;
  
  if (KLr_max <= slendernessLimit) {
    Fcr = Math.pow(0.658, fy / Fe) * fy;
  } else {
    Fcr = 0.877 * Fe;
  }

  const Pn = (Fcr * section.A) / 1000; // kN
  const phiPn = 0.9 * Pn; // LRFD
  const Pn_omega = Pn / 1.67; // ASD

  const ratioLRFD = pu / phiPn;
  const isOkLRFD = ratioLRFD <= 1.0;

  return (
    <div className="flex flex-col h-full bg-[#0b1121] text-slate-200">
      <div className="flex items-center justify-between p-6 border-b border-[#1f2937] bg-[#0d1527]">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Activity className="text-blue-500" />
            Diseño de Columnas de Acero
          </h1>
          <p className="text-sm text-slate-400">
            Cálculo de capacidad a compresión axial según AISC 360.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex">
        {/* Sidebar Inputs */}
        <div className="w-80 bg-[#111827] border-r border-[#1f2937] p-6 flex flex-col gap-6 overflow-y-auto">
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Settings2 size={16} className="text-blue-400" /> Parámetros Generales
            </h3>
            
            <div>
              <label className="block text-xs text-slate-400 mb-1">Longitud No Arriostrada (L) [m]</label>
              <input 
                type="number" 
                step="0.1"
                value={length} 
                onChange={e => setLength(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b1121] border border-[#1f2937] rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Factor Kx</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={kx} 
                  onChange={e => setKx(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0b1121] border border-[#1f2937] rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Factor Ky</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={ky} 
                  onChange={e => setKy(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0b1121] border border-[#1f2937] rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Carga Axial Última (Pu) [kN]</label>
              <input 
                type="number" 
                step="10"
                value={pu} 
                onChange={e => setPu(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b1121] border border-[#1f2937] rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-red-400 font-bold font-mono"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Calculator size={16} className="text-emerald-400" /> Material y Perfil
            </h3>
            
            <div>
              <label className="block text-xs text-slate-400 mb-1">Límite Elástico (Fy) [MPa]</label>
              <select 
                value={fy} 
                onChange={e => setFy(parseInt(e.target.value))}
                className="w-full bg-[#0b1121] border border-[#1f2937] rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value={250}>250 MPa (A36)</option>
                <option value={345}>345 MPa (A992 / A572 Gr. 50)</option>
                <option value={450}>450 MPa</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sección</label>
              <select 
                value={section.name} 
                onChange={e => {
                  // Mock basic profiles for demonstration
                  if (e.target.value === 'W200x46') {
                    setSection({ name: 'W200x46', A: 5890, rx: 88.1, ry: 51.3, d: 203, bf: 203, tf: 11.0, tw: 7.2 });
                  } else if (e.target.value === 'W250x73') {
                    setSection({ name: 'W250x73', A: 9280, rx: 110, ry: 64.6, d: 253, bf: 254, tf: 14.2, tw: 8.6 });
                  } else if (e.target.value === 'W310x97') {
                    setSection({ name: 'W310x97', A: 12300, rx: 134, ry: 76.9, d: 308, bf: 305, tf: 15.4, tw: 9.9 });
                  }
                }}
                className="w-full bg-[#0b1121] border border-[#1f2937] rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="W200x46">W200x46</option>
                <option value="W250x73">W250x73</option>
                <option value="W310x97">W310x97</option>
              </select>
            </div>
          </div>
          
        </div>

        {/* Main Content / Results */}
        <div className="flex-1 p-8 bg-[#0b1121] overflow-y-auto">
          
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Status Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between shadow-lg ${isOkLRFD ? 'bg-emerald-900/20 border-emerald-900/50' : 'bg-red-900/20 border-red-900/50'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isOkLRFD ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {isOkLRFD ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {isOkLRFD ? 'Diseño Adecuado' : 'Diseño Inadecuado'}
                  </h2>
                  <p className="text-sm text-slate-400">
                    Ratio de demanda/capacidad (LRFD): <strong className={isOkLRFD ? 'text-emerald-400' : 'text-red-400'}>{ratioLRFD.toFixed(3)}</strong>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400 mb-1">Capacidad ϕPn</div>
                <div className="text-3xl font-black font-mono text-white">{phiPn.toFixed(1)} kN</div>
              </div>
            </div>

            {/* Calculations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-[#1f2937] pb-2">Propiedades Geométricas</h3>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between border-b border-[#1f2937] pb-1">
                    <span className="text-slate-400">Área (Ag)</span>
                    <span className="text-sky-400 font-semibold">{section.A.toFixed(1)} mm²</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1f2937] pb-1">
                    <span className="text-slate-400">Radio de giro rx</span>
                    <span className="text-sky-400 font-semibold">{section.rx.toFixed(1)} mm</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1f2937] pb-1">
                    <span className="text-slate-400">Radio de giro ry</span>
                    <span className="text-sky-400 font-semibold">{section.ry.toFixed(1)} mm</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1f2937] pb-1">
                    <span className="text-slate-400">Peralte (d)</span>
                    <span className="text-sky-400 font-semibold">{section.d.toFixed(1)} mm</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-400">Ancho patín (bf)</span>
                    <span className="text-sky-400 font-semibold">{section.bf.toFixed(1)} mm</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-[#1f2937] pb-2">Parámetros de Esbeltez</h3>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between border-b border-[#1f2937] pb-1">
                    <span className="text-slate-400">KL/r (Eje X)</span>
                    <span className="text-emerald-400 font-semibold">{KLrx.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1f2937] pb-1">
                    <span className="text-slate-400">KL/r (Eje Y)</span>
                    <span className="text-emerald-400 font-semibold">{KLry.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1f2937] pb-1">
                    <span className="text-slate-400">KL/r (Máximo)</span>
                    <span className="text-emerald-400 font-bold">{KLr_max.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1f2937] pb-1">
                    <span className="text-slate-400">Límite 4.71√(E/Fy)</span>
                    <span className="text-slate-300 font-semibold">{slendernessLimit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-400">Pandeo Elástico (Fe)</span>
                    <span className="text-purple-400 font-semibold">{Fe.toFixed(2)} MPa</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 md:col-span-2">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-[#1f2937] pb-2">Resultados de Compresión (AISC 360-16)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#0b1121] rounded-lg p-4 border border-[#1f2937]">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Esfuerzo Crítico (Fcr)</div>
                    <div className="text-2xl font-mono text-white font-bold">{Fcr.toFixed(1)} <span className="text-sm text-slate-500 font-sans">MPa</span></div>
                    <div className="text-xs text-slate-500 mt-2">
                      {KLr_max <= slendernessLimit ? 'Pandeo Inelástico' : 'Pandeo Elástico'}
                    </div>
                  </div>
                  
                  <div className="bg-[#0b1121] rounded-lg p-4 border border-[#1f2937]">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Capacidad Nominal (Pn)</div>
                    <div className="text-2xl font-mono text-white font-bold">{Pn.toFixed(1)} <span className="text-sm text-slate-500 font-sans">kN</span></div>
                    <div className="text-xs text-slate-500 mt-2">Pn = Fcr × Ag</div>
                  </div>

                  <div className="bg-[#0b1121] rounded-lg p-4 border border-[#1f2937]">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Capacidad ASD (Pn/Ω)</div>
                    <div className="text-2xl font-mono text-white font-bold">{Pn_omega.toFixed(1)} <span className="text-sm text-slate-500 font-sans">kN</span></div>
                    <div className="text-xs text-slate-500 mt-2">Ω = 1.67</div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
