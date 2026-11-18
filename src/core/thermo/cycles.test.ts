import test from 'node:test';
import assert from 'node:assert/strict';
import { solveBoltzmannBox, solveTwoSystemEquilibrium } from './boltzmann';
import { linearInterpolate, solveAdiabaticNozzle, solveIdealGasClosedProcess } from './idealGas';
import {
  solveCarnotEngine,
  solveIceMaker,
  solveIntermittentFridge,
  solveWatermelonCooling,
} from './carnotRefrig';
import { solveBrayton } from './brayton';
import { solveRankine } from './rankine';

function assertClose(actual: number, expected: number, relTol = 1e-3, label = '') {
  const diff = Math.abs(actual - expected);
  const scale = Math.max(1e-9, Math.abs(expected));
  assert.ok(
    diff / scale <= relTol,
    `${label}: esperado ${expected}, obtenido ${actual} (rel=${(diff / scale).toExponential(2)})`
  );
}

test('Boltzmann N=2, N=4, N=40, N=200 combinatoria exacta sin overflow y suma = 1', () => {
  const n2 = solveBoltzmannBox(2, 1);
  assert.equal(n2.ok, true);
  if (n2.ok) {
    assert.deepEqual(
      n2.value.rows.map((r) => r.probability),
      [0.25, 0.5, 0.25]
    );
  }

  const n4 = solveBoltzmannBox(4, 2);
  assert.equal(n4.ok, true);
  if (n4.ok) {
    const probs = n4.value.rows.map((r) => Math.round(r.probability * 16));
    assert.deepEqual(probs, [1, 4, 6, 4, 1]);
  }

  const n200 = solveBoltzmannBox(200, 100);
  assert.equal(n200.ok, true);
  if (n200.ok) {
    const sumP = n200.value.rows.reduce((acc, r) => acc + r.probability, 0);
    assertClose(sumP, 1.0, 1e-6, 'N=200 suma P(n)');
    assert.ok(Number.isFinite(n200.value.centerRow.logOmega));
  }

  const eq = solveTwoSystemEquilibrium(13, 4, 6);
  assert.equal(eq.rows.length, 14);
  const sumEq = eq.rows.reduce((a, r) => a + r.probability, 0);
  assertClose(sumEq, 1.0, 1e-9, 'Equilibrio térmico suma P');
});

test('Gas ideal procesos cerrados, tobera e interpolación lineal', () => {
  const interp = linearInterpolate(200, 2800, 220, 2840, 210);
  assert.equal(interp.ok, true);
  if (interp.ok) {
    assertClose(interp.value.alpha, 0.5, 1e-9);
    assertClose(interp.value.y, 2820, 1e-9);
  }

  const isoBar = solveIdealGasClosedProcess({
    process: 'isobaric',
    mKg: 1,
    p1KPa: 150,
    V1M3: 0.2,
    T1C: 27,
    V2M3: 0.5,
  });
  assert.equal(isoBar.ok, true);
  if (isoBar.ok) {
    assertClose(isoBar.value.WbKJ, 45, 1e-6, 'W_b isobárico 150*0.3=45');
  }

  const rigid = solveIdealGasClosedProcess({
    process: 'isochoric',
    mKg: 2,
    p1KPa: 100,
    V1M3: 0.5,
    T1C: 26.85,
    V2M3: 0.5,
  });
  assert.equal(rigid.ok, true);
  if (rigid.ok) {
    assert.equal(rigid.value.WbKJ, 0);
  }

  const nozzle = solveAdiabaticNozzle(320, 290, 30);
  assert.equal(nozzle.ok, true);
  if (nozzle.ok) {
    assertClose(nozzle.value.V2Ms, Math.sqrt(30 * 30 + 2000 * 30), 1e-6);
  }
});

