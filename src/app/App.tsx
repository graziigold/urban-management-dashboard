import { useState, useEffect, useMemo } from 'react';
import { Menu, X, Search, Navigation, MapPin } from 'lucide-react';
import { DashboardSidebar } from './components/dashboard-sidebar';
import { MapView, MapMarker } from './components/map-view';
import { ExportMenu } from './components/export-menu';
import { Button } from './components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { getAllLocations, type Location, type LocationCategory } from '../utils/api/locations';
import { CATEGORIES } from '../utils/categories';
import { GaleriaVistoria } from './components/GaleriaVistoria';

// ── PARSER INTELIGENTE DE COORDENADAS (ACEITA VÍRGULA, ESPAÇO E PONTO-E-VÍRGULA) ──
function parseCoordinates(query: string): { lat: number; lng: number } | null {
  if (!query) return null;
  const clean = query.trim().replace(/;/g, ',');
  const parts = clean.split(/[,\s]+/).map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
  
  if (parts.length >= 2) {
    const [p1, p2] = parts;
    if (p1 >= -90 && p1 <= 90 && p2 >= -180 && p2 <= 180) {
      return { lat: p1, lng: p2 };
    }
    if (p2 >= -90 && p2 <= 90 && p1 >= -180 && p1 <= 180) {
      return { lat: p2, lng: p1 };
    }
  }
  return null;
}

