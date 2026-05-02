import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Search, Plus, Filter, Edit2, Trash2, X,
  Tag, BarChart, ShoppingCart, Box, ChevronRight, Hash
} from 'lucide-react';
import { DataStore } from '../../services/db';
import type { InventoryItem } from '../../types';

export const InventoryView = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Partial<InventoryItem> | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = () => {
    setItems(DataStore.getInventory());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem?.description && selectedItem?.code) {
      DataStore.saveInventoryItem({
        id: selectedItem.id || crypto.randomUUID(),
        code: selectedItem.code,
        category: selectedItem.category || 'Otros',
        description: selectedItem.description,
        price: selectedItem.price || 0,
        stock: selectedItem.stock || 0,
        unit: selectedItem.unit || 'unidad'
      });
      setIsEditing(false);
      setSelectedItem(null);
      loadInventory();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este item del inventario?')) {
      DataStore.deleteInventoryItem(id);
      loadInventory();
    }
  };

  const filteredItems = items.filter(i =>
    i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-txt mb-2 font-heading tracking-tight">
            Inventario <span className="text-brand">Materiales</span>
          </h1>
          <p className="text-txt-secondary text-lg font-medium">Gestiona cables, balums y hardware para tus proyectos.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setSelectedItem({}); setIsEditing(true); }}
          className="btn-primary flex items-center justify-center gap-3 text-base py-4 px-8 rounded-2xl">
          <Plus size={20} /> Nuevo Item
        </motion.button>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 card !p-6">
          <div className="relative w-full">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-txt-muted" />
            <input
              type="text"
              placeholder="Buscar por código, descripción o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-deep/50 border border-white/5 rounded-2xl pl-14 pr-5 py-4 text-sm font-bold focus:border-brand/50 outline-none transition-all"
            />
          </div>
        </div>
        <div className="card !p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand/10 rounded-xl text-brand">
              <Package size={20} />
            </div>
            <div>
              <p className="text-[10px] text-txt-muted font-black uppercase tracking-widest leading-none mb-1">Total Items</p>
              <p className="text-xl font-bold text-txt leading-none">{items.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card !p-0 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-txt-muted text-[10px] uppercase font-black tracking-[0.2em]">
                <th className="py-6 pl-8">Código</th>
                <th className="py-6">Descripción</th>
                <th className="py-6">Categoría</th>
                <th className="py-6">Precio Base</th>
                <th className="py-6">Stock</th>
                <th className="py-6 pr-8 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <motion.tr
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-white/5 transition-all group"
                  >
                    <td className="py-5 pl-8">
                      <span className="px-3 py-1.5 bg-deep rounded-lg text-brand font-black text-xs border border-white/5">
                        {item.code}
                      </span>
                    </td>
                    <td className="py-5">
                      <p className="text-sm font-bold text-txt group-hover:text-brand transition-colors">{item.description}</p>
                      <p className="text-[10px] text-txt-muted font-medium">{item.unit}</p>
                    </td>
                    <td className="py-5">
                      <span className="badge badge-blue text-[9px]">{item.category}</span>
                    </td>
                    <td className="py-5 text-sm font-black text-txt-secondary">
                      ${item.price.toLocaleString()}
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.stock < 5 ? 'bg-rose animate-pulse' : 'bg-emerald'}`} />
                        <span className="text-sm font-bold text-txt">{item.stock}</span>
                      </div>
                    </td>
                    <td className="py-5 pr-8 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setSelectedItem(item); setIsEditing(true); }}
                          className="p-2.5 rounded-xl bg-white/5 text-txt-muted hover:text-brand hover:bg-brand/10 transition-all border border-transparent hover:border-brand/20">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          className="p-2.5 rounded-xl bg-white/5 text-txt-muted hover:text-rose hover:bg-rose/10 transition-all border border-transparent hover:border-rose/20">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-txt-muted italic font-medium">
                    No se encontraron materiales en el inventario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand/10 rounded-2xl text-brand">
                    <ShoppingCart size={24} />
                  </div>
                  <h2 className="text-2xl font-bold font-heading">
                    {selectedItem?.id ? 'Editar' : 'Nuevo'} <span className="text-brand">Material</span>
                  </h2>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-txt-muted tracking-widest ml-2">Código Item</label>
                    <div className="relative">
                      <Hash size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-txt-muted" />
                      <input
                        required
                        value={selectedItem?.code || ''}
                        onChange={(e) => setSelectedItem({ ...selectedItem, code: e.target.value.toUpperCase() })}
                        className="w-full bg-deep/50 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:border-brand/50 outline-none transition-all shadow-inner"
                        placeholder="CBL-001"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-txt-muted tracking-widest ml-2">Categoría</label>
                    <div className="relative">
                      <Tag size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-txt-muted" />
                      <select
                        value={selectedItem?.category || ''}
                        onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })}
                        className="w-full bg-deep/50 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:border-brand/50 outline-none transition-all shadow-inner appearance-none"
                      >
                        <option value="Cables">Cables</option>
                        <option value="Video">Video / Balum</option>
                        <option value="Cámaras">Cámaras</option>
                        <option value="Redes">Redes</option>
                        <option value="Hardware">Hardware / DVR</option>
                        <option value="Otros">Otros</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-txt-muted tracking-widest ml-2">Descripción del Producto</label>
                  <input
                    required
                    value={selectedItem?.description || ''}
                    onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })}
                    className="w-full bg-deep/50 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand/50 outline-none transition-all shadow-inner"
                    placeholder="Ej: Cable UTP Categoría 6 - Exterior"
                  />
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-txt-muted tracking-widest ml-2">Precio Base</label>
                    <input
                      type="number"
                      value={selectedItem?.price || 0}
                      onChange={(e) => setSelectedItem({ ...selectedItem, price: parseInt(e.target.value) || 0 })}
                      className="w-full bg-deep/50 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand/50 outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-txt-muted tracking-widest ml-2">Stock Inicial</label>
                    <input
                      type="number"
                      value={selectedItem?.stock || 0}
                      onChange={(e) => setSelectedItem({ ...selectedItem, stock: parseInt(e.target.value) || 0 })}
                      className="w-full bg-deep/50 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand/50 outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-txt-muted tracking-widest ml-2">Unidad</label>
                    <select
                      value={selectedItem?.unit || 'unidad'}
                      onChange={(e) => setSelectedItem({ ...selectedItem, unit: e.target.value })}
                      className="w-full bg-deep/50 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand/50 outline-none transition-all shadow-inner appearance-none"
                    >
                      <option value="unidad">Unidad</option>
                      <option value="m">Metros</option>
                      <option value="par">Par</option>
                      <option value="rollo">Rollo</option>
                      <option value="caja">Caja</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={() => setIsEditing(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-[2] py-4 bg-brand hover:bg-brand-light text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-brand/20">
                    Guardar Material
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
