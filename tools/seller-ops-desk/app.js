import {
  STORAGE_KEY, parseSellerReport, summarizeOrders, calculateUnitEconomics,
  dueDateState, mergeOrders, exportOrdersCsv, exportWorkspace, importWorkspace, isCancelled, normalizeWorkspace
} from './core.js';

const $ = id => document.getElementById(id);
const emptyState = () => ({ orders: [], calls: [], tasks: [] });
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeSaved(JSON.parse(raw)) : emptyState();
  } catch {
    return emptyState();
  }
}
function normalizeSaved(value) {
  return normalizeWorkspace(value);
}
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    toast('Could not save. Browser storage may be full; export a backup and remove older records.');
    return false;
  }
}
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}
function id() {
  return globalThis.crypto?.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2));
}
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.hidden = true; }, 3200);
}
function money(value, currency) {
  const n = Number(value) || 0;
  if (!currency || currency === 'Unspecified') return n.toFixed(2);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return n.toFixed(2) + ' ' + currency;
  }
}
function labelDue(date) {
  const key = dueDateState(date);
  const names = { overdue: 'Overdue', today: 'Due today', upcoming: 'Upcoming', unscheduled: 'No date' };
  return '<span class="due-label due-' + key + '">' + names[key] + '</span>';
}
function renderOrders() {
  const query = $('order-search').value.trim().toLowerCase();
  const filter = $('status-filter').value;
  const filtered = state.orders.filter(order => {
    if (filter === 'cancelled' && !isCancelled(order)) return false;
    if (filter === 'active' && isCancelled(order)) return false;
    const text = [order.orderId, order.sku, order.asin, order.title, order.marketplace, order.status].join(' ').toLowerCase();
    return !query || text.includes(query);
  });
  $('orders-count').textContent = filtered.length + ' line item' + (filtered.length === 1 ? '' : 's');
  $('orders-body').innerHTML = filtered.length ? filtered.slice(0, 300).map(order =>
    '<tr><td class="order-id">' + esc(order.orderId) + '</td><td>' + esc(order.date || '—') + '</td>' +
    '<td><strong>' + esc(order.title || 'Untitled item') + '</strong><small>' + esc(order.marketplace || '') + '</small></td>' +
    '<td><span>' + esc(order.sku || '—') + '</span><small>' + esc(order.asin || '') + '</small></td>' +
    '<td><span class="status-pill ' + (isCancelled(order) ? 'status-cancelled' : 'status-active') + '">' + esc(order.status || 'Unknown') + '</span></td>' +
    '<td class="numeric">' + esc(order.quantity ?? 0) + '</td><td class="numeric">' + esc(money(order.itemPrice, order.currency)) + '</td></tr>'
  ).join('') : '<tr><td class="empty-cell" colspan="7">' + (state.orders.length ? 'No rows match those filters.' : 'No report loaded yet.') + '</td></tr>';
  $('order-badge').textContent = String(state.orders.length);
}
function renderCalls() {
  const list = $('calls-list');
  $('call-badge').textContent = String(state.calls.filter(x => !x.done).length);
  const items = [...state.calls].sort((a,b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')));
  list.innerHTML = items.length ? items.map(item =>
    '<article class="record-row ' + (item.done ? 'record-done' : '') + '">' +
    '<div class="record-main"><strong>' + esc(item.contact) + '</strong><p>' + esc(item.purpose) + '</p><div class="record-meta"><span class="priority priority-' + esc(item.priority) + '">' + esc(item.priority) + '</span>' + labelDue(item.dueDate) + '</div></div>' +
    '<div class="record-actions">' + (item.done ? '' : '<button class="icon-button" type="button" data-action="done-call" data-id="' + esc(item.id) + '" aria-label="Mark follow-up done">✓</button>') +
    '<button class="icon-button danger-icon" type="button" data-action="remove-call" data-id="' + esc(item.id) + '" aria-label="Delete follow-up">×</button></div></article>'
  ).join('') : '<p class="empty-note">No follow-ups yet. Add internal supplier or partner actions here.</p>';
}
function renderTasks() {
  const list = $('tasks-list');
  $('task-badge').textContent = String(state.tasks.filter(x => !x.done).length);
  const items = [...state.tasks].sort((a,b) => Number(Boolean(a.done)) - Number(Boolean(b.done)) || String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')));
  list.innerHTML = items.length ? items.map(item =>
    '<article class="record-row ' + (item.done ? 'record-done' : '') + '">' +
    '<button class="task-check" type="button" data-action="toggle-task" data-id="' + esc(item.id) + '" aria-label="' + (item.done ? 'Reopen task' : 'Complete task') + '">' + (item.done ? '✓' : '') + '</button>' +
    '<div class="record-main"><strong>' + esc(item.title) + '</strong><p>' + esc(item.kind || 'Other') + '</p><div class="record-meta">' + labelDue(item.dueDate) + '</div></div>' +
    '<div class="record-actions"><button class="icon-button danger-icon" type="button" data-action="remove-task" data-id="' + esc(item.id) + '" aria-label="Delete task">×</button></div></article>'
  ).join('') : '<p class="empty-note">No tasks yet. Keep the next action visible.</p>';
}
function renderMetrics() {
  const summary = summarizeOrders(state.orders);
  $('metric-orders').textContent = summary.orders.toLocaleString();
  $('metric-units').textContent = summary.units.toLocaleString();
  const revenues = Object.entries(summary.revenueByCurrency);
  $('metric-revenue').textContent = revenues.length
    ? revenues.map(([currency, amount]) => money(amount, currency)).join(' · ')
    : '—';
  $('metric-revenue').classList.toggle('metric-value-long', revenues.length > 1);
  $('metric-followups').textContent = String(state.calls.filter(x => !x.done).length + state.tasks.filter(x => !x.done).length);
}
function render() {
  renderOrders();
  renderCalls();
  renderTasks();
  renderMetrics();
}
function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function renderEconomics() {
  const form = $('economics-form');
  const data = Object.fromEntries(new FormData(form).entries());
  const currency = data.currency || 'USD';
  for (const key of Object.keys(data)) if (key !== 'currency') data[key] = Number(data[key]);
  try {
    const result = calculateUnitEconomics(data);
    $('econ-net').textContent = money(result.net, currency);
    $('econ-net').classList.toggle('negative', result.net < 0);
    $('econ-margin').textContent = result.marginPct.toFixed(1) + '% contribution margin';
    $('econ-referral').textContent = money(result.referralFee, currency);
    $('econ-costs').textContent = money(result.totalCosts, currency);
    $('econ-break-even').textContent = Number.isFinite(result.breakEvenPrice) ? money(result.breakEvenPrice, currency) : 'Not finite';
    $('econ-error').textContent = '';
  } catch (error) {
    $('econ-error').textContent = error.message;
  }
}

$('report-file').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    $('import-message').textContent = 'This file exceeds 10 MB. Export a smaller report and try again.';
    event.target.value = '';
    return;
  }
  try {
    const parsed = parseSellerReport(await file.text());
    const merged = mergeOrders(state.orders, parsed.orders);
    state.orders = merged.orders;
    persist(); render();
    $('import-message').textContent = 'Imported ' + parsed.orders.length + ' sanitized rows from ' + file.name + '; ' + merged.added + ' new rows added. ' + 'The source file is not retained.';
    $('report-warnings').hidden = parsed.warnings.length === 0;
    $('report-warnings').innerHTML = parsed.warnings.map(w => '<p>' + esc(w) + '</p>').join('');
    toast('Report parsed locally. Buyer contact columns were ignored.');
  } catch (error) {
    $('import-message').textContent = error.message || 'Could not parse this report.';
    $('report-warnings').hidden = true;
  } finally {
    event.target.value = '';
  }
});
$('order-search').addEventListener('input', renderOrders);
$('status-filter').addEventListener('change', renderOrders);

