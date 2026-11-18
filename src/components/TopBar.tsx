import React from 'react';
import { Menu, X } from 'lucide-react';

export type MainSection = 'home' | 'mec120' | 'catedra' | 'simulators' | 'certamen' | 'heat-transfer';

interface TopBarProps {
  activeSection: MainSection;
  onNavigate: (section: MainSection) => void;
  onStartFromZero: () => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

const NAV_ITEMS: Array<{ id: MainSection; label: string }> = [
  { id: 'home', label: 'Inicio' },
  { id: 'mec120', label: 'MEC120 Fluidos' },
  { id: 'catedra', label: 'MEC110 Termo' },
  { id: 'heat-transfer', label: 'Transferencia Calor' },
  { id: 'certamen', label: 'Certámenes' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onNavigate,
  onStartFromZero,
  mobileMenuOpen,
  onToggleMobileMenu,
}) => {
  return (
    <header className="sticky top-0 z-40 h-14 bg-[#070D18]/90 backdrop-blur-md border-b border-[#1E314A] px-4 lg:px-6 flex items-center justify-between gap-8">
      {/* Zona 1: Marca en una sola línea (sin chips ni subtítulos adjuntos) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Cerrar navegación lateral' : 'Abrir navegación lateral'}
          aria-expanded={mobileMenuOpen}
          className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#1E314A] bg-[#0F1A2E] text-[#F1F5F9] hover:border-[#38BDF8]/60 transition-colors cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="font-display text-base sm:text-lg font-bold tracking-tight text-[#F1F5F9] whitespace-nowrap shrink-0 hover:text-[#38BDF8] transition-colors cursor-pointer"
        >
          FluidoTermo Lab
        </button>
      </div>

      {/* Zona 2: 5 enlaces limpios de una sola línea */}
      <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-6">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#38BDF8]'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF]"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zona 3: 1 acción principal */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onStartFromZero}
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#38BDF8] text-[#070D18] hover:bg-[#60CEFA] shadow-[0_0_20px_-6px_rgba(56,189,248,0.6)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          Ruta Desde Cero
        </button>
      </div>
    </header>
  );
};
