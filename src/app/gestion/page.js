"use client";
import { useState, useEffect, useCallback } from 'react';
import AccesoRestringido from '../../components/AccesoRestringido';

export default function CuartoOscuro() {
  const [misiones, setMisiones] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📡 EXTRAER TELEMETRÍA
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

  // 💀 PURGAR REGISTRO (DELETE)
  const ejecutarPurga = async (id, codigo_obra) => {
    const confirmar = window.confirm(`[ADVERTENCIA CRÍTICA]\n\n¿Está seguro que desea ELIMINAR la obra [ ${codigo_obra} ] de la base de datos central? Esta acción es irreversible.`);
    if (!confirmar) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/misiones/${id}`, { method: 'DELETE' });
      cargarMatriz(); // Recargar el radar
    } catch (error) {
      alert("FALLO EN LA PURGA DE DATOS.");
    }
  };

  // 🥷 CAMUFLAR REGISTRO (TOGGLE OCULTAR)
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
      alert("FALLO EN EL SISTEMA DE CAMUFLAJE.");
    }
  };

  return (
    <AccesoRestringido>
      {/* ☢️ ESTÉTICA FALLOUT TERMINAL */}
      <div className="min-h-screen bg-[#000500] text-[#00FF00] font-mono relative overflow-x-hidden selection:bg-[#005500] selection:text-white">
        
        {/* EFECTO CRT SCANLINES (TUBO DE RAYOS CATÓDICOS) */}
        <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(0,25,0,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40"></div>
        
        {/* ANIMACIÓN DE RADAR DE FONDO */}
        <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[#002200] rounded-full opacity-10">
          <div className="absolute inset-0 rounded-full border border-[#003300] scale-75"></div>
          <div className="absolute inset-0 rounded-full border border-[#004400] scale-50"></div>
          <div className="absolute inset-0 rounded-full border border-[#005500] scale-25"></div>
          {/* LÍNEA DE BARRIDO */}
          <div className="absolute top-1/2 left-1/2 w-[400px] h-1 bg-gradient-to-r from-transparent to-[#00FF00] origin-left animate-[spin_4s_linear_infinite] opacity-50"></div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
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
              <p className="text-xl">&gt; ESTABLECIENDO ENLACE CON BÓVEDA DE DATOS...</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#00FF00] bg-[#000a00]/80 backdrop-blur-sm">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#003300] text-[#00FF00] uppercase tracking-wider border-b border-[#00FF00]">
                    <th className="p-3 whitespace-nowrap">Código Obra</th>
                    <th className="p-3 whitespace-nowrap">Proyecto</th>
                    <th className="p-3 whitespace-nowrap">Estado</th>
                    <th className="p-3 whitespace-nowrap text-center">Camuflaje</th>
                    <th className="p-3 whitespace-nowrap text-right">Acciones Tácticas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#003300]">
                  {misiones.map((mision) => (
                    <tr key={mision._id} className="hover:bg-[#001a00] transition-colors group">
                      
                      {/* 1. DATOS DE LA OBRA */}
                      <td className="p-3 font-bold text-white whitespace-nowrap">{mision.codigo_obra}</td>
                      <td className="p-3 text-[#00AA00] whitespace-nowrap">{mision.nombre_proyecto || '-'}</td>
                      
                      {/* 2. ESTADO OPERATIVO */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-[10px] font-bold ${mision.estado_operativo === 'FINALIZADO' ? 'bg-[#003300] text-[#00FF00]' : 'bg-[#332200] text-yellow-500'}`}>
                          {mision.estado_operativo}
                        </span>
                      </td>
                      
                      {/* 3. SISTEMA DE CAMUFLAJE */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <button 
                          onClick={() => alternarCamuflaje(mision._id, mision.ocultar)}
                          className={`px-3 py-1 text-[10px] font-bold border transition-colors ${mision.ocultar === 'SI' ? 'bg-red-900 border-red-500 text-white animate-pulse' : 'bg-transparent border-[#004400] text-[#004400] hover:border-[#00FF00] hover:text-[#00FF00]'}`}
                        >
                          {mision.ocultar === 'SI' ? '🥷 ACTIVO' : 'NO ACTIVO'}
                        </button>
                      </td>
                      
                      {/* 4. ACCIONES TÁCTICAS (BOTONES RESPONSIVOS RECALIBRADOS) */}
                      <td className="p-2 md:p-3 align-middle">
                        <div className="flex flex-col lg:flex-row justify-end items-end lg:items-center gap-2">
                          <button 
                            onClick={() => alert('MÓDULO DE RECALIBRACIÓN EN DESARROLLO. PRÓXIMAMENTE EN V3.1')}
                            className="w-full lg:w-auto px-2 md:px-3 py-1.5 bg-[#002200] border border-[#00FF00] text-[#00FF00] hover:bg-[#00FF00] hover:text-black font-bold text-[9px] md:text-[10px] transition-colors text-center shadow-[0_0_5px_rgba(0,255,0,0.2)] whitespace-nowrap"
                          >
                            📝 EDITAR
                          </button>
                          <button 
                            onClick={() => ejecutarPurga(mision._id, mision.codigo_obra)}
                            className="w-full lg:w-auto px-2 md:px-3 py-1.5 bg-[#220000] border border-red-600 text-red-500 hover:bg-red-600 hover:text-white font-bold text-[9px] md:text-[10px] transition-colors text-center shadow-[0_0_5px_rgba(255,0,0,0.2)] whitespace-nowrap"
                          >
                            💀 PURGAR
                          </button>
                        </div>
                      </td>
                      
                    </tr>
                  ))}
                  {misiones.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center opacity-50 uppercase">&gt; BÓVEDA VACÍA. NO HAY REGISTROS.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </AccesoRestringido>
  );
}