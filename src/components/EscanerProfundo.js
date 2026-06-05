"use client";
import { useState } from 'react';

export default function EscanerProfundo({ coordenadas }) {
  // 🛡️ ESTADOS DE LA TELEMETRÍA (Modo Reposo por defecto)
  const [estadoSondeo, setEstadoSondeo] = useState('STANDBY'); // STANDBY, ESCANEANDO, FINALIZADO, ERROR
  const [datosSismo, setDatosSismo] = useState(null);
  const [datosSuelo, setDatosSuelo] = useState(null);
  const [datosLogistica, setDatosLogistica] = useState(null);

  // 💥 EL DETONADOR: Lanza los satélites solo al hacer clic
  const lanzarSonda = async () => {
    if (!coordenadas || !coordenadas.lat || !coordenadas.lng) {
      alert(">_ ERROR: NO HAY COORDENADAS FIJADAS EN EL RADAR");
      return;
    }

    setEstadoSondeo('ESCANEANDO');
    const { lat, lng } = coordenadas;

    try {
      // 1. TÚNEL USGS (Actividad Tectónica a 500km)
      const reqUSGS = fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lng}&maxradiuskm=500&limit=1`);
      
      // 2. TÚNEL ISRIC (Trinidad Geotécnica: Arcilla, Arena, Limo)
      const reqISRIC = fetch(`https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lng}&lat=${lat}&property=clay&property=sand&property=silt&depth=0-5cm`);
      
      // 3. TÚNEL OSM (Infraestructura de Agua vía Proxy)
      const queryOSM = `[out:json];(way(around:2000,${lat},${lng})["waterway"];);out 1;`;
      const reqOSM = fetch(`${process.env.NEXT_PUBLIC_API_URL}/proxy/osm?data=${encodeURIComponent(queryOSM)}`);

      // Disparo simultáneo de la artillería pesada
      const [resUSGS, resISRIC, resOSM] = await Promise.all([
        reqUSGS.catch(() => ({ ok: false })), 
        reqISRIC.catch(() => ({ ok: false })), 
        reqOSM.catch(() => ({ ok: false }))
      ]);

      // Parseo de telemetría (Con escudos anti-caídas)
      if (resUSGS.ok) setDatosSismo(await resUSGS.json());
      if (resISRIC.ok) setDatosSuelo(await resISRIC.json());
      if (resOSM.ok) setDatosLogistica(await resOSM.json());

      setEstadoSondeo('FINALIZADO');
    } catch (error) {
      console.error(">_ INTERFERENCIA MASIVA DURANTE EL ESCANEO:", error);
      setEstadoSondeo('ERROR');
    }
  };

  // 🎛️ FUNCIONES DE RENDERIZADO CRT PARA CADA MONITOR
  const extraerSuelo = (propiedad) => {
    try {
      const capas = datosSuelo?.properties?.layers;
      const capa = capas?.find(c => c.name === propiedad);
      const valor = capa?.depths?.[0]?.values?.mean;
      return valor ? (valor / 10).toFixed(1) + '%' : 'N/A';
    } catch { return 'ERR'; }
  };

  return (
    <div className="w-full mt-6 md:mt-10 border-2 border-[#004400] bg-[#000500] p-4 shadow-[0_0_30px_rgba(0,255,0,0.05)] font-mono selection:bg-[#00FF00] selection:text-black relative z-10">
      
      {/* 📡 ENCABEZADO Y DETONADOR */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-[#002200] pb-4 gap-4">
        <div>
          <h2 className="text-xl font-black text-[#00FF00] uppercase tracking-widest drop-shadow-[0_0_5px_#00FF00]">
            &gt;_ Escáner Geológico
          </h2>
          <p className="text-[10px] text-[#00AA00] opacity-70">
            COORDENADAS OBJETIVO: {coordenadas?.lat?.toFixed(4)}, {coordenadas?.lng?.toFixed(4)}
          </p>
        </div>

        <button 
          onClick={lanzarSonda}
          disabled={estadoSondeo === 'ESCANEANDO'}
          className={`px-6 py-2 border-2 font-black uppercase tracking-[0.2em] transition-all duration-300 text-xs md:text-sm ${
            estadoSondeo === 'ESCANEANDO' 
              ? 'bg-[#003300] border-[#00FF00] text-[#00FF00] cursor-not-allowed animate-pulse shadow-[0_0_15px_#00FF00]' 
              : estadoSondeo === 'FINALIZADO'
              ? 'bg-black border-[#004400] text-[#00AA00] hover:border-[#00FF00] hover:text-[#00FF00]'
              : 'bg-[#110000] border-red-600 text-red-500 hover:bg-red-900 hover:text-white shadow-[inset_0_0_10px_rgba(255,0,0,0.5)]'
          }`}
        >
          {estadoSondeo === 'STANDBY' && '[ ☢️ EJECUTAR ESCÁNER PROFUNDO ]'}
          {estadoSondeo === 'ESCANEANDO' && '... PENETRANDO CORTEZA ...'}
          {estadoSondeo === 'FINALIZADO' && '[ 🔄 REINICIAR ESCANEO ]'}
          {estadoSondeo === 'ERROR' && '[ ⚠️ FALLA - REINTENTAR ]'}
        </button>
      </div>

      {/* 📺 BATERÍA DE MONITORES CRT (La Grilla 1x3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 relative">
        
        {/* REVESTIMIENTO CRT GENERAL (Opcional, para toda la grilla) */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20 z-0"></div>

        {/* ========================================== */}
        {/* MONITOR 1: LOGÍSTICA E INFRAESTRUCTURA (OSM) */}
        {/* ========================================== */}
        <div className="relative border border-[#004400] bg-[#001100] p-3 overflow-hidden group hover:border-[#00FF00] transition-colors z-10">
          <div className="flex justify-between items-center border-b border-[#003300] mb-2 pb-1">
            <span className="text-[10px] text-[#008800] font-bold tracking-widest uppercase">MÓDULO LOGÍSTICO</span>
            <span className="text-[8px] bg-[#002200] px-1 text-[#00FF00]">OSM/SAT</span>
          </div>
          
          <div className="h-24 flex flex-col justify-center items-center text-center">
            {estadoSondeo === 'STANDBY' && <p className="text-[10px] opacity-40 animate-pulse">ESPERANDO ORDEN...</p>}
            {estadoSondeo === 'ESCANEANDO' && <p className="text-xs text-[#00FF00] font-bold animate-[spin_1s_linear_infinite]">🌀</p>}
            {estadoSondeo === 'FINALIZADO' && (
              <>
                <p className={`text-sm font-black uppercase mb-1 ${datosLogistica?.elements?.length > 0 ? 'text-blue-400 drop-shadow-[0_0_5px_blue]' : 'text-emerald-500'}`}>
                  {datosLogistica?.elements?.length > 0 ? 'HIDROLOGÍA DETECTADA' : 'ZONA DESPEJADA'}
                </p>
                <p className="text-[9px] text-[#00AA00]">
                  Cuerpos de agua (2km): {datosLogistica?.elements?.length || 0}
                </p>
              </>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* MONITOR 2: TRINIDAD GEOTÉCNICA (ISRIC) */}
        {/* ========================================== */}
        <div className="relative border border-[#004400] bg-[#001100] p-3 overflow-hidden group hover:border-[#00FF00] transition-colors z-10">
          <div className="flex justify-between items-center border-b border-[#003300] mb-2 pb-1">
            <span className="text-[10px] text-[#008800] font-bold tracking-widest uppercase">CAPA SUBSUELO</span>
            <span className="text-[8px] bg-[#002200] px-1 text-[#00FF00]">ISRIC/0-5CM</span>
          </div>
          
          <div className="h-24 flex flex-col justify-center w-full px-2">
            {estadoSondeo === 'STANDBY' && <p className="text-[10px] opacity-40 text-center animate-pulse">ESPERANDO ORDEN...</p>}
            {estadoSondeo === 'ESCANEANDO' && <p className="text-xs text-[#00FF00] font-bold text-center animate-[spin_1s_linear_infinite]">🌀</p>}
            {estadoSondeo === 'FINALIZADO' && (
              <div className="w-full space-y-2 text-[10px] font-bold">
                <div className="flex justify-between items-center">
                  <span className="text-amber-600">ARCILLA (CLAY)</span>
                  <span className="text-white">{extraerSuelo('clay')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-600">ARENA (SAND)</span>
                  <span className="text-white">{extraerSuelo('sand')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">LIMO (SILT)</span>
                  <span className="text-white">{extraerSuelo('silt')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* MONITOR 3: SISMOLOGÍA Y FALLAS (USGS) */}
        {/* ========================================== */}
        <div className="relative border border-[#004400] bg-[#001100] p-3 overflow-hidden group hover:border-[#00FF00] transition-colors z-10">
          <div className="flex justify-between items-center border-b border-[#003300] mb-2 pb-1">
            <span className="text-[10px] text-[#008800] font-bold tracking-widest uppercase">ACT. TECTÓNICA</span>
            <span className="text-[8px] bg-[#002200] px-1 text-[#00FF00]">USGS/500KM</span>
          </div>
          
          <div className="h-24 flex flex-col justify-center items-center text-center">
            {estadoSondeo === 'STANDBY' && <p className="text-[10px] opacity-40 animate-pulse">ESPERANDO ORDEN...</p>}
            {estadoSondeo === 'ESCANEANDO' && <p className="text-xs text-[#00FF00] font-bold animate-[spin_1s_linear_infinite]">🌀</p>}
            {estadoSondeo === 'FINALIZADO' && (
              <>
                {datosSismo?.features?.length > 0 ? (
                  <>
                    <p className="text-lg font-black text-red-500 drop-shadow-[0_0_5px_red] mb-1 animate-pulse">
                      MAG {datosSismo.features[0].properties.mag.toFixed(1)}
                    </p>
                    <p className="text-[8px] uppercase text-[#00AA00] line-clamp-2 px-1">
                      {datosSismo.features[0].properties.place}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-black text-emerald-500 mb-1 drop-shadow-[0_0_5px_#00FF00]">ZONA ESTABLE</p>
                    <p className="text-[9px] text-[#00AA00]">Sin sismos recientes en 500km</p>
                  </>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}