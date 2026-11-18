import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cToK,
  kToC,
  toPa,
  fromPa,
  toWatts,
  fromWatts,
  toKgPerS,
  checkFormulaDimensions,
  gageToAbsolutePa,
} from './units';

test('Conversiones SI fundamentales y escalas absolutas', () => {
  assert.equal(cToK(20), 293.15);
  assert.equal(kToC(293.15), 20);
  assert.equal(toPa(2.5, 'MPa'), 2_500_000);
  assert.equal(fromPa(2_500_000, 'kPa'), 2500);
  assert.equal(toWatts(300, 'MW'), 300_000_000);
  assert.ok(Math.abs(fromWatts(565.3, 'kW') - 0.5653) < 1e-12);
  assert.ok(Math.abs(toKgPerS(12, 'kg/h') - 12 / 3600) < 1e-12);
  assert.ok(Math.abs(gageToAbsolutePa(200e3, 101.3e3) - 301.3e3) < 1e-6);
});

test('Verificador dimensional detecta Celsius en Carnot y manométrica en gas ideal', () => {
  const carnotBad = checkFormulaDimensions('Carnot=1-TL/TH', { TL: 'degC', TH: 'degC' });
  assert.equal(carnotBad.valid, false);

  const carnotGood = checkFormulaDimensions('Carnot=1-TL/TH', { TL: 'K', TH: 'K' });
  assert.equal(carnotGood.valid, true);

  const gasBad = checkFormulaDimensions('PV=mRT', { p: 'kPa_man', V: 'm3', T: 'K' });
  assert.equal(gasBad.valid, false);

  const pumpGood = checkFormulaDimensions('w=vDp', { v: 'm3/kg', dp: 'kPa' });
  assert.equal(pumpGood.valid, true);
  assert.equal(pumpGood.resultingUnit, 'kJ/kg');
});
