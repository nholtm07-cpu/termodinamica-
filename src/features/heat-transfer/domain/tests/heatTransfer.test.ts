import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOK_CASE_DEFINITIONS, clonePresetInputs } from '../../data/book-presets';
import { evaluateHeatCase } from '../solver';
import { stableLogMeanDeltaT } from '../validate';

function assertRelClose(actual: unknown, expected: number, rtol = 1e-6, label = '') {
  assert.equal(typeof actual, 'number', `${label} debe ser número`);
  const num = actual as number;
  const diff = Math.abs(num - expected);
  const tol = Math.max(1e-9, Math.abs(expected) * rtol);
  assert.ok(diff <= tol, `${label}: esperado ${expected}, obtenido ${num} (diff=${diff})`);
}

test('Existen exactamente 5 casos principales en BOOK_CASE_DEFINITIONS', () => {
  const ids = Object.keys(BOOK_CASE_DEFINITIONS);
  assert.deepEqual(ids, ['TC-C01', 'TC-C02', 'TC-C03', 'TC-C04', 'TC-C05']);
});

test('TC-C01 (Techo Ej. 1-5): reproduce valores exactos del libro y variación L=0,30 m', () => {
  const base = evaluateHeatCase('TC-C01', clonePresetInputs('TC-C01'));
  assert.equal(base.status, 'valid');
  assert.ok(base.steps.length >= 12, 'Mínimo 12 pasos en pizarra');
  assertRelClose(base.result.area, 48, 1e-9, 'C01 area');
  assertRelClose(base.result.Qdot, 1689.6, 1e-9, 'C01 Qdot');
  assertRelClose(base.result.Qkw, 1.6896, 1e-9, 'C01 Qkw');
  assertRelClose(base.result.energyKwh, 16.896, 1e-9, 'C01 energyKwh');
  assertRelClose(base.result.costUsd, 1.35168, 1e-9, 'C01 costUsd');
  assertRelClose(base.result.qFlux, 35.2, 1e-9, 'C01 qFlux');

  // Variación: L = 0,30 m
  const mod = clonePresetInputs('TC-C01');
  mod.L.value = 0.30;
  const evalMod = evaluateHeatCase('TC-C01', mod);
  assert.equal(evalMod.isModifiedFromBook, true);
  assertRelClose(evalMod.result.Qdot, 1408, 1e-9, 'C01 L=0.30 Qdot');
  assertRelClose(evalMod.result.energyKwh, 14.08, 1e-9, 'C01 L=0.30 energy');
  assertRelClose(evalMod.result.costUsd, 1.1264, 1e-9, 'C01 L=0.30 cost');

  // Invertir temperaturas -> signo opuesto y magnitud conservada
  const inv = clonePresetInputs('TC-C01');
  inv.Tsi.value = 4;
  inv.Tse.value = 15;
  const evalInv = evaluateHeatCase('TC-C01', inv);
  assert.equal(evalInv.status, 'warning');
  assertRelClose(evalInv.result.Qdot, -1689.6, 1e-9, 'C01 invertido Qdot');
});

test('TC-C02 (Convección + Radiación Ej. 1-10): reproduce valores con Kelvin y σ SI', () => {
  const base = evaluateHeatCase('TC-C02', clonePresetInputs('TC-C02'));
  assert.equal(base.status, 'valid');
  assert.ok(base.steps.length >= 12);
  assertRelClose(base.result.Qconv, 86.4, 1e-9, 'C02 Qconv');
  assertRelClose(base.result.Qrad, 81.841718487, 1e-8, 'C02 Qrad');
  assertRelClose(base.result.Qtotal, 168.241718487, 1e-8, 'C02 Qtotal');

  // Variación: h = 10 -> Qconv = 144 W, Qrad inalterada
  const mod = clonePresetInputs('TC-C02');
  mod.h.value = 10;
  const evalMod = evaluateHeatCase('TC-C02', mod);
  assertRelClose(evalMod.result.Qconv, 144, 1e-9, 'C02 h=10 Qconv');
  assertRelClose(evalMod.result.Qrad, base.result.Qrad as number, 1e-9, 'C02 Qrad constante');

  // Limite epsilon=0 y equilibrio térmico
  const noRad = clonePresetInputs('TC-C02');
  noRad.epsilon.value = 0;
  const evalNoRad = evaluateHeatCase('TC-C02', noRad);
  assert.equal(evalNoRad.result.Qrad, 0);
  assertRelClose(evalNoRad.result.Qconv, 86.4, 1e-9);

  // Violación cero absoluto
  const badT = clonePresetInputs('TC-C02');
  badT.Ts.value = -275;
  const evalBadT = evaluateHeatCase('TC-C02', badT);
  assert.equal(evalBadT.status, 'invalid');
});

