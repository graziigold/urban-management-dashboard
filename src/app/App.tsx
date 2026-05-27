import { useState, useEffect, useMemo } from 'react';
import { Edit, Menu, X, MapPin, Save, Camera, Trash2, Loader2 } from 'lucide-react';
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

// Buscamos as chaves direto do seu arquivo de configuração que está funcionando
import { SUPABASE_URL, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '@supabase/supabase-js';

// Inicializamos a constante supabase aqui dentro de forma independente!
const supabase = createClient(SUPABASE_URL, publicAnonKey);

// Converter Location (backend) para MapMarker (frontend) 
function locationToMarker(location: Location): MapMarker {
  return {
    id: location.id,
    lat: location.latitude,
    lng: location.longitude,
    status: location.status,
    title: location.title,
    region: location.region,
    category: location.category,
  };
}

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | null>(null);
  const [mapEditMode, setMapEditMode] = useState(false);
  const [newMarkerCoords, setNewMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'mock'>('checking');
  const [locations, setLocations] = useState<Location[]>([]);

  // Estados novos: Controle do upload de fotos e texto da barra de pesquisa
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── FILTRO DA BUSCA + MAPMARKERS REAL-TIME ──
  const markers = useMemo(() => {
    return locations
      .filter(location => 
        location.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (location.address && location.address.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map(locationToMarker);
  }, [locations, searchQuery]);

  const [formCategory, setFormCategory] = useState<LocationCategory>('outro');
  const [formStatus, setFormStatus] = useState<'critical' | 'warning' | 'success'>('success');
  const [formRegion, setFormRegion] = useState<string>('central');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

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

  const handleMarkerClick = (marker: MapMarker) => {
    const location = locations.find((l) => l.id === marker.id);
    if (location) {
      setEditingLocation(location);
      setFormCategory(location.category);
      setFormStatus(location.status);
      setFormRegion(location.region);
      setUploadedImages(location.images || []);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setNewMarkerCoords({ lat, lng });
    setUploadedImages([]); 
    setFormCategory('outro');
    setFormStatus('success');
    setFormRegion('central');
  };

  // ── SNAP-UPLOAD PARA O STORAGE (UTILIZANDO INSTÂNCIA EXISTENTE DA API) ──
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
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('fotos-locais')
          .getPublicUrl(fileName);

        newUrls.push(publicUrlData.publicUrl);
      }

      setUploadedImages(prev => [...prev, ...newUrls]);
    } catch (error: any) {
      console.error('Erro no upload para o Storage:', error);
      alert('Erro ao subir imagens para o servidor: ' + error.message);
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
        images: uploadedImages,
      });

      setLocations(prev => [...prev, newLocation]);
      setNewMarkerCoords(null);
      setMapEditMode(false);
      setUploadedImages([]);
      setFormCategory('outro');
      setFormStatus('success');
      setFormRegion('central');
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
        images: uploadedImages,
      });

      setLocations(prev => prev.map(l => l.id === updatedLocation.id ? updatedLocation : l));
      setEditingLocation(null);
      setUploadedImages([]);
      setFormCategory('outro');
      setFormStatus('success');
      setFormRegion('central');
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
    } catch (error) {
      console.error('Erro ao deletar local:', error);
      alert('Erro ao deletar o local. Tente novamente.');
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
        </div>

        {/* Container do Mapa com Barra de Pesquisa */}
        <div className="flex-1 min-h-[50vh] lg:min-h-0 rounded-xl md:rounded-2xl overflow-hidden shadow-xl mt-16 md:mt-0 relative flex flex-col">
          
          {/* 🔍 BARRA DE PESQUISA FLUTUANTE REAL-TIME */}
          <div className="absolute top-4 left-4 z-20 w-72 md:w-80 max-w-[calc(100%-2rem)]">
            <div className="relative shadow-md rounded-lg overflow-hidden border border-slate-200/80 bg-white/90 backdrop-blur-sm">
              <Input
                type="text"
                placeholder="🔍 Pesquisar por nome ou endereço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none pl-4 pr-10 py-2 text-sm focus-visible:ring-0 placeholder:text-slate-400 font-medium text-slate-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
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
            editMode={mapEditMode}
            onAddMarker={handleMapClick}
          />
        </div>
      </div>

      {/* New Marker Dialog */}
      <Dialog open={!!newMarkerCoords} onOpenChange={(open) => {
        if (!open) {
          setNewMarkerCoords(null);
          setMapEditMode(false);
          setUploadedImages([]);
          setFormCategory('outro');
          setFormStatus('success');
          setFormRegion('central');
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
                      <span className="flex items-center gap-2"><span>{cat.icon}</span><span>{cat.label}</span></span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* Upload de Fotos */}
            <div className="space-y-2">
              <Label>Fotos da Vistoria</Label>
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={img} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg border-2" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label
                htmlFor="images"
                className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isUploadingImage ? 'bg-slate-50 border-slate-300 pointer-events-none' : 'hover:border-teal-500 hover:bg-teal-50'
                }`}
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="size-5 text-teal-600 animate-spin" />
                    <span className="text-sm text-teal-600 font-medium">Subindo foto para o servidor...</span>
                  </>
                ) : (
                  <>
                    <Camera className="size-5 text-slate-500" />
                    <span className="text-sm text-slate-600 font-medium">
                      {uploadedImages.length > 0 ? `${uploadedImages.length} foto(s) - Adicionar mais` : 'Adicionar fotos da vistoria'}
                    </span>
                  </>
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

      {/* Edit Marker Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => { if (!open) setEditingLocation(null); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="size-5 text-teal-600" /> Editar Local</DialogTitle>
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
                  {CATEGORIES.map((cat) => (<SelectItem key={cat.id} value={cat.id}><span className="flex items-center gap-2"><span>{cat.icon}</span><span>{cat.label}</span></span></SelectItem>))}
                </SelectContent>
              </Select>
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

            {/* Upload de Fotos na Edição */}
            <div className="space-y-2">
              <Label>Fotos da Vistoria</Label>
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={img} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg border-2" />
                      <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="size-3" /></button>
                    </div>
                  ))}
                </div>
              )}

              <label
                htmlFor="edit-images"
                className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isUploadingImage ? 'bg-slate-50 border-slate-300 pointer-events-none' : 'hover:border-teal-500 hover:bg-teal-50'
                }`}
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="size-5 text-teal-600 animate-spin" />
                    <span className="text-sm text-teal-600 font-medium">Subindo foto para o servidor...</span>
                  </>
                ) : (
                  <>
                    <Camera className="size-5 text-slate-500" />
                    <span className="text-sm text-slate-600 font-medium">
                      {uploadedImages.length > 0 ? `${uploadedImages.length} foto(s) - Adicionar mais` : 'Adicionar fotos da vistoria'}
                    </span>
                  </>
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
