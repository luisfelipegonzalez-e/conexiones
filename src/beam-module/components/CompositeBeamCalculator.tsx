import React, { useState } from "react";
import { 
  Calculator, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Sparkles,
  Ruler,
  Wrench,
  Layers,
  ArrowRight,
  Download,
  Plus,
  Trash2,
  ArrowDown,
  MoveRight,
  HelpCircle,
  Save
} from "lucide-react";
import { generateBeamPDF, PDFBeamData } from "../utils/pdfGenerator";
import { solveBeam } from "../utils/structuralSolver";
import { BeamLoad, LoadType, SupportType, SectionType } from "../types";

interface BarPreset {
  diameter: number; // mm
  area: number;     // mm2
  name: string;
}

const BAR_PRESETS: BarPreset[] = [
  { name: "Ø10 (N° 3)", diameter: 10, area: 78.54 },
  { name: "Ø12 (3/8\")", diameter: 12, area: 113.10 },
  { name: "Ø16 (1/2\")", diameter: 16, area: 201.06 },
  { name: "Ø20 (5/8\")", diameter: 20, area: 314.16 },
  { name: "Ø25 (1\")", diameter: 25, area: 490.87 },
  { name: "Ø32 (1 1/4\")", diameter: 32, area: 804.25 },
];

const STIRRUP_PRESETS: BarPreset[] = [
  { name: "Estribo Ø8", diameter: 8, area: 50.27 },
  { name: "Estribo Ø10 (N° 3)", diameter: 10, area: 78.54 },
  { name: "Estribo Ø12 (1/2\")", diameter: 12, area: 113.10 },
];

