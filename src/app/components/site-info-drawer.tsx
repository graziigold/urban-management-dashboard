import { X, ExternalLink, MapPin as MapPinIcon, ImageIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import type { MapMarker } from './map-view';

interface SiteData extends MapMarker {
  description?: string;
  images?: string[];
  seiProcess?: string;
  address?: string;
  lastUpdate?: string;
}

interface SiteInfoDrawerProps {
  site: SiteData | null;
  onClose: () => void;
}

const statusLabels = {
  critical: { text: 'Crítico', color: 'bg-red-500' },
  warning: { text: 'Atenção', color: 'bg-yellow-500' },
  success: { text: 'Normal', color: 'bg-green-500' },
};

export function SiteInfoDrawer({ site, onClose }: SiteInfoDrawerProps) {
  if (!site) return null;

  // Fallback caso o status venha modificado ou quebrado
  const currentStatus = site.status && site.status in statusLabels ? site.status : 'success';
  const statusInfo = statusLabels[currentStatus as keyof typeof statusLabels];

  // ── LINK DO GOOGLE MAPS CORRIGIDO E BLINDADO ──
  const openInGoogleMaps = () => {
    const lat = site?.lat || 0;
    const lng = site?.lng || 0;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const hasImages = Array.isArray(site.images) && site.images.length > 0;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl z-50 flex flex-col border-l-2 border-teal-500/30">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-teal-500/20 bg-slate-900/50 backdrop-blur-md">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{site.title || 'Sem título'}</h2>
              <Badge className={`${statusInfo.color} text-white border-0 shadow-lg shadow-black/30 px-3 py-1 ring-2 ring-white/20`}>
                {statusInfo.text}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPinIcon className="size-4 text-teal-400" />
              <span className="font-medium">{site.address || 'Endereço não informado'}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 hover:bg-red-500/20 hover:text-red-400 rounded-full ring-1 ring-teal-500/20 hover:ring-red-500/30 transition-all"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Image Gallery - DEFENSIVA */}
            <div>
              <h3 className="text-sm font-bold text-teal-400 mb-3 uppercase tracking-wide">
                Galeria de Imagens
              </h3>
              {hasImages ? (
                <div className="grid grid-cols-3 gap-3">
                  {site.images!.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square bg-slate-800 rounded-xl overflow-hidden ring-2 ring-teal-500/20 hover:ring-teal-400/40 transition-all hover:scale-105 shadow-lg"
                    >
                      <img
                        src={image}
                        alt={`${site.title || 'Local'} - Imagem ${index + 1}`}
                        className="size-full object-cover"
                        onError={(e) => {
                          // Substitui por um placeholder caso o link da foto quebre no servidor
                          e.currentTarget.src = "https://placehold.co/600x600/1e293b/fff?text=Foto+Indisponivel";
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-400 gap-2">
                  <ImageIcon className="size-6 text-slate-500" />
                  <span className="text-xs">Nenhuma foto registrada nesta vistoria</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-bold text-teal-400 mb-3 uppercase tracking-wide">
                Descrição
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-4 rounded-xl border border-teal-500/20">
                {site.description || 'Nenhuma descrição detalhada foi inserida para este equipamento urbano.'}
              </p>
            </div>

            {/* SEI Process Info */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 blur-xl rounded-2xl group-hover:blur-2xl transition-all" />

              <div className="relative bg-gradient-to-br from-teal-600/20 via-emerald-600/20 to-teal-600/20 border border-teal-500/30 rounded-2xl p-5 shadow-xl ring-1 ring-teal-400/20">
                <h3 className="text-sm font-bold text-teal-300 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <div className="size-2 rounded-full bg-teal-400 animate-pulse shadow-lg shadow-teal-400/50" />
                  Processo SEI
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-teal-400 mb-2 font-bold">
                      Número do Processo
                    </div>
                    <div className="text-sm font-mono text-white bg-slate-800/60 px-4 py-2.5 rounded-lg ring-1 ring-teal-500/20">
                      {site.seiProcess || 'Não vinculado'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-teal-400 mb-2 font-bold">
                      Última Atualização
                    </div>
                    <div className="text-sm text-white font-semibold">
                      {site.lastUpdate || new Date(site.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Region Info */}
            <div className="flex items-center justify-between py-4 border-t border-b border-teal-500/20">
              <span className="text-sm text-slate-400 font-semibold">Região</span>
              <span className="text-sm font-bold text-white">
                {site.region === 'norte' && 'Santa Maria Norte'}
                {site.region === 'sul' && 'Santa Maria Sul'}
                {site.region === 'central' && 'Santa Maria Central'}
                {site.region === 'santos-dumont' && 'Santos Dumont'}
                {site.region === 'total-ville' && 'Total Ville'}
                {site.region === 'porto-rico' && 'Condomínio Porto Rico'}
                {site.region === 'polo-jk' && 'Polo JK'}
                {!['norte', 'sul', 'central', 'santos-dumont', 'total-ville', 'porto-rico', 'polo-jk'].includes(site.region || '') && 'Região Geral'}
              </span>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-teal-500/20">
              <span className="text-sm text-slate-400 font-semibold">Coordenadas</span>
              <span className="text-sm font-mono text-teal-300 font-bold">
                {site?.lat?.toFixed(4) || 0}, {site?.lng?.toFixed(4) || 0}
              </span>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t border-teal-500/20 bg-slate-900/80 backdrop-blur-md">
          <Button
            onClick={openInGoogleMaps}
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-2xl shadow-teal-900/50 ring-2 ring-teal-400/30 hover:ring-teal-400/50 transition-all"
            size="lg"
          >
            <ExternalLink className="size-5 mr-2" />
            Abrir no Google Maps
          </Button>
        </div>
      </div>
    </>
  );
}
