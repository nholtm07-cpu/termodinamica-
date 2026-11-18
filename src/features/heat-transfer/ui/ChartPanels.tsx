import React from 'react';
import { SciChart } from '../../../components/charts/ThermoCharts';
import type { ChartSeriesData } from '../domain/models';

interface ChartPanelsProps {
  charts: ChartSeriesData[];
}

export const ChartPanels: React.FC<ChartPanelsProps> = ({ charts }) => {
  if (charts.length === 0) {
    return null;
  }

  return (
    <section aria-label="Gráficos científicos sincronizados" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-bold text-[#F1F5F9]">
          Gráficas analíticas sincronizadas con el motor
        </h3>
        <span className="text-xs text-[#94A3B8]">
          Cada curva ofrece tabla equivalente accesible para lectura exacta
        </span>
      </div>
      <div className={`grid grid-cols-1 ${charts.length > 1 ? 'xl:grid-cols-2' : ''} gap-4`}>
        {charts.map((c) => (
          <SciChart
            key={c.id}
            title={c.title}
            subtitle={c.subtitle}
            xLabel={c.xLabel}
            yLabel={c.yLabel}
            series={c.series}
            verticalMarkerX={c.markerX}
            xDecimals={c.xDecimals ?? 2}
            yDecimals={c.yDecimals ?? 1}
          />
        ))}
      </div>
    </section>
  );
};
