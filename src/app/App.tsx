import { useState, useEffect, useMemo } from 'react';
import { Edit, Menu, X, MapPin, Save, Camera, Trash2, Loader2, Search, LogOut, Navigation } from 'lucide-react';
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
import { getAllLocations, createLocation, updateLocation, deleteLocation, type Location, type LocationCategory } from '../utils/api/locations';
import { CATEGORIES } from '../utils/categories';
import { GaleriaVistoria } from './components/GaleriaVistoria';
import { Login } from './components/Login';

const SUPABASE_PROJECT_ID = "kqrmsxhmbjzwjnxhfnap";
const ANON_KEY = "sb_publishable_DQm7g2O-m4BohGzHD3npfQ_NJd6SBxj";

const supabase = {
  storage: {
    from: (bucketName: string) => ({
      upload: async (fileName: string, file: File) => {
        try {
          const response = await fetch(
            `https://${SUPABASE_PROJECT_ID}.storage.supabase.co/storage/v1/object/${bucketName}/${fileName}`,
            {
              method: 'POST',
              headers: {
                'ApiKey': ANON_KEY,
                'Authorization': `Bearer ${ANON_KEY}`
              },
              body: file
            }
          );
          if (!response.ok) return { data: null, error: await response.json() };
          return { data: await response.json(), error: null };
        } catch (err) {
          return { data: null, error: err };
        }
      },
      getPublicUrl: (fileName: string) => ({
        data: { publicUrl: `https://${SUPABASE_PROJECT_ID}.storage.supabase.co/storage/v1/object/public/${bucketName}/${fileName}` }
      })
    })
  }
};

