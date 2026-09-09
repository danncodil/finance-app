export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function transactionPayload(data, profile, categories, projects = []) {
  if (data.clarification || data.entry_kind !== 'single') {
    throw new Error(data.clarification || 'A análise não está pronta. Atualize a página e tente novamente.');
  }
  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount < 0.01 || amount > 999999999.99 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.0001) {
    throw new Error('Informe um valor maior que zero, com até duas casas decimais.');
  }
  if (data.profile_type !== profile) throw new Error('O perfil mudou. Analise a frase novamente no perfil desejado.');
  if (!['income', 'expense'].includes(data.transaction_type)) throw new Error('Informe se é uma receita ou despesa.');
  const date = data.transaction_date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Number.isFinite(Date.parse(`${date}T12:00:00Z`)) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new Error('Informe uma data válida para o lançamento.');
  }
  const description = data.description?.trim();
  if (!description || description.length > 500) throw new Error('Informe uma descrição de até 500 caracteres.');
  if (!categories.some(c => c.id === data.category_id && c.type === data.transaction_type && c.profile_type === profile)) {
    throw new Error('Selecione uma categoria compatível com o lançamento.');
  }
  if (data.project_id && (profile !== 'business' || !projects.some(p => p.id === data.project_id))) {
    throw new Error('Selecione um projeto válido para o perfil Negócio.');
  }
  return {
    amount: amount.toFixed(2), description, transaction_date: date,
    type: data.transaction_type, category_id: data.category_id,
    type_recurrence: 'unique', profile_type: profile, project_id: data.project_id || null,
  };
}
