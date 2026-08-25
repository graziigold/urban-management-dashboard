import { MapboxMap } from './mapbox-map';
import type { LocationCategory } from '../../utils/api/locations';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  status: 'critical' | 'warning' | 'success';
  title: string;
  region: string;
  category: LocationCategory;
}

interface MapViewProps {
  markers: MapMarker[];
  onMarkerClick: (marker: MapMarker) => void;
  selectedRegion: string | null;
  selectedCategory?: LocationCategory | null;
  editMode?: boolean;
  onAddMarker?: (lat: number, lng: number) => void;
  allLocations?: any[];
}

// 🛡️ Validador blindado para unificar IDs e nomes das regiões sem divergência
function matchesRegion(itemRegion: string, targetRegion: string | null): boolean {
  if (!targetRegion) return true;
  if (!itemRegion) return false;
  
  const cleanItem = String(itemRegion).toLowerCase().trim();
  const cleanTarget = String(targetRegion).toLowerCase().trim();

  const regionSynonyms: Record<string, string[]> = {
    norte: ['norte', 'santa maria norte'],
    sul: ['sul', 'santa maria sul'],
    central: ['central', 'santa maria central'],
    'santos-dumont': ['santos-dumont', 'santos dumont'],
    'total-ville': ['total-ville', 'total ville'],
    'porto-rico': ['porto-rico', 'condomínio porto rico', 'condominio porto rico', 'porto rico'],
    'polo-jk': ['polo-jk', 'polo jk']
  };

  const acceptedValues = regionSynonyms[cleanTarget] || [cleanTarget];
  return acceptedValues.includes(cleanItem);
}

export function MapView({
  markers,
  onMarkerClick,
  selectedRegion,
  selectedCategory,
  editMode = false,
  onAddMarker,
  allLocations = []
}: MapViewProps) {
  // Filtrar marcadores usando o validador unificado
  let filteredMarkers = markers;

  if (selectedRegion) {
    filteredMarkers = filteredMarkers.filter((m) => matchesRegion(m.region, selectedRegion));
  }

  if (selectedCategory) {
    filteredMarkers = filteredMarkers.filter((m) => m.category === selectedCategory);
  }

  // Contagem exata sincronizada com a base bruta (bate exato com o sidebar)
  const exactRegionCount = selectedRegion 
    ? (allLocations.length > 0 
        ? allLocations.filter(l => l && matchesRegion(l.region, selectedRegion)).length 
        : filteredMarkers.length)
    : filteredMarkers.length;

  return (
    <div className="relative h-full bg-gray-100 overflow-hidden">
      {/* Mapbox Map */}
      <div className="absolute inset-0">
        <MapboxMap
          markers={filteredMarkers}
          onMarkerClick={onMarkerClick}
          selectedRegion={selectedRegion}
          editMode={editMode}
          onAddMarker={onAddMarker}
        />
      </div>

      {/* Region Label com Contagem Sincronizada */}
      {selectedRegion && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-3 rounded-full shadow-2xl border-2 border-teal-400/50 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500 ring-2 ring-teal-500/30">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-teal-400 animate-pulse shadow-lg shadow-teal-400/50" />
            <span className="font-bold text-sm">
              {selectedRegion === 'norte' && 'Santa Maria Norte'}
              {selectedRegion === 'sul' && 'Santa Maria Sul'}
              {selectedRegion === 'central' && 'Santa Maria Central'}
              {selectedRegion === 'santos-dumont' && 'Santos Dumont'}
              {selectedRegion === 'total-ville' && 'Total Ville'}
              {selectedRegion === 'porto-rico' && 'Condomínio Porto Rico'}
              {selectedRegion === 'polo-jk' && 'Polo JK'}
            </span>
            <span className="text-xs opacity-70">
              ({exactRegionCount} {exactRegionCount === 1 ? 'local' : 'locais'})
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-20 left-4 z-10 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl p-4 border-2 border-teal-500/30 ring-1 ring-teal-400/20">
        <div className="text-xs font-bold mb-3 text-teal-400 uppercase tracking-wide">Status dos Pontos</div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="size-3.5 rounded-full bg-red-500 shadow-md shadow-red-500/30 ring-2 ring-red-400/20" />
            <span className="text-sm text-slate-200 font-semibold">Crítico</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-3.5 rounded-full bg-yellow-500 shadow-md shadow-yellow-500/30 ring-2 ring-yellow-400/20" />
            <span className="text-sm text-slate-200 font-semibold">Atenção</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-3.5 rounded-full bg-green-500 shadow-md shadow-green-500/30 ring-2 ring-green-400/20" />
            <span className="text-sm text-slate-200 font-semibold">Normal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
