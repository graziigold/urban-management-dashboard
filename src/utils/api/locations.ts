import { projectId, publicAnonKey } from '../supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-9613434f`;

export type LocationCategory =
  | 'parquinho'
  | 'pec'
  | 'quadra'
  | 'campo'
  | 'praca'
  | 'ponto-onibus'
  | 'obra'
  | 'iluminacao'
  | 'sinalizacao'
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
}

// Headers para autenticação
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
  };
}

// GET /locations - Listar todos
export async function getAllLocations(): Promise<Location[]> {
  try {
    const response = await fetch(`${API_BASE}/locations`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch locations');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
}

// GET /locations/:id - Buscar por ID
export async function getLocationById(id: string): Promise<Location> {
  try {
    const response = await fetch(`${API_BASE}/locations/${id}`, { headers: getHeaders() });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch location');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching location:', error);
    throw error;
  }
}

// POST /locations - Criar novo
export async function createLocation(input: CreateLocationInput): Promise<Location> {
  try {
    const response = await fetch(`${API_BASE}/locations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(input),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to create location');
    }

    return result.data;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
}

// PUT /locations/:id - Atualizar
export async function updateLocation(id: string, updates: Partial<CreateLocationInput>): Promise<Location> {
  try {
    const response = await fetch(`${API_BASE}/locations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to update location');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
}

// DELETE /locations/:id - Deletar
export async function deleteLocation(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/locations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete location');
    }
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
}

// DELETE /locations - Deletar TODOS os locais
export async function deleteAllLocations(): Promise<{ count: number }> {
  try {
    const response = await fetch(`${API_BASE}/locations`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete all locations');
    }

    return { count: result.count || 0 };
  } catch (error) {
    console.error('Error deleting all locations:', error);
    throw error;
  }
}
