import { useState, useEffect, useMemo } from 'react';
import { Edit, Menu, X, MapPin, Save, Camera, Trash2 } from 'lucide-react';
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'mock'>('checking');

  // React recalcula os marcadores automaticamente quando 'locations' muda
  const markers = useMemo(() => locations.map(locationToMarker), [locations]);

  // Estados do formulário
  const [formCategory, setFormCategory] = useState<LocationCategory>('outro');
  const [formStatus, setFormStatus] = useState<'critical' | 'warning' | 'success'>('success');
  const [formRegion, setFormRegion] = useState<string>('central');

  // Estado para edição de marcador existente
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Carregar dados do Supabase ao iniciar
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

      if (data.length === 0) {
        console.log('✅ Supabase conectado! Banco vazio - pronto para adicionar locais reais');
      } else {
        console.log(`✅ ${data.length} locais carregados do Supabase`);
      }
    } catch (error) {
      setDbStatus('mock');
      setLocations([]);
      console.log('⚠️ Erro ao conectar - usando modo offline');
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

  // Handler para adicionar marcador no mapa
  const handleMapClick = (lat: number, lng: number) => {
    setNewMarkerCoords({ lat, lng });
    setUploadedImages([]); 
    setFormCategory('outro');
    setFormStatus('success');
    setFormRegion('central');
  };

  // Handler para upload de imagens
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imagePromises = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises)
      .then((base64Images) => {
        setUploadedImages(prev => [...prev, ...base64Images]);
      })
      .catch((error) => {
        console.error('Erro ao carregar imagens:', error);
        alert('Erro ao carregar imagens. Tente novamente.');
      })
      .finally(() => {
        e.target.value = ''; // Limpa o input para permitir subir a mesma imagem se o usuário excluir
      });
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Salvar novo marcador
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

      console.log(`✅ Local "${formData.title}" salvo com ${uploadedImages.length} foto(s)!`);
    } catch (error) {
      console.error('Erro ao salvar local:', error);
      alert('Erro ao salvar o local. Tente novamente.');
    }
  };

  // Atualizar marcador existente
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

      console.log(`✅ Local "${formData.title}" atualizado!`);
    } catch (error) {
      console.error('Erro ao atualizar local:', error);
      alert('Erro ao atualizar o local. Tente novamente.');
    }
  };

  // Deletar marcador
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

      console.log(`✅ Local "${editingLocation.title}" deletado!`);
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
        {/* Mobile Menu Button */}
        <Button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="lg:hidden absolute top-6 left-6 z-20 bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-900/50 border-2 border-teal-500/30 ring-1 ring-teal-400/20"
          size="icon"
        >
          <Menu className="size-5" />
        </Button>

        {/* Database Status Badge */}
        {dbStatus === 'mock' && (
          <div className="absolute top-6 right-6 z-30 bg-yellow-500/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 ring-1 ring-yellow-400/50">
            <div className="size-2 bg-slate-900 rounded-full animate-pulse" />
            Modo Offline
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-6 right-6 z-20 flex gap-2 md:gap-3" style={{ marginTop: dbStatus === 'mock' ? '40px' : '0' }}>
          <div className="hidden md:block">
            <ExportMenu
              markers={markers}
              siteData={locations}
              selectedRegion={selectedRegion}
            />
          </div>
          <Button
            onClick={() => setMapEditMode(!mapEditMode)}
            className={`${
              mapEditMode
                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
                : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700'
            } shadow-2xl shadow-teal-900/30 text-white ring-2 ring-teal-400/30 hover:ring-teal-400/50 transition-all`}
            size="lg"
          >
            {mapEditMode ? <X className="size-4 md:mr-2" /> : <MapPin className="size-4 md:mr-2" />}
            <span className="hidden md:inline">{mapEditMode ? 'Cancelar' : 'Adicionar Pins'}</span>
          </Button>
        </div>

        {/* Container do Mapa com ajuste responsivo */}
        <div className="flex-1 min-h-[50vh] lg:min-h-0 rounded-xl md:rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 mt-16 md:mt-0">
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
              <MapPin className="size-5 text-teal-600" />
              Adicionar Novo Local
            </DialogTitle>
            <DialogDescription>
              Coordenadas: {newMarkerCoords?.lat.toFixed(6)}, {newMarkerCoords?.lng.toFixed(6)}
            </DialogDescription>
          </DialogHeader>

          <form
            key="new-marker-form"
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
              <Input
                id="title"
                name="title"
                placeholder="Ex: Parquinho Central"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Tipo de Equipamento *</Label>
              <Select value={formCategory} onValueChange={(value) => setFormCategory(value as LocationCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formStatus} onValueChange={(value) => setFormStatus(value as 'critical' | 'warning' | 'success')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">✅ Normal</SelectItem>
                    <SelectItem value="warning">⚠️ Atenção</SelectItem>
                    <SelectItem value="critical">🚨 Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Região *</Label>
                <Select value={formRegion} onValueChange={(value) => setFormRegion(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
              <Input
                id="address"
                name="address"
                placeholder="Ex: Quadra 10, Lote 5, Santa Maria-DF"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seiProcess">Processo SEI</Label>
              <Input
                id="seiProcess"
                name="seiProcess"
                placeholder="Ex: 00123.456789/2026-01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descreva o local..."
                rows={3}
              />
            </div>

            {/* Upload de Fotos */}
            <div className="space-y-2">
              <Label>Fotos da Vistoria</Label>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-slate-200"
                      />
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
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-colors"
              >
                <Camera className="size-5 text-slate-500" />
                <span className="text-sm text-slate-600 font-medium">
                  {uploadedImages.length > 0
                    ? `${uploadedImages.length} foto(s) - Adicionar mais`
                    : 'Adicionar fotos da vistoria'}
                </span>
              </label>
              <input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-xs text-slate-500">
                Aceita múltiplas imagens (JPG, PNG, etc.)
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewMarkerCoords(null);
                  setMapEditMode(false);
                  setUploadedImages([]);
                  setFormCategory('outro');
                  setFormStatus('success');
                  setFormRegion('central');
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
              >
                <Save className="size-4 mr-2" />
                Salvar Local
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Marker Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => {
        if (!open) {
          setEditingLocation(null);
          setUploadedImages([]);
          setFormCategory('outro');
          setFormStatus('success');
          setFormRegion('central');
        }
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="size-5 text-teal-600" />
              Editar Local
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do local selecionado
            </DialogDescription>
          </DialogHeader>

          <form
            key={editingLocation?.id || 'edit-form'}
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
              <Input
                id="edit-title"
                name="title"
                placeholder="Ex: Parquinho Central"
                defaultValue={editingLocation?.title}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Tipo de Equipamento *</Label>
              <Select value={formCategory} onValueChange={(value) => setFormCategory(value as LocationCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select value={formStatus} onValueChange={(value) => setFormStatus(value as 'critical' | 'warning' | 'success')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">✅ Normal</SelectItem>
                    <SelectItem value="warning">⚠️ Atenção</SelectItem>
                    <SelectItem value="critical">🚨 Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-region">Região *</Label>
                <Select value={formRegion} onValueChange={(value) => setFormRegion(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
              <Input
                id="edit-address"
                name="address"
                placeholder="Ex: Quadra 10, Lote 5, Santa Maria-DF"
                defaultValue={editingLocation?.address}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-seiProcess">Processo SEI</Label>
              <Input
                id="edit-seiProcess"
                name="seiProcess"
                placeholder="Ex: 00123.456789/2026-01"
                defaultValue={editingLocation?.seiProcess}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                name="description"
                placeholder="Descreva o local..."
                rows={3}
                defaultValue={editingLocation?.description}
              />
            </div>

            {/* Upload de Fotos */}
            <div className="space-y-2">
              <Label>Fotos da Vistoria</Label>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-slate-200"
                      />
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
                htmlFor="edit-images"
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-colors"
              >
                <Camera className="size-5 text-slate-500" />
                <span className="text-sm text-slate-600 font-medium">
                  {uploadedImages.length > 0
                    ? `${uploadedImages.length} foto(s) - Adicionar mais`
                    : 'Adicionar fotos da vistoria'}
                </span>
              </label>
              <input
                id="edit-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-xs text-slate-500">
                Aceita múltiplas imagens (JPG, PNG, etc.)
              </p>
            </div>

            <div className="flex gap-2 justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleDeleteMarker}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-4 mr-2" />
                Deletar
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingLocation(null);
                    setUploadedImages([]);
                    setFormCategory('outro');
                    setFormStatus('success');
                    setFormRegion('central');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                >
                  <Save className="size-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}