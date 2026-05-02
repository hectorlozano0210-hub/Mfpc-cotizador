import { useState, useEffect } from 'react';
import type { AppSettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  prices: {
    helperDaily: 60000,
    ladderDaily: 15000,
    scaffoldingDaily: 45000,
    impactGunDaily: 25000,
    materials: [
      { name: 'Cable UTP Cat 5e (metro)', price: 2500 },
      { name: 'Balum HD', price: 12000 },
      { name: 'Bornera DC', price: 2500 },
      { name: 'Cámara Domo 1080p', price: 85000 },
      { name: 'Cámara Bala 1080p', price: 95000 },
      { name: 'DVR 4 Canales', price: 280000 }
    ]
  }
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('prosecure_settings');
      if (!saved) return DEFAULT_SETTINGS;
      
      const parsed = JSON.parse(saved);
      
      // Deep structural validation and merge
      const merged: AppSettings = {
        prices: {
          helperDaily: parsed?.prices?.helperDaily ?? DEFAULT_SETTINGS.prices.helperDaily,
          ladderDaily: parsed?.prices?.ladderDaily ?? DEFAULT_SETTINGS.prices.ladderDaily,
          scaffoldingDaily: parsed?.prices?.scaffoldingDaily ?? DEFAULT_SETTINGS.prices.scaffoldingDaily,
          impactGunDaily: parsed?.prices?.impactGunDaily ?? DEFAULT_SETTINGS.prices.impactGunDaily,
          materials: Array.isArray(parsed?.prices?.materials) ? parsed.prices.materials : DEFAULT_SETTINGS.prices.materials
        }
      };
      
      return merged;
    } catch (e) {
      console.error("Error loading settings:", e);
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem('prosecure_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  return { settings, updateSettings };
};

export const BRANDING = {
  name: "Master FixPC",
  author: "Hector Lozano",
  location: "Bogotá, Colombia",
  rights: "Derechos reservados © 2024",
  slogan: "Un aliado tecnológico a tu alcance"
};
