import React, { useState, useMemo } from 'react';
import { Search, Check, Sparkles, ChevronRight, Info } from 'lucide-react';
import { TreatmentService } from '../lib/types.js';

interface ServicesSelectionViewProps {
  services: TreatmentService[];
  selectedServices: Record<string, TreatmentService>;
  onToggleService: (service: TreatmentService) => void;
  onContinue: () => void;
}

export const ServicesSelectionView: React.FC<ServicesSelectionViewProps> = ({
  services,
  selectedServices,
  onToggleService,
  onContinue
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.map((s) => s.category)));
    return ['All', ...cats];
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'All' || s.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [services, searchTerm, selectedCategory]);

  const selectedCount = Object.keys(selectedServices).length;

  return (
    <section className="space-y-5 animate-fadeIn">
      {/* Search Bar */}
      <div className="space-y-2">
        <label htmlFor="service-search-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Search Treatments & Services
        </label>
        <div className="relative w-full">
          <input
            id="service-search-input"
            type="text"
            placeholder="Search treatments (e.g., Root Canal, Cleaning, Braces)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-slate-100 rounded-2xl pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Header and Count */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-extrabold text-slate-900">Choose Services</h3>
          <span className="text-[11px] text-slate-400 font-medium">Multi-select available</span>
        </div>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
          {selectedCount} Selected
        </span>
      </div>

      {/* Services List */}
      <div className="space-y-3.5">
        {filteredServices.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <p className="text-xs font-bold text-slate-600">No treatments found matching "{searchTerm}"</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredServices.map((service) => {
            const isSelected = !!selectedServices[service.id];
            const isExpanded = expandedDetailsId === service.id;

            return (
              <div
                key={service.id}
                onClick={() => onToggleService(service)}
                className={`group relative flex flex-col p-3.5 rounded-2xl border-2 transition cursor-pointer select-none bg-white ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/20 shadow-md ring-1 ring-blue-500/20'
                    : 'border-slate-100 hover:border-blue-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Checkbox box */}
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-1 transition ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-300 group-hover:border-slate-400'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                  </div>

                  {/* Thumbnail */}
                  <div className="w-20 h-20 sm:w-24 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/60 relative">
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                        {service.name}
                      </span>
                    </div>

                    <span className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2 leading-relaxed">
                      {service.description}
                    </span>
                  </div>
                </div>

                {/* Collapsible inclusions */}
                {service.includes && service.includes.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedDetailsId(isExpanded ? null : service.id);
                      }}
                      className="text-[11px] text-slate-500 hover:text-blue-600 font-semibold flex items-center gap-1"
                    >
                      <Info className="w-3 h-3" />
                      <span>{isExpanded ? 'Hide procedure details' : 'What is included in this visit?'}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-2.5 bg-slate-50 rounded-xl space-y-1">
                        {service.includes?.map((item: string, i: number) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Floating Bar */}
      <div className="pt-2 sticky bottom-2 z-10">
        <div className="p-3.5 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Selection</span>
            <span className="text-base font-extrabold text-white">
              {selectedCount} Services Selected
            </span>
          </div>

          <button
            type="button"
            onClick={onContinue}
            disabled={selectedCount === 0}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              selectedCount > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Continue to Schedule</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
