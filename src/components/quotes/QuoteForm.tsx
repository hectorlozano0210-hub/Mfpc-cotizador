import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Mic, ShieldAlert, FileDown, MessageCircle, Calendar,
  User, Clock as ClockIcon, Check, Briefcase, Hammer, Truck,
  ChevronRight, ChevronLeft, Star, X, CheckCircle2
} from 'lucide-react';
import type { Project, QuoteItem, ResourceItem, ActivityLog, AppSettings } from '../../types/index';
import { useAudioAssistant } from '../../hooks/useAudioAssistant';
import { SignaturePad } from '../ui/SignaturePad';
import { BRANDING } from '../../hooks/useSettings';
import { DataStore } from '../../services/db';
import { Search as SearchIcon } from 'lucide-react';

const MULTIPLIERS = {
  height: { low: 1.0, medium: 1.25, high: 1.5 },
  infrastructure: { canaleta: 1.0, emt: 1.35, industrial: 1.6 }
};

const PHASE_LABELS: Record<string, { label: string; badge: string }> = {
  survey: { label: 'Levantamiento Técnico', badge: 'badge-blue' },
  quoted: { label: 'Cotización Formal', badge: 'badge-purple' },
  in_progress: { label: 'Reporte de Trabajo', badge: 'badge-cyan' },
  completed: { label: 'Cuenta de Cobro', badge: 'badge-green' },
};

const PHASE_ORDER: Project['status'][] = ['survey', 'quoted', 'in_progress', 'completed'];

interface QuoteFormProps {
  settings: AppSettings;
  initialProject?: Project;
  onClose?: () => void;
}

