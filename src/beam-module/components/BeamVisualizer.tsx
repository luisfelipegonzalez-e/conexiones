/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { Move, GripVertical, Settings, ChevronUp, Sliders } from "lucide-react";
import { BeamLoad, LoadType, SectionType, SupportType } from "../types";
import { UnitSystem, formatUnit, convert, toMetric, UNITS } from "../utils/units";

interface BeamVisualizerProps {
  length: number;
  loads: BeamLoad[];
  reactions: {
    ra: number;
    rb: number;
    rc?: number;
    rd?: number;
    ha?: number;
    hb?: number;
    hc?: number;
    hd?: number;
    ma?: number;
    mb?: number;
    mc?: number;
    md?: number;
    ta?: number;
    tb?: number;
    tc?: number;
    td?: number;
  };
  onUpdateLoadPosition: (id: string, newPos: number, newEnd?: number) => void;
  sectionType: SectionType;
  supportAPosition?: number;
  supportBPosition?: number;
  supportCPosition?: number;
  supportDPosition?: number;
  supportAType?: SupportType;
  supportBType?: SupportType;
  supportCType?: SupportType;
  supportDType?: SupportType;
  onUpdateSupportPosition?: (support: "A" | "B" | "C" | "D", newPos: number) => void;
  onUpdateSupportType?: (support: "A" | "B" | "C" | "D", newType: SupportType) => void;
  readOnly?: boolean;
  unitSystem?: UnitSystem;
}

