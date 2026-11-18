import test from 'node:test';
import assert from 'node:assert/strict';
import { solveHydrostaticPressure, solvePipeFlowDarcy } from './fluidMechanics';

test('MEC120 no-regresión: flujo laminar y turbulento Darcy-Weisbach', () => {
  const lam = solvePipeFlowDarcy({
    diameterM: 0.05,
    lengthM: 10,
    velocityMs: 0.02,
    roughnessMm: 0.045,
    densityKgM3: 998,
    viscosityPaS: 0.001,
  });
  assert.equal(lam.ok, true);
  if (lam.ok) {
    assert.equal(lam.value.regime, 'Laminar');
    assert.ok(Math.abs(lam.value.reynolds - 998) < 1e-6);
    assert.ok(Math.abs(lam.value.frictionFactor - 64 / 998) < 1e-6);
  }

  const turb = solvePipeFlowDarcy({
    diameterM: 0.1,
    lengthM: 50,
    velocityMs: 2.0,
    roughnessMm: 0.045,
    densityKgM3: 998,
    viscosityPaS: 0.001,
  });
  assert.equal(turb.ok, true);
  if (turb.ok) {
    assert.equal(turb.value.regime, 'Turbulento');
    assert.ok(turb.value.headLossM > 0.5 && turb.value.headLossM < 3.0);
  }
});

test('MEC120 no-regresión: presión hidrostática', () => {
  const hydro = solveHydrostaticPressure({
    densityKgM3: 1000,
    depthM: 10,
    pSurfaceKPa: 101.325,
  });
  assert.equal(hydro.ok, true);
  if (hydro.ok) {
    assert.ok(Math.abs(hydro.value.pGageKPa - 98.0665) < 1e-4);
    assert.ok(Math.abs(hydro.value.pAbsKPa - 199.3915) < 1e-4);
  }
});
