import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{ src: string; title: string; caption?: string }>;
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNavigate
}) => {
  if (!isOpen || images.length === 0) return null;

  const current = images[currentIndex] || images[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate((currentIndex - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate((currentIndex + 1) % images.length);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Clinic photo viewer"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4"
      onClick={onClose}
    >
      <div className="flex justify-between items-center text-white px-2 pt-2 max-w-4xl mx-auto w-full">
        <div>
          <h3 className="text-sm font-bold text-white">{current.title}</h3>
          {current.caption && (
            <p className="text-xs text-slate-300 font-medium mt-0.5">{current.caption}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close lightbox"
          className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className="relative flex-1 flex items-center justify-center my-4 max-w-4xl mx-auto w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous photo"
          className="absolute left-2 w-11 h-11 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center z-10 transition border border-white/10 shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="max-h-[75vh] max-w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center bg-black">
          <img
            src={current.src}
            alt={current.title}
            className="max-h-[75vh] max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next photo"
          className="absolute right-2 w-11 h-11 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center z-10 transition border border-white/10 shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="text-center text-slate-400 text-xs pb-2 font-medium">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};