// Converter Location (backend) para MapMarker (frontend)
function locationToMarker(location: Location): MapMarker {
  if (!location) {
    return { id: 'erro', lat: 0, lng: 0, status: 'success', title: 'Inválido', region: 'central', category: 'outro' };
  }
  return {
    id: location.id || String(Math.random()),
    lat: location.latitude || 0,
    lng: location.longitude || 0,
    status: location.status || 'success',
    title: location.title || 'Sem título',
    region: location.region || 'central',
    category: location.category || 'outro',
  };
}

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'mock'>('checking');
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Estados de Pesquisa e Navegação
  const [searchQuery, setSearchQuery] = useState('');
  const [targetLocation, setTargetLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Estado para apenas VISUALIZAR os detalhes do pino
  const [viewingLocation, setViewingLocation] = useState<Location | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<'critical' | 'warning' | 'success'>('success');

  const parsedCoords = useMemo(() => parseCoordinates(searchQuery), [searchQuery]);

  // Resultados dinâmicos da pesquisa para o dropdown
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !locations) return [];
    const q = searchQuery.toLowerCase().trim();
    
    return locations.filter(loc => {
      const titleMatch = loc.title?.toLowerCase().includes(q);
      const addressMatch = loc.address?.toLowerCase().includes(q);
      const seiMatch = loc.seiProcess?.toLowerCase().includes(q);
      const latMatch = loc.latitude !== undefined && loc.latitude !== null && loc.latitude.toString().includes(q);
      const lngMatch = loc.longitude !== undefined && loc.longitude !== null && loc.longitude.toString().includes(q);
      return titleMatch || addressMatch || seiMatch || latMatch || lngMatch;
    }).slice(0, 6);
  }, [locations, searchQuery]);

  const markers = useMemo(() => {
    if (!locations || !Array.isArray(locations)) return [];
    return locations.map(locationToMarker).filter(marker => marker.id !== 'erro');
  }, [locations]);

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    try {
      setIsLoading(true);
      setDbStatus('checking');
      const data = await getAllLocations();
      setLocations(data);
      setDbStatus('connected');
    } catch (error) {
      setDbStatus('mock');
      setLocations([]);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleMarkerClick = (marker: MapMarker) => {
    const location = locations.find((l) => l.id === marker.id);
    if (location) {
      setViewingLocation(location);
      setFormStatus(location.status);
      setUploadedImages(location.images || []);
    }
  };

  const handleSelectSearchResult = (lat: number, lng: number, markerToOpen?: Location) => {
    setTargetLocation({ lat, lng });
    setIsSearchFocused(false);
    if (markerToOpen) {
      handleMarkerClick(locationToMarker(markerToOpen));
    }
  };

  if (isLoading && markers.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 overflow-hidden">
        <div className="text-center">
          <div className="inline-block size-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Carregando GeoParques SM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-gray-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block w-80 shrink-0 z-10">
        <DashboardSidebar
          selectedRegion={selectedRegion}
          onRegionSelect={(region) => setSelectedRegion(region === selectedRegion ? null : region)}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          markers={markers}
        />
      </div>

      {/* Sidebar Mobile */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Selecione uma região ou tipo para visualizar os locais cadastrados
          </SheetDescription>
          <DashboardSidebar
            selectedRegion={selectedRegion}
            onRegionSelect={(region) => {
              setSelectedRegion(region === selectedRegion ? null : region);
              setIsMobileSidebarOpen(false);
            }}
            selectedCategory={selectedCategory}
            onCategorySelect={(category) => {
              setSelectedCategory(category);
              setIsMobileSidebarOpen(false);
            }}
            markers={markers}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-3 md:p-6 relative min-h-0">
        <Button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="lg:hidden absolute top-6 left-6 z-20 bg-slate-900 hover:bg-slate-800 text-white shadow-2xl"
          size="icon"
        >
          <Menu className="size-5" />
        </Button>

        {dbStatus === 'mock' && (
          <div className="absolute top-6 right-6 z-30 bg-yellow-500/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2">
            <div className="size-2 bg-slate-900 rounded-full animate-pulse" />
            Modo Offline
          </div>
        )}

        {/* Menu Superior Direito (Exportação) */}
        <div className="absolute top-6 right-6 z-20 flex gap-2 md:gap-3" style={{ marginTop: dbStatus === 'mock' ? '40px' : '0' }}>
          <div className="hidden md:block">
            <ExportMenu markers={markers} siteData={locations} selectedRegion={selectedRegion} />
          </div>
        </div>

        {/* Container do Mapa com Barra de Pesquisa e Dropdown de Coordenadas */}
        <div className="flex-1 min-h-[50vh] lg:min-h-0 rounded-xl md:rounded-2xl overflow-hidden shadow-xl mt-16 md:mt-0 relative flex flex-col">
          
          <div className="absolute top-4 left-4 z-30 w-80 md:w-96 max-w-[calc(100%-2rem)]">
            <div className="relative shadow-2xl rounded-2xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-xl transition-all duration-300 focus-within:border-teal-500/80 focus-within:ring-2 focus-within:ring-teal-500/30">
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-teal-400">
                  <Search className="size-4" />
                </span>
                <Input
                  type="text"
                  placeholder="Pesquisar nome, endereço ou colar Lat, Long..."
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (parsedCoords) {
                        handleSelectSearchResult(parsedCoords.lat, parsedCoords.lng);
                      } else if (searchResults.length > 0) {
                        handleSelectSearchResult(searchResults[0].latitude, searchResults[0].longitude, searchResults[0]);
                      }
                    }
                  }}
                  className="w-full bg-transparent border-none pl-10 pr-10 py-2.5 text-sm focus-visible:ring-0 placeholder:text-slate-400 font-medium text-slate-100 h-11"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setIsSearchFocused(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-full transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Lista Suspensa com Resultados e Atalho para Coordenada Exata */}
              {isSearchFocused && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/98 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-2xl z-40 max-h-72 overflow-y-auto">
                  {parsedCoords && (
                    <div
                      onClick={() => handleSelectSearchResult(parsedCoords.lat, parsedCoords.lng)}
                      className="p-3 border-b border-teal-500/20 bg-teal-950/40 hover:bg-teal-900/50 cursor-pointer transition-colors flex items-center gap-3"
                    >
                      <Navigation className="size-5 text-teal-400 shrink-0 animate-pulse" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-teal-300">Ir para coordenada exata</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Lat: {parsedCoords.lat.toFixed(6)}, Lng: {parsedCoords.lng.toFixed(6)}
                        </div>
                      </div>
                    </div>
                  )}

                  {searchResults.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => handleSelectSearchResult(loc.latitude, loc.longitude, loc)}
                      className="p-3 hover:bg-slate-800/80 cursor-pointer border-b border-slate-800/50 last:border-b-0 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-200 truncate">{loc.title}</div>
                        <div className="text-xs text-slate-400 truncate">{loc.address || 'Sem endereço detalhado'}</div>
                      </div>
                      <div className="text-[10px] uppercase font-bold text-teal-400 bg-teal-950/80 border border-teal-500/30 px-2 py-0.5 rounded-full shrink-0">
                        {loc.region}
                      </div>
                    </div>
                  ))}

                  {!parsedCoords && searchResults.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Nenhum local encontrado para "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <MapView
            markers={markers}
            onMarkerClick={handleMarkerClick}
            selectedRegion={selectedRegion}
            selectedCategory={selectedCategory}
            editMode={false}
            allLocations={locations}
            targetLocation={targetLocation}
          />
        </div>
      </div>

      {/* Modal de Visualização do Local (Somente Leitura) */}
      <Dialog open={!!viewingLocation} onOpenChange={(open) => { if (!open) setViewingLocation(null); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <MapPin className="size-5 text-teal-600" /> Detalhes do Local
            </DialogTitle>
            <DialogDescription>
              Informações e registro fotográfico da vistoria
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Título</Label>
              <div className="text-base font-bold text-slate-900 bg-slate-100 p-2.5 rounded-lg border">
                {viewingLocation?.title}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-semibold uppercase">Status</Label>
                <div className="text-sm font-medium bg-slate-100 p-2.5 rounded-lg border">
                  {formStatus === 'success' && '✅ Normal'}
                  {formStatus === 'warning' && '⚠️ Atenção'}
                  {formStatus === 'critical' && '🚨 Crítico'}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-semibold uppercase">Região</Label>
                <div className="text-sm font-medium bg-slate-100 p-2.5 rounded-lg border capitalize">
                  {viewingLocation?.region}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Endereço</Label>
              <div className="text-sm text-slate-800 bg-slate-100 p-2.5 rounded-lg border">
                {viewingLocation?.address || 'Não informado'}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Processo SEI</Label>
              <div className="text-sm text-slate-800 bg-slate-100 p-2.5 rounded-lg border font-mono">
                {viewingLocation?.seiProcess || 'Não informado'}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Descrição</Label>
              <div className="text-sm text-slate-800 bg-slate-100 p-2.5 rounded-lg border min-h-[70px] whitespace-pre-wrap">
                {viewingLocation?.description || 'Nenhuma descrição informada.'}
              </div>
            </div>

            {/* Galeria de Fotos em modo leitura */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Fotos da Vistoria</Label>
              {uploadedImages.length > 0 ? (
                <div className="bg-slate-50 p-3 rounded-xl border">
                  <GaleriaVistoria 
                    images={uploadedImages} 
                    onRemoveImage={() => {}} 
                  />
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl border text-center">
                  Nenhuma foto cadastrada para este local.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="button" onClick={() => setViewingLocation(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
