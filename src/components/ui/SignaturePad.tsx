import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  label?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, label }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const save = () => {
    if (sigCanvas.current) {
      onSave(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-xs text-text-muted font-bold uppercase tracking-wider">{label || "Firma de Responsable"}</label>
        <button 
          onClick={clear}
          className="text-text-muted hover:text-accent-primary transition-colors flex items-center space-x-1 text-[10px] font-bold"
        >
          <RotateCcw size={12} />
          <span>Limpiar</span>
        </button>
      </div>
      
      <div className="bg-white rounded-2xl border border-border-subtle overflow-hidden">
        <SignatureCanvas 
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            className: "w-full h-40 cursor-crosshair",
            style: { width: '100%', height: '160px' }
          }}
        />
      </div>

      <button 
        onClick={save}
        className="w-full py-2 bg-bg-surface-elevated hover:bg-accent-primary text-text-primary hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
      >
        <Check size={14} />
        <span>Confirmar Firma</span>
      </button>
    </div>
  );
};