test('MEC110_7 casos Carnot, frigorífico, sandías y máquina de hielo', () => {
  // Carnot 500/200 kJ, TL = 17 °C
  const c500 = solveCarnotEngine({
    mode: 'carnot-ideal',
    QHKJ: 500,
    QLKJ: 200,
    TH_C: 400,
    TL_C: 17,
    solveTHFromQRatio: true,
  });
  assert.equal(c500.ok, true);
  if (c500.ok) {
    assertClose(c500.value.etaThermal, 0.6, 1e-6, 'Carnot 500/200 eta');
    assertClose(c500.value.TH_K, 725.375, 1e-5, 'Carnot 500/200 TH_K');
  }

  // Kelvin-Planck rechazo QL <= 0
  const kp = solveCarnotEngine({
    mode: 'general-engine',
    QHKJ: 500,
    QLKJ: 0,
    TH_C: 500,
    TL_C: 20,
  });
  assert.equal(kp.ok, false);
  if (!kp.ok) assert.equal(kp.error.code, 'SECOND_LAW_VIOLATION');

  // Frigorífico intermitente
  const fr = solveIntermittentFridge({ qLAvgKJH: 1200, activeFraction: 0.25, copR: 2.5 });
  assert.equal(fr.ok, true);
  if (fr.ok) {
    assertClose(fr.value.wActiveW, 533.3333, 1e-3, 'Frigorífico W_activo');
  }

  // 5 sandías
  const wm = solveWatermelonCooling({
    count: 5,
    massEachKg: 10,
    TInitialC: 20,
    TFinalC: 8,
    cpKJkgK: 4.184,
    electricPowerW: 450,
    copR: 4.5,
  });
  assert.equal(wm.ok, true);
  if (wm.ok) {
    assertClose(wm.value.elapsedMinutes, 20.6617, 1e-3, 'Sandías tiempo min');
  }

  // Máquina de hielo
  const ice = solveIceMaker({
    massFlowKgH: 12,
    TWaterInC: 15,
    TIceOutC: -5,
    copR: 2.4,
  });
  assert.equal(ice.ok, true);
  if (ice.ok) {
    assertClose(ice.value.qTotalKJkg, 407.01, 1e-4, 'Hielo q_total');
    assertClose(ice.value.wDotInW, 565.2917, 1e-3, 'Hielo W_in');
  }
});

test('MEC110_8 Brayton ideal, real 85%, óptimo rp* y 2 etapas', () => {
  const bIdeal = solveBrayton({
    mode: 'simple',
    p1KPa: 100,
    p2KPa: 480,
    T1C: 20,
    T3C: 880,
    etaC: 1.0,
    etaT: 1.0,
    epsRegen: 0,
  });
  assert.equal(bIdeal.ok, true);
  if (bIdeal.ok) {
    assertClose(bIdeal.value.etaThermal * 100, 36.1208, 1e-3, 'Brayton ideal eta');
    assertClose(bIdeal.value.wNetKJkg, 252.018, 1e-3, 'Brayton ideal wNet');
    assert.ok(
      bIdeal.value.tsCurve.every((pt) => pt.s >= -0.5 && pt.s <= 3.0),
      'Brayton T-s curve entropy must stay bounded'
    );
  }

  const bReal = solveBrayton({
    mode: 'simple',
    p1KPa: 100,
    p2KPa: 480,
    T1C: 20,
    T3C: 880,
    etaC: 0.85,
    etaT: 0.85,
    epsRegen: 0,
  });
  assert.equal(bReal.ok, true);
  if (bReal.ok) {
    assertClose(bReal.value.etaThermal * 100, 23.91, 5e-3, 'Brayton real 85% eta');
    assertClose(bReal.value.wNetKJkg, 159.83, 5e-3, 'Brayton real 85% wNet');
    // Si empeora η_c, T2a sube y w_c sube
    assert.ok(bReal.value.wcKJkg > (bIdeal.ok ? bIdeal.value.wcKJkg : 0));
  }

  const bOpt = solveBrayton({
    mode: 'simple',
    p1KPa: 100,
    p2KPa: 900,
    T1C: 473 - 273.15,
    T3C: 1700 - 273.15,
    etaC: 1,
    etaT: 1,
    epsRegen: 0,
  });
  assert.equal(bOpt.ok, true);
  if (bOpt.ok) {
    assertClose(bOpt.value.rpOptWork, Math.pow(1700 / 473, 1.75), 1e-6, 'rp* óptimo');
  }

  const twoStage = solveBrayton({
    mode: 'two-stage-compression',
    p1KPa: 100,
    p2KPa: 900,
    T1C: 20,
    T3C: 880,
    etaC: 1,
    etaT: 1,
    epsRegen: 0,
  });
  assert.equal(twoStage.ok, true);
  if (twoStage.ok) {
    assertClose(twoStage.value.piOptKPa, 300, 1e-6, 'sqrt(100*900)=300 kPa');
  }
});

