export function transactionsCsv(data) {
  const cell = value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const rows = [['ID', 'Data', 'Tipo', 'Categoria', 'Valor', 'Descrição', 'Perfil', 'Projeto']];
  for (const tx of data.transactions || []) {
    const category = data.categories?.find(c => c.id === tx.category_id);
    const project = data.projects?.find(p => p.id === tx.project_id);
    rows.push([tx.id, tx.transaction_date?.split('-').reverse().join('/'),
      tx.type === 'income' ? 'Receita' : 'Despesa', category?.name || 'Sem Categoria',
      tx.amount, tx.description, tx.profile_type === 'business' ? 'PJ' : 'PF', project?.name || '']);
  }
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
