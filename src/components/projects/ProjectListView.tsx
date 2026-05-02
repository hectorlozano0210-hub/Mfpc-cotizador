import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Search, Filter, Clock, CheckCircle2, AlertCircle, 
  ChevronRight, MoreVertical, Download, MessageCircle, Edit3, Trash2,
  Calendar, CreditCard, ClipboardList
} from 'lucide-react';
import { DataStore } from '../../services/db';
import type { Project } from '../../types';

interface ProjectListViewProps {
  onEdit: (project: Project) => void;
}

export const ProjectListView = ({ onEdit }: ProjectListViewProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<Project['status'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setProjects(DataStore.getProjects());
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch = p.client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.reference.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusInfo = (status: Project['status']) => {
    switch(status) {
      case 'survey': return { label: 'Levantamiento', color: 'text-amber', bg: 'bg-amber/10', icon: ClipboardList };
      case 'quoted': return { label: 'Cotización', color: 'text-violet', bg: 'bg-violet/10', icon: FileText };
      case 'in_progress': return { label: 'Informe Activo', color: 'text-cyan', bg: 'bg-cyan/10', icon: Clock };
      case 'completed': return { label: 'Cuenta Cobro', color: 'text-emerald', bg: 'bg-emerald/10', icon: CreditCard };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-txt mb-2 font-heading tracking-tight">
            Gestión de <span className="text-brand">Documentos</span>
          </h1>
          <p className="text-txt-secondary text-lg font-medium">Historial completo de cotizaciones, informes y cobros.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card !p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-txt-muted" />
            <input 
              type="text" 
              placeholder="Buscar por referencia o cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-deep/50 border border-white/5 rounded-2xl pl-14 pr-5 py-4 text-sm font-bold focus:border-brand/50 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
            {(['all', 'survey', 'quoted', 'in_progress', 'completed'] as const).map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  filter === f ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white/5 text-txt-muted hover:text-txt'
                }`}
              >
                {f === 'all' ? 'Todos' : getStatusInfo(f as any).label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredProjects.length > 0 ? filteredProjects.map((project) => {
          const info = getStatusInfo(project.status);
          return (
            <motion.div 
              key={project.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: 8 }}
              className="card !p-0 overflow-hidden group border-white/5 hover:border-brand/30 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row items-stretch md:items-center">
                <div className={`w-2 md:w-3 ${info.bg.replace('/10', '')} transition-colors group-hover:w-4`} />
                
                <div className="flex-1 p-8 flex flex-col md:flex-row md:items-center gap-8">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-brand font-black text-sm">{project.reference}</span>
                      <span className={`badge ${info.bg} ${info.color} text-[9px] font-black tracking-[0.1em]`}>
                        {info.label.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-txt truncate group-hover:text-brand transition-colors">
                      {project.client.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-xs text-txt-muted font-bold">
                        <Calendar size={14} /> {project.date}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-txt-muted font-bold">
                        <AlertCircle size={14} /> {project.activities.length} Actividades
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-1">
                    <p className="text-[10px] text-txt-muted font-black uppercase tracking-widest">Inversión Total</p>
                    <p className="text-2xl font-black text-txt font-heading tracking-tight">
                      ${project.total.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <motion.button 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => onEdit(project)}
                      className="p-4 bg-brand/10 text-brand rounded-2xl hover:bg-brand hover:text-white transition-all border border-brand/20">
                      <Edit3 size={20} />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="p-4 bg-emerald/10 text-emerald rounded-2xl hover:bg-emerald hover:text-white transition-all border border-emerald/20">
                      <MessageCircle size={20} />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="p-4 bg-white/5 text-txt-muted rounded-2xl hover:bg-white/10 hover:text-txt transition-all border border-white/5">
                      <Download size={20} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        }) : (
          <div className="card text-center py-20 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto text-txt-muted">
              <Search size={40} />
            </div>
            <p className="text-txt-secondary font-bold">No se encontraron documentos con estos filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
};