export const QuoteForm = ({ settings, initialProject, onClose }: QuoteFormProps) => {
  const { processAudio, isProcessing } = useAudioAssistant();
  const [phase, setPhase] = useState<Project['status']>(initialProject?.status || 'survey');
  const [items, setItems] = useState<QuoteItem[]>(initialProject?.items || []);
  const [resources, setResources] = useState<ResourceItem[]>(initialProject?.resources || []);
  const [activities, setActivities] = useState<ActivityLog[]>(initialProject?.activities || []);
  const [height, setHeight] = useState<DifficultyConfig['height']>(initialProject?.difficultyConfig.height || 'low');
  const [infra, setInfra] = useState<DifficultyConfig['infrastructure']>(initialProject?.difficultyConfig.infrastructure || 'canaleta');
  const [signature, setSignature] = useState<string | null>(initialProject?.signature || null);

  const [projectData, setProjectData] = useState({
    clientId: initialProject?.clientId || '',
    client: initialProject?.client.name || '',
    contact: initialProject?.client.contact || '',
    address: initialProject?.client.address || '',
    phone: initialProject?.client.phone || '',
    date: initialProject?.date || new Date().toLocaleDateString('es-CO'),
    time: initialProject?.time || new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    helpers: initialProject?.difficultyConfig.helpers || 0,
    scaffolding: initialProject?.difficultyConfig.scaffolding || false,
    ladder: initialProject?.difficultyConfig.ladder || false,
    context: initialProject?.difficultyConfig.context || '',
    reference: initialProject?.reference || DataStore.getNextReference('COT')
  });

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showTabulators, setShowTabulators] = useState(false);
  const [analyzingAct, setAnalyzingAct] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{ actId: string, message: string } | null>(null);

  const phaseIndex = PHASE_ORDER.indexOf(phase);

  const handleAIAnalysis = (actId: string, description: string) => {
    if (!description.trim()) return;
    setAnalyzingAct(actId);
    setAiSuggestion(null);
    
    setTimeout(() => {
      const descLower = description.toLowerCase();
      const ctxLower = projectData.context?.toLowerCase() || '';
      let basePrice = 0;
      let detectedItems = [];
      let quantity = 1;
      
      // Extract numbers to estimate quantity (e.g. "10 puntos electricos")
      const nums = descLower.match(/\d+/g) || ctxLower.match(/\d+/g);
      if (nums && nums.length > 0) {
        quantity = Math.min(parseInt(nums[0]), 50); // cap multiplier
      }

      if (descLower.includes('punto') || descLower.includes('eléctrico') || descLower.includes('electrico')) {
        basePrice = 35000;
        detectedItems.push(`${quantity} punto(s) eléctrico(s)`);
      } else if (descLower.includes('cámara') || descLower.includes('camara')) {
        basePrice = 45000;
        detectedItems.push(`${quantity} cámara(s)`);
      } else if (descLower.includes('dvr') || descLower.includes('nvr')) {
        basePrice = 85000;
        detectedItems.push('configuración DVR/NVR');
        quantity = 1; // Usually per system
      } else if (descLower.includes('mantenimiento') || descLower.includes('limpieza')) {
        basePrice = 25000;
        detectedItems.push(`${quantity} mantenimiento(s)`);
      } else if (descLower.includes('cable') || descLower.includes('cableado')) {
        basePrice = 20000;
        detectedItems.push(`tendido de cableado`);
      } else {
        basePrice = 45000; // Visita técnica general
        detectedItems.push('servicio general');
      }
      
      // Contextual multipliers
      let multiplier = 1;
      if (ctxLower.includes('altura') || height === 'high') multiplier += 0.3;
      if (infra === 'industrial' || ctxLower.includes('industrial')) multiplier += 0.3;
      
      const totalEstimated = basePrice * quantity * multiplier;
      const minPrice = Math.floor(totalEstimated * 0.85 / 1000) * 1000;
      const maxPrice = Math.floor(totalEstimated * 1.15 / 1000) * 1000;
      
      const message = `Análisis de mercado (Colombia): Se detectó ${detectedItems.join(', ')}. El precio sugerido oscila entre $${minPrice.toLocaleString()} y $${maxPrice.toLocaleString()} COP (considerando condiciones de entorno).`;
      
      setAiSuggestion({ actId, message });
      setAnalyzingAct(null);
    }, 1500);
  };

  // ─── Actions ───
  const addItem = (desc = '', price = 0) => {
    setItems([...items, { id: crypto.randomUUID(), description: desc, quantity: 1, unitPrice: price, difficultyMultiplier: 1, total: price }]);
  };

  const addResource = (name: string, type: ResourceItem['type'], unitPrice: number) => {
    setResources([...resources, { id: crypto.randomUUID(), name, type, quantity: 1, unitPrice, days: type === 'material' ? undefined : 1, total: unitPrice }]);
  };

  const updateResource = (id: string, field: keyof ResourceItem, value: any) => {
    setResources(resources.map(r => {
      if (r.id !== id) return r;
      const u = { ...r, [field]: value };
      u.total = u.quantity * u.unitPrice * (u.days || 1);
      return u;
    }));
  };

  const addActivity = (desc = '') => {
    setActivities([...activities, { 
      id: crypto.randomUUID(), 
      date: new Date().toLocaleDateString('en-CA'),
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), 
      description: desc,
      estimatedHours: 0,
      authorizedBy: '',
      price: 0,
      recipientName: ''
    }]);
  };

  const totals = useMemo(() => {
    const labor = items.reduce((a, i) => a + i.total, 0) * MULTIPLIERS.height[height] * MULTIPLIERS.infrastructure[infra];
    const res = resources.reduce((a, r) => a + r.total, 0);
    const activityCosts = activities.reduce((a, act) => a + (act.price || 0), 0);
    return { labor, resources: res, activityCosts, grand: labor + res + activityCosts };
  }, [items, height, infra, resources, activities]);

  const handleShareWhatsApp = () => {
    const msg = `Hola, envío el ${phase === 'completed' ? 'Cobro' : 'Presupuesto'} para ${projectData.client}. Total: $${Math.round(totals.grand).toLocaleString()} COP.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleIA = async () => {
    const extracted = await processAudio();
    setProjectData({ ...projectData, client: 'Nuevo Cliente', contact: 'Contacto IA' });
    const newItems: QuoteItem[] = extracted.map(i => ({
      id: crypto.randomUUID(), description: i.description || '', quantity: i.quantity || 1,
      unitPrice: i.unitPrice || 0, difficultyMultiplier: 1, total: (i.quantity || 1) * (i.unitPrice || 0),
    }));
    setItems([...items, ...newItems]);
    if (phase === 'in_progress') addActivity('Se inicia registro de actividades vía IA...');
  };

  const goNext = () => { if (phaseIndex < 3) setPhase(PHASE_ORDER[phaseIndex + 1]); };
  const goBack = () => { if (phaseIndex > 0) setPhase(PHASE_ORDER[phaseIndex - 1]); };

  const handleSaveProject = () => {
    const project: Project = {
        id: initialProject?.id || crypto.randomUUID(),
        reference: projectData.reference,
        clientId: projectData.clientId || crypto.randomUUID(),
        client: {
            name: projectData.client,
            contact: projectData.contact,
            address: projectData.address,
            phone: projectData.phone
        },
        date: projectData.date,
        time: projectData.time,
        status: phase,
        items,
        resources,
        activities,
        difficultyConfig: {
            height,
            infrastructure: infra,
            scaffolding: projectData.scaffolding,
            ladder: projectData.ladder,
            helpers: projectData.helpers
        },
        signature: signature || undefined,
        total: totals.grand,
        createdAt: initialProject?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    DataStore.saveProject(project);
    alert("Documento guardado y actualizado");
    if (onClose) onClose();
  };

  const handleSearch = (q: string) => {
    setProjectData({ ...projectData, client: q });
    if (q.length > 2) {
      const results = DataStore.searchClients(q);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const handleSelectClient = (c: any) => {
    setProjectData({
      ...projectData,
      clientId: c.id,
      client: c.name,
      contact: c.contact,
      address: c.address,
      phone: c.phone
    });
    setShowResults(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pb-28">

      {/* ─── STEPPER ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
        {PHASE_ORDER.map((p, i) => (
          <motion.button key={p} onClick={() => setPhase(p)}
            whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}
            animate={i === phaseIndex ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              i === phaseIndex ? 'bg-brand text-white shadow-xl shadow-brand/30' :
              i < phaseIndex ? 'bg-emerald/10 text-emerald border border-emerald/20' : 'bg-elevated/40 text-txt-muted border border-white/5'
            }`}>
            <motion.span
              animate={i < phaseIndex ? { scale: [0.8, 1.2, 1] } : {}}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                i < phaseIndex ? 'bg-emerald text-white' : i === phaseIndex ? 'bg-white/20 text-white' : 'bg-overlay text-txt-muted'
              }`}>
              {i < phaseIndex ? <Check size={12} /> : i + 1}
            </motion.span>
            <span className="hidden sm:inline">{PHASE_LABELS[p].label}</span>
          </motion.button>
        ))}
      </div>

      {/* ─── HEADER ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-2">
        <div>
          <span className={`badge ${PHASE_LABELS[phase].badge} animate-pulse-soft text-[10px] font-black px-4 py-1.5`}>
            {phase.replace('_', ' ').toUpperCase()}
          </span>
          <h1 className="text-3xl lg:text-5xl font-bold text-txt tracking-tight font-heading mt-4">
            {PHASE_LABELS[phase].label}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {phaseIndex > 0 && (
            <motion.button onClick={goBack} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="p-4 bg-elevated rounded-2xl text-txt-secondary hover:text-txt hover:bg-surface transition-all border border-white/5">
              <ChevronLeft size={24} />
            </motion.button>
          )}
          <motion.button onClick={handleIA} disabled={isProcessing}
            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              isProcessing ? 'bg-elevated text-txt-muted' : 'bg-gradient-to-r from-violet to-brand text-white shadow-xl shadow-brand/30'
            }`}>
            <motion.div animate={isProcessing ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Mic size={18} />
            </motion.div>
            {isProcessing ? 'Procesando...' : 'Asistente IA'}
          </motion.button>
          {phaseIndex < 3 && (
            <motion.button onClick={goNext} whileHover={{ scale: 1.03, x: 5 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 px-8 py-4 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-light transition-all shadow-xl shadow-brand/30">
              Siguiente <ChevronRight size={18} />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ─── CONTENT GRID ─── */}
      <div className="grid-form">
        <div className="space-y-6">

          {/* SURVEY PHASE */}
          {phase === 'survey' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <section className="card !p-10 space-y-8">
                <h3 className="text-xs uppercase font-black text-brand flex items-center gap-3 tracking-[0.2em]">
                  <User size={18} /> Información del Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-txt-muted group-focus-within:text-brand transition-colors">
                        <SearchIcon size={20} />
                    </div>
                    <input placeholder="Nombre / Empresa (Buscar...)" value={projectData.client}
                      onChange={e => handleSearch(e.target.value)}
                      className="w-full bg-deep/50 border border-white/5 rounded-2xl pl-14 pr-5 py-4 text-sm font-bold focus:border-brand/50 focus:bg-deep outline-none transition-all shadow-inner"
                    />
                    <AnimatePresence>
                        {showResults && searchResults.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 z-50 mt-2 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
                            >
                                {searchResults.map((c: any) => (
                                    <button key={c.id} onClick={() => handleSelectClient(c)}
                                        className="w-full px-4 py-3 text-left hover:bg-elevated transition-colors border-b border-border last:border-0"
                                    >
                                        <p className="font-bold text-sm text-txt">{c.name}</p>
                                        <p className="text-[10px] text-txt-muted">{c.contact} · {c.address}</p>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                  {[
                    { ph: 'Dirección del sitio', key: 'address' },
                    { ph: 'Contacto', key: 'contact' },
                    { ph: 'Teléfono', key: 'phone' },
                  ].map(f => (
                    <input key={f.key} placeholder={f.ph} value={(projectData as any)[f.key]}
                      onChange={e => setProjectData({ ...projectData, [f.key]: e.target.value })}
                      className="w-full bg-deep/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold focus:border-brand/50 focus:bg-deep outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>
              </section>

              <section className="card !p-10">
                <button 
                  onClick={() => setShowTabulators(!showTabulators)}
                  className="w-full flex items-center justify-between focus:outline-none group"
                >
                  <h3 className="text-xs uppercase font-black text-cyan flex items-center gap-3 tracking-[0.2em] group-hover:text-cyan-light transition-colors">
                    <ShieldAlert size={18} /> Condiciones de Trabajo (Tabuladores)
                  </h3>
                  <ChevronRight size={18} className={`text-txt-muted transition-transform duration-300 ${showTabulators ? 'rotate-90 text-cyan' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showTabulators && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-8"
                    >
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] text-txt-muted uppercase font-bold mb-2 tracking-wider">Altura de Instalación</p>
                          <div className="grid grid-cols-3 gap-2">
                            {([['low', '< 3m'], ['medium', '3-6m'], ['high', '> 6m']] as const).map(([k, label]) => (
                              <button key={k} onClick={() => setHeight(k)}
                                className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                                  height === k ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20' : 'border-border text-txt-muted hover:border-txt-secondary'
                                }`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-txt-muted uppercase font-bold mb-2 tracking-wider">Infraestructura</p>
                          <div className="grid grid-cols-3 gap-2">
                            {(['canaleta', 'emt', 'industrial'] as const).map(t => (
                              <button key={t} onClick={() => setInfra(t)}
                                className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                                  infra === t ? 'bg-cyan border-cyan text-deep shadow-lg shadow-cyan/20' : 'border-border text-txt-muted hover:border-txt-secondary'
                                }`}>
                                {t.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                          <button onClick={() => setProjectData({ ...projectData, scaffolding: !projectData.scaffolding })}
                            className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${
                              projectData.scaffolding ? 'border-cyan bg-cyan/10 text-cyan' : 'border-border text-txt-muted'
                            }`}>
                            <Truck size={22} className="mb-2" />
                            <span className="text-[10px] font-bold uppercase">Andamios</span>
                          </button>
                          <button onClick={() => setProjectData({ ...projectData, ladder: !projectData.ladder })}
                            className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${
                              projectData.ladder ? 'border-cyan bg-cyan/10 text-cyan' : 'border-border text-txt-muted'
                            }`}>
                            <Hammer size={22} className="mb-2" />
                            <span className="text-[10px] font-bold uppercase">Escaleras</span>
                          </button>
                          <div className="flex items-center bg-elevated rounded-2xl p-4 gap-4 col-span-2 lg:col-span-1 border border-transparent">
                            <Briefcase size={22} className="text-txt-muted shrink-0" />
                            <div className="flex-1">
                              <p className="text-[10px] font-bold text-txt-muted uppercase">Ayudantes</p>
                              <div className="flex items-center gap-3 mt-1">
                                <button onClick={() => setProjectData({ ...projectData, helpers: Math.max(0, projectData.helpers - 1) })}
                                  className="w-8 h-8 rounded-lg bg-deep text-txt flex items-center justify-center font-bold hover:bg-surface transition-colors">−</button>
                                <span className="font-bold text-lg text-txt w-6 text-center">{projectData.helpers}</span>
                                <button onClick={() => setProjectData({ ...projectData, helpers: projectData.helpers + 1 })}
                                  className="w-8 h-8 rounded-lg bg-deep text-txt flex items-center justify-center font-bold hover:bg-surface transition-colors">+</button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-white/5">
                          <p className="text-[10px] text-txt-muted uppercase font-bold mb-2 tracking-wider flex items-center gap-2">
                            Contexto Adicional (Para la IA)
                          </p>
                          <textarea
                            value={projectData.context || ''}
                            onChange={(e) => setProjectData({ ...projectData, context: e.target.value })}
                            placeholder="Ej: Se colocarán 9 cámaras a una altura de 6 metros con una distancia aproximada entre 70 y 90 metros."
                            className="w-full bg-deep border border-white/5 rounded-2xl p-4 text-sm font-medium focus:border-brand/50 outline-none transition-all shadow-inner resize-none h-24"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </motion.div>
          )}

          {/* ITEMS & RESOURCES (survey + quoted) */}
          {(phase === 'survey' || phase === 'quoted') && (
            <>
              <section className="card">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-[10px] uppercase font-bold text-violet flex items-center gap-2 tracking-widest">
                    <Star size={14} /> Mano de Obra y Servicios
                  </h3>
                  <button onClick={() => addItem()} className="px-3 py-1.5 bg-elevated rounded-lg text-xs font-bold text-txt hover:bg-surface transition-colors">
                    + Servicio
                  </button>
                </div>
                <div className="space-y-2.5">
                  {items.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-3 p-3.5 bg-main rounded-xl border border-border">
                      <input value={item.description}
                        onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, description: e.target.value } : i))}
                        className="flex-1 bg-transparent text-sm font-medium outline-none min-w-0" placeholder="Descripción de la tarea" />
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center bg-deep px-3 py-1.5 rounded-lg border border-border w-28">
                          <span className="text-[10px] text-txt-muted mr-1">$</span>
                          <input type="number" value={item.unitPrice} onChange={e => {
                            const p = parseInt(e.target.value) || 0;
                            setItems(items.map(i => i.id === item.id ? { ...i, unitPrice: p, total: p * i.quantity } : i));
                          }} className="bg-transparent text-xs text-center font-bold text-cyan w-full outline-none" />
                        </div>
                        <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-txt-muted hover:text-rose transition-colors p-1">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card">
                <h3 className="text-[10px] uppercase font-bold text-cyan mb-5 flex items-center gap-2 tracking-widest">
                  <Plus size={14} /> Materiales y Recursos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="text-[10px] font-bold text-txt-muted uppercase mb-2 tracking-wider">Catálogo Rápido</p>
                    <div className="flex flex-wrap gap-1.5">
                      {settings.prices.materials.map((m, i) => (
                        <button key={i} onClick={() => addResource(m.name, 'material', m.price)}
                          className="text-[10px] bg-elevated px-3 py-2 rounded-lg hover:border-cyan border border-transparent transition-all font-medium">
                          + {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-txt-muted uppercase mb-2 tracking-wider">Alquileres / Día</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => addResource('Ayudante', 'helper', settings.prices.helperDaily)} className="text-[10px] bg-brand/10 text-brand px-3 py-2 rounded-lg font-bold">+ Ayudante</button>
                      <button onClick={() => addResource('Escalera', 'tool', settings.prices.ladderDaily)} className="text-[10px] bg-cyan/10 text-cyan px-3 py-2 rounded-lg font-bold">+ Escalera</button>
                      <button onClick={() => addResource('Andamio', 'tool', settings.prices.scaffoldingDaily)} className="text-[10px] bg-cyan/10 text-cyan px-3 py-2 rounded-lg font-bold">+ Andamio</button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {resources.map(res => (
                    <div key={res.id} className="flex flex-col sm:flex-row gap-3 p-3.5 bg-elevated/40 rounded-xl border border-border items-center">
                      <div className="flex-1 flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${res.type === 'material' ? 'bg-cyan/10 text-cyan' : 'bg-brand/10 text-brand'}`}>
                          {res.type === 'material' ? <Plus size={14} /> : <ClockIcon size={14} />}
                        </div>
                        <span className="text-xs font-bold truncate">{res.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1 bg-deep rounded-lg px-2 py-1 border border-border">
                          <input type="number" value={res.quantity} onChange={e => updateResource(res.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-8 bg-transparent text-center text-xs font-bold outline-none" />
                          <span className="text-[9px] text-txt-muted">{res.type === 'material' ? 'Und' : 'Pers'}</span>
                        </div>
                        {res.days !== undefined && (
                          <div className="flex items-center gap-1 bg-deep rounded-lg px-2 py-1 border border-border">
                            <input type="number" value={res.days} onChange={e => updateResource(res.id, 'days', parseInt(e.target.value) || 1)}
                              className="w-8 bg-transparent text-center text-xs font-bold outline-none" />
                            <span className="text-[9px] text-txt-muted">Días</span>
                          </div>
                        )}
                        <span className="text-xs font-bold text-cyan min-w-[70px] text-right">${res.total.toLocaleString()}</span>
                        <button onClick={() => setResources(resources.filter(r => r.id !== res.id))} className="text-txt-muted hover:text-rose transition-colors p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ACTIVITY LOG (in_progress + completed) */}
          {(phase === 'in_progress' || phase === 'completed') && (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card border-cyan/20 bg-cyan/5">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[10px] uppercase font-bold text-cyan flex items-center gap-2 tracking-widest">
                  <Calendar size={14} /> Bitácora Técnica
                </h3>
                <button onClick={() => addActivity()} className="px-3 py-1.5 bg-cyan text-deep rounded-lg text-xs font-bold hover:bg-cyan-dark hover:text-white transition-colors">
                  + Actividad
                </button>
              </div>
              <div className="space-y-3">
                {activities.map(act => (
                  <div key={act.id} className="flex gap-4 group">
                    <div className="flex flex-col items-center pt-3">
                      <div className="w-3 h-3 rounded-full bg-cyan shadow-[0_0_10px_rgba(6,182,212,0.5)] shrink-0" />
                      <div className="w-0.5 flex-1 bg-white/5 my-2" />
                    </div>
                    <div className="flex-1 bg-deep/40 p-6 rounded-[2rem] border border-white/5 space-y-5 transition-all hover:bg-deep/60 hover:border-cyan/20">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <input type="date" value={act.date} 
                            onChange={e => setActivities(activities.map(a => a.id === act.id ? { ...a, date: e.target.value } : a))}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-cyan outline-none uppercase" />
                          <input type="time" value={act.time} 
                            onChange={e => setActivities(activities.map(a => a.id === act.id ? { ...a, time: e.target.value } : a))}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-cyan-light outline-none" />
                        </div>
                        <button onClick={() => setActivities(activities.filter(a => a.id !== act.id))} className="p-2 text-txt-muted hover:text-rose transition-colors hover:bg-rose/10 rounded-xl">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <textarea value={act.description}
                          onChange={e => setActivities(activities.map(a => a.id === act.id ? { ...a, description: e.target.value } : a))}
                          placeholder="Descripción detallada de la actividad realizada..."
                          className="w-full bg-deep border border-white/5 rounded-2xl p-4 text-sm text-txt outline-none focus:border-brand/30 transition-all resize-none shadow-inner" rows={3} />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-black text-txt-muted tracking-widest ml-1">Tiempo Est. (Hrs)</label>
                            <input type="number" value={act.estimatedHours} 
                              disabled={phase === 'completed'}
                              onChange={e => setActivities(activities.map(a => a.id === act.id ? { ...a, estimatedHours: parseFloat(e.target.value) || 0 } : a))}
                              className="w-full bg-deep border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-txt outline-none focus:border-cyan/30 shadow-inner disabled:opacity-50" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-black text-txt-muted tracking-widest ml-1">Precio Trabajo</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan font-bold text-xs">$</span>
                              <input type="number" value={act.price} 
                                disabled={phase === 'completed'}
                                onChange={e => setActivities(activities.map(a => a.id === act.id ? { ...a, price: parseFloat(e.target.value) || 0 } : a))}
                                className="w-full bg-deep border border-white/5 rounded-xl pl-8 pr-12 py-2.5 text-xs font-bold text-txt outline-none focus:border-cyan/30 shadow-inner disabled:opacity-50" />
                              {phase !== 'completed' && (
                                <button
                                  onClick={() => handleAIAnalysis(act.id, act.description)}
                                  disabled={analyzingAct === act.id || !act.description}
                                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-xs transition-all ${
                                    analyzingAct === act.id ? 'bg-cyan text-deep animate-pulse' : 'text-cyan hover:bg-cyan/10'
                                  }`}
                                  title="Análisis IA de Precio"
                                >
                                  ✨
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-black text-txt-muted tracking-widest ml-1">Autorizado por</label>
                            <input type="text" value={act.authorizedBy} 
                              disabled={phase === 'completed'}
                              onChange={e => setActivities(activities.map(a => a.id === act.id ? { ...a, authorizedBy: e.target.value } : a))}
                              placeholder="Nombre/Cargo"
                              className="w-full bg-deep border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-txt outline-none focus:border-cyan/30 shadow-inner disabled:opacity-50" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-black text-txt-muted tracking-widest ml-1">Recibe (Nombre)</label>
                            <input type="text" value={act.recipientName} 
                              disabled={phase === 'completed'}
                              onChange={e => setActivities(activities.map(a => a.id === act.id ? { ...a, recipientName: e.target.value } : a))}
                              placeholder="Nombre de quien recibe"
                              className="w-full bg-deep border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-txt outline-none focus:border-cyan/30 shadow-inner disabled:opacity-50" />
                          </div>
                        </div>

                        {/* AI Suggestion Display */}
                        {aiSuggestion?.actId === act.id && (
                          <div className="bg-brand/10 border border-brand/20 p-4 rounded-2xl flex flex-col gap-2 relative">
                            <button 
                              onClick={() => setAiSuggestion(null)}
                              className="absolute top-2 right-2 p-1 text-txt-muted hover:text-white transition-colors"
                            >
                              <X size={14} />
                            </button>
                            <p className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2">
                              ✨ Sugerencia de Mercado
                            </p>
                            <p className="text-xs text-txt font-medium leading-relaxed">
                              {aiSuggestion.message}
                            </p>
                          </div>
                        )}

                        {/* Activity Signature */}
                        <div className="pt-2">
                           {!act.recipientSignature ? (
                             <SignaturePad 
                               label="Firma de quien recibe actividad" 
                               onSave={(sig) => setActivities(activities.map(a => a.id === act.id ? { ...a, recipientSignature: sig } : a))} 
                             />
                           ) : (
                             <div className="bg-emerald/5 border border-emerald/20 p-4 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-emerald/20 flex items-center justify-center text-emerald">
                                    <CheckCircle2 size={20} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-emerald uppercase tracking-widest">Actividad Firmada</p>
                                    <p className="text-[10px] text-txt-muted font-bold">Registro de conformidad capturado</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setActivities(activities.map(a => a.id === act.id ? { ...a, recipientSignature: undefined } : a))}
                                  className="text-[10px] font-black text-rose uppercase tracking-widest hover:underline"
                                >
                                  Reiniciar Firma
                                </button>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </div>

        {/* ─── SUMMARY SIDEBAR ─── */}
        <div>
          <div className="card sticky top-24 !p-10 space-y-8">
            {/* Brand */}
            <div className="flex flex-col items-center pb-8 border-b border-white/5">
              <img src="/logo.png" alt="Master FixPC" className="h-16 w-auto mb-4 object-contain"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                }}
              />
              <h3 className="font-bold text-2xl text-txt tracking-tighter font-heading">
                Master<span className="text-brand">FixPC</span>
              </h3>
              <p className="text-[10px] text-brand-light uppercase tracking-[0.3em] font-black mt-1">{BRANDING.slogan}</p>
            </div>

            {/* Totals */}
            <div>
                <h4 className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] mb-4">Resumen de Inversión</h4>
                <div className="space-y-3 mb-8 bg-white/5 p-6 rounded-2xl border border-white/5">
                <div className="flex justify-between text-xs font-bold">
                    <span className="text-txt-secondary">Servicios Base</span>
                    <span className="text-txt">${totals.labor.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                    <span className="text-txt-secondary">Actividades</span>
                    <span className="text-txt">${totals.activityCosts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                    <span className="text-txt-secondary">Materiales</span>
                    <span className="text-txt">${totals.resources.toLocaleString()}</span>
                </div>
                <div className="pt-4 mt-2 border-t border-white/10 flex justify-between items-center">
                    <span className="text-sm font-black text-txt">TOTAL</span>
                    <span className="text-3xl font-black text-brand font-heading tracking-tighter">${Math.round(totals.grand).toLocaleString()}</span>
                </div>
                </div>
            </div>

            {/* Signature (completed only) */}
            {phase === 'completed' && (
              <div className="mb-5">
                <SignaturePad onSave={setSignature} label="Firma de Conformidad" />
                {signature && (
                  <div className="mt-2 p-3 bg-emerald/10 border border-emerald/30 rounded-2xl flex items-center gap-3">
                    <Check size={14} className="text-emerald" />
                    <span className="text-[10px] text-emerald font-black uppercase tracking-widest">Firma Registrada</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {phase === 'in_progress' && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setPhase('completed');
                    setProjectData(prev => ({ ...prev, reference: DataStore.getNextReference('CC') }));
                  }} 
                  className="w-full py-4 bg-emerald hover:bg-emerald-light text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald/20 animate-pulse">
                  <Check size={20} /> Totalizar y Cerrar Informe
                </motion.button>
              )}
              
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSaveProject} className="w-full py-4 bg-brand hover:bg-brand-light text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand/20">
                <Plus size={20} /> Guardar Proyecto
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleShareWhatsApp} className="w-full py-4 bg-[#25D366] hover:bg-[#25D366]/80 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-[#25D366]/20">
                <MessageCircle size={20} /> WhatsApp
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-elevated hover:bg-surface text-txt rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-white/5">
                <FileDown size={20} /> Descargar PDF
              </motion.button>
              <button onClick={() => setPhase('survey')} className="w-full py-3 text-txt-muted text-[10px] font-black uppercase tracking-widest hover:text-rose transition-colors">
                Reiniciar Proceso
              </button>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-border text-center">
              <p className="text-[8px] text-txt-muted uppercase tracking-wider">Programada por {BRANDING.author}</p>
              <p className="text-[8px] text-txt-muted/50">{BRANDING.location} · {BRANDING.rights}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
