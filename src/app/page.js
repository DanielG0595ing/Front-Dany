"use client";
import { useState, useEffect, useCallback } from 'react';
import TerminalInyeccion from '../components/TerminalInyeccion';
import AccesoRestringido from '../components/AccesoRestringido';

export default function CentroDeComando() {
  const [misiones, setMisiones] = useState([]);
  const [status, setStatus] = useState('ESPERANDO...');
  const [loading, setLoading] = useState(true);
  const [mostrarTerminal, setMostrarTerminal] = useState(false);
  const [ipOrigen, setIpOrigen] = useState('INICIALIZANDO ESCÁNER...');

  const sincronizarRadar = useCallback(async () => {
    setLoading(true);
    try {
      const resHealth = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/healthcheck`);
      const dataHealth = await resHealth.json();
      setStatus(dataHealth.database_connection === 'Conectado' ? 'OPERATIVO' : 'ERROR MATRIZ');

      const resMisiones = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/misiones`);
      const dataMisiones = await resMisiones.json();
      setMisiones(dataMisiones);
    } catch (error) {
      setStatus('OFFLINE');
      console.error(">_ FALLO EN EL ENLACE DE TELEMETRÍA");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    sincronizarRadar();
    setIpOrigen('BUENOS_AIRES_BASE');
  }, [sincronizarRadar]);

  return (
    // 🛡️ ESCUDOS PERIMETRALES ACTIVADOS
    <AccesoRestringido>
      {/* 📱 ADAPTACIÓN: Padding reducido en móviles (p-4), expandido en desktop (md:p-8) */}
      <main className="min-h-screen bg-black text-[#00FF00] font-mono p-4 md:p-8 selection:bg-[#005500] selection:text-white pb-24 md:pb-20">
        
        {/* 🛡️ ENCABEZADO TÁCTICO */}
        {/* 📱 ADAPTACIÓN: Columna en móvil, fila en desktop. Textos adaptables. */}
        <header className="border-b-2 border-[#00FF00] pb-6 mb-8 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-center shadow-[0_0_20px_rgba(0,255,0,0.15)] gap-4 md:gap-0">
          <div className="w-full md:w-auto">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic break-words">
              Monitor <span className="text-white bg-[#00FF00] px-2 not-italic">Logístico</span>
            </h1>
            <p className="text-[#00CC00] mt-2 text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] font-bold">
              &gt; INFRAESTRUCTURA DE DATOS PARA INGENIERÍA CIVIL
            </p>
          </div>
          
          <div className="border-l-2 border-[#004400] pl-4 md:pl-6 text-left md:text-right w-full md:w-auto">
            <div className="flex items-center justify-start md:justify-end gap-2">
              <span className={`h-3 w-3 rounded-full shrink-0 ${status === 'OPERATIVO' ? 'bg-[#00FF00] animate-pulse' : 'bg-red-600'}`}></span>
              <p className="text-sm font-bold">SISTEMA: {status}</p>
            </div>
            <p className="text-[10px] opacity-60">REFRESH_RATE: 0.5s</p>
          </div>
        </header>

        {/* 📊 DASHBOARD PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          
          {/* COLUMNA IZQUIERDA: MÉTRICAS */}
          <aside className="space-y-6">
            <div className="border border-[#00FF00] p-4 bg-[#000800]">
              <h3 className="text-xs font-bold mb-3 border-b border-[#004400] pb-1 uppercase">Métricas Globales</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] opacity-50 uppercase text-white">Misiones en Radar</p>
                  <p className="text-3xl font-bold">{misiones.length.toString().padStart(2, '0')}</p>
                </div>
                <div className="h-1 bg-[#002200] w-full relative overflow-hidden">
                  <div className="h-full bg-[#00FF00] w-full opacity-20 animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="border border-[#004400] p-4 text-[10px] md:text-xs leading-relaxed text-[#008800] break-all md:break-normal">
              <p>&gt; LOG_SESSION: INICIADA</p>
              <p>&gt; IP_ORIGEN: {ipOrigen}</p>
              <p>&gt; ENCRYPT: AES-256-GCM</p>
            </div>
          </aside>

          {/* COLUMNA CENTRAL/DERECHA: GRILLA Y TERMINAL */}
          <section className="lg:col-span-3">
            {/* 📱 ADAPTACIÓN: Botón ocupa todo el ancho en móvil */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest">&gt; Despliegue Operativo</h2>
              
              <button 
                onClick={() => setMostrarTerminal(!mostrarTerminal)}
                className={`w-full sm:w-auto px-4 py-2 sm:py-1 text-xs font-bold transition-colors uppercase border border-[#00FF00] ${
                  mostrarTerminal ? 'bg-black text-[#00FF00] hover:bg-[#002200]' : 'bg-[#00FF00] text-black hover:bg-white hover:border-white'
                }`}>
                {mostrarTerminal ? '[ - ] ABORTAR INYECCIÓN' : '[ + ] INYECTAR NUEVA OBRA'}
              </button>
            </div>

            {/* 💥 MÓDULO DE INYECCIÓN */}
            {mostrarTerminal && (
              <div className="mb-8 animate-[fadeIn_0.3s_ease-in-out]">
                <TerminalInyeccion onMisionInyectada={() => {
                  sincronizarRadar(); 
                  setMostrarTerminal(false); 
                }} />
              </div>
            )}

            {/* 📡 LECTURA DEL RADAR */}
            {loading ? (
              <div className="h-48 md:h-64 border-2 border-dashed border-[#003300] flex items-center justify-center italic opacity-50 text-xs md:text-base text-center p-4">
                Escaneando frecuencias...
              </div>
            ) : misiones.length === 0 ? (
              <div className="p-10 md:p-20 border-2 border-dashed border-[#003300] text-center bg-[#000500]">
                <p className="text-sm md:text-xl opacity-40 mb-4">[ RADAR LIMPIO - NO SE DETECTAN OBRAS ACTIVAS ]</p>
                <p className="text-[10px] md:text-xs opacity-30">USE EL BOTÓN SUPERIOR PARA COMENZAR</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                
                {misiones.map((mision) => {
                  const primeraLineaComentario = mision.notas_telemetria 
                    ? mision.notas_telemetria.split('\n')[0] 
                    : 'SIN NOVEDADES EN EL FRENTE';

                  return (
                    <div key={mision._id} className="border border-[#004400] bg-[#000a00] p-3 md:p-4 hover:border-[#00FF00] transition-all duration-300 relative group shadow-[0_0_10px_rgba(0,255,0,0.05)] flex flex-col justify-between">
                      
                      <div>
                        {/* TOP: INFRAESTRUCTURA */}
                        <div className="flex justify-between items-start mb-3 border-b border-[#002200] pb-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-[9px] md:text-[10px] bg-[#003300] text-[#00FF00] px-2 py-0.5 font-bold uppercase tracking-widest inline-block w-max">
                              {mision.nombre_proyecto || 'S/P'}
                            </span>
                            <span className="text-[9px] md:text-[10px] text-white opacity-50 font-bold">
                              FC: {mision.fecha_compromiso || 'N/A'}
                            </span>
                          </div>
                          <div className="text-right text-[9px] md:text-[10px] flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                            {mision.ocultar === 'SI' && <span className="bg-red-900 text-white px-1 font-bold">OCULTO</span>}
                            <div className="flex gap-1">
                              <span className="opacity-60">F_NUEVA:</span>
                              <span className="text-white font-bold">{mision.fecha_nueva || '-'}</span>
                            </div>
                          </div>
                        </div>

                        {/* CENTRO: TEXTO E IMAGEN */}
                        <div className="flex gap-3 md:gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base md:text-xl font-black text-white uppercase truncate tracking-tight">{mision.codigo_obra}</h3>
                            <p className="text-[10px] md:text-xs text-[#00FF00] opacity-90 font-bold line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
                              &gt; {mision.titulo_mision}
                            </p>
                          </div>

                          {/* MUESTRA ÓPTICA */}
                          {mision.imagen_cloudinary_url ? (
                            <div className="relative w-16 h-16 md:w-20 md:h-20 border border-[#00FF00] overflow-hidden bg-black shrink-0 group-hover:scale-105 transition-transform shadow-[0_0_10px_rgba(0,255,0,0.2)]">
                              <img src={mision.imagen_cloudinary_url} alt="Satélite" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                              <a href={mision.imagen_cloudinary_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 md:group-hover:opacity-100 transition-opacity text-[8px] md:text-[9px] font-bold font-mono text-[#00FF00] cursor-pointer tracking-widest text-center">
                                EXPANDIR
                              </a>
                            </div>
                          ) : (
                            <div className="w-16 h-16 md:w-20 md:h-20 border border-dashed border-[#003300] flex items-center justify-center text-[8px] md:text-[9px] text-[#004400] text-center shrink-0 font-bold tracking-widest">
                              NO SCAN
                            </div>
                          )}
                        </div>

                        {/* COMENTARIOS */}
                        <div className="bg-[#001100] border-l-2 border-[#00AA00] p-2 text-[10px] md:text-[11px] text-[#00CC00] italic truncate shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                          <span className="text-[8px] md:text-[9px] font-bold uppercase not-italic text-[#005500] block mb-0.5">Telemetría (Log):</span>
                          "{primeraLineaComentario}"
                        </div>
                      </div>

                      {/* BOTTOM: OPERADOR Y ESTADO */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] md:text-[11px] mt-4 border-t border-[#002200] pt-3 gap-2 sm:gap-0">
                        <span className="opacity-70">OP: <strong className="text-white text-[10px] md:text-xs ml-1">{mision.operador_asignado}</strong></span>
                        <span className={`px-2 py-1 font-bold tracking-widest text-[9px] md:text-[10px] border w-full sm:w-auto text-center ${
                          mision.estado_operativo === 'FINALIZADO' ? 'bg-[#003300] text-[#00FF00] border-[#00FF00]' : 
                          mision.estado_operativo === 'EN PROCESO' ? 'bg-[#332200] text-yellow-400 border-yellow-500 animate-pulse' : 
                          'bg-black text-gray-500 border-gray-700'
                        }`}>
                          [{mision.estado_operativo}]
                        </span>
                      </div>

                    </div>
                  );
                })}

              </div>
            )}
          </section>
        </div>

        {/* 📡 PIE DE PÁGINA CLANDESTINO */}
        {/* 📱 ADAPTACIÓN: Textos apilados en móvil y más legibles */}
        <footer className="fixed bottom-0 left-0 w-full bg-black border-t border-[#002200] p-2 md:px-8 text-[8px] md:text-[10px] flex flex-col md:flex-row justify-between items-center md:items-start opacity-90 italic z-50 text-center gap-1 md:gap-0">
          <p className="text-[#00FF00]">TERMINAL LOGÍSTICA V3.0 - LICENCIA VIP: ING. CIVIL DANIEL GARCÍA</p>
          <p className="text-[#005500]">DESARROLLADO EN LAS SOMBRAS POR @MANUEXPLORA & BASE IA</p>
        </footer>
      </main>
    </AccesoRestringido>
  );
}