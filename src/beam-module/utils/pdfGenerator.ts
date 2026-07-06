import { jsPDF } from "jspdf";

export interface PDFBeamData {
  // Input Geometry
  b: number;
  h: number;
  r: number;
  beamLength: number;
  supportCondition: "simple" | "cantilever" | "fixed";
  
  // Materials
  fc: number;
  fy: number;
  fyt: number;
  
  // Steel area
  numBars: number;
  barName: string;
  barDiameter: number;
  asCalculated: number;
  customAsEnabled: boolean;
  
  // Stirrups
  stirrupName: string;
  stirrupDiameter: number;
  stirrupSpacing: number;
  stirrupLegs: number;
  
  // Loads
  deadLoad: number;
  liveLoad: number;
  mu: number;
  vu: number;
  
  // Calculations
  d: number;
  rho: number;
  rhoMin: number;
  rhoMax: number;
  phiFlexure: number;
  Mn: number;
  phiMn: number;
  Vc: number;
  Vs: number;
  phiVn: number;
  maxSpacing: number;
  I_g: number;
  I_cr: number;
  I_e: number;
  Mcr: number;
  Ma: number;
  delta_im: number;
  delta_live: number;
  delta_total: number;
  limit_live: number;
  limit_total: number;
  
  // Statuses
  flexureStatus: boolean;
  shearStatus: boolean;
  steelRatioValid: boolean;
  shearSpacingValid: boolean;
  deflectionStatus: boolean;
}

