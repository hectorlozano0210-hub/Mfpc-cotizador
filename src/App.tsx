import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Users, PlusCircle, FileText, Settings, Bell, Search, Menu, X,
  TrendingUp, Clock, ChevronRight, Briefcase, Home, ShieldCheck, Package
} from 'lucide-react';
import { QuoteForm } from './components/quotes/QuoteForm';
import { ClientsView } from './components/clients/ClientsView';
import { ProjectListView } from './components/projects/ProjectListView';
import { InventoryView } from './components/inventory/InventoryView';
import { useSettings, BRANDING } from './hooks/useSettings';
import type { AppSettings, Project } from './types/index';
import { DataStore } from './services/db';

/* ─── Animation Variants ─── */
const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.3 } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

/* ─── Sidebar Item ─── */
const SidebarItem = ({ icon: Icon, label, description, active, onClick, open }: {
  icon: any; label: string; description: string; active: boolean; onClick: () => void; open: boolean;
}) => (
  <motion.button
    whileHover={{ x: 4, scale: 1.02 }} whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
      active
        ? 'bg-brand text-white shadow-xl shadow-brand/20'
        : 'text-txt-secondary hover:bg-white/5 hover:text-txt'
    }`}
  >
    <motion.div 
      animate={active ? { rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] } : {}} 
      transition={{ duration: 0.5 }}
      className={`shrink-0 ${active ? 'text-white' : 'text-brand-light'}`}
    >
      <Icon size={24} />
    </motion.div>
    {open && (
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-start overflow-hidden text-left">
        <span className="font-bold text-sm whitespace-nowrap leading-none mb-1">{label}</span>
        <span className={`text-[10px] ${active ? 'text-white/70' : 'text-txt-muted'} whitespace-nowrap truncate w-full`}>{description}</span>
      </motion.div>
    )}
  </motion.button>
);

/* ─── Stat Card ─── */
const StatCard = ({ title, value, change, icon: Icon, color, delay }: {
  title: string; value: string; change: string; icon: any; color: string; delay: number;
}) => (
  <motion.div
    variants={staggerItem}
    whileHover={{ y: -6, scale: 1.02 }}
    className="card group cursor-default"
  >
    <div className="flex justify-between items-start mb-6">
      <div className={`p-3 rounded-2xl bg-${color}/10 transition-transform group-hover:rotate-12`}>
        <Icon size={24} className={`text-${color}`} />
      </div>
      <motion.span
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ delay: delay + 0.3, type: 'spring', stiffness: 500 }}
        className="text-[10px] font-black px-3 py-1.5 rounded-full bg-emerald/10 text-emerald uppercase tracking-tighter"
      >
        {change}
      </motion.span>
    </div>
    <p className="text-txt-muted text-[10px] uppercase font-black tracking-[0.2em] mb-2">{title}</p>
    <motion.h3
      className="text-3xl font-bold text-txt font-heading tracking-tight"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay + 0.2, duration: 0.4 }}
    >
      {value}
    </motion.h3>
  </motion.div>
);

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(true);
  const { settings, updateSettings } = useSettings();

  useEffect(() => {
    DataStore.syncWithAPI().then(() => {
      setIsSyncing(false);
    });
  }, []);
  
  if (!settings || isSyncing) return <div className="h-screen bg-deep flex items-center justify-center text-white font-bold animate-pulse">Cargando ecosistema y sincronizando base de datos...</div>;

  const stats = DataStore.getDashboardStats();
  const recentProjects = DataStore.getRecentProjects();
  const clients = DataStore.getClients();

  const handleUpdatePrice = (field: string, value: number) => {
    updateSettings({ ...settings, prices: { ...settings.prices, [field]: value } });
  };

  const handleUpdateMaterial = (index: number, field: 'name' | 'price', value: any) => {
    const newMaterials = [...settings.prices.materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    updateSettings({ ...settings, prices: { ...settings.prices, materials: newMaterials } });
  };

  const addMaterial = () => {
    updateSettings({
      ...settings,
      prices: { ...settings.prices, materials: [...settings.prices.materials, { name: 'Nuevo Material', price: 0 }] }
    });
  };

  const handleResumeProject = (project: Project) => {
    setSelectedProject(project);
    setActiveTab('new-quote');
  };

  const handleNewProject = () => {
    setSelectedProject(undefined);
    setActiveTab('new-quote');
  };

  return (
    <div className="flex h-screen bg-deep overflow-hidden relative selection:bg-brand/40">

      {/* ─── AMBIENT ORBS ─── */}
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />

      {/* ─── FLOATING SIDEBAR (Desktop) ─── */}
      <motion.aside
        initial={false}
        animate={{ 
            width: sidebarOpen ? 300 : 96,
            x: 0 
        }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed left-6 top-6 bottom-6 glass rounded-[2.5rem] hidden lg:flex flex-col p-5 z-50 shadow-2xl border-white/5"
      >
        {/* Logo */}
        <motion.div className="flex items-center gap-3 px-3 mb-10 mt-3" layout>
          <img src="/logo.png" alt="Master FixPC"
            className={`logo-blend ${sidebarOpen ? 'h-12' : 'h-10'} w-auto object-contain transition-all duration-500`}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {!sidebarOpen && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="bg-brand p-2.5 rounded-2xl shrink-0 shadow-xl shadow-brand/40 animate-glow"
            >
              <ShieldCheck size={26} className="text-white" />
            </motion.div>
          )}
        </motion.div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-2.5">
          <SidebarItem 
            icon={BarChart3} label="Escritorio" description="Resumen global"
            active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} open={sidebarOpen} 
          />
          <SidebarItem 
            icon={PlusCircle} label="Nueva Cotización" description="Levantamiento técnico"
            active={activeTab === 'new-quote' && !selectedProject} onClick={handleNewProject} open={sidebarOpen} 
          />
          <SidebarItem 
            icon={FileText} label="Documentos" description="COT, INF y Cobros"
            active={activeTab === 'history' || (activeTab === 'new-quote' && !!selectedProject)} 
            onClick={() => setActiveTab('history')} open={sidebarOpen} 
          />
          <SidebarItem 
            icon={Users} label="Clientes" description="Cartera de contactos"
            active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} open={sidebarOpen} 
          />
          <SidebarItem 
            icon={Package} label="Inventario" description="Materiales y Stock"
            active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} open={sidebarOpen} 
          />
        </nav>

        {/* Footer */}
        <div className="pt-5 border-t border-white/10 space-y-2">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="px-4 py-3 mb-2 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-brand-light font-black uppercase tracking-[0.1em]">{BRANDING.author}</p>
                <p className="text-[9px] text-txt-muted">{BRANDING.rights}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <SidebarItem 
            icon={Settings} label="Configuración" description="Precios y catálogo"
            active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} open={sidebarOpen} 
          />
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }} 
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-4 text-txt-muted hover:text-txt transition-all rounded-2xl border border-transparent hover:border-white/10">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>
      </motion.aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className={`flex-1 overflow-y-auto flex flex-col relative z-10 transition-all duration-500 ${sidebarOpen ? 'lg:ml-[336px]' : 'lg:ml-[132px]'} lg:mr-6 lg:my-6 rounded-[2.5rem] bg-surface/50 backdrop-blur-sm border border-white/5 overflow-hidden shadow-inner`}>

        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="h-20 flex items-center justify-between px-8 sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-white/5"
        >
          <div className="flex items-center gap-6">
            <motion.img src="/logo.png" alt="MFX" className="logo-blend h-10 w-auto lg:hidden"
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="hidden lg:flex items-center bg-deep/50 px-5 py-3 rounded-2xl border border-white/5 w-80 group focus-within:border-brand/50 focus-within:bg-deep transition-all duration-300">
              <Search size={18} className="text-txt-muted group-focus-within:text-brand transition-colors mr-3" />
              <input type="text" placeholder="Buscar proyecto o cliente..." className="bg-transparent border-none outline-none text-txt text-sm w-full font-medium" />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <motion.button whileHover={{ scale: 1.1, rotate: 10 }} whileTap={{ scale: 0.9 }}
              className="relative p-3 rounded-2xl hover:bg-white/5 text-txt-secondary hover:text-brand transition-all">
              <Bell size={22} />
              <span className="absolute top-3 right-3 w-3 h-3 bg-cyan rounded-full border-2 border-surface animate-pulse" />
            </motion.button>
            <div className="h-10 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>
            <div className="flex items-center gap-4 cursor-pointer group">
              <div className="hidden sm:flex flex-col text-right">
                <p className="text-xs font-bold text-txt group-hover:text-brand transition-colors">Hector Lozano</p>
                <p className="text-[10px] text-txt-muted font-bold uppercase tracking-widest">Admin Pro</p>
              </div>
              <motion.div whileHover={{ scale: 1.1 }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand to-violet flex items-center justify-center text-white text-sm font-black shadow-lg shadow-brand/20">
                HL
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Content Area */}
        <div className="p-8 lg:p-12 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">

            {/* ─── DASHBOARD ─── */}
            {activeTab === 'dashboard' && (
              <motion.div key="dash" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <motion.h1 initial={{ x: -20 }} animate={{ x: 0 }}
                        className="text-4xl lg:text-5xl font-bold text-txt mb-2 font-heading tracking-tight">
                      Master FixPC <span className="text-brand">Ecosistema</span>
                    </motion.h1>
                    <p className="text-txt-secondary text-lg max-w-2xl font-medium">Control total de tus levantamientos técnicos y automatización de servicios.</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }}
                    onClick={handleNewProject}
                    className="btn-primary flex items-center justify-center gap-3 text-base py-4 px-8 rounded-2xl">
                    <PlusCircle size={20} /> Nuevo Proyecto
                  </motion.button>
                </div>

                <motion.div variants={staggerContainer} initial="initial" animate="animate"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Levantamientos" value={stats.pending.toString()} change="Pendientes" icon={Clock} color="amber" delay={0} />
                  <StatCard title="Cotizaciones" value={stats.accepted.toString()} change="Aprobadas" icon={ShieldCheck} color="violet" delay={0.1} />
                  <StatCard title="Informes Activos" value={stats.inProgress.toString()} change="En Trabajo" icon={TrendingUp} color="cyan" delay={0.2} />
                  <StatCard title="Facturado" value={`$${(stats.totalRevenue / 1000000).toFixed(1)}M`} change="Cobrado" icon={BarChart3} color="emerald" delay={0.3} />
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Activity */}
                  <div className="lg:col-span-2">
                    <ProjectListView onEdit={handleResumeProject} />
                  </div>

                  {/* Client Database Summary */}
                  <motion.div variants={staggerItem} className="card !p-0 overflow-hidden h-fit sticky top-8">
                    <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-xl font-bold flex items-center gap-3 font-heading">
                        <Users size={22} className="text-brand" /> Directorio
                        </h3>
                    </div>
                    <div className="p-8 space-y-6">
                      {clients.length > 0 ? clients.slice(0, 4).map((c, i) => (
                        <motion.div key={c.id} whileHover={{ x: 10, scale: 1.02 }}
                          className="flex items-center gap-4 group cursor-pointer bg-white/5 p-3 rounded-2xl border border-transparent hover:border-brand/20 transition-all">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-elevated to-surface flex items-center justify-center border border-white/10 group-hover:shadow-glow-blue transition-all text-brand font-black text-lg">
                            {c.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-txt truncate group-hover:text-brand transition-colors">{c.name}</p>
                            <p className="text-[10px] text-txt-muted font-bold">{c.nit || 'Sin NIT'}</p>
                          </div>
                          <ChevronRight size={16} className="text-txt-muted group-hover:text-brand group-hover:translate-x-1 transition-all shrink-0" />
                        </motion.div>
                      )) : (
                        <p className="text-center text-txt-muted text-sm italic py-8 font-medium">No hay clientes registrados</p>
                      )}
                      <button onClick={() => setActiveTab('clients')} className="w-full py-4 text-xs font-black uppercase tracking-widest text-brand hover:text-brand-light transition-colors">
                        Ver base de datos completa
                      </button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* ─── QUOTE / REPORT FORM ─── */}
            {activeTab === 'new-quote' && (
              <motion.div key="form-view" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <QuoteForm 
                  settings={settings} 
                  initialProject={selectedProject} 
                  onClose={() => { setActiveTab('history'); setSelectedProject(undefined); }} 
                />
              </motion.div>
            )}

            {/* ─── FULL DOCUMENT LIST ─── */}
            {activeTab === 'history' && (
              <motion.div key="history-view" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <ProjectListView onEdit={handleResumeProject} />
              </motion.div>
            )}

            {/* ─── CLIENTS VIEW ─── */}
            {activeTab === 'clients' && (
              <motion.div key="clients-view" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <ClientsView />
              </motion.div>
            )}

            {/* ─── INVENTORY VIEW ─── */}
            {activeTab === 'inventory' && (
              <motion.div key="inventory-view" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <InventoryView />
              </motion.div>
            )}

            {/* ─── SETTINGS ─── */}
            {activeTab === 'settings' && (
              <motion.div key="settings" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-12">
                <div>
                  <h1 className="text-4xl font-bold text-txt mb-2 font-heading tracking-tight">Estructura de Precios</h1>
                  <p className="text-txt-secondary text-lg font-medium">Controla los costos base para el cálculo automático de proyectos.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <motion.div className="card space-y-8">
                    <h3 className="text-xl font-bold text-brand flex items-center gap-3 pb-6 border-b border-white/10 font-heading">
                      <Briefcase size={22} /> Servicios y Equipos
                    </h3>
                    <div className="space-y-6">
                      {[
                        { label: 'Ayudante Técnico', field: 'helperDaily', icon: Users },
                        { label: 'Alquiler Escalera', field: 'ladderDaily', icon: Home },
                        { label: 'Alquiler Andamio', field: 'scaffoldingDaily', icon: ShieldCheck },
                        { label: 'Pistola de Impacto', field: 'impactGunDaily', icon: Briefcase },
                      ].map((item) => (
                        <div key={item.field} className="group">
                          <label className="text-[10px] uppercase font-black text-txt-muted tracking-[0.2em] mb-2.5 block group-focus-within:text-brand transition-colors">
                            {item.label} (Valor Día)
                          </label>
                          <div className="flex items-center bg-deep/50 border border-white/5 rounded-2xl px-5 py-4 focus-within:border-brand/50 focus-within:bg-deep transition-all duration-300 shadow-inner">
                            <span className="text-brand font-black text-lg mr-3">$</span>
                            <input type="number" value={(settings.prices as any)[item.field]}
                              onChange={(e) => handleUpdatePrice(item.field, parseInt(e.target.value) || 0)}
                              className="bg-transparent border-none outline-none text-txt text-lg w-full font-bold" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div className="card space-y-8">
                    <div className="flex justify-between items-center pb-6 border-b border-white/10">
                      <h3 className="text-xl font-bold text-cyan flex items-center gap-3 font-heading">
                        <PlusCircle size={22} /> Catálogo Pro
                      </h3>
                      <motion.button whileHover={{ rotate: 90, scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={addMaterial} className="p-3 bg-cyan/10 text-cyan rounded-2xl hover:bg-cyan hover:text-deep transition-all">
                        <PlusCircle size={20} />
                      </motion.button>
                    </div>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                      {settings.prices.materials.map((mat, i) => (
                        <motion.div key={i} className="flex gap-3 items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-cyan/30 hover:bg-white/[0.08] transition-all">
                          <input type="text" value={mat.name} onChange={(e) => handleUpdateMaterial(i, 'name', e.target.value)}
                            className="bg-transparent border-none outline-none text-txt text-sm flex-1 font-bold" />
                          <div className="flex items-center bg-deep/50 px-4 py-2.5 rounded-xl border border-white/5 w-32 shadow-inner">
                            <span className="text-cyan font-black text-xs mr-2">$</span>
                            <input type="number" value={mat.price} onChange={(e) => handleUpdateMaterial(i, 'price', parseInt(e.target.value) || 0)}
                              className="bg-transparent border-none outline-none text-txt text-sm w-full font-bold" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ─── BOTTOM NAV (Mobile) ─── */}
      <nav className="bottom-nav lg:hidden fixed bottom-6 left-6 right-6 glass rounded-[2rem] px-4 py-2 flex justify-around items-center z-50 shadow-2xl">
        {[
          { id: 'dashboard', icon: Home, label: 'Inicio' },
          { id: 'new-quote', icon: PlusCircle, label: 'Nueva' },
          { id: 'history', icon: FileText, label: 'Historial' },
          { id: 'settings', icon: Settings, label: 'Precios' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 p-3 transition-all duration-300 ${activeTab === tab.id ? 'text-brand scale-110' : 'text-txt-muted'}`}>
            <tab.icon size={22} className={activeTab === tab.id ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
