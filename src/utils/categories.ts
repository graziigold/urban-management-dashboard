import type { LocationCategory } from './api/locations';

export interface CategoryInfo {
  id: LocationCategory;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'parquinho', label: 'Parquinho', icon: '🛝', color: 'text-pink-600', bgColor: 'bg-pink-100' }, // <-- Aqui está o escorregador!
  { id: 'pec', label: 'PEC', icon: '💪', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { id: 'quadra', label: 'Quadra Esportiva', icon: '🏀', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { id: 'campo', label: 'Campo', icon: '⚽', color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 'praca', label: 'Praça', icon: '🌳', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  { id: 'ponto-onibus', label: 'Ponto de Ônibus', icon: '🚏', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'obra', label: 'Obra', icon: '🏗️', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { id: 'iluminacao', label: 'Iluminação', icon: '💡', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { id: 'papa-entulho', label: 'Papa Entulho', icon: '🗑️', color: 'text-stone-600', bgColor: 'bg-stone-100' },
  { id: 'outro', label: 'Outro', icon: '📍', color: 'text-gray-600', bgColor: 'bg-gray-100' },
];

export function getCategoryInfo(categoryId: LocationCategory): CategoryInfo {
  return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
}
