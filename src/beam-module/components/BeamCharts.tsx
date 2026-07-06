/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Eye, EyeOff, LayoutGrid } from "lucide-react";
import { SolverResultPoint } from "../types";
import { UnitSystem, formatUnit, convert, toMetric, UNITS } from "../utils/units";

interface BeamChartsProps {
  points: SolverResultPoint[];
  elasticModulus: number; // GPa
  showShear: boolean;
  setShowShear: (v: boolean) => void;
  showMoment: boolean;
  setShowMoment: (v: boolean) => void;
  showStress: boolean;
  setShowStress: (v: boolean) => void;
  showStrain: boolean;
  setShowStrain: (v: boolean) => void;
  showDeflection: boolean;
  setShowDeflection: (v: boolean) => void;
  unitSystem?: UnitSystem;
}

export default function BeamCharts({
  points,
  elasticModulus,
  showShear,
  setShowShear,
  showMoment,
  setShowMoment,
  showStress,
  setShowStress,
  showStrain,
  setShowStrain,
  showDeflection,
  setShowDeflection,
  unitSystem = 'metric'
}: BeamChartsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Check if there are any non-zero torsional torques
  const hasTorqueInResults = points.some(pt => Math.abs(pt.torque ?? 0) > 1e-5);

  // Compute values for strain
  // Strain (relative deformation, unitless) = stress (MPa) / E (GPa * 1000)
  const chartData = points.map((pt, idx) => {
    const strainVal = pt.stress / (elasticModulus * 1000);
    return {
      index: idx,
      x: convert(pt.x, 'length', unitSystem),
      shear: convert(pt.shear, 'force', unitSystem),
      moment: convert(pt.moment, 'moment', unitSystem),
      torque: convert(pt.torque ?? 0, 'moment', unitSystem),
      stress: convert(pt.stress, 'stress', unitSystem),
      torsionalStress: convert(pt.torsionalStress ?? 0, 'stress', unitSystem),
      strain: strainVal, // Unitless, no conversion
      deflection: convert(pt.deflection, 'deflection', unitSystem)
    };
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xCoord = e.clientX - rect.left;
    const svgWidth = rect.width;

    // Active chart area coordinates: 50px to svgWidth - 20px
    const chartLeft = 50;
    const chartRight = svgWidth - 20;
    const chartWidth = chartRight - chartLeft;

    if (xCoord >= chartLeft && xCoord <= chartRight) {
      const ratio = (xCoord - chartLeft) / chartWidth;
      const index = Math.round(ratio * (points.length - 1));
      if (index >= 0 && index < points.length) {
        setHoveredIndex(index);
      }
    } else {
      setHoveredIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="w-full bg-[#0d1527] border border-[#1b2a47] rounded-xl p-5 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1b2a47] pb-3 mb-4">
        <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-emerald-400" /> DIAGRAMAS ESTRUCTURALES
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowShear(true);
              setShowMoment(true);
              setShowStress(true);
              setShowStrain(true);
              setShowDeflection(true);
            }}
            className="text-[10.5px] font-sans font-semibold text-slate-400 hover:text-white bg-[#152342] border border-[#21396a] px-2.5 py-1 rounded transition-colors cursor-pointer"
          >
            Ver Todos
          </button>
        </div>
      </div>

      {/* Checklist selectors (Matches image right sidebar checkboxes) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 bg-[#121c32]/50 p-3 rounded-lg border border-[#1b2a47] text-slate-300">
        <label className="flex items-center gap-2 cursor-pointer text-xs group justify-start">
          <input
            type="checkbox"
            checked={showShear}
            onChange={(e) => setShowShear(e.target.checked)}
            className="w-4 h-4 rounded text-red-500 accent-red-500 bg-slate-900 border-slate-700 cursor-pointer"
          />
          <span className={`${showShear ? "text-slate-200" : "text-slate-500"} group-hover:text-red-400 transition-colors`}>
            Fuerza Cortante (V)
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs group justify-start">
          <input
            type="checkbox"
            checked={showMoment}
            onChange={(e) => setShowMoment(e.target.checked)}
            className="w-4 h-4 rounded text-blue-500 accent-blue-500 bg-slate-900 border-slate-700 cursor-pointer"
          />
          <span className={`${showMoment ? "text-slate-200" : "text-slate-500"} group-hover:text-blue-400 transition-colors`}>
            Momento Flector (M)
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs group justify-start">
          <input
            type="checkbox"
            checked={showStress}
            onChange={(e) => setShowStress(e.target.checked)}
            className="w-4 h-4 rounded text-purple-500 accent-purple-500 bg-slate-900 border-slate-700 cursor-pointer"
          />
          <span className={`${showStress ? "text-slate-200" : "text-slate-500"} group-hover:text-purple-400 transition-colors`}>
            Esfuerzo Normal (σ)
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs group justify-start">
          <input
            type="checkbox"
            checked={showStrain}
            onChange={(e) => setShowStrain(e.target.checked)}
            className="w-4 h-4 rounded text-amber-500 accent-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
          />
          <span className={`${showStrain ? "text-slate-200" : "text-slate-500"} group-hover:text-amber-400 transition-colors`}>
            Deformación (ε)
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs group justify-start">
          <input
            type="checkbox"
            checked={showDeflection}
            onChange={(e) => setShowDeflection(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
          />
          <span className={`${showDeflection ? "text-slate-200" : "text-slate-500"} group-hover:text-emerald-400 transition-colors`}>
            Desplazamiento (δ)
          </span>
        </label>
      </div>

      {/* Active Chart List */}
      <div className="space-y-4">
        {showShear && (
          <ChartPlot
            title="Diagrama de Fuerza Cortante (V)"
            units={UNITS[unitSystem].force}
            data={chartData.map(d => ({ x: d.x, y: d.shear }))}
            colorClass="stroke-red-500 fill-red-500/10"
            gradId="shear-grad"
            gradColor="#ef4444"
            hoveredIndex={hoveredIndex}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            hoveredValue={hoveredIndex !== null ? chartData[hoveredIndex].shear : null}
            hoveredX={hoveredIndex !== null ? chartData[hoveredIndex].x : null}
          />
        )}

        {showMoment && (
          <ChartPlot
            title="Diagrama de Momento Flector (M)"
            units={UNITS[unitSystem].moment}
            data={chartData.map(d => ({ x: d.x, y: d.moment }))}
            colorClass="stroke-sky-500 fill-sky-500/10"
            gradId="moment-grad"
            gradColor="#0ea5e9"
            hoveredIndex={hoveredIndex}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            hoveredValue={hoveredIndex !== null ? chartData[hoveredIndex].moment : null}
            hoveredX={hoveredIndex !== null ? chartData[hoveredIndex].x : null}
            invertY={true} // Bending moment is conventionally plotted downwards positive in engineering
          />
        )}

        {showStress && (
          <ChartPlot
            title="Diagrama de Esfuerzo Normal Flactor Crítico (σ)"
            units={UNITS[unitSystem].stress}
            data={chartData.map(d => ({ x: d.x, y: d.stress }))}
            colorClass="stroke-purple-500 fill-purple-500/10"
            gradId="stress-grad"
            gradColor="#a855f7"
            hoveredIndex={hoveredIndex}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            hoveredValue={hoveredIndex !== null ? chartData[hoveredIndex].stress : null}
            hoveredX={hoveredIndex !== null ? chartData[hoveredIndex].x : null}
          />
        )}

        {showStrain && (
          <ChartPlot
            title="Diagrama de Deformación Unitaria Bending Max (ε)"
            units=""
            isSci={true}
            data={chartData.map(d => ({ x: d.x, y: d.strain }))}
            colorClass="stroke-amber-500 fill-amber-500/10"
            gradId="strain-grad"
            gradColor="#f59e0b"
            hoveredIndex={hoveredIndex}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            hoveredValue={hoveredIndex !== null ? chartData[hoveredIndex].strain : null}
            hoveredX={hoveredIndex !== null ? chartData[hoveredIndex].x : null}
          />
        )}

        {showDeflection && (
          <ChartPlot
            title="Diagrama de Deflexión Elástica (Desplazamiento δ)"
            units={UNITS[unitSystem].deflection}
            data={chartData.map(d => ({ x: d.x, y: d.deflection }))}
            colorClass="stroke-emerald-500 fill-emerald-500/10"
            gradId="def-grad"
            gradColor="#10b981"
            hoveredIndex={hoveredIndex}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            hoveredValue={hoveredIndex !== null ? chartData[hoveredIndex].deflection : null}
            hoveredX={hoveredIndex !== null ? chartData[hoveredIndex].x : null}
            invertY={true} // Deflection is plotted positive downwards
          />
        )}

        {hasTorqueInResults && (
          <ChartPlot
            title="Diagrama de Momento Torsor (T)"
            units={UNITS[unitSystem].moment}
            data={chartData.map(d => ({ x: d.x, y: d.torque }))}
            colorClass="stroke-pink-500 fill-pink-500/10"
            gradId="torque-grad"
            gradColor="#ec4899"
            hoveredIndex={hoveredIndex}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            hoveredValue={hoveredIndex !== null ? chartData[hoveredIndex].torque : null}
            hoveredX={hoveredIndex !== null ? chartData[hoveredIndex].x : null}
          />
        )}

        {hasTorqueInResults && (
          <ChartPlot
            title="Diagrama de Esfuerzo Cortante de Torsión (τ)"
            units={UNITS[unitSystem].stress}
            data={chartData.map(d => ({ x: d.x, y: d.torsionalStress }))}
            colorClass="stroke-purple-600 fill-purple-600/10"
            gradId="torqstress-grad"
            gradColor="#9333ea"
            hoveredIndex={hoveredIndex}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            hoveredValue={hoveredIndex !== null ? chartData[hoveredIndex].torsionalStress : null}
            hoveredX={hoveredIndex !== null ? chartData[hoveredIndex].x : null}
          />
        )}
      </div>
    </div>
  );
}

