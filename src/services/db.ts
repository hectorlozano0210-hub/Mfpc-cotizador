import type { Client, Project, DashboardStats, ProjectStatus, InventoryItem } from '../types';

const CLIENTS_KEY = 'mfx_clients';
const PROJECTS_KEY = 'mfx_projects';
const INVENTORY_KEY = 'mfx_inventory';

export const DataStore = {
  // --- Clients ---
  getClients: (): Client[] => {
    const data = localStorage.getItem(CLIENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveClient: (client: Client) => {
    const clients = DataStore.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    if (index >= 0) {
      clients[index] = { ...clients[index], ...client };
    } else {
      clients.push({ ...client, createdAt: new Date().toISOString() });
    }
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  },

  deleteClient: (id: string) => {
    const clients = DataStore.getClients().filter(c => c.id !== id);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
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
    if (index >= 0) {
      inventory[index] = item;
    } else {
      inventory.push(item);
    }
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  },

  deleteInventoryItem: (id: string) => {
    const inventory = DataStore.getInventory().filter(i => i.id !== id);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
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
    return updatedProject;
  },

  getNextReference: (prefix: 'COT' | 'INF' | 'CC' = 'COT'): string => {
    const projects = DataStore.getProjects();
    const filtered = projects.filter(p => p.reference.startsWith(prefix));
    const count = filtered.length + 1;
    return `${prefix}-${count.toString().padStart(3, '0')}`;
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
