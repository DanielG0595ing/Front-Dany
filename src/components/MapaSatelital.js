"use client";
import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
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

  const baseLat = -34.6037;
  const baseLng = -58.3816;

  // ========================================================
  // 🛰️ ENLACE SATELITAL A MONGODB (OPERACIONES CRUD)
  // ========================================================

  // 1. EXTRAER COORDENADAS DE LA NUBE
  const cargarRadarCloud = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puntos`);
      const data = await res.json();
      setPuntos(data);
    } catch (error) {
      console.error(">_ ERROR DE LECTURA CARTOGRÁFICA");
    }
  }, []);

  useEffect(() => {
    cargarRadarCloud();
  }, [cargarRadarCloud]);

  // GENERADOR CROMÁTICO
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

  // 2. CLAVAR BALIZA EN LA NUBE (POST)
  const capturarPunto = async (lat, lng) => {
    setEstadoRadar('GUARDANDO...');
    const hue = generarColorUnico();
    const nuevoPunto = {
      lat,
      lng,
      hue,
      colorCss: `hsl(${hue}, 100%, 50%)`,
      etiqueta: `PUNTO_${(puntos.length + 1).toString().padStart(2, '0')}`
    };

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puntos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoPunto)
      });
      cargarRadarCloud(); // Refresca el mapa con el ID real de Mongo
      setEstadoRadar('STANDBY');
    } catch (error) {
      setEstadoRadar('ERROR DE ESCRITURA');
    }
  };

  // 3. PURGAR UNA BALIZA ESPECÍFICA (DELETE)
  const eliminarPunto = async (id) => {
    setEstadoRadar('PURGANDO...');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puntos/${id}`, { method: 'DELETE' });
      cargarRadarCloud();
      setEstadoRadar('STANDBY');
    } catch (error) {
      setEstadoRadar('ERROR');
    }
  };

  // 4. MODIFICACIÓN EN VIVO DE LA MATRIZ (Estado Local)
  const modificarEtiquetaLocal = (id, nuevoTexto) => {
    setPuntos(puntos.map(p => p._id === id ? { ...p, etiqueta: nuevoTexto.toUpperCase() } : p));
  };

  // 4.1 IMPACTAR MODIFICACIÓN EN LA NUBE (PUT al salir del cuadro de texto)
  const guardarEtiquetaNube = async (id, textoFinal) => {
    setEstadoRadar('ACTUALIZANDO...');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puntos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etiqueta: textoFinal })
      });
      setEstadoRadar('STANDBY');
    } catch (error) {
      setEstadoRadar('ERROR');
    }
  };

  // 5. PURGA TOTAL (DELETE ALL)
  const limpiarTodoElRadar = async () => {
    if (window.confirm("¿Desea DESTRUIR todas las coordenadas de la base de datos?")) {
      setEstadoRadar('DESTRUYENDO MATRIZ...');
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puntos/purga/total`, { method: 'DELETE' });
        cargarRadarCloud();
        setEstadoRadar('STANDBY');
      } catch (error) {
        setEstadoRadar('ERROR');
      }
    }
  };

  // 🔍 MOTOR DE BÚSQUEDA OSM
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

  return (
    // 🎛️ MATRIZ GRID RESPONSIVA (MANTENIDA INTACTA)
    <div className="w-full h-full grid grid-cols-1 md:grid-cols-[20rem_1fr] grid-rows-[auto_45vh_1fr] md:grid-rows-[auto_1fr] border-2 border-[#00FF00] bg-black shadow-[0_0_20px_rgba(0,255,0,0.1)] gap-0 overflow-hidden">
      
      {/* 🧭 BLOQUE 1: CONSOLA DE BÚSQUEDA Y CONTROL */}
      <div className="col-start-1 row-start-1 bg-[#000800] border-b border-[#004400] md:border-r-2 p-4 font-mono text-xs z-[450]">
        <div className="border-b border-[#00FF00] pb-2 mb-3 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-[#00FF00] font-black uppercase tracking-wider">Telemetría V3</h3>
            <p className="text-[9px] text-[#008800]">ING. DANIEL GARCÍA REGISTRY</p>
          </div>
          {puntos.length > 0 && (
            <button onClick={limpiarTodoElRadar} className="text-[9px] bg-red-950 text-red-400 border border-red-700 px-1 hover:bg-red-600 hover:text-white transition-colors font-bold">
              [ PURGAR NUBE ]
            </button>
          )}
        </div>

        <form onSubmit={ejecutarBusqueda} className="mb-1 shrink-0">
          <label className="text-[9px] text-[#00AA00] mb-1 block uppercase tracking-widest flex justify-between">
            <span>Rastreo Global (OSM)</span>
            <span className={`${estadoRadar !== 'STANDBY' ? 'animate-pulse text-white' : ''}`}>[{estadoRadar}]</span>
          </label>
          <div className="flex gap-1">
            <input 
              type="text" 
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              placeholder="Ej: Córdoba, Argentina..." 
              className="w-full bg-[#001100] border border-[#004400] text-[#00FF00] p-1.5 focus:border-[#00FF00] focus:outline-none placeholder-[#003300] text-[10px]"
            />
            <button type="submit" className="bg-[#003300] border border-[#00FF00] text-[#00FF00] px-3 font-bold hover:bg-[#00FF00] hover:text-black transition-colors">
              &gt;
            </button>
          </div>
        </form>
      </div>

      {/* 📊 BLOQUE 2: REGISTRO DE COORDENADAS (NUBE) */}
      <div className="col-start-1 row-start-3 md:row-start-2 md:col-start-1 bg-[#000800] border-t border-[#004400] md:border-t-0 md:border-r-2 p-4 flex flex-col min-h-0 overflow-hidden font-mono text-xs z-[450]">
        <p className="text-[9px] text-[#008800] uppercase font-bold mb-2 tracking-widest block md:hidden">&gt; Puntos en Base de Datos</p>
        <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {puntos.map((punto) => (
            <div key={punto._id} className="border border-[#003300] bg-black p-2 flex flex-col gap-1 hover:border-[#00FF00] transition-colors">
              <div className="flex justify-between items-center">
                <input 
                  type="text" 
                  value={punto.etiqueta} 
                  onChange={(e) => modificarEtiquetaLocal(punto._id, e.target.value)}
                  onBlur={(e) => guardarEtiquetaNube(punto._id, e.target.value)} // <--- AQUÍ SE GUARDA AL TERMINAR DE ESCRIBIR
                  className="bg-transparent border-b border-dashed border-[#004400] text-white font-bold focus:border-[#00FF00] focus:outline-none w-28 uppercase text-[10px]"
                />
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ backgroundColor: punto.colorCss }}></span>
                  <button onClick={() => eliminarPunto(punto._id)} className="text-red-500 hover:text-white font-bold text-[10px] px-1">[X]</button>
                </div>
              </div>
              <div className="text-[9px] text-[#00CC00] space-y-0.5 opacity-80">
                <p>LAT: {punto.lat}</p>
                <p>LNG: {punto.lng}</p>
              </div>
            </div>
          ))}
          {puntos.length === 0 && (
            <div className="h-full flex items-center justify-center text-[#004400] text-center italic uppercase text-[10px] py-6">
              &gt; LA NUBE ESTÁ VACÍA
            </div>
          )}
        </div>
      </div>

      {/* 🗺️ BLOQUE 3: LIENZO CARTOGRÁFICO */}
      <div className="col-start-1 row-start-2 md:row-start-1 md:row-span-2 md:col-start-2 h-full w-full relative z-0 border-t border-b border-[#004400] md:border-t-0 md:border-b-0">
        <div className="absolute top-4 right-4 z-[400] bg-[#000a00]/90 border border-[#00FF00] p-3 backdrop-blur-sm shadow-[0_0_10px_rgba(0,255,0,0.2)] pointer-events-none">
          <h3 className="text-[#00FF00] text-[10px] uppercase font-bold tracking-widest border-b border-[#004400] mb-2 pb-1">Marcador Nube</h3>
          {puntos.length > 0 ? (
            <div className="text-white text-[10px] font-mono space-y-1">
              <p><span className="text-[#008800]">DB_REGS:</span> {puntos.length.toString().padStart(2, '0')}</p>
              <p><span className="text-[#008800]">ÚLT_L:</span> {puntos[puntos.length - 1].lat}</p>
              <p><span className="text-[#008800]">ÚLT_G:</span> {puntos[puntos.length - 1].lng}</p>
            </div>
          ) : (
            <p className="text-[#00AA00] text-[9px] uppercase">ESPERANDO UPLINK</p>
          )}
        </div>

        <MapContainer 
          center={[baseLat, baseLng]} 
          zoom={12} 
          style={{ height: '100%', width: '100%', background: '#000800' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a> | OSM'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          <EscanerCoordenadas onPuntoCapturado={capturarPunto} />
          <ControladorVuelo objetivo={objetivoVuelo} />
          
          {puntos.map((punto) => {
            const iconDinamico = L.divIcon({
              className: 'custom-radar-icon',
              html: `
                <div class="relative w-5 h-5">
                  <div class="absolute inset-0 rounded-full animate-ping opacity-60" style="background-color: ${punto.colorCss}"></div>
                  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border-2 border-black rounded-full shadow-[0_0_8px_${punto.colorCss}]" style="background-color: ${punto.colorCss}"></div>
                </div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });

            return (
              <Marker key={punto._id} position={[punto.lat, punto.lng]} icon={iconDinamico}>
                <Popup className="font-mono text-xs">
                  <div className="text-black">
                    <strong className="text-[#00aa00] block">{punto.etiqueta}</strong>
                    <span className="text-[9px] text-gray-500">LAT: {punto.lat}<br/>LNG: {punto.lng}</span>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}