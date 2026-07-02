import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_FUNCTIONS, activeFunctionId } from '../../src/view/appFunctions.js';

test('APP_FUNCTIONS: prima voce è Reputazione attiva', () => {
  const first = APP_FUNCTIONS[0];
  assert.equal(first.id, 'reputazione');
  assert.equal(first.routeName, 'facing');
  assert.equal(first.status, 'active');
});

test('APP_FUNCTIONS: esiste una voce generica "Altro" in arrivo', () => {
  const altro = APP_FUNCTIONS.find((f) => f.id === 'altro');
  assert.ok(altro);
  assert.equal(altro.status, 'soon');
  assert.equal(altro.routeName, null);
});

test('activeFunctionId: route "facing" → reputazione', () => {
  const id = activeFunctionId('facing');
  assert.equal(id, 'reputazione');
});

test('activeFunctionId: route "characters" → reputazione', () => {
  const id = activeFunctionId('characters');
  assert.equal(id, 'reputazione');
});

test('activeFunctionId: route "profile" → reputazione', () => {
  const id = activeFunctionId('profile');
  assert.equal(id, 'reputazione');
});

test('activeFunctionId: route sconosciuta → null', () => {
  const id = activeFunctionId('notfound');
  assert.equal(id, null);
});
