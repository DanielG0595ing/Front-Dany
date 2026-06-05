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

      {/* 📡 PIE DE PÁGINA CLANDESTINO (PROTOCOLO OMEGA HOMOLOGADO) */}
<footer className="fixed bottom-0 left-0 w-full bg-[#000400] border-t border-[#004400] p-2 md:px-6 text-[8px] md:text-[10px] flex flex-col md:flex-row justify-between items-center z-50 text-center gap-2 md:gap-0 shadow-[0_-5px_20px_rgba(0,255,0,0.1)] backdrop-blur-md font-mono">
  
  {/* LADO IZQUIERDO: LICENCIA Y DOCUMENTOS OMEGA */}
  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
    <p className="text-[#00FF00] font-bold tracking-widest uppercase opacity-80">
      &gt; TERMINAL V3.0 // LICENCIA VIP: ING. CIVIL DANIEL GARCÍA
    </p>
    <div className="flex gap-3 text-[#00AA00] font-black">
      {/* Rutas configuradas hacia la carpeta /public/docs/ de Next.js */}
      <a href="/docs/MALETIN_NUCLEAR.md" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline decoration-[#00FF00] transition-colors border border-transparent hover:border-[#00FF00] px-1">
        [ ☢️ MALETÍN NUCLEAR ]
      </a>
      <a href="/accs/MANUAL-DE-OPERACION.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline decoration-[#00FF00] transition-colors border border-transparent hover:border-[#00FF00] px-1">
        [ 📖 MANUAL DE CAMPO ]
      </a>
    </div>
  </div>

  {/* LADO DERECHO: FIRMA BIOGRÁFICA */}
  <div className="text-[#008800] italic tracking-wider mt-1 md:mt-0">
    DESARROLLADO EN LAS SOMBRAS POR <a href="https://cyberenterados.github.io/ManuExplora-Dossier_identidad/" target="_blank" rel="noopener noreferrer" className="text-[#00FF00] font-black not-italic hover:bg-[#00FF00] hover:text-black px-1 transition-all drop-shadow-[0_0_5px_#00FF00]">@MANUEXPLORA</a> & BASE IA
  </div>
</footer>

    </AccesoRestringido>
  );
}