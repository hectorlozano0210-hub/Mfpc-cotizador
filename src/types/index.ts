/* ═══════════════════════════════════════
   Master FixPC — Data Types
   MySQL-ready structure
   ═══════════════════════════════════════ */

export interface Client {
  id: string;
  name: string;
  contact: string;
  address: string;
  phone: string;
  email: string;
  nit: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  unit: string; // 'm', 'par', 'unidad', etc.
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  difficultyMultiplier: number;
  total: number;
  tags?: string[];
}

export interface ResourceItem {
  id: string;
  name: string;
  type: 'helper' | 'tool' | 'material';
  quantity: number;
  unitPrice: number;
  days?: number;
  total: number;
}

export interface ActivityLog {
  id: string;
  date: string;
  time: string;
  description: string;
  estimatedHours: number;
  authorizedBy: string;
  price: number;
  recipientSignature?: string;
  recipientName?: string;
  images?: string[];
  tags?: string[];
}

export type ProjectStatus = 'survey' | 'quoted' | 'in_progress' | 'completed';

export interface DifficultyConfig {
  height: 'low' | 'medium' | 'high';
  infrastructure: 'canaleta' | 'emt' | 'industrial';
  scaffolding: boolean;
  ladder: boolean;
  helpers: number;
  context?: string; // Contexto adicional para la IA
}

export interface Project {
  id: string;
  reference: string;
  clientId: string;
  client: {
    name: string;
    contact: string;
    address: string;
    phone: string;
  };
  date: string;
  time: string;
  status: ProjectStatus;
  items: QuoteItem[];
  resources: ResourceItem[];
  activities: ActivityLog[];
  difficultyConfig: DifficultyConfig;
  signature?: string; // Client global signature
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  companyProfile: {
    name: string;
    nit: string;
    address: string;
    phone: string;
    email: string;
    logoUrl: string;
    footerText: string;
  };
  prices: {
    helperDaily: number;
    ladderDaily: number;
    scaffoldingDaily: number;
    impactGunDaily: number;
    materials: { name: string; price: number }[];
  };
  inventoryCategories: string[];
}

export interface DashboardStats {
  pending: number;
  accepted: number;
  inProgress: number;
  completed: number;
  totalRevenue: number;
  totalProjects: number;
}

export const DATA_VERSION = '1.1.0';
