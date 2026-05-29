"use client";
import AccesoRestringido from '../../components/AccesoRestringido';
import dynamic from 'next/dynamic';

// 🛡️ CARGA DINÁMICA: EVADE EL ERROR DE RENDERIZADO DEL SERVIDOR (SSR)
const MapaSatelital = dynamic(() => import('../../components/MapaSatelital'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-[#00FF00] bg-black text-[#00FF00] font-mono animate-pulse uppercase tracking-widest text-xs">Alineando Satélites...</div>
});

export default function ConsolaTelemetria() {
  return (
    <AccesoRestringido>
      <main className="min-h-screen bg-[#000500] text-[#00FF00] font-mono p-4 md:p-8 flex flex-col selection:bg-[#005500] selection:text-white">
        
        <header className="border-b-2 border-[#00FF00] pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0">
          <div>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-widest flex items-center gap-2">
              <span className="bg-[#00FF00] text-black px-2 py-1 italic">NAV</span> 
              SUIZA <span className="text-sm border border-[#00FF00] px-1 text-[#00FF00] ml-2">V3</span>
            </h1>
            <p className="mt-1 text-[10px] md:text-xs text-[#00AA00] tracking-widest uppercase">
              HUD DE TELEMETRÍA | OP: <strong className="text-white">ING. CIVIL DANIEL GARCÍA</strong>
            </p>
          </div>
          
          <a href="/" className="border border-[#00FF00] px-4 py-2 text-xs uppercase hover:bg-[#00FF00] hover:text-black transition-colors font-bold bg-[#001100]">
            [ RETORNAR AL RADAR ]
          </a>
        </header>

        {/* CONTENEDOR DEL MAPA (Escalamiento Dinámico Inteligente) */
        <div className="w-full relative h-[75vh] md:h-[75vh] z-0 shadow-[0_0_20px_rgba(0,255,0,0.1)]">
          <MapaSatelital />
        </div>
        }

        <footer className="mt-4 border-t border-[#003300] pt-2 flex justify-between text-[8px] md:text-[10px] text-[#005500] uppercase">
          <p>SISTEMA CARTOGRÁFICO DE GRADO MILITAR</p>
          <p>LAT/LNG TRIANGULATION ACTIVA</p>
        </footer>

      </main>
    </AccesoRestringido>
  );
}