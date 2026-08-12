import { useState } from 'react';
import { Trash2, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface GaleriaProps {
  images: string[];
  onRemoveImage: (index: number) => void;
}

export function GaleriaVistoria({ images, onRemoveImage }: GaleriaProps) {
  // Estado para controlar qual imagem está aberta no popup (null = fechado)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewerIndex !== null) {
      setViewerIndex((viewerIndex + 1) % images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewerIndex !== null) {
      setViewerIndex((viewerIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <>
      {/* 1. GRADE DE MINIATURAS NO FORMULÁRIO */}
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, index) => (
          <div 
            key={index} 
            className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-slate-200"
            onClick={() => setViewerIndex(index)} // Abre o popup ao clicar na foto
          >
            <img
              src={img}
              alt={`Preview ${index + 1}`}
              className="w-full h-24 object-cover transition-transform duration-300 group-hover:scale-110"
            />
            
            {/* Efeito de hover escuro com lupa */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity size-6" />
            </div>

            {/* Botão de deletar (blindado para não abrir o popup junto) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // Evita que o clique vaze para a foto
                onRemoveImage(index);
              }}
              className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
      </div>

      {/* 2. POPUP / CARROSSEL TELA CHEIA (LIGHTBOX) */}
      {viewerIndex !== null && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setViewerIndex(null)} // Clicar fora da foto fecha o popup
        >
          {/* Botão Fechar */}
          <button 
            onClick={(e) => { e.stopPropagation(); setViewerIndex(null); }} 
            className="absolute top-4 right-4 md:top-6 md:right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <X className="size-6 md:size-8" />
          </button>

          {/* Seta Esquerda (só aparece se tiver mais de 1 foto) */}
          {images.length > 1 && (
            <button 
              onClick={prevImage} 
              className="absolute left-2 md:left-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-full transition-all"
            >
              <ChevronLeft className="size-6 md:size-8" />
            </button>
          )}

          {/* Imagem Ampliada */}
          <img 
            src={images[viewerIndex]} 
            alt={`Ampliada ${viewerIndex + 1}`} 
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-md shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Clicar na foto não fecha o popup
          />

          {/* Seta Direita */}
          {images.length > 1 && (
            <button 
              onClick={nextImage} 
              className="absolute right-2 md:right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-full transition-all"
            >
              <ChevronRight className="size-6 md:size-8" />
            </button>
          )}

          {/* Contador de Fotos (Ex: 1 / 3) */}
          <div className="absolute bottom-4 md:bottom-8 text-white text-sm md:text-base font-medium bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            {viewerIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
