import { createElement } from 'react';
import type { ElementType } from 'react';
import { 
  Dumbbell, 
  Trophy, 
  Flag, 
  TreePine, 
  Bus, 
  HardHat, 
  Lightbulb, 
  Trash2, 
  MapPin 
} from 'lucide-react';
import type { LocationCategory } from './api/locations';

// Escorregador (Seguro para Vercel - sem quebrar o .ts!)
const SlideIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }: any) => {
  return createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className
  },
    createElement('path', { d: "M5 22V4" }),
    createElement('path', { d: "M5 18H2" }),
    createElement('path', { d: "M5 14H2" }),
    createElement('path', { d: "M5 10H2" }),
    createElement('path', { d: "M5 6H2" }),
    createElement('path', { d: "M5 4h2" }),
    createElement('path', { d: "M7 4 C 10 4 11 6 13 10 L 17 18 C 18 20 19 20 22 20" }),
    createElement('path', { d: "M15 14v8" })
  );
};

export interface CategoryInfo {
  id: LocationCategory;
  label: string;
  icon: ElementType;
  color: string;
  bgColor: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'parquinho', label: 'Parquinho', icon: SlideIcon, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  { id: 'pec', label: 'PEC', icon: Dumbbell, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { id: 'quadra', label: 'Quadra Esportiva', icon: Trophy, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { id: 'campo', label: 'Campo', icon: Flag, color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 'praca', label: 'Praça', icon: TreePine, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  { id: 'ponto-onibus', label: 'Ponto de Ônibus', icon: Bus, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'obra', label: 'Obra', icon: HardHat, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { id: 'iluminacao', label: 'Iluminação', icon: Lightbulb, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { id: 'papa-entulho', label: 'Papa Entulho', icon: Trash2, color: 'text-stone-600', bgColor: 'bg-stone-100' },
  { id: 'outro', label: 'Outro', icon: MapPin, color: 'text-gray-600', bgColor: 'bg-gray-100' },
];

export function getCategoryInfo(categoryId: LocationCategory): CategoryInfo {
  return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
}
