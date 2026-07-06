/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Activity,
  Calculator,
  Compass,
  FileText,
  FolderOpen,
  LayoutDashboard,
  RotateCcw,
  BookOpen,
  Settings as SettingsIcon,
  HelpCircle,
  TrendingUp,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Award,
  Download,
  Share2,
  FileDown,
  Sparkles,
  Bot
} from "lucide-react";

import {
  SectionType,
  SectionProperties,
  MaterialProperties,
  BeamLoad,
  LoadType,
  SupportType,
  StructuralType
} from "./types";

import { solveBeam, calculateSectionProperties } from "./utils/structuralSolver";
import { UnitSystem, formatUnit } from "./utils/units";
import BeamVisualizer from "./components/BeamVisualizer";
import LoadBuilder from "./components/LoadBuilder";
import BeamCharts from "./components/BeamCharts";
import AIBeamAssistant from "./components/AIBeamAssistant";
import CompositeBeamCalculator from "./components/CompositeBeamCalculator";

// Hardcoded standard steel list
const STEEL_PRESETS: MaterialProperties[] = [
  {
    name: "ASTM A572 Gr 50",
    fy: 345,
    fu: 450,
    elasticModulus: 200,
    poisson: 0.30,
    density: 7850
  },
  {
    name: "ASTM A36",
    fy: 250,
    fu: 400,
    elasticModulus: 200,
    poisson: 0.30,
    density: 7850
  },
  {
    name: "ASTM A992",
    fy: 345,
    fu: 450,
    elasticModulus: 200,
    poisson: 0.30,
    density: 7850
  },
  {
    name: "Euroacero S235",
    fy: 235,
    fu: 360,
    elasticModulus: 210,
    poisson: 0.30,
    density: 7850
  },
  {
    name: "Euroacero S355",
    fy: 355,
    fu: 510,
    elasticModulus: 210,
    poisson: 0.30,
    density: 7850
  }
];

// Project templates
interface ProjectTemplate {
  name: string;
  length: number;
  sectionType: SectionType;
  sectionProps: SectionProperties;
  material: MaterialProperties;
  loads: BeamLoad[];
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    name: "Proyecto: Puente Peatonal - Viga Principal",
    length: 10.0,
    sectionType: SectionType.I_BEAM,
    sectionProps: { height: 300, width: 150, tw: 8, tf: 12 },
    material: STEEL_PRESETS[0], // A572 Gr 50
    loads: [
      { id: "l1", type: LoadType.POINT, magnitude: 20, position: 2.0 },
      { id: "l2", type: LoadType.DISTRIBUTED, magnitude: 15, start: 4.0, end: 8.0 }
    ]
  },
  {
    name: "Proyecto: Nave Industrial - Correa de Techo",
    length: 6.0,
    sectionType: SectionType.C_CHANNEL,
    sectionProps: { height: 200, width: 80, tw: 6, tf: 10 },
    material: STEEL_PRESETS[1], // A36
    loads: [
      { id: "correa1", type: LoadType.DISTRIBUTED, magnitude: 3.5, start: 0.0, end: 6.0 }
    ]
  },
  {
    name: "Proyecto: Soporte Circular - Plataforma",
    length: 8.0,
    sectionType: SectionType.CIRCULAR,
    sectionProps: { height: 250, width: 250, tw: 10, tf: 0 }, // Hollow Pipe (tw > 0)
    material: STEEL_PRESETS[4], // S355
    loads: [
      { id: "p1", type: LoadType.POINT, magnitude: 45, position: 4.0 },
      { id: "p2", type: LoadType.POINT, magnitude: 25, position: 1.5 },
      { id: "p3", type: LoadType.POINT, magnitude: 25, position: 6.5 }
    ]
  },
  {
    name: "Proyecto: Plataforma - Viga Rectangular RHS",
    length: 5.0,
    sectionType: SectionType.RHS_SHS,
    sectionProps: { height: 150, width: 100, tw: 6, tf: 6 },
    material: STEEL_PRESETS[2], // A992
    loads: [
      { id: "rhs1", type: LoadType.DISTRIBUTED, magnitude: 8.0, start: 1.0, end: 4.0 },
      { id: "rhs2", type: LoadType.POINT, magnitude: 15, position: 2.5 }
    ]
  }
];

