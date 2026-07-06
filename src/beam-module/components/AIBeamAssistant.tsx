/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Send, X, Bot, User, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { ChatMessage, SectionType, SectionProperties, MaterialProperties, BeamLoad, SolverResult, LoadType } from "../types";

interface AIBeamAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  beamLength: number;
  sectionType: SectionType;
  sectionProps: SectionProperties;
  material: MaterialProperties;
  loads: BeamLoad[];
  results: SolverResult;
  includeSelfWeight: boolean;
}

export default function AIBeamAssistant({
  isOpen,
  onClose,
  beamLength,
  sectionType,
  sectionProps,
  material,
  loads,
  results,
  includeSelfWeight
}: AIBeamAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Initialize with greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "greet",
          role: "assistant",
          content: `¡Hola! Soy tu **Asistente GORA**. Puedo ayudarte a optimizar esta viga, realizar la verificación de pandeo, explicarte la distribución de momentos, o aconsejarte sobre qué perfil (\`Perfil I\`, \`Canal C\`, \`Circular\`, \`RHS\`) o acero es mejor para resistir tus cargas actuales. 

¿Qué te gustaría indagar sobre este cálculo structural?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }
  }, []);

  // Scroll to bottom on updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  if (!isOpen) return null;

  // Compile active state to context
  const getStructuralContext = () => {
    return {
      viga: {
        longitudTotalMeters: beamLength,
        tipoSeccion: sectionType,
        propiedadesSeccionMm: sectionProps,
        material: {
          nombre: material.name,
          fy_MPa: material.fy,
          fu_MPa: material.fu,
          moduloYoung_GPa: material.elasticModulus,
          poisson: material.poisson,
          densidad_KgM3: material.density
        },
        pesoPropioIncluido: includeSelfWeight,
        pesoPropioKnM: results.selfWeightLoadKnPerM
      },
      cargas: loads.map(l => {
        if (l.type === LoadType.POINT) {
          return { tipo: "Puntual", magnitudKn: l.magnitude, posicionM: l.position };
        } else if (l.type === LoadType.MOMENT) {
          return { tipo: "Momento Flector", magnitudKnm: l.magnitude, posicionM: l.position };
        } else if (l.type === LoadType.TORQUE) {
          return { tipo: "Momento Torsor", magnitudKnm: l.magnitude, posicionM: l.position };
        } else if (l.type === LoadType.DISTRIBUTED) {
          return { tipo: "Distribuida", magnitudKnM: l.magnitude, inicioM: (l as any).start, finM: (l as any).end };
        } else {
          return { tipo: "Desconocida", magnitud: (l as any).magnitude };
        }
      }),
      resultadosAnaliticos: {
        reaccionesKn: {
          ra: results.reactions.ra,
          rb: results.reactions.rb,
          rc: results.reactions.rc,
          rd: results.reactions.rd,
          ha: results.reactions.ha,
          hb: results.reactions.hb,
          hc: results.reactions.hc,
          hd: results.reactions.hd,
          ma: results.reactions.ma,
          mb: results.reactions.mb,
          mc: results.reactions.mc,
          md: results.reactions.md,
          ta: results.reactions.ta,
          tb: results.reactions.tb,
          tc: results.reactions.tc,
          td: results.reactions.td
        },
        momentoMaximoKnM: results.maxMoment,
        cortanteMaximoKn: results.maxShear,
        deflexionMaximaMm: results.maxDeflection,
        esfuerzoMaximoMPa: results.maxStress,
        criterioVonMises: results.vonMises,
        criterioTresca: results.tresca,
        esEstructuraSegura: results.globalStatus.isSafe,
        factorSeguridadMinimo: results.globalStatus.minFS
      }
    };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue("");

    const userMsg: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substr(2, 9),
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const context = getStructuralContext();
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          context: JSON.stringify(context),
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error("Surgió un error con el servidor del Asistente.");
      }

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: "msg_" + Math.random().toString(36).substr(2, 9),
        role: "assistant",
        content: data.reply || "No obtuve una respuesta clara del modelo.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const assistantMsg: ChatMessage = {
        id: "msg_err_" + Math.random().toString(36).substr(2, 9),
        role: "assistant",
        content: `⚠️ Ups, no se pudo conectar con el servicio de IA: ${err.message || "Error desconocido."}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: "Optimizar sección", prompt: "¿Cómo optimizo esta sección para que tenga un factor de seguridad mayor?" },
    { label: "Explicar Von Mises", prompt: "¿Cómo se calcula el esfuerzo equivalente de Von Mises en esta viga?" },
    { label: "Modificar material", prompt: "¿Qué pasaría si cambio el acero actual por un ASTM A36?" }
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-[#0a0f1d] border-l border-[#1b2a47] shadow-2xl z-50 flex flex-col h-full animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1b2a47] bg-[#0d1527]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200 tracking-wide uppercase font-sans">Asistente de Ingeniería</h4>
            <span className="text-[10px] text-green-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Gemini 3.5 Flash Online
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((m) => {
          const isBot = m.role === "assistant";
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[85%] ${isBot ? "mr-auto" : "ml-auto flex-row-reverse"}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow ${
                  isBot
                    ? "bg-[#162744] border border-blue-900 text-blue-400"
                    : "bg-blue-600 text-white"
                }`}
              >
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`p-3 rounded-2xl select-text ${
                  isBot
                    ? "bg-[#111c32] border border-[#1b2944] text-slate-300 rounded-tl-none"
                    : "bg-blue-600 text-white rounded-tr-none"
                }`}
              >
                {/* Very basic Markdown parser for lists, bold and code blocks */}
                <div className="text-xs leading-relaxed space-y-1.5 whitespace-pre-wrap">
                  {m.content.split("\n").map((line, lIdx) => {
                    // Check bold **text**
                    let formatted = line;
                    
                    // Simple bullet points
                    const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
                    const cleanLine = isBullet ? line.trim().substring(2).trim() : line;

                    // Regex replace **
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    const codeRegex = /`(.*?)`/g;
                    
                    // Render line with bold / inline code
                    let finalNode: React.ReactNode = cleanLine;

                    // This is simple but robust enough for formatting
                    if (isBullet) {
                      return (
                        <div key={lIdx} className="pl-3 flex items-start gap-1.5">
                          <span className={`${isBot ? "text-sky-400" : "text-blue-200"} mt-1 text-[10px]`}>•</span>
                          <span dangerouslySetInnerHTML={{ 
                            __html: cleanLine
                              .replace(boldRegex, "<strong>$1</strong>")
                              .replace(codeRegex, "<code class='bg-[#080d16] border border-[#1a263d] text-amber-400 px-1 py-0.5 rounded font-mono text-[10.5px]'>$1</code>") 
                          }} />
                        </div>
                      );
                    }

                    return (
                      <p key={lIdx} dangerouslySetInnerHTML={{
                        __html: line
                          .replace(boldRegex, "<strong>$1</strong>")
                          .replace(codeRegex, "<code class='bg-[#080d16] border border-[#1a263d] text-amber-400 px-1 py-0.5 rounded font-mono text-[10.5px]'>$1</code>")
                      }} />
                    );
                  })}
                </div>
                <div className="text-[9px] text-slate-500 mt-1 text-right font-mono">{m.timestamp}</div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="w-7 h-7 rounded-full bg-[#162744] border border-blue-900 text-blue-400 flex items-center justify-center shrink-0 shadow animate-spin">
              <Loader2 className="w-4 h-4" />
            </div>
            <div className="p-3 bg-[#111c32] border border-[#1b2944] text-slate-400 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
              <span>Pensando y calculando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      {messages.length <= 2 && !isLoading && (
        <div className="px-4 pb-2 pt-1 border-t border-[#141d33] bg-[#090d17] space-y-1.5">
          <span className="text-[10px] text-slate-500 font-semibold font-sans tracking-wide uppercase block">Preguntas sugeridas:</span>
          <div className="flex flex-col gap-1">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputValue(qp.prompt);
                }}
                className="text-left w-full text-xs text-[#8da3cb] hover:text-white bg-[#101b31]/40 border border-[#1c2a49]/50 hover:bg-[#101b31] p-1.5 rounded transition-all flex items-center justify-between cursor-pointer group"
              >
                <span>{qp.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-[#1b2a47] bg-[#0d1527] flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Escribe tu duda estructural..."
          className="flex-1 bg-[#070b13] border border-[#1b2844] rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 text-ellipsis"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-850 disabled:text-slate-600 text-white transition-all shadow-md shadow-blue-950 cursor-pointer flex items-center justify-center shrink-0"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>
    </div>
  );
}
