/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SectionType,
  SectionProperties,
  MaterialProperties,
  BeamLoad,
  LoadType,
  SupportType,
  SolverResult,
  SolverResultPoint
} from "../types";

/**
 * Calculates geometric properties of a beam's cross section.
 * Returns values in metric units: Area (mm^2), Inertia Ix (mm^4), Section Modulus Wx (mm^3), Shear Area Av (mm^2)
 */
export function calculateSectionProperties(type: SectionType, p: SectionProperties) {
  const h = p.height;
  const b = p.width;
  const tf = p.tf;
  const tw = p.tw;

  let area = 0;       // mm^2
  let inertia = 0;    // mm^4 (Ix)
  let modulus = 0;    // mm^3 (Wx)
  let shearArea = 0;  // mm^2 (Av)

  switch (type) {
    case SectionType.I_BEAM: {
      // Flanges (top & bottom) + Web
      // Height of web = h - 2*tf
      const webHeight = h - 2 * tf;
      area = 2 * (b * tf) + webHeight * tw;
      inertia = (b * Math.pow(h, 3)) / 12 - ((b - tw) * Math.pow(webHeight, 3)) / 12;
      modulus = inertia / (h / 2);
      shearArea = webHeight * tw; // web carries shear
      break;
    }
    case SectionType.C_CHANNEL: {
      // Same major-axis properties as I-Beam for simple calculations
      const webHeight = h - 2 * tf;
      area = 2 * (b * tf) + webHeight * tw;
      inertia = (b * Math.pow(h, 3)) / 12 - ((b - tw) * Math.pow(webHeight, 3)) / 12;
      modulus = inertia / (h / 2);
      shearArea = webHeight * tw;
      break;
    }
    case SectionType.CIRCULAR: {
      // If tw > 0, it's hollow circle (Pipe). If tw = 0 or undefined, solid circle.
      const D = h; // height as diameter
      if (tw > 0 && tw < D / 2) {
        const Di = D - 2 * tw;
        area = (Math.PI / 4) * (Math.pow(D, 2) - Math.pow(Di, 2));
        inertia = (Math.PI / 64) * (Math.pow(D, 4) - Math.pow(Di, 4));
        modulus = inertia / (D / 2);
        // Shear area approximation for hollow pipe is approx Area / 2 or 0.6 Area
        shearArea = area * 0.6;
      } else {
        area = (Math.PI / 4) * Math.pow(D, 2);
        inertia = (Math.PI / 64) * Math.pow(D, 4);
        modulus = inertia / (D / 2);
        shearArea = area * 0.75; // average shear for circle is V/Av, Av = 0.75 * Area
      }
      break;
    }
    case SectionType.RHS_SHS: {
      // Rectangular/Square Hollow Section
      // Inner dimensions
      const innerW = b - 2 * tw;
      const innerH = h - 2 * tf;
      area = b * h - innerW * innerH;
      inertia = (b * Math.pow(h, 3)) / 12 - (innerW * Math.pow(innerH, 3)) / 12;
      modulus = inertia / (h / 2);
      shearArea = 2 * innerH * tw; // the two side walls carry shear
      break;
    }
    case SectionType.RECT_SOLID: {
      // Solid Rectangular Section
      area = b * h;
      inertia = (b * Math.pow(h, 3)) / 12;
      modulus = inertia / (h / 2);
      shearArea = (2 / 3) * area; // Shear area for solid rectangle is (2/3) * area
      break;
    }
  }

  const radiusOfGyration = area > 0 ? Math.sqrt(inertia / area) : 0;

  return { area, inertia, modulus, shearArea, radiusOfGyration };
}