// Inner Single Chart SVG renderer for high performance and styling precision
interface ChartPlotProps {
  title: string;
  units: string;
  data: { x: number; y: number }[];
  colorClass: string;
  gradId: string;
  gradColor: string;
  hoveredIndex: number | null;
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseLeave: () => void;
  hoveredValue: number | null;
  hoveredX: number | null;
  invertY?: boolean;
  isSci?: boolean;
}

function ChartPlot({
  title,
  units,
  data,
  colorClass,
  gradId,
  gradColor,
  hoveredIndex,
  onMouseMove,
  onMouseLeave,
  hoveredValue,
  hoveredX,
  invertY = false,
  isSci = false
}: ChartPlotProps) {
  const width = 600;
  const height = 90;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 12;
  const paddingBottom = 12;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find Min / Max y bounds
  let yVals = data.map(d => d.y);
  let maxY = Math.max(...yVals);
  let minY = Math.min(...yVals);

  // Buffer so curve doesn't clip boundaries
  if (Math.abs(maxY - minY) < 0.000001) {
    maxY = 1.0;
    minY = -1.0;
  } else {
    const diff = maxY - minY;
    maxY += diff * 0.1;
    minY -= diff * 0.1;
  }

  // If we invertY (like deflection positive downwards, or moment downwards positive)
  const mapYToSvg = (val: number) => {
    const ratio = (val - minY) / (maxY - minY);
    // standard is default: high values are top.
    // Inverted means high values are bottom.
    if (invertY) {
      return paddingTop + ratio * chartHeight;
    } else {
      return paddingTop + (1 - ratio) * chartHeight;
    }
  };

  const mapXToSvg = (val: number) => {
    const length = data[data.length - 1].x;
    const ratio = length > 0 ? val / length : 0;
    return paddingLeft + ratio * chartWidth;
  };

  // Build SVG Path points
  let pathD = "";
  let areaD = "";

  if (data.length > 0) {
    const startX = mapXToSvg(data[0].x);
    const startY = mapYToSvg(data[0].y);
    const zeroY = mapYToSvg(0);

    pathD = `M ${startX} ${startY}`;
    areaD = `M ${startX} ${zeroY} L ${startX} ${startY}`;

    for (let i = 1; i < data.length; i++) {
      const px = mapXToSvg(data[i].x);
      const py = mapYToSvg(data[i].y);
      pathD += ` L ${px} ${py}`;
      areaD += ` L ${px} ${py}`;
    }

    const endX = mapXToSvg(data[data.length - 1].x);
    areaD += ` L ${endX} ${zeroY} Z`;
  }

  const zeroLineY = mapYToSvg(0);

  // Format value
  const formatVal = (val: number) => {
    if (isSci) {
      return val.toExponential(2);
    }
    return val.toFixed(2);
  };

  return (
    <div className="w-full bg-[#0a101f] border border-[#16243f] rounded-lg p-2.5 relative">
      <div className="flex justify-between items-center mb-1 text-slate-400">
        <span className="text-[11.5px] font-semibold text-slate-300 font-sans tracking-wide">{title}</span>
        {hoveredValue !== null && hoveredX !== null && (
          <span className="text-[10px] font-mono bg-[#162744] border border-[#223964] px-1.5 py-0.5 rounded text-sky-400">
            x = <span className="font-bold text-slate-300">{hoveredX.toFixed(3)}{UNITS[unitSystem].length}</span>:{" "}
            <span className="font-bold text-emerald-400">{formatVal(hoveredValue)} {units}</span>
          </span>
        )}
      </div>

      <div className="w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[500px] aspect-[600/90]"
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          {/* Gradients */}
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={gradColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={gradColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Zero reference axis */}
          <line
            x1={paddingLeft}
            y1={zeroLineY}
            x2={width - paddingRight}
            y2={zeroLineY}
            stroke="#1b2a47"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* Left Y Axis label indicators (Peak and baseline) */}
          <text x={paddingLeft - 8} y={paddingTop + 4} className="fill-slate-500 font-mono text-[8px]" textAnchor="end">
            {invertY ? formatVal(minY) : formatVal(maxY)}
          </text>
          <text x={paddingLeft - 8} y={height - paddingBottom} className="fill-slate-500 font-mono text-[8px]" textAnchor="end">
            {invertY ? formatVal(maxY) : formatVal(minY)}
          </text>

          {/* Plotting area filled gradient */}
          {areaD && (
            <path d={areaD} fill={`url(#${gradId})`} />
          )}

          {/* Main curve stroke spline */}
          {pathD && (
            <path d={pathD} fill="none" className={colorClass} strokeWidth="1.8" />
          )}

          {/* Active hover crosshair cursor line */}
          {hoveredIndex !== null && (
            <g>
              <line
                x1={mapXToSvg(data[hoveredIndex].x)}
                y1={0}
                x2={mapXToSvg(data[hoveredIndex].x)}
                y2={height}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={mapXToSvg(data[hoveredIndex].x)}
                cy={mapYToSvg(data[hoveredIndex].y)}
                r="4.5"
                fill="#38bdf8"
                stroke="#0a101f"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Border bounding frame */}
          <rect
            x={paddingLeft}
            y={paddingTop}
            width={chartWidth}
            height={chartHeight}
            fill="transparent"
            stroke="#111c33"
            strokeWidth="1.2"
          />
        </svg>
      </div>
    </div>
  );
}
