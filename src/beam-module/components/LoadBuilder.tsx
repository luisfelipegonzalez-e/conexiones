/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Trash2, ArrowDown, MoveRight, HelpCircle, Save } from "lucide-react";
import { BeamLoad, LoadType, SupportType } from "../types";
import { UnitSystem, formatUnit, convert, toMetric, UNITS } from "../utils/units";

interface LoadBuilderProps {
  beamLength: number;
  loads: BeamLoad[];
  onAddLoad: (load: BeamLoad) => void;
  onRemoveLoad: (id: string) => void;
  onUpdateLoad: (updatedLoad: BeamLoad) => void;
  supportAPosition?: number;
  supportBPosition?: number;
  supportAType?: SupportType;
  supportBType?: SupportType;
  unitSystem?: UnitSystem;
}

const getSupportInfo = (type: SupportType, label: string) => {
  switch (type) {
    case SupportType.PINNED:
      return {
        name: `Apoyo Articulado Inmóvil (${label})`,
        desc: "Articulado / Fijo contra traslación, libre rotación",
        icon: "▲"
      };
    case SupportType.ROLLER:
      return {
        name: `Apoyo de Rodillo Desplazable (${label})`,
        desc: "Rodillo / Libre desplazamiento longitudinal",
        icon: "⚪"
      };
    case SupportType.FIXED:
      return {
        name: `Apoyo Empotrado (${label})`,
        desc: "Empotrado / Restricción total de movimiento y rotación",
        icon: "⌸"
      };
    case SupportType.GUIDED:
      return {
        name: `Apoyo Guiado (${label})`,
        desc: "Guiado / Restricto a un eje móvil, libre rotación",
        icon: "↱↲"
      };
    case SupportType.FREE:
      return {
        name: `Extremo Libre (${label})`,
        desc: "Libre / Sin restricciones mecánicas (viga en voladizo)",
        icon: "░"
      };
    default:
      return {
        name: `Apoyo (${label})`,
        desc: "Condición de contorno ordinaria",
        icon: "▲"
      };
  }
};