export default function CompositeBeamCalculator() {
  // 1. INPUT STATES
  const [b, setB] = useState<number>(300); // base width (mm)
  const [h, setH] = useState<number>(500); // total height (mm)
  const [r, setR] = useState<number>(40);  // concrete cover (mm)
  
  const [fc, setFc] = useState<number>(28);  // concrete cylinder f'c (MPa)
  const [fy, setFy] = useState<number>(420); // steel yield strength tensile (MPa)
  const [fyt, setFyt] = useState<number>(420); // steel yield strength stirrups (MPa)

  // Tensile reinforcing steel (Armadura longitudinal)
  const [numBars, setNumBars] = useState<number>(4);
  const [selectedBarIdx, setSelectedBarIdx] = useState<number>(2); // Default Ø16
  const [customAsEnabled, setCustomAsEnabled] = useState<boolean>(false);
  const [customAs, setCustomAs] = useState<number>(800); // custom steel area mm2

  // Stirrups (Armadura transversal)
  const [selectedStirrupIdx, setSelectedStirrupIdx] = useState<number>(0); // Default Ø8
  const [stirrupLegs, setStirrupLegs] = useState<number>(2); // Number of shear legs
  const [stirrupSpacing, setStirrupSpacing] = useState<number>(150); // spacing (mm)

  // Top/Upper reinforcement bars (Barras superiores / perchas para estribos)
  const [numTopBars, setNumTopBars] = useState<number>(2);
  const [selectedTopBarIdx, setSelectedTopBarIdx] = useState<number>(1); // Default Ø12 (index 1 of BAR_PRESETS)

  // Demands
  const [mu, setMu] = useState<number>(120); // Factored Moment Mu (kN·m)
  const [vu, setVu] = useState<number>(80);  // Factored Shear Vu (kN)

  // Deflection & Serviceability Inputs
  const [beamLength, setBeamLength] = useState<number>(6.0); // m
  const [supportCondition, setSupportCondition] = useState<"simple" | "cantilever" | "fixed">("simple");
  const [deadLoad, setDeadLoad] = useState<number>(10.0); // kN/m
  const [liveLoad, setLiveLoad] = useState<number>(8.0); // kN/m

  // 1.5. CUSTOM LOAD BUILDER AND SOLVER STATES
  const [customLoadsEnabled, setCustomLoadsEnabled] = useState<boolean>(false);
  const [includeSelfWeight, setIncludeSelfWeight] = useState<boolean>(true);
  const [customLoads, setCustomLoads] = useState<any[]>([
    { id: "cl_1", type: LoadType.DISTRIBUTED, category: "dead", magnitude: 10.0, start: 0, end: 6.0 },
    { id: "cl_2", type: LoadType.DISTRIBUTED, category: "live", magnitude: 8.0, start: 0, end: 6.0 }
  ]);

  // Form states for adding custom loads
  const [clType, setClType] = useState<LoadType>(LoadType.DISTRIBUTED);
  const [clCategory, setClCategory] = useState<"dead" | "live">("dead");
  const [clMagnitude, setClMagnitude] = useState<number>(10);
  const [clMagnitudeStart, setClMagnitudeStart] = useState<number>(0);
  const [clMagnitudeEnd, setClMagnitudeEnd] = useState<number>(15);
  const [clPosition, setClPosition] = useState<number>(3.0);
  const [clStart, setClStart] = useState<number>(0);
  const [clEnd, setClEnd] = useState<number>(6.0);
  const [isAddingCl, setIsAddingCl] = useState<boolean>(false);

  const handleAddCustomLoad = (e: React.FormEvent) => {
    e.preventDefault();
    let newLoad: any;
    if (clType === LoadType.POINT) {
      newLoad = {
        id: "cl_" + Math.random().toString(36).substring(2, 9),
        type: LoadType.POINT,
        category: clCategory,
        magnitude: parseFloat(clMagnitude as any) || 0,
        position: parseFloat(clPosition as any) || 0
      };
    } else if (clType === LoadType.TRIANGULAR) {
      newLoad = {
        id: "cl_" + Math.random().toString(36).substring(2, 9),
        type: LoadType.TRIANGULAR,
        category: clCategory,
        magnitudeStart: parseFloat(clMagnitudeStart as any) || 0,
        magnitudeEnd: parseFloat(clMagnitudeEnd as any) || 0,
        start: parseFloat(clStart as any) || 0,
        end: parseFloat(clEnd as any) || 0
      };
    } else {
      newLoad = {
        id: "cl_" + Math.random().toString(36).substring(2, 9),
        type: LoadType.DISTRIBUTED,
        category: clCategory,
        magnitude: parseFloat(clMagnitude as any) || 0,
        start: parseFloat(clStart as any) || 0,
        end: parseFloat(clEnd as any) || 0
      };
    }
    setCustomLoads([...customLoads, newLoad]);
    setIsAddingCl(false);
  };

  const handleRemoveCustomLoad = (id: string) => {
    setCustomLoads(customLoads.filter(l => l.id !== id));
  };

  // Active parameter tab within calculations
  const [activeTab, setActiveTab] = useState<"geometry" | "tensile" | "shear" | "deflection" | "formulas">("geometry");

  // Autogenerated message / analysis tip state
  const [tipText, setTipText] = useState<string>("La cuantía de acero está equilibrada. El diseño cumple con el comportamiento dúctil requerido por la norma ACI 318.");

  // 2. FORMULAS & RESULTS ENGINE
  const selectedBar = BAR_PRESETS[selectedBarIdx];
  const selectedStirrup = STIRRUP_PRESETS[selectedStirrupIdx];

  // Effective depth
  const d = h - r - selectedStirrup.diameter - (selectedBar.diameter / 2);

  // Steel area
  const As = customAsEnabled ? customAs : numBars * selectedBar.area;

  // Clear spacing between rebar columns
  const clearSpacingBetweenBars = numBars > 1
    ? (b - 2 * r - 2 * selectedStirrup.diameter - numBars * selectedBar.diameter) / (numBars - 1)
    : 0;

  // Steel ratio (Cuantía de acero)
  const rho = As / (b * d);

  // Beta 1 calculation (ACI-318)
  let beta1 = 0.85;
  if (fc > 28) {
    beta1 = Math.max(0.65, 0.85 - (0.05 * (fc - 28)) / 7);
  }

  // Minimum steel ratio (ACI 318 9.6.1)
  const rhoMin1 = (0.25 * Math.sqrt(fc)) / fy;
  const rhoMin2 = 1.4 / fy;
  const rhoMin = Math.max(rhoMin1, rhoMin2);
  const AsMin = rhoMin * b * d;

  // Balanced steel ratio (ACI-318)
  const Es = 200000; // MPa
  const epsilonConcrete = 0.003;
  // c_b = 0.003 / (0.003 + fy/Es) * d
  const cb = (epsilonConcrete / (epsilonConcrete + fy / Es)) * d;
  const ab = beta1 * cb;
  const AsBalanced = (0.85 * fc * b * ab) / fy;
  const rhoBalanced = AsBalanced / (b * d);

  // Maximum steel ratio (strain of 0.004)
  // c_max = 0.003 / (0.003 + 0.004) * d = 3/7 * d
  const cMax = (3.0 / 7.0) * d;
  const aMax = beta1 * cMax;
  const AsMax = (0.85 * fc * b * aMax) / fy;
  const rhoMax = AsMax / (b * d);

  // Actual stress block height
  const a = (As * fy) / (0.85 * fc * b);
  const c_depth = a / beta1;

  // Compression or tension strain analysis
  const steelStrain = epsilonConcrete * ((d - c_depth) / c_depth);
  const steelYieldStrain = fy / Es;

  // Strength reduction factor (phi) for flexure
  let phiFlexure = 0.90; // Default tension-controlled
  let failureType = "Dúctil (Control por Tensión)";
  
  if (steelStrain <= steelYieldStrain) {
    phiFlexure = 0.65; // Compression-controlled
    failureType = "Frágil (Control por Compresión) - ¡Peligroso!";
  } else if (steelStrain < 0.005) {
    // Transition zone
    const fraction = (steelStrain - steelYieldStrain) / (0.005 - steelYieldStrain);
    phiFlexure = 0.65 + fraction * 0.25;
    failureType = "Transición (Ductilidad Limitada)";
  }

  // Nominal moment capacity Mn
  const Mn = As * fy * (d - a / 2) * 1e-6; // in kN·m
  const phiMn = phiFlexure * Mn;

  // Shear strength estimates (Cortante)
  const phiShear = 0.75;
  // Vc = 0.17 * sqrt(f'c) * b * d
  const Vc = 0.17 * Math.sqrt(fc) * b * d * 1e-3; // in kN
  // Stirrup area Av
  const Av = stirrupLegs * selectedStirrup.area;
  // Vs = Av * fyt * d / s
  const Vs = (Av * fyt * d / stirrupSpacing) * 1e-3; // in kN
  const Vn = Vc + Vs;
  const phiVn = phiShear * Vn;

  // Maximum spacing limits
  const VcThreshold = 0.33 * Math.sqrt(fc) * b * d * 1e-3; // half spacing threshold
  const maxSpacing = Vs > VcThreshold ? Math.min(d / 4, 300) : Math.min(d / 2, 600);
  const shearSpacingValid = stirrupSpacing <= maxSpacing;

  // --- DEFLECTION (SERVICIABILIDAD / FLECHA) CALCULATIONS ACI 318 ---
  const E_c = 4700 * Math.sqrt(fc); // MPa (Modulus of elasticity of concrete)
  const I_g = (b * Math.pow(h, 3)) / 12; // mm^4 (Gross moment of inertia)
  const f_r = 0.62 * Math.sqrt(fc); // MPa (Concrete modulus of rupture)
  const y_t = h / 2; // mm
  const Mcr = (f_r * I_g / y_t) * 1e-6; // cracking moment in kN·m

  // Self Weight and Material Properties for solver
  const selfWeightKnPerM = (b / 1000) * (h / 1000) * 24.0; // standard reinforced concrete load kN/m
  const beamMaterial = {
    name: "Hormigón",
    fy: fy,
    fu: fy,
    elasticModulus: E_c / 1000, // GPa
    poisson: 0.2,
    density: 2400
  };

  // Build loads for solver
  const activeDeadLoads: BeamLoad[] = [];
  if (customLoadsEnabled) {
    customLoads.filter(l => l.category === "dead").forEach(l => {
      activeDeadLoads.push(l);
    });
    if (includeSelfWeight) {
      activeDeadLoads.push({
        id: "self_weight",
        type: LoadType.DISTRIBUTED,
        magnitude: selfWeightKnPerM,
        start: 0,
        end: beamLength
      });
    }
  }

  const activeLiveLoads = customLoadsEnabled ? customLoads.filter(l => l.category === "live") : [];

  const activeFactoredLoads: BeamLoad[] = [];
  activeDeadLoads.forEach(l => {
    if (l.type === LoadType.TRIANGULAR) {
      activeFactoredLoads.push({
        ...l,
        magnitudeStart: l.magnitudeStart * 1.2,
        magnitudeEnd: l.magnitudeEnd * 1.2
      });
    } else {
      activeFactoredLoads.push({
        ...l,
        magnitude: l.magnitude * 1.2
      } as any);
    }
  });
  activeLiveLoads.forEach(l => {
    if (l.type === LoadType.TRIANGULAR) {
      activeFactoredLoads.push({
        ...l,
        magnitudeStart: l.magnitudeStart * 1.6,
        magnitudeEnd: l.magnitudeEnd * 1.6
      });
    } else {
      activeFactoredLoads.push({
        ...l,
        magnitude: l.magnitude * 1.6
      } as any);
    }
  });

  const activeServiceLoads = [
    ...activeDeadLoads,
    ...activeLiveLoads
  ];

  // Solvers calculation outputs
  let solvedMu = mu;
  let solvedVu = vu;
  let solvedMa = 0;
  let solvedGrossDeadDeflections = 0;
  let solvedGrossServiceTotalDeflections = 0;

  if (customLoadsEnabled) {
    const supportAT = supportCondition === "simple" ? SupportType.PINNED : SupportType.FIXED;
    const supportBT = supportCondition === "simple" ? SupportType.ROLLER : (supportCondition === "cantilever" ? SupportType.FREE : SupportType.FIXED);

    const deadResult = solveBeam(
      beamLength,
      SectionType.RECT_SOLID,
      { height: h, width: b, tf: 0, tw: 0 },
      beamMaterial,
      activeDeadLoads,
      false,
      0,
      beamLength,
      beamLength * 0.33,
      beamLength * 0.66,
      supportAT,
      supportBT
    );

    const factoredResult = solveBeam(
      beamLength,
      SectionType.RECT_SOLID,
      { height: h, width: b, tf: 0, tw: 0 },
      beamMaterial,
      activeFactoredLoads,
      false,
      0,
      beamLength,
      beamLength * 0.33,
      beamLength * 0.66,
      supportAT,
      supportBT
    );

    const serviceResult = solveBeam(
      beamLength,
      SectionType.RECT_SOLID,
      { height: h, width: b, tf: 0, tw: 0 },
      beamMaterial,
      activeServiceLoads as BeamLoad[],
      false,
      0,
      beamLength,
      beamLength * 0.33,
      beamLength * 0.66,
      supportAT,
      supportBT
    );

    solvedMu = Math.max(0.1, Math.abs(factoredResult.maxMoment.value));
    solvedVu = Math.max(0.1, Math.abs(factoredResult.maxShear.value));
    solvedMa = Math.max(0.1, Math.abs(serviceResult.maxMoment.value));
    solvedGrossDeadDeflections = Math.abs(deadResult.maxDeflection.value);
    solvedGrossServiceTotalDeflections = Math.abs(serviceResult.maxDeflection.value);
  }

  // Choose Ma active value based on mode
  const ws = deadLoad + liveLoad || 0.01; // Avoid divide by 0
  let Ma_simple = 0;
  if (supportCondition === "simple") {
    Ma_simple = (ws * Math.pow(beamLength, 2)) / 8;
  } else if (supportCondition === "cantilever") {
    Ma_simple = (ws * Math.pow(beamLength, 2)) / 2;
  } else if (supportCondition === "fixed") {
    Ma_simple = (ws * Math.pow(beamLength, 2)) / 12;
  }

  const Ma = customLoadsEnabled ? solvedMa : Ma_simple;
  const mu_calc = customLoadsEnabled ? solvedMu : mu;
  const vu_calc = customLoadsEnabled ? solvedVu : vu;

  // Cracking analysis & cracked inertia Icr
  const n_mod = 200000 / E_c; // Es = 200,000 MPa, modular ratio
  const rho_el = As / (b * d);
  const k_el = Math.sqrt(Math.pow(rho_el * n_mod, 2) + 2 * rho_el * n_mod) - (rho_el * n_mod);
  const I_cr = (b * Math.pow(k_el * d, 3)) / 3 + n_mod * As * Math.pow(d - k_el * d, 2); // mm^4

  // Effective moment of inertia (Branson equation)
  let I_e = I_g;
  if (Ma > Mcr) {
    const Mcr_over_Ma = Mcr / Ma;
    const ratio_cubed = Math.pow(Mcr_over_Ma, 3);
    I_e = ratio_cubed * I_g + (1 - ratio_cubed) * I_cr;
    if (I_e > I_g) I_e = I_g;
    if (I_e < I_cr) I_e = I_cr; // absolute lower bound is cracked inertia
  }

  const L_mm = beamLength * 1000;
  let delta_im = 0; // Immediate deflection under service load (mm)
  let delta_dead = 0;
  let delta_live = 0;
  let delta_total = 0;

  if (customLoadsEnabled) {
    delta_im = solvedGrossServiceTotalDeflections * (I_g / I_e);
    const delta_im_dead = solvedGrossDeadDeflections * (I_g / I_e);
    delta_live = Math.max(0, delta_im - delta_im_dead);
    delta_dead = delta_im_dead;

    // Sustained deflections
    const lambda_delta = 2.0; 
    const delta_sus = delta_dead + 0.2 * delta_live;
    const delta_lt_add = lambda_delta * delta_sus;
    delta_total = delta_im + delta_lt_add;
  } else {
    // Simple calculations
    if (supportCondition === "simple") {
      delta_im = (5 * ws * Math.pow(L_mm, 4)) / (384 * E_c * I_e);
    } else if (supportCondition === "cantilever") {
      delta_im = (ws * Math.pow(L_mm, 4)) / (8 * E_c * I_e);
    } else if (supportCondition === "fixed") {
      delta_im = (ws * Math.pow(L_mm, 4)) / (384 * E_c * I_e);
    }

    // Immediate dead and live load deflections
    delta_dead = (deadLoad / ws) * delta_im;
    delta_live = (liveLoad / ws) * delta_im;

    // Sustained and additional long-term deflection (creep factor lambda = 2.0)
    const lambda_delta = 2.0; 
    const ws_sus = deadLoad + 0.2 * liveLoad; // Dead load + 20% typical live load sustained
    const delta_sus = (ws_sus / ws) * delta_im;
    const delta_lt_add = lambda_delta * delta_sus;
    delta_total = delta_im + delta_lt_add;
  }

  // Limits standard ACI (L/360 for live load, L/240 for long term total)
  const limit_live = L_mm / 360;
  const limit_total = L_mm / 240;

  // Safety checks (Flexure, Shear, & Deflection)
  const flexureStatus = phiMn >= mu_calc;
  const shearStatus = phiVn >= vu_calc;
  const steelRatioValid = rho >= rhoMin && rho <= rhoMax;
  const deflectionStatus = delta_live <= limit_live && delta_total <= limit_total;

  // Quick action tips generator
  const getAiTip = () => {
    if (rho < rhoMin) {
      return "⚠️ Alerta: El área de acero longitudinal es menor al mínimo normativo. Rellena con barras adicionales para evitar una falla por agrietamiento súbito del concreto.";
    }
    if (rho > rhoMax) {
      return "⚠️ Alerta: La sección está sobre-reforzada (supera cuantía máxima). Esto provocará una falla frágil súbita sin aviso previo. Considera aumentar las dimensiones b o h de la sección.";
    }
    if (!flexureStatus) {
      return "❌ Insuficiente a Flexion: El momento último demandado supera la resistencia de la viga. Incrementa el número de barras de acero o ensancha/eleva la sección de concreto.";
    }
    if (!shearStatus) {
      return "❌ Falla por Cortante: El esfuerzo cortante Vu es mayor que la resistencia de diseño. Acorta el espaciamiento s de los estribos o aumenta el diámetro del estribo.";
    }
    if (!shearSpacingValid) {
      return "📏 Límites de Estribos: El espaciamiento actual de estribos supera el máximo permitido por norma. Reduce el espaciamiento a menos de " + Math.round(maxSpacing) + " mm.";
    }
    if (!deflectionStatus) {
      return "⚠️ Alerta de Deflexión (Serviciabilidad): La flecha total diferida (" + delta_total.toFixed(1) + " mm) supera el límite L/240 (" + limit_total.toFixed(1) + " mm). Aumenta el peralte h o el ancho b de la viga.";
    }
    if (steelStrain >= 0.005) {
      return "✨ Diseño Óptimo y Dúctil: La sección fluye antes de que el concreto falle por aplastamiento. La ductilidad del refuerzo ofrece señales visibles de sobrecarga antes de un colapso.";
    }
    return "✅ Todos los parámetros se encuentran en zonas admisibles bajo normas internacionales ACI 318.";
  };

  const handleDownloadPDF = () => {
    const dataToSend: PDFBeamData = {
      b,
      h,
      r,
      beamLength,
      supportCondition,
      fc,
      fy,
      fyt,
      numBars,
      barName: selectedBar.name,
      barDiameter: selectedBar.diameter,
      asCalculated: As,
      customAsEnabled,
      stirrupName: selectedStirrup.name,
      stirrupDiameter: selectedStirrup.diameter,
      stirrupSpacing,
      stirrupLegs,
      deadLoad,
      liveLoad,
      mu: mu_calc,
      vu: vu_calc,
      d,
      rho,
      rhoMin,
      rhoMax,
      phiFlexure,
      Mn,
      phiMn,
      Vc,
      Vs,
      phiVn,
      maxSpacing,
      I_g,
      I_cr,
      I_e,
      Mcr,
      Ma,
      delta_im,
      delta_live,
      delta_total,
      limit_live,
      limit_total,
      flexureStatus,
      shearStatus,
      steelRatioValid,
      shearSpacingValid,
      deflectionStatus,
    };
    generateBeamPDF(dataToSend);
  };

  return (
    <div className="bg-[#0a0f1d] border border-[#1b2a47] rounded-xl overflow-hidden shadow-2xl flex flex-col h-full text-slate-100">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-[#111827] via-[#0d162d] to-[#111827] border-b border-[#1b2a47] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-900/30 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black font-sans uppercase tracking-wider text-white">Módulo: Vigas Compuestas</h2>
            <p className="text-xs text-slate-400">Diseño y verificación estructural de vigas de concreto armado (reforzado con acero) según ACI-318.</p>
          </div>
        </div>

        {/* Global summary badge & PDF Download button */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white border border-sky-400/25 shadow transition-all cursor-pointer"
            title="Descargar Memoria de Cálculo y Planos de Detalle construidos"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Memoria PDF</span>
          </button>

          <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono uppercase flex items-center gap-1.5 ${
            flexureStatus && shearStatus && steelRatioValid && shearSpacingValid && deflectionStatus
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
              : "bg-amber-950/40 border-amber-500/30 text-amber-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              flexureStatus && shearStatus && steelRatioValid && shearSpacingValid && deflectionStatus ? "bg-emerald-400" : "bg-amber-400"
            }`}></span>
            {flexureStatus && shearStatus && steelRatioValid && shearSpacingValid && deflectionStatus ? "DISEÑO VÁLIDO" : "REVISAR LÍMITES"}
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
        
        {/* LEFT COLUMN: INTERACTIVE PANELS AND CONTROLS (5 cols) */}
        <div className="lg:col-span-5 border-r border-[#1b2a47] flex flex-col bg-[#070b13]/60">
          
          {/* Navigation/Parameter Tabs */}
          <div className="flex border-b border-[#1b2a47] bg-[#070b13] p-1 gap-1 flex-wrap">
            <button
              onClick={() => setActiveTab("geometry")}
              className={`flex-1 min-w-[75px] py-1.5 text-[10px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "geometry" ? "bg-[#1e2e4f] text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              📐 Sec. & Mat.
            </button>
            <button
              onClick={() => setActiveTab("tensile")}
              className={`flex-1 min-w-[75px] py-1.5 text-[10px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "tensile" ? "bg-[#1e2e4f] text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              🔴 Flexión (As)
            </button>
            <button
              onClick={() => setActiveTab("shear")}
              className={`flex-1 min-w-[75px] py-1.5 text-[10px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "shear" ? "bg-[#1e2e4f] text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              ⛓️ Cortante (Av)
            </button>
            <button
              onClick={() => setActiveTab("deflection")}
              className={`flex-1 min-w-[75px] py-1.5 text-[10px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "deflection" ? "bg-[#1e2e4f] text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              📏 Flechas
            </button>
            <button
              onClick={() => setActiveTab("formulas")}
              className={`flex-1 min-w-[75px] py-1.5 text-[10px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "formulas" ? "bg-[#1e2e4f] text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              🧾 Fórmulas
            </button>
          </div>

          <div className="p-5 space-y-5 flex-1 overflow-y-auto">
            
            {/* TAB 1: GEOMETRY AND MATERIALS */}
            {activeTab === "geometry" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Dimensiones de la Sección</h3>
                  <p className="text-[11px] text-slate-500">Ajusta las medidas físicas de la viga rectangular de hormigón/concreto.</p>
                </div>

                {/* Base b */}
                <div className="space-y-1.5 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Ancho de la Base (b):</span>
                    <span className="font-bold text-white">{b} mm</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="600"
                    step="10"
                    value={b}
                    onChange={(e) => setB(parseInt(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>150 mm</span>
                    <span>600 mm</span>
                  </div>
                </div>

                {/* Height h */}
                <div className="space-y-1.5 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Altura Total (h):</span>
                    <span className="font-bold text-white">{h} mm</span>
                  </div>
                  <input
                    type="range"
                    min="250"
                    max="1000"
                    step="10"
                    value={h}
                    onChange={(e) => setH(parseInt(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>250 mm</span>
                    <span>1000 mm</span>
                  </div>
                </div>

                {/* Concrete Cover r */}
                <div className="space-y-1.5 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Recubrimiento Libre (r):</span>
                    <span className="font-bold text-white">{r} mm</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    step="5"
                    value={r}
                    onChange={(e) => setR(parseInt(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>20 mm</span>
                    <span>80 mm</span>
                  </div>
                </div>

                <div className="border-t border-[#1b2a47] my-4 pt-4 space-y-3">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Propiedades de Materiales</h3>
                  
                  {/* Concrete f'c */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-mono">f'c Concreto (MPa)</label>
                      <select
                        value={fc}
                        onChange={(e) => setFc(parseInt(e.target.value))}
                        className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value={21}>21 MPa (H21)</option>
                        <option value={25}>25 MPa (H25)</option>
                        <option value={28}>28 MPa (H28)</option>
                        <option value={30}>30 MPa (H30)</option>
                        <option value={35}>35 MPa (H35)</option>
                        <option value={42}>42 MPa (H42)</option>
                      </select>
                    </div>

                    {/* Steel fy */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-mono">fy Acero Tracción (MPa)</label>
                      <select
                        value={fy}
                        onChange={(e) => setFy(parseInt(e.target.value))}
                        className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value={280}>280 MPa (Grado 40)</option>
                        <option value={420}>420 MPa (Grado 60)</option>
                        <option value={500}>500 MPa (Euro 500)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FLEXURE REINFORCEMENT (As) */}
            {activeTab === "tensile" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Refuerzo de Acero Tracción (As)</h3>
                  <p className="text-[11px] text-slate-500">Define las barras de refuerzo ubicadas en la parte inferior de la viga (sometidas a momentos positivos).</p>
                </div>

                <div className="flex items-center gap-2 bg-[#1e1b4b]/30 border border-[#312e81] p-3 rounded-lg mb-2">
                  <input
                    type="checkbox"
                    id="checkbox-as"
                    checked={customAsEnabled}
                    onChange={(e) => setCustomAsEnabled(e.target.checked)}
                    className="accent-purple-500"
                  />
                  <label htmlFor="checkbox-as" className="text-xs font-semibold text-purple-300 cursor-pointer">
                    Personalizar área total manualmente (As)
                  </label>
                </div>

                {customAsEnabled ? (
                  <div className="space-y-2 p-4 rounded-lg bg-[#111c38]/40 border border-[#1f2e51]">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">As Personalizado:</span>
                      <span className="font-bold text-white">{customAs} mm²</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="4000"
                      step="50"
                      value={customAs}
                      onChange={(e) => setCustomAs(parseInt(e.target.value))}
                      className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>100 mm²</span>
                      <span>4000 mm²</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Number of Bars */}
                    <div className="space-y-1.5 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Número de Barras:</span>
                        <span className="font-bold text-white">{numBars} barras</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="12"
                        step="1"
                        value={numBars}
                        onChange={(e) => setNumBars(parseInt(e.target.value))}
                        className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>2</span>
                        <span>12</span>
                      </div>
                    </div>

                    {/* Bar selection */}
                    <div className="space-y-2 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                      <label className="text-xs font-mono text-slate-400">Diámetro Comercial de Barra:</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {BAR_PRESETS.map((bar, idx) => (
                          <button
                            key={bar.name}
                            onClick={() => setSelectedBarIdx(idx)}
                            className={`px-2 py-1.5 text-[11px] font-mono rounded border text-left flex justify-between items-center transition-all ${
                              selectedBarIdx === idx
                                ? "bg-blue-600/20 border-blue-500 text-blue-300 font-bold"
                                : "bg-[#0b101d] border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <span>{bar.name}</span>
                            <span className="text-[9px] text-slate-500">{bar.area.toFixed(0)} mm²</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Applied Bending Moment State */}
                <div className="border-t border-[#1b2a47] my-4 pt-4 space-y-3">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Demanda Excesiva Requerida (Flexión)</h3>
                  
                  {customLoadsEnabled ? (
                    <div className="p-3 rounded-lg bg-[#111c38]/50 border border-indigo-400/20 text-xs space-y-1 text-slate-300">
                      <div className="flex justify-between font-mono font-bold text-emerald-400">
                        <span>Momento Último (Mu):</span>
                        <span>{mu_calc.toFixed(1)} kN·m</span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic">Desactivado: Mu se calcula dinámicamente desde el constructor de carga (1.2D + 1.6L).</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Momento Último (Mu):</span>
                        <span className="font-bold text-white">{mu} kN·m</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="400"
                        step="5"
                        value={mu}
                        onChange={(e) => setMu(parseInt(e.target.value))}
                        className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>10 kN·m</span>
                        <span>400 kN·m</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 3: SHEAR REINFORCEMENT (Av) */}
            {activeTab === "shear" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Refuerzo Transversal (Cortante - Estribos)</h3>
                  <p className="text-[11px] text-slate-500">Propaga estribos de corte para mitigar las fisuras oblicuas por esfuerzos cortantes elevados.</p>
                </div>

                {/* Stirrup bar selection */}
                <div className="space-y-2 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                  <label className="text-xs font-mono text-slate-400">Diámetro del Estribo:</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {STIRRUP_PRESETS.map((st, idx) => (
                      <button
                        key={st.name}
                        onClick={() => setSelectedStirrupIdx(idx)}
                        className={`px-2 py-1.5 text-[10.5px] font-mono rounded border text-center transition-all ${
                          selectedStirrupIdx === idx
                            ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold"
                            : "bg-[#0b101d] border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div>{st.name.replace("Estribo ", "")}</div>
                        <div className="text-[8.5px] text-slate-500">{st.area.toFixed(1)} mm²</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stirrup Legs */}
                <div className="space-y-1.5 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Ramales Cortadores (Legs):</span>
                    <span className="font-bold text-white">{stirrupLegs} ramas (Vertical)</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {[2, 3, 4].map((legs) => (
                      <button
                        key={legs}
                        onClick={() => setStirrupLegs(legs)}
                        className={`flex-1 py-1 text-xs font-mono border rounded ${
                          stirrupLegs === legs
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold"
                            : "bg-[#0b101d] border-slate-800 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {legs} ramas
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stirrup spacing */}
                <div className="space-y-1.5 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Espaciamiento (s):</span>
                    <span className="font-bold text-white">{stirrupSpacing} mm</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="450"
                    step="10"
                    value={stirrupSpacing}
                    onChange={(e) => setStirrupSpacing(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>50 mm</span>
                    <span>450 mm</span>
                  </div>
                </div>

                {/* Barras Superiores de Soporte (Perchas de Estribo) */}
                <div className="border-t border-[#1b2a47] my-4 pt-4 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Barras Superiores de Montaje (Perchas)</h3>
                    <p className="text-[11px] text-slate-500">Configura las barras longitudinales superiores de apoyo secundario indispensables para la canastilla de estribos.</p>
                  </div>

                  {/* Number of top bars */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Cantidad Superior (N° de Perchas):</span>
                      <span className="font-bold text-white">{numTopBars} barras</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="12"
                      step="1"
                      value={numTopBars}
                      onChange={(e) => setNumTopBars(parseInt(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>2</span>
                      <span>12</span>
                    </div>
                  </div>

                  {/* Top bar selection list */}
                  <div className="space-y-2 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                    <label className="text-xs font-mono text-slate-400">Diámetro Comercial de Barra Superior:</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {BAR_PRESETS.map((bar, idx) => (
                        <button
                          key={`top-${bar.name}`}
                          onClick={() => setSelectedTopBarIdx(idx)}
                          className={`px-2 py-1.5 text-[11px] font-mono rounded border text-left flex justify-between items-center transition-all ${
                            selectedTopBarIdx === idx
                              ? "bg-blue-600/20 border-blue-500 text-blue-300 font-bold"
                              : "bg-[#0b101d] border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <span>{bar.name}</span>
                          <span className="text-[9px] text-slate-500">{bar.diameter} mm</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1b2a47] my-4 pt-4 space-y-3">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Material & Demanda de Corte</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-mono">fy Estribos (MPa)</label>
                      <select
                        value={fyt}
                        onChange={(e) => setFyt(parseInt(e.target.value))}
                        className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value={280}>280 MPa</option>
                        <option value={420}>420 MPa</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-mono">Cortante Último Vu (kN)</label>
                      {customLoadsEnabled ? (
                        <div className="w-full bg-[#111c38]/50 border border-indigo-400/20 rounded px-2.5 py-1.5 text-xs text-emerald-400 font-bold font-mono text-center">
                          {vu_calc.toFixed(1)} kN
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={vu}
                          onChange={(e) => setVu(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2.5 py-1.5 text-xs text-white text-center font-mono"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: DEFLECTION & SERVICEABILITY (Flecha) */}
            {activeTab === "deflection" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Deflexión & Serviciabilidad (Estado Límite)</h3>
                  <p className="text-[11px] text-slate-500">Calcula las flechas instantáneas y diferidas a largo plazo considerando el agrietamiento del concreto.</p>
                </div>

                {/* Beam Length */}
                <div className="space-y-1.5 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Longitud de la Viga (L):</span>
                    <span className="font-bold text-white">{beamLength.toFixed(1)} m</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    step="0.5"
                    value={beamLength}
                    onChange={(e) => setBeamLength(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>2.0 m</span>
                    <span>12.0 m</span>
                  </div>
                </div>

                {/* Support Conditions */}
                <div className="space-y-1.5 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                  <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wide block mb-1">Apoyo Estructural:</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <button
                      onClick={() => setSupportCondition("simple")}
                      className={`py-1.5 text-[10px] font-mono border rounded transition-all cursor-pointer ${
                        supportCondition === "simple"
                          ? "bg-blue-600/30 border-blue-500 text-blue-300 font-bold"
                          : "bg-[#0b101d] border-slate-800 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Simple Apoyo
                    </button>
                    <button
                      onClick={() => setSupportCondition("cantilever")}
                      className={`py-1.5 text-[10px] font-mono border rounded transition-all cursor-pointer ${
                        supportCondition === "cantilever"
                          ? "bg-blue-600/30 border-blue-500 text-blue-300 font-bold"
                          : "bg-[#0b101d] border-slate-800 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Voladizo
                    </button>
                    <button
                      onClick={() => setSupportCondition("fixed")}
                      className={`py-1.5 text-[10px] font-mono border rounded transition-all cursor-pointer ${
                        supportCondition === "fixed"
                          ? "bg-blue-600/30 border-blue-500 text-blue-300 font-bold"
                          : "bg-[#0b101d] border-slate-800 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Doble Empotre
                    </button>
                  </div>
                </div>

                {/* Mode Selector: Simple vs Custom Loads */}
                <div className="space-y-3 border-t border-[#1b2a47]/60 pt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] font-bold text-indigo-400 font-mono uppercase">Configuración de Carga de la Viga</h4>
                    <div className="flex bg-[#0b101d] rounded p-0.5 border border-[#1b2a47]">
                      <button
                        onClick={() => setCustomLoadsEnabled(false)}
                        className={`px-2.5 py-1 text-[10px] font-mono rounded font-semibold transition-all cursor-pointer ${
                          !customLoadsEnabled
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Simplificado
                      </button>
                      <button
                        onClick={() => {
                          setCustomLoadsEnabled(true);
                          // Initialize clEnd to beamLength if needed
                          if (clEnd !== beamLength) {
                            setClEnd(beamLength);
                          }
                        }}
                        className={`px-2.5 py-1 text-[10px] font-mono rounded font-semibold transition-all cursor-pointer ${
                          customLoadsEnabled
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Constructor de Carga
                      </button>
                    </div>
                  </div>

                  {!customLoadsEnabled ? (
                    <div className="space-y-3">
                      {/* Dead Load slider */}
                      <div className="space-y-1.5 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Carga Muerta (wd):</span>
                          <span className="font-bold text-white">{deadLoad.toFixed(1)} kN/m</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="60"
                          step="1"
                          value={deadLoad}
                          onChange={(e) => setDeadLoad(parseFloat(e.target.value))}
                          className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>0 kN/m</span>
                          <span>60 kN/m</span>
                        </div>
                      </div>

                      {/* Live Load slider */}
                      <div className="space-y-1.5 p-3 rounded-lg bg-[#0e1628]/40 border border-[#1b2a47]">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Carga Viva (wl):</span>
                          <span className="font-bold text-white">{liveLoad.toFixed(1)} kN/m</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="60"
                          step="1"
                          value={liveLoad}
                          onChange={(e) => setLiveLoad(parseFloat(e.target.value))}
                          className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>0 kN/m</span>
                          <span>60 kN/m</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Self-weight helper check */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-900/45">
                        <div className="space-y-0.5">
                          <label htmlFor="self-weight-cb" className="text-xs font-semibold text-indigo-300 cursor-pointer flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              id="self-weight-cb"
                              checked={includeSelfWeight}
                              onChange={(e) => setIncludeSelfWeight(e.target.checked)}
                              className="accent-indigo-500 rounded cursor-pointer"
                            />
                            Incluir peso propio de la viga
                          </label>
                          <span className="text-[9.5px] text-slate-500 font-mono block pl-5">
                            Modo Muerta (CD): {selfWeightKnPerM.toFixed(2)} kN/m ({b}x{h} mm)
                          </span>
                        </div>
                        <span className="text-[10px] bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold">
                          +1.2D Fact.
                        </span>
                      </div>

                      {/* Custom loads list */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Cargas Registradas</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCl(!isAddingCl);
                              setClEnd(beamLength);
                            }}
                            className="bg-indigo-600/30 border border-indigo-500 hover:bg-indigo-600 text-indigo-200 hover:text-white px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Plus className="w-3 h-3" />
                            {isAddingCl ? "Cancelar" : "Añadir Carga"}
                          </button>
                        </div>

                        {isAddingCl && (
                          <form onSubmit={handleAddCustomLoad} className="p-3 rounded-lg bg-[#0c1424] border border-slate-700/80 space-y-3 transition-all">
                            <h5 className="text-[10.5px] font-bold uppercase text-slate-300 font-mono flex items-center gap-1">
                              <Plus className="w-3.5 h-3.5 text-blue-400" /> Nuevo Componente de Carga
                            </h5>

                            <div className="grid grid-cols-2 gap-2">
                              {/* Type selection */}
                              <div className="space-y-0.5">
                                <label className="text-[9px] uppercase font-mono text-slate-400">Tipo de Carga</label>
                                <select
                                  value={clType}
                                  onChange={(e) => setClType(e.target.value as any)}
                                  className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2 py-1 text-xs text-white"
                                >
                                  <option value={LoadType.DISTRIBUTED}>Distribución uniforme</option>
                                  <option value={LoadType.POINT}>Carga puntual (Concentrada)</option>
                                  <option value={LoadType.TRIANGULAR}>Triangular / Trapezoidal</option>
                                </select>
                              </div>

                              {/* Category selection */}
                              <div className="space-y-0.5">
                                <label className="text-[9px] uppercase font-mono text-slate-400">Categoría</label>
                                <select
                                  value={clCategory}
                                  onChange={(e) => setClCategory(e.target.value as any)}
                                  className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2 py-1 text-xs text-white"
                                >
                                  <option value="dead">Carga Muerta (D)</option>
                                  <option value="live">Carga Viva (L)</option>
                                </select>
                              </div>
                            </div>

                            {/* Conditional inputs */}
                            {clType === LoadType.POINT ? (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-0.5">
                                  <label className="text-[9px] uppercase font-mono text-slate-400">Magnitud (kN)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={clMagnitude}
                                    onChange={(e) => setClMagnitude(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2 py-1 text-xs text-white text-center font-mono"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[9px] uppercase font-mono text-slate-400">Posición x (m)</label>
                                  <input
                                    type="number"
                                    step="0.05"
                                    max={beamLength}
                                    min="0"
                                    value={clPosition}
                                    onChange={(e) => setClPosition(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2 py-1 text-xs text-white text-center font-mono"
                                  />
                                </div>
                              </div>
                            ) : clType === LoadType.TRIANGULAR ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-0.5">
                                    <label className="text-[9px] uppercase font-mono text-slate-400">Magnitud Inicio (kN/m)</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={clMagnitudeStart}
                                      onChange={(e) => setClMagnitudeStart(parseFloat(e.target.value) || 0)}
                                      className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2 py-1 text-xs text-white text-center font-mono"
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <label className="text-[9px] uppercase font-mono text-slate-400">Fin (kN/m)</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={clMagnitudeEnd}
                                      onChange={(e) => setClMagnitudeEnd(parseFloat(e.target.value) || 0)}
                                      className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2 py-1 text-xs text-white text-center font-mono"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-0.5">
                                    <label className="text-[9px] uppercase font-mono text-slate-400">Inicio x1 (m)</label>
                                    <input
                                      type="number"
                                      step="0.05"
                                      max={beamLength}
                                      min="0"
                                      value={clStart}
                                      onChange={(e) => setClStart(parseFloat(e.target.value) || 0)}
                                      className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2 py-1 text-xs text-white text-center font-mono"
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <label className="text-[9px] uppercase font-mono text-slate-400">Fin x2 (m)</label>
                                    <input
                                      type="number"
                                      step="0.05"
                                      max={beamLength}
                                      min="0"
                                      value={clEnd}
                                      onChange={(e) => setClEnd(parseFloat(e.target.value) || 0)}
                                      className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2 py-1 text-xs text-white text-center font-mono"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="space-y-0.5">
                                  <label className="text-[9px] uppercase font-mono text-slate-400">Magnitud Uniforme (kN/m)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={clMagnitude}
                                    onChange={(e) => setClMagnitude(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2 py-1 text-xs text-white text-center font-mono"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-0.5">
                                    <label className="text-[9px] uppercase font-mono text-slate-400">Inicio x1 (m)</label>
                                    <input
                                      type="number"
                                      step="0.05"
                                      max={beamLength}
                                      min="0"
                                      value={clStart}
                                      onChange={(e) => setClStart(parseFloat(e.target.value) || 0)}
                                      className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2 py-1 text-xs text-white text-center font-mono"
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <label className="text-[9px] uppercase font-mono text-slate-400">Fin x2 (m)</label>
                                    <input
                                      type="number"
                                      step="0.05"
                                      max={beamLength}
                                      min="0"
                                      value={clEnd}
                                      onChange={(e) => setClEnd(parseFloat(e.target.value) || 0)}
                                      className="w-full bg-[#0d1527] border border-[#21396a] rounded px-2 py-1 text-xs text-white text-center font-mono"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            <button
                              type="submit"
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 rounded text-xs font-mono transition-all cursor-pointer"
                            >
                              Insertar Carga en la Viga
                            </button>
                          </form>
                        )}

                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                          {customLoads.length === 0 ? (
                            <div className="text-center py-4 bg-[#0e1628]/20 border border-dashed border-[#1b2a47] rounded-lg text-slate-500 font-mono text-[10.5px]">
                              Sin cargas activas. Añade alguna carga.
                            </div>
                          ) : (
                            customLoads.map((load) => (
                              <div
                                key={load.id}
                                className="flex justify-between items-center p-2 rounded bg-[#0e1628]/50 border border-[#1b2a47]"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-[8.5px] font-bold px-1 rounded uppercase font-mono ${
                                        load.category === "live"
                                          ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      }`}
                                    >
                                      {load.category === "live" ? "Viva" : "Muerta"}
                                    </span>
                                    <span className="text-[10.5px] font-bold text-white font-mono">
                                      {load.type === LoadType.POINT
                                        ? "Puntual"
                                        : load.type === LoadType.TRIANGULAR
                                        ? "Triangular"
                                        : "Distribuida"}
                                    </span>
                                  </div>
                                  <div className="text-[9.5px] text-slate-400 font-mono">
                                    {load.type === LoadType.POINT ? (
                                      <span>
                                        P = <strong className="text-slate-200">{load.magnitude} kN</strong> en x = {load.position} m
                                      </span>
                                    ) : load.type === LoadType.TRIANGULAR ? (
                                      <span>
                                        w = <strong className="text-slate-200">{load.magnitudeStart}</strong> a{" "}
                                        <strong className="text-slate-200">{load.magnitudeEnd} kN/m</strong> entre x = {load.start} y {load.end} m
                                      </span>
                                    ) : (
                                      <span>
                                        w = <strong className="text-slate-200">{load.magnitude} kN/m</strong> entre x = {load.start} y {load.end} m
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomLoad(load.id)}
                                  className="text-pink-500/70 hover:text-pink-400 p-1 rounded hover:bg-pink-500/10 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: FORMULAS LIST */}
            {activeTab === "formulas" && (
              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Formulario Normativo ACI-318</h3>
                  <p className="text-[10.5px] text-slate-500">Ecuaciones críticas empleadas por el procesador automático para calcular capacidades estructurales.</p>
                </div>

                <div className="p-3 bg-[#0a101f] rounded-lg border border-[#1c2c4b] space-y-2.5 font-mono text-[10.5px]">
                  <div>
                    <span className="text-blue-400 font-bold block">1. Profundidad del Bloque (a):</span>
                    <span className="text-slate-400">a = (As · fy) / (0.85 · f'c · b)</span>
                  </div>
                  <div>
                    <span className="text-blue-400 font-bold block">2. Capacidad Nominal Flexión (Mn):</span>
                    <span className="text-slate-400">Mn = As · fy · (d - a/2)</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 font-bold block">3. Resistencia Corte Concreto (Vc):</span>
                    <span className="text-slate-400">Vc = 0.17 · √f'c · b · d</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 font-bold block">4. Resistencia Corte Estribos (Vs):</span>
                    <span className="text-slate-400">Vs = (Av · fyt · d) / s</span>
                  </div>
                  <div>
                    <span className="text-purple-400 font-bold block">5. Límites de Cuantía (ρ):</span>
                    <span className="text-slate-400">ρ = As / (b · d)</span>
                    <span className="text-[9.5px] text-slate-500 block font-sans">ρmin = max( 0.25√f'c / fy , 1.4 / fy )</span>
                  </div>
                  <div>
                    <span className="text-amber-400 font-bold block">6. Momento de Agrietamiento (Mcr):</span>
                    <span className="text-slate-400">Mcr = fr · Ig / yt</span>
                    <span className="text-[9.5px] text-slate-500 block">fr (módulo ruptura) = 0.62 · √f'c</span>
                  </div>
                  <div>
                    <span className="text-sky-400 font-bold block">7. Inercia Efectiva Branson (Ie):</span>
                    <span className="text-slate-400">Ie = (Mcr/Ma)³ · Ig + [1 - (Mcr/Ma)³] · Icr ≤ Ig</span>
                  </div>
                  <div>
                    <span className="text-pink-400 font-bold block">8. Flechas Admisibles ACI 318:</span>
                    <span className="text-slate-400">L / 360 (Carga Viva) | L / 240 (Diferida total)</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* QUICK ADVICE CARD / AI SUMMARY */}
          <div className="p-4 border-t border-[#1b2a47] bg-[#0c1224] flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block font-mono">Análisis en Tiempo Real ACI</span>
              <p className="text-[11px] text-slate-400 leading-tight">{getAiTip()}</p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE CROSS SECTION VECTOR AND REAL-TIME METRICS (7 cols) */}
        <div className="lg:col-span-7 flex flex-col p-6 space-y-6 overflow-y-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Live SVG Vector Rendering of Reinforcement layout */}
            <div className="bg-[#070b13] border border-[#1b2a47] rounded-xl p-5 flex flex-col items-center justify-center relative min-h-[440px]">
              <span className="absolute top-3.5 left-3.5 text-[11px] font-extrabold text-slate-300 font-mono tracking-wider">DIAGRAMA DE SECCIÓN REFORZADA (Escalado Real)</span>
              
              {(() => {
                // Determine scale dynamically so it utilizes max bounding container area while keeping aspect ratio
                // Container zone bounds inside SVG viewBox coordinate system: width=360, height=410
                // Center point at 180, 175
                const scale = Math.min(240 / b, 280 / h);
                const w_svg = b * scale;
                const h_svg = h * scale;
                
                const x_center = 180;
                const y_center = 175;
                
                // Top left of concrete rectangle
                const x_rect = x_center - w_svg / 2;
                const y_rect = y_center - h_svg / 2;
                
                // Cover inside the concrete block
                const r_svg = r * scale;
                const x_stirrup = x_rect + r_svg;
                const y_stirrup = y_rect + r_svg;
                const w_stirrup = w_svg - 2 * r_svg;
                const h_stirrup = h_svg - 2 * r_svg;
                
                // Rebar positions
                const y_centroid_svg = y_rect + d * scale;
                const barSizeRad = Math.max(3.5, Math.min(10, (selectedBar.diameter / 2) * scale));
                const edge_padding_bottom = Math.max(8, 14 * scale);
                const startX = x_stirrup + edge_padding_bottom;
                const endX = x_stirrup + w_stirrup - edge_padding_bottom;
                
                // Top compression reinforcing
                const edge_padding_top = Math.max(10, 15 * scale);
                const cx_comp_left = x_stirrup + edge_padding_top;
                const cx_comp_right = x_stirrup + w_stirrup - edge_padding_top;
                const cy_comp = y_stirrup + edge_padding_top;
                const selectedTopBar = BAR_PRESETS[selectedTopBarIdx];
                const compBarRad = Math.max(3.0, Math.min(10, (selectedTopBar.diameter / 2) * scale));
                
                return (
                  <svg viewBox="0 0 360 410" className="w-full max-w-[340px] md:max-w-[380px] lg:max-w-[390px] xl:max-w-[420px] h-auto transition-all" strokeLinecap="round" strokeLinejoin="round">
                    {/* Patterns */}
                    <defs>
                      <pattern id="concrete-fill" width="10" height="10" patternUnits="userSpaceOnUse">
                        <rect width="10" height="10" fill="#111a2e" />
                        <circle cx="2" cy="3" r="0.7" fill="#223354" />
                        <circle cx="7" cy="8" r="0.8" fill="#223354" />
                        <line x1="4" y1="2" x2="6" y2="4" stroke="#1d2d47" strokeWidth="0.5" />
                      </pattern>
                    </defs>

                    {/* Main Concrete Section */}
                    <rect 
                      x={x_rect} 
                      y={y_rect} 
                      width={w_svg} 
                      height={h_svg} 
                      fill="url(#concrete-fill)" 
                      stroke="#475569" 
                      strokeWidth="3" 
                    />

                    {/* Closed Shear Stirrup Hoop */}
                    {w_stirrup > 10 && h_stirrup > 10 && (
                      <rect 
                        x={x_stirrup} 
                        y={y_stirrup} 
                        width={w_stirrup} 
                        height={h_stirrup} 
                        fill="none" 
                        stroke="#38bdf8" 
                        strokeWidth="2.5" 
                        rx={Math.max(4, 6 * scale)}
                      />
                    )}

                    {/* Top Compressive/Hanger Steel (Dynamic quantity) */}
                    {w_stirrup > 20 && (() => {
                      const arr = [];
                      const count = Math.min(12, numTopBars);
                      
                      if (count === 1) {
                        const cx = x_center;
                        arr.push(
                          <g key={0}>
                            <circle cx={cx} cy={cy_comp} r={compBarRad} fill="#f1f5f9" stroke="#475569" strokeWidth="1" />
                            <circle cx={cx} cy={cy_comp} r={compBarRad - 1.5} fill="#cbd5e1" />
                          </g>
                        );
                      } else if (count > 1) {
                        const deltaX = (cx_comp_right - cx_comp_left) / (count - 1);
                        for (let i = 0; i < count; i++) {
                          const cx = cx_comp_left + i * deltaX;
                          const cy = (count > 6 && i % 2 !== 0) ? cy_comp + 14 * scale : cy_comp;
                          arr.push(
                            <g key={i}>
                              <circle cx={cx} cy={cy} r={compBarRad} fill="#f1f5f9" stroke="#475569" strokeWidth="1" />
                              <circle cx={cx} cy={cy} r={compBarRad - 1.5} fill="#cbd5e1" />
                            </g>
                          );
                        }
                      }
                      return (
                        <g>
                          {arr}
                          <line x1={cx_comp_left} y1={cy_comp} x2={cx_comp_right} y2={cy_comp} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                        </g>
                      );
                    })()}

                    {/* Dynamic Bottom Tension Rebars */}
                    {(() => {
                      const arr = [];
                      const count = Math.min(12, numBars);
                      
                      if (count === 1) {
                        const cx = x_center;
                        arr.push(
                          <g key={0}>
                            <circle cx={cx} cy={y_centroid_svg} r={barSizeRad} fill="#ef5350" stroke="#7f1d1d" strokeWidth="1.2" />
                            <circle cx={cx} cy={y_centroid_svg} r={barSizeRad - 1.5} fill="#b91c1c" />
                          </g>
                        );
                      } else if (count > 1) {
                        const deltaX = (endX - startX) / (count - 1);
                        for (let i = 0; i < count; i++) {
                          const cx = startX + i * deltaX;
                          // Stagger slightly upward if count > 6 to represent multi-layer standard detailing
                          const cy = (count > 6 && i % 2 !== 0) ? y_centroid_svg - 18 * scale : y_centroid_svg;
                          arr.push(
                            <g key={i}>
                              <circle cx={cx} cy={cy} r={barSizeRad} fill="#ef5350" stroke="#7f1d1d" strokeWidth="1.5" />
                              <circle cx={cx} cy={cy} r={barSizeRad - 1.8} fill="#b91c1c" />
                            </g>
                          );
                        }
                      }
                      return arr;
                    })()}

                    {/* REBAR SPACING DIMENSION LINES (Cotas de Espacio entre Barras) */}
                    {(() => {
                      const count = Math.min(12, numBars);
                      if (count > 1) {
                        const deltaX = (endX - startX) / (count - 1);
                        const s_cc_mm = deltaX / scale;
                        const s_clear_mm = s_cc_mm - selectedBar.diameter;
                        
                        // We will place the horizontal dimension line chain parallel to the bottom bars, offset from the bar centers
                        const y_dim_chain = y_centroid_svg + Math.max(13, 16 * scale);
                        const elements = [];
                        
                        // Draw continuous horizontal dimension line
                        elements.push(
                          <line 
                            key="rebar-dim-line" 
                            x1={startX} 
                            y1={y_dim_chain} 
                            x2={endX} 
                            y2={y_dim_chain} 
                            stroke="#38bdf8" 
                            strokeWidth="1.2" 
                          />
                        );
                        
                        // Architectural ticks and text labels between each gap
                        for (let i = 0; i < count; i++) {
                          const cx = startX + i * deltaX;
                          
                          // Tick marks
                          elements.push(
                            <line 
                              key={`tick-${i}`} 
                              x1={cx - 1.5} 
                              y1={y_dim_chain + 3} 
                              x2={cx + 1.5} 
                              y2={y_dim_chain - 3} 
                              stroke="#60a5fa" 
                              strokeWidth="1.5" 
                            />
                          );
                          
                          // Spacing text overlay between adjacent bars
                          if (i < count - 1) {
                            const cx_mid = cx + deltaX / 2;
                            // Dynamically dimension the background shield/badge so it doesn't clip
                            const badgeWidth = Math.max(18, Math.min(30, deltaX - 2));
                            const label = `${Math.round(s_clear_mm)}`;
                            
                            elements.push(
                              <g key={`lbl-${i}`}>
                                <rect 
                                  x={cx_mid - badgeWidth / 2} 
                                  y={y_dim_chain - 5.5} 
                                  width={badgeWidth} 
                                  height={11} 
                                  rx="2.5" 
                                  fill="#070b13" 
                                />
                                <text 
                                  x={cx_mid} 
                                  y={y_dim_chain + 3} 
                                  className="fill-sky-400 font-extrabold font-mono text-[8.5px] md:text-[9.5px]" 
                                  textAnchor="middle"
                                >
                                  {label}
                                </text>
                              </g>
                            );
                          }
                        }
                        
                        return (
                          <g key="rebar-spacing-dimension" opacity="0.95">
                            {elements}
                            
                            {/* Visual tag pointing to spacing meaning, placed at the bottom where there's plenty of space */}
                            <text 
                              x={x_center} 
                              y={y_rect + h_svg + 36} 
                              className="fill-sky-400 font-bold font-sans text-[9px] md:text-[10px] uppercase tracking-wider" 
                              textAnchor="middle"
                            >
                              Espaciamiento Libre (s = {Math.round(s_clear_mm)} mm)
                            </text>
                          </g>
                        );
                      }
                      return null;
                    })()}

                    {/* WIDTH b DIMENSION */}
                    {/* Leader Lines */}
                    <line x1={x_rect} y1={y_rect + h_svg + 2} x2={x_rect} y2={y_rect + h_svg + 24} stroke="#334155" strokeWidth="0.8" strokeDasharray="2 2" />
                    <line x1={x_rect + w_svg} y1={y_rect + h_svg + 2} x2={x_rect + w_svg} y2={y_rect + h_svg + 24} stroke="#334155" strokeWidth="0.8" strokeDasharray="2 2" />
                    {/* Dimension Line */}
                    <line x1={x_rect - 8} y1={y_rect + h_svg + 18} x2={x_rect + w_svg + 8} y2={y_rect + h_svg + 18} stroke="#64748b" strokeWidth="1.2" />
                    {/* Architectural Ticks */}
                    <line x1={x_rect - 4} y1={y_rect + h_svg + 22} x2={x_rect + 4} y2={y_rect + h_svg + 14} stroke="#cbd5e1" strokeWidth="2.5" />
                    <line x1={x_rect + w_svg - 4} y1={y_rect + h_svg + 22} x2={x_rect + w_svg + 4} y2={y_rect + h_svg + 14} stroke="#cbd5e1" strokeWidth="2.5" />
                    {/* Label */}
                    <text x={x_center} y={y_rect + h_svg + 11} className="fill-white font-black font-sans text-[12px] md:text-[13px]" textAnchor="middle">b = {b} mm</text>

                    {/* HEIGHT h DIMENSION */}
                    {/* Leader Lines */}
                    <line x1={x_rect + w_svg + 2} y1={y_rect} x2={x_rect + w_svg + 24} y2={y_rect} stroke="#334155" strokeWidth="0.8" strokeDasharray="2 2" />
                    <line x1={x_rect + w_svg + 2} y1={y_rect + h_svg} x2={x_rect + w_svg + 24} y2={y_rect + h_svg} stroke="#334155" strokeWidth="0.8" strokeDasharray="2 2" />
                    {/* Dimension Line */}
                    <line x1={x_rect + w_svg + 18} y1={y_rect - 8} x2={x_rect + w_svg + 18} y2={y_rect + h_svg + 8} stroke="#64748b" strokeWidth="1.2" />
                    {/* Architectural Ticks */}
                    <line x1={x_rect + w_svg + 14} y1={y_rect + 4} x2={x_rect + w_svg + 22} y2={y_rect - 4} stroke="#cbd5e1" strokeWidth="2.5" />
                    <line x1={x_rect + w_svg + 14} y1={y_rect + h_svg + 4} x2={x_rect + w_svg + 22} y2={y_rect + h_svg - 4} stroke="#cbd5e1" strokeWidth="2.5" />
                    {/* Label */}
                    <text 
                      x={x_rect + w_svg + 33} 
                      y={y_center} 
                      transform={`rotate(90, ${x_rect + w_svg + 33}, ${y_center})`} 
                      className="fill-white font-black font-sans text-[12px] md:text-[13px]" 
                      textAnchor="middle"
                    >
                      h = {h} mm
                    </text>

                    {/* EFFECTIVE DEPTH d DIMENSION */}
                    {/* Leader Lines */}
                    <line x1={x_rect - 2} y1={y_rect} x2={x_rect - 24} y2={y_rect} stroke="#8c3d4a" strokeWidth="0.8" strokeDasharray="2 2" />
                    <line x1={x_rect - 2} y1={y_centroid_svg} x2={x_rect - 24} y2={y_centroid_svg} stroke="#8c3d4a" strokeWidth="0.8" strokeDasharray="2 2" />
                    {/* Dimension Line */}
                    <line x1={x_rect - 18} y1={y_rect - 8} x2={x_rect - 18} y2={y_centroid_svg + 8} stroke="#f43f5e" strokeWidth="1.2" />
                    {/* Architectural Ticks */}
                    <line x1={x_rect - 22} y1={y_rect + 4} x2={x_rect - 14} y2={y_rect - 4} stroke="#fda4af" strokeWidth="2.5" />
                    <line x1={x_rect - 22} y1={y_centroid_svg + 4} x2={x_rect - 14} y2={y_centroid_svg - 4} stroke="#fda4af" strokeWidth="2.5" />
                    {/* Label */}
                    <text 
                      x={x_rect - 33} 
                      y={(y_rect + y_centroid_svg) / 2} 
                      transform={`rotate(-90, ${x_rect - 33}, ${(y_rect + y_centroid_svg) / 2})`} 
                      className="fill-rose-400 font-black font-sans text-[12px] md:text-[13px]" 
                      textAnchor="middle"
                    >
                      d = {Math.round(d)} mm
                    </text>

                    {/* NEUTRAL AXIS INDICATOR */}
                    {(() => {
                      const naY_val = y_rect + (c_depth * scale);
                      if (naY_val > y_rect && naY_val < y_rect + h_svg) {
                        return (
                          <g>
                            <line 
                              x1={x_rect - 12} 
                              y1={naY_val} 
                              x2={x_rect + w_svg + 12} 
                              y2={naY_val} 
                              stroke="#10b981" 
                              strokeWidth="1.5" 
                              strokeDasharray="4 2" 
                            />
                            <rect 
                              x={x_rect + w_svg - 1} 
                              y={naY_val - 8.5} 
                              width={36} 
                              height={17} 
                              rx="3.5" 
                              fill="#070b13" 
                              stroke="#10b981" 
                              strokeWidth="1" 
                            />
                            <text 
                              x={x_rect + w_svg + 17} 
                              y={naY_val + 4.5} 
                              className="fill-emerald-400 font-black font-sans text-[10.5px] md:text-[11.5px]" 
                              textAnchor="middle"
                            >
                              E.N.
                            </text>
                          </g>
                        );
                      }
                      return null;
                    })()}
                  </svg>
                );
              })()}

              {/* Cover info badges */}
              <div className="flex flex-wrap gap-2 justify-center mt-3 text-xs">
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                  Recubrimiento: d' = <strong className="text-white">{r} mm</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                  Estribos: <strong className="text-white">{stirrupLegs}x{selectedStirrup.name.replace("Estribo ", "")} @ {stirrupSpacing}mm</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                  Perchas Sup.: <strong className="text-white">{numTopBars}x{BAR_PRESETS[selectedTopBarIdx].name}</strong>
                </span>
                {numBars > 1 && (
                  <span className={`px-2.5 py-1 rounded bg-slate-900 border font-mono ${
                    clearSpacingBetweenBars >= 25 
                      ? "border-sky-500/20 text-sky-400" 
                      : "border-rose-500/40 text-rose-400"
                  }`}>
                    Espacio Libre (s): <strong className="text-white">{Math.round(clearSpacingBetweenBars)} mm</strong>
                    {clearSpacingBetweenBars < 25 ? (
                      <span className="ml-1 text-[9px] font-bold text-rose-500 font-sans">(⚠️ &lt; 25mm)</span>
                    ) : (
                      <span className="ml-1 text-[9px] font-bold text-emerald-500 font-sans">(✓ ACI)</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Real-time calculated structural capacities */}
            <div className="space-y-4">
              
              {/* FLEXURAL MOMENTS CAPACITY CARD */}
              <div className={`p-4 rounded-xl border ${
                flexureStatus ? "bg-[#0c1b18]/50 border-emerald-500/20" : "bg-[#1f1220]/50 border-pink-500/20"
              } space-y-3`}>
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">Resistencia a la Flexión (Momentos)</span>
                    <h3 className="text-xl font-black font-mono mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-white">{phiMn.toFixed(1)}</span>
                      <span className="text-[11px] text-slate-400 font-bold">kN·m</span>
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                    flexureStatus ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                  }`}>
                    {flexureStatus ? "CUMPLE (Mu ≤ φMn)" : "FALLA POR FLEXIÓN"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs border-t border-slate-800/60 pt-2.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Momento Último Solicitado (Mu):</span>
                    <span className="text-slate-300 font-bold">{mu} kN·m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Capacidad Teórica Nominal (Mn):</span>
                    <span className="text-slate-300">{Mn.toFixed(1)} kN·m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Factor de Reducción Flexión (φ):</span>
                    <span className="text-indigo-400 font-bold">{phiFlexure.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tipo de Rotura Estimado:</span>
                    <span className={steelStrain >= 0.005 ? "text-emerald-400" : "text-amber-400"}>{failureType.split(" (")[0]}</span>
                  </div>
                </div>

                {/* Progress bar of demand/capacity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Proporción Mu / φMn</span>
                    <span className="font-bold">{(mu / phiMn * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        mu / phiMn <= 1.0 ? "bg-emerald-500" : "bg-pink-500"
                      }`} 
                      style={{ width: `${Math.min(100, (mu / phiMn) * 100)}%` }}
                    />
                  </div>
                </div>

              </div>

              {/* SHEAR FORCE CAPACITY CARD */}
              <div className={`p-4 rounded-xl border ${
                shearStatus && shearSpacingValid ? "bg-[#0c1b18]/50 border-emerald-500/20" : "bg-[#1f1220]/50 border-pink-500/20"
              } space-y-3`}>
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">Resistencia al Cortante (φVn)</span>
                    <h3 className="text-xl font-black font-mono mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-white">{phiVn.toFixed(1)}</span>
                      <span className="text-[11px] text-slate-400 font-bold">kN</span>
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                    shearStatus ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                  }`}>
                    {shearStatus ? "CUMPLE (Vu ≤ φVn)" : "FALLA S REVISAR"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs border-t border-slate-800/60 pt-2.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fuerza Cortante Solicitada (Vu):</span>
                    <span className="text-slate-300 font-bold">{vu} kN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Aporte del Concreto (Vc):</span>
                    <span className="text-slate-400">{Vc.toFixed(1)} kN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Aporte del Acero Estribos (Vs):</span>
                    <span className="text-sky-400">{Vs.toFixed(1)} kN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Factor de Reducción Corte (φ):</span>
                    <span className="text-slate-300">0.75</span>
                  </div>
                </div>

                {/* Progress bar of demand/capacity shear */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Proporción Vu / φVn</span>
                    <span className="font-bold">{(vu / phiVn * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        vu / phiVn <= 1.0 ? "bg-emerald-500" : "bg-pink-500"
                      }`} 
                      style={{ width: `${Math.min(100, (vu / phiVn) * 100)}%` }}
                    />
                  </div>
                </div>

              </div>

              {/* DEFLECTION & SERVICEABILITY CARD */}
              <div className={`p-4 rounded-xl border ${
                deflectionStatus ? "bg-[#0c1b18]/50 border-emerald-500/20" : "bg-[#1f1220]/50 border-pink-500/20"
              } space-y-3`}>
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">Deflexión & Flecha Total (Serviciabilidad)</span>
                    <h3 className="text-xl font-black font-mono mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-white">{delta_total.toFixed(2)}</span>
                      <span className="text-[11px] text-slate-400 font-bold">mm</span>
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                    deflectionStatus ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                  }`}>
                    {deflectionStatus ? "CUMPLE LIMITES" : "REVISAR DEFLEXIÓN"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs border-t border-slate-800/60 pt-2.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Inercia Utilizada (Ie / Ig):</span>
                    <span className={`${Ma > Mcr ? "text-amber-400 font-bold" : "text-emerald-400"}`}>
                      {Ma > Mcr ? `Agrietada (${(I_e / I_g * 100).toFixed(0)}% Ig)` : "No agrietada (100% Ig)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Deformación Viva (δlive / Lim):</span>
                    <span className={`${delta_live <= limit_live ? "text-slate-300" : "text-pink-400 font-bold"}`}>
                      {delta_live.toFixed(1)} mm / {limit_live.toFixed(1)} mm (L/360)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Deformación Total (δtotal / Lim):</span>
                    <span className={`${delta_total <= limit_total ? "text-slate-200" : "text-pink-400 font-bold"}`}>
                      {delta_total.toFixed(1)} mm / {limit_total.toFixed(1)} mm (L/240)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Flecha Instantánea Total (δim):</span>
                    <span className="text-slate-400">{delta_im.toFixed(1)} mm</span>
                  </div>
                </div>

                {/* Progress bar of deflection limit */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Relación Flecha Total / Admisible (L/240)</span>
                    <span className="font-bold font-mono">{(delta_total / limit_total * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        delta_total / limit_total <= 1.0 ? "bg-emerald-500" : "bg-pink-500"
                      }`} 
                      style={{ width: `${Math.min(100, (delta_total / limit_total) * 100)}%` }}
                    />
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* LOWER ANALYSIS DETAIL CHART: CUANTÍA DE ACERO RESPECTO A LÍMITES NORMAS */}
          <div className="bg-[#0c1325]/80 border border-[#1b2a47] rounded-xl p-5 space-y-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">VERIFICACIÓN DE CUANTÍA DE ACERO Y DUCTILIDAD (ρ = As / bd)</span>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="p-3 bg-[#070b13] border border-slate-800 rounded-lg space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Cuantía Mínima (ρmin)</span>
                <div className="font-mono text-xs text-amber-500 font-bold">{(rhoMin * 100).toFixed(3)} %</div>
                <div className="text-[9px] text-slate-600 font-mono">Controla fisuración frágil inicial</div>
              </div>

              <div className="p-3 bg-[#070b13] border border-slate-800 rounded-lg space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Cuantía Real (ρ)</span>
                <div className={`font-mono text-xs font-bold ${
                  steelRatioValid ? "text-emerald-400" : "text-pink-500"
                }`}>{(rho * 100).toFixed(3)} %</div>
                <div className="text-[9px] text-slate-600 font-mono">Área As real = {Math.round(As)} mm²</div>
              </div>

              <div className="p-3 bg-[#070b13] border border-slate-800 rounded-lg space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Cuantía Máxima (ρmax)</span>
                <div className="font-mono text-xs text-indigo-400 font-bold">{(rhoMax * 100).toFixed(3)} %</div>
                <div className="text-[9px] text-slate-600 font-mono">Evita aplastamiento de concreto</div>
              </div>

            </div>

            {/* Line visualization bar showing real rho compared to boundaries */}
            <div className="space-y-3 pt-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Indicador de Ductilidad en Tiempo Real (Proporción Admisible)</span>
              
              {(() => {
                const maxVal = rhoMax * 1.35;
                const minPct = (rhoMin / maxVal) * 100;
                const maxPct = (rhoMax / maxVal) * 100;
                const rhoPct = Math.min(97, Math.max(3, (rho / maxVal) * 100));

                let statusLabel = "Rango Óptimo de Ductilidad (Cumple ACI 318)";
                let statusColor = "text-emerald-400 border-emerald-500/30 bg-emerald-950/45";
                
                if (rho < rhoMin) {
                  statusLabel = "Cuantía bajo el Mínimo (Fallo Frágil por Tracción)";
                  statusColor = "text-amber-500 border-amber-500/30 bg-amber-955/45";
                } else if (rho > rhoMax) {
                  statusLabel = "Cuantía sobre el Máximo (Fallo Frágil por Compresión)";
                  statusColor = "text-pink-500 border-pink-500/30 bg-pink-955/45";
                }

                return (
                  <div className="space-y-4">
                    {/* Status header bar */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Estado de comportamiento:</span>
                      <span className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold border ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Main track widget */}
                    <div className="relative h-10 bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden">
                      {/* Segment zones */}
                      {/* Zero to min: brittle minimum (Orange warning) */}
                      <div 
                        className="absolute h-full top-0 left-0 bg-gradient-to-r from-red-500/5 to-amber-500/10 border-r border-dashed border-amber-500/30"
                        style={{ width: `${minPct}%` }}
                        title="Cuantía Insuficiente (Falla frágil súbita)"
                      />

                      {/* Min to max: balanced ductile (Emerald safe) */}
                      <div 
                        className="absolute h-full top-0 bg-gradient-to-r from-emerald-500/5 to-emerald-500/15 border-r border-dashed border-indigo-500/30"
                        style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
                        title="Rango Dúctil Sismorresistente ACI 318"
                      />

                      {/* Max to 135%: brittle compression (Pink warning) */}
                      <div 
                        className="absolute h-full top-0 right-0 bg-gradient-to-r from-pink-500/15 to-red-600/10"
                        style={{ left: `${maxPct}%`, right: 0 }}
                        title="Viga Sobre-reforzada (Aplastamiento del hormigón sin aviso, no dúctil)"
                      />

                      {/* Min marker bar */}
                      <div 
                        className="absolute top-0 bottom-0 border-l border-amber-500 z-10 flex flex-col justify-between"
                        style={{ left: `${minPct}%` }}
                      >
                        <span className="text-[8.5px] text-amber-500/90 font-mono font-bold bg-[#0a0f1d]/90 px-1 py-0.5 rounded border border-amber-500/20 mt-1 shadow -ml-1 whitespace-nowrap">
                          ρmin ({(rhoMin * 100).toFixed(3)}%)
                        </span>
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full -ml-[3.5px] mb-0.5"></div>
                      </div>

                      {/* Max marker bar - Offset to bottom to prevent overlap when limits are close */}
                      <div 
                        className="absolute top-0 bottom-0 border-l border-indigo-500 z-10 flex flex-col justify-between"
                        style={{ left: `${maxPct}%` }}
                      >
                        <span className="text-[8.5px] text-indigo-400/95 font-mono font-bold bg-[#0a0f1d]/90 px-1 py-0.5 rounded border border-indigo-500/20 mt-5.5 shadow -ml-1 whitespace-nowrap">
                          ρmax ({(rhoMax * 100).toFixed(3)}%)
                        </span>
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full -ml-[3.5px] mb-0.5"></div>
                      </div>

                      {/* Real-time rho indicator indicator */}
                      <div 
                        className="absolute top-0 bottom-0 z-20 flex flex-col items-center justify-center pointer-events-none"
                        style={{ left: `${rhoPct}%` }}
                      >
                        <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                        
                        {/* Dynamic Floating Handle with Current Ratio */}
                        <div className={`absolute w-7 h-7 rounded-full -translate-y-0.5 flex flex-col items-center justify-center font-black text-sm border-2 shadow-[0_4px_10px_rgba(0,0,0,0.6)] ${
                          steelRatioValid 
                            ? "bg-emerald-500 border-white text-slate-950" 
                            : "bg-pink-500 border-white text-slate-950"
                        }`} title={`Relación Real ρ = ${(rho * 100).toFixed(3)}%`}>
                          ρ
                        </div>

                        {/* Direct % display */}
                        <div className="absolute -bottom-0.5 bg-slate-900 border border-slate-700 text-cyan-400 font-mono text-[9px] px-1 py-0.2 rounded font-bold shadow-md whitespace-nowrap">
                          {(rho * 100).toFixed(3)} %
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <p className="text-[10px] text-slate-500 leading-relaxed pt-1.5 flex items-start gap-1.5">
                <span className="text-amber-500 font-bold shrink-0">ⓘ</span>
                <span>La norma ACI-318 específica que para vigas sometidas a flexión, la cuantía real <span className="text-slate-300 font-mono">ρ = As / (b·d)</span> debe estar comprendida obligatoriamente entre <span className="text-slate-300 font-mono">ρ_min</span> y <span className="text-slate-300 font-mono">ρ_max</span> para inducir la plastificación por tracción del acero antes que el agrietamiento por compresión del concreto.</span>
              </p>
            </div>

            {/* Step by step formulas calculator feedback */}
            <div className="p-3.5 bg-[#090e1b] rounded-lg border border-[#1b2a47] space-y-2">
              <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Resultados de Deformaciones y Tensiones</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-[10.5px]">
                <div>
                  <div className="text-slate-500">a (Stress Block):</div>
                  <div className="text-slate-200 font-bold">{a.toFixed(1)} mm</div>
                </div>
                <div>
                  <div className="text-slate-500">c (Eje Neutro):</div>
                  <div className="text-slate-200 font-bold">{c_depth.toFixed(1)} mm</div>
                </div>
                <div>
                  <div className="text-slate-500">Deform. Acero (εs):</div>
                  <div className={`font-bold ${steelStrain >= 0.005 ? "text-emerald-400" : "text-amber-500"}`}>
                    {steelStrain.toFixed(5)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Relación Mn / Mu:</div>
                  <div className={`font-bold ${flexureStatus ? "text-emerald-400" : "text-pink-400"}`}>
                    {(phiMn / mu).toFixed(2)} x
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