export function generateBeamPDF(data: PDFBeamData) {
  // Initialize dynamic A4 PDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Color Definitions (Engineering Palette)
  const primaryColor = [15, 23, 42];    // #0f172a Deep Slate Blue
  const secondaryColor = [3, 105, 161];  // #0369a1 Steel Blue
  const textColor = [51, 65, 85];       // #334155 Charcoal Slate
  const lightBgColor = [248, 250, 252];  // #f8fafc Soft off-white
  const accentGreen = [16, 185, 129];    // #10b981 Safe Green
  const accentRed = [239, 68, 68];      // #ef4444 Danger Red
  const lineGrey = [226, 232, 240];     // #e2e8f0 Light grey

  // Helper function to draw standard grid blocks or rows
  const drawHeader = (pageNumber: number) => {
    // Top banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 15, "F");
    
    // Header title
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("MEMORIA DE CÁLCULO ESTRUCTURAL • ACI-318", 15, 10);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Página ${pageNumber} de 2`, 180, 10);
    
    // Decorative sky blue accent line underneath
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(0, 15, 210, 2, "F");
  };

  const drawFooter = () => {
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Memoria generada de forma automatizada. Válido para revisiones preliminares de diseño estructural según norma ACI 318.", 15, 285);
    doc.text("Desarrollado en la Plataforma Civil-CAD AI Assistant.", 150, 285);

    // subtle thin bottom line
    doc.setDrawColor(lineGrey[0], lineGrey[1], lineGrey[2]);
    doc.line(15, 281, 195, 281);
  };

  // --- PAGE 1: CALCULATIONS REPORT ---
  drawHeader(1);

  // Main Document Title
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.text("MEMORIA DE DISEÑO: VIGAS REFORZADAS", 15, 27);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Módulo Especializado de Vigas Rectangulares de Concreto Armado", 15, 32);

  // metadata box (Right-hand side top)
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(130, 21, 65, 22, "F");
  doc.setDrawColor(lineGrey[0], lineGrey[1], lineGrey[2]);
  doc.rect(130, 21, 65, 22, "S");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("DATOS DEL PROYECTO:", 133, 25);
  
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  const currentDate = new Date().toLocaleDateString("es-ES", {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  doc.text(`Fecha: ${currentDate}`, 133, 29);
  doc.text(`Normativa: ACI 318-19`, 133, 33);
  doc.text(`Diseñador: Software Auxiliar IA`, 133, 37);
  doc.text(`Proyecto: Viga V-101`, 133, 41);

  // Status Summary Bar
  const isGlobalPassed = data.flexureStatus && data.shearStatus && data.steelRatioValid && data.shearSpacingValid && data.deflectionStatus;
  doc.setFillColor(isGlobalPassed ? 236 : 254, isGlobalPassed ? 253 : 243, isGlobalPassed ? 245 : 242); // bg light green or amber
  doc.rect(15, 48, 180, 12, "F");
  doc.setDrawColor(isGlobalPassed ? accentGreen[0] : 245, isGlobalPassed ? accentGreen[1] : 158, isGlobalPassed ? accentGreen[2] : 11); // border
  doc.rect(15, 48, 180, 12, "S");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(isGlobalPassed ? accentGreen[0] : 180, isGlobalPassed ? accentGreen[1] : 83, isGlobalPassed ? accentGreen[2] : 9);
  const statusMessage = isGlobalPassed 
    ? "✓ EL DISEÑO CUMPLE SATISFACTORIAMENTE CON TODOS LOS ESTADOS LÍMITES" 
    : "⚠ EL DISEÑO REQUIERE REVISIÓN (SUPERA ALGÚN LÍMITE ADMISIBLE)";
  doc.text(statusMessage, 20, 56);

  // --- SECTION 1: GEOMETRY AND MATERIALS ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.rect(15, 65, 180, 6, "F");
  doc.text("1. PARÁMETROS GEOMÉTRICOS Y PROPIEDADES DE MATERIALES", 18, 69.5);

  let y = 74;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("GEOMETRÍA SECCIÓN", 15, y);
  doc.text("PROPIEDADES DE MATERIALES", 115, y);

  y += 5;
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  // Geometry table-like look details
  doc.text(`Ancho de la Viga (b): ${data.b} mm`, 15, y);
  doc.text(`Resistencia Concreto (f'c): ${data.fc} MPa`, 115, y);
  
  y += 4;
  doc.text(`Peralte Total (h): ${data.h} mm`, 15, y);
  doc.text(`Fluencia Acero Long. (fy): ${data.fy} MPa`, 115, y);

  y += 4;
  doc.text(`Recubrimiento Neto (r): ${data.r} mm`, 15, y);
  doc.text(`Fluencia Estribos (fyt): ${data.fyt} MPa`, 115, y);

  y += 4;
  doc.text(`Peralte Efectivo Calculado (d): ${data.d.toFixed(1)} mm`, 15, y);
  doc.text(`Módulo Elasticidad Concreto (Ec): ${Math.round(4700 * Math.sqrt(data.fc))} MPa`, 115, y);

  // --- SECTION 2: STEEL REINFORCEMENT CONFIG ---
  y += 8;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.rect(15, y, 180, 6, "F");
  doc.text("2. ARMADURA CORRESPONDIENTE DE DISEÑO", 18, y + 4.5);

  y += 11;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("REFUERZO A FLEXIÓN (LONGITUDINAL)", 15, y);
  doc.text("REFUERZO A CORTANTE (TRANSVERSAL)", 115, y);

  y += 5;
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  const formattedAs = data.customAsEnabled 
    ? `Área de acero manual / personalizada: ${data.asCalculated.toFixed(1)} mm²`
    : `Varillas colocadas: ${data.numBars} de varilla tipo ${data.barName} (${data.barDiameter} mm)`;
  doc.text(formattedAs, 15, y);
  doc.text(`Estribos utilizados: ${data.stirrupName} (Ø ${data.stirrupDiameter} mm)`, 115, y);
  
  y += 4;
  doc.text(`Área de Acero Colocada (As): ${data.asCalculated.toFixed(1)} mm²`, 15, y);
  doc.text(`Ramas de cortante (Av): ${data.stirrupLegs} ramas`, 115, y);

  y += 4;
  doc.text(`Cuantía de Acero Efectiva (ρ): ${(data.rho * 100).toFixed(3)}%`, 15, y);
  doc.text(`Espaciamiento de Estribos (s): ${data.stirrupSpacing} mm`, 115, y);

  // --- SECTION 3: DEMANDS AND LOADS ---
  y += 8;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.rect(15, y, 180, 6, "F");
  doc.text("3. ESTADOS DE SOLICITACIÓN Y CARGAS", 18, y + 4.5);

  y += 11;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("DEMANDAS ÚLTIMAS MAYORADAS (LFD)", 15, y);
  doc.text("CARGAS DE SERVICIO IMPUESTAS", 115, y);

  y += 5;
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Momento Último Demandado (Mu): ${data.mu.toFixed(1)} kN·m`, 15, y);
  doc.text(`Carga Muerta No Facturada (wd): ${data.deadLoad.toFixed(1)} kN/m`, 115, y);

  y += 4;
  doc.text(`Cortante Último Demandado (Vu): ${data.vu.toFixed(1)} kN`, 15, y);
  doc.text(`Carga Viva No Facturada (wl): ${data.liveLoad.toFixed(1)} kN/m`, 115, y);

  y += 4;
  doc.text(`Condición de Apoyo: ${data.supportCondition === "simple" ? "Simplemente Apoyada" : data.supportCondition === "cantilever" ? "En Voladizo" : "Doble Empotrada"}`, 15, y);
  doc.text(`Longitud del Tramo de Viga (L): ${data.beamLength.toFixed(2)} m`, 115, y);

  // --- SECTION 4: DETAILED VERIFICATION ---
  y += 8;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.rect(15, y, 180, 6, "F");
  doc.text("4. CUADRO RESUMEN DE COMPROBACIONES DE DISEÑO (ACI 318)", 18, y + 4.5);

  y += 10;
  // Let's draw a nice table of results
  // Columns: Chequeo | Criterio de Diseño | Valor Calculado | Límite Normativo | Resultado
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(15, y, 180, 7, "F");
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Verificación Estructural", 18, y + 4.5);
  doc.text("Criterio Requerido", 58, y + 4.5);
  doc.text("Calculado", 95, y + 4.5);
  doc.text("Límite ACI", 135, y + 4.5);
  doc.text("Dictamen", 170, y + 4.5);

  // Draw thin border under header
  doc.setDrawColor(textColor[0], textColor[1], textColor[2]);
  doc.setLineWidth(0.3);
  doc.line(15, y + 7, 195, y + 7);

  const drawRow = (title: string, criterion: string, calculated: string, limit: string, isOk: boolean, rowY: number) => {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(title, 18, rowY + 5);
    doc.text(criterion, 58, rowY + 5);
    doc.text(calculated, 95, rowY + 5);
    doc.text(limit, 135, rowY + 5);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(isOk ? accentGreen[0] : accentRed[0], isOk ? accentGreen[1] : accentRed[1], isOk ? accentGreen[2] : accentRed[2]);
    doc.text(isOk ? "✓ CUMPLE" : "✗ RELEVANTE", 170, rowY + 5);

    // separator line
    doc.setDrawColor(lineGrey[0], lineGrey[1], lineGrey[2]);
    doc.setLineWidth(0.15);
    doc.line(15, rowY + 8, 195, rowY + 8);
  };

  y += 7;
  drawRow("Momento Flector", "Mu <= phi*Mn", `${data.mu.toFixed(1)} kN·m`, `Resiste: ${data.phiMn.toFixed(1)} kN·m`, data.flexureStatus, y); y += 8;
  drawRow("Fuerza Cortante", "Vu <= phi*Vn", `${data.vu.toFixed(1)} kN`, `Resiste: ${data.phiVn.toFixed(1)} kN`, data.shearStatus, y); y += 8;
  drawRow("Cuantía Mínima", "rho >= rhoMin", `${(data.rho * 100).toFixed(3)}%`, `>= ${(data.rhoMin * 100).toFixed(3)}%`, data.rho >= data.rhoMin, y); y += 8;
  drawRow("Cuantía Máxima", "rho <= rhoMax", `${(data.rho * 100).toFixed(3)}%`, `<= ${(data.rhoMax * 100).toFixed(3)}%`, data.rho <= data.rhoMax, y); y += 8;
  drawRow("Estribos s_max", "s <= s_max", `${data.stirrupSpacing} mm`, `<= ${Math.round(data.maxSpacing)} mm`, data.shearSpacingValid, y); y += 8;
  drawRow("Admisible L/360", "F.viva <= L/360", `${data.delta_live.toFixed(2)} mm`, `<= ${data.limit_live.toFixed(1)} mm`, data.delta_live <= data.limit_live, y); y += 8;
  drawRow("Admisible L/240", "F.total <= L/240", `${data.delta_total.toFixed(2)} mm`, `<= ${data.limit_total.toFixed(1)} mm`, data.delta_total <= data.limit_total, y);

  drawFooter();


  // --- PAGE 2: STRUCTURAL DRAWINGS & PLANS ---
  doc.addPage();
  drawHeader(2);

  // Page 2 Title
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.text("PLANOS Y DETALLES CONSTRUCTIVOS DE LA SECCIÓN", 15, 27);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text("Representaciones gráficas escala técnica y paramétricas del elemento estructural viga.", 15, 32);

  // SECTION GRAPHICS 1: PROFILE ELEVATION (PERFIL LONGITUDINAL)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.rect(15, 38, 180, 6, "F");
  doc.text("PLANO E-01: ELEVACIÓN LONGITUDINAL DE LA VIGA", 18, 42.5);

  // Drawing Canvas area for Elevation (Y: 48 to 138 - 90mm tall box)
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(15, 48, 180, 85, "F");
  doc.setDrawColor(lineGrey[0], lineGrey[1], lineGrey[2]);
  doc.setLineWidth(0.2);
  doc.rect(15, 48, 180, 85, "S");

  // Draw distributed load representation ws
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(0.4);
  
  // horizontal force bar
  doc.line(35, 62, 175, 62);
  // vertical tiny load arrows pointing down
  for (let i = 0; i <= 14; i++) {
    const arrowX = 35 + i * 10;
    doc.line(arrowX, 62, arrowX, 67);
    // tiny arrow heads
    doc.line(arrowX - 1.5, 65, arrowX, 67);
    doc.line(arrowX + 1.5, 65, arrowX, 67);
  }
  doc.setFont("Helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`W service = ${(data.deadLoad + data.liveLoad).toFixed(1)} kN/m  (Wd = ${data.deadLoad.toFixed(0)} + Wl = ${data.liveLoad.toFixed(0)})`, 72, 57);

  // Draw main beam rectangle profile
  doc.setFillColor(212, 224, 235); // solid concrete visual color
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.8);
  doc.rect(33, 67, 144, 25, "FD"); // 144mm width represents length L, h is 25mm scaled

  // Drawing supports under beam based on support condition
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.7);
  if (data.supportCondition === "simple") {
    // Left Support - Hinged Triangle
    doc.line(31, 99, 39, 99);
    doc.line(31, 99, 35, 92);
    doc.line(39, 99, 35, 92);
    // hatch lines
    doc.line(29, 101, 41, 101);
    for (let hx = 30; hx <= 40; hx += 2) {
      doc.line(hx, 101, hx - 1, 103);
    }

    // Right Support - Roller Triangle/Circles
    doc.line(171, 99, 179, 99);
    doc.line(171, 99, 175, 92);
    doc.line(179, 99, 175, 92);
    // roller line separate
    doc.line(169, 101, 181, 101);
    for (let hx = 170; hx <= 180; hx += 2) {
      doc.line(hx, 101, hx - 1, 103);
    }
  } else if (data.supportCondition === "cantilever") {
    // Left Support - Heavy rigid Fixed Wall
    doc.setFillColor(100, 116, 139);
    doc.rect(26, 62, 7, 36, "F");
    doc.line(33, 62, 33, 98);
    // hatch lines on wall
    for (let wy = 64; wy <= 96; wy += 4) {
      doc.line(26, wy, 31, wy + 2);
    }
    // right end floating
    doc.setFontSize(8);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text("Extremo Libre", 160, 99);
  } else if (data.supportCondition === "fixed") {
    // Dual rigid walls (both side)
    doc.setFillColor(100, 116, 139);
    doc.rect(26, 62, 7, 36, "F");
    doc.line(33, 62, 33, 98);
    for (let wy = 64; wy <= 96; wy += 4) { doc.line(26, wy, 31, wy + 2); }

    doc.rect(177, 62, 7, 36, "F");
    doc.line(177, 62, 177, 98);
    for (let wy = 64; wy <= 96; wy += 4) { doc.line(177, wy + 2, 182, wy); }
  }

  // Draw internal reinforcement bars (drawn inside beam as deep red line)
  doc.setDrawColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.setLineWidth(1.2);
  
  // Longitudinal tension bars at bottom
  doc.line(35, 87, 175, 87);
  // Anchor hooks representation (90 degrees bend hooks up)
  doc.line(35, 87, 35, 81);
  doc.line(175, 87, 175, 81);

  // If fixed support or cantilever, add top reinforcement steel lines because of negative moment zone
  if (data.supportCondition === "fixed" || data.supportCondition === "cantilever") {
    doc.setDrawColor(accentRed[0], accentRed[1], accentRed[2]);
    doc.setLineWidth(1.0);
    // Draw top bars representing typical tension reinforcement next to columns
    doc.line(35, 72, 85, 72); // left top zone
    doc.line(35, 72, 35, 78); // anchor down
    if (data.supportCondition === "fixed") {
      doc.line(125, 72, 175, 72); // right top zone
      doc.line(175, 72, 175, 78); // anchor down
    }
  }

  // Draw spacing or stirrups inside the beam (vertical faint grey lines)
  doc.setDrawColor(148, 163, 184); // slate-300
  doc.setLineWidth(0.35);
  // Draw typical stirrups spaced along the beam length
  for (let sx = 40; sx <= 170; sx += 8) {
    doc.line(sx, 70, sx, 90);
  }

  // Dimensions & labels
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Viga Prismática L = ${data.beamLength.toFixed(2)} m (${data.b}x${data.h} mm)`, 70, 78);

  // Dimension line for Length L
  doc.setDrawColor(47, 85, 105);
  doc.setLineWidth(0.3);
  doc.line(33, 112, 177, 112); // main horizontal dim line
  doc.line(33, 109, 33, 115);  // left tick
  doc.line(177, 109, 177, 115); // right tick
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`LONGITUD TOTAL DE VIGA L = ${data.beamLength.toFixed(2)} m`, 82, 118);

  // Text markings for plan details
  doc.setFontSize(7.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont("Helvetica", "normal");
  doc.text(`Refuerzo longitudinal: ${data.customAsEnabled ? "As manual" : `${data.numBars} Ø ${data.barDiameter}mm`}` , 42, 126);
  doc.text(`Refuerzo transversal: Estribos Ø ${data.stirrupDiameter}mm @ ${data.stirrupSpacing} mm` , 118, 126);


  // SECTION GRAPHICS 2: SECTION CROSS DETAIL (DETALLE DE LA SECCIÓN)
  y = 138;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.rect(15, y, 180, 6, "F");
  doc.text("PLANO E-02: SECCIÓN TRANSVERSAL RECTANGULAR DE CONCRETO", 18, y + 4.5);

  // Canvas area for Cross Section (Y: 144 to 270 - 126mm tall box)
  y += 6;
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(15, y, 180, 128, "F");
  doc.setDrawColor(lineGrey[0], lineGrey[1], lineGrey[2]);
  doc.setLineWidth(0.2);
  doc.rect(15, y, 180, 128, "S");

  // Middle point coordinates: center of cross section
  const cx = 105;
  const cy = y + 62;
  const sWidth = 52; // scaled width for b (52 mm is representing 300mm standard)
  const sHeight = 84; // scaled height for h (84 mm representing 500mm standard)

  // Draw concrete shaded big rectangle
  doc.setFillColor(226, 232, 240); // very soft grey concrete shade
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(1.2);
  doc.rect(cx - sWidth / 2, cy - sHeight / 2, sWidth, sHeight, "FD");

  // Draw stirrup loop inside (offset inside concrete boundary representing cover free)
  const scover = (data.r / data.h) * sHeight; // scaled cover
  const stirrupW = sWidth - scover * 2;
  const stirrupH = sHeight - scover * 2;
  // draw closed dashed line for stirrup
  doc.setDrawColor(79, 70, 229); // indigo blue stirrup loop
  doc.setLineWidth(0.85);
  doc.setLineDashPattern([2.0, 1.5], 0);
  doc.rect(cx - stirrupW / 2, cy - stirrupH / 2, stirrupW, stirrupH, "S");
  doc.setLineDashPattern([], 0); // Reset dashes
  
  // Draw circles for 4 longitudinal bars in the corners of stirrups
  const rebarR = 2.4; // circle radius relative to section scale
  doc.setFillColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.setDrawColor(153, 27, 27); // dark crimson rim
  doc.setLineWidth(0.4);

  // Position of corner rebars
  const bxLeft = cx - stirrupW/2 + rebarR + 0.3;
  const bxRight = cx + stirrupW/2 - rebarR - 0.3;
  const byTop = cy - stirrupH/2 + rebarR + 0.3;
  const byBottom = cy + stirrupH/2 - rebarR - 0.3;

  // Let's draw rebars at bottom corners (Primary steel)
  doc.circle(bxLeft, byBottom, rebarR, "FD");
  doc.circle(bxRight, byBottom, rebarR, "FD");
  
  // If we have more than 2 bars, spread them in bottom layer
  if (!data.customAsEnabled && data.numBars > 2) {
    const barsCount = data.numBars;
    const spacingStep = (bxRight - bxLeft) / (barsCount - 1);
    for (let i = 1; i < barsCount - 1; i++) {
      const midBarX = bxLeft + i * spacingStep;
      doc.circle(midBarX, byBottom, rebarR, "FD");
    }
  } else if (data.customAsEnabled) {
    // custom steel represented with 3 generic bottom bars
    doc.circle((bxLeft + bxRight) / 2, byBottom, rebarR, "FD");
  }

  // Draw 2 hanger thin bars at top corners (standard structural hangers for stirrup support)
  doc.setFillColor(100, 116, 139); // grey auxiliary color
  doc.setDrawColor(71, 85, 105);
  doc.circle(bxLeft, byTop, rebarR - 0.4, "FD");
  doc.circle(bxRight, byTop, rebarR - 0.4, "FD");

  // Structural Dimension Annotations
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.3);

  // Height 'h' dimension line (drawn at Left side of section)
  const dimX = cx - sWidth/2 - 12;
  doc.line(dimX, cy - sHeight/2, dimX, cy + sHeight/2); // vertical line
  doc.line(dimX - 3, cy - sHeight/2, dimX + 3, cy - sHeight/2); // ticks
  doc.line(dimX - 3, cy + sHeight/2, dimX + 3, cy + sHeight/2);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  // display 'h' vertical text
  // We can write it normal rotated or normal printed nearby
  doc.text(`h = ${data.h} mm`, dimX - 18, cy + 1.5);

  // Width 'b' dimension line (drawn at bottom of section)
  const dimY = cy + sHeight/2 + 10;
  doc.line(cx - sWidth/2, dimY, cx + sWidth/2, dimY); // horizontal line
  doc.line(cx - sWidth/2, dimY - 3, cx - sWidth/2, dimY + 3);  // ticks
  doc.line(cx + sWidth/2, dimY - 3, cx + sWidth/2, dimY + 3);
  doc.text(`b = ${data.b} mm`, cx - 11, dimY + 7);

  // Label arrows pointing to rebar parts
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.4);
  
  // Arrow for Primary Longitudinal Steel
  doc.line(cx + stirrupW/4, cy + sHeight/2 - 5, cx + sWidth/2 + 15, cy + sHeight/2 + 15);
  doc.line(cx + stirrupW/4 - 1.5, cy + sHeight/2 - 6, cx + stirrupW/4, cy + sHeight/2 - 5); // arrow head
  doc.line(cx + stirrupW/4 + 1.0, cy + sHeight/2 - 7, cx + stirrupW/4, cy + sHeight/2 - 5);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Acero Longitudinal As", cx + sWidth/2 + 17, cy + sHeight/2 + 14);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Área: ${data.asCalculated.toFixed(1)} mm²`, cx + sWidth/2 + 17, cy + sHeight/2 + 18);
  doc.text(`Cuantía: ${(data.rho * 100).toFixed(3)}%`, cx + sWidth/2 + 17, cy + sHeight/2 + 22);

  // Arrow for Stirrups
  doc.setDrawColor(79, 70, 229);
  doc.line(cx + stirrupW/2 - 4, cy - stirrupH/3, cx + sWidth/2 + 15, cy - stirrupH/3);
  doc.circle(cx + stirrupW/2, cy - stirrupH/3, 0.7, "FD"); // anchor point circle
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Recinto de Estribos (Av)", cx + sWidth/2 + 17, cy - stirrupH/3 + 1);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Estribos ${data.stirrupName}`, cx + sWidth/2 + 17, cy - stirrupH/3 + 5);
  doc.text(`${data.stirrupLegs} ramas c/ ${data.stirrupSpacing} mm`, cx + sWidth/2 + 17, cy - stirrupH/3 + 9);

  // Arrow for Concrete Cover (r)
  doc.setDrawColor(30, 41, 59);
  doc.line(cx - sWidth/2 + 2, cy - sHeight/2 + 3, cx - sWidth/2 - 25, cy - sHeight/2 - 12);
  doc.circle(cx - sWidth/2 + 2, cy - sHeight/2 + 3, 0.7, "FD");
  doc.setFont("Helvetica", "bold");
  doc.text(`Recubrimiento libre r = ${data.r} mm`, cx - sWidth/2 - 62, cy - sHeight/2 - 12);
  doc.setFont("Helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text("(Asegura durabilidad y adherencia)", cx - sWidth/2 - 62, cy - sHeight/2 - 8);

  drawFooter();

  // Save/Download the built PDF
  doc.save(`Memoria_Calculo_Viga_C101_${data.supportCondition}.pdf`);
}