export default function BeamVisualizer({
  length,
  loads,
  reactions,
  onUpdateLoadPosition,
  sectionType,
  supportAPosition = 0,
  supportBPosition = length,
  supportCPosition = length * 0.33,
  supportDPosition = length * 0.66,
  supportAType = SupportType.PINNED,
  supportBType = SupportType.ROLLER,
  supportCType = SupportType.FREE,
  supportDType = SupportType.FREE,
  onUpdateSupportPosition,
  onUpdateSupportType,
  readOnly = false,
  unitSystem = 'metric'
}: BeamVisualizerProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<"point" | "dist-start" | "dist-end" | "support-A" | "support-B" | "support-C" | "support-D" | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);

  // SVG parameters
  const paddingX = 60;
  const svgWidth = 720;
  const svgHeight = 220;
  const beamY = 110;
  const beamHeight = 14;
  const activeWidth = svgWidth - paddingX * 2; // 600px of span

  // Scale: pixels per meter
  const scale = length > 0 ? activeWidth / length : 1;

  // Convert meters to SVG X coordinate
  const toSvgX = (x: number) => {
    return paddingX + x * scale;
  };

  // Convert SVG X coordinate to meters
  const toMeters = (svgX: number) => {
    const rawVal = (svgX - paddingX) / scale;
    return Math.max(0, Math.min(length, parseFloat(rawVal.toFixed(3))));
  };

  // 1. Calculate top load label stagger levels to prevent overlapping
  const loadStaggerMap = React.useMemo(() => {
    const items = loads.map(load => {
      let x = 0;
      if (load.type === LoadType.POINT || load.type === LoadType.MOMENT || load.type === LoadType.TORQUE) {
        x = toSvgX(load.position);
      } else {
        x = toSvgX((load.start + load.end) / 2);
      }
      return { id: load.id, x };
    });

    // Sort by x coordinate
    const sorted = [...items].sort((a, b) => a.x - b.x);

    const stagger: Record<string, number> = {};
    const MIN_DISTANCE = 85; // px distance to trigger staggering for labels

    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      const usedStaggers = new Set<number>();
      for (let j = 0; j < i; j++) {
        const prev = sorted[j];
        if (Math.abs(cur.x - prev.x) < MIN_DISTANCE) {
          usedStaggers.add(stagger[prev.id]);
        }
      }
      // Find smallest unused integer >= 0
      let s = 0;
      while (usedStaggers.has(s)) {
        s++;
      }
      stagger[cur.id] = s;
    }
    return stagger;
  }, [loads, scale, length]);

  // 2. Calculate support designation/reactions stagger levels to prevent overlapping below the beam
  const supportStaggerMap = React.useMemo(() => {
    const activeSupports: { id: "A" | "B" | "C" | "D"; x: number }[] = [];
    if (supportAType !== SupportType.FREE) activeSupports.push({ id: "A", x: toSvgX(supportAPosition) });
    if (supportBType !== SupportType.FREE) activeSupports.push({ id: "B", x: toSvgX(supportBPosition) });
    if (supportCType !== SupportType.FREE) activeSupports.push({ id: "C", x: toSvgX(supportCPosition) });
    if (supportDType !== SupportType.FREE) activeSupports.push({ id: "D", x: toSvgX(supportDPosition) });

    // Sort by x coordinate
    const sorted = [...activeSupports].sort((a, b) => a.x - b.x);

    const stagger: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    const MIN_DISTANCE = 90; // px distance to trigger staggering for support boxes (width is 88px)

    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      const usedStaggers = new Set<number>();
      for (let j = 0; j < i; j++) {
        const prev = sorted[j];
        if (Math.abs(cur.x - prev.x) < MIN_DISTANCE) {
          usedStaggers.add(stagger[prev.id]);
        }
      }
      let s = 0;
      while (usedStaggers.has(s)) {
        s++;
      }
      stagger[cur.id] = s;
    }
    return stagger;
  }, [supportAType, supportBType, supportCType, supportDType, supportAPosition, supportBPosition, supportCPosition, supportDPosition, scale, length]);

  const handlePointerDown = (
    e: React.PointerEvent,
    id: string,
    type: "point" | "dist-start" | "dist-end" | "support-A" | "support-B" | "support-C" | "support-D"
  ) => {
    if (readOnly) return;
    e.stopPropagation();
    setActiveDragId(id);
    setDragType(type);

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const currentX = toSvgX(
        type === "support-A"
          ? supportAPosition
          : type === "support-B"
          ? supportBPosition
          : type === "support-C"
          ? supportCPosition
          : type === "support-D"
          ? supportDPosition
          : getCurrentPosition(id, type as any)
      );
      setDragOffset(pointerX - currentX);
    }
  };

  const getCurrentPosition = (id: string, type: "point" | "dist-start" | "dist-end") => {
    const load = loads.find(l => l.id === id);
    if (!load) return 0;
    if (load.type === LoadType.POINT || load.type === LoadType.MOMENT || load.type === LoadType.TORQUE) {
      return load.position;
    }
    if (load.type === LoadType.DISTRIBUTED || load.type === LoadType.TRIANGULAR) {
      if (type === "dist-start") return load.start;
      return load.end;
    }
    return 0;
  };

  // Drag listeners
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!activeDragId || !dragType || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left - dragOffset;
      const targetMeters = toMeters(rawX);

      // Support A Dragging
      if (dragType === "support-A") {
        if (onUpdateSupportPosition) {
          const maxAPos = Math.max(0, supportBPosition - 0.2);
          const newAPos = Math.min(targetMeters, maxAPos);
          onUpdateSupportPosition("A", newAPos);
        }
        return;
      }

      // Support B Dragging
      if (dragType === "support-B") {
        if (onUpdateSupportPosition) {
          const minBPos = Math.min(length, supportAPosition + 0.2);
          const newBPos = Math.max(targetMeters, minBPos);
          onUpdateSupportPosition("B", newBPos);
        }
        return;
      }

      // Support C Dragging
      if (dragType === "support-C") {
        if (onUpdateSupportPosition) {
          onUpdateSupportPosition("C", targetMeters);
        }
        return;
      }

      // Support D Dragging
      if (dragType === "support-D") {
        if (onUpdateSupportPosition) {
          onUpdateSupportPosition("D", targetMeters);
        }
        return;
      }

      // Load Dragging
      const load = loads.find(l => l.id === activeDragId);
      if (!load) return;

      if (load.type === LoadType.POINT || load.type === LoadType.MOMENT || load.type === LoadType.TORQUE) {
        onUpdateLoadPosition(activeDragId, targetMeters);
      } else if (load.type === LoadType.DISTRIBUTED || load.type === LoadType.TRIANGULAR) {
        if (dragType === "dist-start") {
          const newStart = Math.min(targetMeters, load.end - 0.1);
          onUpdateLoadPosition(activeDragId, newStart, load.end);
        } else {
          const newEnd = Math.max(targetMeters, load.start + 0.1);
          onUpdateLoadPosition(activeDragId, load.start, newEnd);
        }
      }
    };

    const handlePointerUp = () => {
      setActiveDragId(null);
      setDragType(null);
    };

    if (activeDragId) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeDragId, dragType, dragOffset, loads, supportAPosition, supportBPosition, supportCPosition, supportDPosition, length, onUpdateSupportPosition]);

  // Supports positions coordinates
  const leftSupportX = toSvgX(supportAPosition);
  const rightSupportX = toSvgX(supportBPosition);

  // Helper method for SVG Support rendering
  const renderSupportSvg = (type: SupportType, xPos: number, labelId: "A" | "B" | "C" | "D", isDragging: boolean, onDown: (e: React.PointerEvent) => void) => {
    const sX = toSvgX(xPos);
    const color = isDragging ? "#fbbf24" : "#3b82f6"; // Amber if dragging, bright blue if not
    const fillColor = isDragging ? "#112654" : "#1e3a8a";
    const s = supportStaggerMap[labelId] || 0;
    const yShift = s * 16;

    return (
      <g key={labelId} className="group">
        {/* Invisible broad pointer target for easy dragging */}
        {!readOnly && (
          <circle 
            cx={sX} 
            cy={beamY + 12} 
            r="18" 
            fill="transparent" 
            className="cursor-ew-resize" 
            onPointerDown={onDown}
          />
        )}

        {type === SupportType.PINNED && (
          <g className={readOnly ? "" : "cursor-ew-resize"} onPointerDown={readOnly ? undefined : onDown}>
            {/* Pinned support triangle */}
            <polygon
              points={`${sX},${beamY} ${sX - 12},${beamY + 18} ${sX + 12},${beamY + 18}`}
              fill={fillColor}
              stroke={color}
              strokeWidth="1.8"
              className="group-hover:stroke-amber-400 transition-colors"
            />
            {/* Connector circle */}
            <circle cx={sX} cy={beamY} r="3" fill="#0d1527" stroke={color} strokeWidth="1.8" className="group-hover:stroke-amber-400 transition-colors" />
            {/* Ground support block */}
            <rect
              x={sX - 18}
              y={beamY + 18}
              width="36"
              height="3"
              fill="#475569"
              stroke="#1e293b"
            />
            {/* Hatched lines for ground anchor */}
            <rect
              x={sX - 18}
              y={beamY + 21}
              width="36"
              height="6"
              fill="url(#ground-hatch)"
            />
          </g>
        )}

        {type === SupportType.ROLLER && (
          <g className={readOnly ? "" : "cursor-ew-resize"} onPointerDown={readOnly ? undefined : onDown}>
            {/* Roller main frame triangle */}
            <polygon
              points={`${sX},${beamY} ${sX - 10},${beamY + 14} ${sX + 10},${beamY + 14}`}
              fill={fillColor}
              stroke={color}
              strokeWidth="1.8"
              className="group-hover:stroke-amber-400 transition-colors"
            />
            {/* Connection Pin */}
            <circle cx={sX} cy={beamY} r="3" fill="#0d1527" stroke={color} strokeWidth="1.8" className="group-hover:stroke-amber-400 transition-colors" />
            {/* Little roller circles at base */}
            <circle cx={sX - 6} cy={beamY + 16} r="2.5" fill={color} className="group-hover:fill-amber-400 transition-colors" />
            <circle cx={sX} cy={beamY + 16} r="2.5" fill={color} className="group-hover:fill-amber-400 transition-colors" />
            <circle cx={sX + 6} cy={beamY + 16} r="2.5" fill={color} className="group-hover:fill-amber-400 transition-colors" />
            {/* Ground support plate */}
            <rect
              x={sX - 15}
              y={beamY + 19}
              width="30"
              height="3"
              fill="#475569"
            />
            {/* Hatched lines for ground anchor */}
            <rect
              x={sX - 15}
              y={beamY + 22}
              width="30"
              height="6"
              fill="url(#ground-hatch)"
            />
          </g>
        )}

        {type === SupportType.FIXED && (
          <g className={readOnly ? "" : "cursor-ew-resize"} onPointerDown={readOnly ? undefined : onDown}>
            {/* Fixed Wall background */}
            <rect
              x={sX - 5}
              y={beamY - 18}
              width="10"
              height="36"
              fill={fillColor}
              stroke={color}
              strokeWidth="1.8"
              className="group-hover:stroke-amber-400 transition-colors"
            />
            {/* Connection Pin or anchor */}
            <circle cx={sX} cy={beamY} r="3" fill="#0d1527" stroke={color} strokeWidth="1.8" />
            {/* Hatched lines on wall support */}
            <line x1={sX - 5} y1={beamY - 12} x2={sX + 5} y2={beamY - 7} stroke={color} strokeWidth="1" />
            <line x1={sX - 5} y1={beamY - 4} x2={sX + 5} y2={beamY + 1} stroke={color} strokeWidth="1" />
            <line x1={sX - 5} y1={beamY + 4} x2={sX + 5} y2={beamY + 9} stroke={color} strokeWidth="1" />
            <line x1={sX - 5} y1={beamY + 12} x2={sX + 5} y2={beamY + 17} stroke={color} strokeWidth="1" />
          </g>
        )}

        {type === SupportType.GUIDED && (
          <g className={readOnly ? "" : "cursor-ew-resize"} onPointerDown={readOnly ? undefined : onDown}>
            {/* Guided sleeve bracket */}
            <rect
              x={sX - 10}
              y={beamY - 16}
              width="20"
              height="32"
              fill="none"
              stroke={color}
              strokeWidth="1.8"
              className="group-hover:stroke-amber-400 transition-colors"
            />
            {/* Guide guide line */}
            <line x1={sX - 15} y1={beamY} x2={sX + 15} y2={beamY} stroke={color} strokeWidth="1" strokeDasharray="2 2" />
            <circle cx={sX} cy={beamY} r="3" fill="#0d1527" stroke={color} strokeWidth="1.8" />
            {/* sleeve rollers */}
            <circle cx={sX - 10} cy={beamY - 8} r="2.5" fill={color} />
            <circle cx={sX - 10} cy={beamY + 8} r="2.5" fill={color} />
            <circle cx={sX + 10} cy={beamY - 8} r="2.5" fill={color} />
            <circle cx={sX + 10} cy={beamY + 8} r="2.5" fill={color} />
          </g>
        )}

        {type === SupportType.FREE && (
          <g className={readOnly ? "opacity-60" : "cursor-ew-resize opacity-60 hover:opacity-100"} onPointerDown={readOnly ? undefined : onDown}>
            {/* Subtle dashed ring for free end drag point */}
            <circle
              cx={sX}
              cy={beamY}
              r="10"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="group-hover:stroke-amber-450 transition-all"
            />
            <text
              x={sX}
              y={beamY + 3.5}
              className="fill-[#475569] text-[9px] font-black pointer-events-none text-center"
              textAnchor="middle"
            >
              ∅
            </text>
          </g>
        )}

        {/* Label indicator for support */}
        <g className="pointer-events-none">
          {s > 0 && (
            <line
              x1={sX}
              y1={beamY + 18}
              x2={sX}
              y2={beamY + 22 + yShift}
              stroke="#475569"
              strokeWidth="0.8"
              strokeDasharray="1.5 1.5"
              opacity="0.7"
            />
          )}
          <rect
            x={sX - 44}
            y={beamY + 22 + yShift}
            width="88"
            height="12"
            fill="#0f172a"
            opacity="0.95"
            rx="3"
            stroke={isDragging ? "#fbbf24" : "#1e293b"}
            strokeWidth="0.8"
          />
          <text
            x={sX}
            y={beamY + 31 + yShift}
            className="fill-slate-300 font-mono text-[8.5px] font-bold text-center"
            textAnchor="middle"
          >
            Apoyo {labelId}: {xPos.toFixed(2)}m
          </text>
        </g>
      </g>
    );
  };

  return (
    <div className={readOnly ? "w-full bg-[#0a0f1d]/40 border border-[#182645]/60 rounded-xl p-4 relative overflow-hidden select-none print:bg-white print:border-slate-300 print:text-black" : "w-full bg-[#0d1527] border border-[#1b2a47] rounded-xl p-5 shadow-2xl relative overflow-hidden select-none"}>
      {/* Header controls inside representation area */}
      {!readOnly && (
        <div className="flex items-center justify-between border-b border-[#1b2a47] pb-3 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-300 font-sans tracking-wide uppercase">Vista de Viga (CAD 2D)</span>
          </div>
          <div className="flex items-center gap-4">
            {supportAType !== SupportType.FREE && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="text-slate-500 font-mono">Apoyo A:</span>
                <span className="bg-[#152342] border border-[#21396a] px-1.5 py-0.5 rounded text-sky-400 font-bold">{supportAType}</span>
              </div>
            )}
            {supportBType !== SupportType.FREE && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="text-slate-500 font-mono">Apoyo B:</span>
                <span className="bg-[#152342] border border-[#21396a] px-1.5 py-0.5 rounded text-sky-400 font-bold">{supportBType}</span>
              </div>
            )}
            {supportCType !== SupportType.FREE && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="text-slate-500 font-mono">Apoyo C:</span>
                <span className="bg-[#152342] border border-[#21396a] px-1.5 py-0.5 rounded text-sky-400 font-bold">{supportCType}</span>
              </div>
            )}
            {supportDType !== SupportType.FREE && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="text-slate-500 font-mono">Apoyo D:</span>
                <span className="bg-[#152342] border border-[#21396a] px-1.5 py-0.5 rounded text-sky-400 font-bold">{supportDType}</span>
              </div>
            )}
            <div className="text-[11px] text-slate-400">
              <span className="text-slate-500 font-mono">Unidades:</span>
              <span className="bg-[#152342] border border-[#21396a] px-1.5 py-0.5 rounded text-sky-400 font-mono">SI (m, kN)</span>
            </div>
          </div>
        </div>
      )}

      {/* Support selectors grid panel */}
      {!readOnly && (() => {
        const activeSupportsList: {
          id: "A" | "B" | "C" | "D";
          name: string;
          type: SupportType;
          position: number;
          colorClass: string;
        }[] = [];

        if (supportAType !== SupportType.FREE) {
          activeSupportsList.push({
            id: "A",
            name: "Apoyo A (Izquierdo)",
            type: supportAType,
            position: supportAPosition,
            colorClass: "bg-blue-500",
          });
        }
        if (supportBType !== SupportType.FREE) {
          activeSupportsList.push({
            id: "B",
            name: "Apoyo B (Derecho)",
            type: supportBType,
            position: supportBPosition,
            colorClass: "bg-indigo-500",
          });
        }
        if (supportCType !== SupportType.FREE) {
          activeSupportsList.push({
            id: "C",
            name: "Apoyo C",
            type: supportCType,
            position: supportCPosition,
            colorClass: "bg-pink-500",
          });
        }
        if (supportDType !== SupportType.FREE) {
          activeSupportsList.push({
            id: "D",
            name: "Apoyo D",
            type: supportDType,
            position: supportDPosition,
            colorClass: "bg-emerald-500",
          });
        }

        if (activeSupportsList.length === 0) return null;

        const colsClass = activeSupportsList.length === 1
          ? "md:grid-cols-1"
          : activeSupportsList.length === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : activeSupportsList.length === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4";

        return (
          <div className={`grid grid-cols-1 ${colsClass} gap-3 mb-4 bg-[#0a101f] p-3 rounded-lg border border-[#1b2a47]`}>
            {activeSupportsList.map((sup) => (
              <div key={sup.id} className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-slate-300 font-bold flex items-center gap-1 truncate">
                    <span className={`w-2 h-2 rounded-full ${sup.colorClass} ${sup.id === "A" ? "animate-pulse" : ""} shrink-0`}></span> {sup.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold bg-[#111c34] px-1.5 py-0.2 rounded border border-[#20345d] shrink-0">x = {sup.position.toFixed(2)}m</span>
                </div>
                <div className="flex gap-2 items-center">
                  <select
                    value={sup.type}
                    onChange={(e) => onUpdateSupportType && onUpdateSupportType(sup.id, e.target.value as SupportType)}
                    className="flex-1 min-w-0 bg-[#0b101c] border border-[#1e2a47] text-slate-300 rounded p-1.5 outline-none focus:border-blue-500 font-semibold cursor-pointer text-[11px] truncate"
                  >
                    <option value={SupportType.PINNED}>▲ Articulado (Pinned)</option>
                    <option value={SupportType.ROLLER}>⚪ Rodillo (Roller)</option>
                    <option value={SupportType.FIXED}>▉ Empotrado (Fixed)</option>
                    <option value={SupportType.GUIDED}>⇳ Guiado (Guided)</option>
                    <option value={SupportType.FREE}>░ Libre (Free)</option>
                  </select>
                  <div className="flex items-center gap-1 bg-[#0b101c] border border-[#1e2a47] rounded px-1.5 py-1 focus-within:border-blue-500 shrink-0">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max={length.toFixed(2)}
                      value={parseFloat(sup.position.toFixed(3))}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const securePos = Math.min(length, Math.max(0, val));
                        onUpdateSupportPosition && onUpdateSupportPosition(sup.id, securePos);
                      }}
                      className="w-12 bg-transparent text-slate-300 font-mono text-center text-[11px] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      title={`Posición de Apoyo ${sup.id}`}
                    />
                    <span className="text-slate-500 text-[10px] font-mono select-none">m</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto overflow-y-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[650px] aspect-[720/220]"
        >
          {/* Grid lines for coordinate guides */}
          <line x1={0} y1={beamY} x2={svgWidth} y2={beamY} stroke="#172642" strokeDasharray="3 3" />
          
          {/* Vertical grid lines at major intervals mapped to the top (y = 12) to avoid any collision below */}
          {Array.from({ length: 6 }).map((_, idx) => {
            const mVal = (length / 5) * idx;
            const xCoord = toSvgX(mVal);
            return (
              <g key={idx}>
                <line x1={xCoord} y1={18} x2={xCoord} y2={beamY + 36} stroke="#152445" strokeWidth="0.8" strokeDasharray="2 3" />
                <text
                  x={xCoord}
                  y={12}
                  className="fill-slate-500 font-mono text-[9px] text-center"
                  textAnchor="middle"
                >
                  {mVal.toFixed(2)}m
                </text>
              </g>
            );
          })}

          {/* Span Dimension Line: Relocated to the absolute bottom of the canvas (y = beamY + 98 = 208) to completely avoid overlapping supports, reactions and grid */}
          <g>
            <line x1={leftSupportX} y1={beamY + 98} x2={rightSupportX} y2={beamY + 98} stroke="#384f7e" strokeWidth="1" />
            <polygon points={`${leftSupportX},${beamY + 98} ${leftSupportX + 6},${beamY + 95} ${leftSupportX + 6},${beamY + 101}`} fill="#384f7e" />
            <polygon points={`${rightSupportX},${beamY + 98} ${rightSupportX - 6},${beamY + 95} ${rightSupportX - 6},${beamY + 101}`} fill="#384f7e" />
            <rect x={(leftSupportX + rightSupportX) / 2 - 32} y={beamY + 90} width={64} height={15} fill="#0d1527" rx={3} stroke="#384f7e" strokeWidth="0.5" />
            <text x={(leftSupportX + rightSupportX) / 2} y={beamY + 101} className="fill-slate-300 font-mono text-[9px] font-bold" textAnchor="middle">
              Luz: {formatUnit(supportBPosition - supportAPosition, 'length', unitSystem!)}
            </text>
          </g>

          {/* Gradients */}
          <defs>
            <linearGradient id="teal-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sky-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="beam-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <pattern id="ground-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#1e293b" strokeWidth="2" />
            </pattern>
          </defs>

          {/* THE BEAM RECTANGLE (Metallic structural look) */}
          <rect
            x={toSvgX(0)}
            y={beamY - beamHeight / 2}
            width={activeWidth}
            height={beamHeight}
            fill="url(#beam-grad)"
            rx="2"
            stroke="#1e293b"
            strokeWidth="1.5"
            className="shadow-xl"
          />

          {/* Support A rendering */}
          {supportAType !== SupportType.FREE && renderSupportSvg(supportAType, supportAPosition, "A", activeDragId === "A", (e) => handlePointerDown(e, "A", "support-A"))}

          {/* Support B rendering */}
          {supportBType !== SupportType.FREE && renderSupportSvg(supportBType, supportBPosition, "B", activeDragId === "B", (e) => handlePointerDown(e, "B", "support-B"))}

          {/* Support C rendering */}
          {supportCType !== SupportType.FREE && renderSupportSvg(supportCType, supportCPosition, "C", activeDragId === "C", (e) => handlePointerDown(e, "C", "support-C"))}

          {/* Support D rendering */}
          {supportDType !== SupportType.FREE && renderSupportSvg(supportDType, supportDPosition, "D", activeDragId === "D", (e) => handlePointerDown(e, "D", "support-D"))}

          {/* Point Loads and Drag Handles */}
          {loads.map((load) => {
            if (load.type !== LoadType.POINT) return null;
            const loadX = toSvgX(load.position);
            const isDragging = activeDragId === load.id;

            return (
              <g key={load.id} className="group">
                {/* Visual Down-Arrow (Red) */}
                <line
                  x1={loadX}
                  y1={beamY - 60}
                  x2={loadX}
                  y2={beamY - 4}
                  stroke={isDragging ? "#ff4d4d" : "#ef4444"}
                  strokeWidth="2.5"
                  className="transition-colors duration-200"
                />
                <polygon
                  points={`${loadX},${beamY - 2} ${loadX - 5},${beamY - 12} ${loadX + 5},${beamY - 12}`}
                  fill={isDragging ? "#ff4d4d" : "#ef4444"}
                />

                {/* Staggered Magnitude & Position Labels with Leader Guidelines */}
                {(() => {
                  const s = loadStaggerMap[load.id] || 0;
                  const yShift = s * 24;
                  return (
                    <g>
                      {s > 0 && (
                        <line
                          x1={loadX}
                          y1={beamY - 60}
                          x2={loadX}
                          y2={beamY - 64 - yShift}
                          stroke="#ef4444"
                          strokeWidth="0.8"
                          strokeDasharray="1.5 1.5"
                          opacity="0.6"
                        />
                      )}
                      <text
                        x={loadX}
                        y={beamY - 68 - yShift}
                        className="fill-red-400 font-mono text-[11px] font-bold"
                        textAnchor="middle"
                      >
                        {formatUnit(load.magnitude, 'force', unitSystem!, 2)}
                      </text>
                      <text
                        x={loadX}
                        y={beamY - 80 - yShift}
                        className="fill-slate-400 font-mono text-[8.5px]"
                        textAnchor="middle"
                      >
                        x = {load.position.toFixed(2)}m
                      </text>
                    </g>
                  );
                })()}

                {/* Drag Handle Indicator */}
                {!readOnly && (
                  <>
                    <circle
                      cx={loadX}
                      cy={beamY}
                      r={6}
                      fill="#ef4444"
                      className="cursor-ew-resize group-hover:scale-125 transition-transform duration-200 shadow-lg"
                      onPointerDown={(e) => handlePointerDown(e, load.id, "point")}
                    />
                    <circle
                      cx={loadX}
                      cy={beamY}
                      r={12}
                      fill="transparent"
                      className="cursor-ew-resize"
                      onPointerDown={(e) => handlePointerDown(e, load.id, "point")}
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* Moment Loads and Drag Handles */}
          {loads.map((load) => {
            if (load.type !== LoadType.MOMENT) return null;
            const loadX = toSvgX(load.position);
            const isDragging = activeDragId === load.id;
            const isClockwise = load.magnitude >= 0;

            // Geometry for the 270° wrap-around arc, using the center axis of the beam as the pivot point
            const centerY = beamY;
            const r = 15;
            const startDegrees = isClockwise ? -45 : 225;
            const endDegrees = isClockwise ? 225 : -45;

            const startRad = (startDegrees * Math.PI) / 180;
            const endRad = (endDegrees * Math.PI) / 180;
            const x1 = loadX + r * Math.cos(startRad);
            const y1 = centerY + r * Math.sin(startRad);
            const x2 = loadX + r * Math.cos(endRad);
            const y2 = centerY + r * Math.sin(endRad);
            const sweepFlag = isClockwise ? 1 : 0;

            const tx = isClockwise ? -Math.sin(endRad) : Math.sin(endRad);
            const ty = isClockwise ? Math.cos(endRad) : -Math.cos(endRad);
            const nx = -ty;
            const ny = tx;

            const arrowLen = 5.5;
            const arrowWid = 3.5;
            const wing1X = x2 - tx * arrowLen + nx * arrowWid;
            const wing1Y = y2 - ty * arrowLen + ny * arrowWid;
            const wing2X = x2 - tx * arrowLen - nx * arrowWid;
            const wing2Y = y2 - ty * arrowLen - ny * arrowWid;

            const strokeColor = isDragging ? "#fbbf24" : "#f59e0b";

            return (
              <g key={load.id} className="group">
                {/* Center dot/pivot on the beam neutral axis as shown in the hand-drawn sketch */}
                <circle
                  cx={loadX}
                  cy={beamY}
                  r={2.5}
                  fill={strokeColor}
                  className="transition-colors duration-200"
                />

                {/* Visual Circular Bending Moment Arrow (Amber/Orange) - Centered directly on the beam and overlapping it */}
                <path
                  d={`M ${x1} ${y1} A ${r} ${r} 0 1 ${sweepFlag} ${x2} ${y2}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  className="transition-colors duration-200"
                />
                <polygon
                  points={`${x2},${y2} ${wing1X},${wing1Y} ${wing2X},${wing2Y}`}
                  fill={strokeColor}
                  className="transition-colors duration-200"
                />

                {/* Staggered Magnitude & Position Labels with Leader Guidelines (As close as possible to the curve) */}
                {(() => {
                  const s = loadStaggerMap[load.id] || 0;
                  const yShift = s * 24;
                  return (
                    <g>
                      {s > 0 && (
                        <line
                          x1={loadX}
                          y1={centerY - r - 2}
                          x2={loadX}
                          y2={centerY - r - 18 - yShift}
                          stroke="#f59e0b"
                          strokeWidth="0.8"
                          strokeDasharray="1.5 1.5"
                          opacity="0.6"
                        />
                      )}
                      <text
                        x={loadX}
                        y={centerY - r - 4 - yShift}
                        className="fill-amber-400 font-mono text-[11px] font-bold"
                        textAnchor="middle"
                      >
                        {formatUnit(load.magnitude, 'moment', unitSystem!, 2)}
                      </text>
                      <text
                        x={loadX}
                        y={centerY - r - 13 - yShift}
                        className="fill-slate-400 font-mono text-[8.5px]"
                        textAnchor="middle"
                      >
                        x = {load.position.toFixed(2)}m
                      </text>
                    </g>
                  );
                })()}

                {/* Drag Handle Indicator */}
                {!readOnly && (
                  <>
                    <circle
                      cx={loadX}
                      cy={beamY}
                      r={6}
                      fill="#f59e0b"
                      className="cursor-ew-resize group-hover:scale-125 transition-transform duration-200 shadow-lg"
                      onPointerDown={(e) => handlePointerDown(e, load.id, "point")}
                    />
                    <circle
                      cx={loadX}
                      cy={beamY}
                      r={12}
                      fill="transparent"
                      className="cursor-ew-resize"
                      onPointerDown={(e) => handlePointerDown(e, load.id, "point")}
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* Torque Loads and Drag Handles */}
          {loads.map((load) => {
            if (load.type !== LoadType.TORQUE) return null;
            const loadX = toSvgX(load.position);
            const isDragging = activeDragId === load.id;
            const isClockwise = load.magnitude >= 0;

            // Concentric Geometry 1: Outer Arc (r1 = 16), concentric on the center axis of the beam
            const centerY = beamY;
            const r1 = 16;
            const startDegrees1 = isClockwise ? -45 : 225;
            const endDegrees1 = isClockwise ? 225 : -45;

            const startRad1 = (startDegrees1 * Math.PI) / 180;
            const endRad1 = (endDegrees1 * Math.PI) / 180;
            const ox1 = loadX + r1 * Math.cos(startRad1);
            const oy1 = centerY + r1 * Math.sin(startRad1);
            const ox2 = loadX + r1 * Math.cos(endRad1);
            const oy2 = centerY + r1 * Math.sin(endRad1);
            const sweepFlag1 = isClockwise ? 1 : 0;

            const tx1 = isClockwise ? -Math.sin(endRad1) : Math.sin(endRad1);
            const ty1 = isClockwise ? Math.cos(endRad1) : -Math.cos(endRad1);
            const nx1 = -ty1;
            const ny1 = tx1;

            const arrowLen1 = 5.0;
            const arrowWid1 = 3.2;
            const oWing1X = ox2 - tx1 * arrowLen1 + nx1 * arrowWid1;
            const oWing1Y = oy2 - ty1 * arrowLen1 + ny1 * arrowWid1;
            const oWing2X = ox2 - tx1 * arrowLen1 - nx1 * arrowWid1;
            const oWing2Y = oy2 - ty1 * arrowLen1 - ny1 * arrowWid1;

            // Concentric Geometry 2: Inner Arc (r2 = 10)
            const r2 = 10;
            const ix1 = loadX + r2 * Math.cos(startRad1);
            const iy1 = centerY + r2 * Math.sin(startRad1);
            const ix2 = loadX + r2 * Math.cos(endRad1);
            const iy2 = centerY + r2 * Math.sin(endRad1);

            const tx2 = isClockwise ? -Math.sin(endRad1) : Math.sin(endRad1);
            const ty2 = isClockwise ? Math.cos(endRad1) : -Math.cos(endRad1);
            const nx2 = -ty2;
            const ny2 = tx2;

            const iWing1X = ix2 - tx2 * arrowLen1 + nx2 * arrowWid1;
            const iWing1Y = iy2 - ty2 * arrowLen1 + ny2 * arrowWid1;
            const iWing2X = ix2 - tx2 * arrowLen1 - nx2 * arrowWid1;
            const iWing2Y = iy2 - ty2 * arrowLen1 - ny2 * arrowWid1;

            const strokeColor = isDragging ? "#f472b6" : "#d946ef";

            return (
              <g key={load.id} className="group">
                {/* Central twist dot/axis at center of the beam */}
                <circle
                  cx={loadX}
                  cy={beamY}
                  r={2.5}
                  fill={strokeColor}
                  className="transition-colors duration-200"
                />

                {/* Inner Arc (Dashed/Segmented for torque feel) */}
                <path
                  d={`M ${ix1} ${iy1} A ${r2} ${r2} 0 1 ${sweepFlag1} ${ix2} ${iy2}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="1.8"
                  strokeDasharray="2 1.5"
                  className="transition-colors duration-200"
                />
                <polygon
                  points={`${ix2},${iy2} ${iWing1X},${iWing1Y} ${iWing2X},${iWing2Y}`}
                  fill={strokeColor}
                  className="transition-colors duration-200"
                />

                {/* Outer Arc (Solid) */}
                <path
                  d={`M ${ox1} ${oy1} A ${r1} ${r1} 0 1 ${sweepFlag1} ${ox2} ${oy2}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  className="transition-colors duration-200"
                />
                <polygon
                  points={`${ox2},${oy2} ${oWing1X},${oWing1Y} ${oWing2X},${oWing2Y}`}
                  fill={strokeColor}
                  className="transition-colors duration-200"
                />

                {/* Staggered Magnitude & Position Labels with Leader Guidelines (As close as possible to the curve) */}
                {(() => {
                  const s = loadStaggerMap[load.id] || 0;
                  const yShift = s * 24;
                  return (
                    <g>
                      {s > 0 && (
                        <line
                          x1={loadX}
                          y1={centerY - r1 - 2}
                          x2={loadX}
                          y2={centerY - r1 - 18 - yShift}
                          stroke="#d946ef"
                          strokeWidth="0.8"
                          strokeDasharray="1.5 1.5"
                          opacity="0.6"
                        />
                      )}
                      <text
                        x={loadX}
                        y={centerY - r1 - 4 - yShift}
                        className="fill-pink-400 font-mono text-[11px] font-bold"
                        textAnchor="middle"
                      >
                        {formatUnit(load.magnitude, 'moment', unitSystem!, 2)} (T)
                      </text>
                      <text
                        x={loadX}
                        y={centerY - r1 - 13 - yShift}
                        className="fill-slate-400 font-mono text-[8.5px]"
                        textAnchor="middle"
                      >
                        x = {load.position.toFixed(2)}m
                      </text>
                    </g>
                  );
                })()}

                {/* Drag Handle Indicator */}
                {!readOnly && (
                  <>
                    <circle
                      cx={loadX}
                      cy={beamY}
                      r={6}
                      fill="#d946ef"
                      className="cursor-ew-resize group-hover:scale-125 transition-transform duration-200 shadow-lg"
                      onPointerDown={(e) => handlePointerDown(e, load.id, "point")}
                    />
                    <circle
                      cx={loadX}
                      cy={beamY}
                      r={12}
                      fill="transparent"
                      className="cursor-ew-resize"
                      onPointerDown={(e) => handlePointerDown(e, load.id, "point")}
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* Distributed Loads and Drag Handles */}
          {loads.map((load) => {
            if (load.type !== LoadType.DISTRIBUTED) return null;
            const startX = toSvgX(load.start);
            const endX = toSvgX(load.end);
            const distWidth = endX - startX;
            const isDragging = activeDragId === load.id;

            if (distWidth <= 5) return null;

            // Generate small distribution arrows
            const arrowCount = Math.max(3, Math.min(12, Math.floor(distWidth / 25)));
            const arrows = Array.from({ length: arrowCount }).map((_, idx) => {
               const xPos = startX + (distWidth / (arrowCount - 1)) * idx;
               return (
                 <g key={idx}>
                   <line
                     x1={xPos}
                     y1={beamY - 34}
                     x2={xPos}
                     y2={beamY - 4}
                     stroke="#14b8a6"
                     strokeWidth="1.2"
                   />
                   <polygon
                     points={`${xPos},${beamY - 2} ${xPos - 3},${beamY - 8} ${xPos + 3},${beamY - 8}`}
                     fill="#14b8a6"
                   />
                 </g>
               );
            });

            return (
              <g key={load.id} className="group">
                {/* Horizontal cap for distributed load block */}
                <line
                  x1={startX}
                  y1={beamY - 34}
                  x2={endX}
                  y2={beamY - 34}
                  stroke="#14b8a6"
                  strokeWidth="2.5"
                />

                {/* Backdrop semi-transparent block */}
                <rect
                  x={startX}
                  y={beamY - 34}
                  width={distWidth}
                  height={34}
                  fill="url(#teal-grad)"
                  opacity="0.15"
                />

                {/* Visual arrows inside */}
                {arrows}

                {/* Staggered Magnitude & Position Labels with Leader Guidelines */}
                {(() => {
                  const s = loadStaggerMap[load.id] || 0;
                  const yShift = s * 24;
                  const centerX = (startX + endX) / 2;
                  return (
                    <g>
                      {s > 0 && (
                        <line
                          x1={centerX}
                          y1={beamY - 34}
                          x2={centerX}
                          y2={beamY - 38 - yShift}
                          stroke="#14b8a6"
                          strokeWidth="0.8"
                          strokeDasharray="1.5 1.5"
                          opacity="0.6"
                        />
                      )}
                      <text
                        x={centerX}
                        y={beamY - 42 - yShift}
                        className="fill-teal-400 font-mono text-[10px] font-bold"
                        textAnchor="middle"
                      >
                        {formatUnit(load.magnitude, 'distLoad', unitSystem!, 2)}
                      </text>
                      <text
                        x={centerX}
                        y={beamY - 54 - yShift}
                        className="fill-slate-400 font-mono text-[8.5px]"
                        textAnchor="middle"
                      >
                        {load.start.toFixed(2)}m - {load.end.toFixed(2)}m
                      </text>
                    </g>
                  );
                })()}

                {/* Start/End Drag Handles (Teal) */}
                {!readOnly && (
                  <>
                    {/* Start Drag Handle (Teal) */}
                    <g>
                      <circle
                        cx={startX}
                        cy={beamY}
                        r={5}
                        fill="#14b8a6"
                        className="cursor-ew-resize hover:scale-125 transition-transform"
                        onPointerDown={(e) => handlePointerDown(e, load.id, "dist-start")}
                      />
                      <circle
                        cx={startX}
                        cy={beamY}
                        r={12}
                        fill="transparent"
                        className="cursor-ew-resize"
                        onPointerDown={(e) => handlePointerDown(e, load.id, "dist-start")}
                      />
                    </g>

                    {/* End Drag Handle (Teal) */}
                    <g>
                      <circle
                        cx={endX}
                        cy={beamY}
                        r={5}
                        fill="#14b8a6"
                        className="cursor-ew-resize hover:scale-125 transition-transform"
                        onPointerDown={(e) => handlePointerDown(e, load.id, "dist-end")}
                      />
                      <circle
                        cx={endX}
                        cy={beamY}
                        r={12}
                        fill="transparent"
                        className="cursor-ew-resize"
                        onPointerDown={(e) => handlePointerDown(e, load.id, "dist-end")}
                      />
                    </g>
                  </>
                )}
              </g>
            );
          })}

          {/* Triangular Loads and Drag Handles */}
          {loads.map((load) => {
            if (load.type !== LoadType.TRIANGULAR) return null;
            const startX = toSvgX(load.start);
            const endX = toSvgX(load.end);
            const distWidth = endX - startX;
            const isDragging = activeDragId === load.id;

            if (distWidth <= 5) return null;

            // clamp scaled heights
            const startHeight = Math.min(45, (load.magnitudeStart / 20) * 35);
            const endHeight = Math.min(45, (load.magnitudeEnd / 20) * 35);

            // Generate small distribution arrows
            const arrowCount = Math.max(3, Math.min(12, Math.floor(distWidth / 25)));
            const arrows = Array.from({ length: arrowCount }).map((_, idx) => {
              const ratio = arrowCount > 1 ? idx / (arrowCount - 1) : 0;
              const xPos = startX + ratio * distWidth;
              const currentHeight = startHeight + ratio * (endHeight - startHeight);
              return (
                <g key={idx}>
                  <line
                    x1={xPos}
                    y1={beamY - currentHeight}
                    x2={xPos}
                    y2={beamY - 4}
                    stroke="#0ea5e9"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points={`${xPos},${beamY - 2} ${xPos - 3},${beamY - 8} ${xPos + 3},${beamY - 8}`}
                    fill="#0ea5e9"
                  />
                </g>
              );
            });

            return (
              <g key={load.id} className="group">
                {/* Sloped cap line for triangular load block */}
                <line
                  x1={startX}
                  y1={beamY - startHeight}
                  x2={endX}
                  y2={beamY - endHeight}
                  stroke="#0ea5e9"
                  strokeWidth="2.5"
                />

                {/* Backdrop semi-transparent block */}
                <polygon
                  points={`${startX},${beamY} ${startX},${beamY - startHeight} ${endX},${beamY - endHeight} ${endX},${beamY}`}
                  fill="url(#sky-grad)"
                  opacity="0.15"
                />

                {/* Visual arrows inside */}
                {arrows}

                {/* Staggered Magnitude & Position Labels with Leader Guidelines */}
                {(() => {
                  const s = loadStaggerMap[load.id] || 0;
                  const yShift = s * 24;
                  const hMax = Math.max(startHeight, endHeight);
                  const hMid = (startHeight + endHeight) / 2;
                  const centerX = (startX + endX) / 2;
                  return (
                    <g>
                      {s > 0 && (
                        <line
                          x1={centerX}
                          y1={beamY - hMid}
                          x2={centerX}
                          y2={beamY - hMax - 4 - yShift}
                          stroke="#0ea5e9"
                          strokeWidth="0.8"
                          strokeDasharray="1.5 1.5"
                          opacity="0.6"
                        />
                      )}
                      <text
                        x={centerX}
                        y={beamY - hMax - 8 - yShift}
                        className="fill-sky-400 font-mono text-[9px] font-bold"
                        textAnchor="middle"
                      >
                        w₁: {formatUnit(load.magnitudeStart, 'distLoad', unitSystem!, 2)} | w₂: {formatUnit(load.magnitudeEnd, 'distLoad', unitSystem!, 2)}
                      </text>
                      <text
                        x={centerX}
                        y={beamY - hMax - 18 - yShift}
                        className="fill-slate-400 font-mono text-[8.5px]"
                        textAnchor="middle"
                      >
                        {load.start.toFixed(2)}m - {load.end.toFixed(2)}m
                      </text>
                    </g>
                  );
                })()}

                {/* Start/End Drag Handles (Sky) */}
                {!readOnly && (
                  <>
                    {/* Start Drag Handle (Sky) */}
                    <g>
                      <circle
                        cx={startX}
                        cy={beamY}
                        r={5}
                        fill="#0ea5e9"
                        className="cursor-ew-resize hover:scale-125 transition-transform"
                        onPointerDown={(e) => handlePointerDown(e, load.id, "dist-start")}
                      />
                      <circle
                        cx={startX}
                        cy={beamY}
                        r={12}
                        fill="transparent"
                        className="cursor-ew-resize"
                        onPointerDown={(e) => handlePointerDown(e, load.id, "dist-start")}
                      />
                    </g>

                    {/* End Drag Handle (Sky) */}
                    <g>
                      <circle
                        cx={endX}
                        cy={beamY}
                        r={5}
                        fill="#0ea5e9"
                        className="cursor-ew-resize hover:scale-125 transition-transform"
                        onPointerDown={(e) => handlePointerDown(e, load.id, "dist-end")}
                      />
                      <circle
                        cx={endX}
                        cy={beamY}
                        r={12}
                        fill="transparent"
                        className="cursor-ew-resize"
                        onPointerDown={(e) => handlePointerDown(e, load.id, "dist-end")}
                      />
                    </g>
                  </>
                )}
              </g>
            );
          })}



          {/* Boundaries Reaction Vectors (Upwards/Downwards arrows aligned with Support Heights) */}
          {/* Reaction Ra */}
          {supportAType !== SupportType.FREE && reactions.ra !== 0 && (() => {
            const s = supportStaggerMap.A || 0;
            const yShift = s * 16;
            const tipY = beamY + 36 + yShift;
            const baseY = beamY + 54 + yShift;
            const textY = beamY + 64 + yShift;
            return (
              <g>
                <line
                  x1={leftSupportX}
                  y1={baseY}
                  x2={leftSupportX}
                  y2={tipY + 2}
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeDasharray={reactions.ra < 0 ? "3 3" : undefined}
                />
                <polygon
                  points={
                    reactions.ra >= 0
                      ? `${leftSupportX},${tipY} ${leftSupportX - 4},${tipY + 8} ${leftSupportX + 4},${tipY + 8}`
                      : `${leftSupportX},${baseY + 2} ${leftSupportX - 4},${baseY - 6} ${leftSupportX + 4},${baseY - 6}`
                  }
                  fill="#6366f1"
                />
                <text
                  x={leftSupportX}
                  y={textY}
                  className="fill-indigo-400 font-mono text-[9px] font-bold"
                  textAnchor="middle"
                >
                  R_A = {formatUnit(reactions.ra, 'force', unitSystem!, 2)}
                </text>
              </g>
            );
          })()}

          {/* Reaction Rb */}
          {supportBType !== SupportType.FREE && reactions.rb !== 0 && (() => {
            const s = supportStaggerMap.B || 0;
            const yShift = s * 16;
            const tipY = beamY + 36 + yShift;
            const baseY = beamY + 54 + yShift;
            const textY = beamY + 64 + yShift;
            return (
              <g>
                <line
                  x1={rightSupportX}
                  y1={baseY}
                  x2={rightSupportX}
                  y2={tipY + 2}
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeDasharray={reactions.rb < 0 ? "3 3" : undefined}
                />
                <polygon
                  points={
                    reactions.rb >= 0
                      ? `${rightSupportX},${tipY} ${rightSupportX - 4},${tipY + 8} ${rightSupportX + 4},${tipY + 8}`
                      : `${rightSupportX},${baseY + 2} ${rightSupportX - 4},${baseY - 6} ${rightSupportX + 4},${baseY - 6}`
                  }
                  fill="#6366f1"
                />
                <text
                  x={rightSupportX}
                  y={textY}
                  className="fill-indigo-400 font-mono text-[9px] font-bold"
                  textAnchor="middle"
                >
                  R_B = {formatUnit(reactions.rb, 'force', unitSystem!, 2)}
                </text>
              </g>
            );
          })()}

          {/* Reaction Rc */}
          {supportCType !== SupportType.FREE && reactions.rc !== undefined && reactions.rc !== 0 && (() => {
            const s = supportStaggerMap.C || 0;
            const yShift = s * 16;
            const tipY = beamY + 36 + yShift;
            const baseY = beamY + 54 + yShift;
            const textY = beamY + 64 + yShift;
            const supportX = toSvgX(supportCPosition);
            return (
              <g>
                <line
                  x1={supportX}
                  y1={baseY}
                  x2={supportX}
                  y2={tipY + 2}
                  stroke="#ec4899"
                  strokeWidth="2.5"
                  strokeDasharray={reactions.rc < 0 ? "3 3" : undefined}
                />
                <polygon
                  points={
                    reactions.rc >= 0
                      ? `${supportX},${tipY} ${supportX - 4},${tipY + 8} ${supportX + 4},${tipY + 8}`
                      : `${supportX},${baseY + 2} ${supportX - 4},${baseY - 6} ${supportX + 4},${baseY - 6}`
                  }
                  fill="#ec4899"
                />
                <text
                  x={supportX}
                  y={textY}
                  className="fill-pink-400 font-mono text-[9px] font-bold"
                  textAnchor="middle"
                >
                  R_C = {formatUnit(reactions.rc, 'force', unitSystem!, 2)}
                </text>
              </g>
            );
          })()}

          {/* Reaction Rd */}
          {supportDType !== SupportType.FREE && reactions.rd !== undefined && reactions.rd !== 0 && (() => {
            const s = supportStaggerMap.D || 0;
            const yShift = s * 16;
            const tipY = beamY + 36 + yShift;
            const baseY = beamY + 54 + yShift;
            const textY = beamY + 64 + yShift;
            const supportX = toSvgX(supportDPosition);
            return (
              <g>
                <line
                  x1={supportX}
                  y1={baseY}
                  x2={supportX}
                  y2={tipY + 2}
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray={reactions.rd < 0 ? "3 3" : undefined}
                />
                <polygon
                  points={
                    reactions.rd >= 0
                      ? `${supportX},${tipY} ${supportX - 4},${tipY + 8} ${supportX + 4},${tipY + 8}`
                      : `${supportX},${baseY + 2} ${supportX - 4},${baseY - 6} ${supportX + 4},${baseY - 6}`
                  }
                  fill="#10b981"
                />
                <text
                  x={supportX}
                  y={textY}
                  className="fill-emerald-400 font-mono text-[9px] font-bold"
                  textAnchor="middle"
                >
                  R_D = {formatUnit(reactions.rd, 'force', unitSystem!, 2)}
                </text>
              </g>
            );
          })()}

          {/* Bending Moment Reaction Ma & Torsional Moment Reaction Ta */}
          {supportAType !== SupportType.FREE && (() => {
            const supportX = leftSupportX;
            const hasMa = reactions.ma !== undefined && reactions.ma !== 0;
            const hasTa = reactions.ta !== undefined && reactions.ta !== 0;
            if (!hasMa && !hasTa) return null;
            return (
              <g>
                {hasMa && (() => {
                  const isClockwise = reactions.ma! < 0;
                  return (
                    <g>
                      <path
                        d={`M ${supportX - 16} ${beamY} A 16 16 0 1 ${isClockwise ? "1" : "0"} ${supportX + 16} ${beamY}`}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2.5"
                      />
                      <polygon
                        points={
                          isClockwise
                            ? `${supportX + 16},${beamY} ${supportX + 20},${beamY - 4} ${supportX + 12},${beamY - 4}`
                            : `${supportX - 16},${beamY} ${supportX - 20},${beamY - 4} ${supportX - 12},${beamY - 4}`
                        }
                        fill="#fbbf24"
                      />
                      <text
                        x={supportX}
                        y={beamY - 26}
                        className="fill-amber-400 font-mono text-[9px] font-bold"
                        textAnchor="middle"
                      >
                        M_A = {formatUnit(reactions.ma!, 'moment', unitSystem!, 2)}
                      </text>
                    </g>
                  );
                })()}

                {hasTa && (() => {
                  const isClockwise = reactions.ta! < 0;
                  return (
                    <g>
                      <path
                        d={`M ${supportX - 24} ${beamY} A 24 24 0 1 ${isClockwise ? "1" : "0"} ${supportX + 24} ${beamY}`}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2.2"
                        strokeDasharray="3 2"
                      />
                      <polygon
                        points={
                          isClockwise
                            ? `${supportX + 24},${beamY} ${supportX + 28},${beamY - 4} ${supportX + 20},${beamY - 4}`
                            : `${supportX - 24},${beamY} ${supportX - 28},${beamY - 4} ${supportX - 20},${beamY - 4}`
                        }
                        fill="#34d399"
                      />
                      <text
                        x={supportX}
                        y={hasMa ? beamY - 40 : beamY - 26}
                        className="fill-emerald-400 font-mono text-[9px] font-bold"
                        textAnchor="middle"
                      >
                        T_A = {formatUnit(reactions.ta!, 'moment', unitSystem!, 2)}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })()}

          {/* Bending Moment Reaction Mb & Torsional Moment Reaction Tb */}
          {supportBType !== SupportType.FREE && (() => {
            const supportX = rightSupportX;
            const hasMb = reactions.mb !== undefined && reactions.mb !== 0;
            const hasTb = reactions.tb !== undefined && reactions.tb !== 0;
            if (!hasMb && !hasTb) return null;
            return (
              <g>
                {hasMb && (() => {
                  const isClockwise = reactions.mb! < 0;
                  return (
                    <g>
                      <path
                        d={`M ${supportX - 16} ${beamY} A 16 16 0 1 ${isClockwise ? "1" : "0"} ${supportX + 16} ${beamY}`}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2.5"
                      />
                      <polygon
                        points={
                          isClockwise
                            ? `${supportX + 16},${beamY} ${supportX + 20},${beamY - 4} ${supportX + 12},${beamY - 4}`
                            : `${supportX - 16},${beamY} ${supportX - 20},${beamY - 4} ${supportX - 12},${beamY - 4}`
                        }
                        fill="#fbbf24"
                      />
                      <text
                        x={supportX}
                        y={beamY - 26}
                        className="fill-amber-400 font-mono text-[9px] font-bold"
                        textAnchor="middle"
                      >
                        M_B = {formatUnit(reactions.mb!, 'moment', unitSystem!, 2)}
                      </text>
                    </g>
                  );
                })()}

                {hasTb && (() => {
                  const isClockwise = reactions.tb! < 0;
                  return (
                    <g>
                      <path
                        d={`M ${supportX - 24} ${beamY} A 24 24 0 1 ${isClockwise ? "1" : "0"} ${supportX + 24} ${beamY}`}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2.2"
                        strokeDasharray="3 2"
                      />
                      <polygon
                        points={
                          isClockwise
                            ? `${supportX + 24},${beamY} ${supportX + 28},${beamY - 4} ${supportX + 20},${beamY - 4}`
                            : `${supportX - 24},${beamY} ${supportX - 28},${beamY - 4} ${supportX - 20},${beamY - 4}`
                        }
                        fill="#34d399"
                      />
                      <text
                        x={supportX}
                        y={hasMb ? beamY - 40 : beamY - 26}
                        className="fill-emerald-400 font-mono text-[9px] font-bold"
                        textAnchor="middle"
                      >
                        T_B = {formatUnit(reactions.tb!, 'moment', unitSystem!, 2)}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })()}

          {/* Bending Moment Reaction Mc & Torsional Moment Reaction Tc */}
          {supportCType !== SupportType.FREE && (() => {
            const supportX = toSvgX(supportCPosition || 0);
            const hasMc = reactions.mc !== undefined && reactions.mc !== 0;
            const hasTc = reactions.tc !== undefined && reactions.tc !== 0;
            if (!hasMc && !hasTc) return null;
            return (
              <g>
                {hasMc && (() => {
                  const isClockwise = reactions.mc! < 0;
                  return (
                    <g>
                      <path
                        d={`M ${supportX - 16} ${beamY} A 16 16 0 1 ${isClockwise ? "1" : "0"} ${supportX + 16} ${beamY}`}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2.5"
                      />
                      <polygon
                        points={
                          isClockwise
                            ? `${supportX + 16},${beamY} ${supportX + 20},${beamY - 4} ${supportX + 12},${beamY - 4}`
                            : `${supportX - 16},${beamY} ${supportX - 20},${beamY - 4} ${supportX - 12},${beamY - 4}`
                        }
                        fill="#fbbf24"
                      />
                      <text
                        x={supportX}
                        y={beamY - 26}
                        className="fill-amber-400 font-mono text-[9px] font-bold"
                        textAnchor="middle"
                      >
                        M_C = {formatUnit(reactions.mc!, 'moment', unitSystem!, 2)}
                      </text>
                    </g>
                  );
                })()}

                {hasTc && (() => {
                  const isClockwise = reactions.tc! < 0;
                  return (
                    <g>
                      <path
                        d={`M ${supportX - 24} ${beamY} A 24 24 0 1 ${isClockwise ? "1" : "0"} ${supportX + 24} ${beamY}`}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2.2"
                        strokeDasharray="3 2"
                      />
                      <polygon
                        points={
                          isClockwise
                            ? `${supportX + 24},${beamY} ${supportX + 28},${beamY - 4} ${supportX + 20},${beamY - 4}`
                            : `${supportX - 24},${beamY} ${supportX - 28},${beamY - 4} ${supportX - 20},${beamY - 4}`
                        }
                        fill="#34d399"
                      />
                      <text
                        x={supportX}
                        y={hasMc ? beamY - 40 : beamY - 26}
                        className="fill-emerald-400 font-mono text-[9px] font-bold"
                        textAnchor="middle"
                      >
                        T_C = {formatUnit(reactions.tc!, 'moment', unitSystem!, 2)}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })()}

          {/* Bending Moment Reaction Md & Torsional Moment Reaction Td */}
          {supportDType !== SupportType.FREE && (() => {
            const supportX = toSvgX(supportDPosition || 0);
            const hasMd = reactions.md !== undefined && reactions.md !== 0;
            const hasTd = reactions.td !== undefined && reactions.td !== 0;
            if (!hasMd && !hasTd) return null;
            return (
              <g>
                {hasMd && (() => {
                  const isClockwise = reactions.md! < 0;
                  return (
                    <g>
                      <path
                        d={`M ${supportX - 16} ${beamY} A 16 16 0 1 ${isClockwise ? "1" : "0"} ${supportX + 16} ${beamY}`}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2.5"
                      />
                      <polygon
                        points={
                          isClockwise
                            ? `${supportX + 16},${beamY} ${supportX + 20},${beamY - 4} ${supportX + 12},${beamY - 4}`
                            : `${supportX - 16},${beamY} ${supportX - 20},${beamY - 4} ${supportX - 12},${beamY - 4}`
                        }
                        fill="#fbbf24"
                      />
                      <text
                        x={supportX}
                        y={beamY - 26}
                        className="fill-amber-400 font-mono text-[9px] font-bold"
                        textAnchor="middle"
                      >
                        M_D = {formatUnit(reactions.md!, 'moment', unitSystem!, 2)}
                      </text>
                    </g>
                  );
                })()}

                {hasTd && (() => {
                  const isClockwise = reactions.td! < 0;
                  return (
                    <g>
                      <path
                        d={`M ${supportX - 24} ${beamY} A 24 24 0 1 ${isClockwise ? "1" : "0"} ${supportX + 24} ${beamY}`}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2.2"
                        strokeDasharray="3 2"
                      />
                      <polygon
                        points={
                          isClockwise
                            ? `${supportX + 24},${beamY} ${supportX + 28},${beamY - 4} ${supportX + 20},${beamY - 4}`
                            : `${supportX - 24},${beamY} ${supportX - 28},${beamY - 4} ${supportX - 20},${beamY - 4}`
                        }
                        fill="#34d399"
                      />
                      <text
                        x={supportX}
                        y={hasMd ? beamY - 40 : beamY - 26}
                        className="fill-emerald-400 font-mono text-[9px] font-bold"
                        textAnchor="middle"
                      >
                        T_D = {formatUnit(reactions.td!, 'moment', unitSystem!, 2)}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })()}
        </svg>
      </div>

      <div className={readOnly ? "flex items-center justify-between text-[11px] text-slate-400 mt-2 bg-[#121c32]/50 p-2.5 rounded-lg border border-[#1e2a47]/55 print:bg-slate-50 print:border-slate-300 print:text-slate-800" : "flex items-center justify-between text-[11px] text-slate-400 mt-2 bg-[#121c32] p-2.5 rounded-lg border border-[#1e2a47]"}>
        <div className="flex gap-4">
          <div>
            <span className="text-slate-500 font-sans print:text-slate-500">Sección: </span>
            <span className="text-amber-400 font-medium print:text-amber-900">{sectionType}</span>
          </div>
          <div>
            <span className="text-slate-500 font-sans print:text-slate-500">Vano de Apoyos: </span>
            <span className="text-amber-400 font-mono print:text-amber-900">{formatUnit(supportBPosition - supportAPosition, 'length', unitSystem!)} de luz</span>
          </div>
        </div>
        {!readOnly && (
          <div className="text-red-400 font-semibold flex items-center gap-1 animate-pulse">
            ⚠️ ¡Puedes arrastrar tanto los apoyos como las cargas directamente en la pantalla!
          </div>
        )}
      </div>
    </div>
  );
}
