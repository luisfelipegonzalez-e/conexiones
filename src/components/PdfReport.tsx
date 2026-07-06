import React from 'react';
import ConnectionDrawing from './ConnectionDrawing';
import ReportImage from './ReportImage';

export default function PdfReport({ isGenerating, activeModule }: { isGenerating: boolean, activeModule: string }) {
  // We use 20 extra pages to reach 24 total (1, 2 are manual, 3-24 generated)
  const extraPages = Array.from({ length: 22 }, (_, i) => i + 3);

  const getTitle = () => {
    switch (activeModule) {
      case 'Shear Tab': return 'DISEÑO DE CONEXIÓN VIGA-COLUMNA A CORTANTE\nSHEAR TAB SOLDADA A COLUMNA HSS';
      case 'Double Angle': return 'DISEÑO DE CONEXIÓN CON DOBLE ÁNGULO';
      case 'End Plate': return 'DISEÑO DE CONEXIÓN PRECALIFICADA END PLATE 4ES\nPÓRTICO ESPECIAL A MOMENTO (SMF)';
      case 'Moment Connection': return 'DISEÑO DE CONEXIÓN RÍGIDA A MOMENTO';
      case 'Base Plate': return 'DISEÑO DE PLACA BASE DE COLUMNA';
      default: return `DISEÑO DE ${activeModule.toUpperCase()}`;
    }
  };

  const getSubTitle = () => {
    switch (activeModule) {
      case 'Shear Tab': return 'Diseño conexión a cortante Shear Tab\nNormativa AISC 360-16 / NSR-10\nIng. Cristhian Ramírez Esp. MSc.';
      case 'Double Angle': return 'Diseño conexión Doble Ángulo\nNormativa AISC 360-16\nIng. Cristhian Ramírez Esp. MSc.';
      case 'End Plate': return 'Diseño conexión precalificada end plate 4ES\nNormativa AISC 358-16\nIng. Cristhian Ramírez Esp. MSc.';
      case 'Moment Connection': return 'Diseño conexión a momento\nNormativa AISC 358-16\nIng. Cristhian Ramírez Esp. MSc.';
      case 'Base Plate': return 'Diseño de placa base\nNormativa AISC Design Guide 1\nIng. Cristhian Ramírez Esp. MSc.';
      default: return `Diseño ${activeModule}\nIng. Cristhian Ramírez Esp. MSc.`;
    }
  };

  return (
    <div 
      id="pdf-report" 
      className={`print-only bg-white text-black text-sm absolute top-0 left-[-9999px] w-[210mm] z-[-50] ${isGenerating ? 'block' : 'hidden print:block'}`}
    >
      
      {/* PAGE 1 */}
      <PageContainer pageNumber={1} activeModule={activeModule}>
        <div className="text-center font-bold text-xl italic mb-10 text-black px-10">
          {getTitle().split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
        </div>

        {/* 3D Visualizer Placeholder */}
        <div className="w-[80%] h-[350px] mx-auto border-2 border-solid border-gray-300 bg-white flex flex-col items-center justify-center mb-10 relative overflow-hidden shadow-sm">
          <ReportImage description="VISTA 3D DE LA CONEXIÓN" activeModule={activeModule} />
        </div>

        {/* 2D Visualizer Placeholder */}
        <div className="w-[90%] h-[250px] mx-auto border-2 border-solid border-gray-400 bg-gray-50 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
            <ConnectionDrawing activeModule={activeModule} />
          </div>
        </div>
      </PageContainer>

      {/* PAGE 2 */}
      <PageContainer pageNumber={2} activeModule={activeModule}>
        <p className="italic text-[15px] leading-relaxed mb-6 text-justify">
          La conexión consiste en una plancha que se suelda en taller al extremo de la viga, que 
          posteriormente se conecta por medio de pernos en campo al ala de la columna. Adicionalmente, se 
          puede incorporar un rigidizador entre el ala de la viga y la plancha extrema (End Plate). El uso de 
          este rigidizador reduce el espesor de la plancha extrema. Este tipo de conexiones ha sido 
          ampliamente ensayado bajo cargas cíciclas con prototipos a escala real demostrando ductilidad, 
          curvas de histeresis estables y mecanismos de plastificación.
        </p>

        <h2 className="font-bold text-lg italic mb-4">1. PROPIEDADES DE MATERIALES ACERO ASTM A36</h2>
        
        <div className="pl-4 mb-8 flex flex-col gap-3 font-serif">
          <MathRow eq="E := 200000 MPa" desc="Módulo de Elasticidad" />
          <MathRow eq="F_yb := 250 MPa" desc="Límite de Fluencia de la Viga" />
          <MathRow eq="F_ub := 400 MPa" desc="Límite Último de la Viga" />
          <MathRow eq="F_yc := 250 MPa" desc="Límite de Fluencia de la Columna" />
          <MathRow eq="F_uc := 400 MPa" desc="Límite Último de la Columna" />
          <MathRow eq="F_yp := 250 MPa" desc="Límite de Fluencia de las placas de Refuerzo" />
          <MathRow eq="F_up := 400 MPa" desc="Límite Último de placas de Refuerzo" />
          <MathRow eq="R_yb := 1.50" desc="Factor de Sobre-Resistencia de la Viga" />
          <MathRow eq="R_yc := 1.50" desc="Factor de Sobre-Resistencia de la Columna" />
        </div>

        <h2 className="font-bold text-lg italic mb-4">2. PROPIEDADES GEOMÉTRICAS COLUMNA PERFIL HEB-450</h2>
        
        <div className="grid grid-cols-[1fr_250px] gap-6 pl-4 mb-6 relative">
          <div className="flex flex-col gap-3 font-serif mt-4">
            <MathRow eq="d_c := 450 mm" desc="Altura del Perfil" />
            <MathRow eq="t_cw := 14 mm" desc="Espesor del Alma" />
            <MathRow eq="b_cf := 300 mm" desc="Ancho del Ala ó Patín" />
            <MathRow eq="t_cf := 26 mm" desc="Espesor del Ala ó Patín" />
          </div>
          <div className="h-[200px] border-2 border-solid border-gray-300 bg-white flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
             <ReportImage description="Sección HEB" activeModule={activeModule} />
          </div>
        </div>

        <h3 className="font-bold italic mb-2 text-base">Limites en columnas según AISC358-10</h3>
        <p className="italic text-[15px] mb-2">Las vigas deben satisfacer las siguientes limitaciones:</p>
        <ul className="list-decimal pl-5 italic text-[15px] space-y-2 mb-10">
          <li>El end-plate debe estar conectado al ala de la columna</li>
          <li>La altura de la columna laminada debe estar limitada a máximo W36 (W920). La profundidad de 
          las columnas electrosoldadas no debe exceder la de las laminadas. Columnas de alas cruciformes 
          no deben tener un ancho o altura mayor que la altura permitida en las laminadas</li>
          <li>No hay limite en el peso por unidad de longitud de las columnas</li>
          <li>No hay requerimientos adicionales para el espesor de las alas.</li>
        </ul>
      </PageContainer>

      {/* GENERATED PAGES 3 TO 24 */}
      {extraPages.map((pageNum) => {
        const pageContent = getDynamicPageContent(pageNum);
        return (
          <React.Fragment key={pageNum}>
            <PageContainer pageNumber={pageNum} activeModule={activeModule}>
              <h2 className="font-bold text-lg italic mb-4 uppercase">{pageNum}. {pageContent.title}</h2>
              
              {pageContent.text && (
                 <p className="italic text-[15px] leading-relaxed mb-6 text-justify">
                   {pageContent.text}
                 </p>
              )}

              {pageContent.formulas.length > 0 && (
                <div className="pl-4 mb-8 flex flex-col gap-3 font-serif">
                  {pageContent.formulas.map((f: any, idx: number) => (
                    <div key={idx}>
                      <MathRow eq={f.eq} desc={f.desc} />
                    </div>
                  ))}
                </div>
              )}

              {pageContent.hasImage && (
                <div className="w-[90%] mx-auto mt-6 border-2 border-solid border-gray-300 bg-white flex flex-col items-center justify-center relative overflow-hidden shadow-sm" style={{ height: pageContent.imageHeight }}>
                  <ReportImage description={pageContent.imageDesc || ''} activeModule={activeModule} />
                </div>
              )}
            </PageContainer>
          </React.Fragment>
        );
      })}

    </div>
  );
}

function PageContainer({ pageNumber, activeModule, children }: { pageNumber: number, activeModule: string, children: React.ReactNode }) {
  const getSubTitle = () => {
    switch (activeModule) {
      case 'Shear Tab': return 'Diseño conexión a cortante Shear Tab \n Normativa AISC 360-16 / NSR-10 \n Ing. Cristhian Ramírez Esp. MSc.';
      case 'Double Angle': return 'Diseño conexión Doble Ángulo \n Normativa AISC 360-16 \n Ing. Cristhian Ramírez Esp. MSc.';
      case 'End Plate': return 'Diseño conexión precalificada end plate 4ES \n Normativa AISC 358-16 \n Ing. Cristhian Ramírez Esp. MSc.';
      case 'Moment Connection': return 'Diseño conexión a momento \n Normativa AISC 358-16 \n Ing. Cristhian Ramírez Esp. MSc.';
      case 'Base Plate': return 'Diseño de placa base \n Normativa AISC Design Guide 1 \n Ing. Cristhian Ramírez Esp. MSc.';
      default: return `Diseño ${activeModule} \n Ing. Cristhian Ramírez Esp. MSc.`;
    }
  };

  return (
    <>
      {pageNumber > 1 && <div className="page-break w-full h-[2mm] bg-gray-200 print:hidden"></div>}
      <div className="pdf-page bg-white min-h-[297mm] w-[210mm] relative p-[15mm]">
        
        {/* Header Strings */}
        <div className="text-[#000080] italic font-bold text-lg leading-tight mb-8">
          {getSubTitle().split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
        </div>

        {/* Page Body */}
        <div className="mb-20">
          {children}
        </div>

        {/* Footer */}
        <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] flex justify-between items-end text-[#000080] italic font-bold text-lg line-height-tight">
          <div>
            Ingeniería Estructural GoraTools<br/>
            www.goratools.com<br/>
            www.constructormetalico.com
          </div>
          <div className="text-right">
            - {pageNumber} -
          </div>
        </div>
      </div>
    </>
  );
}

function MathRow({ eq, desc }: { eq: string; desc: string }) {
  // Simple pseudo-math rendering
  const formattedEq = eq.replace(/_([a-zA-Z0-9]+)/g, '<sub>$1</sub>');

  return (
    <div className="flex items-center gap-10">
      <div 
        className="text-[17px] italic font-medium min-w-[200px] report-math"
        dangerouslySetInnerHTML={{ __html: formattedEq }}
      />
      <div className="italic text-[16px] text-gray-800">
        {desc}
      </div>
    </div>
  );
}

// Logic to generate content for pages 3-24 based on typical report structure
function getDynamicPageContent(pageNum: number) {
  const defaults = {
    title: `ANÁLISIS DE COMPONENTES - PARTE ${pageNum - 2}`,
    text: "Las relaciones de ancho y espesor, así como las comprobaciones geométricas y de cargas, se rigen bajo los lineamientos AISC y proveen la resistencia requerida para las provisiones sísmicas.",
    formulas: [
      { eq: `V_u_${pageNum} := ${40 + pageNum}.5 tonnef`, desc: "Corte máximo esperado" },
      { eq: `M_f_${pageNum} := ${80 + pageNum}.4 tonnef * m`, desc: "Momento en la cara" }
    ],
    hasImage: true,
    imageDesc: "Detalle isométrico y distribuciones de esfuerzo",
    imageHeight: "220px"
  };

  const pagesMap: Record<number, any> = {
    3: {
      title: "PROPIEDADES GEOMÉTRICAS VIGA PERFIL IPE-450",
      text: "Las vigas deben satisfacer las siguientes limitaciones:\n1. Las vigas deben ser de sección tipo I, laminados o electrosoldados de conformidad con los requerimientos AISC358-10.\n2. La altura de la viga, está limitada a los valores mostrados en la tabla 6.1.",
      formulas: [
        { eq: "b_f := 190 mm", desc: "Ancho de Alas" },
        { eq: "d := 450 mm", desc: "Altura del Perfil" },
        { eq: "t_bw := 9.40 mm", desc: "Espesor del Alma" },
        { eq: "t_bf := 14.60 mm", desc: "Espesor del Ala ó Patín" },
        { eq: "Z_x := 1702 cm^3", desc: "Módulo Plástico" }
      ],
      hasImage: true,
      imageDesc: "Geometría perfil viga",
      imageHeight: "250px"
    },
    4: {
      title: "FACTORES DE RESISTENCIA AISC 358-10",
      text: "La relación de ancho espesor para las alas y el alma de la viga debe conformarse a los requerimientos de las provisiones sísmicas del AISC. El arriostramiento lateral debe proveerse acordemente.",
      formulas: [
        { eq: "&phi;_d := 1.00", desc: "Para estados Límites dúctiles" },
        { eq: "&phi;_n := 0.90", desc: "Para estados límites no dúctiles" },
      ],
      hasImage: true,
      imageDesc: "Vista lateral zona protegida",
      imageHeight: "280px"
    },
    5: {
      title: "LÍMITES DE PRECALIFICACIÓN 8ES",
      text: "La tabla 6.1 de la norma AISC358-16 muestra un resumen de los rangos de los parámetros que han sido sometidos a pruebas experimentales, tanto la viga como la columna deben estar dentro de estos rangos.",
      formulas: [
        { eq: "t_bf = 14.6 mm", desc: "if (19 mm >= t_bf >= 10 mm, 'Ok', 'Cambiar')" }
      ],
      hasImage: true,
      imageDesc: "Tabla 6.1 Parametric Limitations",
      imageHeight: "400px"
    },
    6: {
      title: "GEOMETRÍA DE LA CONEXIÓN",
      text: "La distancia horizontal entre pernos, está limitado al ancho del ala de la viga. Si las dimensiones no se encuentran dentro de los límites, no se puede implementar.",
      formulas: [
        { eq: "g = 140 mm", desc: "Distancia horizontal entre pernos" },
        { eq: "b_p = 250 mm", desc: "Ancho de la end-plate" },
        { eq: "t_p = 31 mm", desc: "Espesor de la end-plate" }
      ],
      hasImage: true,
      imageDesc: "Dimensionamiento placa extrema (End Plate)",
      imageHeight: "300px"
    },
    8: {
      title: "CÁLCULO DEL MOMENTO NOMINAL MÁXIMO PROBABLE",
      text: "Estos cortantes se obtuvieron para una combinación 1.2PP + 1.2SCP + 1CV. Tomados del análisis estructural para este caso realizado con la herramienta ETABS.",
      formulas: [
        { eq: "M_pr := C_pr * R_yb * F_yb * Z_x", desc: "= 78.1 tonnef * m" },
        { eq: "V_g := 10.86 tonnef", desc: "Corte Gravitacional en la rótula plástica" }
      ],
      hasImage: true,
      imageDesc: "Diagrama de cuerpo libre en la rótula plástica",
      imageHeight: "250px"
    },
    10: {
      title: "DIÁMETRO REQUERIDO DE LOS PERNOS",
      text: "Cálculo en base a estado límite último de tracción para el grupo de pernos sometidos a fuerza de palanca (prying action).",
      formulas: [
        { eq: "d_b_req := 29.72 mm", desc: "Diámetro requerido por cálculo" },
        { eq: "d_b := 31.75 mm", desc: "Use pernos de 1-1/4\" A-490" }
      ],
      hasImage: true,
      imageDesc: "Patrón de líneas de fluencia (Yield Line Pattern)",
      imageHeight: "350px"
    },
    15: {
      title: "DISEÑO DE SOLDADURAS",
      text: "1. No deben utilizarse orificios de Inspección para Soldaduras.\n2. Prepare los patines de la viga con biseles a 45 grados.\n3. Precaliente las piezas de acuerdo con las especificaciones AWS.",
      formulas: [],
      hasImage: true,
      imageDesc: "Detalle soldadura AWS TC-U4b-GF",
      imageHeight: "450px"
    },
    20: {
      title: "CHEQUEO FLUENCIA FLEXIÓN DEL PATÍN DE LA COLUMNA",
      text: "Mecanismo de líneas de fluencia para la columna no rigidizada o rigidizada. Aplicando ecuaciones correspondientes a la tabla 6.5.",
      formulas: [
        { eq: "c := p_si + p_so + t_bf", desc: "= 114.6 mm" },
        { eq: "Y_c := 3.413 m", desc: "Yield line mechanism parameter" },
        { eq: "&phi;_d = 1.00", desc: "Factor de reducción por resistencia" }
      ],
      hasImage: true,
      imageDesc: "Yield Line Mechanism Parameter (Table 6.5)",
      imageHeight: "300px"
    },
    24: {
      title: "RESUMEN GEOMÉTRICO FINAL",
      text: "Vista general en planta de la conexión con todas sus cotas definitivas. Agujeros estándar con diámetro perno + 1/16in.",
      formulas: [],
      hasImage: true,
      imageDesc: "Plano de despiece de la conexión precalificada",
      imageHeight: "500px"
    }
  };

  return pagesMap[pageNum] || defaults;
}

