import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Archive, FileText } from 'lucide-react';

const LoadingAnimation = () => {
  return (
    <div className="fixed inset-0 bg-deep flex flex-col items-center justify-center z-[100]">
      <div className="relative w-64 h-64 flex items-center justify-center">
        
        {/* Engranajes */}
        <div className="absolute top-0 left-0 flex gap-1 p-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="text-cyan opacity-80"
          >
            <Settings size={48} />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="text-brand opacity-60 mt-8"
          >
            <Settings size={32} />
          </motion.div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="text-violet opacity-40 ml-[-10px]"
          >
            <Settings size={24} />
          </motion.div>
        </div>

        {/* Archivador */}
        <div className="absolute bottom-4 right-4">
          <motion.div className="relative text-txt-muted">
            <Archive size={64} />
            {/* Cajón abriendo/cerrando */}
            <motion.div 
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.5, 1] }}
              className="absolute inset-0 flex items-center justify-center pt-2"
            >
              <div className="w-8 h-1 bg-white/20 rounded-full" />
            </motion.div>
          </motion.div>
        </div>

        {/* Hoja Volando de Engranaje a Archivador */}
        <motion.div
          initial={{ opacity: 0, x: -60, y: -60, rotate: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            x: [-60, 40],
            y: [-60, 20],
            rotate: [0, 45, 90]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            times: [0, 0.2, 0.8, 1],
            delay: 0.5 
          }}
          className="absolute text-cyan"
        >
          <FileText size={20} />
        </motion.div>

        {/* Hoja Volando de Archivador a Engranaje */}
        <motion.div
          initial={{ opacity: 0, x: 40, y: 20, rotate: 90 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            x: [40, -60],
            y: [20, -60],
            rotate: [90, 45, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            times: [0, 0.2, 0.8, 1],
            delay: 2.5 
          }}
          className="absolute text-brand"
        >
          <FileText size={20} />
        </motion.div>

      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-8 text-center"
      >
        <h2 className="text-xl font-black text-white tracking-[0.2em] uppercase mb-2">Master FixPC</h2>
        <div className="flex items-center gap-2">
          <motion.div 
            animate={{ width: ["0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="h-1 bg-gradient-to-r from-cyan to-brand rounded-full w-48"
          />
        </div>
        <p className="text-[10px] text-txt-muted mt-4 font-bold tracking-widest uppercase">Sincronizando Base de Datos...</p>
      </motion.div>
    </div>
  );
};

export default LoadingAnimation;
