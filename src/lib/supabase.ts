import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wauetomehphbvceupyjj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdWV0b21laHBoYnZjZXVweWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDI4MjQsImV4cCI6MjA4NzI3ODgyNH0.Q2zwK1YXNWrvxuyb4nw1Ek6h3AObRhRxgqHIWrNkti8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos de la base de datos
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  amount: number;
  date: string;
  status: 'active' | 'completed' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'editor';
  avatar_url?: string;
  position?: string;
  content_blocks?: ContentBlock[];
  created_at: string;
  updated_at: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  cover_image_url?: string;
  meta_description?: string;
  slug: string;
  published: boolean;
  display_order: number;
  content_blocks: ContentBlock[];
  created_at: string;
  updated_at: string;
}

export interface PortfolioItem {
  id: string;
  type: 'project' | 'text_block';
  project_id?: string;
  project?: PortfolioProject;
  title?: string;
  content?: any; // TipTap JSON
  display_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogArticle {
  id: string;
  title: string;
  meta_description?: string;
  cover_image_url?: string;
  slug: string;
  published: boolean;
  scheduled_date?: string;
  category?: string;
  category_color?: string;
  content_blocks: ContentBlock[];
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: 'maker3d' | 'uxui' | 'branding';
  title: string;
  description?: string;
  cover_image_url?: string;
  content_blocks: ContentBlock[];
  updated_at: string;
}

export interface ContentBlock {
  id: string;
  type: 'rich-text' | 'full-width-text' | 'image-text' | 'text-image' | 'full-image' | 'video' | 'gallery';
  order: number;
  content: {
    html?: string;      // rich-text HTML (TipTap output)
    text?: string;      // legacy plain text
    image_url?: string;
    video_url?: string;
    alt_text?: string;
    images?: GalleryImageContent[]; // Para tipo 'gallery'
  };
}

export interface GalleryImageContent {
  url: string;
  alt?: string;
  caption?: string;
  order: number;
}

export interface GalleryImage {
  id: string;
  block_id: string;
  image_url: string;
  alt_text?: string;
  caption?: string;
  order: number;
  created_at: string;
  updated_at: string;
}

// ── Client Management Types ────────────────────────────────────────────────

export interface ClientProject {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  category?: 'uxui' | 'branding' | 'maker3d';
  status: 'active' | 'completed' | 'on_hold';
  brief_id?: string; // Referencia al brief asociado
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  projected_end_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskItem {
  id: string;
  task_id: string;
  type: 'deliverable' | 'milestone' | 'image' | 'document' | 'link';
  title?: string;
  description?: string;
  url?: string;
  file_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date?: string;
  status: 'pending' | 'paid' | 'overdue';
  pdf_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FinalDeliverable {
  id: string;
  client_id: string;
  project_id?: string;
  title: string;
  description?: string;
  type: 'pdf' | 'link' | 'file';
  url: string;
  file_name?: string;
  thumbnail_url?: string;
  files?: Array<{ url: string; file_name: string; thumbnail_url?: string }>; // Múltiples archivos
  created_at: string;
  updated_at: string;
}

export interface PricingService {
  id: string;
  category: string;
  service_name: string;
  description?: string;
  price?: number; // Precio fijo (mantener para compatibilidad)
  price_min?: number; // Precio mínimo del rango
  price_max?: number; // Precio máximo del rango
  currency: string;
  unit?: string;
  is_active: boolean;
  display_order: number;
  is_hidden?: boolean; // Para ocultar servicios a un cliente específico
  created_at: string;
  updated_at: string;
}

export interface ClientBrief {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  services: string[]; // Array de nombres de servicios solicitados
  budget_range?: string;
  timeline?: string;
  status: 'pending' | 'reviewed' | 'in_progress' | 'completed';
  notes?: string; // Notas del admin
  created_at: string;
  updated_at: string;
}