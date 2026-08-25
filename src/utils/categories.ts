import { createElement } from 'react';
import type { ElementType } from 'react';
import { 
  Dumbbell, 
  TreePine, 
  Bus, 
  HardHat, 
  Lightbulb, 
  Trash2, 
  MapPin 
} from 'lucide-react';
import type { LocationCategory } from './api/locations';

// 1. O BALANÇO (Para o Parquinho)
const SwingIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }: any) => {
  return createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: color, strokeWidth: strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", className: className
  },
    createElement('path', { d: "M4 22V4h16v18" }),
    createElement('path', { d: "M9 4v12" }),
    createElement('path', { d: "M15 4v12" }),
    createElement('path', { d: "M8 16h8" })
  );
};

// 2. A BOLA DE BASQUETE (Para a Quadra Esportiva)
const BasketballIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }: any) => {
  return createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: color, strokeWidth: strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", className: className
  },
    createElement('circle', { cx: "12", cy: "12", r: "10" }), // Contorno da bola
    createElement('path', { d: "M12 2v20" }), // Linha vertical
    createElement('path', { d: "M2 12h20" }), // Linha horizontal
    createElement('path', { d: "M5.5 5.5c3.5 3.5 3.5 9.5 0 13" }), // Curva esquerda
    createElement('path', { d: "M18.5 5.5c-3.5 3.5-3.5 9.5 0 13" }) // Curva direita
  );
};

// 3. A BOLA DE FUTEBOL (Para o Campo)
const SoccerIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }: any) => {
  return createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: color, strokeWidth: strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", className: className
  },
    createElement('circle', { cx: "12", cy: "12", r: "10" }), // Contorno da bola
    createElement('polygon', { points: "12 7 16 10 14.5 14.5 9.5 14.5 8 10" }), // Pentágono central
    createElement('path', { d: "M12 7V2" }), // Linha pra cima
    createElement('path', { d: "M16 10l4.5-2" }), // Linha pra direita cima
    createElement('path', { d: "M14.5 14.5L17.5 19" }), // Linha pra direita baixo
    createElement('path', { d: "M9.5 14.5L6.5 19" }), // Linha pra esquerda baixo
    createElement('path', { d: "M8 10L3.5 8" }) // Linha pra esquerda cima
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
  { id: 'parquinho', label: 'Parquinho', icon: SwingIcon, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  { id: 'pec', label: 'PEC', icon: Dumbbell, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { id: 'quadra', label: 'Quadra Esportiva', icon: BasketballIcon, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { id: 'campo', label: 'Campo', icon: SoccerIcon, color: 'text-green-600', bgColor: 'bg-green-100' },
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