export default function BeamCalculator() {
  const [activeTab, setActiveTab] = useState<"visualizer" | "properties" | "calculations" | "notes">("visualizer");
  const [activeModule, setActiveModule] = useState<"analysis" | "composite">("analysis");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  
  // App variables
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [beamLength, setBeamLength] = useState<number>(10.0);
  const [structuralType, setStructuralType] = useState<StructuralType>(StructuralType.DETERMINED);
  const [sectionType, setSectionType] = useState<SectionType>(SectionType.I_BEAM);
  const [sectionProps, setSectionProps] = useState<SectionProperties>({
    height: 300,
    width: 150,
    tw: 8,
    tf: 12
  });

  // Material state
  const [selectedSteel, setSelectedSteel] = useState<MaterialProperties>(STEEL_PRESETS[0]);
  const [customSteelUnlocked, setCustomSteelUnlocked] = useState(false);
  const [customFy, setCustomFy] = useState(345);
  const [customFu, setCustomFu] = useState(450);
  const [customE, setCustomE] = useState(200);
  const [customPoisson, setCustomPoisson] = useState(0.3);
  const [customDensity, setCustomDensity] = useState(7850);

  // Load building state
  const [loads, setLoads] = useState<BeamLoad[]>([
    { id: "l1", type: LoadType.POINT, magnitude: 20, position: 2.0 },
    { id: "l2", type: LoadType.DISTRIBUTED, magnitude: 15, start: 4.0, end: 8.0 }
  ]);
  const [includeSelfWeight, setIncludeSelfWeight] = useState(false);

  // Supports configuration state
  const [supportAPosition, setSupportAPosition] = useState<number>(0.0);
  const [supportBPosition, setSupportBPosition] = useState<number>(10.0);
  const [supportCPosition, setSupportCPosition] = useState<number>(3.3);
  const [supportDPosition, setSupportDPosition] = useState<number>(6.6);
  const [supportAType, setSupportAType] = useState<SupportType>(SupportType.PINNED);
  const [supportBType, setSupportBType] = useState<SupportType>(SupportType.ROLLER);
  const [supportCType, setSupportCType] = useState<SupportType>(SupportType.FREE);
  const [supportDType, setSupportDType] = useState<SupportType>(SupportType.FREE);
  const [activeSupportSelector, setActiveSupportSelector] = useState<"A" | "B" | "C" | "D">("A");

  const handleUpdateSupportPosition = (support: "A" | "B" | "C" | "D", newPos: number) => {
    if (support === "A") {
      setSupportAPosition(parseFloat(newPos.toFixed(3)));
    } else if (support === "B") {
      setSupportBPosition(parseFloat(newPos.toFixed(3)));
    } else if (support === "C") {
      setSupportCPosition(parseFloat(newPos.toFixed(3)));
    } else {
      setSupportDPosition(parseFloat(newPos.toFixed(3)));
    }
    triggerAutoSave();
  };

  const handleUpdateSupportType = (support: "A" | "B" | "C" | "D", newType: SupportType) => {
    if (support === "A") {
      setSupportAType(newType);
    } else if (support === "B") {
      setSupportBType(newType);
    } else if (support === "C") {
      setSupportCType(newType);
    } else {
      setSupportDType(newType);
    }
    triggerAutoSave();
  };

  // Status indicators
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Modelo guardado hace unos instantes");
  const [showReport, setShowReport] = useState(false);
  const [compararModal, setCompararModal] = useState(false);
  const [historialModal, setHistorialModal] = useState(false);

  // Notes state
  const [notesText, setNotesText] = useState(
    `# Proyecto de Verificación de Viga del Puente Peatonal\n\nFecha: ${new Date().toLocaleDateString()}\nAutor: Equipo de Ingeniería GORA\n\n- Viga principal bi-apoyada (isoestática).\n- Análisis de esfuerzos equivalentes mediante Von Mises y Tresca.\n- Se verifica que la deformación máxima cumpla con los límites reglamentarios (L/300).\n`
  );

  // Toggles for active charts on results panel
  const [showShear, setShowShear] = useState(true);
  const [showMoment, setShowMoment] = useState(true);
  const [showStress, setShowStress] = useState(true);
  const [showStrain, setShowStrain] = useState(true);
  const [showDeflection, setShowDeflection] = useState(true);

  // Dynamic state syncing for preset selection
  const handleTemplateChange = (idx: number) => {
    setSelectedTemplateIndex(idx);
    const template = PROJECT_TEMPLATES[idx];
    setBeamLength(template.length);
    setSectionType(template.sectionType);
    setSectionProps(template.sectionProps);
    setSelectedSteel(template.material);
    setLoads(template.loads);
    
    // Reset support configurations for the template
    setSupportAPosition(0.0);
    setSupportBPosition(template.length);
    setSupportAType(SupportType.PINNED);
    setSupportBType(SupportType.ROLLER);

    setCustomSteelUnlocked(false);
    triggerAutoSave();
  };

  const triggerAutoSave = () => {
    setSaveStatus("Guardando cambios...");
    setTimeout(() => {
      setSaveStatus("Modelo guardado hace unos segundos");
    }, 1200);
  };

  // Compile active material properties
  const activeMaterial: MaterialProperties = customSteelUnlocked
    ? {
        name: "Acero Personalizado",
        fy: customFy,
        fu: customFu,
        elasticModulus: customE,
        poisson: customPoisson,
        density: customDensity
      }
    : selectedSteel;

  // Recalculate analytical beam equations
  const solvedResult = solveBeam(
    beamLength,
    sectionType,
    sectionProps,
    activeMaterial,
    loads,
    includeSelfWeight,
    supportAPosition,
    supportBPosition,
    supportCPosition,
    supportDPosition,
    supportAType,
    supportBType,
    supportCType,
    supportDType
  );

  const handleAddLoad = (newLoad: BeamLoad) => {
    setLoads(prev => [...prev, newLoad]);
    triggerAutoSave();
  };

  const handleRemoveLoad = (id: string) => {
    setLoads(prev => prev.filter(l => l.id !== id));
    triggerAutoSave();
  };

  const handleUpdateLoad = (updatedLoad: BeamLoad) => {
    setLoads(prev => prev.map(l => (l.id === updatedLoad.id ? updatedLoad : l)));
    triggerAutoSave();
  };

  const handleUpdateLoadPosition = (id: string, newPos: number, newEnd?: number) => {
    setLoads(prev =>
      prev.map(l => {
        if (l.id !== id) return l;
        if (l.type === LoadType.POINT || l.type === LoadType.MOMENT || l.type === LoadType.TORQUE) {
          return { ...l, position: newPos };
        } else {
          return { ...l, start: newPos, end: newEnd ?? (l as any).end };
        }
      })
    );
  };

  const triggerCalculation = () => {
    setIsCalculating(true);
    setSaveStatus("Resolviendo ecuaciones diferenciales...");
    setTimeout(() => {
      setIsCalculating(false);
      setSaveStatus("Modelo guardado y recalculado");
    }, 700);
  };

  const handleExportPDF = () => {
    setShowReport(true);
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-[#f1f5f9] flex font-sans select-none antialiased">
      {/* 2. CHUNKY CENTER PANEL + CONTAINER GRID */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        {activeModule === "composite" ? (
          <CompositeBeamCalculator />
        ) : (
          <>
            {/* TOP BAR / CONTROL CABIN */}
            <header className="h-16 bg-[#0a0e1b] border-b border-[#1b2a47] shrink-0 sticky top-0 z-40 flex items-center justify-between px-5">
          <div className="flex items-center gap-4">
            {/* Project dropdown template selector */}
            <div className="relative">
              <select
                value={selectedTemplateIndex}
                onChange={(e) => handleTemplateChange(parseInt(e.target.value))}
                className="bg-[#0f172a] border border-[#21396a] text-slate-200 font-sans text-xs font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 min-w-[280px]"
              >
                {PROJECT_TEMPLATES.map((item, idx) => (
                  <option key={idx} value={idx}>{item.name}</option>
                ))}
              </select>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-mono text-slate-500">{saveStatus}</span>
            </div>
            
            {/* Unit System Toggle */}
            <div className="flex bg-[#0f172a] border border-[#21396a] rounded-lg p-0.5 ml-4">
              <button
                onClick={() => setUnitSystem('metric')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  unitSystem === 'metric' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Métrico (mm/kN)
              </button>
              <button
                onClick={() => setUnitSystem('imperial')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  unitSystem === 'imperial' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Imperial (in/lb)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistorialModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0e1628] border border-[#1b2a47] hover:border-slate-500 font-sans text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1"
            >
              <span>Historial</span>
            </button>
            <button
              onClick={() => setCompararModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0e1628] border border-[#1b2a47] hover:border-slate-500 font-sans text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1"
            >
              <span>Comparar</span>
            </button>
            <button
              onClick={() => setIsAiOpen(!isAiOpen)}
              className={`px-2.5 py-1.5 rounded-lg border font-sans text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-lg ${
                isAiOpen 
                  ? "bg-indigo-600 border-indigo-400 text-white shadow-indigo-950" 
                  : "bg-indigo-950/40 border-indigo-900 hover:bg-slate-900 text-indigo-400 hover:text-indigo-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Asistente AI
            </button>
            <button
              onClick={triggerCalculation}
              disabled={isCalculating}
              className="px-3.5 py-1.5 rounded-lg bg-[#2563eb] hover:bg-blue-600 disabled:bg-slate-800 font-sans text-xs font-extrabold text-white transition-all cursor-pointer uppercase tracking-wider inline-flex items-center gap-1 shadow-lg shadow-blue-950"
            >
              {isCalculating ? "Calculando..." : "Calcular"}
            </button>
            <button
              onClick={() => {
                if (confirm("¿Limpiar todas las cargas de la viga?")) {
                  setLoads([]);
                  triggerAutoSave();
                }
              }}
              className="p-1.5 rounded-lg bg-[#121c32] border border-[#1b2a47] hover:bg-red-950/30 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Limpiar cargas"
            >
              <RotateCcw className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={handleExportPDF}
              className="p-1.5 rounded-lg bg-[#121c32] text-amber-400 hover:bg-amber-950/20 border border-[#1b2a47] hover:border-amber-900/50 transition-colors cursor-pointer font-semibold text-xs inline-flex items-center gap-1"
              title="Exportar memoria"
            >
              <FileDown className="w-4.5 h-4.5" /> <span className="hidden md:inline">PDF</span>
            </button>
          </div>
        </header>

        {/* CONTAINER BENTO GRID BOARD */}
        <div className="flex-1 p-5 grid grid-cols-1 xl:grid-cols-4 gap-5">
          
          {/* COLUMN 1: CONFIGURACIÓN DE VIGA (1/4 Width) */}
          <div className="xl:col-span-1 space-y-5">
            
            {/* Support conditions */}
            <div className="bg-[#101726]/80 border border-[#1e2e4f] rounded-xl p-4 shadow-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">1. Configurar Apoyos (Hasta 4 apoyos)</span>
              
              {/* Toggle to select Support A, B, C or D */}
              <div className="grid grid-cols-4 gap-1 mb-3">
                {[
                  { id: "A", label: "Apoyo A" },
                  { id: "B", label: "Apoyo B" },
                  { id: "C", label: "Apoyo C" },
                  { id: "D", label: "Apoyo D" }
                ].map((sup) => (
                  <button
                    key={sup.id}
                    type="button"
                    onClick={() => setActiveSupportSelector(sup.id as any)}
                    className={`py-1.5 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      activeSupportSelector === sup.id
                        ? "bg-blue-600 border-blue-400 text-white"
                        : "bg-[#0b101c] border-[#1e2a47] text-slate-400 hover:text-white"
                    }`}
                  >
                    {sup.label}
                  </button>
                ))}
              </div>

              {/* Grid of support types */}
              <div className="grid grid-cols-5 gap-1 text-center">
                {[
                  { type: SupportType.PINNED, icon: "▲" },
                  { type: SupportType.ROLLER, icon: "⚪" },
                  { type: SupportType.FIXED, icon: "▉" },
                  { type: SupportType.GUIDED, icon: "⇳" },
                  { type: SupportType.FREE, icon: "░" }
                ].map((s, idx) => {
                  const isActive =
                    activeSupportSelector === "A"
                      ? supportAType === s.type
                      : activeSupportSelector === "B"
                      ? supportBType === s.type
                      : activeSupportSelector === "C"
                      ? supportCType === s.type
                      : supportDType === s.type;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        handleUpdateSupportType(activeSupportSelector, s.type);
                      }}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#1e3a8a] border-blue-500 text-white font-bold"
                          : "bg-[#080d16] border-[#1e2a47] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="text-sm font-bold">{s.icon}</div>
                      <div className="text-[8px] mt-1 scale-90 truncate leading-tight">{s.type}</div>
                    </button>
                  );
                })}
              </div>

              {/* Position slider and input for active support */}
              <div className="mt-4 pt-3 border-t border-[#1e2d4f] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold font-sans">
                    Posición de {activeSupportSelector === "A" ? "A" : activeSupportSelector === "B" ? "B" : activeSupportSelector === "C" ? "C" : "D"} (x)
                  </span>
                  <span className="font-mono text-blue-400 font-bold">
                    {(activeSupportSelector === "A"
                      ? supportAPosition
                      : activeSupportSelector === "B"
                      ? supportBPosition
                      : activeSupportSelector === "C"
                      ? supportCPosition
                      : supportDPosition
                    ).toFixed(3)} m
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={beamLength}
                    step="0.05"
                    value={
                      activeSupportSelector === "A"
                        ? supportAPosition
                        : activeSupportSelector === "B"
                        ? supportBPosition
                        : activeSupportSelector === "C"
                        ? supportCPosition
                        : supportDPosition
                    }
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      handleUpdateSupportPosition(activeSupportSelector, val);
                    }}
                    className="flex-1 accent-blue-500 cursor-ew-resize bg-slate-800 h-1.5 rounded-lg text-xs"
                  />
                  <input
                    type="number"
                    min="0"
                    max={beamLength}
                    step="0.01"
                    value={
                      activeSupportSelector === "A"
                        ? supportAPosition
                        : activeSupportSelector === "B"
                        ? supportBPosition
                        : activeSupportSelector === "C"
                        ? supportCPosition
                        : supportDPosition
                    }
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const boundVal = Math.max(0, Math.min(beamLength, val));
                      handleUpdateSupportPosition(activeSupportSelector, boundVal);
                    }}
                    className="w-18 text-center text-xs font-mono bg-[#090d16] border border-[#1e2a47] rounded p-1 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.00 m</span>
                  <span>{formatUnit(beamLength, 'length', unitSystem)}</span>
                </div>
              </div>
            </div>

            {/* Cross section type selector */}
            <div className="bg-[#101726]/80 border border-[#1e2e4f] rounded-xl p-4 shadow-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2.5">2. Sección Transversal</span>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 px-0.5">
                {[
                  { type: SectionType.I_BEAM, label: "I Perfil I" },
                  { type: SectionType.C_CHANNEL, label: "Canal C" },
                  { type: SectionType.CIRCULAR, label: "Circular" },
                  { type: SectionType.RHS_SHS, label: "RHS/SHS" },
                  { type: SectionType.RECT_SOLID, label: "Rect. Sólido" }
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSectionType(s.type);
                      triggerAutoSave();
                    }}
                    className={`py-2 px-0.5 text-center rounded-lg border transition-all cursor-pointer ${
                      sectionType === s.type
                        ? "bg-blue-600 border-blue-400 text-white font-bold"
                        : "bg-[#080d16] border-[#1e2a47] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="text-[9.5px] font-sans font-semibold tracking-tight">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Profile properties inputs */}
            <div className="bg-[#101726]/80 border border-[#1e2e4f] rounded-xl p-4 shadow-xl space-y-3.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">3. Propiedades de la Sección (mm)</span>
              
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Altura (h)</span>
                    <span className="font-mono text-blue-400 font-bold">{formatUnit(sectionProps.height, 'section', unitSystem, 0)}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="600"
                    step="5"
                    value={sectionProps.height}
                    onChange={(e) => {
                      setSectionProps(prev => ({ ...prev, height: parseInt(e.target.value) }));
                      triggerAutoSave();
                    }}
                    className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Ancho brida (b)</span>
                    <span className="font-mono text-blue-400 font-bold">{formatUnit(sectionProps.width, 'section', unitSystem, 0)}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    step="5"
                    value={sectionProps.width}
                    onChange={(e) => {
                      setSectionProps(prev => ({ ...prev, width: parseInt(e.target.value) }));
                      triggerAutoSave();
                    }}
                    className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Show thickness tools depending on section type */}
                {sectionType !== SectionType.CIRCULAR && sectionType !== SectionType.RECT_SOLID && (
                  <>
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Espesor alma (tw)</span>
                        <span className="font-mono text-blue-400 font-bold">{formatUnit(sectionProps.tw, 'section', unitSystem, 1)}</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="30"
                        step="1"
                        value={sectionProps.tw}
                        onChange={(e) => {
                          setSectionProps(prev => ({ ...prev, tw: parseInt(e.target.value) }));
                          triggerAutoSave();
                        }}
                        className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Espesor brida (tf)</span>
                        <span className="font-mono text-blue-400 font-bold">{formatUnit(sectionProps.tf, 'section', unitSystem, 1)}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="40"
                        step="1"
                        value={sectionProps.tf}
                        onChange={(e) => {
                          setSectionProps(prev => ({ ...prev, tf: parseInt(e.target.value) }));
                          triggerAutoSave();
                        }}
                        className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </>
                )}

                {sectionType === SectionType.CIRCULAR && (
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Espesor de pared (tw)</span>
                      <span className="font-mono text-amber-500 font-bold">
                        {sectionProps.tw === 0 ? "Sólido" : `${formatUnit(sectionProps.tw, 'section', unitSystem, 1)} (Hollow)`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="1"
                      value={sectionProps.tw}
                      onChange={(e) => {
                        setSectionProps(prev => ({ ...prev, tw: parseInt(e.target.value) }));
                        triggerAutoSave();
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Material selector */}
            <div className="bg-[#101726]/80 border border-[#1e2e4f] rounded-xl p-4 shadow-xl space-y-3.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">4. Material de Acero</span>
              
              {!customSteelUnlocked ? (
                <div>
                  <select
                    value={STEEL_PRESETS.findIndex(s => s.name === selectedSteel.name)}
                    onChange={(e) => {
                      const steel = STEEL_PRESETS[parseInt(e.target.value)];
                      setSelectedSteel(steel);
                      triggerAutoSave();
                    }}
                    className="w-full text-xs font-semibold bg-[#080d16] border border-[#1e2a47] rounded p-2 text-slate-200 outline-none"
                  >
                    {STEEL_PRESETS.map((s, idx) => (
                      <option key={idx} value={idx}>{s.name}</option>
                    ))}
                  </select>

                  {/* Static properties list */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10.5px] text-slate-400 mt-3 bg-[#0d1324] p-2.5 rounded-lg">
                    <div>
                      <span className="text-slate-500">Fy (Fluencia):</span>{" "}
                      <span className="font-mono text-slate-300 font-semibold">{selectedSteel.fy} MPa</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Fu (Máxima)::</span>{" "}
                      <span className="font-mono text-slate-300 font-semibold">{selectedSteel.fu} MPa</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Módulo E:</span>{" "}
                      <span className="font-mono text-slate-300 font-semibold">{selectedSteel.elasticModulus} GPa</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Densidad (ρ):</span>{" "}
                      <span className="font-mono text-slate-300 font-semibold">{selectedSteel.density} kg/m³</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Límite Fluencia Fy (MPa)</label>
                    <input
                      type="number"
                      value={customFy}
                      onChange={(e) => setCustomFy(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#080d16] border border-[#1e2a47] rounded p-1 text-slate-300 font-mono text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Resistencia Fu</label>
                      <input
                        type="number"
                        value={customFu}
                        onChange={(e) => setCustomFu(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#080d16] border border-[#1e2a47] rounded p-1 text-slate-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">E Módulo (GPa)</label>
                      <input
                        type="number"
                        value={customE}
                        onChange={(e) => setCustomE(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#080d16] border border-[#1e2a47] rounded p-1 text-slate-300 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCustomSteelUnlocked(!customSteelUnlocked)}
                  className="w-full py-1.5 text-[10.5px] font-bold text-center bg-[#152342] text-sky-400 border border-[#21396a] rounded hover:bg-sky-505 transition-all cursor-pointer"
                >
                  {customSteelUnlocked ? "Usar Preajustados" : "Personalizar Acero"}
                </button>
              </div>
            </div>

            <div className="bg-[#101726]/80 border border-[#1e2e4f] rounded-xl p-4 shadow-xl">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs group justify-between">
                <div className="flex flex-col">
                  <span className="text-slate-300 group-hover:text-amber-400 transition-colors font-semibold">Incluir Peso Propio</span>
                  <span className="text-[10px] text-slate-500">Fuerza gravitatoria de la viga ({solvedResult.selfWeightLoadKnPerM.toFixed(3)} kN/m)</span>
                </div>
                <input
                  type="checkbox"
                  checked={includeSelfWeight}
                  onChange={(e) => setIncludeSelfWeight(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-500 accent-blue-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </label>
            </div>

            <LoadBuilder
              beamLength={beamLength}
              loads={loads}
              onAddLoad={handleAddLoad}
              onRemoveLoad={handleRemoveLoad}
              onUpdateLoad={handleUpdateLoad}
              supportAPosition={supportAPosition}
              supportBPosition={supportBPosition}
              supportAType={supportAType}
              supportBType={supportBType}
              unitSystem={unitSystem}
            />
          </div>

          {/* COLUMN 2 & 3: MAIN VIEW, PROP LABS, LOAD BUILDER (2/4 Width combined) */}
          <div className="xl:col-span-2 space-y-5">
            
            {/* Length control track */}
            <div className="bg-[#0d1527] border border-[#1b2a47] rounded-xl p-4 shadow-2xl flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-300">Longitud Total de la Viga (L)</span>
                <span className="text-[10px] text-slate-500">Extremo izquierdo fijo en 0.000 m.</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="0.5"
                  value={beamLength}
                  onChange={(e) => {
                    const l = parseFloat(e.target.value);
                    setBeamLength(l);
                    
                    // Constrain supports
                    if (supportBPosition > l) {
                      setSupportBPosition(l);
                    }
                    if (supportAPosition >= l) {
                      setSupportAPosition(Math.max(0, l - 0.2));
                    }

                    // Filter or shift loads out of range
                    setLoads(prev => prev.map(ld => {
                      if (ld.type === LoadType.POINT) {
                        return ld.position > l ? { ...ld, position: l } : ld;
                      } else {
                        const newEnd = ld.end > l ? l : ld.end;
                        const newStart = ld.start > l ? l - 0.5 : ld.start;
                        return { ...ld, start: newStart, end: newEnd };
                      }
                    }));
                    triggerAutoSave();
                  }}
                  className="w-48 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-sm font-black font-mono text-sky-400 bg-[#121c32] border border-[#21396a] px-2.5 py-1 rounded min-w-[75px] text-center">
                  {formatUnit(beamLength, 'length', unitSystem)}
                </span>
              </div>
            </div>

            {/* View Selector Tabs (Matches image style) */}
            <div className="border-b border-[#1b2a47] flex gap-1 bg-[#0a0f1d] p-1 rounded-t-lg">
              {[
                { id: "visualizer", label: "Vista de Viga", icon: "📐" },
                { id: "properties", label: "Propiedades", icon: "📊" },
                { id: "calculations", label: "Cálculos", icon: "🧾" },
                { id: "notes", label: "Notas", icon: "📝" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? "bg-[#0d1527] text-white border-t-2 border-blue-500 font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB CONTENT SPACES */}
            {activeTab === "visualizer" && (
              <div className="space-y-5">
                <BeamVisualizer
                  length={beamLength}
                  loads={loads}
                  reactions={solvedResult.reactions}
                  onUpdateLoadPosition={handleUpdateLoadPosition}
                  sectionType={sectionType}
                  supportAPosition={supportAPosition}
                  supportBPosition={supportBPosition}
                  supportCPosition={supportCPosition}
                  supportDPosition={supportDPosition}
                  supportAType={supportAType}
                  supportBType={supportBType}
                  supportCType={supportCType}
                  supportDType={supportDType}
                  onUpdateSupportPosition={handleUpdateSupportPosition}
                  onUpdateSupportType={handleUpdateSupportType}
                  unitSystem={unitSystem}
                />
                
                {/* Embedded Charts plots */}
                <BeamCharts
                  points={solvedResult.points}
                  elasticModulus={activeMaterial.elasticModulus}
                  showShear={showShear}
                  setShowShear={setShowShear}
                  showMoment={showMoment}
                  setShowMoment={setShowMoment}
                  showStress={showStress}
                  setShowStress={setShowStress}
                  showStrain={showStrain}
                  setShowStrain={setShowStrain}
                  showDeflection={showDeflection}
                  setShowDeflection={setShowDeflection}
                  unitSystem={unitSystem}
                />
              </div>
            )}

            {activeTab === "properties" && (
              <div className="bg-[#0d1527] border border-[#1b2a47] rounded-xl p-5 shadow-2xl space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-300 font-sans uppercase mb-2">Información del Perfil de Viga</h4>
                  <p className="text-xs text-slate-400">Croquis acotado bidimensional representando la distribución de masa y los ejes principales neutros de inercia.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center bg-[#0a101f] p-4 rounded-xl border border-[#16243f]">
                  {/* Dynamic section vector drawing based on selected cross-section */}
                  <div className="w-48 h-48 bg-[#070b13] border border-[#192a4a] rounded flex items-center justify-center p-2 shrink-0">
                    {sectionType === SectionType.I_BEAM && (
                      <svg viewBox="0 0 160 160" className="w-full h-full stroke-blue-500 fill-blue-500/10" strokeWidth="1.5">
                        {/* I-Beam Shape */}
                        <path d="M 30,20 L 130,20 L 130,40 L 90,40 L 90,120 L 130,120 L 130,140 L 30,140 L 30,120 L 70,120 L 70,40 L 30,40 Z" />
                        {/* Dimension Lines annotations */}
                        <line x1="20" y1="20" x2="20" y2="140" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                        <line x1="15" y1="20" x2="25" y2="20" stroke="#f59e0b" strokeWidth="1" />
                        <line x1="15" y1="140" x2="25" y2="140" stroke="#f59e0b" strokeWidth="1" />
                        <text x="12" y="84" className="fill-amber-400 font-mono text-[9px]" textAnchor="end">h</text>

                        <line x1="30" y1="10" x2="130" y2="10" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                        <line x1="30" y1="5" x2="30" y2="15" stroke="#f59e0b" strokeWidth="1" />
                        <line x1="130" y1="5" x2="130" y2="15" stroke="#f59e0b" strokeWidth="1" />
                        <text x="80" y="8" className="fill-amber-400 font-mono text-[9px]" textAnchor="middle">b</text>

                        {/* Neutral axis */}
                        <line x1="10" y1="80" x2="150" y2="80" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="148" y="75" className="fill-emerald-400 font-mono text-[8px]" textAnchor="end">Eje Neutro X-X</text>
                      </svg>
                    )}

                    {sectionType === SectionType.C_CHANNEL && (
                      <svg viewBox="0 0 160 160" className="w-full h-full stroke-blue-500 fill-blue-500/10" strokeWidth="1.5">
                        {/* C-Channel Shape */}
                        <path d="M 40,20 L 120,20 L 120,40 L 75,40 L 75,120 L 120,120 L 120,140 L 40,140 Z" />
                        {/* Dimension annotations */}
                        <line x1="30" y1="20" x2="30" y2="140" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                        <text x="22" y="84" className="fill-amber-400 font-mono text-[9px]" textAnchor="end">h</text>
                        <line x1="40" y1="10" x2="120" y2="10" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                        <text x="80" y="8" className="fill-amber-400 font-mono text-[9px]" textAnchor="middle">b</text>
                      </svg>
                    )}

                    {sectionType === SectionType.CIRCULAR && (
                      <svg viewBox="0 0 160 160" className="w-full h-full stroke-blue-500 fill-blue-500/10" strokeWidth="1.5">
                        {/* Hollow or Solid Circle shape */}
                        {sectionProps.tw > 0 ? (
                          <g>
                            <circle cx="80" cy="80" r="60" />
                            <circle cx="80" cy="80" r="45" className="fill-[#070b13]" />
                            <line x1="50" y1="90" x2="38" y2="102" stroke="#f59e0b" strokeWidth="1.2" />
                            <text x="32" y="112" className="fill-amber-400 font-mono text-[8px]">tw</text>
                          </g>
                        ) : (
                          <circle cx="80" cy="80" r="60" />
                        )}
                        <line x1="10" y1="80" x2="150" y2="80" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" />
                        {/* OD diameter annotation */}
                        <line x1="80" y1="20" x2="80" y2="140" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                        <text x="85" y="50" className="fill-amber-400 font-mono text-[8px]" textAnchor="start">D = h</text>
                      </svg>
                    )}

                    {sectionType === SectionType.RHS_SHS && (
                      <svg viewBox="0 0 160 160" className="w-full h-full stroke-blue-500 fill-blue-500/10" strokeWidth="1.5">
                        {/* RHS shape */}
                        <g>
                          <rect x="30" y="25" width="100" height="110" rx="4" />
                          <rect x="42" y="37" width="76" height="86" rx="2" className="fill-[#070b13]" />
                        </g>
                        <line x1="15" y1="25" x2="15" y2="135" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                        <text x="10" y="80" className="fill-amber-400 font-mono text-[9px]" textAnchor="end">h</text>
                        <line x1="30" y1="12" x2="130" y2="12" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                        <text x="80" y="8" className="fill-amber-400 font-mono text-[9px]" textAnchor="middle">b</text>
                      </svg>
                    )}

                    {sectionType === SectionType.RECT_SOLID && (
                      <svg viewBox="0 0 160 160" className="w-full h-full stroke-blue-500 fill-blue-500/15" strokeWidth="1.5">
                        {/* Solid Rectangle Shape */}
                        <g>
                          <rect x="35" y="25" width="90" height="110" rx="2" />
                        </g>
                        {/* Dimension Lines annotations */}
                        <line x1="20" y1="25" x2="20" y2="135" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                        <text x="12" y="84" className="fill-amber-400 font-mono text-[9px]" textAnchor="end">h</text>
                        <line x1="35" y1="12" x2="125" y2="12" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                        <text x="80" y="8" className="fill-amber-400 font-mono text-[9px]" textAnchor="middle">b</text>
                        
                        {/* Neutral axis */}
                        <line x1="10" y1="80" x2="150" y2="80" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="148" y="75" className="fill-emerald-400 font-mono text-[8px]" textAnchor="end">X-X</text>
                      </svg>
                    )}
                  </div>

                  {/* Mechanical Property output values */}
                  <div className="flex-1 w-full space-y-3.5">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-widest font-sans mt-2 block border-b border-[#1f2e4d] pb-1">
                      MÉTRICAS GEOMÉTRICAS ESTIMADAS
                    </span>
                    {(() => {
                      const geom = calculateSectionProperties(sectionType, sectionProps);
                      const linearMass = (geom.area / 1e6) * activeMaterial.density;
                      return (
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-slate-500">Área de la Sección (A):</div>
                            <div className="font-mono font-bold text-slate-200">
                              {formatUnit(geom.area, 'area', unitSystem)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Momento de Inercia (Ix):</div>
                            <div className="font-mono font-bold text-slate-200">
                              {formatUnit(geom.inertia, 'inertia', unitSystem, 1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Módulo Sección Elástico (Wx):</div>
                            <div className="font-mono font-bold text-slate-200">
                              {formatUnit(geom.modulus, 'modulus', unitSystem, 0)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Radio de Giro (r):</div>
                            <div className="font-mono font-bold text-slate-200">
                              {formatUnit(geom.radiusOfGyration, 'section', unitSystem)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Masa Lineal (viga):</div>
                            <div className="font-mono font-bold text-slate-200">
                              {formatUnit(linearMass, 'linearMass', unitSystem)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Área de Cortante (Av):</div>
                            <div className="font-mono font-bold text-slate-200">
                              {formatUnit(geom.shearArea, 'area', unitSystem)}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="bg-[#121c32]/50 p-2 rounded text-[10.5px] text-[#8fa5d0]">
                      📊 Los perfiles con mayor brida ('b') confieren excelente inercia lateral, mientras que la la altura vertical ('h') optimiza el Ix principal para resistir momentos flectores críticos sin pandeo.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "calculations" && (
              <div className="bg-[#0d1527] border border-[#1b2a47] rounded-xl p-5 shadow-2xl space-y-4">
                <h4 className="text-sm font-bold text-slate-300 font-sans uppercase">Memoria de Cálculo y Ecuaciones</h4>
                
                <div className="space-y-4 text-xs text-slate-400">
                  <div className="bg-[#0a101f] p-3.5 rounded border border-[#16243f]">
                    <span className="text-xs font-bold text-slate-200 block mb-1">Ecuaciones de Equilibrio Estático</span>
                    <p className="leading-relaxed mb-2">Para una viga bi-apoyada isoestática, las reacciones se resuelven por sumatoria de momentos y fuerzas:</p>
                    <div className="font-mono bg-[#111c33] p-2 rounded text-[11px] text-amber-400 flex flex-col gap-1">
                      <span>Σ Fy = Ra + Rb - Σ P_i - ∫ w_j(x) dx = 0</span>
                      <span>Σ Ma = Rb · L - Σ P_i · x_p - Σ W_j · d_j = 0</span>
                    </div>
                  </div>

                  <div className="bg-[#0a101f] p-3.5 rounded border border-[#16243f]">
                    <span className="text-xs font-bold text-slate-200 block mb-1">Esfuerzo por Flexión (Ecuación de Navier-Bernoulli)</span>
                    <p className="leading-relaxed mb-2">El esfuerzo normal bending máximo ocurre en la fibra superior/inferior extrema más alejada del eje neutro:</p>
                    <div className="font-mono bg-[#111c33] p-2 rounded text-[11px] text-amber-400">
                      σ_max = M_max · y_max / I_x = M_max / W_x
                    </div>
                  </div>

                  <div className="bg-[#0a101f] p-3.5 rounded border border-[#16243f]">
                    <span className="text-xs font-bold text-slate-200 block mb-1">Esfuerzo Equivalente de Von Mises</span>
                    <p className="leading-relaxed mb-2">Para verificar la fluencia bajo esfuerzos combinados de corte (τ) y flexión (σ):</p>
                    <div className="font-mono bg-[#111c33] p-2 rounded text-[11px] text-amber-400">
                      σ_eq = sqrt( σ² + 3 · τ² )  ≤  Fy / FS
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="bg-[#0d1527] border border-[#1b2a47] rounded-xl p-4 shadow-2xl relative">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase">Bloc de Notas del Proyecto</span>
                  <span className="text-[10px] text-slate-500">Guardado automático activo</span>
                </div>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className="w-full h-80 bg-[#070b13] border border-[#1b2844] rounded-lg p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            )}
          </div>

          {/* COLUMN 4: CALCULATION RESULTS (1/4 Width) */}
          <div className="xl:col-span-1 space-y-5">
            
            {/* "RESULTADOS CLAVE" CARDS */}
            <div className="space-y-3">
              <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Resultados Clave</h4>

              {/* 1. Max bending moment */}
              <div className="bg-[#0e1424] border border-[#1e2e4f] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Momento Máximo</span>
                  <span className="text-lg font-black font-mono text-white block mt-0.5">{solvedResult.maxMoment.value} <span className="text-xs text-slate-400 font-normal">kN·m</span></span>
                  <span className="text-[9.5px] text-slate-500 block font-mono">x = {solvedResult.maxMoment.x.toFixed(3)} m</span>
                </div>
                <div className="text-red-500 text-xs bg-red-950/40 p-2 rounded-lg font-mono">My_max</div>
              </div>

              {/* 2. Max Shear force */}
              <div className="bg-[#0e1424] border border-[#1e2e4f] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Cortante Máximo</span>
                  <span className="text-lg font-black font-mono text-white block mt-0.5">{solvedResult.maxShear.value} <span className="text-xs text-slate-400 font-normal">kN</span></span>
                  <span className="text-[9.5px] text-slate-500 block font-mono">x = {solvedResult.maxShear.x.toFixed(3)} m</span>
                </div>
                <div className="text-sky-500 text-xs bg-sky-950/40 p-2 rounded-lg font-mono">Vz_max</div>
              </div>

              {/* 3. Max deflection */}
              <div className="bg-[#0e1424] border border-[#1e2e4f] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Deflexión Máxima</span>
                  <span className="text-lg font-black font-mono text-white block mt-0.5">{solvedResult.maxDeflection.value} <span className="text-xs text-slate-400 font-normal">mm</span></span>
                  <span className="text-[9.5px] text-slate-500 block font-mono">x = {solvedResult.maxDeflection.x.toFixed(3)} m</span>
                </div>
                <div className="text-emerald-500 text-xs bg-emerald-950/40 p-2 rounded-lg font-mono">δ_max</div>
              </div>

              {/* 4. Max combined Stress */}
              <div className="bg-[#0e1424] border border-[#1e2e4f] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Esfuerzo Máximo</span>
                  <span className="text-md font-black font-mono text-white block mt-0.5">{solvedResult.maxStress.value} <span className="text-xs text-slate-400 font-normal">MPa</span></span>
                  <span className="text-[9.5px] text-slate-500 block font-mono">Límite = {solvedResult.vonMises.fy} MPa</span>
                </div>
                <div className="text-purple-500 text-xs bg-purple-950/40 p-2 rounded-lg font-mono">σ_bend</div>
              </div>
            </div>

            {/* GLOBAL STATUS BANNER */}
            <div className={`p-4 rounded-xl border text-slate-200 shadow-xl ${
              solvedResult.globalStatus.isSafe
                ? "bg-emerald-950/35 border-emerald-500/30"
                : "bg-red-950/35 border-red-500/30"
            }`}>
              <div className="flex items-center gap-2.5 mb-1.5">
                {solvedResult.globalStatus.isSafe ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Estado Global de la Viga</div>
                  <div className={`text-xs font-black tracking-wide ${solvedResult.globalStatus.isSafe ? "text-emerald-400" : "text-red-400"}`}>
                    {solvedResult.globalStatus.isSafe ? "✓ ESTRUCTURA SEGURA" : "⚠️ ESTRUCTURA INSEGURA"}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                El factor de seguridad mínimo obtenido es de <span className={`font-mono font-bold ${
                  solvedResult.globalStatus.isSafe ? "text-emerald-400" : "text-red-400"
                }`}>{solvedResult.globalStatus.minFS}</span>. El valor de diseño admisible de seguridad reglamentario es fs_allow = 1.0.
              </p>
            </div>

            {/* SUPPORT REACTIONS DETAILED CARD */}
            <div className="space-y-3 bg-[#0e1424] border border-[#1e2e4f] rounded-xl p-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-800 pb-1.5 flex justify-between">
                <span>Reacciones de Apoyo</span>
                <span className="text-[9px] text-slate-500 font-mono font-normal">Estática 2D</span>
              </span>
              
              {/* Support A reactions details */}
              {supportAType !== SupportType.FREE && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center font-sans">
                    <span className="text-xs font-bold text-slate-300">Apoyo A (x = {supportAPosition.toFixed(3)} m)</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-blue-950/80 text-blue-400 border border-blue-900">
                      {supportAType}
                    </span>
                  </div>
                  <div className="text-[10.5px] space-y-1 text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span>R_Ay (Vertical)</span>
                      <span className="text-slate-300 font-semibold">{solvedResult.reactions.ra} kN</span>
                    </div>
                    <div className="flex justify-between">
                      <span>R_Ax (Horizontal)</span>
                      <span className="text-slate-300 font-semibold">{solvedResult.reactions.ha} kN</span>
                    </div>
                    {supportAType === SupportType.FIXED && (
                      <div className="flex justify-between text-amber-500 font-semibold">
                        <span>M_A (M. Flector)</span>
                        <span className="font-bold">{solvedResult.reactions.ma} kN·m</span>
                      </div>
                    )}
                    {solvedResult.reactions.ta !== undefined && Math.abs(solvedResult.reactions.ta) > 0.001 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>T_A (M. Torsor)</span>
                        <span className="font-bold">{solvedResult.reactions.ta} kN·m</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Support B reactions details */}
              {supportBType !== SupportType.FREE && (
                <div className="pt-3.5 border-t border-slate-800 space-y-2">
                  <div className="flex justify-between items-center font-sans">
                    <span className="text-xs font-bold text-slate-300">Apoyo B (x = {supportBPosition.toFixed(3)} m)</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-blue-950/80 text-blue-400 border border-blue-900">
                      {supportBType}
                    </span>
                  </div>
                  <div className="text-[10.5px] space-y-1 text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span>R_By (Vertical)</span>
                      <span className="text-slate-300 font-semibold">{solvedResult.reactions.rb} kN</span>
                    </div>
                    <div className="flex justify-between">
                      <span>R_Bx (Horizontal)</span>
                      <span className="text-slate-300 font-semibold">{solvedResult.reactions.hb} kN</span>
                    </div>
                    {supportBType === SupportType.FIXED && (
                      <div className="flex justify-between text-amber-500 font-semibold">
                        <span>M_B (M. Flector)</span>
                        <span className="font-bold">{solvedResult.reactions.mb} kN·m</span>
                      </div>
                    )}
                    {solvedResult.reactions.tb !== undefined && Math.abs(solvedResult.reactions.tb) > 0.001 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>T_B (M. Torsor)</span>
                        <span className="font-bold">{solvedResult.reactions.tb} kN·m</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Support C reactions details */}
              {supportCType !== SupportType.FREE && (
                <div className="pt-3.5 border-t border-slate-800 space-y-2">
                  <div className="flex justify-between items-center font-sans">
                    <span className="text-xs font-bold text-slate-300">Apoyo C (x = {supportCPosition.toFixed(3)} m)</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-blue-950/80 text-blue-400 border border-blue-900">
                      {supportCType}
                    </span>
                  </div>
                  <div className="text-[10.5px] space-y-1 text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span>R_Cy (Vertical)</span>
                      <span className="text-slate-300 font-semibold">{solvedResult.reactions.rc} kN</span>
                    </div>
                    <div className="flex justify-between">
                      <span>R_Cx (Horizontal)</span>
                      <span className="text-slate-300 font-semibold">{solvedResult.reactions.hc} kN</span>
                    </div>
                    {supportCType === SupportType.FIXED && (
                      <div className="flex justify-between text-amber-500 font-semibold">
                        <span>M_C (M. Flector)</span>
                        <span className="font-bold">{solvedResult.reactions.mc} kN·m</span>
                      </div>
                    )}
                    {solvedResult.reactions.tc !== undefined && Math.abs(solvedResult.reactions.tc) > 0.001 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>T_C (M. Torsor)</span>
                        <span className="font-bold">{solvedResult.reactions.tc} kN·m</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Support D reactions details */}
              {supportDType !== SupportType.FREE && (
                <div className="pt-3.5 border-t border-slate-800 space-y-2">
                  <div className="flex justify-between items-center font-sans">
                    <span className="text-xs font-bold text-slate-300">Apoyo D (x = {supportDPosition.toFixed(3)} m)</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-blue-950/80 text-blue-400 border border-blue-900">
                      {supportDType}
                    </span>
                  </div>
                  <div className="text-[10.5px] space-y-1 text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span>R_Dy (Vertical)</span>
                      <span className="text-slate-300 font-semibold">{solvedResult.reactions.rd} kN</span>
                    </div>
                    <div className="flex justify-between">
                      <span>R_Dx (Horizontal)</span>
                      <span className="text-slate-300 font-semibold">{solvedResult.reactions.hd} kN</span>
                    </div>
                    {supportDType === SupportType.FIXED && (
                      <div className="flex justify-between text-amber-500 font-semibold">
                        <span>M_D (M. Flector)</span>
                        <span className="font-bold">{solvedResult.reactions.md} kN·m</span>
                      </div>
                    )}
                    {solvedResult.reactions.td !== undefined && Math.abs(solvedResult.reactions.td) > 0.001 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>T_D (M. Torsor)</span>
                        <span className="font-bold">{solvedResult.reactions.td} kN·m</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* FAILURE VERIFICATIONS CARDS (Matches image cards exactly!) */}
            <div className="space-y-3.5 bg-[#0e1424] border border-[#1e2e4f] rounded-xl p-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-800 pb-1.5">Verificación de Falla</span>
              
              {/* Von Mises item detail */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">Criterio Von Mises</span>
                  <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold font-mono ${
                    solvedResult.vonMises.status === "SAFE" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-900" : "bg-red-950/80 text-red-400 border border-red-900"
                  }`}>
                    {solvedResult.vonMises.status === "SAFE" ? "✓ SAFE" : "⚠️ FAIL"}
                  </span>
                </div>
                <div className="text-[10.5px] space-y-1 text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>σ_eq (Esfuerzo equiv.)</span>
                    <span className="text-slate-300 font-semibold">{solvedResult.vonMises.sigmaEq} MPa</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fy (Fluencia)</span>
                    <span className="text-slate-300">{solvedResult.vonMises.fy} MPa</span>
                  </div>
                  <div className="flex justify-between text-blue-400">
                    <span>FS (Factor Seg.)</span>
                    <span className="font-bold">{solvedResult.vonMises.fs}</span>
                  </div>
                </div>
              </div>

              {/* Tresca item detail */}
              <div className="pt-3.5 border-t border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">Criterio Tresca</span>
                  <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold font-mono ${
                    solvedResult.tresca.status === "SAFE" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-900" : "bg-red-950/80 text-red-400 border border-red-900"
                  }`}>
                    {solvedResult.tresca.status === "SAFE" ? "✓ SAFE" : "⚠️ FAIL"}
                  </span>
                </div>
                <div className="text-[10.5px] space-y-1 text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>τ_max (Corte máx)</span>
                    <span className="text-slate-300 font-semibold">{solvedResult.tresca.tauMax} MPa</span>
                  </div>
                  <div className="flex justify-between">
                    <span>τ_allow (Admisible)</span>
                    <span className="text-slate-300">{solvedResult.tresca.tauAllow} MPa</span>
                  </div>
                  <div className="flex justify-between text-blue-400">
                    <span>FS (Factor Seg.)</span>
                    <span className="font-bold">{solvedResult.tresca.fs}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
          </>
        )}

      </main>

      {/* 3. SLIDING CHAT SIDEBAR PANEL (Asistente AI) */}
      <AIBeamAssistant
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        beamLength={beamLength}
        sectionType={sectionType}
        sectionProps={sectionProps}
        material={activeMaterial}
        loads={loads}
        results={solvedResult}
        includeSelfWeight={includeSelfWeight}
      />

      {/* COMPARAR MODAL POPUP */}
      {compararModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in select-text">
          <div className="bg-[#0b111e] border border-[#1e2e4f] rounded-xl max-w-lg w-full p-6 space-y-5 text-slate-300">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">Módulo de Comparación Estructural</h3>
              <button onClick={() => setCompararModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Esta herramienta permite realizar cálculos comparativos de coeficientes elásticos del perfil actual vs alternativas de menor peso.
            </p>
            <div className="space-y-2 text-xs">
              <div className="bg-[#121c32] p-2.5 rounded border border-[#1b2b4d] flex justify-between items-center font-mono">
                <div>
                  <div className="text-[10px] text-slate-500">Alternativa 1: Canal C [200x80]</div>
                  <span className="text-slate-300 font-semibold font-sans">Canal de Acero ASTM A36</span>
                </div>
                <span className="text-sky-400 font-semibold">Inercia: 13.5 x10⁶ mm⁴</span>
              </div>
              <div className="bg-[#121c32] p-2.5 rounded border border-[#1b2b4d] flex justify-between items-center font-mono">
                <div>
                  <div className="text-[10px] text-slate-500">Perfil Actual: Perfil I [300x150]</div>
                  <span className="text-slate-300 font-semibold font-sans">ASTM A572 Gr 50</span>
                </div>
                <span className="text-emerald-400 font-semibold">Inercia: {((
                  sectionType === SectionType.CIRCULAR 
                    ? (sectionProps.tw > 0 ? ((Math.PI/64) * (Math.pow(sectionProps.height,4) - Math.pow(sectionProps.height - 2*sectionProps.tw,4))) : ((Math.PI/64) * Math.pow(sectionProps.height,4)))
                    : (sectionProps.width * Math.pow(sectionProps.height, 3) / 12 - (sectionProps.width - (sectionType === SectionType.RHS_SHS ? 2*sectionProps.tw : sectionProps.tw)) * Math.pow(sectionProps.height - 2*sectionProps.tf, 3) / 12)
                ) / 1e6).toFixed(2)} x10⁶ mm⁴</span>
              </div>
            </div>
            <div className="flex justify-end pt-3 text-xs border-t border-slate-800">
              <button onClick={() => setCompararModal(false)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 cursor-pointer">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROYECTOS HISTORIAL/GUARDADOS MODAL */}
      {historialModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in select-text">
          <div className="bg-[#0b111e] border border-[#1e2e4f] rounded-xl max-w-lg w-full p-6 space-y-5 text-slate-300">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">Proyectos Guardados de Viga</h3>
              <button onClick={() => setHistorialModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-400">Selecciona un registro de cálculo guardado en cookies locales o carga un preajustado:</p>
            <div className="space-y-2 text-xs">
              {PROJECT_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleTemplateChange(idx);
                    setHistorialModal(false);
                  }}
                  className="w-full text-left bg-[#121c32] p-2.5 rounded border border-[#1b2b4d] flex justify-between items-center hover:border-slate-400 transition-colors tooltip"
                >
                  <div>
                    <div className="font-bold text-slate-200">{tmpl.name}</div>
                    <span className="text-[10px] text-slate-500 font-mono">Longitud: {tmpl.length} m - Sección: {tmpl.sectionType}</span>
                  </div>
                  <span className="text-sky-400 font-semibold text-[10.5px]">Cargar →</span>
                </button>
              ))}
            </div>
            <div className="pt-3 text-right text-xs border-t border-[#1e2e4f]">
              <button onClick={() => setHistorialModal(false)} className="px-4 py-2 bg-[#1b2844] text-slate-300 rounded hover:bg-[#152342] cursor-pointer">
                Refrescar lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC MEMORIA DE CÁLCULO MODAL */}
      {showReport && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 animate-fade-in select-text overflow-y-auto">
          <div className="bg-[#0c1222] border-2 border-amber-500/30 rounded-xl max-w-3xl w-full p-8 space-y-6 text-slate-300 shadow-2xl relative my-8">
            <button
              onClick={() => setShowReport(false)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white font-bold text-lg"
            >
              ✕
            </button>

            {/* Document Header */}
            <div className="border-b-2 border-slate-800 pb-4 text-center">
              <span className="text-[10px] uppercase font-black text-amber-500 tracking-wider">Memoria de Cálculo de Ingeniería</span>
              <h2 className="text-lg font-black text-white mt-1 uppercase">GORA ENGINEERING INTELLIGENCE REPORT</h2>
              <div className="flex gap-4 justify-center text-[10px] text-slate-500 font-mono mt-1">
                <span>Fecha: {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
                <span>•</span>
                <span>Resolvedor: Estático Determinado v4.1</span>
              </div>
            </div>

            {/* Section 1: Beam specs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-[#121c32] p-2.5 rounded border border-[#1b2b4d]">
                <div className="text-slate-500 font-sans">Longitud de Viga:</div>
                <div className="font-mono text-white font-semibold mt-0.5">{formatUnit(beamLength, 'length', unitSystem)}</div>
              </div>
              <div className="bg-[#121c32] p-2.5 rounded border border-[#1b2b4d]">
                <div className="text-slate-500 font-sans">Perfil Longitudinal:</div>
                <div className="font-mono text-white font-semibold mt-0.5">{sectionType}</div>
              </div>
              <div className="bg-[#121c32] p-2.5 rounded border border-[#1b2b4d]">
                <div className="text-slate-500 font-sans">Calidad Acero::</div>
                <div className="font-mono text-white font-semibold mt-0.5">{activeMaterial.name}</div>
              </div>
              <div className="bg-[#121c32] p-2.5 rounded border border-[#1b2b4d]">
                <div className="text-slate-500 font-sans">Estatuto de Seguridad:</div>
                <div className={`font-mono font-bold mt-0.5 ${solvedResult.globalStatus.isSafe ? "text-emerald-400" : "text-red-400"}`}>
                  {solvedResult.globalStatus.isSafe ? "✓ ESTRUCTURA SEGURA" : "⚠️ INSEGURA"}
                </div>
              </div>
            </div>

            {/* Section: Esquema de la Viga y Cargas en Reporte */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-slate-400">Esquema Mecánico y Estados de Carga (CAD)</span>
              <div className="bg-[#090e1a] rounded-xl p-0.5 overflow-hidden border border-slate-800">
                <BeamVisualizer
                  length={beamLength}
                  loads={loads}
                  reactions={solvedResult.reactions}
                  onUpdateLoadPosition={() => {}}
                  sectionType={sectionType}
                  supportAPosition={supportAPosition}
                  supportBPosition={supportBPosition}
                  supportCPosition={supportCPosition}
                  supportDPosition={supportDPosition}
                  supportAType={supportAType}
                  supportBType={supportBType}
                  supportCType={supportCType}
                  supportDType={supportDType}
                  readOnly={true}
                  unitSystem={unitSystem}
                />
              </div>
            </div>

            {/* Section 2: Calculated Extrema values table */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-slate-400">Valores Extremos y Limitantes Estimados</span>
              <table className="w-full text-xs text-left text-slate-300 font-mono border-collapse border border-slate-800">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-sans text-[11px]">
                    <th className="p-2 border border-slate-800">Parámetro</th>
                    <th className="p-2 border border-slate-800">Unidades</th>
                    <th className="p-2 border border-slate-800">Ubicación (x)</th>
                    <th className="p-2 border border-slate-800">Magnitud</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-slate-800 font-sans">Momento Flector de Diseño My_max</td>
                    <td className="p-2 border border-slate-800">kN·m</td>
                    <td className="p-2 border border-slate-800">{solvedResult.maxMoment.x.toFixed(3)} m</td>
                    <td className="p-2 border border-slate-800 font-bold">{solvedResult.maxMoment.value}</td>
                  </tr>
                  <tr className="bg-slate-900/40">
                    <td className="p-2 border border-slate-800 font-sans">Esfuerzo de Corte de Diseño Vz_max</td>
                    <td className="p-2 border border-slate-800">kN</td>
                    <td className="p-2 border border-slate-800">{solvedResult.maxShear.x.toFixed(3)} m</td>
                    <td className="p-2 border border-slate-800 font-bold">{solvedResult.maxShear.value}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-800 font-sans">Hundimiento Elástico de la Viga \delta_max</td>
                    <td className="p-2 border border-slate-800">mm</td>
                    <td className="p-2 border border-slate-800">{solvedResult.maxDeflection.x.toFixed(3)} m</td>
                    <td className="p-2 border border-slate-800 font-bold">{solvedResult.maxDeflection.value}</td>
                  </tr>
                  <tr className="bg-slate-900/40">
                    <td className="p-2 border border-slate-800 font-sans">Esfuerzo de Tracción Crítico \sigma_max</td>
                    <td className="p-2 border border-slate-800">MPa</td>
                    <td className="p-2 border border-slate-800">{solvedResult.maxStress.x.toFixed(3)} m</td>
                    <td className="p-2 border border-slate-800 font-bold text-amber-400">{solvedResult.maxStress.value}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculations notes block */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-slate-400">Notas de Trabajo y Verificación de Flujo</span>
              <pre className="bg-[#080d16] p-3 rounded-lg border border-[#162136] text-[11px] font-mono whitespace-pre-wrap text-[#bdcce4]">
                {notesText ? notesText : "Sin anotaciones adjuntas para el reporte."}
              </pre>
            </div>

            {/* Disclaimer & signatures */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500">
              <div>
                <span className="block font-bold text-slate-400">ORGANISMO DE CONTROL ESTÁNDAR:</span>
                <span>Fórmula basada en la teoría elástica de vigas lineales de Euler-Bernoulli. No considera efectos dinámicos de fatiga ni pandeo torsional lateral (LTB).</span>
              </div>
              <div className="text-right flex flex-col justify-end">
                <span className="italic block font-serif text-slate-400">GORA Engineering Intelligence System v4.1</span>
                <span>Certificación Digital de Estaticidad</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowReport(false)}
                className="px-4 py-2 text-xs rounded border border-slate-800 bg-[#0ea5e9]/0 hover:bg-[#0ea5e9]/10 text-slate-400 hover:text-white cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 text-xs rounded bg-sky-600 hover:bg-sky-505 text-white font-bold cursor-pointer"
              >
                Imprimir Documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