/**
 * Solves a linear system Ax = B using Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(N: number, K: number[][], F: number[]): number[] {
  const A: number[][] = [];
  for (let i = 0; i < N; i++) {
    A[i] = new Array(N + 1);
    for (let j = 0; j < N; j++) {
      A[i][j] = K[i][j];
    }
    A[i][N] = F[i];
  }

  for (let i = 0; i < N; i++) {
    // Find pivot
    let maxRow = i;
    for (let r = i + 1; r < N; r++) {
      if (Math.abs(A[r][i]) > Math.abs(A[maxRow][i])) {
        maxRow = r;
      }
    }

    // Swap rows
    if (maxRow !== i) {
      const temp = A[i];
      A[i] = A[maxRow];
      A[maxRow] = temp;
    }

    // Solve column
    const diag = A[i][i];
    if (Math.abs(diag) < 1e-15) {
      A[i][i] = 1e-15;
    }

    for (let r = i + 1; r < N; r++) {
      const factor = A[r][i] / A[i][i];
      for (let c = i; c <= N; c++) {
        A[r][c] -= factor * A[i][c];
      }
    }
  }

  // Back substitution
  const x = new Array(N).fill(0);
  for (let i = N - 1; i >= 0; i--) {
    let sum = A[i][N];
    for (let j = i + 1; j < N; j++) {
      sum -= A[i][j] * x[j];
    }
    x[i] = sum / A[i][i];
  }
  return x;
}

/**
 * Universal beam solver supporting up to 4 arbitrary supports via 1D Finite Element Stiffness formulation.
 */
