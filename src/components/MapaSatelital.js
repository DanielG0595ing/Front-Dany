"use client";
import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polygon } from 'react-leaflet';
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

  // Estados analíticos de ingeniería
  const [calculosLote, setCalculosLote] = useState({ area: 0, perimetro: 0, tramos: [] });
  const [telemetriaAmbiental, setTelemetriaAmbiental] = useState(null);
  const [cargandoSensores, setCargandoSensores] = useState(false);

  const baseLat = -34.6037;
  const baseLng = -58.3816;

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

  useEffect(() => {
    cargarRadarCloud();
  }, [cargarRadarCloud]);

  // ========================================================
  // 🧮 MOTORES MATEMÁTICOS DE INGENIERÍA CIVIL
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
  // 📡 ENLACES EXTERNOS: ESCÁNER DE ENTORNO SATELLITAL
  // ========================================================
  const consultarSensoresAmbientales = useCallback(async (centroLat, centroLng) => {
    setCargandoSensores(true);
    try {
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

  // Monitor Métrico + Disparador de Sensores
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

      const centroLat = (sumaLat / puntos.length).toFixed(6);
      const centroLng = (sumaLng / puntos.length).toFixed(6);
      
      const timer = setTimeout(() => {
        consultarSensoresAmbientales(centroLat, centroLng);
      }, 1000);

      return () => clearTimeout(timer);

    } else {
      setCalculosLote({ area: 0, perimetro: 0, tramos: [] });
      setTelemetriaAmbiental(null);
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
      lat,
      lng,
      hue,
      colorCss: `hsl(${hue}, 100%, 50%)`,
      etiqueta: `PT_${(puntos.length + 1).toString().padStart(2, '0')}`
    };

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puntos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoPunto)
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
      cargarRadarCloud();
      setEstadoRadar('STANDBY');
    } catch (error) {
      setEstadoRadar('ERROR');
    }
  };

  const modificarEtiquetaLocal = (id, nuevoTexto) => {
    setPuntos(puntos.map(p => p._id === id ? { ...p, etiqueta: nuevoTexto.toUpperCase() } : p));
  };

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

  return (
    <div className="w-full h-full flex flex-col md:grid md:grid-cols-[22rem_1fr] md:grid-rows-[auto_1fr] border-2 border-[#00FF00] bg-black shadow-[0_0_20px_rgba(0,255,0,0.1)] overflow-y-auto md:overflow-hidden custom-scrollbar">
      
      {/* 🧭 BLOQUE 1: CONSOLA DE CONTROL */}
      <div className="order-1 md:col-start-1 md:row-start-1 bg-[#000800] border-b border-[#004400] md:border-r-2 p-4 font-mono text-xs z-[450] shrink-0">
        <div className="border-b border-[#00FF00] pb-2 mb-3 flex justify-between items-center">
          <div>
            <h3 className="text-[#00FF00] font-black uppercase tracking-wider">CIVIL ANALYTICS V5</h3>
            <p className="text-[9px] text-[#008800]">RADAR GEOMÉTRICO + AMBIENTAL</p>
          </div>
          {puntos.length > 0 && (
            <button onClick={limpiarTodoElRadar} className="text-[9px] bg-red-950 text-red-400 border border-red-700 px-1 hover:bg-red-600 hover:text-white transition-colors font-bold">
              [ PURGAR NUBE ]
            </button>
          )}
        </div>

        <form onSubmit={ejecutarBusqueda} className="mb-1">
          <label className="text-[9px] text-[#00AA00] mb-1 block uppercase tracking-widest flex justify-between">
            <span>Rastreo de Lote (OSM)</span>
            <span className={`${estadoRadar !== 'STANDBY' ? 'animate-pulse text-white' : ''}`}>[{estadoRadar}]</span>
          </label>
          <div className="flex gap-1">
            <input 
              type="text" 
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              placeholder="Ej: Córdoba..." 
              className="w-full bg-[#001100] border border-[#004400] text-[#00FF00] p-1.5 focus:border-[#00FF00] focus:outline-none placeholder-emerald-950 text-[10px]"
            />
            <button type="submit" className="bg-[#003300] border border-[#00FF00] text-[#00FF00] px-3 font-bold hover:bg-[#00FF00] hover:text-black transition-colors">
              &gt;
            </button>
          </div>
        </form>
      </div>

      {/* 🗺️ BLOQUE 2: LIENZO CARTOGRÁFICO */}
      <div className="order-2 md:order-none md:col-start-2 md:row-start-1 md:row-span-2 h-[50vh] min-h-[350px] md:h-full md:min-h-0 w-full relative z-0 shrink-0 border-b border-[#004400] md:border-b-0">
        <MapContainer 
          center={[baseLat, baseLng]} 
          zoom={12} 
          style={{ height: '100%', width: '100%', background: '#000800' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          <EscanerCoordenadas onPuntoCapturado={capturarPunto} />
          <ControladorVuelo objetivo={objetivoVuelo} />

          {posicionesPoligono.length >= 3 && (
            <Polygon 
              positions={posicionesPoligono} 
              pathOptions={{
                color: '#00FF00', 
                fillColor: '#00FF00', 
                fillOpacity: 0.15,
                dashArray: '5, 5',
                weight: 2
              }} 
            />
          )}
          
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

      {/* 📊 BLOQUE 3: REGISTRO Y CALCULADORA */}
      <div className="order-3 md:order-none md:col-start-1 md:row-start-2 bg-[#000800] p-4 flex flex-col md:min-h-0 md:overflow-hidden font-mono text-xs z-[450] md:border-r-2 shrink-0 md:shrink">
        
        {puntos.length >= 3 && (
          <div className="border border-[#00FF00] bg-[#000e00] p-3 mb-3 shadow-[0_0_10px_rgba(0,255,0,0.1)] shrink-0 space-y-1">
            <p className="text-white font-bold text-[10px] uppercase border-b border-[#004400] pb-1 text-center mb-1">📐 TELEMETRÍA DE INGENIERÍA</p>
            <p className="text-[#00FF00] text-[11px]">ÁREA LOTE: <span className="text-white font-black">{calculosLote.area}</span> m²</p>
            <p className="text-[#00FF00] text-[11px]">PERÍMETRO: <span className="text-white font-black">{calculosLote.perimetro}</span> m</p>
            
            <div className="pt-1.5 border-t border-[#003300] max-h-20 overflow-y-auto custom-scrollbar text-[9px] text-[#00AA00] space-y-0.5">
              {calculosLote.tramos.map((t, idx) => (
                <p key={idx}>🔹 Lado {t.de}➔{t.a}: <span className="text-white">{t.distancia} m</span></p>
              ))}
            </div>
          </div>
        )}

        {puntos.length >= 3 && (
          <div className="border border-amber-500 bg-[#0d0900] p-3 mb-4 shadow-[0_0_10px_rgba(245,158,11,0.1)] shrink-0">
            <p className="text-amber-500 font-bold text-[10px] uppercase border-b border-amber-900 pb-1 text-center mb-2">📡 ESCÁNER AMBIENTAL CENTRAL</p>
            
            {cargandoSensores ? (
              <p className="text-center text-amber-600 animate-pulse text-[10px] uppercase py-2">&gt; Interrogando Satélites...</p>
            ) : telemetriaAmbiental ? (
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-amber-400 font-mono">
                <p>⛰️ ALTITUD: <span className="text-white font-bold">{telemetriaAmbiental.altitud} m</span></p>
                <p>🌡️ TEMP: <span className="text-white font-bold">{telemetriaAmbiental.temperatura}°C</span></p>
                <p>💧 HUMEDAD: <span className="text-white font-bold">{telemetriaAmbiental.humedad}%</span></p>
                <p>💨 VIENTO: <span className="text-white font-bold">{telemetriaAmbiental.viento} km/h</span></p>
                <div className="col-span-2 pt-1.5 mt-1 border-t border-amber-950 flex justify-between text-[9px] text-amber-500/80">
                  <span>🌅 AMANECER: <strong className="text-white">{telemetriaAmbiental.amanecer}</strong></span>
                  <span>🌇 OCASO: <strong className="text-white">{telemetriaAmbiental.atardecer}</strong></span>
                </div>
              </div>
            ) : (
              <p className="text-center text-red-500 text-[9px] uppercase">FALLO AL ENLAZAR SENSORES</p>
            )}
          </div>
        )}

        <p className="text-[9px] text-[#008800] uppercase font-bold mb-2 tracking-widest shrink-0">&gt; Vértices del Terreno ({puntos.length})</p>
        
        <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[200px] md:min-h-0 pb-4 md:pb-0">
          {puntos.map((punto) => (
            <div key={punto._id} className="border border-[#003300] bg-black p-2 flex flex-col gap-1 hover:border-[#00FF00] transition-colors">
              <div className="flex justify-between items-center">
                <input 
                  type="text" 
                  value={punto.etiqueta} 
                  onChange={(e) => modificarEtiquetaLocal(punto._id, e.target.value)}
                  onBlur={(e) => guardarEtiquetaNube(punto._id, e.target.value)}
                  className="bg-transparent border-b border-dashed border-[#004400] text-white font-bold focus:border-[#00FF00] focus:outline-none w-28 uppercase text-[10px]"
                />
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ backgroundColor: punto.colorCss }}></span>
                  <button onClick={() => eliminarPunto(punto._id)} className="text-red-500 hover:text-white font-bold text-[10px] px-1">[X]</button>
                </div>
              </div>
              <div className="text-[9px] text-[#00CC00] opacity-80">
                <p>LAT: {punto.lat} | LNG: {punto.lng}</p>
              </div>
            </div>
          ))}
          {puntos.length === 0 && (
            <div className="h-full flex items-center justify-center text-[#004400] text-center italic uppercase text-[10px] py-6">
              &gt; CLAVE PUNTOS EN EL MAPA PARA GEOPROCESAR LOTE
            </div>
          )}
        </div>
      </div>
    </div>
  );
}