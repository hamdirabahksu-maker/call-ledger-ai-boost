export const STORAGE_KEY = 'seller-ops-desk:v1';

export function detectDelimiter(text) {
  const line = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0] || '';
  const counts = { ',': 0, '\t': 0, ';': 0 };
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { i++; continue; }
      quoted = !quoted;
      continue;
    }
    if (!quoted && Object.hasOwn(counts, ch)) counts[ch]++;
  }
  const choices = [',', '\t', ';'];
  let best = '\t', max = 0;
  for (const sep of choices) {
    if (counts[sep] > max) { max = counts[sep]; best = sep; }
  }
  return max === 0 ? '\t' : best;
}

export function parseDelimited(text, delimiter = detectDelimiter(text)) {
  const input = String(text || '').replace(/^\uFEFF/, '');
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) { if (ch === '"' && input[i + 1] === '"') { field += '"'; i++; } else if (ch === '"') quoted = false; else field += ch; }
    else if (ch === '"' && field.length === 0) quoted = true;
    else if (ch === delimiter) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && input[i + 1] === '\n') i++; row.push(field); field = ''; if (row.some(v => v.trim())) rows.push(row); row = []; }
    else field += ch;
  }
  if (quoted) throw new Error('Unterminated quoted field.');
  row.push(field); if (row.some(v => v.trim())) rows.push(row); return rows;
}


const FIELD_ALIASES = {
  orderId: ['order-id', 'amazon-order-id', 'order id', 'orderid', 'merchant-order-id'],
  date: ['purchase-date', 'purchase date', 'order-date', 'order date', 'posted-date', 'date'],
  sku: ['sku', 'seller-sku', 'seller sku', 'merchant-sku'],
  asin: ['asin', 'product-id', 'product id'],
  title: ['product-name', 'product name', 'title', 'item-title', 'item title'],
  quantity: ['quantity', 'quantity-purchased', 'quantity purchased', 'units'],
  itemPrice: ['item-price', 'item price', 'itemprice', 'product-sales', 'product sales', 'total-item-price'],
  currency: ['currency', 'currency-code', 'currency code'],
  status: ['order-status', 'order status', 'status'],
  marketplace: ['sales-channel', 'sales channel', 'marketplace-name', 'marketplace name', 'marketplace']
};

function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase().replace(/[\uFEFF]/g, '').replace(/[_\s]+/g, '-');
}
function amount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  let text = String(value ?? '').trim().replace(/[$£€\s]/g, '');
  if (!text) return 0;
  if (text.startsWith('(') && text.endsWith(')')) text = '-' + text.slice(1, -1);
  const comma = text.lastIndexOf(',');
  const dot = text.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    if (comma > dot) {
      text = text.replace(/\./g, '').replace(/,(?=[^,]*$)/, '.').replace(/,/g, '');
    } else {
      text = text.replace(/,/g, '');
    }
  } else if (comma >= 0) {
    if (/,[0-9]{1,2}$/.test(text)) {
      text = text.replace(/,(?=[^,]*$)/, '.').replace(/,/g, '');
    } else {
      text = text.replace(/,/g, '');
    }
  } else if ((text.match(/\./g) || []).length > 1) {
    const lastDot = text.lastIndexOf('.');
    if (/\.[0-9]{1,2}$/.test(text)) {
      text = text.slice(0, lastDot).replace(/\./g, '') + text.slice(lastDot);
    } else {
      text = text.replace(/\./g, '');
    }
  }
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}
function rowKey(order) {
  return [order.orderId, order.sku, order.date, order.quantity, order.itemPrice, order.currency].map(v => String(v ?? '').trim()).join('|');
}

export function parseSellerReport(text) {
  const delimiter = detectDelimiter(text);
  const rows = parseDelimited(text, delimiter);
  if (rows.length < 2) throw new Error('The report has no order rows.');
  const headers = rows[0].map(normalizeHeader);
  const indexes = {};
  for (const [key, aliases] of Object.entries(FIELD_ALIASES)) {
    indexes[key] = headers.findIndex(h => aliases.some(a => normalizeHeader(a) === h));
  }
  if (indexes.orderId < 0) throw new Error('Could not find an order ID column.');
  const warnings = [];
  if (indexes.quantity < 0) warnings.push('No quantity column was found; units are shown as zero.');
  if (indexes.itemPrice < 0) warnings.push('No item price column was found; revenue is shown as zero.');
  const val = (r, key) => indexes[key] < 0 ? '' : String(r[indexes[key]] ?? '').trim();
  const orders = [];
  for (const r of rows.slice(1)) {
    const orderId = val(r, 'orderId');
    if (!orderId) continue;
    const item = {
      orderId,
      date: val(r, 'date'),
      sku: val(r, 'sku'),
      asin: val(r, 'asin'),
      title: val(r, 'title'),
      quantity: Math.max(0, amount(val(r, 'quantity'))),
      itemPrice: Math.max(0, amount(val(r, 'itemPrice'))),
      currency: val(r, 'currency') || 'Unspecified',
      status: val(r, 'status') || 'Unknown',
      marketplace: val(r, 'marketplace')
    };
    item.key = rowKey(item);
    orders.push(item);
  }
  if (!orders.length) throw new Error('No rows with an order ID were found.');
  return { delimiter, orders, warnings, sourceRows: rows.length - 1 };
}

