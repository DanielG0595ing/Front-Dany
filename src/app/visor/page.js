"use client";
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import AccesoRestringido from '../../components/AccesoRestringido';
import EscanerGeologico from '../../components/EscanerGeologico'; 
import dynamic from 'next/dynamic';

// 🛡️ CARGA DINÁMICA: EVADE EL ERROR SSR
const MapaSatelital = dynamic(() => import('../../components/MapaSatelital'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-[#00FF00] bg-black text-[#00FF00] font-mono animate-pulse uppercase tracking-widest text-xs">Alineando Satélites...</div>
});

export default function VisorOperativo() {
  
  // 🎯 MIRILLA DEL FRANCOTIRADOR
  const reporteGlobalRef = useRef(null);

  // 💥 GATILLO DE EXPORTACIÓN A4
  const dispararReporteGlobal = useReactToPrint({
    contentRef: reporteGlobalRef,
    documentTitle: 'Reporte_Geotecnico_Ing_Garcia_V5',
  });

  return (
    // 🛡️ ESCUDO PERIMETRAL: SOLO EL ING. GARCÍA TIENE LA CLAVE
    <AccesoRestringido>
      <div className="min-h-screen bg-black flex flex-col p-4 gap-4 font-mono">
        
        {/* 🛂 CABECERA DE AUTORIDAD Y BOTÓN DE FUEGO GLOBAL */}
        <header className="border-b border-[#00FF00] pb-2 flex flex-col md:flex-row justify-between md:items-end gap-2">
          <div>
            <h1 className="text-[#00FF00] text-xl uppercase font-black tracking-widest">&gt;_ PANEL DE INTELIGENCIA CIVIL</h1>
            <p className="text-[#00AA00] text-[10px]">AUTORIZACIÓN NIVEL 5: <span className="text-white font-bold">ING. DANIEL GARCÍA</span></p>
          </div>
          
          <button 
            onClick={dispararReporteGlobal} 
            className="text-[10px] md:text-xs bg-[#002200] text-[#00FF00] border-2 border-[#00FF00] px-4 py-2 hover:bg-[#00FF00] hover:text-black transition-colors font-black uppercase tracking-wider shadow-[0_0_10px_rgba(0,255,0,0.4)]"
          >
            [ 📄 EXPORTAR INFORME TÉCNICO GLOBAL ]
          </button>
        </header>

        {/* 📸 ÁREA DE CAPTURA DEL PDF: 
            print:block -> Desactiva el flex para que el PDF no recorte hojas.
            print:overflow-visible -> Permite que el contenido fluya a la página 2.
        */}
        <div ref={reporteGlobalRef} className="flex flex-col gap-4 bg-black p-1 print:block print:p-0 print:overflow-visible">
          
          {/* 🗺️ SECTOR A: EL RADAR PRINCIPAL */}
          {/* CORRECCIÓN MÓVIL: h-[1000px] da espacio letal para que no se aplasten las coordenadas. 
              CORRECCIÓN PDF: print:h-[260mm] fuerza que ocupe exactamente la primera hoja A4. 
          */}
          <div className="h-[1000px] md:h-[70vh] print:h-[260mm] print:overflow-hidden w-full border border-[#003300]">
            <MapaSatelital />
          </div>

          {/* 🌋 SECTOR B: EL ESCÁNER SUBTERRÁNEO */}
          {/* CORRECCIÓN PDF: print:break-before-page obliga al navegador a imprimir esto en la PÁGINA 2. */}
          <div className="w-full print:break-before-page print:pt-8 print:mt-4">
            <EscanerGeologico />
          </div>

        </div>

      </div>
    </AccesoRestringido>
  );
}