test('TC-C03 (Doble vidrio Ej. 3-3): 5 resistencias, Qdot y nodos exactos', () => {
  const base = evaluateHeatCase('TC-C03', clonePresetInputs('TC-C03'));
  assert.equal(base.status, 'valid');
  assert.ok(base.steps.length >= 12);
  assertRelClose(base.result.Rtotal, 0.433226495726, 1e-6, 'C03 Rtotal');
  assertRelClose(base.result.Qdot, 69.24784214, 1e-6, 'C03 Qdot');
  assertRelClose(base.result.Tsi, 14.22934649, 1e-6, 'C03 Tsi');

  // Variación: L_aire = 20 mm -> Qdot ≈ 39.80156 W + advertencia convección natural
  const mod = clonePresetInputs('TC-C03');
  mod.Lairmm.value = 20;
  const evalMod = evaluateHeatCase('TC-C03', mod);
  assert.equal(evalMod.status, 'warning');
  assertRelClose(evalMod.result.Qdot, 39.801559178, 1e-8, 'C03 Lair=20mm Qdot');
  assert.ok(evalMod.warnings.length > 0);
});

test('TC-C04 (Termopar Ej. 4-1): Bi=0,001, t99=9,94132 s y bloqueos Bi>=0,1 / target=100%', () => {
  const base = evaluateHeatCase('TC-C04', clonePresetInputs('TC-C04'));
  assert.equal(base.status, 'valid');
  assert.ok(base.steps.length >= 12);
  assertRelClose(base.result.Bi, 0.001, 1e-9, 'C04 Bi');
  assertRelClose(base.result.b, 0.4632352941, 1e-6, 'C04 b');
  assertRelClose(base.result.targetTime, 9.94132098, 1e-6, 'C04 t99');

  // Variación: D = 2 mm -> t99 se duplica ≈ 19.8826 s
  const mod = clonePresetInputs('TC-C04');
  mod.Dmm.value = 2;
  const evalMod = evaluateHeatCase('TC-C04', mod);
  assertRelClose(evalMod.result.Bi, 0.002, 1e-9);
  assertRelClose(evalMod.result.targetTime, 19.88264196, 1e-6);

  // Bloqueo científico Bi >= 0.1 (ej. D = 100 mm -> Bi = 0.1)
  const bigD = clonePresetInputs('TC-C04');
  bigD.Dmm.value = 120;
  const evalBigD = evaluateHeatCase('TC-C04', bigD);
  assert.equal(evalBigD.status, 'invalid');
  assert.equal(evalBigD.blockingIssue?.code, 'BIOT_LUMPED_INVALID');

  // Bloqueo target = 100 %
  const infTarget = clonePresetInputs('TC-C04');
  infTarget.targetPct.value = 100;
  const evalInf = evaluateHeatCase('TC-C04', infTarget);
  assert.equal(evalInf.status, 'invalid');
  assert.equal(evalInf.blockingIssue?.code, 'OUT_OF_DOMAIN_MAX');
});

test('TC-C05 (Intercambiador contraflujo Ej. 11-4 & NTU): valores base, variación U=800 y estabilidad LMTD', () => {
  const base = evaluateHeatCase('TC-C05', clonePresetInputs('TC-C05'));
  assert.equal(base.status, 'warning'); // advierte L > 40 m (108.50 m en un solo tubo)
  assert.ok(base.steps.length >= 12);
  assertRelClose(base.result.Qdot, 300960, 1e-9, 'C05 Qdot');
  assertRelClose(base.result.Thout, 125.08584687, 1e-6, 'C05 Thout');
  assertRelClose(base.result.lmtd, 91.97345257, 1e-6, 'C05 LMTD');
  assertRelClose(base.result.A, 5.11288692, 1e-6, 'C05 A');
  assertRelClose(base.result.L, 108.497978, 1e-5, 'C05 L');
  assertRelClose(base.result.AreaFromNTU, base.result.A as number, 1e-6, 'C05 NTU consistency');

  // Variación U = 800 -> Qdot inalterado, A ≈ 4.09031 m², L ≈ 86.798 m
  const mod = clonePresetInputs('TC-C05');
  mod.U.value = 800;
  const evalMod = evaluateHeatCase('TC-C05', mod);
  assertRelClose(evalMod.result.Qdot, 300960, 1e-9, 'C05 U=800 Qdot');
  assertRelClose(evalMod.result.A, 4.09030954, 1e-6, 'C05 U=800 A');
  assertRelClose(evalMod.result.L, 86.79838, 1e-5, 'C05 U=800 L');

  // Bloqueo cruce térmico en paralelo (Thin=160, Tcout=130 => Thout = 125 < 130)
  const cross = clonePresetInputs('TC-C05');
  cross.TcoutTarget.value = 130;
  const evalCross = evaluateHeatCase('TC-C05', cross, { flowMode: 'parallel' });
  assert.equal(evalCross.status, 'invalid');
  assert.equal(evalCross.blockingIssue?.code, 'HX_TEMP_CROSS_VIOLATION');

  // Estabilidad numérica LMTD cuando dT1 ≈ dT2
  assertRelClose(stableLogMeanDeltaT(50, 50 + 1e-9), 50, 1e-8, 'LMTD equal deltas');
});
