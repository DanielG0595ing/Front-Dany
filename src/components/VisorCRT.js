"use client";
import { useState, useEffect, useRef, useMemo } from 'react';

export default function VisorCRT() {
  const [canalActual, setCanalActual] = useState(0);
  const [fallaSeñal, setFallaSeñal] = useState(true);
  
  // 📡 ALMACENAMIENTO DE TELEMETRÍA GLOBAL
  const [puntos, setPuntos] = useState([]);
  const [misiones, setMisiones] = useState([]);
  const [misionRandom, setMisionRandom] = useState(null);
  const [coordenadasBase, setCoordenadasBase] = useState({ lat: -34.6037, lng: -58.3816, origen: 'BÚNKER BS.AS.' });
  
  const [telemetriaSatelital, setTelemetriaSatelital] = useState({
    clima: null, sismo: null, mercado: null, suelo: null, infraestructura: null
  });
  
  const canvasRef = useRef(null);

  // ==========================================
  // 1. MOTOR DE EXTRACCIÓN Y RADAR SILENCIOSO
  // ==========================================
  useEffect(() => {
    const extraerDatosConsola = async () => {
      try {
        const resPuntos = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puntos`);
        const datosPuntos = await resPuntos.json();
        setPuntos(datosPuntos);

        const resMisiones = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/misiones`);
        const datosMisiones = await resMisiones.json();
        
        const misionesActivas = datosMisiones.filter(m => m.estado !== 'oculto' && m.estado !== 'finalizado');
        setMisiones(misionesActivas);
        
        if (misionesActivas.length > 0) {
          const randomIdx = Math.floor(Math.random() * misionesActivas.length);
          setMisionRandom(misionesActivas[randomIdx]);
        }
      } catch (err) {
        console.error(">_ ERROR EN ENRUTAMIENTO CRÍTICO MONGO", err);
      }
    };

    extraerDatosConsola();
    const radarSilencioso = setInterval(extraerDatosConsola, 10000);
    return () => clearInterval(radarSilencioso);
  }, []);

  // ==========================================
  // 2. ENLACE CON APIs SATELITALES (VÍA PROXY DE BACKEND)
  // ==========================================
  useEffect(() => {
    const latActiva = puntos.length > 0 ? puntos[0].lat : coordenadasBase.lat;
    const lngActiva = puntos.length > 0 ? puntos[0].lng : coordenadasBase.lng;

    const alimentarCanales = async () => {
      try {
        // A) Clima (Directo)
        const rc = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latActiva}&longitude=${lngActiva}&current_weather=true`);
        const dc = await rc.json();
        
        // B) Sismos (Directo)
        const rs = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${latActiva}&longitude=${lngActiva}&maxradiuskm=300&limit=1`);
        const ds = await rs.json();

        // C) 💰 PROXY FINANCIERO
        const rm = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proxy/crypto`);
        const dm = await rm.json();

        // D) Suelo e Infraestructura
        let dSuelo = null; let dInfra = null;
        if (puntos.length > 0) {
          const ri = await fetch(`https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lngActiva}&lat=${latActiva}&property=clay&depth=0-5cm`);
          dSuelo = await ri.json();

          // E) 🗺️ PROXY LOGÍSTICO (¡Túnel Blindado!)
          const queryOSM = `[out:json];(way(around:1000,${latActiva},${lngActiva})["waterway"];);out 1;`;
          const ro = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proxy/osm?data=${encodeURIComponent(queryOSM)}`);
          dInfra = await ro.json();
        }

        setTelemetriaSatelital({
          clima: dc.current_weather,
          sismo: ds.features?.length > 0 ? ds.features[0].properties : null,
          mercado: dm,
          suelo: dSuelo?.properties?.layers?.[0]?.depths?.[0]?.values?.mean ? (dSuelo.properties.layers[0].depths[0].values.mean / 10).toFixed(1) + '%' : '18.4%',
          infraestructura: dInfra?.elements?.length > 0 ? 'CUERPO DE AGUA DETECTADO' : 'PERÍMETRO DESPEJADO'
        });
      } catch (e) {
        console.error(">_ ERROR EN TÚNEL DE TELEMETRÍA:", e);
      }
    };

    alimentarCanales();
  }, [puntos, coordenadasBase]);
  // ... (El resto de la lógica de renderizado y canales se mantiene igual)
  // NOTA: He omitido el resto para brevedad, solo sobrescriba hasta aquí o reemplace el archivo completo.
  // ==========================================
  // 🎛️ LOGIC MATRICIAL: CONSTRUCCIÓN DINÁMICA DE CANALES
  // ==========================================
  const listaCanalesActivos = useMemo(() => {
    let canales = [
      { id: 1, tag: "RADAR CLIMA", render: () => (
        <div className="text-center">
          <p className="text-3xl font-black text-white drop-shadow-[0_0_8px_#00FF00]">{telemetriaSatelital.clima?.temperature || '22'}°C</p>
          <p className="text-[9px] uppercase mt-1">Vto: {telemetriaSatelital.clima?.windspeed || '12'} km/h</p>
        </div>
      )},
      { id: 2, tag: "MONITOR SÍSMICO", render: () => (
        <div className="text-center px-2">
          <p className="text-lg font-black text-amber-500 drop-shadow-[0_0_5px_orange]">
            {telemetriaSatelital.sismo ? `MAG ${telemetriaSatelital.sismo.mag}` : "ESTABLE"}
          </p>
          <p className="text-[8px] uppercase mt-1 truncate max-w-[180px]">{telemetriaSatelital.sismo?.place || "SIN ALERTAS ACTIVAS"}</p>
        </div>
      )},
      { id: 3, tag: "DENSIDAD BASE", render: () => (
        <div className="text-center">
          <p className="text-2xl font-black text-blue-400">ISRIC LINK</p>
          <p className="text-[9px] uppercase mt-1">Sonda Activa: OK</p>
        </div>
      )},
      { id: 4, tag: "TICKER FINANCIERO", render: () => (
        <div className="w-full px-6 text-[10px] space-y-1">
          <div className="flex justify-between border-b border-[#002200]"><span>BTC:</span><span className="text-white">${telemetriaSatelital.mercado?.bitcoin?.usd?.toLocaleString() || '67,000'}</span></div>
          <div className="flex justify-between border-b border-[#002200]"><span>ETH:</span><span className="text-white">${telemetriaSatelital.mercado?.ethereum?.usd?.toLocaleString() || '3,500'}</span></div>
        </div>
      )}
    ];

    if (puntos.length > 0) {
      canales.push(
        { id: 5, tag: "📐 TELEMETRÍA DE INGENIERÍA", render: () => (
          <div className="text-center text-[10px] space-y-1">
            <p className="text-white font-bold">&gt;_ CÁLCULOS GEOMÉTRICOS</p>
            <p className="text-[#00FF00]">Balizas: {puntos.length} Nodos GPS</p>
            <p className="text-[9px] opacity-80">Polígono Estabilizado</p>
          </div>
        )},
        { id: 6, tag: "📡 ESCÁNER AMBIENTAL CENTRAL", render: () => (
          <div className="text-center text-[10px]">
            <p className="text-white font-black">SOLAR CALIBRATION</p>
            <p className="text-emerald-500 mt-1">UV Index: Normal</p>
            <p className="text-[8px] opacity-60">Centroide Analizado</p>
          </div>
        )},
        { id: 7, tag: "📍 VÉRTICES DEL TERRENO", render: () => (
          <div className="w-full px-4 text-[9px] max-h-[70px] overflow-hidden">
            <p className="text-white border-b border-[#003300] mb-1 font-bold">LOG COORDENADAS:</p>
            {puntos.slice(0, 3).map((p, i) => (
              <p key={i} className="truncate">
                P{i+1}: {parseFloat(p.lat || 0).toFixed(4)}, {parseFloat(p.lng || 0).toFixed(4)}
              </p>
            ))}
          </div>
        )},
        { id: 8, tag: "🪨 TEXTURA SUBSUELO (ISRIC)", render: () => (
          <div className="text-center">
            <p className="text-xl font-bold text-amber-600">{telemetriaSatelital.suelo}</p>
            <p className="text-[9px] uppercase tracking-wider text-amber-500 mt-1">Concentración Arcilla</p>
          </div>
        )},
        { id: 9, tag: "🌋 ACTIVIDAD TECTÓNICA (USGS)", render: () => (
          <div className="text-center px-2">
            <p className="text-xs text-red-500 font-bold animate-pulse">&gt;_ ESCANEO TECTÓNICO DE CAPA</p>
            <p className="text-[8px] mt-1 text-white">Fallas Activas bajo Monitoreo</p>
          </div>
        )},
        { id: 10, tag: "🌊 LOGÍSTICA Y RIESGOS (OSM)", render: () => (
          <div className="text-center px-4 text-[9px]">
            <p className="text-blue-400 font-bold border border-blue-500 px-1 inline-block mb-1">OSM DATA</p>
            <p className="text-white uppercase text-[8px]">{telemetriaSatelital.infraestructura}</p>
          </div>
        )}
      );
    }

    canales.push({
      id: 11,
      tag: "🚨 ALERTA DE DESPLIEGUE",
      render: () => misionRandom ? (
        <div className="w-full text-center px-3 space-y-1 animate-flicker">
          <p className="bg-red-900 text-white font-black text-[9px] px-2 py-0.5 inline-block uppercase tracking-widest animate-pulse border border-red-500">
            [ MISIÓN DESPLEGADA ]
          </p>
          <p className="text-white font-bold text-xs uppercase truncate mt-1">{misionRandom.titulo || misionRandom.nombre}</p>
          <p className="text-[8px] text-[#008800] tracking-widest uppercase">ID: {misionRandom._id?.substring(0,8)}... // V5</p>
        </div>
      ) : (
        <div className="text-center text-[9px] opacity-60 uppercase animate-pulse">
          Buscando Operaciones<br/>en Red Clandestina...
        </div>
      )
    });

    return canales;
  }, [puntos, telemetriaSatelital, misionRandom]);

  // ==========================================
  // 📺 ENTRADA DE RUIDO BLANCO (CANVAS CRT)
  // ==========================================
  useEffect(() => {
    if (!fallaSeñal || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    let animId;

    const renderNoise = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      const idata = ctx.createImageData(w, h);
      const buffer32 = new Uint32Array(idata.data.buffer);
      for (let i = 0; i < buffer32.length; i++) {
        buffer32[i] = Math.random() < 0.12 ? 0xff00ff00 : (Math.random() < 0.45 ? 0xff001500 : 0xff000000);
      }
      ctx.putImageData(idata, 0, 0);
      animId = requestAnimationFrame(renderNoise);
    };
    renderNoise();
    return () => cancelAnimationFrame(animId);
  }, [fallaSeñal]);

  // ==========================================
  // 🎛️ CONTROLES FÍSICOS DEL TELEVISOR
  // ==========================================
  
  // 💥 Función de Golpe Técnico (Rotación). Declarada ANTES de su uso.
  const cambiarCanal = () => {
    setFallaSeñal(true);
    setTimeout(() => {
      setCanalActual((prev) => (prev + 1) % listaCanalesActivos.length);
      setFallaSeñal(false);
    }, 550);
  };

  // ⏱️ TEMPORIZADOR DE ROTACIÓN CADA 10 SEGUNDOS
  useEffect(() => {
    const timer = setInterval(() => cambiarCanal(), 10000);
    return () => clearInterval(timer);
  }, [canalActual, listaCanalesActivos]);

  // ⚡ ARRANQUE DE SISTEMA: ENCENDIDO RÁPIDO (150ms)
  useEffect(() => { 
    setTimeout(() => setFallaSeñal(false), 150); 
  }, []);

  return (
    <div 
      className="relative w-full aspect-[4/3] max-w-[340px] mx-auto mt-6 bg-[#010401] border-4 border-[#002200] rounded-xl overflow-hidden cursor-pointer shadow-[inset_0_0_50px_rgba(0,255,0,0.15),_0_0_25px_rgba(0,0,0,0.9)] group"
      onClick={cambiarCanal}
    >
      {fallaSeñal ? (
        <canvas ref={canvasRef} width="240" height="180" className="w-full h-full object-cover opacity-85" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-between p-3 text-[#00FF00] font-mono relative select-none">
          
          {/* CABECERA OSD */}
          <div className="w-full flex justify-between items-center text-[9px] font-bold opacity-80 border-b border-[#001100] pb-1">
            <span className="bg-[#00FF00] text-black px-1 font-black">CH {String(listaCanalesActivos[canalActual].id).padStart(2, '0')}</span>
            <span className="text-[8px] tracking-wider text-[#00AA00] truncate max-w-[160px]">{listaCanalesActivos[canalActual].tag}</span>
            <span className="text-red-500 animate-pulse font-black text-[7px]">● LIVE</span>
          </div>

          {/* MONITOR INTEGRADO */}
          <div className="flex-1 w-full flex items-center justify-center drop-shadow-[0_0_6px_rgba(0,255,0,0.7)] py-2">
            {listaCanalesActivos[canalActual].render()}
          </div>

          {/* SUB-PANTALLA INFERIOR TÁCTICA */}
          <div className="w-full text-center text-[7px] opacity-60 border-t border-[#001100] pt-1 flex justify-between px-1">
            <span>SYS: DG_NET_V5</span>
            <span>NODES: {puntos.length} ACTIVE</span>
          </div>
        </div>
      )}

      {/* REVESTIMIENTO FILTRO CRT INDUSTRIAL */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.22)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.01),rgba(0,0,255,0.04))] bg-[length:100%_4px,3px_100%] opacity-40 z-10"></div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.95)] rounded-xl z-20"></div>
    </div>
  );
}