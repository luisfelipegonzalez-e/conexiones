/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum StructuralType {
  DETERMINED = "DETERMINADA",
  INDETERMINED = "INDETERMINADA"
}

export enum SupportType {
  PINNED = "Articulado",
  ROLLER = "Rodillo",
  FIXED = "Empotrado",
  GUIDED = "Guiado",
  FREE = "Libre"
}

export enum SectionType {
  I_BEAM = "I Perfil I",
  C_CHANNEL = "Canal C",
  CIRCULAR = "Circular",
  RHS_SHS = "RHS/SHS",
  RECT_SOLID = "Rectangular Sólido"
}

export interface SectionProperties {
  height: number; // h in mm
  width: number;  // b in mm
  tf: number;     // thickness flange in mm (or wall thickness for outer/top bottom)
  tw: number;     // thickness web in mm (or wall thickness for sides)
}

export interface MaterialProperties {
  name: string;
  fy: number;       // Límite de Fluencia (Yield Strength) in MPa
  fu: number;       // Resistencia Última (ultimate strength) in MPa
  elasticModulus: number; // Módulo de Young (E) in GPa
  poisson: number;        // v (Poisson's ratio)
  density: number;        // rho in kg/m³
}

export enum LoadType {
  POINT = "Carga Puntual",
  DISTRIBUTED = "Carga Distribuida",
  TRIANGULAR = "Carga Triangular",
  SUPPORT = "Apoyo",
  MOMENT = "Momento Flector",
  TORQUE = "Momento Torsor"
}

export interface PointLoad {
  id: string;
  type: LoadType.POINT;
  magnitude: number; // Value in kN (positive down)
  position: number;  // x in meters from left support (x=0)
}

export interface DistributedLoad {
  id: string;
  type: LoadType.DISTRIBUTED;
  magnitude: number; // Value in kN/m (positive down)
  start: number;     // x1 in meters
  end: number;       // x2 in meters
}

export interface TriangularLoad {
  id: string;
  type: LoadType.TRIANGULAR;
  magnitudeStart: number; // Value in kN/m at starting point
  magnitudeEnd: number;   // Value in kN/m at ending point
  start: number;          // x1 in meters
  end: number;            // x2 in meters
}

export interface MomentLoad {
  id: string;
  type: LoadType.MOMENT;
  magnitude: number; // Value in kN·m (positive clockwise)
  position: number;  // x in meters
}

export interface TorqueLoad {
  id: string;
  type: LoadType.TORQUE;
  magnitude: number; // Value in kN·m (positive clockwise along longitudinal axis)
  position: number;  // x in meters
}

export interface SupportLocation {
  id: string;
  type: LoadType.SUPPORT;
  supportType: SupportType;
  position: number; // x in meters
}

export type BeamLoad = PointLoad | DistributedLoad | TriangularLoad | MomentLoad | TorqueLoad;

export interface SolverResultPoint {
  x: number;          // Position along beam in meters
  shear: number;      // Shear force V in kN
  moment: number;     // Bending moment M in kNm
  torque: number;     // Torsional torque T in kNm
  deflection: number; // Deflection in mm (positive downwards)
  stress: number;     // Alternating bending stress (compression or tension max) in MPa
  torsionalStress: number; // Shear stress due to torsion in MPa
}

export interface SolverResult {
  reactions: {
    ra: number; // Reacción vertical en apoyo A en kN
    rb: number; // Reacción vertical en apoyo B en kN
    rc?: number; // Reacción vertical en apoyo C en kN
    rd?: number; // Reacción vertical en apoyo D en kN
    ha: number; // Reacción horizontal en apoyo A en kN
    hb: number; // Reacción horizontal en apoyo B en kN
    hc?: number; // Reacción horizontal en apoyo C en kN
    hd?: number; // Reacción horizontal en apoyo D en kN
    ma: number; // Momento de reacción en apoyo A en kNm
    mb: number; // Momento de reacción en apoyo B en kNm
    mc?: number; // Momento de reacción en apoyo C en kNm
    md?: number; // Momento de reacción en apoyo D en kNm
    ta?: number; // Reacción torsora en apoyo A en kNm
    tb?: number; // Reacción torsora en apoyo B en kNm
    tc?: number; // Reacción torsora en apoyo C en kNm
    td?: number; // Reacción torsora en apoyo D en kNm
  };
  points: SolverResultPoint[];
  maxMoment: { value: number; x: number };
  maxShear: { value: number; x: number };
  maxDeflection: { value: number; x: number };
  maxStress: { value: number; x: number };
  vonMises: {
    sigmaEq: number;
    fy: number;
    fs: number;
    status: "SAFE" | "UNSAFE";
  };
  tresca: {
    tauMax: number;
    tauAllow: number;
    fs: number;
    status: "SAFE" | "UNSAFE";
  };
  globalStatus: {
    isSafe: boolean;
    minFS: number;
  };
  selfWeightLoadKnPerM: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
