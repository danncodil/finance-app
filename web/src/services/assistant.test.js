import test from 'node:test';
import assert from 'node:assert/strict';
import { localDate, transactionPayload } from './assistant.js';

const categories = [{ id: 'food', name: 'Alimentação', type: 'expense', profile_type: 'personal' }];
const proposal = { amount: 1, description: 'Bombom', transaction_date: '2026-09-09', transaction_type: 'expense', profile_type: 'personal', category_id: 'food', project_id: null, entry_kind: 'single', clarification: null };

test('a single bombom becomes an exact BRL expense with the interpreted date', () => {
  const payload = transactionPayload(proposal, 'personal', categories);
  assert.equal(payload.amount, '1.00'); assert.equal(payload.type, 'expense');
  assert.equal(payload.transaction_date, '2026-09-09'); assert.equal(payload.category_id, 'food');
  assert.equal(payload.type_recurrence, 'unique');
});
test('uses local calendar date instead of slicing UTC', () => {
  assert.equal(localDate(new Date(2026, 8, 9, 23, 59)), '2026-09-09');
});
test('never saves incomplete, ambiguous or unsupported proposals', () => {
  for (const change of [{ amount: null }, { amount: 0 }, { amount: -1 }, { amount: 1.234 }, { amount: Infinity }, { transaction_date: '2026-02-30' }, { transaction_date: '' }, { transaction_type: 'transfer' }, { entry_kind: 'multiple' }, { entry_kind: 'recurring' }, { entry_kind: undefined }, { clarification: 'Qual foi o valor?' }]) {
    assert.throws(() => transactionPayload({ ...proposal, ...change }, 'personal', categories));
  }
});
test('requires category ownership and type, and preserves active profile', () => {
  assert.throws(() => transactionPayload({ ...proposal, category_id: 'foreign' }, 'personal', categories));
  assert.throws(() => transactionPayload({ ...proposal, transaction_type: 'income' }, 'personal', categories));
  assert.throws(() => transactionPayload(proposal, 'business', categories));
  assert.throws(() => transactionPayload({ ...proposal, project_id: 'foreign' }, 'personal', categories));
});
test('business project must exist and personal categories cannot cross profiles', () => {
  const data = { ...proposal, profile_type: 'business', project_id: 'p1' };
  assert.throws(() => transactionPayload(data, 'business', categories, [{ id: 'p1' }]));
  const businessCategories = categories.map(c => ({ ...c, profile_type: 'business' }));
  assert.throws(() => transactionPayload(data, 'business', businessCategories, []));
  assert.equal(transactionPayload(data, 'business', businessCategories, [{ id: 'p1' }]).project_id, 'p1');
});
