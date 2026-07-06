export type UnitSystem = 'metric' | 'imperial';

export const UNITS = {
  metric: {
    length: 'm',
    section: 'mm',
    force: 'kN',
    moment: 'kN·m',
    distLoad: 'kN/m',
    stress: 'MPa',
    area: 'mm²',
    inertia: 'mm⁴',
    modulus: 'mm³',
    linearMass: 'kg/m'
  },
  imperial: {
    length: 'in',
    section: 'in',
    force: 'lb',
    moment: 'lb·in',
    distLoad: 'lb/in',
    stress: 'psi',
    area: 'in²',
    inertia: 'in⁴',
    modulus: 'in³',
    linearMass: 'lb/ft'
  }
};

// Conversion factors from metric base to imperial
const CONVERSIONS = {
  m_to_in: 39.3701,
  mm_to_in: 0.0393701,
  kN_to_lb: 224.809,
  kNm_to_lbin: 8850.75, // 1 kN*m = 1000 N * 1000 mm = 1e6 N*mm -> to lb*in = 1e6 * (1/4.448) * (1/25.4) = 8850.75
  kNm_to_lbin_alt: 224.809 * 39.3701, // 8850.75
  kNm_dist_to_lbin: 224.809 / 39.3701, // kN/m to lb/in = 5.7101
  MPa_to_psi: 145.038,
  mm2_to_in2: 0.0393701 ** 2,
  mm3_to_in3: 0.0393701 ** 3,
  mm4_to_in4: 0.0393701 ** 4,
  kg_m_to_lb_ft: 0.671969
};

/**
 * Converts a value from metric to the target unit system.
 */
export function convert(value: number, type: keyof typeof UNITS.metric, system: UnitSystem): number {
  if (system === 'metric') return value;
  
  switch (type) {
    case 'length': return value * CONVERSIONS.m_to_in;
    case 'section': return value * CONVERSIONS.mm_to_in;
    case 'force': return value * CONVERSIONS.kN_to_lb;
    case 'moment': return value * CONVERSIONS.kNm_to_lbin_alt;
    case 'distLoad': return value * CONVERSIONS.kNm_dist_to_lbin;
    case 'stress': return value * CONVERSIONS.MPa_to_psi;
    case 'area': return value * CONVERSIONS.mm2_to_in2;
    case 'inertia': return value * CONVERSIONS.mm4_to_in4;
    case 'modulus': return value * CONVERSIONS.mm3_to_in3;
    case 'linearMass': return value * CONVERSIONS.kg_m_to_lb_ft;
    default: return value;
  }
}

/**
 * Converts a value from the current unit system BACK to metric for internal state.
 */
export function toMetric(value: number, type: keyof typeof UNITS.metric, system: UnitSystem): number {
  if (system === 'metric') return value;
  
  switch (type) {
    case 'length': return value / CONVERSIONS.m_to_in;
    case 'section': return value / CONVERSIONS.mm_to_in;
    case 'force': return value / CONVERSIONS.kN_to_lb;
    case 'moment': return value / CONVERSIONS.kNm_to_lbin_alt;
    case 'distLoad': return value / CONVERSIONS.kNm_dist_to_lbin;
    case 'stress': return value / CONVERSIONS.MPa_to_psi;
    case 'area': return value / CONVERSIONS.mm2_to_in2;
    case 'inertia': return value / CONVERSIONS.mm4_to_in4;
    case 'modulus': return value / CONVERSIONS.mm3_to_in3;
    case 'linearMass': return value / CONVERSIONS.kg_m_to_lb_ft;
    default: return value;
  }
}

/**
 * Formats a value with its appropriate unit label.
 */
export function formatUnit(value: number, type: keyof typeof UNITS.metric, system: UnitSystem, fractionDigits = 2): string {
  const converted = convert(value, type, system);
  return `${converted.toFixed(fractionDigits)} ${UNITS[system][type]}`;
}
