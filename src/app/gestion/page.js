"use client";
import { useState, useEffect, useCallback } from 'react';
import AccesoRestringido from '../../components/AccesoRestringido';

export default function CuartoOscuro() {
  const [misiones, setMisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🛡️ ESTADOS DEL MÓDULO DE RECALIBRACIÓN
  const [misionEditando, setMisionEditando] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [estadoEdicion, setEstadoEdicion] = useState('STANDBY');

  const cargarMatriz = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/misiones`);
      const data = await res.json();
      setMisiones(data);
    } catch (error) {
      console.error(">_ ERROR DE ENLACE SATELITAL");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarMatriz();
  }, [cargarMatriz]);

  const ejecutarPurga = async (id, codigo_obra) => {
    const confirmar = window.confirm(`[ADVERTENCIA CRÍTICA]\n\n¿Desea ELIMINAR la obra [ ${codigo_obra} ] definitivamente?`);
    if (!confirmar) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/misiones/${id}`, { method: 'DELETE' });
      cargarMatriz();
    } catch (error) {
      alert("FALLO EN LA PURGA.");
    }
  };

  const alternarCamuflaje = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'SI' ? 'NO' : 'SI';
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/misiones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocultar: nuevoEstado })
      });
      cargarMatriz();
    } catch (error) {
      alert("FALLO DE CAMUFLAJE.");
    }
  };

  const abrirEditor = (mision) => {
    setMisionEditando(mision._id);
    setDatosEdicion({ ...mision }); 
  };

  const cerrarEditor = () => {
    setMisionEditando(null);
    setDatosEdicion({});
    setEstadoEdicion('STANDBY');
  };

  // 💾 EJECUTAR RECALIBRACIÓN TOTAL (VÍA FORMDATA)
  const guardarCambios = async (e) => {
    e.preventDefault();
    setEstadoEdicion('TRANSMITIENDO');
    
    // Capturamos todos los datos (incluyendo la imagen si hay una nueva)
    const formData = new FormData(e.target);

    try {
      const respuesta = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/misiones/${misionEditando}`, {
        method: 'PUT',
        body: formData // Enviamos el paquete completo al backend
      });

      if (!respuesta.ok) throw new Error('Rechazado por el servidor');
      
      cerrarEditor();
      cargarMatriz();
    } catch (error) {
      alert("FALLO AL RECALIBRAR LA MATRIZ.");
      setEstadoEdicion('ERROR');
    }
  };

  return (
    <AccesoRestringido>
      <div className="min-h-screen bg-[#000500] text-[#00FF00] font-mono relative overflow-x-hidden selection:bg-[#005500] selection:text-white">
        
        <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(0,25,0,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40"></div>
        <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[#002200] rounded-full opacity-10 z-0">
          <div className="absolute top-1/2 left-1/2 w-[400px] h-1 bg-gradient-to-r from-transparent to-[#00FF00] origin-left animate-[spin_4s_linear_infinite] opacity-50"></div>
        </div>

        <main className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto pb-24 drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]">
          <header className="border-b-4 border-double border-[#00FF00] pb-4 mb-8">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-widest">
              RobCo Industries <span className="text-xs md:text-sm bg-[#00FF00] text-black px-2 py-1 align-top ml-2">UNIFIED OP</span>
            </h1>
            <p className="mt-2 text-sm uppercase opacity-80">&gt; TERMINAL DE CONTROL MAESTRO</p>
            <p className="mt-1 text-[10px] md:text-xs text-[#00AA00] tracking-widest">
              USUARIO VIP REGISTRADO: <strong className="text-white">ING. CIVIL DANIEL GARCÍA</strong>
            </p>
          </header>

          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold uppercase">&gt; ARSENAL DE GESTIÓN (CRUD)</h2>
              <p className="text-xs opacity-60">ADMINISTRACIÓN DIRECTA DE MATRIZ MONGODB</p>
            </div>
            <a href="/" className="border border-[#00FF00] px-4 py-2 text-xs uppercase hover:bg-[#00FF00] hover:text-black transition-colors font-bold bg-[#001100]">
              [ RETORNAR AL RADAR ]
            </a>
          </div>

          {loading ? (
            <div className="p-10 border border-[#00FF00] bg-[#001100] text-center animate-pulse">
              <p className="text-xl">&gt; ESTABLECIENDO ENLACE...</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#00FF00] bg-[#000a00]/90 backdrop-blur-sm">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#003300] text-[#00FF00] uppercase tracking-wider border-b border-[#00FF00]">
                    <th className="p-3 whitespace-nowrap">Código Obra</th>
                    <th className="p-3 whitespace-nowrap">Proyecto</th>
                    <th className="p-3 whitespace-nowrap">Estado</th>
                    <th className="p-3 whitespace-nowrap text-center">Camuflaje</th>
                    <th className="p-3 whitespace-nowrap text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#003300]">
                  {misiones.map((mision) => (
                    <tr key={mision._id} className="hover:bg-[#001a00] transition-colors group">
                      <td className="p-3 font-bold text-white whitespace-nowrap">{mision.codigo_obra}</td>
                      <td className="p-3 text-[#00AA00] whitespace-nowrap">{mision.nombre_proyecto || '-'}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-[10px] font-bold ${mision.estado_operativo === 'FINALIZADO' ? 'bg-[#003300] text-[#00FF00]' : 'bg-[#332200] text-yellow-500'}`}>
                          {mision.estado_operativo}
                        </span>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <button onClick={() => alternarCamuflaje(mision._id, mision.ocultar)} className={`px-3 py-1 text-[10px] font-bold border transition-colors ${mision.ocultar === 'SI' ? 'bg-red-900 border-red-500 text-white animate-pulse' : 'bg-transparent border-[#004400] text-[#004400] hover:border-[#00FF00] hover:text-[#00FF00]'}`}>
                          {mision.ocultar === 'SI' ? '🥷 ACTIVO' : 'NO ACTIVO'}
                        </button>
                      </td>
                      <td className="p-2 md:p-3 align-middle">
                        <div className="flex flex-col lg:flex-row justify-end items-end lg:items-center gap-2">
                          <button onClick={() => abrirEditor(mision)} className="w-full lg:w-auto px-2 md:px-3 py-1.5 bg-[#002200] border border-[#00FF00] text-[#00FF00] hover:bg-[#00FF00] hover:text-black font-bold text-[9px] md:text-[10px] transition-colors text-center shadow-[0_0_5px_rgba(0,255,0,0.2)] whitespace-nowrap">
                            📝 EDITAR
                          </button>
                          <button onClick={() => ejecutarPurga(mision._id, mision.codigo_obra)} className="w-full lg:w-auto px-2 md:px-3 py-1.5 bg-[#220000] border border-red-600 text-red-500 hover:bg-red-600 hover:text-white font-bold text-[9px] md:text-[10px] transition-colors text-center shadow-[0_0_5px_rgba(255,0,0,0.2)] whitespace-nowrap">
                            💀 PURGAR
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {/* 💻 MÓDULO SUPERPUESTO (MODAL) DE EDICIÓN TOTAL */}
        {misionEditando && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 md:p-4 animate-[fadeIn_0.2s_ease-in-out]">
            <div className="bg-[#000800] border-2 border-[#00FF00] w-full max-w-3xl max-h-[95vh] flex flex-col shadow-[0_0_30px_rgba(0,255,0,0.2)] relative">
              
              <div className="flex justify-between items-center border-b border-[#004400] p-4 shrink-0">
                <h3 className="text-lg md:text-xl font-bold uppercase">&gt; Recalibración Total</h3>
                <button onClick={cerrarEditor} className="text-[#00FF00] hover:text-black border border-[#00FF00] hover:bg-[#00FF00] px-2 py-1 font-bold transition-colors">
                  [X] ABORTAR
                </button>
              </div>
              
              {/* Contenedor con Scroll Interno para móviles */}
              <div className="p-4 overflow-y-auto custom-scrollbar flex-grow">
                <form onSubmit={guardarCambios} className="space-y-4">
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <label className="text-[10px] opacity-70 mb-1">CÓDIGO OBRA *</label>
                      <input required type="text" name="codigo_obra" defaultValue={datosEdicion.codigo_obra} className="bg-black border border-[#004400] text-[#00FF00] p-2 focus:border-[#00FF00] focus:outline-none uppercase text-xs w-full" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] opacity-70 mb-1">PROYECTO</label>
                      <input type="text" name="nombre_proyecto" defaultValue={datosEdicion.nombre_proyecto} className="bg-black border border-[#004400] text-[#00FF00] p-2 focus:border-[#00FF00] focus:outline-none uppercase text-xs w-full" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] opacity-70 mb-1">ASIGNADO</label>
                      <input type="text" name="operador_asignado" defaultValue={datosEdicion.operador_asignado} className="bg-black border border-[#004400] text-[#00FF00] p-2 focus:border-[#00FF00] focus:outline-none uppercase text-xs w-full" />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] opacity-70 mb-1">TÍTULO MISIÓN (DIRECTIVA) *</label>
                    <input required type="text" name="titulo_mision" defaultValue={datosEdicion.titulo_mision} className="bg-black border border-[#004400] text-[#00FF00] p-2 focus:border-[#00FF00] focus:outline-none uppercase text-xs w-full" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    {/* ========================================== */}
                    {/* ➔ CALENDARIOS TÁCTICOS INYECTADOS (EDICIÓN) */}
                    {/* ========================================== */}
                    <div className="flex flex-col">
                      <label className="text-[10px] text-[#00AA00] font-bold tracking-wider mb-1">&gt; FC (COMPROMISO):</label>
                      <input 
                        type="date" 
                        name="fecha_compromiso" 
                        defaultValue={datosEdicion.fecha_compromiso} 
                        className="bg-black border border-[#00FF00] text-[#00FF00] p-2 uppercase focus:outline-none focus:ring-1 focus:ring-[#00FF00] font-mono dark:[color-scheme:dark] cursor-pointer text-xs w-full" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] text-[#00AA00] font-bold tracking-wider mb-1">&gt; F_NUEVA:</label>
                      <input 
                        type="date" 
                        name="fecha_nueva" 
                        defaultValue={datosEdicion.fecha_nueva} 
                        className="bg-black border border-[#00FF00] text-[#00FF00] p-2 uppercase focus:outline-none focus:ring-1 focus:ring-[#00FF00] font-mono dark:[color-scheme:dark] cursor-pointer text-xs w-full" 
                      />
                    </div>
                    {/* ========================================== */}

                    <div className="flex flex-col">
                      <label className="text-[10px] opacity-70 mb-1">ESTADO</label>
                      <select name="estado_operativo" defaultValue={datosEdicion.estado_operativo} className="bg-black border border-[#004400] text-[#00FF00] p-2 focus:border-[#00FF00] focus:outline-none uppercase text-xs w-full cursor-pointer">
                        <option value="SIN ACCION">SIN ACCION</option>
                        <option value="EN PROCESO">EN PROCESO</option>
                        <option value="FINALIZADO">FINALIZADO</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] opacity-70 mb-1">OCULTAR</label>
                      <select name="ocultar" defaultValue={datosEdicion.ocultar} className="bg-black border border-[#004400] text-[#00FF00] p-2 focus:border-[#00FF00] focus:outline-none uppercase text-xs w-full cursor-pointer">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 border border-dashed border-[#004400] p-3 md:p-4 bg-[#000500]">
                    {datosEdicion.imagen_cloudinary_url && (
                      <div className="shrink-0">
                        <label className="text-[9px] opacity-70 mb-1 block">MUESTRA ACTUAL</label>
                        <img src={datosEdicion.imagen_cloudinary_url} alt="Actual" className="w-16 h-16 md:w-24 md:h-24 object-cover border border-[#00AA00]" />
                      </div>
                    )}
                    <div className="flex-grow flex flex-col justify-center">
                      <label className="text-[10px] font-bold text-[#00AA00] mb-2 block">REEMPLAZAR IMAGEN SATELITAL (Opcional)</label>
                      <input type="file" name="imagen" accept="image/*" className="text-[10px] text-[#00AA00] w-full file:mr-4 file:py-1 file:px-3 file:border-0 file:text-[10px] file:font-bold file:bg-[#003300] file:text-[#00FF00] hover:file:bg-[#00FF00] hover:file:text-black transition-colors cursor-pointer" />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] opacity-70 mb-1">COMENTARIOS (TELEMETRÍA)</label>
                    <textarea name="notas_telemetria" defaultValue={datosEdicion.notas_telemetria} rows="3" className="bg-black border border-[#004400] text-[#00FF00] p-2 focus:border-[#00FF00] focus:outline-none resize-none w-full text-xs"></textarea>
                  </div>

                  <button type="submit" disabled={estadoEdicion === 'TRANSMITIENDO'} className="w-full p-4 mt-2 text-sm font-bold uppercase tracking-widest bg-[#00FF00] text-black hover:bg-white transition-all disabled:bg-[#003300] disabled:text-gray-500">
                    {estadoEdicion === 'TRANSMITIENDO' ? '[ TRANSMITIENDO DATOS... ]' : '[ SOBRESCRIBIR MATRIZ ]'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </AccesoRestringido>
  );
}