// Parser de coordenadas (latitude e longitude juntas)
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
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | null>(null);
  const [mapEditMode, setMapEditMode] = useState(false);
  const [newMarkerCoords, setNewMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'mock'>('checking');
  const [locations, setLocations] = useState<Location[]>([]);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetLocation, setTargetLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [formCategory, setFormCategory] = useState<LocationCategory>('outro');
  const [formStatus, setFormStatus] = useState<'critical' | 'warning' | 'success'>('success');
  const [formRegion, setFormRegion] = useState<string>('central');
  const [formIsUrgent, setFormIsUrgent] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('geoparques_token');
    const user = localStorage.getItem('geoparques_user');
    if (token) {
      setAuthToken(token);
      setCurrentUser(user);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('geoparques_token');
    localStorage.removeItem('geoparques_user');
    setAuthToken(null);
    setCurrentUser(null);
  };

  const parsedCoords = useMemo(() => parseCoordinates(searchQuery), [searchQuery]);

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
    if (authToken) {
      loadLocations();
    }
  }, [authToken]);

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
      setEditingLocation(location);
      setFormCategory(location.category);
      setFormStatus(location.status);
      setFormRegion(location.region);
      setFormIsUrgent(location.isUrgent || false);
      setUploadedImages(location.images || []);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setNewMarkerCoords({ lat, lng });
    setUploadedImages([]); 
    setFormCategory('outro');
    setFormStatus('success');
    setFormRegion('central');
    setFormIsUrgent(false);
  };

  const handleSelectSearchResult = (lat: number, lng: number, markerToOpen?: Location) => {
    setTargetLocation({ lat, lng });
    setIsSearchFocused(false);
    if (markerToOpen) {
      handleMarkerClick(locationToMarker(markerToOpen));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingImage(true);
      const newUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('fotos-locais')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('fotos-locais')
          .getPublicUrl(fileName);

        newUrls.push(publicUrlData.publicUrl);
      }

      setUploadedImages(prev => [...prev, ...newUrls]);
    } catch (error: any) {
      console.error('Erro no upload:', error);
      alert('Não foi possível salvar a imagem no servidor. O formulário ainda pode ser salvo normalmente.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveNewMarker = async (formData: {
    title: string;
    description: string;
    address: string;
    seiProcess: string;
    status: 'critical' | 'warning' | 'success';
    region: string;
    category: LocationCategory;
  }) => {
    if (!newMarkerCoords) return;

    try {
      const newLocation = await createLocation({
        title: formData.title,
        latitude: newMarkerCoords.lat,
        longitude: newMarkerCoords.lng,
        status: formData.status,
        region: formData.region,
        category: formData.category,
        description: formData.description,
        address: formData.address,
        seiProcess: formData.seiProcess,
        isUrgent: formIsUrgent,
        updatedBy: currentUser || 'Administrador',
        images: uploadedImages,
      });

      setLocations(prev => [...prev, newLocation]);
      setNewMarkerCoords(null);
      setMapEditMode(false);
      setUploadedImages([]);
      setFormCategory('outro');
      setFormStatus('success');
      setFormRegion('central');
      setFormIsUrgent(false);
    } catch (error) {
      console.error('Erro ao salvar local:', error);
      alert('Erro ao salvar o local. Tente novamente.');
    }
  };

  const handleUpdateMarker = async (formData: {
    title: string;
    description: string;
    address: string;
    seiProcess: string;
  }) => {
    if (!editingLocation) return;

    try {
      const updatedLocation = await updateLocation(editingLocation.id, {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        seiProcess: formData.seiProcess,
        status: formStatus,
        region: formRegion,
        category: formCategory,
        isUrgent: formIsUrgent,
        updatedBy: currentUser || 'Administrador',
        images: uploadedImages,
      });

      setLocations(prev => prev.map(l => l.id === updatedLocation.id ? updatedLocation : l));
      setEditingLocation(null);
      setUploadedImages([]);
      setFormCategory('outro');
      setFormStatus('success');
      setFormRegion('central');
      setFormIsUrgent(false);
    } catch (error) {
      console.error('Erro ao atualizar local:', error);
      alert('Erro ao atualizar o local. Tente novamente.');
    }
  };

  const handleDeleteMarker = async () => {
    if (!editingLocation) return;

    if (!confirm(`Tem certeza que deseja deletar o local "${editingLocation.title}"?`)) {
      return;
    }

    try {
      await deleteLocation(editingLocation.id);
      setLocations(prev => prev.filter(l => l.id !== editingLocation.id));
      setEditingLocation(null);
      setUploadedImages([]);
      setFormCategory('outro');
      setFormStatus('success');
      setFormRegion('central');
      setFormIsUrgent(false);
    } catch (error) {
      console.error('Erro ao deletar local:', error);
      alert('Erro ao deletar o local. Tente novamente.');
    }
  };

  if (!authToken) {
    return <Login onLoginSuccess={(token, user) => { setAuthToken(token); setCurrentUser(user); }} />;
  }

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

        {/* Menu Superior Direito */}
        <div className="absolute top-6 right-6 z-20 flex gap-2 md:gap-3" style={{ marginTop: dbStatus === 'mock' ? '40px' : '0' }}>
          <div className="hidden md:block">
            <ExportMenu markers={markers} siteData={locations} selectedRegion={selectedRegion} />
          </div>

          <Button
            onClick={() => setMapEditMode(!mapEditMode)}
            className={`${
              mapEditMode
                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
                : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700'
            } text-white transition-all shadow-lg`}
            size="lg"
          >
            {mapEditMode ? <X className="size-4 md:mr-2" /> : <MapPin className="size-4 md:mr-2" />}
            <span className="hidden md:inline">{mapEditMode ? 'Cancelar' : 'Adicionar Pins'}</span>
          </Button>

          <Button
            onClick={handleLogout}
            variant="outline"
            title={`Logado como: ${currentUser || 'Usuário'}`}
            className="bg-slate-900/95 backdrop-blur-md text-slate-300 hover:text-white border-2 border-slate-700 hover:border-red-500/50 hover:bg-red-950/20 transition-all shadow-lg"
            size="icon"
          >
            <LogOut className="size-4 text-red-400" />
          </Button>
        </div>

        {/* Container do Mapa com Barra de Pesquisa */}
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

              {/* Lista Suspensa com Resultados e Atalho de Coordenadas */}
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
            editMode={mapEditMode}
            onAddMarker={handleMapClick}
            allLocations={locations}
            targetLocation={targetLocation}
          />
        </div>
      </div>

      {/* MODAL CADASTRAR NOVO */}
      <Dialog open={!!newMarkerCoords} onOpenChange={(open) => {
        if (!open) {
          setNewMarkerCoords(null);
          setMapEditMode(false);
          setUploadedImages([]);
          setFormCategory('outro');
          setFormStatus('success');
          setFormRegion('central');
          setFormIsUrgent(false);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-teal-600" /> Adicionar Novo Local
            </DialogTitle>
            <DialogDescription>
              Coordenadas: {newMarkerCoords?.lat.toFixed(6)}, {newMarkerCoords?.lng.toFixed(6)}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveNewMarker({
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                address: formData.get('address') as string,
                seiProcess: formData.get('seiProcess') as string,
                status: formStatus,
                region: formRegion,
                category: formCategory,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" name="title" placeholder="Ex: Parquinho Central" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Tipo de Equipamento *</Label>
              <Select value={formCategory} onValueChange={(value) => setFormCategory(value as LocationCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span className="text-base">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 p-3 bg-red-50/50 border border-red-200 rounded-lg mt-2">
              <input type="checkbox" id="isUrgent" checked={formIsUrgent} onChange={(e) => setFormIsUrgent(e.target.checked)} className="size-4 rounded border-red-300 text-red-600 focus:ring-red-600" />
              <Label htmlFor="isUrgent" className="text-red-700 font-bold cursor-pointer m-0">🚨 Marcar como Demanda Urgente</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={formStatus} onValueChange={(value) => setFormStatus(value as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">✅ Normal</SelectItem>
                    <SelectItem value="warning">⚠️ Atenção</SelectItem>
                    <SelectItem value="critical">🚨 Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Região *</Label>
                <Select value={formRegion} onValueChange={setFormRegion}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="norte">Santa Maria Norte</SelectItem>
                    <SelectItem value="sul">Santa Maria Sul</SelectItem>
                    <SelectItem value="central">Santa Maria Central</SelectItem>
                    <SelectItem value="santos-dumont">Santos Dumont</SelectItem>
                    <SelectItem value="total-ville">Total Ville</SelectItem>
                    <SelectItem value="porto-rico">Porto Rico</SelectItem>
                    <SelectItem value="polo-jk">Polo JK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" name="address" placeholder="Ex: Quadra 10, Lote 5" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seiProcess">Processo SEI</Label>
              <Input id="seiProcess" name="seiProcess" placeholder="Ex: 00123.456789/2026-01" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" placeholder="Descreva o local..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Fotos da Vistoria</Label>
              {uploadedImages.length > 0 && (
                <div className="mb-3">
                  <GaleriaVistoria images={uploadedImages} onRemoveImage={handleRemoveImage} />
                </div>
              )}
              <label htmlFor="images" className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isUploadingImage ? 'bg-slate-50 border-slate-300 pointer-events-none' : 'hover:border-teal-500 hover:bg-teal-50'}`}>
                {isUploadingImage ? (
                  <><Loader2 className="size-5 text-teal-600 animate-spin" /><span className="text-sm text-teal-600 font-medium">Subindo foto...</span></>
                ) : (
                  <><Camera className="size-5 text-slate-500" /><span className="text-sm text-slate-600 font-medium">{uploadedImages.length > 0 ? `${uploadedImages.length} foto(s) - Adicionar mais` : 'Adicionar fotos da vistoria'}</span></>
                )}
              </label>
              <input id="images" type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={isUploadingImage} />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setNewMarkerCoords(null)} disabled={isUploadingImage}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white" disabled={isUploadingImage}>
                <Save className="size-4 mr-2" /> Salvar Local
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR LOCAL */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => { if (!open) setEditingLocation(null); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="size-5 text-teal-600" /> Editar Local</DialogTitle>
            <DialogDescription className="sr-only">Atualize as informações deste local.</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateMarker({
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                address: formData.get('address') as string,
                seiProcess: formData.get('seiProcess') as string,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título *</Label>
              <Input id="edit-title" name="title" defaultValue={editingLocation?.title} required />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Equipamento *</Label>
              <Select value={formCategory} onValueChange={(value) => setFormCategory(value as LocationCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span className="text-base">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 p-3 bg-red-50/50 border border-red-200 rounded-lg mt-2">
              <input type="checkbox" id="edit-isUrgent" checked={formIsUrgent} onChange={(e) => setFormIsUrgent(e.target.checked)} className="size-4 rounded border-red-300 text-red-600 focus:ring-red-600" />
              <Label htmlFor="edit-isUrgent" className="text-red-700 font-bold cursor-pointer m-0">🚨 Marcar como Demanda Urgente</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={formStatus} onValueChange={(value) => setFormStatus(value as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">✅ Normal</SelectItem>
                    <SelectItem value="warning">⚠️ Atenção</SelectItem>
                    <SelectItem value="critical">🚨 Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Região *</Label>
                <Select value={formRegion} onValueChange={setFormRegion}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="norte">Santa Maria Norte</SelectItem>
                    <SelectItem value="sul">Santa Maria Sul</SelectItem>
                    <SelectItem value="central">Santa Maria Central</SelectItem>
                    <SelectItem value="santos-dumont">Santos Dumont</SelectItem>
                    <SelectItem value="total-ville">Total Ville</SelectItem>
                    <SelectItem value="porto-rico">Porto Rico</SelectItem>
                    <SelectItem value="polo-jk">Polo JK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Endereço</Label>
              <Input id="edit-address" name="address" defaultValue={editingLocation?.address} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-seiProcess">Processo SEI</Label>
              <Input id="edit-seiProcess" name="seiProcess" defaultValue={editingLocation?.seiProcess} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea id="edit-description" name="description" defaultValue={editingLocation?.description} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Fotos da Vistoria</Label>
              {uploadedImages.length > 0 && (
                <div className="mb-3">
                  <GaleriaVistoria images={uploadedImages} onRemoveImage={handleRemoveImage} />
                </div>
              )}
              <label htmlFor="edit-images" className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isUploadingImage ? 'bg-slate-50 border-slate-300 pointer-events-none' : 'hover:border-teal-500 hover:bg-teal-50'}`}>
                {isUploadingImage ? (
                  <><Loader2 className="size-5 text-teal-600 animate-spin" /><span className="text-sm text-teal-600 font-medium">Subindo foto...</span></>
                ) : (
                  <><Camera className="size-5 text-slate-500" /><span className="text-sm text-slate-600 font-medium">{uploadedImages.length > 0 ? `${uploadedImages.length} foto(s) - Adicionar mais` : 'Adicionar fotos da vistoria'}</span></>
                )}
              </label>
              <input id="edit-images" type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={isUploadingImage} />
            </div>

            <div className="flex gap-2 justify-between pt-4">
              <Button type="button" variant="outline" onClick={handleDeleteMarker} className="border-red-300 text-red-600 hover:bg-red-50" disabled={isUploadingImage}><Trash2 className="size-4 mr-2" /> Deletar</Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingLocation(null)} disabled={isUploadingImage}>Cancelar</Button>
                <Button type="submit" className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white" disabled={isUploadingImage}><Save className="size-4 mr-2" /> Salvar Alterações</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
