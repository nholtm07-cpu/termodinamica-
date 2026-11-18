import test from 'node:test';
import assert from 'node:assert/strict';
import { iapwsIF97Provider, getRealSaturationDome } from './if97';

function assertClose(actual: number, expected: number, relTol = 1e-6, label = '') {
  const diff = Math.abs(actual - expected);
  const scale = Math.max(1e-12, Math.abs(expected));
  assert.ok(
    diff / scale <= relTol,
    `${label}: esperado ${expected}, obtenido ${actual} (rel=${(diff / scale).toExponential(2)})`
  );
}

test('IAPWS-IF97 Región 1 puntos de verificación oficiales (Tabla 5)', () => {
  // Punto 1: T = 300 K, p = 3 MPa
  const r1a = iapwsIF97Provider.solvePT('water', 3e6, 300);
  assert.equal(r1a.ok, true);
  if (r1a.ok) {
    assertClose(r1a.value.vM3kg, 0.100215168e-2, 1e-6, 'R1(300K,3MPa) v');
    assertClose(r1a.value.hJkg / 1e3, 0.115331273e3, 1e-6, 'R1(300K,3MPa) h');
    assertClose(r1a.value.sJkgK / 1e3, 0.392294792, 1e-6, 'R1(300K,3MPa) s');
  }

  // Punto 2: T = 300 K, p = 80 MPa
  const r1b = iapwsIF97Provider.solvePT('water', 80e6, 300);
  assert.equal(r1b.ok, true);
  if (r1b.ok) {
    assertClose(r1b.value.vM3kg, 0.971180894e-3, 1e-6, 'R1(300K,80MPa) v');
    assertClose(r1b.value.hJkg / 1e3, 0.184142828e3, 1e-6, 'R1(300K,80MPa) h');
    assertClose(r1b.value.sJkgK / 1e3, 0.368563852, 1e-6, 'R1(300K,80MPa) s');
  }

  // Punto 3: T = 500 K, p = 3 MPa
  const r1c = iapwsIF97Provider.solvePT('water', 3e6, 500);
  assert.equal(r1c.ok, true);
  if (r1c.ok) {
    assertClose(r1c.value.vM3kg, 0.1202418e-2, 1e-6, 'R1(500K,3MPa) v');
    assertClose(r1c.value.hJkg / 1e3, 0.975542239e3, 1e-6, 'R1(500K,3MPa) h');
    assertClose(r1c.value.sJkgK / 1e3, 0.258041912e1, 1e-6, 'R1(500K,3MPa) s');
  }
});

test('IAPWS-IF97 Región 2 puntos de verificación oficiales (Tabla 15)', () => {
  // Punto 1: T = 300 K, p = 0.0035 MPa
  const r2a = iapwsIF97Provider.solvePT('water', 0.0035e6, 300);
  assert.equal(r2a.ok, true);
  if (r2a.ok) {
    assertClose(r2a.value.vM3kg, 0.394913866e2, 1e-6, 'R2(300K,0.0035MPa) v');
    assertClose(r2a.value.hJkg / 1e3, 0.254991145e4, 1e-6, 'R2(300K,0.0035MPa) h');
    assertClose(r2a.value.sJkgK / 1e3, 0.852238967e1, 1e-6, 'R2(300K,0.0035MPa) s');
  }

  // Punto 2: T = 700 K, p = 0.0035 MPa
  const r2b = iapwsIF97Provider.solvePT('water', 0.0035e6, 700);
  assert.equal(r2b.ok, true);
  if (r2b.ok) {
    assertClose(r2b.value.vM3kg, 0.923015898e2, 1e-6, 'R2(700K,0.0035MPa) v');
    assertClose(r2b.value.hJkg / 1e3, 0.333568375e4, 1e-6, 'R2(700K,0.0035MPa) h');
    assertClose(r2b.value.sJkgK / 1e3, 0.101749996e2, 1e-6, 'R2(700K,0.0035MPa) s');
  }

  // Punto 3: T = 700 K, p = 30 MPa
  const r2c = iapwsIF97Provider.solvePT('water', 30e6, 700);
  assert.equal(r2c.ok, true);
  if (r2c.ok) {
    assertClose(r2c.value.vM3kg, 0.542946619e-2, 1e-6, 'R2(700K,30MPa) v');
    assertClose(r2c.value.hJkg / 1e3, 0.263149474e4, 1e-6, 'R2(700K,30MPa) h');
    assertClose(r2c.value.sJkgK / 1e3, 0.517540298e1, 1e-6, 'R2(700K,30MPa) s');
  }
});

test('IAPWS-IF97 Región 4 saturación y estados de ciclo 4A/4B/4C', () => {
  const sat300 = iapwsIF97Provider.saturationT('water', 300);
  assert.equal(sat300.ok, true);
  if (sat300.ok) {
    assertClose(sat300.value.pSatPa / 1e6, 0.353658941e-2, 1e-6, 'psat(300K)');
  }

  const sat10kPa = iapwsIF97Provider.saturationP('water', 10e3);
  assert.equal(sat10kPa.ok, true);
  if (sat10kPa.ok) {
    assertClose(sat10kPa.value.TSatK, 273.15 + 45.81, 1e-3, 'Tsat(10kPa)');
    assertClose(sat10kPa.value.liquid.hJkg / 1e3, 191.81, 1e-3, 'hf(10kPa)');
  }

  // Estado 4A entrada turbina: 10 MPa, 500 °C -> h ~ 3375.1 kJ/kg, s ~ 6.5995
  const s4a = iapwsIF97Provider.solvePT('water', 10e6, 500 + 273.15);
  assert.equal(s4a.ok, true);
  if (s4a.ok) {
    assert.equal(s4a.value.phase, 'superheated-vapor');
    assert.equal(s4a.value.quality, null); // Nunca mostrar x en sobrecalentado
    assertClose(s4a.value.hJkg / 1e3, 3375.1, 1e-3, '4A h(10MPa,500C)');
    assertClose(s4a.value.sJkgK / 1e3, 6.5995, 1e-3, '4A s(10MPa,500C)');
  }

  // Inversión solvePS en mezcla
  const psMix = iapwsIF97Provider.solvePS('water', 10e3, 6599.5);
  assert.equal(psMix.ok, true);
  if (psMix.ok) {
    assert.equal(psMix.value.phase, 'two-phase');
    assert.ok(psMix.value.quality !== null && psMix.value.quality > 0.78 && psMix.value.quality < 0.81);
  }

  const dome = getRealSaturationDome(20);
  assert.equal(dome.length, 21);
  assert.ok(dome[0].sfKJkgK < dome[0].sgKJkgK);
});

test('IAPWS-IF97 rechaza entradas fuera de dominio o fluido incorrecto', () => {
  const badFluid = iapwsIF97Provider.solvePT('R134a', 100e3, 300);
  assert.equal(badFluid.ok, false);
  if (!badFluid.ok) assert.equal(badFluid.error.code, 'UNSUPPORTED_FLUID');

  const badP = iapwsIF97Provider.solvePT('water', -50, 300);
  assert.equal(badP.ok, false);

  const badX = iapwsIF97Provider.solvePX('water', 10e3, 1.2);
  assert.equal(badX.ok, false);
  if (!badX.ok) assert.equal(badX.error.code, 'INVALID_QUALITY');
});
