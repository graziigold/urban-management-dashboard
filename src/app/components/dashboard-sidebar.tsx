import { MapPin } from 'lucide-react';
import { Badge } from './ui/badge';
import logoGeoParques from '../../imports/ChatGPT_Image_15_de_mai._de_2026__15_52_11.png';
import { CATEGORIES } from '../../utils/categories';
import type { LocationCategory } from '../../utils/api/locations';

interface Region {
  id: string;
  name: string;
  color: string;
}

const regions: Region[] = [
  { id: 'norte', name: 'Santa Maria Norte', color: 'bg-blue-500' },
  { id: 'sul', name: 'Santa Maria Sul', color: 'bg-emerald-500' },
  { id: 'central', name: 'Santa Maria Central', color: 'bg-amber-500' },
  { id: 'santos-dumont', name: 'Santos Dumont', color: 'bg-violet-500' },
  { id: 'total-ville', name: 'Total Ville', color: 'bg-pink-500' },
  { id: 'porto-rico', name: 'Condomínio Porto Rico', color: 'bg-cyan-500' },
  { id: 'polo-jk', name: 'Polo JK', color: 'bg-orange-500' },
];

interface DashboardSidebarProps {
  selectedRegion: string | null;
  onRegionSelect: (regionId: string) => void;
  selectedCategory?: LocationCategory | null;
  onCategorySelect?: (categoryId: LocationCategory | null) => void;
  markers?: Array<{ region: string; category: LocationCategory }>;
}

export function DashboardSidebar({
  selectedRegion,
  onRegionSelect,
  selectedCategory,
  onCategorySelect,
  markers = []
}: DashboardSidebarProps) {
  // Calcular contagens por região
  const regionCounts = regions.map(region => ({
    ...region,
    count: markers.filter(m => m.region === region.id).length,
  }));

  // Calcular contagens por categoria
  const categoryCounts = CATEGORIES.map(category => ({
    ...category,
    count: markers.filter(m => m.category === category.id).length,
  }));

  const totalCount = markers.length;
  return (
    <div className="h-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex flex-col relative">
      {/* Header */}
      <div className="relative p-6 pb-5 border-b border-white/10">
        {/* Logo GeoParques com efeito flutuante */}
        <div className="flex justify-center mb-4">
          <div className="relative group w-full max-w-[200px]">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-purple-500/20 blur-2xl rounded-3xl scale-110 group-hover:scale-115 transition-transform duration-500" />

            {/* Container da logo */}
            <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl p-5 rounded-3xl shadow-2xl shadow-black/50 ring-1 ring-teal-400/30 border border-white/10 hover:ring-teal-400/50 hover:shadow-teal-900/30 transition-all duration-300 hover:scale-105">
              <img
                src={logoGeoParques}
                alt="GeoParques SM"
                className="w-full h-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Subtítulo */}
        <div className="text-center space-y-1">
          <p className="text-xs text-slate-300 font-bold tracking-wide uppercase">Sistema de Gestão Urbana</p>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
            <p className="text-xs text-teal-400 font-semibold">Santa Maria-DF</p>
            <div className="h-px w-8 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 p-4 overflow-y-auto">
        <div className="mb-4">
          <div className="flex items-center justify-between px-3 mb-3">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Regiões Cadastradas
            </h2>
            {selectedRegion && (
              <div className="size-2 rounded-full bg-teal-400 animate-pulse shadow-lg shadow-teal-400/50" />
            )}
          </div>
          <div className="space-y-1.5">
            {regionCounts.map((region) => (
              <button
                key={region.id}
                onClick={() => onRegionSelect(region.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg transition-all duration-200 ${
                  selectedRegion === region.id
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xl shadow-teal-900/50 scale-[1.02]'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:shadow-lg'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-2.5 rounded-full ${region.color} shadow-lg ${selectedRegion === region.id ? 'ring-2 ring-white/80' : 'ring-1 ring-white/20'}`} />
                  <span className="text-sm font-semibold">{region.name}</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs font-bold border-0 ${
                    selectedRegion === region.id
                      ? 'bg-white/90 text-teal-700'
                      : 'bg-slate-700/50 text-slate-300'
                  }`}
                >
                  {region.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        {onCategorySelect && (
          <div className="mt-6">
            <div className="flex items-center justify-between px-3 mb-3">
              <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Filtrar por Tipo
              </h2>
              {selectedCategory && (
                <div className="size-2 rounded-full bg-purple-400 animate-pulse shadow-lg shadow-purple-400/50" />
              )}
            </div>
            <div className="space-y-1.5">
              {categoryCounts.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategorySelect(selectedCategory === category.id ? null : category.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-900/50 scale-[1.02]'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm font-semibold">{category.label}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs font-bold border-0 ${
                      selectedCategory === category.id
                        ? 'bg-white/90 text-purple-700'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    {category.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clear Filters Button */}
        {(selectedRegion || selectedCategory) && (
          <div className="mt-4">
            <button
              onClick={() => {
                onRegionSelect('');
                if (onCategorySelect) onCategorySelect(null);
              }}
              className="w-full px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 rounded-lg border border-red-500/30 transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <span>✕</span>
              <span>Limpar Filtros</span>
            </button>
          </div>
        )}

        {/* Stats Card */}
        <div className="mt-6 relative group">
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 blur-xl rounded-2xl group-hover:blur-2xl transition-all duration-300" />

          <div className="relative p-5 bg-gradient-to-br from-teal-600/20 via-emerald-600/20 to-teal-600/20 backdrop-blur-md rounded-2xl border border-teal-500/30 shadow-2xl ring-1 ring-teal-400/20 hover:ring-teal-400/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-teal-300 font-bold uppercase tracking-wider">
                Total de Locais
              </div>
              <div className="size-2 rounded-full bg-teal-400 animate-pulse shadow-lg shadow-teal-400/50" />
            </div>
            <div className="text-5xl font-black text-white mb-1 bg-gradient-to-br from-white to-teal-100 bg-clip-text text-transparent">
              {totalCount}
            </div>
            <div className="text-xs text-slate-400 mb-3 font-medium">
              {totalCount === 0 ? 'Nenhum ponto mapeado' : totalCount === 1 ? 'Ponto mapeado' : 'Pontos mapeados'}
            </div>
            <div className="relative h-2 bg-slate-800/50 rounded-full overflow-hidden ring-1 ring-slate-700/50">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 blur-sm" />
              <div className="relative h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 rounded-full shadow-lg shadow-teal-500/50 animate-pulse" style={{
                width: totalCount > 0 ? `${Math.min((totalCount / 100) * 100, 100)}%` : '0%',
                animationDuration: '3s'
              }} />
            </div>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="relative p-4 border-t border-white/5 bg-black/20">
        <div className="text-xs text-slate-500">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>
    </div>
  );
}
