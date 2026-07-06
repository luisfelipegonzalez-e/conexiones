import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import InputForms from './components/InputForms';
import MainView from './components/MainView';
import ResultsPanel from './components/ResultsPanel';
import PdfReport from './components/PdfReport';
import BeamCalculator from './beam-module/App';
import CombinationsModule from './components/modules/CombinationsModule';
import ColumnsModule from './components/modules/ColumnsModule';
import PlaceholderModule from './components/PlaceholderModule';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';

export default function App() {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeModule, setActiveModule] = useState('Shear Tab');

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    
    // Give React a moment to render the PDF component
    setTimeout(async () => {
      try {
        const pages = document.querySelectorAll('.pdf-page');
        const pdf = new jsPDF("p", "mm", "a4");

        for (let i = 0; i < pages.length; i++) {
          const pageEl = pages[i] as HTMLElement;
          
          // Use html-to-image which delegates rendering to the browser's native engine
          const imgData = await toJpeg(pageEl, { quality: 1.0, pixelRatio: 2 });
          
          if (i > 0) {
            pdf.addPage();
          }
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (pageEl.clientHeight * pdfWidth) / pageEl.clientWidth;
          
          pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
        }
        
        pdf.save("reporte_conexion_end_plate.pdf");
      } catch (error) {
        console.error("Error generating PDF:", error);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 500); // small delay to ensure DOM is ready
  };

  const isConnectionModule = ['Shear Tab', 'Double Angle', 'End Plate', 'Moment Connection', 'Base Plate'].includes(activeModule);

  return (
    <div className="flex h-screen bg-[#0b1121] text-gray-200 font-sans overflow-hidden">
      <div className="print-hidden flex w-full h-full">
        <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
        {activeModule === 'Vigas' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <BeamCalculator />
          </div>
        ) : activeModule === 'Combinaciones' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <CombinationsModule />
          </div>
        ) : activeModule === 'Columnas' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <ColumnsModule />
          </div>
        ) : isConnectionModule ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Header onExportPdf={handleExportPdf} isGeneratingPdf={isGeneratingPdf} activeModule={activeModule} />
            <div className="flex-1 overflow-auto p-4 flex gap-4 h-full">
              <InputForms activeModule={activeModule} />
              <MainView onExportPdf={handleExportPdf} isGeneratingPdf={isGeneratingPdf} activeModule={activeModule} />
              <ResultsPanel activeModule={activeModule} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
             <PlaceholderModule moduleName={activeModule} />
          </div>
        )}
      </div>
      <PdfReport isGenerating={isGeneratingPdf} activeModule={activeModule} />
    </div>
  );
}
