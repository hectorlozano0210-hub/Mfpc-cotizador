import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Search, Mail, Phone, MapPin, Trash2, Edit2, 
  ExternalLink, ChevronRight, X, Building2, UserPlus
} from 'lucide-react';
import { DataStore } from '../../services/db';
import type { Client } from '../../types';

export const ClientsView = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Partial<Client> | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    setClients(DataStore.getClients());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClient?.name) {
      DataStore.saveClient({
        id: selectedClient.id || crypto.randomUUID(),
        name: selectedClient.name,
        contact: selectedClient.contact || '',
        address: selectedClient.address || '',
        phone: selectedClient.phone || '',
        email: selectedClient.email || '',
        nit: selectedClient.nit || '',
        createdAt: selectedClient.createdAt || new Date().toISOString()
      });
      setIsEditing(false);
      setSelectedClient(null);
      loadClients();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este cliente?')) {
      DataStore.deleteClient(id);
      loadClients();
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-txt mb-2 font-heading tracking-tight">
            Directorio <span className="text-brand">Clientes</span>
          </h1>
          <p className="text-txt-secondary text-lg font-medium">Gestiona tu base de datos de empresas y contactos.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setSelectedClient({}); setIsEditing(true); }}
          className="btn-primary flex items-center justify-center gap-3 text-base py-4 px-8 rounded-2xl">
          <UserPlus size={20} /> Nuevo Cliente
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="card !p-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-txt-muted" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, NIT o contacto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-deep/50 border border-white/5 rounded-2xl pl-14 pr-5 py-4 text-sm font-bold focus:border-brand/50 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-xs font-black text-txt-muted uppercase tracking-widest">
          <Users size={14} /> {filteredClients.length} Clientes
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client) => (
            <motion.div 
              key={client.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -6 }}
              className="card group !p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black text-2xl border border-brand/20 group-hover:bg-brand group-hover:text-white transition-all duration-500">
                  {client.name[0]}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedClient(client); setIsEditing(true); }}
                    className="p-2.5 rounded-xl bg-white/5 text-txt-muted hover:text-brand hover:bg-brand/10 transition-all border border-transparent hover:border-brand/20">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(client.id)}
                    className="p-2.5 rounded-xl bg-white/5 text-txt-muted hover:text-rose hover:bg-rose/10 transition-all border border-transparent hover:border-rose/20">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-txt mb-1 group-hover:text-brand transition-colors">{client.name}</h3>
              <p className="text-[10px] text-txt-muted font-black uppercase tracking-[0.2em] mb-6">{client.nit || 'NIT NO REGISTRADO'}</p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-txt-secondary">
                  <Mail size={16} className="text-brand-light" />
                  <span className="truncate">{client.email || 'Sin correo'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-txt-secondary">
                  <Phone size={16} className="text-emerald" />
                  <span>{client.phone || 'Sin teléfono'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-txt-secondary">
                  <MapPin size={16} className="text-amber" />
                  <span className="truncate">{client.address || 'Sin dirección'}</span>
                </div>
              </div>

              <motion.button 
                whileHover={{ x: 5 }}
                className="w-full mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs font-black uppercase tracking-widest text-txt-muted hover:text-brand transition-colors">
                Ver Proyectos <ChevronRight size={16} />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-deep/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl glass rounded-[2.5rem] p-10 shadow-2xl border-white/10"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-bold font-heading">
                  {selectedClient?.id ? 'Editar' : 'Nuevo'} <span className="text-brand">Cliente</span>
                </h2>
                <button onClick={() => setIsEditing(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-txt-muted tracking-widest ml-2">Nombre de la Empresa / Persona</label>
                  <input 
                    required
                    value={selectedClient?.name || ''}
                    onChange={(e) => setSelectedClient({ ...selectedClient, name: e.target.value })}
                    className="w-full bg-deep/50 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand/50 outline-none transition-all shadow-inner"
                    placeholder="Ej: Master FixPC S.A.S"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-txt-muted tracking-widest ml-2">NIT / Identificación</label>
                    <input 
                      value={selectedClient?.nit || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, nit: e.target.value })}
                      className="w-full bg-deep/50 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand/50 outline-none transition-all shadow-inner"
                      placeholder="900.XXX.XXX-X"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-txt-muted tracking-widest ml-2">Teléfono</label>
                    <input 
                      value={selectedClient?.phone || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, phone: e.target.value })}
                      className="w-full bg-deep/50 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand/50 outline-none transition-all shadow-inner"
                      placeholder="+57 3XX XXX XXXX"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-txt-muted tracking-widest ml-2">Persona de Contacto</label>
                  <input 
                    value={selectedClient?.contact || ''}
                    onChange={(e) => setSelectedClient({ ...selectedClient, contact: e.target.value })}
                    className="w-full bg-deep/50 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand/50 outline-none transition-all shadow-inner"
                    placeholder="Nombre del encargado"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-txt-muted tracking-widest ml-2">Dirección Principal</label>
                  <input 
                    value={selectedClient?.address || ''}
                    onChange={(e) => setSelectedClient({ ...selectedClient, address: e.target.value })}
                    className="w-full bg-deep/50 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand/50 outline-none transition-all shadow-inner"
                    placeholder="Calle XX # XX - XX, Bogotá"
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={() => setIsEditing(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-[2] py-4 bg-brand hover:bg-brand-light text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-brand/20">
                    Guardar Cliente
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
