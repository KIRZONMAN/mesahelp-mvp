'use strict';
// Filtros exclusivamente visuales sobre tickets autorizados por el servidor.
// Los controles no se reemplazan durante la sincronización Live.
(() => {
  const panel = document.querySelector('[data-ticket-explorer]');
  if (!panel) return;
  const search = panel.querySelector('[data-explorer-search]');
  const status = panel.querySelector('[data-explorer-status]');
  const category = panel.querySelector('[data-explorer-category]');
  const priority = panel.querySelector('[data-explorer-priority]');
  const sort = panel.querySelector('[data-explorer-sort]');
  const count = panel.querySelector('[data-explorer-count]');
  const clear = panel.querySelector('[data-explorer-clear]');

  // Permite buscar "tecnico" sin escribir el acento de "técnico".
  const normalize = text => String(text || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');

  const priorityOrder = {baja: 1, media: 2, alta: 3};
  // La tabla ya contiene exclusivamente tickets autorizados por el servidor.
  // Ordenamos esos mismos nodos: no solicitamos ni exponemos registros adicionales.
  function orderRows(zone, rows) {
    const body = zone.querySelector('[data-explorer-body]');
    if (!body) return;
    const byRecent = (a, b) => String(b.dataset.updated || '').localeCompare(String(a.dataset.updated || '')) ||
      Number(b.dataset.ticketId || 0) - Number(a.dataset.ticketId || 0);
    const mode = sort.value;
    rows.sort((a, b) => {
      if (mode === 'oldest') return -byRecent(a, b);
      if (mode === 'priority-high' || mode === 'priority-low') {
        const difference = (priorityOrder[b.dataset.priority] || 0) - (priorityOrder[a.dataset.priority] || 0);
        return (mode === 'priority-high' ? difference : -difference) || byRecent(a, b);
      }
      return byRecent(a, b);
    });
    rows.forEach(row => body.appendChild(row));
  }

  function prepare(zone) {
    if (!zone) return { total: 0, shown: 0 };
    const rows = [...zone.querySelectorAll('[data-explorer-row]')];
    const term = normalize(search.value.trim());
    const selectedStatus = status.value;
    const selectedCategory = category.value;
    const selectedPriority = priority.value;
    orderRows(zone, rows);
    let shown = 0;
    for (const row of rows) {
      const match = (!term || normalize(row.dataset.search).includes(term)) &&
        (!selectedStatus || row.dataset.state === selectedStatus) &&
        (!selectedCategory || row.dataset.category === selectedCategory) &&
        (!selectedPriority || row.dataset.priority === selectedPriority);
      row.hidden = !match;
      if (match) shown++;
    }
    const table = zone.querySelector('[data-explorer-table]');
    const empty = zone.querySelector('[data-explorer-empty]');
    if (table) table.hidden = rows.length > 0 && shown === 0;
    if (empty) empty.hidden = rows.length === 0 || shown > 0;
    return { total: rows.length, shown };
  }

  function refresh(zone = document.querySelector('[data-live-zone]')) {
    const {total, shown} = prepare(zone);
    count.textContent = `${shown} de ${total} ${total === 1 ? 'ticket' : 'tickets'}`;
    clear.disabled = !search.value && !status.value && !category.value && !priority.value && sort.value === 'recent';
  }

  search.addEventListener('input', () => refresh());
  status.addEventListener('change', () => refresh());
  category.addEventListener('change', () => refresh());
  priority.addEventListener('change', () => refresh());
  sort.addEventListener('change', () => refresh());
  clear.addEventListener('click', () => {
    search.value = '';
    status.value = '';
    category.value = '';
    priority.value = '';
    sort.value = 'recent';
    refresh();
    search.focus();
  });
  window.MesaHelpExplorer = { prepare, refresh };
  panel.hidden = false;
  refresh();
})();
