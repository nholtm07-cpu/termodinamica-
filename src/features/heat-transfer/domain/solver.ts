/**
 * Despachador unificado del motor de Transferencia de Calor.
 * Garantiza un único objeto inmutable de evaluación para Pizarra, Diagramas y Gráficos.
 */

import type { HeatCaseId, HeatEvaluation, Parameter } from './models';
import { evaluateC01 } from './cases/C01';
import { evaluateC02 } from './cases/C02';
import { evaluateC03 } from './cases/C03';
import { evaluateC04 } from './cases/C04';
import { evaluateC05, type HeatExchangerFlowMode } from './cases/C05';

export interface HeatEvaluationOptions {
  playbackTimeSec?: number;
  flowMode?: HeatExchangerFlowMode;
}

export function evaluateHeatCase(
  caseId: HeatCaseId,
  inputs: Record<string, Parameter>,
  options: HeatEvaluationOptions = {}
): HeatEvaluation {
  switch (caseId) {
    case 'TC-C01':
      return evaluateC01(inputs);
    case 'TC-C02':
      return evaluateC02(inputs);
    case 'TC-C03':
      return evaluateC03(inputs);
    case 'TC-C04':
      return evaluateC04(inputs, options.playbackTimeSec);
    case 'TC-C05':
      return evaluateC05(inputs, options.flowMode ?? 'counterflow');
  }
}
