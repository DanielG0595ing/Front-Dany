"use client";
import { useState, useEffect } from 'react';

export default function AccesoRestringido({ children }) {
  const [autorizado, setAutorizado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [clave, setClave] = useState('');
  const [error, setError] = useState(false);

  // Verifica si el dispositivo ya tiene autorización previa
  useEffect(() => {
    const clearance = localStorage.getItem('nivel_acceso');
    if (clearance === 'AUTORIZADO_MANU') {
      setAutorizado(true);
    }
    setCargando(false);
  }, []);

  const verificarAcceso = (e) => {
    e.preventDefault();
    if (clave === process.env.NEXT_PUBLIC_CODIGO_ACCESO) {
      localStorage.setItem('nivel_acceso', 'AUTORIZADO_MANU');
      setAutorizado(true);
      setError(false);
    } else {
      setError(true);
      setClave('');
    }
  };

  if (cargando) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-[#00FF00] font-mono text-xs animate-pulse">SISTEMA INICIALIZANDO...</div>;
  }

  // Si tiene autorización, renderiza la matriz principal
  if (autorizado) {
    return children;
  }

  // Si NO tiene autorización, levanta el muro de seguridad
  return (
    <div className="min-h-screen bg-[#000500] text-[#00FF00] font-mono flex items-center justify-center p-4 selection:bg-[#005500] selection:text-white">
      <div className="border border-[#00FF00] p-8 max-w-md w-full shadow-[0_0_30px_rgba(0,255,0,0.15)] bg-black relative overflow-hidden">
        
        {/* EFECTO DE ESCÁNER DE FONDO */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#00FF00] opacity-30 animate-[scan_2s_ease-in-out_infinite]"></div>

        <div className="text-center mb-8 border-b border-[#003300] pb-4">
          <h1 className="text-2xl font-black tracking-widest uppercase mb-2">Búnker <span className="text-white bg-[#00FF00] px-2 not-italic">Logístico</span></h1>
          <p className="text-[10px] opacity-60 tracking-[0.2em]">ACCESO RESTRINGIDO A PERSONAL AUTORIZADO</p>
        </div>

        <form onSubmit={verificarAcceso} className="space-y-6">
          <div className="flex flex-col">
            <label className="text-[10px] opacity-80 mb-2 uppercase tracking-widest">Ingrese Código de Telemetría:</label>
            <input 
              type="password" 
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="bg-[#000a00] border-2 border-[#004400] text-[#00FF00] p-3 text-center tracking-[0.5em] focus:border-[#00FF00] focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center uppercase tracking-widest animate-pulse font-bold bg-[#220000] p-2 border border-red-900">
              [ ACCESO DENEGADO - INTENTO REGISTRADO ]
            </p>
          )}

          <button type="submit" className="w-full bg-[#00FF00] text-black font-bold p-3 uppercase tracking-widest hover:bg-white transition-colors">
            Desbloquear Terminal
          </button>
        </form>
        
        <div className="mt-6 text-center text-[8px] opacity-40">
          <p>SISTEMA DE SEGURIDAD V3.0</p>
          <p>IP REGISTRADA Y MONITOREADA</p>
        </div>
      </div>
    </div>
  );
}