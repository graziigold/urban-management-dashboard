import { useState, useEffect, useMemo } from 'react';
import { Menu, X, Search } from 'lucide-react';
import { DashboardSidebar } from './components/dashboard-sidebar';
import { MapView, MapMarker } from './components/map-view';
import { ExportMenu } from './components/export-menu';
import { Button } from './components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import { getAllLocations, type Location, type LocationCategory } from '../utils/api/locations';
import { CATEGORIES } from './utils/categories';
import { GaleriaVistoria } from './components/GaleriaVistoria';

// ── CONFIGURAÇÃO AUTENTICADA E SINCRONIZADA DO GEOPARQUES SM ──
const SUPABASE_PROJECT_ID = "kqrmsxhmbjzwjnxhfnap";
const ANON_KEY = "sb_publishable_DQm7g2O-m4BohGzHD3npfQ_NJd6SBxj";

// Converter Location (backend) para MapMarker (frontend) - BLINDADO
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
  const [searchQuery, setSearchQuery] = useState('');

  // Estado para apenas VISUALIZAR os detalhes do pino (sem permissão de alteração)
  const [viewingLocation, setViewingLocation] = useState<Location | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [formCategory, setFormCategory] = useState<LocationCategory>('outro');
  const [formStatus, setFormStatus] = useState<'critical' | 'warning' | 'success'>('success');
  const [formRegion, setFormRegion] = useState<string>('central');

  // ── FILTRO DA BUSCA COMPLETAMENTE BLINDADO CONTRA TELA BRANCA (COM COORDENADAS) ──
  const markers = useMemo(() => {
    if (!locations || !Array.isArray(locations)) return [];

    return locations
      .filter(location => {
        if (!location || !location.id) return false;

        const titleMatch = location.title 
          ? location.title.toLowerCase().includes(searchQuery.toLowerCase()) 
          : false;

        const addressMatch = location.address 
          ? location.address.toLowerCase().includes(searchQuery.toLowerCase()) 
          : false;

        const latMatch = location.latitude !== undefined && location.latitude !== null 
          ? location.latitude.toString().includes(searchQuery) 
          : false;

        const lngMatch = location.longitude !== undefined && location.longitude !== null 
          ? location.longitude.toString().includes(searchQuery) 
          : false;

        return titleMatch || addressMatch || latMatch || lngMatch;
      })
      .map(locationToMarker)
      .filter(marker => marker.id !== 'erro');
  }, [locations, searchQuery]);

  useEffect(() => {
    console.log('🚀 App montado - carregando locais...');
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

  // Ao clicar no pino, apenas abre os dados para leitura e visualização da galeria
  const handleMarkerClick = (marker: MapMarker) => {
    const location = locations.find((l) => l.id === marker.id);
    if (location) {
      setViewingLocation(location);
      setFormCategory(location.category);
      setFormStatus(location.status);
      setFormRegion(location.region);
      setUploadedImages(location.images || []);
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

        {/* Menu Superior Direito (Apenas Exportação - Botão de Adicionar Pins Removido) */}
        <div className="absolute top-6 right-6 z-20 flex gap-2 md:gap-3" style={{ marginTop: dbStatus === 'mock' ? '40px' : '0' }}>
          <div className="hidden md:block">
            <ExportMenu markers={markers} siteData={locations} selectedRegion={selectedRegion} />
          </div>
        </div>

        {/* Container do Mapa com Barra de Pesquisa */}
        <div className="flex-1 min-h-[50vh] lg:min-h-0 rounded-xl md:rounded-2xl overflow-hidden shadow-xl mt-16 md:mt-0 relative flex flex-col">
          
          {/* 🔍 BARRA DE PESQUISA FLUTUANTE */}
          <div className="absolute top-4 left-4 z-20 w-72 md:w-85 max-w-[calc(100%-2rem)]">
            <div className="relative shadow-xl rounded-xl overflow-hidden border border-slate-700/40 bg-slate-900/85 backdrop-blur-md transition-all duration-300 focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/30">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="size-4 text-slate-400 transition-colors duration-200" />
              </span>
              <Input
                type="text"
                placeholder="Pesquisar por nome, endereço ou coord..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none pl-10 pr-10 py-2.5 text-sm focus-visible:ring-0 placeholder:text-slate-400 font-medium text-slate-100 h-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-full transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          <MapView
            markers={markers}
            onMarkerClick={handleMarkerClick}
            selectedRegion={selectedRegion}
            selectedCategory={selectedCategory}
            editMode={false} // Sempre false para desativar criação de pins por clique no mapa
          />
        </div>
      </div>

      {/* Modal de Visualização do Local (Somente Leitura) */}
      <Dialog open={!!viewingLocation} onOpenChange={(open) => { if (!open) setViewingLocation(null); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              📍 Detalhes do Local
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

            {/* Galeria de Fotos em modo leitura (sem botão de lixeira) */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Fotos da Vistoria</Label>
              {uploadedImages.length > 0 ? (
                <div className="bg-slate-50 p-3 rounded-xl border">
                  <GaleriaVistoria 
                    images={uploadedImages} 
                    onRemoveImage={() => {}} // Função vazia para desabilitar exclusão de fotos no modo público
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
