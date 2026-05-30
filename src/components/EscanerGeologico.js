"use client";
import { useState, useEffect, useCallback } from 'react';

export default function EscanerGeologico() {
  const [estadoEscaner, setEstadoEscaner] = useState('STANDBY');
  const [telemetria, setTelemetria] = useState({
    suelo: null,
    sismos: null,
    infraestructura: null,
    epicentro: null
  });

  // 1. EXTRAER COORDENADAS DE LA NUBE (MONGO DB)
  const iniciarEscaneoProfundo = useCallback(async () => {
    setEstadoEscaner('EXTRAYENDO COORDENADAS MONGODB...');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puntos`);
      const puntos = await res.json();

      if (puntos.length === 0) {
        setEstadoEscaner('ERROR: NO HAY BALIZAS EN EL TERRENO');
        return;
      }

      // Calcular Epicentro Geométrico
      let sumaLat = 0; let sumaLng = 0;
      puntos.forEach(p => { sumaLat += parseFloat(p.lat); sumaLng += parseFloat(p.lng); });
      const lat = (sumaLat / puntos.length).toFixed(6);
      const lng = (sumaLng / puntos.length).toFixed(6);

      setTelemetria(prev => ({ ...prev, epicentro: { lat, lng, totalPuntos: puntos.length } }));
      
      ejecutarSondasSatelitales(lat, lng);

    } catch (error) {
      setEstadoEscaner('FALLO DE ENLACE CON MONGODB');
    }
  }, []);

  // 2. DISPARAR SONDAS A APIs GLOBALES
  const ejecutarSondasSatelitales = async (lat, lng) => {
    setEstadoEscaner('INTERROGANDO SATÉLITES GLOBALES...');
    
    try {
      // ➔ SONDA A: USGS (Sismos en 100km, últimos 30 días, Mag > 2.5)
      const urlUSGS = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lng}&maxradiuskm=100&minmagnitude=2.5&limit=3`;
      
      // ➔ SONDA B: ISRIC SoilGrids (Arcilla, Arena, Limo a 0-5cm)
      const urlISRIC = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lng}&lat=${lat}&property=clay&property=sand&property=silt&depth=0-5cm`;

      // ➔ SONDA C: OVERPASS OSM (Agua y Alta tensión a 1000m)
      const queryOSM = `[out:json];(way(around:1000,${lat},${lng})["waterway"];node(around:1000,${lat},${lng})["power"];);out 5;`;
      const urlOSM = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(queryOSM)}`;

      const [resUSGS, resISRIC, resOSM] = await Promise.all([
        fetch(urlUSGS).catch(() => null),
        fetch(urlISRIC).catch(() => null),
        fetch(urlOSM).catch(() => null)
      ]);

      const dataUSGS = resUSGS ? await resUSGS.json() : null;
      const dataISRIC = resISRIC ? await resISRIC.json() : null;
      const dataOSM = resOSM ? await resOSM.json() : null;

      // Procesar Suelo
      let datosSuelo = { arcilla: 'N/A', arena: 'N/A', limo: 'N/A' };
      if (dataISRIC && dataISRIC.properties && dataISRIC.properties.layers) {
        dataISRIC.properties.layers.forEach(layer => {
          if (layer.name === 'clay') datosSuelo.arcilla = layer.depths[0].values.mean / 10 + '%';
          if (layer.name === 'sand') datosSuelo.arena = layer.depths[0].values.mean / 10 + '%';
          if (layer.name === 'silt') datosSuelo.limo = layer.depths[0].values.mean / 10 + '%';
        });
      }

      setTelemetria(prev => ({
        ...prev,
        suelo: datosSuelo,
        sismos: dataUSGS?.features || [],
        infraestructura: dataOSM?.elements || []
      }));

      setEstadoEscaner('ANÁLISIS COMPLETADO [OK]');

    } catch (error) {
      setEstadoEscaner('INTERFERENCIA EN SONDEO SATELITAL');
    }
  };

  return (
    <div className="w-full bg-[#000800] border-2 border-[#00FF00] p-4 font-mono text-xs text-[#00FF00] shadow-[0_0_20px_rgba(0,255,0,0.15)] flex flex-col gap-4">
      
      {/* CABECERA */}
      <div className="border-b border-[#004400] pb-2 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-[#00FF00]">&gt; ESCÁNER GEOLÓGICO V5</h2>
          <p className="text-[10px] text-[#008800]">OPERADOR: ING. DANIEL GARCÍA | ACCESO CLANDESTINO</p>
        </div>
        <button 
          onClick={iniciarEscaneoProfundo}
          className="bg-[#002200] border border-[#00FF00] text-[#00FF00] px-4 py-2 font-bold hover:bg-[#00FF00] hover:text-black transition-colors uppercase animate-pulse"
        >
          [ EJECUTAR ESCÁNER PROFUNDO ]
        </button>
      </div>

      {/* ESTADO DEL MOTOR */}
      <div className="bg-black border border-[#003300] p-2 text-center text-[10px] uppercase font-bold">
        ESTADO DEL SISTEMA: <span className={estadoEscaner.includes('OK') ? 'text-white' : 'text-amber-500'}>{estadoEscaner}</span>
      </div>

      {/* RESULTADOS DEL ESCÁNER */}
      {telemetria.epicentro && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* PANEL 1: ISRIC SUELOS */}
          <div className="border border-amber-600 bg-[#0d0700] p-3 shadow-[0_0_10px_rgba(217,119,6,0.1)]">
            <h3 className="text-amber-500 font-bold border-b border-amber-900 pb-1 mb-2 uppercase text-[10px]">🪨 Textura del Subsuelo (ISRIC)</h3>
            <p className="text-amber-400 mb-1">Cálculo a 0-5cm de profundidad:</p>
            <ul className="space-y-1 text-white">
              <li>🔸 ARCILLA (Expansión): <span className="font-black">{telemetria.suelo?.arcilla}</span></li>
              <li>🔸 ARENA (Drenaje): <span className="font-black">{telemetria.suelo?.arena}</span></li>
              <li>🔸 LIMO (Retención): <span className="font-black">{telemetria.suelo?.limo}</span></li>
            </ul>
            <p className="text-[8px] text-amber-700 mt-2">*Datos vitales para diseño de cimentación pesada.</p>
          </div>

          {/* PANEL 2: USGS SISMOS */}
          <div className="border border-red-600 bg-[#120000] p-3 shadow-[0_0_10px_rgba(220,38,38,0.1)]">
            <h3 className="text-red-500 font-bold border-b border-red-900 pb-1 mb-2 uppercase text-[10px]">🌋 Actividad Tectónica (USGS)</h3>
            <p className="text-red-400 mb-1">Radio 100km | Últimos 30 días:</p>
            {telemetria.sismos?.length > 0 ? (
              <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-2">
                {telemetria.sismos.map((sismo, idx) => (
                  <div key={idx} className="border-l-2 border-red-500 pl-2">
                    <p className="text-white font-bold text-[9px]">Mag {sismo.properties.mag} - {sismo.properties.place}</p>
                    <p className="text-red-500 text-[8px]">{new Date(sismo.properties.time).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#00FF00] font-bold py-2">&gt; ZONA ESTABLE. 0 SISMOS DETECTADOS.</p>
            )}
          </div>

          {/* PANEL 3: OSM INFRAESTRUCTURA */}
          <div className="border border-blue-500 bg-[#000412] p-3 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
            <h3 className="text-blue-500 font-bold border-b border-blue-900 pb-1 mb-2 uppercase text-[10px]">🌊 Logística y Riesgos (OSM)</h3>
            <p className="text-blue-400 mb-1">Radio 1000m desde el epicentro:</p>
            {telemetria.infraestructura?.length > 0 ? (
              <ul className="space-y-1 text-white text-[9px]">
                {telemetria.infraestructura.slice(0,5).map((inf, idx) => (
                  <li key={idx}>
                    🔹 {inf.tags?.waterway ? 'CUERPO DE AGUA' : inf.tags?.power ? 'ALTA TENSIÓN' : 'INFRAESTRUCTURA'} a la vista.
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#00FF00] font-bold py-2">&gt; PERÍMETRO LIMPIO. SIN RIESGOS LOGÍSTICOS CERCANOS.</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
