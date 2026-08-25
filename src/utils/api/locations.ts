import { projectId, publicAnonKey } from '../supabase/info';

// AGORA APONTA DIRETO PARA O BANCO DE DADOS (POSTGREST), SEM INTERMEDIÁRIOS!
const API_BASE = `https://${projectId}.supabase.co/rest/v1/locations`;

export type LocationCategory =
  | 'parquinho'
  | 'pec'
  | 'quadra'
  | 'campo'
  | 'praca'
  | 'ponto-onibus'
  | 'obra'
  | 'iluminacao'
  | 'papa-entulho'
  | 'outro';

export interface Location {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  status: 'critical' | 'warning' | 'success';
  region: string;
  category: LocationCategory;
  description: string;
  address: string;
  seiProcess: string;
  images: string[];
  isUrgent: boolean; // <-- Adicionado aqui
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationInput {
  title: string;
  latitude: number;
  longitude: number;
  status: 'critical' | 'warning' | 'success';
  region: string;
  category: LocationCategory;
  description?: string;
  address?: string;
  seiProcess?: string;
  images?: string[];
  isUrgent?: boolean; // <-- Adicionado aqui
}

// Headers nativos do Supabase
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': publicAnonKey,
    'Authorization': `Bearer ${publicAnonKey}`,
    'Prefer': 'return=representation' // Faz o Supabase devolver o dado após inserir/atualizar
  };
}

// GET /locations - Listar todos
export async function getAllLocations(): Promise<Location[]> {
  try {
    const response = await fetch(`${API_BASE}?select=*`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    // Mapeia garantindo o suporte ao campo de urgência (seja camelCase ou snake_case)
    return (data || []).map((item: any) => ({
      ...item,
      isUrgent: item.isUrgent ?? item.is_urgent ?? false,
      seiProcess: item.seiProcess ?? item.sei_process ?? '',
    }));
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
}

// GET /locations/:id - Buscar por ID
export async function getLocationById(id: string): Promise<Location> {
  try {
    const response = await fetch(`${API_BASE}?id=eq.${id}&select=*`, { 
      headers: getHeaders() 
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const item = data[0];
    return {
      ...item,
      isUrgent: item.isUrgent ?? item.is_urgent ?? false,
      seiProcess: item.seiProcess ?? item.sei_process ?? '',
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    throw error;
  }
}

// POST /locations - Criar novo
export async function createLocation(input: CreateLocationInput): Promise<Location> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...input,
        isUrgent: input.isUrgent ?? false
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const item = data[0];
    return {
      ...item,
      isUrgent: item.isUrgent ?? item.is_urgent ?? false,
      seiProcess: item.seiProcess ?? item.sei_process ?? '',
    };
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
}

// PATCH /locations/:id - Atualizar
export async function updateLocation(id: string, updates: Partial<CreateLocationInput>): Promise<Location> {
  try {
    const response = await fetch(`${API_BASE}?id=eq.${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        ...updates,
        updatedAt: new Date().toISOString()
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const item = data[0];
    return {
      ...item,
      isUrgent: item.isUrgent ?? item.is_urgent ?? false,
      seiProcess: item.seiProcess ?? item.sei_process ?? '',
    };
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
}

// DELETE /locations/:id - Deletar
export async function deleteLocation(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}?id=eq.${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
}

// DELETE /locations - Deletar TODOS os locais
export async function deleteAllLocations(): Promise<{ count: number }> {
  try {
    const response = await fetch(API_BASE, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { count: 1 };
  } catch (error) {
    console.error('Error deleting all locations:', error);
    throw error;
  }
}
