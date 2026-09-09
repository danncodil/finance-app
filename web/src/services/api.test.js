import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiBase, categoryService, projectService, goalService, reportService, transactionService, userService } from './api.js';
import { transactionsCsv } from './exportCsv.js';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
globalThis.window = new EventTarget();

test('API base includes v1 exactly once', () => {
  assert.equal(resolveApiBase(), '/api/v1');
  assert.equal(resolveApiBase('https://example.test/'), 'https://example.test/api/v1');
  assert.equal(resolveApiBase('https://example.test/api/v1/'), 'https://example.test/api/v1');
});

test('CRUD, password, export and PF/PJ contracts', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    return new Response(null, { status: 204 });
  };
  await projectService.update('project', { description: null, budget: null });
  await projectService.delete('project');
  await categoryService.list('business');
  await categoryService.create({ name: 'Clientes', profile_type: 'business' });
  await categoryService.update('category', { name: 'Clientes PJ' }, 'business');
  await categoryService.delete('category', 'business');
  await goalService.list('business');
  await goalService.create({ title: 'Viagem', target_amount: '100', profile_type: 'business' });
  await goalService.update('goal', { deadline: null }, 'business');
  await goalService.addFunds('goal', '10.25', 'business');
  await goalService.delete('goal', 'business');
  await transactionService.list('personal');
  await transactionService.list('business');
  await reportService.getSummary(9, 2026, 'business');
  await userService.updatePassword({ current_password: 'old', new_password: 'new' });
  await userService.exportData();
  assert.equal(calls[0].url, '/api/v1/projects/project');
  assert.deepEqual(JSON.parse(calls[0].body), { description: null, budget: null });
  assert.equal(calls[1].method, 'DELETE');
  assert.equal(calls[2].url, '/api/v1/categories?profile_type=business');
  assert.equal(JSON.parse(calls[3].body).profile_type, 'business');
  assert.equal(calls[4].url, '/api/v1/categories/category?profile_type=business');
  assert.equal(calls[5].url, '/api/v1/categories/category?profile_type=business');
  assert.equal(calls[6].url, '/api/v1/goals?profile_type=business');
  assert.equal(JSON.parse(calls[7].body).profile_type, 'business');
  assert.equal(calls[8].url, '/api/v1/goals/goal?profile_type=business');
  assert.deepEqual(JSON.parse(calls[9].body), { amount_to_add: '10.25' });
  assert.equal(calls[10].url, '/api/v1/goals/goal?profile_type=business');
  assert.equal(calls[11].url, '/api/v1/transactions?profile=personal');
  assert.equal(calls[12].url, '/api/v1/transactions?profile=business');
  assert.equal(calls[13].url, '/api/v1/reports/summary?month=9&year=2026&profile_type=business');
  assert.deepEqual(JSON.parse(calls[14].body), { current_password: 'old', new_password: 'new' });
  assert.equal(calls[15].url, '/api/v1/users/export/data');
});

test('API preserves structured and plain-text errors', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: 'CONFLICT', message: 'Em uso' } }), { status: 409 });
  await assert.rejects(projectService.delete('id'), e => e.status === 409 && e.code === 'CONFLICT' && e.message === 'Em uso');
  globalThis.fetch = async () => new Response('Invalid date', { status: 422 });
  await assert.rejects(goalService.create({}), e => e.status === 422 && e.message === 'Invalid date');
});

test('simultaneous 401 responses share one refresh rotation', async () => {
  storage.set('access_token', 'old');
  storage.set('refresh_token', 'refresh');
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/refresh')) {
      refreshes++;
      await new Promise(resolve => setTimeout(resolve, 10));
      return Response.json({ access_token: 'new', refresh_token: 'next' });
    }
    return options.headers.Authorization === 'Bearer new'
      ? Response.json([]) : new Response(null, { status: 401 });
  };
  await Promise.all([goalService.list(), projectService.list()]);
  assert.equal(refreshes, 1);
  assert.equal(storage.get('refresh_token'), 'next');
});

test('CSV preserves date, quotes, newlines, profile and neutralizes formulas', () => {
  const csv = transactionsCsv({ categories: [{ id: 'c', name: '=formula' }], transactions: [{
    id: '1', category_id: 'c', transaction_date: '2026-09-07', type: 'expense',
    amount: '12.50', description: 'Texto "aspas"\nlinha', profile_type: 'business'
  }] });
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"07/09/2026"'));
  assert.ok(csv.includes('"Texto ""aspas""\nlinha"'));
  assert.ok(csv.includes('"\'=formula"'));
  assert.ok(csv.includes('"PJ"'));
});

test('temporary refresh errors preserve the session and API message', async () => {
  storage.set('access_token', 'old');
  storage.set('refresh_token', 'refresh');
  globalThis.fetch = async url => url.endsWith('/auth/refresh')
    ? new Response('Serviço temporariamente indisponível', { status: 503 })
    : new Response(null, { status: 401 });
  await assert.rejects(goalService.list(), e => e.status === 503 && e.message.includes('temporariamente'));
  assert.equal(storage.get('refresh_token'), 'refresh');
});

test('invalid refresh expires the session', async () => {
  let expired = false;
  window.addEventListener('auth-expired', () => { expired = true; }, { once: true });
  globalThis.fetch = async () => new Response(null, { status: 401 });
  await assert.rejects(goalService.list(), e => e.status === 401);
  assert.equal(expired, true);
  assert.equal(storage.get('access_token'), undefined);
});
