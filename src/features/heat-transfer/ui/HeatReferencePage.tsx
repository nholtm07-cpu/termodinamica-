import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { MathBlock } from '../../../components/MathBlock';
import {
  CENGEL_CHAPTER_MAP,
  HT_FORMULAS_BANK,
  HT_SYMBOLS_DICTIONARY,
} from '../content/lessons';
import { formatHT, kWhToMJ } from '../domain/units';

interface HeatReferencePageProps {
  completedLessonsCount: number;
  totalLessonsCount: number;
  solvedCasesCount: number;
}

export const HeatReferencePage: React.FC<HeatReferencePageProps> = ({
  completedLessonsCount,
  totalLessonsCount,
  solvedCasesCount,
}) => {
  const [query, setQuery] = useState('');
  const [tempC, setTempC] = useState(29);
  const [lenMm, setLenMm] = useState(25);
  const [powerW, setPowerW] = useState(1689.6);
  const [hours, setHours] = useState(10);

  const filteredSymbols = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HT_SYMBOLS_DICTIONARY;
    return HT_SYMBOLS_DICTIONARY.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.note.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredFormulas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HT_FORMULAS_BANK;
    return HT_FORMULAS_BANK.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.validity.toLowerCase().includes(q)
    );
  }, [query]);

  const kwh = (powerW / 1000) * hours;

  return (
    <div className="space-y-6">
      {/* Conversor SI con trazabilidad de cancelación de unidades */}
      <section className="ft-panel p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-[#F1F5F9]">
            Conversor SI y auditoría dimensional interactiva
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            Todo el motor físico opera en SI puro (m, s, kg, W, J, K). Comprueba aquí cada factor antes de sustituir en un certamen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="ft-well p-4 space-y-2.5">
            <label htmlFor="conv-temp-c" className="font-semibold text-[#F1F5F9] block">
              Temperatura absoluta (°C → K)
            </label>
            <input
              id="conv-temp-c"
              type="number"
              value={tempC}
              onChange={(e) => setTempC(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 font-mono-num bg-[#0F1A2E] border border-[#1E314A] rounded-lg text-[#F1F5F9] focus:border-[#38BDF8]"
            />
            <div className="text-[#2DD4BF] font-mono-num font-semibold">
              {formatHT(tempC, 2)} °C + 273,15 = {formatHT(tempC + 273.15, 2)} K
            </div>
            <div className="text-[#94A3B8]">Obligatorio al elevar a T⁴ en Stefan–Boltzmann.</div>
          </div>

          <div className="ft-well p-4 space-y-2.5">
            <label htmlFor="conv-len-mm" className="font-semibold text-[#F1F5F9] block">
              Espesor o diámetro (mm → m)
            </label>
            <input
              id="conv-len-mm"
              type="number"
              value={lenMm}
              onChange={(e) => setLenMm(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 font-mono-num bg-[#0F1A2E] border border-[#1E314A] rounded-lg text-[#F1F5F9] focus:border-[#38BDF8]"
            />
            <div className="text-[#2DD4BF] font-mono-num font-semibold">
              {formatHT(lenMm, 2)} mm × (1 m / 1000 mm) = {formatHT(lenMm / 1000, 5)} m
            </div>
            <div className="text-[#94A3B8]">Cancela mm arriba y abajo antes de usar k o Bi.</div>
          </div>

          <div className="ft-well p-4 space-y-2.5">
            <div className="font-semibold text-[#F1F5F9]">Potencia (W) × Tiempo (h) → Energía</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                aria-label="Potencia en Watts"
                type="number"
                value={powerW}
                onChange={(e) => setPowerW(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 font-mono-num bg-[#0F1A2E] border border-[#1E314A] rounded-lg text-[#F1F5F9] focus:border-[#38BDF8]"
              />
              <input
                aria-label="Horas de operación"
                type="number"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 font-mono-num bg-[#0F1A2E] border border-[#1E314A] rounded-lg text-[#F1F5F9] focus:border-[#38BDF8]"
              />
            </div>
            <div className="text-[#2DD4BF] font-mono-num font-semibold">
              {formatHT(kwh, 3)} kWh = {formatHT(kWhToMJ(kwh), 3)} MJ
            </div>
            <div className="text-[#94A3B8]">1 kWh = 1 kW × 3600 s = 3,6 MJ.</div>
          </div>
        </div>
      </section>

      {/* Buscador unificado de formulario y diccionario */}
      <section className="ft-panel p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-[#F1F5F9]">
              Formulario técnico y diccionario de símbolos
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5 font-mono-num">
              Progreso local guardado: {completedLessonsCount}/{totalLessonsCount} lecciones · {solvedCasesCount}/5 casos comprobados
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar símbolo o fórmula"
              placeholder="Buscar Biot, LMTD, Fourier..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#091120] border border-[#1E314A] rounded-lg text-[#F1F5F9] focus:border-[#38BDF8]"
            />
          </div>
        </div>

        {/* Fórmulas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFormulas.map((f) => (
            <div key={f.id} className="ft-well p-4 space-y-2">
              <div className="text-xs font-semibold text-[#38BDF8]">{f.title}</div>
              <MathBlock latex={f.latex} display className="text-xs text-[#2DD4BF]" />
              <div className="text-[11px] text-[#94A3B8]">
                <strong className="text-[#F1F5F9]">Validez:</strong> {f.validity}
              </div>
            </div>
          ))}
        </div>

        {/* Diccionario de variables */}
        <div className="overflow-x-auto border border-[#1E314A] rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0B1322] text-[#94A3B8] border-b border-[#1E314A]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Símbolo</th>
                <th className="py-2.5 px-3 font-semibold">Magnitud física</th>
                <th className="py-2.5 px-3 font-semibold">Unidad SI</th>
                <th className="py-2.5 px-3 font-semibold">Nota crítica</th>
              </tr>
            </thead>
            <tbody className="bg-[#091120] divide-y divide-[#1E314A]/60">
              {filteredSymbols.map((s) => (
                <tr key={s.symbol} className="hover:bg-[#14223B]/40">
                  <td className="py-2.5 px-3 font-mono-num text-[#2DD4BF] font-semibold">{s.symbol}</td>
                  <td className="py-2.5 px-3 text-[#F1F5F9]">{s.name}</td>
                  <td className="py-2.5 px-3 font-mono-num text-[#F59E0B]">{s.unit}</td>
                  <td className="py-2.5 px-3 text-[#94A3B8]">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bibliografía, método y mapa de capítulos 1-14 */}
      <section className="ft-panel p-5 sm:p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-[#F1F5F9]">
          Bibliografía, origen de cifras y mapa de capítulos (Çengel 3.ª ed.)
        </h2>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          Los cinco casos principales (<span className="font-mono-num text-[#CBD5E1]">TC-C01</span> a <span className="font-mono-num text-[#CBD5E1]">TC-C05</span>) toman sus datos numéricos base de ejemplos específicos de Yunus A. Çengel, <em>Transferencia de calor y masa: un enfoque práctico</em>, 3.ª edición, McGraw-Hill (2007). Toda la redacción, las derivaciones pedagógicas y los simuladores paramétricos son originales, y todas las cifras se recalculan en tiempo real con precisión IEEE-754 usando constantes SI estandarizadas (incluyendo σ = 5,670374419×10⁻⁸ W/(m²·K⁴) y 273,15 K).
        </p>

        <div className="overflow-x-auto border border-[#1E314A] rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0B1322] text-[#94A3B8] border-b border-[#1E314A]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Cap.</th>
                <th className="py-2.5 px-3 font-semibold">Tema en Çengel (3.ª ed.)</th>
                <th className="py-2.5 px-3 font-semibold">Inicio impreso</th>
                <th className="py-2.5 px-3 font-semibold">Lección plataforma</th>
                <th className="py-2.5 px-3 font-semibold">Vínculo certamen</th>
              </tr>
            </thead>
            <tbody className="bg-[#091120] divide-y divide-[#1E314A]/60">
              {CENGEL_CHAPTER_MAP.map((row) => (
                <tr key={row.cap} className="hover:bg-[#14223B]/40">
                  <td className="py-2 px-3 font-mono-num text-[#38BDF8] font-semibold">{row.cap}</td>
                  <td className="py-2 px-3 text-[#F1F5F9]">{row.title}</td>
                  <td className="py-2 px-3 font-mono-num text-[#94A3B8]">{row.page}</td>
                  <td className="py-2 px-3 font-mono-num text-[#2DD4BF]">{row.lessonId}</td>
                  <td className="py-2 px-3 text-[#F59E0B]">{row.caseId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