export default function LoadBuilder({
  beamLength,
  loads,
  onAddLoad,
  onRemoveLoad,
  onUpdateLoad,
  supportAPosition = 0,
  supportBPosition,
  supportAType = SupportType.PINNED,
  supportBType = SupportType.ROLLER,
  unitSystem = 'metric'
}: LoadBuilderProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formType, setFormType] = useState<LoadType>(LoadType.POINT);
  const [magnitude, setMagnitude] = useState<number>(20); // kN or kN/m or kNm
  const [magnitudeStart, setMagnitudeStart] = useState<number>(0); // Triangular load w1
  const [magnitudeEnd, setMagnitudeEnd] = useState<number>(20);   // Triangular load w2
  const [position, setPosition] = useState<number>(2.0);   // point / moment / torque load x (m)
  const [start, setStart] = useState<number>(4.0);         // dist load start (m)
  const [end, setEnd] = useState<number>(8.0);             // dist load end (m)

  const resetForm = () => {
    setMagnitude(formType === LoadType.POINT ? 20 : formType === LoadType.DISTRIBUTED ? 15 : 10);
    setMagnitudeStart(0);
    setMagnitudeEnd(20);
    setPosition(2.0);
    setStart(4.0);
    setEnd(8.0);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (formType !== LoadType.TRIANGULAR && magnitude <= 0) {
      return alert("La magnitud debe ser mayor que cero.");
    }
    
    let newLoad: BeamLoad;
    if (formType === LoadType.POINT) {
      if (position < 0 || position > beamLength) {
        return alert(`La posición debe estar entre 0 y ${beamLength} m.`);
      }
      newLoad = {
        id: "load_" + Math.random().toString(36).substr(2, 9),
        type: LoadType.POINT,
        magnitude: parseFloat(magnitude.toString()),
        position: parseFloat(position.toString())
      };
    } else if (formType === LoadType.MOMENT) {
      if (position < 0 || position > beamLength) {
        return alert(`La posición debe estar entre 0 y ${beamLength} m.`);
      }
      newLoad = {
        id: "load_" + Math.random().toString(36).substr(2, 9),
        type: LoadType.MOMENT,
        magnitude: parseFloat(magnitude.toString()),
        position: parseFloat(position.toString())
      };
    } else if (formType === LoadType.TORQUE) {
      if (position < 0 || position > beamLength) {
        return alert(`La posición debe estar entre 0 y ${beamLength} m.`);
      }
      newLoad = {
        id: "load_" + Math.random().toString(36).substr(2, 9),
        type: LoadType.TORQUE,
        magnitude: parseFloat(magnitude.toString()),
        position: parseFloat(position.toString())
      };
    } else if (formType === LoadType.TRIANGULAR) {
      if (magnitudeStart < 0 || magnitudeEnd < 0) {
        return alert("Las magnitudes deben ser mayores o iguales a cero.");
      }
      if (magnitudeStart === 0 && magnitudeEnd === 0) {
        return alert("Al menos una de las magnitudes debe ser mayor que cero.");
      }
      if (start < 0 || end > beamLength || start >= end) {
        return alert(`Rango inválido. El inicio debe ser >= 0 y menor que el fin (${beamLength} m).`);
      }
      newLoad = {
        id: "load_" + Math.random().toString(36).substr(2, 9),
        type: LoadType.TRIANGULAR,
        magnitudeStart: parseFloat(magnitudeStart.toString()),
        magnitudeEnd: parseFloat(magnitudeEnd.toString()),
        start: parseFloat(start.toString()),
        end: parseFloat(end.toString())
      };
    } else {
      if (start < 0 || end > beamLength || start >= end) {
        return alert(`Rango inválido. El inicio debe ser >= 0 y menor que el fin (${beamLength} m).`);
      }
      newLoad = {
        id: "load_" + Math.random().toString(36).substr(2, 9),
        type: LoadType.DISTRIBUTED,
        magnitude: parseFloat(magnitude.toString()),
        start: parseFloat(start.toString()),
        end: parseFloat(end.toString())
      };
    }

    onAddLoad(newLoad);
    setIsAdding(false);
    resetForm();
  };

  const handleStartEdit = (load: BeamLoad) => {
    setEditingId(load.id);
    setFormType(load.type);
    if (load.type === LoadType.TRIANGULAR) {
      setMagnitudeStart(load.magnitudeStart);
      setMagnitudeEnd(load.magnitudeEnd);
      setStart(load.start);
      setEnd(load.end);
    } else {
      setMagnitude(load.magnitude);
      if (load.type === LoadType.POINT) {
        setPosition(load.position);
      } else if (load.type === LoadType.MOMENT) {
        setPosition(load.position);
      } else if (load.type === LoadType.TORQUE) {
        setPosition(load.position);
      } else {
        setStart(load.start);
        setEnd(load.end);
      }
    }
  };

  const handleSaveEdit = (id: string) => {
    const originalLoad = loads.find(l => l.id === id);
    if (!originalLoad) return;

    if (originalLoad.type !== LoadType.TRIANGULAR && magnitude <= 0) {
      return alert("La magnitud debe ser mayor que cero.");
    }

    let updatedLoad: BeamLoad;
    if (originalLoad.type === LoadType.POINT) {
      if (position < 0 || position > beamLength) {
        return alert(`La posición debe estar entre 0 y ${beamLength} m.`);
      }
      updatedLoad = {
        id,
        type: LoadType.POINT,
        magnitude: parseFloat(magnitude.toString()),
        position: parseFloat(position.toString())
      };
    } else if (originalLoad.type === LoadType.MOMENT) {
      if (position < 0 || position > beamLength) {
        return alert(`La posición debe estar entre 0 y ${beamLength} m.`);
      }
      updatedLoad = {
        id,
        type: LoadType.MOMENT,
        magnitude: parseFloat(magnitude.toString()),
        position: parseFloat(position.toString())
      };
    } else if (originalLoad.type === LoadType.TORQUE) {
      if (position < 0 || position > beamLength) {
        return alert(`La posición debe estar entre 0 y ${beamLength} m.`);
      }
      updatedLoad = {
        id,
        type: LoadType.TORQUE,
        magnitude: parseFloat(magnitude.toString()),
        position: parseFloat(position.toString())
      };
    } else if (originalLoad.type === LoadType.TRIANGULAR) {
      if (magnitudeStart < 0 || magnitudeEnd < 0) {
        return alert("Las magnitudes deben ser mayores o iguales a cero.");
      }
      if (magnitudeStart === 0 && magnitudeEnd === 0) {
        return alert("Al menos una de las magnitudes debe ser mayor que cero.");
      }
      if (start < 0 || end > beamLength || start >= end) {
        return alert(`Rango inválido. El inicio debe ser >= 0 y menor que el fin (${beamLength} m).`);
      }
      updatedLoad = {
        id,
        type: LoadType.TRIANGULAR,
        magnitudeStart: parseFloat(magnitudeStart.toString()),
        magnitudeEnd: parseFloat(magnitudeEnd.toString()),
        start: parseFloat(start.toString()),
        end: parseFloat(end.toString())
      };
    } else {
      if (start < 0 || end > beamLength || start >= end) {
        return alert(`Rango inválido. El inicio debe ser >= 0 y menor que el fin (${beamLength} m).`);
      }
      updatedLoad = {
        id,
        type: LoadType.DISTRIBUTED,
        magnitude: parseFloat(magnitude.toString()),
        start: parseFloat(start.toString()),
        end: parseFloat(end.toString())
      };
    }

    onUpdateLoad(updatedLoad);
    setEditingId(null);
  };

  return (
    <div className="w-full bg-[#0d1527] border border-[#1b2a47] rounded-xl p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4 border-b border-[#1b2a47] pb-3">
        <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase flex items-center gap-2">
          <span className="text-sky-400">⚡</span> CONSTRUCTOR DE CARGAS
        </h3>
        {!isAdding && (
          <button
            onClick={() => {
              setIsAdding(true);
              resetForm();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-blue-600 font-sans text-xs font-semibold text-white transition-all cursor-pointer shadow-lg shadow-blue-950"
          >
            <Plus className="w-4 h-4" /> Agregar Carga
          </button>
        )}
      </div>

      {/* Add Load Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="bg-[#121c32] p-4 rounded-lg border border-[#21396a] mb-5 animation-fade-in text-slate-300">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold uppercase text-sky-400 font-sans tracking-wide">Nueva Carga de Viga</span>
            <span className="text-[10px] text-slate-500 font-mono">Lmáx = {beamLength} m</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Tipo de Carga</label>
              <select
                value={formType}
                onChange={(e) => {
                  const type = e.target.value as LoadType;
                  setFormType(type);
                  if (type === LoadType.TRIANGULAR) {
                    setMagnitudeStart(0);
                    setMagnitudeEnd(20);
                  } else {
                    setMagnitude(type === LoadType.POINT ? 20 : type === LoadType.DISTRIBUTED ? 15 : 10);
                  }
                }}
                className="w-full text-xs bg-[#090d16] border border-[#1e2a47] rounded p-2 text-slate-200 outline-none focus:border-blue-500 font-sans cursor-pointer"
              >
                <option value={LoadType.POINT}>Carga Puntual (P)</option>
                <option value={LoadType.DISTRIBUTED}>Carga Distribuida (w)</option>
                <option value={LoadType.TRIANGULAR}>Carga Triangular / Variable (w)</option>
                <option value={LoadType.MOMENT}>Momento Flector (M)</option>
                <option value={LoadType.TORQUE}>Momento Torsor (T)</option>
              </select>
            </div>
            {formType !== LoadType.TRIANGULAR ? (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Magnitud {
                    formType === LoadType.POINT 
                      ? `(${UNITS[unitSystem!].force})` 
                      : formType === LoadType.DISTRIBUTED 
                      ? `(${UNITS[unitSystem!].distLoad})` 
                      : `(${UNITS[unitSystem!].moment})`
                  }
                </label>
                <input
                  type="number"
                  step="any"
                  value={magnitude}
                  onChange={(e) => setMagnitude(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono bg-[#090d16] border border-[#1e2a47] rounded p-2 text-slate-200 outline-none focus:border-blue-500"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">w₁ Inicio ({UNITS[unitSystem].distLoad})</label>
                  <input
                    type="number"
                    step="any"
                    value={magnitudeStart}
                    onChange={(e) => setMagnitudeStart(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-[#090d16] border border-[#1e2a47] rounded p-2 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">w₂ Fin ({UNITS[unitSystem].distLoad})</label>
                  <input
                    type="number"
                    step="any"
                    value={magnitudeEnd}
                    onChange={(e) => setMagnitudeEnd(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-[#090d16] border border-[#1e2a47] rounded p-2 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {(formType === LoadType.POINT || formType === LoadType.MOMENT || formType === LoadType.TORQUE) ? (
            <div className="mb-4">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Posición de Aplicación (x)</span>
                <span className="font-mono text-amber-500 font-medium">{formatUnit(position, 'length', unitSystem!)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={beamLength}
                step="0.05"
                value={position}
                onChange={(e) => setPosition(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-ew-resize bg-slate-800 h-1.5 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0.000 m</span>
                <span>{formatUnit(beamLength, 'length', unitSystem!)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Posición Inicio (x₁)</span>
                  <span className="font-mono text-teal-400 font-medium">{formatUnit(start, 'length', unitSystem!)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={beamLength}
                  step="0.05"
                  value={start}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setStart(val);
                    if (val >= end) setEnd(Math.min(beamLength, val + 0.5));
                  }}
                  className="w-full accent-teal-500 cursor-ew-resize bg-slate-800 h-1.5 rounded-lg"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Posición Fin (x₂)</span>
                  <span className="font-mono text-teal-400 font-medium">{formatUnit(end, 'length', unitSystem!)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={beamLength}
                  step="0.05"
                  value={end}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setEnd(val);
                    if (val <= start) setStart(Math.max(0, val - 0.5));
                  }}
                  className="w-full accent-teal-500 cursor-ew-resize bg-slate-800 h-1.5 rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2 border-t border-[#1e2a47]">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs rounded border border-slate-750 bg-[#0d1527] hover:bg-slate-800 text-slate-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              Agregar Carga
            </button>
          </div>
        </form>
      )}

      {/* Static Load items list */}
      <div className="space-y-2.5">
        {/* Support items (Permanent boundaries) */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f192e] border border-[#162744] text-slate-300 transition-all duration-200 hover:border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-700/50 flex items-center justify-center text-blue-400 text-sm font-bold">
              {getSupportInfo(supportAType, "A").icon}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-300">{getSupportInfo(supportAType, "A").name}</div>
              <div className="text-[10px] text-slate-500 font-mono">{getSupportInfo(supportAType, "A").desc}</div>
            </div>
          </div>
          <span className="text-xs font-mono bg-blue-950/80 border border-blue-900 px-2 py-0.5 rounded text-blue-400 font-medium font-bold">x = {formatUnit(supportAPosition, 'length', unitSystem!)}</span>
        </div>

        {/* User loads */}
        {loads.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-[#1e2a47] rounded-lg text-slate-500 text-xs">
            No hay fuerzas adicionales creadas. Usa el botón "+ Agregar Carga".
          </div>
        ) : (
          loads.map((load) => {
            const isEditing = editingId === load.id;
            const isPoint = load.type === LoadType.POINT;
            const isMoment = load.type === LoadType.MOMENT;
            const isTorque = load.type === LoadType.TORQUE;

            return (
              <div
                key={load.id}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  isEditing
                    ? "bg-[#152342] border-blue-500"
                    : isPoint
                    ? "bg-[#161219] border-red-950/40 hover:bg-[#1a1520] hover:border-red-900/30"
                    : load.type === LoadType.DISTRIBUTED
                    ? "bg-[#121a1f] border-teal-950/40 hover:bg-[#162128] hover:border-teal-900/30"
                    : load.type === LoadType.TRIANGULAR
                    ? "bg-[#0c1f2e] border-sky-950/40 hover:bg-[#112a3d] hover:border-sky-900/30"
                    : isMoment
                    ? "bg-[#1c1a12] border-amber-950/40 hover:bg-[#221f15] hover:border-amber-900/30"
                    : "bg-[#19121a] border-purple-950/40 hover:bg-[#1f1521] hover:border-purple-900/30"
                }`}
              >
                {isEditing ? (
                  // Inline editor
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Editando Carga</span>
                      <span className="text-[10px] text-slate-500 font-mono">Id: {load.id}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {load.type !== LoadType.TRIANGULAR && (
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Magnitud</label>
                          <input
                            type="number"
                            step="any"
                            value={magnitude}
                            onChange={(e) => setMagnitude(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs font-mono bg-[#090d16] border border-[#1e2a47] rounded p-1.5 text-slate-200 outline-none"
                          />
                        </div>
                      )}
                      {(isPoint || isMoment || isTorque) ? (
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Posición (x)</label>
                          <input
                            type="number"
                            step="any"
                            value={position}
                            onChange={(e) => setPosition(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs font-mono bg-[#090d16] border border-[#1e2a47] rounded p-1.5 text-slate-200 outline-none"
                          />
                        </div>
                      ) : load.type === LoadType.TRIANGULAR ? (
                        <div className="grid grid-cols-2 gap-1.5 col-span-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">w₁ Inicio (kN/m)</label>
                            <input
                              type="number"
                              step="any"
                              value={magnitudeStart}
                              onChange={(e) => setMagnitudeStart(parseFloat(e.target.value) || 0)}
                              className="w-full text-xs font-mono bg-[#090d16] border border-[#1e2a47] rounded p-1.5 text-slate-200 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">w₂ Fin (kN/m)</label>
                            <input
                              type="number"
                              step="any"
                              value={magnitudeEnd}
                              onChange={(e) => setMagnitudeEnd(parseFloat(e.target.value) || 0)}
                              className="w-full text-xs font-mono bg-[#090d16] border border-[#1e2a47] rounded p-1.5 text-slate-200 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">X₁ Inicio (m)</label>
                            <input
                              type="number"
                              step="any"
                              value={start}
                              onChange={(e) => setStart(parseFloat(e.target.value) || 0)}
                              className="w-full text-xs font-mono bg-[#090d16] border border-[#1e2a47] rounded p-1.5 text-slate-200 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">X₂ Fin (m)</label>
                            <input
                              type="number"
                              step="any"
                              value={end}
                              onChange={(e) => setEnd(parseFloat(e.target.value) || 0)}
                              className="w-full text-xs font-mono bg-[#090d16] border border-[#1e2a47] rounded p-1.5 text-slate-200 outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">X₁ (Inicio)</label>
                            <input
                              type="number"
                              step="any"
                              value={start}
                              onChange={(e) => setStart(parseFloat(e.target.value) || 0)}
                              className="w-full text-xs font-mono bg-[#090d16] border border-[#1e2a47] rounded p-1.5 text-slate-200 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">X₂ (Fin)</label>
                            <input
                              type="number"
                              step="any"
                              value={end}
                              onChange={(e) => setEnd(parseFloat(e.target.value) || 0)}
                              className="w-full text-xs font-mono bg-[#090d16] border border-[#1e2a47] rounded p-1.5 text-slate-200 outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1.5 justify-end pt-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-[10px] rounded bg-slate-800 text-slate-400 hover:bg-slate-750"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveEdit(load.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] rounded bg-green-700 text-white font-semibold hover:bg-green-600"
                      >
                        <Save className="w-3.5 h-3.5" /> Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Default visual row
                  <div className="flex items-center justify-between text-slate-300">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                          isPoint
                            ? "bg-red-950/50 border border-red-500/30 text-red-400"
                            : load.type === LoadType.DISTRIBUTED
                            ? "bg-teal-950/50 border border-teal-500/30 text-teal-400"
                            : load.type === LoadType.TRIANGULAR
                            ? "bg-sky-950/50 border border-sky-500/30 text-sky-400"
                            : isMoment
                            ? "bg-amber-950/50 border border-amber-500/30 text-amber-500"
                            : "bg-purple-950/50 border border-purple-500/30 text-purple-400"
                        }`}
                      >
                        {isPoint && <ArrowDown className="w-4 h-4" />}
                        {load.type === LoadType.DISTRIBUTED && <MoveRight className="w-4 h-4" />}
                        {load.type === LoadType.TRIANGULAR && <span className="text-sm font-bold">⊿</span>}
                        {isMoment && <span className="text-sm font-bold">↻</span>}
                        {isTorque && <span className="text-sm font-bold">🌀</span>}
                      </div>
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          {isPoint && (
                            <>
                              <span>Carga Puntual</span>
                              <span className="text-red-400 font-bold font-mono">-{formatUnit(load.magnitude, 'force', unitSystem!)}</span>
                            </>
                          )}
                          {load.type === LoadType.DISTRIBUTED && (
                            <>
                              <span>Carga Distribuida</span>
                              <span className="text-teal-400 font-bold font-mono">-{formatUnit(load.magnitude, 'distLoad', unitSystem!)}</span>
                            </>
                          )}
                          {load.type === LoadType.TRIANGULAR && (
                            <>
                              <span>Carga Triangular</span>
                              <span className="text-sky-400 font-bold font-mono">w₁:-{formatUnit(load.magnitudeStart, 'distLoad', unitSystem!, 1)} a w₂:-{formatUnit(load.magnitudeEnd, 'distLoad', unitSystem!, 1)}</span>
                            </>
                          )}
                          {isMoment && (
                            <>
                              <span>Momento Flector</span>
                              <span className="text-amber-400 font-bold font-mono">{formatUnit(load.magnitude, 'moment', unitSystem!)}</span>
                            </>
                          )}
                          {isTorque && (
                            <>
                              <span>Momento Torsor</span>
                              <span className="text-purple-400 font-bold font-mono">{formatUnit(load.magnitude, 'moment', unitSystem!)}</span>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {(load.type === LoadType.DISTRIBUTED || load.type === LoadType.TRIANGULAR) ? (
                            <span>Rango: {formatUnit(load.start, 'length', unitSystem!)} a {formatUnit(load.end, 'length', unitSystem!)}</span>
                          ) : (
                            <span>Localizado en x = {formatUnit((load as any).position, 'length', unitSystem!)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(load)}
                        className="p-1 px-2 rounded bg-slate-850 hover:bg-[#152342] text-slate-400 hover:text-sky-400 transition-colors cursor-pointer text-[10.5px] font-sans font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onRemoveLoad(load.id)}
                        className="p-1.5 rounded bg-slate-850 hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Eliminar carga"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Roller support item (Boundary B) */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f192e] border border-[#162744] text-slate-300 transition-all duration-200 hover:border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-700/50 flex items-center justify-center text-blue-400 text-sm font-bold">
              {getSupportInfo(supportBType, "B").icon}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-300">{getSupportInfo(supportBType, "B").name}</div>
              <div className="text-[10px] text-slate-500 font-mono">{getSupportInfo(supportBType, "B").desc}</div>
            </div>
          </div>
          <span className="text-xs font-mono bg-blue-950/80 border border-blue-900 px-2 py-0.5 rounded text-blue-400 font-medium font-bold">x = {formatUnit(supportBPosition ?? beamLength, 'length', unitSystem!)}</span>
        </div>
      </div>
      
      <div className="mt-4 text-[10.5px] text-[#8ea5d0] bg-[#111e38]/70 border border-[#1b2b4d] rounded-lg p-2.5 flex items-start gap-1">
        <span className="text-blue-400 mt-0.5 text-xs">ℹ️</span>
        <p>Consejo: Las cargas ejercen fuerza descendente. La reacción R_A y R_B se recalculan de forma equilibrada para mantener la estaticidad global (grado de estaticidad 0).</p>
      </div>
    </div>
  );
}
