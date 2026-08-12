import { Trash2 } from 'lucide-react';

interface GaleriaProps {
  images: string[];
  onRemoveImage: (index: number) => void;
}

export function GaleriaVistoria({ images, onRemoveImage }: GaleriaProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((img, index) => (
        <div key={index} className="relative group">
          <img
            src={img}
            alt={`Preview ${index + 1}`}
            className="w-full h-24 object-cover rounded-lg border-2 border-slate-200"
          />
          <button
            type="button"
            onClick={() => onRemoveImage(index)}
            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
