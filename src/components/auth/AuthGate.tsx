import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Key, Lock, AlertTriangle, Loader2 } from 'lucide-react';

const generateDeviceId = () => {
  let id = localStorage.getItem('mfx_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('mfx_device_id', id);
  }
  return id;
};

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [licenseKey, setLicenseKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkExistingLicense = async () => {
      const savedKey = localStorage.getItem('mfx_license_key');
      const deviceId = generateDeviceId();

      if (savedKey) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://mfpc-cotizador.onrender.com'}/api/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenseKey: savedKey, deviceId, appName: 'Cotizador Pro' })
          });
          const data = await res.json();
          if (data.valid) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('mfx_license_key');
          }
        } catch (err) {
          // If server is unreachable, we might want to allow offline access if key exists
          // But for strict control, we require validation.
          console.error("Auth check failed:", err);
        }
      }
      setIsChecking(false);
    };

    checkExistingLicense();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;

    setIsLoading(true);
    setError(null);
    const deviceId = generateDeviceId();

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://mfpc-cotizador.onrender.com'}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, deviceId, appName: 'Cotizador Pro' })
      });
      
      const data = await res.json();
      
      if (data.valid) {
        localStorage.setItem('mfx_license_key', licenseKey);
        setIsAuthenticated(true);
      } else {
        setError(data.message || 'Licencia inválida.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor maestro.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="h-screen w-full bg-deep flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-cyan animate-spin" />
        <p className="text-cyan-light text-sm font-bold uppercase tracking-widest animate-pulse">Verificando Licencia...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full bg-deep flex flex-col relative overflow-hidden selection:bg-brand/40">
      <div className="ambient-orb ambient-orb-1 opacity-50" />
      <div className="ambient-orb ambient-orb-2 opacity-30" />

      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-md glass p-8 md:p-10 rounded-[2.5rem] border border-brand/20 shadow-2xl shadow-brand/10 relative overflow-hidden"
        >
          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand/20 shadow-inner"
            >
              <ShieldCheck size={40} className="text-brand drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Acceso Restringido</h1>
            <p className="text-txt-muted text-sm font-medium">Ecosistema MFX Core</p>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-brand tracking-[0.2em] ml-1">
                Clave de Licencia
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-txt-muted group-focus-within:text-brand transition-colors">
                  <Key size={18} />
                </div>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full bg-deep/60 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-center tracking-widest focus:border-brand/50 outline-none transition-all shadow-inner placeholder:text-txt-muted/30"
                  required
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose/10 border border-rose/30 text-rose px-4 py-3 rounded-xl flex items-center gap-3"
                >
                  <AlertTriangle size={16} className="shrink-0" />
                  <p className="text-xs font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !licenseKey.trim()}
              className="w-full py-4 bg-brand hover:bg-brand-light text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Lock size={18} />
                  Verificar Acceso
                </>
              )}
            </motion.button>
          </form>
          
          <div className="mt-8 text-center relative z-10">
            <p className="text-[9px] text-txt-muted uppercase tracking-widest">
              Protegido por Antigravity Security
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