export function isCancelled(order) {
  return /cancel|void/i.test(String(order.status || ''));
}

export function summarizeOrders(orders) {
  const active = (orders || []).filter(order => !isCancelled(order));
  const revenueByCurrency = {};
  const unitsByCurrency = {};
  for (const order of active) {
    const currency = order.currency || 'Unspecified';
    revenueByCurrency[currency] = (revenueByCurrency[currency] || 0) + (Number(order.itemPrice) || 0);
    unitsByCurrency[currency] = (unitsByCurrency[currency] || 0) + (Number(order.quantity) || 0);
  }
  return {
    lineItems: active.length,
    orders: new Set(active.map(order => order.orderId)).size,
    units: Object.values(unitsByCurrency).reduce((sum, value) => sum + value, 0),
    revenueByCurrency,
    unitsByCurrency,
    cancelledLines: (orders || []).length - active.length
  };
}


export function calculateUnitEconomics(input) {
  const values = ['sellingPrice', 'unitCost', 'referralRatePct', 'fulfillmentCost', 'shippingCost', 'adCost']
    .map(key => Number(input?.[key] ?? 0));
  if (values.some(value => !Number.isFinite(value) || value < 0)) {
    throw new Error('Enter valid non-negative numbers for costs and rates.');
  }
  const [price, cost, feeRate, fulfillment, shipping, ads] = values;
  if (feeRate > 100) throw new Error('Referral fee percentage must be 100 or less.');
  const referralFee = price * feeRate / 100;
  const totalCosts = cost + referralFee + fulfillment + shipping + ads;
  const net = price - totalCosts;
  return {
    sellingPrice: price, referralFee, totalCosts, net,
    marginPct: price > 0 ? net / price * 100 : 0,
    breakEvenPrice: feeRate >= 100 ? Infinity : (cost + fulfillment + shipping + ads) / (1 - feeRate / 100)
  };
}

export function dueDateState(dateString, today = new Date()) {
  if (!dateString) return 'unscheduled';
  const due = new Date(dateString + 'T00:00:00');
  if (Number.isNaN(due.getTime())) return 'unscheduled';
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const delta = Math.round((due - current) / 86400000);
  return delta < 0 ? 'overdue' : delta === 0 ? 'today' : 'upcoming';
}

function cleanString(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}
function cleanNumber(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function sanitizeOrder(item) {
  const order = {
    orderId: cleanString(item.orderId, 160),
    date: cleanString(item.date, 80),
    sku: cleanString(item.sku, 160),
    asin: cleanString(item.asin, 80),
    title: cleanString(item.title, 500),
    quantity: cleanNumber(item.quantity),
    itemPrice: cleanNumber(item.itemPrice),
    currency: cleanString(item.currency || 'Unspecified', 16),
    status: cleanString(item.status || 'Unknown', 80),
    marketplace: cleanString(item.marketplace, 120)
  };
  if (!order.orderId) return null;
  order.key = rowKey(order);
  return order;
}
function sanitizeRecord(item, fields) {
  const result = {};
  for (const [key, maxLength] of Object.entries(fields)) {
    const value = item[key];
    result[key] = key === 'done' ? Boolean(value) : cleanString(value, maxLength);
  }
  return result;
}

export function normalizeWorkspace(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Backup must be a JSON object.');
  }
  const safeArray = key => Array.isArray(value[key])
    ? value[key].filter(item => item && typeof item === 'object' && !Array.isArray(item))
    : [];
  const orders = safeArray('orders').map(sanitizeOrder).filter(Boolean);
  const calls = safeArray('calls').map(item => ({
    ...sanitizeRecord(item, { id: 100, contact: 100, purpose: 180, dueDate: 20, priority: 12, createdAt: 40 }),
    done: Boolean(item.done)
  })).filter(item => item.id && item.contact && item.purpose);
  const tasks = safeArray('tasks').map(item => ({
    ...sanitizeRecord(item, { id: 100, title: 180, dueDate: 20, kind: 40, createdAt: 40 }),
    done: Boolean(item.done)
  })).filter(item => item.id && item.title);
  return { orders, calls, tasks };
}

export function mergeOrders(existing, incoming) {
  const byKey = new Map();
  for (const item of existing || []) byKey.set(item.key || rowKey(item), item);
  let added = 0;
  for (const item of incoming || []) {
    const key = item.key || rowKey(item);
    if (!byKey.has(key)) { byKey.set(key, { ...item, key }); added++; }
  }
  return { orders: [...byKey.values()], added };
}

export function csvCell(value) {
  let text = String(value ?? '');
  if (/^\s*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function exportOrdersCsv(orders) {
  const fields = ['orderId', 'date', 'sku', 'asin', 'title', 'quantity', 'itemPrice', 'currency', 'status', 'marketplace'];
  const lines = [fields.join(',')];
  for (const order of orders || []) lines.push(fields.map(field => csvCell(order[field])).join(','));
  return lines.join('\r\n');
}

export function exportWorkspace(state) {
  return JSON.stringify({ schemaVersion: 1, ...normalizeWorkspace(state) }, null, 2);
}

export function importWorkspace(text) {
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('Backup is not valid JSON.'); }
  if (value?.schemaVersion !== 1) throw new Error('Unsupported backup version.');
  return normalizeWorkspace(value);
}
