import type { Client, Project, DashboardStats, ProjectStatus, InventoryItem } from '../types';

const CLIENTS_KEY = 'mfx_clients';
const PROJECTS_KEY = 'mfx_projects';
const INVENTORY_KEY = 'mfx_inventory';

// Configurar API: Cambia a 'http://localhost:3001' si pruebas localmente.
const API_URL = 'https://mfpc-cotizador.onrender.com';

export const DataStore = {
  // --- Sync ---
  syncWithAPI: async () => {
    try {
      // Pull Clients
      const clientsRes = await fetch(`${API_URL}/api/clients`);
      if (clientsRes.ok) {
        const clients = await clientsRes.json();
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
      }
      
      // Pull Inventory
      const invRes = await fetch(`${API_URL}/api/inventory`);
      if (invRes.ok) {
        const inventory = await invRes.json();
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
      }

      // Pull Projects
      const projRes = await fetch(`${API_URL}/api/projects`);
      if (projRes.ok) {
        const projects = await projRes.json();
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      }
      return true;
    } catch (error) {
      console.error('Error syncing with API:', error);
      return false; // Silently fail and rely on localStorage
    }
  },

  // --- Clients ---
  getClients: (): Client[] => {
    const data = localStorage.getItem(CLIENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveClient: (client: Client) => {
    const clients = DataStore.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    const newClient = { ...client, createdAt: client.createdAt || new Date().toISOString() };
    
    if (index >= 0) clients[index] = { ...clients[index], ...newClient };
    else clients.push(newClient);
    
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));

    // Fire and forget to API
    fetch(`${API_URL}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient)
    }).catch(e => console.error('API Error:', e));
  },

  deleteClient: (id: string) => {
    const clients = DataStore.getClients().filter(c => c.id !== id);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    
    fetch(`${API_URL}/api/clients/${id}`, { method: 'DELETE' }).catch(e => console.error('API Error:', e));
  },

  searchClients: (query: string): Client[] => {
    const clients = DataStore.getClients();
    const q = query.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.nit.toLowerCase().includes(q) ||
      c.contact.toLowerCase().includes(q)
    );
  },

  // --- Inventory ---
  getInventory: (): InventoryItem[] => {
    const data = localStorage.getItem(INVENTORY_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveInventoryItem: (item: InventoryItem) => {
    const inventory = DataStore.getInventory();
    const index = inventory.findIndex(i => i.id === item.id);
    if (index >= 0) inventory[index] = item;
    else inventory.push(item);
    
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));

    fetch(`${API_URL}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }).catch(e => console.error('API Error:', e));
  },

  deleteInventoryItem: (id: string) => {
    const inventory = DataStore.getInventory().filter(i => i.id !== id);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));

    fetch(`${API_URL}/api/inventory/${id}`, { method: 'DELETE' }).catch(e => console.error('API Error:', e));
  },

  // --- Projects ---
  getProjects: (): Project[] => {
    const data = localStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getProjectById: (id: string): Project | undefined => {
    return DataStore.getProjects().find(p => p.id === id);
  },

  saveProject: (project: Project) => {
    const projects = DataStore.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    
    // Auto-save/update client
    if (project.clientId) {
        const existingClient = DataStore.getClients().find(c => c.id === project.clientId);
        const client: Client = {
            id: project.clientId,
            name: project.client.name,
            contact: project.client.contact,
            address: project.client.address,
            phone: project.client.phone,
            email: existingClient?.email || '',
            nit: existingClient?.nit || '',
            createdAt: existingClient?.createdAt || new Date().toISOString()
        };
        DataStore.saveClient(client);
    }

    const now = new Date().toISOString();
    const updatedProject = { ...project, updatedAt: now };
    if (!updatedProject.createdAt) updatedProject.createdAt = now;

    // Logic for reference transition
    if (project.status === 'quoted' && !project.reference.startsWith('COT')) {
        updatedProject.reference = DataStore.getNextReference('COT');
    } else if (project.status === 'in_progress' && !project.reference.startsWith('INF')) {
        updatedProject.reference = DataStore.getNextReference('INF');
    } else if (project.status === 'completed' && !project.reference.startsWith('CC')) {
        updatedProject.reference = DataStore.getNextReference('CC');
    }

    if (index >= 0) {
      projects[index] = updatedProject;
    } else {
      projects.push(updatedProject);
    }
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    
    // Fire and forget to API
    fetch(`${API_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject)
    }).catch(e => console.error('API Error:', e));

    return updatedProject;
  },

  deleteProject: (id: string) => {
    const projects = DataStore.getProjects().filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    fetch(`${API_URL}/api/projects/${id}`, { method: 'DELETE' }).catch(e => console.error('API Error:', e));
  },

  getNextReference: (prefix: 'COT' | 'INF' | 'CC' = 'COT'): string => {
    const projects = DataStore.getProjects();
    const filtered = projects.filter(p => p.reference.startsWith(prefix));
    const count = filtered.length + 1;
    return `${prefix}-${count.toString().padStart(3, '0')}`;
  },

  searchProjects: (query: string, status?: ProjectStatus): Project[] => {
    const projects = DataStore.getProjects();
    const q = query.toLowerCase();
    return projects.filter(p => {
      const matchQuery = p.reference.toLowerCase().includes(q) || p.client.name.toLowerCase().includes(q);
      const matchStatus = status ? p.status === status : true;
      return matchQuery && matchStatus;
    });
  },

  // --- Dashboard Stats ---
  getDashboardStats: (): DashboardStats => {
    const projects = DataStore.getProjects();
    return {
      pending: projects.filter(p => p.status === 'survey').length,
      accepted: projects.filter(p => p.status === 'quoted').length,
      inProgress: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      totalRevenue: projects.filter(p => p.status === 'completed').reduce((acc, p) => acc + p.total, 0),
      totalProjects: projects.length
    };
  },

  getRecentProjects: (limit: number = 5): Project[] => {
    return DataStore.getProjects()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }
};
