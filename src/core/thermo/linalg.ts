/**
 * Álgebra lineal numérica pura para sistemas termodinámicos (p. ej. sistema 4×4 Rankine regenerativo).
 * Implementa eliminación gaussiana con escalamiento por filas y pivoteo parcial,
 * devolviendo residuos exactos ||A x - b||_inf y residuos relativos por fila.
 */

import type { DomainError, Result } from '../contracts';

export interface LinearSolveOutput {
  x: number[];
  residualVector: number[];
  maxAbsResidual: number;
  maxRelativeRowResidual: number;
  pivotMin: number;
  conditionEstimate: number;
}

export function solveLinearSystem(A: number[][], b: number[]): Result<LinearSolveOutput> {
  const n = A.length;
  if (n === 0 || b.length !== n || A.some((row) => row.length !== n)) {
    return {
      ok: false,
      error: {
        code: 'INCONSISTENT_TOPOLOGY',
        message: 'Dimensiones de matriz incompatibles para resolver el sistema lineal.',
        physicalExplanation: 'El número de balances independientes no coincide con las incógnitas.',
        suggestedFix: 'Verifica que la matriz sea cuadrada n×n y el vector b tenga longitud n.',
      },
    };
  }

  // Copia de trabajo con escalamiento de filas
  const M: number[][] = A.map((row) => [...row]);
  const rhs: number[] = [...b];
  const rowScale: number[] = M.map((row) =>
    Math.max(1e-15, ...row.map((val) => Math.abs(val)))
  );

  let pivotMin = Infinity;
  let pivotMax = 0;

  for (let col = 0; col < n; col++) {
    // Pivoteo parcial escalado
    let bestRow = col;
    let bestRatio = -1;
    for (let r = col; r < n; r++) {
      const ratio = Math.abs(M[r][col]) / rowScale[r];
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestRow = r;
      }
    }

    if (bestRatio < 1e-14 || !Number.isFinite(bestRatio)) {
      const err: DomainError = {
        code: 'SINGULAR_MATRIX',
        message: `Sistema lineal singular o mal condicionado en columna ${col + 1}.`,
        physicalExplanation:
          'Las ecuaciones de balance son linealmente dependientes o un flujo de extracción quedó degenerado.',
        suggestedFix:
          'Revisa las presiones de extracción (p_CAC > p_CAA > p_cond) y las entalpías de entrada.',
      };
      return { ok: false, error: err };
    }

    if (bestRow !== col) {
      [M[col], M[bestRow]] = [M[bestRow], M[col]];
      [rhs[col], rhs[bestRow]] = [rhs[bestRow], rhs[col]];
      [rowScale[col], rowScale[bestRow]] = [rowScale[bestRow], rowScale[col]];
    }

    const pivot = M[col][col];
    pivotMin = Math.min(pivotMin, Math.abs(pivot));
    pivotMax = Math.max(pivotMax, Math.abs(pivot));

    for (let r = col + 1; r < n; r++) {
      const factor = M[r][col] / pivot;
      if (factor === 0) continue;
      M[r][col] = 0;
      for (let c = col + 1; c < n; c++) {
        M[r][c] -= factor * M[col][c];
      }
      rhs[r] -= factor * rhs[col];
    }
  }

  // Sustitución regresiva
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sum = rhs[r];
    for (let c = r + 1; c < n; c++) {
      sum -= M[r][c] * x[c];
    }
    x[r] = sum / M[r][r];
    if (!Number.isFinite(x[r])) {
      return {
        ok: false,
        error: {
          code: 'CONVERGENCE_FAILURE',
          message: 'Resultado numérico no finito en sustitución regresiva.',
          physicalExplanation: 'Las propiedades de entrada producen coeficientes incompatibles.',
          suggestedFix: 'Restaura los parámetros de cátedra o ajusta las presiones del ciclo.',
        },
      };
    }
  }

  // Residuos reales sobre A y b originales (sin redondeo)
  const residualVector = new Array<number>(n).fill(0);
  let maxAbsResidual = 0;
  let maxRelativeRowResidual = 0;

  for (let r = 0; r < n; r++) {
    let ax = 0;
    let rowNorm = Math.abs(b[r]);
    for (let c = 0; c < n; c++) {
      ax += A[r][c] * x[c];
      rowNorm += Math.abs(A[r][c] * x[c]);
    }
    const res = ax - b[r];
    residualVector[r] = res;
    maxAbsResidual = Math.max(maxAbsResidual, Math.abs(res));
    maxRelativeRowResidual = Math.max(
      maxRelativeRowResidual,
      Math.abs(res) / Math.max(1e-12, rowNorm)
    );
  }

  return {
    ok: true,
    value: {
      x,
      residualVector,
      maxAbsResidual,
      maxRelativeRowResidual,
      pivotMin,
      conditionEstimate: pivotMax / Math.max(1e-15, pivotMin),
    },
  };
}
