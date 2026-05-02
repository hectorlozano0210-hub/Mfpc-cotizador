import { useState } from 'react';
import type { QuoteItem } from '../types';

export const useAudioAssistant = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processAudio = async (audioBlob?: Blob): Promise<Partial<QuoteItem>[]> => {
    setIsProcessing(true);
    
    // Simulamos una llamada a la API de Whisper + GPT-4o
    // En una implementación real, aquí se enviaría el audio a Supabase Edge Functions
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsProcessing(false);
        resolve([
          { description: 'Cámaras IP 4MP Domo', quantity: 4, unitPrice: 185000 },
          { description: 'NVR 4 Canales PoE', quantity: 1, unitPrice: 450000 },
          { description: 'Disco Duro 2TB Salud Vigilancia', quantity: 1, unitPrice: 280000 },
          { description: 'Cable UTP Exterior Cat 6 (Metros)', quantity: 100, unitPrice: 2500 },
        ]);
      }, 3000);
    });
  };

  return { processAudio, isProcessing };
};