$('call-form').addEventListener('submit', event => {
  event.preventDefault();
  state.calls.push({
    id: id(), contact: $('call-contact').value.trim(), purpose: $('call-purpose').value.trim(),
    dueDate: $('call-date').value, priority: $('call-priority').value, done: false, createdAt: new Date().toISOString()
  });
  if (persist()) { event.target.reset(); render(); toast('Follow-up added to this browser.'); }
});
$('task-form').addEventListener('submit', event => {
  event.preventDefault();
  state.tasks.push({
    id: id(), title: $('task-title').value.trim(), dueDate: $('task-date').value,
    kind: $('task-kind').value, done: false, createdAt: new Date().toISOString()
  });
  if (persist()) { event.target.reset(); render(); toast('Task added to this browser.'); }
});
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const key = button.dataset.action;
  const itemId = button.dataset.id;
  if (key === 'done-call') state.calls = state.calls.map(item => item.id === itemId ? { ...item, done: true } : item);
  if (key === 'toggle-task') state.tasks = state.tasks.map(item => item.id === itemId ? { ...item, done: !item.done } : item);
  if (key === 'remove-call') state.calls = state.calls.filter(item => item.id !== itemId);
  if (key === 'remove-task') state.tasks = state.tasks.filter(item => item.id !== itemId);
  persist(); render();
});
$('export-backup').addEventListener('click', () => {
  download('seller-ops-backup.json', exportWorkspace(state), 'application/json');
});
$('export-csv').addEventListener('click', () => {
  if (!state.orders.length) { toast('Import a report before exporting orders.'); return; }
  download('seller-ops-sanitized-orders.csv', exportOrdersCsv(state.orders), 'text/csv;charset=utf-8');
});
$('import-backup').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('Backup exceeds 5 MB.');
    state = importWorkspace(await file.text());
    persist(); render(); toast('Backup restored locally.');
  } catch (error) {
    toast(error.message || 'Could not restore the backup.');
  } finally {
    event.target.value = '';
  }
});
$('clear-workspace').addEventListener('click', () => {
  if (!confirm('Clear all imported orders, calls, and tasks from this browser? Export a backup first if you need one.')) return;
  state = emptyState();
  localStorage.removeItem(STORAGE_KEY);
  $('report-warnings').hidden = true;
  $('import-message').textContent = 'Workspace cleared. Import a report when you are ready.';
  render();
  toast('This browser workspace was cleared.');
});
$('load-sample').addEventListener('click', () => {
  if (state.orders.length || state.calls.length || state.tasks.length) {
    if (!confirm('Add synthetic examples to the current workspace?')) return;
  }
  const sample = [
    { orderId: 'DEMO-1001', date: '2026-10-20', sku: 'MUG-BLUE', asin: 'B0DEMO001', title: 'Blue travel mug', quantity: 2, itemPrice: 29.98, currency: 'USD', status: 'Shipped', marketplace: 'US' },
    { orderId: 'DEMO-1002', date: '2026-10-21', sku: 'MUG-RED', asin: 'B0DEMO002', title: 'Red travel mug', quantity: 1, itemPrice: 14.99, currency: 'USD', status: 'Unshipped', marketplace: 'US' },
    { orderId: 'DEMO-1003', date: '2026-10-22', sku: 'BAG-GRAY', asin: 'B0DEMO003', title: 'Compact day bag', quantity: 1, itemPrice: 39.00, currency: 'USD', status: 'Cancelled', marketplace: 'US' }
  ];
  for (const item of sample) item.key = [item.orderId, item.sku, item.date, item.quantity, item.itemPrice, item.currency].join('|');
  state.orders = mergeOrders(state.orders, sample).orders;
  if (!state.calls.length) state.calls.push({ id: id(), contact: 'Example supplier', purpose: 'Confirm next replenishment date', dueDate: new Date().toISOString().slice(0,10), priority: 'normal', done: false });
  if (!state.tasks.length) state.tasks.push({ id: id(), title: 'Review stock cover for the demo SKU', kind: 'Inventory', dueDate: new Date(Date.now() + 86400000).toISOString().slice(0,10), done: false });
  persist(); render();
  $('import-message').textContent = 'Synthetic sample loaded. These rows are fictional examples, not actual sales.';
  toast('Synthetic examples loaded.');
});
$('economics-form').addEventListener('input', renderEconomics);

render();
renderEconomics();
