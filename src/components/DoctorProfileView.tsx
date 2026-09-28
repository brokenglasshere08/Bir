import React from 'react';
import { Star, ChevronRight, MapPin } from 'lucide-react';
import { DoctorProfile } from '../lib/types.js';

interface DoctorProfileViewProps {
  doctor: DoctorProfile;
  onOpenReviews: () => void;
  onOpenLightbox: (index: number) => void;
  onChooseServices: () => void;
}

export const DoctorProfileView: React.FC<DoctorProfileViewProps> = ({
  doctor,
  onOpenReviews,
  onOpenLightbox,
  onChooseServices
}) => {
  return (
    <section className="space-y-6 animate-fadeIn">
      {/* Doctor Header Profile */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-md ring-4 ring-slate-100 shrink-0 bg-slate-100">
            <img
              src={doctor.avatarUrl}
              alt={doctor.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {doctor.name}
            </h2>
            <p className="text-xs font-bold text-slate-700 mt-0.5">{doctor.title}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {doctor.experienceYears}+ Years Clinical Experience · {doctor.clinicName}
            </p>
          </div>
        </div>

        {/* Ratings banner */}
        <div
          onClick={onOpenReviews}
          className="flex justify-between items-center px-3.5 py-2.5 bg-amber-50/90 hover:bg-amber-100/80 active:scale-[0.99] rounded-2xl border border-amber-200 text-xs font-bold text-slate-800 cursor-pointer transition shadow-xs group"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-lg font-black text-xs shadow-xs">
              <Star className="w-3 h-3 fill-white text-white" /> {doctor.rating}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-slate-900 group-hover:text-amber-900 transition flex items-center gap-1">
                Ratings & Patient Reviews <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {doctor.reviewCount} verified patient consultations
              </span>
            </div>
          </div>
          <a
            href="https://maps.google.com"
            onClick={(e) => e.stopPropagation()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-600 hover:text-blue-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200 hover:border-blue-300 text-[11px] font-bold transition shadow-xs"
          >
            <MapPin className="w-3 h-3 text-red-500" />
            <span>Maps</span>
          </a>
        </div>
      </div>

      {/* Clinic Overview Hero Card */}
      <div className="space-y-2.5">
        <h3 className="text-base font-extrabold text-slate-900">Clinic Overview</h3>
        <div
          onClick={() => onOpenLightbox(0)}
          className="relative w-full h-44 rounded-2xl overflow-hidden shadow-sm border border-slate-100 group cursor-pointer"
        >
          <img
            src={doctor.clinicImages[0]?.src || doctor.avatarUrl}
            alt="Clinic Interior"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 flex flex-col justify-end text-white">
            <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider mb-1">
              NABH & ISO Accredited Suite
            </span>
            <p className="text-xs text-slate-100 leading-relaxed font-medium line-clamp-2">
              {doctor.clinicOverview}
            </p>
          </div>
        </div>
      </div>

      {/* Clinic Photo Gallery Carousel */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-extrabold text-slate-900">Clinic Images</h3>
          <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
            Swipe to Explore →
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory py-1 px-0.5 scroll-smooth">
          {doctor.clinicImages.map((img, idx) => (
            <div
              key={idx}
              onClick={() => onOpenLightbox(idx)}
              className="w-56 aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0 snap-center group cursor-pointer relative bg-slate-100"
            >
              <img
                src={img.src}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2.5 flex items-end">
                <span className="text-white text-[11px] font-bold truncate">{img.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onChooseServices}
          className="w-full py-3.5 bg-slate-900 text-white font-extrabold rounded-2xl shadow-lg hover:bg-black active:scale-[0.98] transition flex items-center justify-center gap-2 text-sm"
        >
          <span>Choose Services & Treatments</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