export function solveBeam(
  length: number, // m
  sectionType: SectionType,
  sectionProps: SectionProperties,
  material: MaterialProperties,
  loads: BeamLoad[],
  includeSelfWeight = false,
  supportAPosition = 0,
  supportBPosition: number = length,
  supportCPosition = length * 0.33,
  supportDPosition = length * 0.66,
  supportAType: SupportType = SupportType.PINNED,
  supportBType: SupportType = SupportType.ROLLER,
  supportCType: SupportType = SupportType.FREE,
  supportDType: SupportType = SupportType.FREE
): SolverResult {
  // 1. Cross sectional properties
  const { area, inertia, modulus, shearArea } = calculateSectionProperties(sectionType, sectionProps);

  // Compute self weight load in kN/m
  const areaM2 = area / 1000000;
  const massPerMeter = areaM2 * material.density; // kg/m
  const selfWeightNPerM = massPerMeter * 9.80665; // N/m
  const selfWeightKnPerM = selfWeightNPerM / 1000; // kN/m

  // Generate list of active loads
  const activeLoads: { type: "point" | "distributed" | "triangular" | "moment" | "torque"; magnitude: number; magnitude2?: number; pos1: number; pos2?: number }[] = [];

  // Add user loads
  for (const load of loads) {
    if (load.type === LoadType.POINT) {
      activeLoads.push({
        type: "point",
        magnitude: load.magnitude,
        pos1: load.position
      });
    } else if (load.type === LoadType.DISTRIBUTED) {
      activeLoads.push({
        type: "distributed",
        magnitude: load.magnitude,
        pos1: load.start,
        pos2: load.end
      });
    } else if (load.type === LoadType.TRIANGULAR) {
      activeLoads.push({
        type: "triangular",
        magnitude: load.magnitudeStart,
        magnitude2: load.magnitudeEnd,
        pos1: load.start,
        pos2: load.end
      });
    } else if (load.type === LoadType.MOMENT) {
      activeLoads.push({
        type: "moment",
        magnitude: load.magnitude,
        pos1: load.position
      });
    } else if (load.type === LoadType.TORQUE) {
      activeLoads.push({
        type: "torque",
        magnitude: load.magnitude,
        pos1: load.position
      });
    }
  }

  // Add self weight as distributed load if requested
  if (includeSelfWeight && selfWeightKnPerM > 0) {
    activeLoads.push({
      type: "distributed",
      magnitude: selfWeightKnPerM,
      pos1: 0,
      pos2: length
    });
  }

  // 2. Direct Stiffness Method (1D Beam Elements) to calculate exact Reaction Forces and Deflections
  const N_elem = 200;
  const Le = length / N_elem;
  const E_Pa = material.elasticModulus * 1e9; // Pa
  const I_m4 = inertia / 1e12; // m^4
  const EI = E_Pa * I_m4; // N*m^2

  const N_dof = 2 * (N_elem + 1); // 402 DOFs

  // Initialize Stiffness Matrix K and Force Vector F
  const K: number[][] = [];
  for (let i = 0; i < N_dof; i++) {
    K[i] = new Array(N_dof).fill(0);
  }
  const F = new Array(N_dof).fill(0);

  // Assemble Elements Stiffness
  const ke_coef = EI / Math.pow(Le, 3);
  const ke_local = [
    [12, 6 * Le, -12, 6 * Le],
    [6 * Le, 4 * Le * Le, -6 * Le, 2 * Le * Le],
    [-12, -6 * Le, 12, -6 * Le],
    [6 * Le, 2 * Le * Le, -6 * Le, 4 * Le * Le]
  ];

  for (let i = 0; i < N_elem; i++) {
    const idxs = [2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 3];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        K[idxs[r]][idxs[c]] += ke_coef * ke_local[r][c];
      }
    }
  }

  // Convert loads to Equivalent Nodal Forces
  for (const l of activeLoads) {
    if (l.type === "point") {
      const P_N = l.magnitude * 1000; // N (positive is downward)
      const pos = l.pos1;
      const elemIdx = Math.min(N_elem - 1, Math.max(0, Math.floor(pos / Le)));
      const xi = Math.min(1, Math.max(0, (pos - elemIdx * Le) / Le));

      // Cubic shape functions
      const N1 = 1 - 3 * xi * xi + 2 * xi * xi * xi;
      const N2 = Le * (xi - 2 * xi * xi + xi * xi * xi);
      const N3 = 3 * xi * xi - 2 * xi * xi * xi;
      const N4 = Le * (-xi * xi + xi * xi * xi);

      F[2 * elemIdx] += -P_N * N1;
      F[2 * elemIdx + 1] += -P_N * N2;
      F[2 * elemIdx + 2] += -P_N * N3;
      F[2 * elemIdx + 3] += -P_N * N4;

    } else if (l.type === "moment") {
      const M_Nm = l.magnitude * 1000; // N*m (clockwise moment)
      const pos = l.pos1;
      const elemIdx = Math.min(N_elem - 1, Math.max(0, Math.floor(pos / Le)));
      const xi = Math.min(1, Math.max(0, (pos - elemIdx * Le) / Le));

      // First derivatives of shape functions
      const dN1 = (-6 * xi + 6 * xi * xi) / Le;
      const dN2 = 1 - 4 * xi + 3 * xi * xi;
      const dN3 = (6 * xi - 6 * xi * xi) / Le;
      const dN4 = -2 * xi + 3 * xi * xi;

      F[2 * elemIdx] += M_Nm * dN1;
      F[2 * elemIdx + 1] += M_Nm * dN2;
      F[2 * elemIdx + 2] += M_Nm * dN3;
      F[2 * elemIdx + 3] += M_Nm * dN4;

    } else if (l.type === "distributed") {
      const w_Npm = l.magnitude * 1000; // N/m (positive is downward)
      const start = l.pos1;
      const end = l.pos2!;
      
      // Let's integrate distributed load numerically by dividing into 50 point loads
      const numSteps = 50;
      const stepLen = (end - start) / numSteps;
      for (let s = 0; s < numSteps; s++) {
        const p_pos = start + (s + 0.5) * stepLen;
        const p_mag = w_Npm * stepLen;

        const elemIdx = Math.min(N_elem - 1, Math.max(0, Math.floor(p_pos / Le)));
        const xi = Math.min(1, Math.max(0, (p_pos - elemIdx * Le) / Le));

        const N1 = 1 - 3 * xi * xi + 2 * xi * xi * xi;
        const N2 = Le * (xi - 2 * xi * xi + xi * xi * xi);
        const N3 = 3 * xi * xi - 2 * xi * xi * xi;
        const N4 = Le * (-xi * xi + xi * xi * xi);

        F[2 * elemIdx] += -p_mag * N1;
        F[2 * elemIdx + 1] += -p_mag * N2;
        F[2 * elemIdx + 2] += -p_mag * N3;
        F[2 * elemIdx + 3] += -p_mag * N4;
      }
    } else if (l.type === "triangular") {
      const w_start = l.magnitude * 1000; // N/m at start (positive is downward)
      const w_end = (l.magnitude2 ?? 0) * 1000; // N/m at end
      const start = l.pos1;
      const end = l.pos2!;
      
      // Integrate trapezoidal/triangular load numerically by dividing into 50 point loads
      const numSteps = 50;
      const stepLen = (end - start) / numSteps;
      for (let s = 0; s < numSteps; s++) {
        const p_pos = start + (s + 0.5) * stepLen;
        const fraction = (p_pos - start) / (end - start);
        const w_at_pos = w_start + (w_end - w_start) * fraction;
        const p_mag = w_at_pos * stepLen;

        const elemIdx = Math.min(N_elem - 1, Math.max(0, Math.floor(p_pos / Le)));
        const xi = Math.min(1, Math.max(0, (p_pos - elemIdx * Le) / Le));

        const N1 = 1 - 3 * xi * xi + 2 * xi * xi * xi;
        const N2 = Le * (xi - 2 * xi * xi + xi * xi * xi);
        const N3 = 3 * xi * xi - 2 * xi * xi * xi;
        const N4 = Le * (-xi * xi + xi * xi * xi);

        F[2 * elemIdx] += -p_mag * N1;
        F[2 * elemIdx + 1] += -p_mag * N2;
        F[2 * elemIdx + 2] += -p_mag * N3;
        F[2 * elemIdx + 3] += -p_mag * N4;
      }
    }
  }

  // Determine active constraints based on the 4 supports
  const supports = [
    { id: "A", pos: supportAPosition, type: supportAType },
    { id: "B", pos: supportBPosition, type: supportBType },
    { id: "C", pos: supportCPosition, type: supportCType },
    { id: "D", pos: supportDPosition, type: supportDType }
  ];

  const constrainedDOFs = new Set<number>();

  for (const s of supports) {
    if (s.type === SupportType.FREE) continue;
    
    const nodeIdx = Math.min(N_elem, Math.max(0, Math.round((s.pos / length) * N_elem)));
    
    if (s.type === SupportType.PINNED || s.type === SupportType.ROLLER) {
      // Restrain vertical deflection
      constrainedDOFs.add(2 * nodeIdx);
    } else if (s.type === SupportType.FIXED) {
      // Restrain vertical deflection and rotation
      constrainedDOFs.add(2 * nodeIdx);
      constrainedDOFs.add(2 * nodeIdx + 1);
    } else if (s.type === SupportType.GUIDED) {
      // Restrain rotation
      constrainedDOFs.add(2 * nodeIdx + 1);
    }
  }

  // If there are no vertical supports, add standard dummy support to prevent singularity
  let hasVerticalSupport = false;
  for (const s of supports) {
    if (s.type !== SupportType.FREE && s.type !== SupportType.GUIDED) {
      hasVerticalSupport = true;
    }
  }
  if (!hasVerticalSupport) {
    // Default pinning at x=0 and roller at x=L
    constrainedDOFs.add(0);
    constrainedDOFs.add(2 * N_elem);
  }

  // Clone Stiffness and Force vector to apply boundary conditions
  const K_copy: number[][] = [];
  for (let i = 0; i < N_dof; i++) {
    K_copy[i] = [...K[i]];
  }
  const F_copy = [...F];

  // Enforce boundary conditions using direct equation modification
  for (const c of constrainedDOFs) {
    K_copy[c] = new Array(N_dof).fill(0);
    K_copy[c][c] = 1.0;
    F_copy[c] = 0.0;
  }

  // Solve the linear system
  const d = solveLinearSystem(N_dof, K_copy, F_copy);

  // Compute nodal reactions: R = K * d - F
  const reactionsVec = new Array(N_dof).fill(0);
  for (let r = 0; r < N_dof; r++) {
    let sum = 0;
    for (let c = 0; c < N_dof; c++) {
      sum += K[r][c] * d[c];
    }
    reactionsVec[r] = sum - F[r];
  }

  // Extract support reaction forces & moments
  let ra = 0, rb = 0, rc = 0, rd = 0;
  let ha = 0, hb = 0, hc = 0, hd = 0;
  let ma = 0, mb = 0, mc = 0, md = 0;

  for (const s of supports) {
    if (s.type === SupportType.FREE) continue;
    const nodeIdx = Math.min(N_elem, Math.max(0, Math.round((s.pos / length) * N_elem)));
    const rx_kn = (reactionsVec[2 * nodeIdx] || 0) / 1000;
    const rm_knm = (reactionsVec[2 * nodeIdx + 1] || 0) / 1000;

    if (s.id === "A") {
      ra = rx_kn;
      ma = rm_knm;
    } else if (s.id === "B") {
      rb = rx_kn;
      mb = rm_knm;
    } else if (s.id === "C") {
      rc = rx_kn;
      mc = rm_knm;
    } else if (s.id === "D") {
      rd = rx_kn;
      md = rm_knm;
    }
  }

  // Compute Torsional reactions (same outer-support boundary as before, generalized)
  let ta = 0;
  let tb = 0;
  let tc = 0;
  let td = 0;
  const activeSups = supports.filter(s => s.type !== SupportType.FREE).sort((a, b) => a.pos - b.pos);

  for (const l of activeLoads) {
    if (l.type === "torque") {
      const tMag = l.magnitude; // kNm
      const tPos = l.pos1;
      
      if (activeSups.length === 1) {
        // Single support takes 100% of the torque
        const s = activeSups[0];
        if (s.id === "A") ta += tMag;
        else if (s.id === "B") tb += tMag;
        else if (s.id === "C") tc += tMag;
        else if (s.id === "D") td += tMag;
      } else if (activeSups.length > 1) {
        // Find if this load is to the left of all active supports, to the right of all, or between two
        if (tPos <= activeSups[0].pos) {
          const s = activeSups[0];
          if (s.id === "A") ta += tMag;
          else if (s.id === "B") tb += tMag;
          else if (s.id === "C") tc += tMag;
          else if (s.id === "D") td += tMag;
        } else if (tPos >= activeSups[activeSups.length - 1].pos) {
          const s = activeSups[activeSups.length - 1];
          if (s.id === "A") ta += tMag;
          else if (s.id === "B") tb += tMag;
          else if (s.id === "C") tc += tMag;
          else if (s.id === "D") td += tMag;
        } else {
          // Between two active supports
          let s1 = activeSups[0];
          let s2 = activeSups[1];
          for (let idx = 0; idx < activeSups.length - 1; idx++) {
            if (tPos >= activeSups[idx].pos && tPos <= activeSups[idx + 1].pos) {
              s1 = activeSups[idx];
              s2 = activeSups[idx + 1];
              break;
            }
          }
          const span = s2.pos - s1.pos;
          if (span > 0.001) {
            const r1 = tMag * ((s2.pos - tPos) / span);
            const r2 = tMag * ((tPos - s1.pos) / span);
            
            if (s1.id === "A") ta += r1;
            else if (s1.id === "B") tb += r1;
            else if (s1.id === "C") tc += r1;
            else if (s1.id === "D") td += r1;

            if (s2.id === "A") ta += r2;
            else if (s2.id === "B") tb += r2;
            else if (s2.id === "C") tc += r2;
            else if (s2.id === "D") td += r2;
          } else {
            if (s1.id === "A") ta += tMag / 2;
            else if (s1.id === "B") tb += tMag / 2;
            else if (s1.id === "C") tc += tMag / 2;
            else if (s1.id === "D") td += tMag / 2;

            if (s2.id === "A") ta += tMag / 2;
            else if (s2.id === "B") tb += tMag / 2;
            else if (s2.id === "C") tc += tMag / 2;
            else if (s2.id === "D") td += tMag / 2;
          }
        }
      }
    }
  }

  // 3. Evaluate beam at points
  const points: SolverResultPoint[] = [];

  // Pre-calculate values at regular increments
  for (let i = 0; i <= N_elem; i++) {
    const x = (length * i) / N_elem; // m

    let V = 0; // kN
    let M = 0; // kNm
    let T = 0; // kNm (Torque)

    // Reacting forces to the left of x
    for (const s of supports) {
      if (s.type === SupportType.FREE) continue;
      if (x >= s.pos) {
        let r_val = 0;
        let m_val = 0;
        let t_val = 0;
        if (s.id === "A") { r_val = ra; m_val = ma; t_val = ta; }
        else if (s.id === "B") { r_val = rb; m_val = mb; t_val = tb; }
        else if (s.id === "C") { r_val = rc; m_val = mc; t_val = tc; }
        else if (s.id === "D") { r_val = rd; m_val = md; t_val = td; }

        V += r_val;
        M += r_val * (x - s.pos) + m_val;
        T += t_val;
      }
    }

    // Subtracting loads to the left of x
    for (const l of activeLoads) {
      if (l.type === "point") {
        if (x >= l.pos1) {
          V -= l.magnitude;
          M -= l.magnitude * (x - l.pos1);
        }
      } else if (l.type === "distributed") {
        const start = l.pos1;
        const end = l.pos2!;
        if (x > start) {
          if (x <= end) {
            // Section is cut inside the distributed load
            const activeLen = x - start;
            const segmentLoad = l.magnitude * activeLen;
            V -= segmentLoad;
            M -= segmentLoad * (activeLen / 2);
          } else {
            // Section is cut to the right of the distributed load
            const loadLen = end - start;
            const fullLoad = l.magnitude * loadLen;
            const center = start + loadLen / 2;
            V -= fullLoad;
            M -= fullLoad * (x - center);
          }
        }
      } else if (l.type === "triangular") {
        const start = l.pos1;
        const end = l.pos2!;
        const w1 = l.magnitude;
        const w2 = l.magnitude2 ?? 0;
        const Lv = end - start;

        if (x > start && Lv > 0.001) {
          if (x <= end) {
            // Section is cut inside the triangular/varying load
            const xActive = x - start;
            const wx = w1 + ((w2 - w1) / Lv) * xActive;
            const segmentLoad = ((w1 + wx) / 2) * xActive;
            V -= segmentLoad;
            M -= (xActive * xActive / 6) * (w1 + 2 * wx);
          } else {
            // Section is cut to the right of the triangular/varying load
            const fullLoad = ((w1 + w2) / 2) * Lv;
            const centroidFromStart = (Lv / 3) * ((w1 + 2 * w2) / (w1 + w2));
            const arm = (x - start) - centroidFromStart;
            V -= fullLoad;
            M -= fullLoad * arm;
          }
        }
      } else if (l.type === "moment") {
        if (x >= l.pos1) {
          M += l.magnitude; // Add point moment clockwise
        }
      } else if (l.type === "torque") {
        if (x >= l.pos1) {
          T -= l.magnitude; // Subtract point torque clockwise
        }
      }
    }

    // Calculate torsional shear stress first
    let torsionalStress = 0; // MPa
    const T_Nmm = Math.abs(T) * 1000000; // N·mm

    switch (sectionType) {
      case SectionType.I_BEAM:
      case SectionType.C_CHANNEL: {
        const J_open = (1 / 3) * (2 * sectionProps.width * Math.pow(sectionProps.tf, 3) + (sectionProps.height - 2 * sectionProps.tf) * Math.pow(sectionProps.tw, 3));
        const t_max = Math.max(sectionProps.tf, sectionProps.tw);
        torsionalStress = J_open > 0 ? (T_Nmm * t_max) / J_open : 0;
        break;
      }
      case SectionType.CIRCULAR: {
        const D = sectionProps.height;
        if (sectionProps.tw > 0 && sectionProps.tw < D / 2) {
          const Di = D - 2 * sectionProps.tw;
          const Jp = (Math.PI / 32) * (Math.pow(D, 4) - Math.pow(Di, 4));
          torsionalStress = Jp > 0 ? (T_Nmm * (D / 2)) / Jp : 0;
        } else {
          const Jp = (Math.PI / 32) * Math.pow(D, 4);
          torsionalStress = Jp > 0 ? (T_Nmm * (D / 2)) / Jp : 0;
        }
        break;
      }
      case SectionType.RHS_SHS: {
        const bm = sectionProps.width - sectionProps.tw;
        const hm = sectionProps.height - sectionProps.tf;
        const Am = bm * hm;
        const t_min = Math.min(sectionProps.tf > 0 ? sectionProps.tf : sectionProps.tw, sectionProps.tw > 0 ? sectionProps.tw : sectionProps.tf);
        torsionalStress = (Am > 0 && t_min > 0) ? T_Nmm / (2 * Am * t_min) : 0;
        break;
      }
      case SectionType.RECT_SOLID: {
        const a = Math.max(sectionProps.width, sectionProps.height);
        const b_dim = Math.min(sectionProps.width, sectionProps.height);
        const alpha = 1 / (3 + 1.8 * (b_dim / a));
        torsionalStress = (a > 0 && b_dim > 0) ? T_Nmm / (alpha * a * Math.pow(b_dim, 2)) : 0;
        break;
      }
    }

    // Deflection is direct value from the solved nodal translation!
    // Since positive upward is our FEM vertical node displacement, and positive down is standard down-deflection,
    // deflection in mm = -d[2 * i] * 1000.
    const deflection_mm = -d[2 * i] * 1000;

    points.push({
      x,
      shear: V,
      moment: M,
      torque: T,
      deflection: deflection_mm,
      stress: 0,     // calculated below
      torsionalStress
    });
  }

  // 4. Calculate normal bending stress (sigma_x = M / Wx)
  for (const pt of points) {
    pt.stress = Math.abs(pt.moment * 1000000) / modulus; // MPa
  }

  // 6. Find extrema (max / min)
  let maxMomVal = 0;
  let maxMomX = 0;
  let maxShearVal = 0;
  let maxShearX = 0;
  let maxDeflectVal = 0;
  let maxDeflectX = 0;
  let maxStressVal = 0;
  let maxStressX = 0;

  for (const pt of points) {
    if (Math.abs(pt.moment) > Math.abs(maxMomVal)) {
      maxMomVal = pt.moment;
      maxMomX = pt.x;
    }
    if (Math.abs(pt.shear) > Math.abs(maxShearVal)) {
      maxShearVal = pt.shear;
      maxShearX = pt.x;
    }
    if (Math.abs(pt.deflection) > Math.abs(maxDeflectVal)) {
      maxDeflectVal = pt.deflection;
      maxDeflectX = pt.x;
    }
    if (pt.stress > maxStressVal) {
      maxStressVal = pt.stress;
      maxStressX = pt.x;
    }
  }

  // Adjust max deflection sign to display positive magnitudes in result cards
  const absMaxDeflectionVal = Math.abs(maxDeflectVal);

  // 7. Check Failure Criterias (Von Mises and Tresca)
  let vonMisesSigmaEq = 0;
  let trescaTauMax = 0;

  for (const pt of points) {
    const pt_shear_stress = shearArea > 0 ? (Math.abs(pt.shear) * 1000) / shearArea : 0;
    
    // NA (Neutral Axis) Shear
    const tau_NA = pt_shear_stress + pt.torsionalStress;
    const vm_NA = Math.sqrt(3) * tau_NA;
    const tr_NA = tau_NA;

    // EF (Extreme Fiber) Combined Stresses
    const vm_EF = Math.sqrt(Math.pow(pt.stress, 2) + 3 * Math.pow(pt.torsionalStress, 2));
    const tr_EF = Math.sqrt(Math.pow(pt.stress / 2, 2) + Math.pow(pt.torsionalStress, 2));

    const pt_VM = Math.max(vm_NA, vm_EF);
    const pt_TR = Math.max(tr_NA, tr_EF);

    if (pt_VM > vonMisesSigmaEq) {
      vonMisesSigmaEq = pt_VM;
    }
    if (pt_TR > trescaTauMax) {
      trescaTauMax = pt_TR;
    }
  }

  // Safety Factor (Von Mises)
  let vonMisesFS = 3.0; // default safe factor
  if (vonMisesSigmaEq > 0) {
    vonMisesFS = material.fy / vonMisesSigmaEq;
  }
  const vonMisesStatus = vonMisesFS >= 1.0 ? "SAFE" : "UNSAFE";

  // Allowable shear stress under Tresca
  const trescaTauAllow = material.fy / 2;
  let trescaFS = 3.0;
  if (trescaTauMax > 0) {
    trescaFS = trescaTauAllow / trescaTauMax;
  }
  const trescaStatus = trescaFS >= 1.0 ? "SAFE" : "UNSAFE";

  // 8. Global Status
  const isSafe = vonMisesStatus === "SAFE" && trescaStatus === "SAFE";
  const minFS = Math.min(vonMisesFS, trescaFS);

  return {
    reactions: {
      ra: parseFloat(ra.toFixed(3)),
      rb: parseFloat(rb.toFixed(3)),
      rc: parseFloat(rc.toFixed(3)),
      rd: parseFloat(rd.toFixed(3)),
      ha: parseFloat(ha.toFixed(3)),
      hb: parseFloat(hb.toFixed(3)),
      hc: parseFloat(hc.toFixed(3)),
      hd: parseFloat(hd.toFixed(3)),
      ma: parseFloat(ma.toFixed(3)),
      mb: parseFloat(mb.toFixed(3)),
      mc: parseFloat(mc.toFixed(3)),
      md: parseFloat(md.toFixed(3)),
      ta: parseFloat(ta.toFixed(3)),
      tb: parseFloat(tb.toFixed(3)),
      tc: parseFloat(tc.toFixed(3)),
      td: parseFloat(td.toFixed(3))
    },
    points,
    maxMoment: { value: parseFloat(maxMomVal.toFixed(2)), x: parseFloat(maxMomX.toFixed(3)) },
    maxShear: { value: parseFloat(maxShearVal.toFixed(2)), x: parseFloat(maxShearX.toFixed(3)) },
    maxDeflection: { value: parseFloat(absMaxDeflectionVal.toFixed(2)), x: parseFloat(maxDeflectX.toFixed(3)) },
    maxStress: { value: parseFloat(maxStressVal.toFixed(2)), x: parseFloat(maxStressX.toFixed(3)) },
    vonMises: {
      sigmaEq: parseFloat(vonMisesSigmaEq.toFixed(2)),
      fy: material.fy,
      fs: parseFloat(vonMisesFS.toFixed(2)),
      status: vonMisesStatus
    },
    tresca: {
      tauMax: parseFloat(trescaTauMax.toFixed(2)),
      tauAllow: parseFloat(trescaTauAllow.toFixed(2)),
      fs: parseFloat(trescaFS.toFixed(2)),
      status: trescaStatus
    },
    globalStatus: {
      isSafe,
      minFS: parseFloat(minFS.toFixed(2))
    },
    selfWeightLoadKnPerM: parseFloat(selfWeightKnPerM.toFixed(4))
  };
}
