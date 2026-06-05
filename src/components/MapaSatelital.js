"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polygon } from 'react-leaflet';
import { useReactToPrint } from 'react-to-print';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 📡 ESCÁNER CAPTURADOR DE COORDENADAS
function EscanerCoordenadas({ onPuntoCapturado }) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      onPuntoCapturado(lat, lng);
    },
  });
  return null;
}

// 🚁 DRON DE RECONOCIMIENTO
function ControladorVuelo({ objetivo }) {
  const map = useMap();
  useEffect(() => {
    if (objetivo) {
      map.flyTo([objetivo.lat, objetivo.lng], 15, { animate: true, duration: 2 });
    }
  }, [objetivo, map]);
  return null;
}

export default function MapaSatelital() {
  const [puntos, setPuntos] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [estadoRadar, setEstadoRadar] = useState('STANDBY');
  const [objetivoVuelo, setObjetivoVuelo] = useState(null);

  // Estados analíticos REALES
  const [calculosLote, setCalculosLote] = useState({ area: 0, perimetro: 0, tramos: [] });
  const [telemetriaAmbiental, setTelemetriaAmbiental] = useState(null);
  const [cargandoSensores, setCargandoSensores] = useState(false);
  
  // 🎯 NUEVO ESTADO: UBICACIÓN TRIANGULADA (PROMEDIO)
  const [ubicacionNominal, setUbicacionNominal] = useState('ESPERANDO TRIANGULACIÓN...');

  const baseLat = -34.6037;
  const baseLng = -58.3816;

  const componentePDF = useRef(null);

  // 🛰️ EXTRAER COORDENADAS DE LA NUBE
  const cargarRadarCloud = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puntos`);
      const data = await res.json();
      setPuntos(data);
    } catch (error) {
      console.error(">_ ERROR DE LECTURA CARTOGRÁFICA");
    }
  }, []);

  const generarPDF = useReactToPrint({
    contentRef: componentePDF,
    documentTitle: 'Reporte_Civil_Analytics_V5',
  });

  useEffect(() => {
    cargarRadarCloud();
  }, [cargarRadarCloud]);

  // ========================================================
  // 🧮 MOTORES MATEMÁTICOS REALES DE INGENIERÍA CIVIL
  // ========================================================
  const calcularDistanciaHaversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calcularAreaShoelace = (coordenadas) => {
    if (coordenadas.length < 3) return 0;
    const factorLat = 111320; 
    const factorLng = 40075000 * Math.cos((coordenadas[0].lat * Math.PI) / 180) / 360;
    let area = 0;
    for (let i = 0; i < coordenadas.length; i++) {
      const p1 = coordenadas[i];
      const p2 = coordenadas[(i + 1) % coordenadas.length];
      const x1 = p1.lng * factorLng;
      const y1 = p1.lat * factorLat;
      const x2 = p2.lng * factorLng;
      const y2 = p2.lat * factorLat;
      area += (x1 + x2) * (y1 - y2);
    }
    return Math.abs(area / 2);
  };

  // ========================================================
  // 📡 ENLACES REALES: ESCÁNER DE ENTORNO SATELITAL
  // ========================================================
  const consultarSensoresAmbientales = useCallback(async (centroLat, centroLng) => {
    setCargandoSensores(true);
    try {
      // 1. Geolocalización Inversa (Nominatim) para el Promedio
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${centroLat}&lon=${centroLng}`)
        .then(res => res.json())
        .then(data => {
          const ciudad = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || "ZONA DESCONOCIDA";
          const estado = data.address?.state || "";
          setUbicacionNominal(`${ciudad}, ${estado}`.toUpperCase());
        }).catch(() => setUbicacionNominal("COORDENADAS CLANDESTINAS"));

      // 2. Clima y Ciclo Solar
      const urlMeteo = `https://api.open-meteo.com/v1/forecast?latitude=${centroLat}&longitude=${centroLng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&elevation=1`;
      const resMeteo = await fetch(urlMeteo);
      const dataMeteo = await resMeteo.json();

      const urlSol = `https://api.sunrise-sunset.org/json?lat=${centroLat}&lng=${centroLng}&formatted=0`;
      const resSol = await fetch(urlSol);
      const dataSol = await resSol.json();

      const amanecer = dataSol.results ? new Date(dataSol.results.sunrise).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
      const atardecer = dataSol.results ? new Date(dataSol.results.sunset).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';

      setTelemetriaAmbiental({
        altitud: dataMeteo.elevation ? dataMeteo.elevation.toFixed(1) : 'N/A',
        temperatura: dataMeteo.current?.temperature_2m || 0,
        humedad: dataMeteo.current?.relative_humidity_2m || 0,
        viento: dataMeteo.current?.wind_speed_10m || 0,
        amanecer,
        atardecer
      });
    } catch (error) {
      console.error(">_ INCIDENTE EN ESCÁNER DE SENSORES EXTERNOS", error);
    } finally {
      setCargandoSensores(false);
    }
  }, []);

  useEffect(() => {
    if (puntos.length >= 3) {
      let perimetroAcumulado = 0;
      let sumaLat = 0;
      let sumaLng = 0;
      const listaTramos = [];

      for (let i = 0; i < puntos.length; i++) {
        const actual = puntos[i];
        const siguiente = puntos[(i + 1) % puntos.length];
        
        sumaLat += parseFloat(actual.lat);
        sumaLng += parseFloat(actual.lng);

        const d = calcularDistanciaHaversine(
          parseFloat(actual.lat), parseFloat(actual.lng),
          parseFloat(siguiente.lat), parseFloat(siguiente.lng)
        );
        
        perimetroAcumulado += d;
        listaTramos.push({
          de: actual.etiqueta,
          a: siguiente.etiqueta,
          distancia: d.toFixed(2)
        });
      }

      const areaCalculada = calcularAreaShoelace(puntos.map(p => ({ lat: parseFloat(p.lat), lng: parseFloat(p.lng) })));
      
      setCalculosLote({
        area: areaCalculada.toFixed(2),
        perimetro: perimetroAcumulado.toFixed(2),
        tramos: listaTramos
      });

      // 🔥 CÁLCULO ESTADÍSTICO DEL CENTROIDE PARA DATOS PRECISOS
      const centroLat = (sumaLat / puntos.length).toFixed(6);
      const centroLng = (sumaLng / puntos.length).toFixed(6);
      
      const timer = setTimeout(() => {
        consultarSensoresAmbientales(centroLat, centroLng);
      }, 1000);

      return () => clearTimeout(timer);

    } else {
      setCalculosLote({ area: 0, perimetro: 0, tramos: [] });
      setTelemetriaAmbiental(null);
      setUbicacionNominal('ESPERANDO TRIANGULACIÓN...');
    }
  }, [puntos, consultarSensoresAmbientales]);

  const generarColorUnico = () => {
    const coloresExistentes = puntos.map(p => p.hue);
    let intentoHue;
    let duplicado = true;
    let intentos = 0;
    while (duplicado && intentos < 20) {
      intentoHue = Math.floor(Math.random() * 360);
      duplicado = coloresExistentes.some(h => Math.abs(h - intentoHue) < 25);
      intentos++;
    }
    return intentoHue;
  };

  const capturarPunto = async (lat, lng) => {
    setEstadoRadar('GUARDANDO...');
    const hue = generarColorUnico();
    const nuevoPunto = {
      lat, lng, hue,
      colorCss: `hsl(${hue}, 100%, 50%)`,
      etiqueta: `PT_${(puntos.length + 1).toString().padStart(2, '0')}`
    };

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puntos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoPunto)
      });
      cargarRadarCloud();
      setEstadoRadar('STANDBY');
    } catch (error) {
      setEstadoRadar('ERROR DE ESCRITURA');
    }
  };

  const eliminarPunto = async (id) => {
    setEstadoRadar('PURGANDO...');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puntos/${id}`, { method: 'DELETE' });
      cargarRadarCloud(); setEstadoRadar('STANDBY');
    } catch (error) { setEstadoRadar('ERROR'); }
  };

  const modificarEtiquetaLocal = (id, nuevoTexto) => {
    setPuntos(puntos.map(p => p._id === id ? { ...p, etiqueta: nuevoTexto.toUpperCase() } : p));
  };

  const guardarEtiquetaNube = async (id, textoFinal) => {
    setEstadoRadar('ACTUALIZANDO...');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puntos/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ etiqueta: textoFinal })
      });
      setEstadoRadar('STANDBY');
    } catch (error) { setEstadoRadar('ERROR'); }
  };

  const limpiarTodoElRadar = async () => {
    if (window.confirm("¿Desea DESTRUIR todas las coordenadas de la base de datos?")) {
      setEstadoRadar('DESTRUYENDO MATRIZ...');
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puntos/purga/total`, { method: 'DELETE' });
        cargarRadarCloud(); setEstadoRadar('STANDBY');
      } catch (error) { setEstadoRadar('ERROR'); }
    }
  };

  const ejecutarBusqueda = async (e) => {
    e.preventDefault();
    if (!terminoBusqueda) return;
    setEstadoRadar('ESCANEANDO...');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(terminoBusqueda)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setObjetivoVuelo({ lat: parseFloat(lat), lng: parseFloat(lon) });
        setEstadoRadar('OBJETIVO LOCALIZADO');
        setTimeout(() => setEstadoRadar('STANDBY'), 3000);
      } else {
        setEstadoRadar('OBJETIVO PERDIDO');
        setTimeout(() => setEstadoRadar('STANDBY'), 3000);
      }
    } catch (error) {
      setEstadoRadar('ERROR DE ENLACE');
      setTimeout(() => setEstadoRadar('STANDBY'), 3000);
    }
  };

  const posicionesPoligono = puntos.map(p => [parseFloat(p.lat), parseFloat(p.lng)]);

  // ========================================================
  // 📺 COMPONENTE INTERNO: PANTALLA CRT ORIGINAL
  // ========================================================
  const MonitorCRT = ({ id, tag, children }) => (
    <div className="relative w-full mb-4 bg-[#010401] border-4 border-[#002200] rounded-xl overflow-hidden shadow-[inset_0_0_50px_rgba(0,255,0,0.15),_0_0_25px_rgba(0,0,0,0.8)] group transition-all hover:border-[#00FF00]">
      <div className="w-full flex flex-col items-center p-3 text-[#00FF00] font-mono relative select-none z-20 min-h-[120px]">
        <div className="w-full flex justify-between items-center text-[9px] font-bold opacity-80 border-b border-[#001100] pb-1 mb-2">
          <span className="bg-[#00FF00] text-black px-1 font-black">CH 0{id}</span>
          <span className="text-[8px] tracking-wider text-[#00AA00] truncate mx-2">{tag}</span>
          <span className="text-red-500 animate-pulse font-black text-[7px]">● LIVE</span>
        </div>
        <div className="flex-1 w-full flex flex-col items-center justify-center drop-shadow-[0_0_6px_rgba(0,255,0,0.7)]">
          {children}
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.22)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.01),rgba(0,0,255,0.04))] bg-[length:100%_4px,3px_100%] opacity-40 z-10"></div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.95)] rounded-xl z-20"></div>
    </div>
  );

  // ========================================================
  // 🚀 NUEVO COMPONENTE: DASHBOARD HOLOGRÁFICO (PLAN B)
  // ========================================================
  const DashHolografico = ({ calculos, clima, ubicacion }) => {
    const [indiceMonitor, setIndiceMonitor] = useState(0);
    const [glitch, setGlitch] = useState(false);

    const metricas = [
      { l: "⛰️ ALTITUD", v: clima ? clima.altitud + " m" : "--" },
      { l: "🌡️ TEMP", v: clima ? clima.temperatura + "°C" : "--" },
      { l: "💧 HUMEDAD", v: clima ? clima.humedad + "%" : "--" },
      { l: "💨 VIENTO", v: clima ? clima.viento + " km/h" : "--" }
    ];

    useEffect(() => {
      if (!clima) return;
      const intervalo = setInterval(() => {
        setGlitch(true);
        setTimeout(() => {
          setIndiceMonitor(prev => (prev + 1) % metricas.length);
          setGlitch(false);
        }, 200);
      }, 5000);
      return () => clearInterval(intervalo);
    }, [clima, metricas.length]);

    return (
      <div className="w-full bg-[#000400] border-t-4 border-[#002200] p-4 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[inset_0_20px_50px_rgba(0,255,0,0.05)] relative z-10 font-mono">
        
        {/* BLOQUE 1: ISOMETRÍA 3D CSS */}
        <div className="flex-1 flex justify-center items-center relative perspective-[800px] h-28">
          <div className="holo-grid"></div>
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center pointer-events-none drop-shadow-[0_0_5px_#00FF00]">
            <p className="text-[#00FF00] font-black text-[10px] uppercase bg-[#000400]/80 px-2 rounded mb-1">📐 ÁREA: {calculos.area} m²</p>
            <p className="text-[#00AA00] font-bold text-[9px] bg-[#000400]/80 px-2 rounded">PERÍMETRO: {calculos.perimetro} m</p>
          </div>
        </div>

        {/* BLOQUE 2: MONITOR ROTATIVO (GLITCH) + UBICACIÓN NOMINAL */}
        <div className="flex-1 flex flex-col justify-center items-center">
          <p className="text-[#008800] text-[8px] font-bold tracking-widest mb-1 border-b border-[#003300]">📍 {ubicacion}</p>
          <div className="w-56 h-16 border-2 border-[#00FF00] bg-[#001100] flex flex-col justify-center items-center relative overflow-hidden shadow-[0_0_15px_rgba(0,255,0,0.4)]">
            <div className="absolute inset-0 scanline opacity-30 pointer-events-none"></div>
            {cargandoSensores ? (
              <p className="text-[#00FF00] text-[10px] animate-pulse uppercase">SINTONIZANDO...</p>
            ) : (
              <div className={`text-center transition-all ${glitch ? 'animate-glitch text-white opacity-50 skew-x-12' : 'text-[#00FF00]'}`}>
                <p className="font-bold text-[9px] opacity-70 tracking-widest uppercase">{metricas[indiceMonitor].l}</p>
                <p className="font-black text-xl drop-shadow-[0_0_8px_#00FF00]">{metricas[indiceMonitor].v}</p>
              </div>
            )}
          </div>
        </div>

        {/* BLOQUE 3: ARCO SOLAR ASTRONÓMICO */}
        <div className="flex-1 flex flex-col justify-center items-center h-28 relative">
          <p className="text-[#00FF00] text-[9px] font-black tracking-widest mb-3">CICLO ASTRONÓMICO</p>
          <div className="solar-arc">
             {clima && <div className="sun-dot"></div>}
          </div>
          <div className="flex justify-between w-36 mt-2 text-[8px] font-bold text-[#00AA00]">
            <span>🌅 {clima?.amanecer || '--:--'}</span>
            <span>🌇 {clima?.atardecer || '--:--'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={componentePDF} className="w-full h-full flex flex-col bg-black overflow-y-auto custom-scrollbar selection:bg-[#00FF00] selection:text-black">
      
      {/* 🔮 ESTILOS CSS DEL DASHBOARD HOLOGRÁFICO Y CURSOR */}
      <style>{`
        .leaflet-container { cursor: crosshair !important; }
        .holo-grid {
          width: 130px; height: 130px;
          background: repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(0,255,0,0.8) 15px, rgba(0,255,0,0.8) 16px),
                      repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(0,255,0,0.8) 15px, rgba(0,255,0,0.8) 16px);
          border: 2px solid #00FF00;
          box-shadow: 0 0 20px rgba(0,255,0,0.4), inset 0 0 20px rgba(0,255,0,0.4);
          transform: rotateX(65deg) rotateZ(0deg);
          animation: spinWireframe 15s linear infinite;
        }
        @keyframes spinWireframe { to { transform: rotateX(65deg) rotateZ(360deg); } }
        
        @keyframes glitch {
          0% { transform: translate(0) skew(0deg); text-shadow: none; }
          20% { transform: translate(-2px, 2px) skew(-10deg); text-shadow: 2px 0 red, -2px 0 blue; }
          40% { transform: translate(2px, -2px) skew(10deg); text-shadow: -2px 0 red, 2px 0 blue; }
          60% { transform: translate(-2px, 0) skew(-5deg); text-shadow: 2px 0 red, -2px 0 blue; }
          80% { transform: translate(2px, 2px) skew(5deg); text-shadow: -2px 0 red, 2px 0 blue; }
          100% { transform: translate(0) skew(0deg); text-shadow: none; }
        }
        .animate-glitch { animation: glitch 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        .scanline { background: linear-gradient(to bottom, transparent 50%, rgba(0, 255, 0, 0.3) 51%); background-size: 100% 4px; }
        
        .solar-arc {
          width: 140px; height: 45px;
          border: 2px dashed #004400;
          border-bottom: 2px solid #00FF00;
          border-top-left-radius: 140px;
          border-top-right-radius: 140px;
          position: relative;
          overflow: hidden;
        }
        .sun-dot {
          width: 10px; height: 10px;
          background: #00FF00; border-radius: 50%;
          position: absolute; bottom: -5px; left: -5px;
          box-shadow: 0 0 15px #00FF00, 0 0 30px #00FF00;
          animation: moveSun 4s ease-in-out infinite alternate;
        }
        @keyframes moveSun {
          0% { left: 0; bottom: -5px; }
          50% { left: 65px; bottom: 35px; }
          100% { left: 130px; bottom: -5px; }
        }
      `}</style>

      {/* 🧭 LA GRILLA ORIGINAL QUE USTED APROBÓ (MapaSatelital intacto) */}
      <div className="flex-grow flex flex-col md:grid md:grid-cols-[22rem_1fr] md:grid-rows-[auto_1fr] min-h-0">
        
        {/* BLOQUE 1: CONSOLA DE CONTROL */}
        <div className="order-1 md:col-start-1 md:row-start-1 bg-[#000800] border-b border-[#004400] md:border-r-2 p-4 font-mono text-xs z-[450] shrink-0">
          <div className="border-b border-[#00FF00] pb-2 mb-3 flex justify-between items-center">
            <div>
              <h3 className="text-[#00FF00] font-black uppercase tracking-wider">CIVIL ANALYTICS V5</h3>
              <p className="text-[9px] text-[#008800]">RADAR GEOMÉTRICO + AMBIENTAL</p>
            </div>
            <div className="flex gap-2">
              {puntos.length >= 3 && <button onClick={generarPDF} className="text-[9px] bg-[#002200] text-[#00FF00] border border-[#00FF00] px-2 hover:bg-[#00FF00] hover:text-black transition-colors font-bold uppercase tracking-wider">[ 📄 INFORME A4 ]</button>}
              {puntos.length > 0 && <button onClick={limpiarTodoElRadar} className="text-[9px] bg-red-950 text-red-400 border border-red-700 px-1 hover:bg-red-600 hover:text-white transition-colors font-bold uppercase">[ PURGAR ]</button>}
            </div>
          </div>
          <form onSubmit={ejecutarBusqueda} className="mb-1">
            <label className="text-[9px] text-[#00AA00] mb-1 block uppercase tracking-widest flex justify-between">
              <span>Rastreo de Lote (OSM)</span>
              <span className={`${estadoRadar !== 'STANDBY' ? 'animate-pulse text-white' : ''}`}>[{estadoRadar}]</span>
            </label>
            <div className="flex gap-1">
              <input type="text" value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} placeholder="Ej: Córdoba..." className="w-full bg-[#001100] border border-[#004400] text-[#00FF00] p-1.5 focus:border-[#00FF00] focus:outline-none placeholder-emerald-950 text-[10px]" />
              <button type="submit" className="bg-[#003300] border border-[#00FF00] text-[#00FF00] px-3 font-bold hover:bg-[#00FF00] hover:text-black transition-colors">&gt;</button>
            </div>
          </form>
        </div>

        {/* BLOQUE 2: LIENZO CARTOGRÁFICO */}
        <div className="order-2 md:order-none md:col-start-2 md:row-start-1 md:row-span-2 h-[50vh] min-h-[350px] md:h-full md:min-h-0 w-full relative z-0 shrink-0 border-b border-[#004400] md:border-b-0 cursor-crosshair">
          <MapContainer center={[baseLat, baseLng]} zoom={12} style={{ height: '100%', width: '100%', background: '#000800', cursor: 'crosshair' }} zoomControl={false}>
            <TileLayer attribution='&copy; <a href="https://carto.com/">CartoDB</a>' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <EscanerCoordenadas onPuntoCapturado={capturarPunto} />
            <ControladorVuelo objetivo={objetivoVuelo} />
            {posicionesPoligono.length >= 3 && <Polygon positions={posicionesPoligono} pathOptions={{ color: '#00FF00', fillColor: '#00FF00', fillOpacity: 0.15, dashArray: '5, 5', weight: 2 }} />}
            {puntos.map((punto) => {
              const iconDinamico = L.divIcon({
                className: 'custom-radar-icon',
                html: `<div class="relative w-5 h-5"><div class="absolute inset-0 rounded-full animate-ping opacity-60" style="background-color: ${punto.colorCss}"></div><div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border-2 border-black rounded-full shadow-[0_0_8px_${punto.colorCss}]" style="background-color: ${punto.colorCss}"></div></div>`,
                iconSize: [20, 20], iconAnchor: [10, 10]
              });
              return (
                <Marker key={punto._id} position={[punto.lat, punto.lng]} icon={iconDinamico}>
                  <Popup className="font-mono text-xs"><div className="text-black"><strong className="text-[#00aa00] block">{punto.etiqueta}</strong><span className="text-[9px] text-gray-500">LAT: {punto.lat}<br/>LNG: {punto.lng}</span></div></Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* BLOQUE 3: TORRE DE MONITORES CRT LATERALES (ORIGINALES) */}
        <div className="order-3 md:order-none md:col-start-1 md:row-start-2 bg-[#000400] p-4 flex flex-col md:min-h-0 md:overflow-hidden font-mono text-xs z-[450] md:border-r-2 shrink-0 md:shrink">
          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar pb-4 space-y-4">
            {puntos.length >= 3 ? (
              <>
                <MonitorCRT id="1" tag="TELEMETRÍA ING.">
                  <p className="text-[#00FF00] text-[10px] mb-1">ÁREA LOTE</p>
                  <p className="text-white font-black text-lg drop-shadow-[0_0_5px_#00FF00]">{calculosLote.area} <span className="text-[10px]">m²</span></p>
                  <div className="w-full mt-2 pt-2 border-t border-[#002200] flex justify-between px-4 text-[9px]"><span>PERÍMETRO:</span><span className="text-white font-bold">{calculosLote.perimetro} m</span></div>
                </MonitorCRT>
                <MonitorCRT id="2" tag="ESCÁNER AMBIENTAL">
                  {cargandoSensores ? <p className="text-center text-[#00FF00] animate-pulse text-[10px] uppercase">Buscando Señal...</p> : telemetriaAmbiental ? (
                    <div className="w-full grid grid-cols-2 gap-2 text-[10px] px-2 text-center">
                      <div className="border border-[#003300] bg-[#000500] p-1"><p className="text-[#008800]">⛰️ ALTITUD</p><p className="text-white font-bold">{telemetriaAmbiental.altitud} m</p></div>
                      <div className="border border-[#003300] bg-[#000500] p-1"><p className="text-[#008800]">🌡️ TEMP</p><p className="text-white font-bold">{telemetriaAmbiental.temperatura}°C</p></div>
                      <div className="border border-[#003300] bg-[#000500] p-1"><p className="text-[#008800]">💧 HUMEDAD</p><p className="text-white font-bold">{telemetriaAmbiental.humedad}%</p></div>
                      <div className="border border-[#003300] bg-[#000500] p-1"><p className="text-[#008800]">💨 VIENTO</p><p className="text-white font-bold">{telemetriaAmbiental.viento} km/h</p></div>
                    </div>
                  ) : <p className="text-red-500 text-[10px] uppercase">ERROR DE ENLACE</p>}
                </MonitorCRT>
                <MonitorCRT id="3" tag="CICLO SOLAR">
                  {cargandoSensores ? <p className="text-center text-[#00FF00] animate-pulse text-[10px] uppercase">Buscando Señal...</p> : telemetriaAmbiental ? (
                    <div className="w-full flex justify-around items-center px-2 text-[11px]">
                      <div className="text-center"><p className="text-[#008800] border-b border-[#003300] mb-1">🌅 AMANECER</p><p className="text-amber-400 font-bold drop-shadow-[0_0_5px_orange]">{telemetriaAmbiental.amanecer}</p></div>
                      <div className="text-[#003300] text-2xl">|</div>
                      <div className="text-center"><p className="text-[#008800] border-b border-[#003300] mb-1">🌇 OCASO</p><p className="text-orange-500 font-bold drop-shadow-[0_0_5px_red]">{telemetriaAmbiental.atardecer}</p></div>
                    </div>
                  ) : <p className="text-red-500 text-[10px] uppercase">ERROR DE ENLACE</p>}
                </MonitorCRT>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center border-4 border-[#002200] rounded-xl bg-[#010401] text-[#00FF00] font-mono shadow-[inset_0_0_50px_rgba(0,255,0,0.15)] relative overflow-hidden">
                <p className="text-[10px] uppercase animate-pulse relative z-20 text-center px-4">&gt;_ Esperando 3 balizas...</p>
              </div>
            )}
            
            <div className="mt-4 border-t-2 border-[#004400] pt-4">
              <p className="text-[9px] text-[#008800] uppercase font-bold mb-2 tracking-widest shrink-0">&gt; Vértices ({puntos.length})</p>
              <div className="space-y-2">
                {puntos.map((punto) => (
                  <div key={punto._id} className="border border-[#003300] bg-black p-2 flex flex-col gap-1 hover:border-[#00FF00] transition-colors">
                    <div className="flex justify-between items-center">
                      <input type="text" value={punto.etiqueta} onChange={(e) => modificarEtiquetaLocal(punto._id, e.target.value)} onBlur={(e) => guardarEtiquetaNube(punto._id, e.target.value)} className="bg-transparent border-b border-dashed border-[#004400] text-white font-bold focus:border-[#00FF00] focus:outline-none w-28 uppercase text-[10px]" />
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ backgroundColor: punto.colorCss }}></span><button onClick={() => eliminarPunto(punto._id)} className="text-red-500 hover:text-white font-bold text-[10px] px-1">[X]</button></div>
                    </div>
                    <div className="text-[9px] text-[#00CC00] opacity-80"><p>LAT: {punto.lat} | LNG: {punto.lng}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 EL NUEVO DASHBOARD HOLOGRÁFICO (SOLO APARECE CUANDO HAY 3 PUNTOS) */}
      {puntos.length >= 3 && <DashHolografico calculos={calculosLote} clima={telemetriaAmbiental} ubicacion={ubicacionNominal} />}

    </div>
  );
}