test('MEC110_9 Rankine 4A, 4B recalentamiento y 4C dual Referencia/IF97 4x4', () => {
  // 4A ideal
  const r4aIdeal = solveRankine({
    mode: 'simple',
    pBoilerMPa: 10,
    TBoilerC: 500,
    pCondKPa: 10,
    etaTurbine: 1,
    etaPump: 1,
    netPowerMW: 300,
  });
  assert.equal(r4aIdeal.ok, true);
  if (r4aIdeal.ok) {
    assertClose(r4aIdeal.value.etaThermal * 100, 40.19, 1e-2, '4A ideal eta');
    assertClose(r4aIdeal.value.massFlowBoilerKgS, 235.2, 1e-2, '4A ideal mDot');
    assert.equal(r4aIdeal.value.states[2].quality, null); // Estado 3 sobrecalentado sin x
  }

  // 4A real 85%
  const r4aReal = solveRankine({
    mode: 'simple',
    pBoilerMPa: 10,
    TBoilerC: 500,
    pCondKPa: 10,
    etaTurbine: 0.85,
    etaPump: 0.85,
    netPowerMW: 300,
  });
  assert.equal(r4aReal.ok, true);
  if (r4aReal.ok) {
    assertClose(r4aReal.value.etaThermal * 100, 34.08, 1e-2, '4A real 85% eta');
    assertClose(r4aReal.value.massFlowBoilerKgS, 277.6, 1e-2, '4A real 85% mDot');
  }

  // 4B recalentamiento 9 MPa, 500 C, 10 kPa, x >= 0.90
  const r4b = solveRankine({
    mode: 'reheat',
    pBoilerMPa: 9,
    TBoilerC: 500,
    TReheatC: 500,
    pCondKPa: 10,
    etaTurbine: 1,
    etaPump: 1,
    netPowerMW: 100,
    targetMinQuality: 0.9,
    massFlowFixedKgS: 25,
  });
  assert.equal(r4b.ok, true);
  if (r4b.ok) {
    assert.ok(r4b.value.pReheatMPa !== undefined && r4b.value.pReheatMPa > 2.0 && r4b.value.pReheatMPa < 2.3);
    assertClose(r4b.value.etaThermal * 100, 41.2, 1.5e-2, '4B eta');
  }

  // 4C modo referencia de cátedra (matriz 4x4)
  const r4cRef = solveRankine({
    mode: 'regenerative-4c',
    pBoilerMPa: 12.5,
    TBoilerC: 550,
    pCacMPa: 0.8,
    pCaaMPa: 0.3,
    pCondKPa: 10,
    etaTurbine: 1,
    etaPump: 1,
    netPowerMW: 250,
    regenSubmode: 'lecture-reference',
  });
  assert.equal(r4cRef.ok, true);
  if (r4cRef.ok && r4cRef.value.matrixAudit4C) {
    const [m8, m9, m10, m11] = r4cRef.value.matrixAudit4C.lectureFlows;
    assertClose(m8, 198.488, 1e-3, '4C ref m8');
    assertClose(m9, 15.533, 1e-3, '4C ref m9');
    assertClose(m10, 27.287, 1e-3, '4C ref m10');
    assertClose(m11, 155.668, 1e-3, '4C ref m11');
    assert.ok(r4cRef.value.matrixAudit4C.lectureResidualMax < 1e-7, '4C ref residuo LU');
    assert.equal(r4cRef.value.audit.validationStatus, 'inconsistente');
  }

  // 4C modo consistencia física IF97
  const r4cPhys = solveRankine({
    mode: 'regenerative-4c',
    pBoilerMPa: 12.5,
    TBoilerC: 550,
    pCacMPa: 0.8,
    pCaaMPa: 0.3,
    pCondKPa: 10,
    etaTurbine: 1,
    etaPump: 1,
    netPowerMW: 250,
    regenSubmode: 'if97-consistent',
  });
  assert.equal(r4cPhys.ok, true);
  if (r4cPhys.ok && r4cPhys.value.matrixAudit4C) {
    assertClose(r4cPhys.value.matrixAudit4C.physicalWB2, 13.09, 2e-2, '4C w_B2 físico ~ 13.09 kJ/kg');
    assert.ok(r4cPhys.value.matrixAudit4C.physicalResidualMax < 1e-6, '4C IF97 residuo LU');
    assert.equal(r4cPhys.value.audit.validationStatus, 'verificado');
    assert.ok(Math.abs(r4cPhys.value.audit.overallEnergyResidualKW) < 1e-4, '4C cierre balance energía');
  }
});
