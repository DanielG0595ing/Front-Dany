"use client";
import { useState, useRef } from 'react';

export default function TerminalInyeccion({ onMisionInyectada }) {
  // 🧠 CEREBRO LÓGICO RESTAURADO
  const [estadoRadar, setEstadoRadar] = useState('STANDBY');
  const formRef = useRef(null);

  const ejecutarInyeccion = async (e) => {
    e.preventDefault();
    setEstadoRadar('TRANSMITIENDO');

    const formData = new FormData(formRef.current);

    try {
      const respuesta = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/misiones`, {
        method: 'POST',
        body: formData,
      });

      if (!respuesta.ok) throw new Error('Escudos rechazaron el paquete');

      setEstadoRadar('EXITO');
      formRef.current.reset();
      if (onMisionInyectada) onMisionInyectada();
      setTimeout(() => setEstadoRadar('STANDBY'), 3000);
    } catch (error) {
      console.error(">_ Fallo en transmisión:", error);
      setEstadoRadar('ERROR');
      setTimeout(() => setEstadoRadar('STANDBY'), 4000);
    }
  };

  // 📱 INTERFAZ TÁCTICA FLUIDA (RESPONSIVE)
  return (
    <div className="border border-[#00FF00] bg-[#000800] p-4 md:p-6 shadow-[inset_0_0_15px_rgba(0,255,0,0.1)] relative text-sm">
      <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 border-b border-[#004400] pb-2 uppercase tracking-widest flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <span className="break-words max-w-full">&gt;_ Registro Táctico</span>
        <span className="text-[10px] md:text-xs text-[#00AA00] animate-pulse">[{estadoRadar}]</span>
      </h2>

      <form ref={formRef} onSubmit={ejecutarInyeccion} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="text-[10px] md:text-xs opacity-70 mb-1">OBRA *</label>
            <input required type="text" name="codigo_obra" placeholder="Ej: Nave LAG II" className="bg-black border border-[#004400] text-[#00FF00] p-2 md:p-3 focus:border-[#00FF00] focus:outline-none placeholder-[#002200] w-full" />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] md:text-xs opacity-70 mb-1">PROYECTO</label>
            <input type="text" name="nombre_proyecto" placeholder="Ej: MBS" className="bg-black border border-[#004400] text-[#00FF00] p-2 md:p-3 focus:border-[#00FF00] focus:outline-none placeholder-[#002200] w-full" />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] md:text-xs opacity-70 mb-1">ASIGNADO</label>
            <input type="text" name="operador_asignado" defaultValue="DG" className="bg-black border border-[#004400] text-[#00FF00] p-2 md:p-3 focus:border-[#00FF00] focus:outline-none w-full" />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] md:text-xs opacity-70 mb-1">PENDIENTE (DIRECTIVA PRINCIPAL) *</label>
          <input required type="text" name="titulo_mision" placeholder="Ej: Ingenieria de detalle" className="bg-black border border-[#004400] text-[#00FF00] p-2 md:p-3 focus:border-[#00FF00] focus:outline-none placeholder-[#002200] w-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* ========================================== */}
          {/* ➔ CALENDARIOS TÁCTICOS INYECTADOS (FC y F_NUEVA) */}
          {/* ========================================== */}
          <div className="flex flex-col">
            <label className="text-[10px] text-[#00AA00] font-bold tracking-wider mb-1">&gt; FC (COMPROMISO):</label>
            <input 
              type="date" 
              name="fecha_compromiso" 
              className="bg-black border border-[#00FF00] text-[#00FF00] p-2 md:p-3 uppercase focus:outline-none focus:ring-1 focus:ring-[#00FF00] font-mono dark:[color-scheme:dark] cursor-pointer w-full" 
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-[#00AA00] font-bold tracking-wider mb-1">&gt; F_NUEVA:</label>
            <input 
              type="date" 
              name="fecha_nueva" 
              className="bg-black border border-[#00FF00] text-[#00FF00] p-2 md:p-3 uppercase focus:outline-none focus:ring-1 focus:ring-[#00FF00] font-mono dark:[color-scheme:dark] cursor-pointer w-full" 
            />
          </div>
          {/* ========================================== */}

          <div className="flex flex-col">
            <label className="text-[10px] md:text-xs opacity-70 mb-1">ESTADO</label>
            <select name="estado_operativo" className="bg-black border border-[#004400] text-[#00FF00] p-2 md:p-3 focus:border-[#00FF00] focus:outline-none w-full cursor-pointer">
              <option value="SIN ACCION">SIN ACCION</option>
              <option value="EN PROCESO">EN PROCESO</option>
              <option value="FINALIZADO">FINALIZADO</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] md:text-xs opacity-70 mb-1">OCULTAR</label>
            <select name="ocultar" className="bg-black border border-[#004400] text-[#00FF00] p-2 md:p-3 focus:border-[#00FF00] focus:outline-none w-full cursor-pointer">
              <option value="NO">NO</option>
              <option value="SI">SI</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col border border-dashed border-[#004400] p-3 md:p-4 bg-[#000500] hover:border-[#00FF00] transition-colors">
          <label className="text-[10px] md:text-xs opacity-70 mb-2 font-bold block">CAPTURA DE TERRENO (UPLINK SATELITAL)</label>
          <input type="file" name="imagen" accept="image/*" className="text-[10px] md:text-xs text-[#00AA00] w-full file:mr-4 file:py-1 file:px-3 file:border-0 file:text-[10px] file:md:text-xs file:font-bold file:bg-[#003300] file:text-[#00FF00] hover:file:bg-[#00FF00] hover:file:text-black transition-colors cursor-pointer" />
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] md:text-xs opacity-70 mb-1">COMENTARIOS (TELEMETRÍA)</label>
          <textarea name="notas_telemetria" rows="2" placeholder="Línea 1&#10;Línea 2..." className="bg-black border border-[#004400] text-[#00FF00] p-2 md:p-3 focus:border-[#00FF00] focus:outline-none placeholder-[#002200] resize-none w-full"></textarea>
        </div>

        <button type="submit" disabled={estadoRadar === 'TRANSMITIENDO'} className="w-full p-3 md:p-4 text-xs md:text-sm font-bold uppercase tracking-widest bg-[#00FF00] text-black hover:bg-white transition-all disabled:bg-[#003300]">
          {estadoRadar === 'TRANSMITIENDO' ? 'ENVIANDO DATOS A MATRIZ...' : 'Inyectar Registro'}
        </button>
      </form>
    </div>
  );
}
