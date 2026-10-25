import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectDelimiter, parseDelimited, parseSellerReport, summarizeOrders,
  calculateUnitEconomics, dueDateState, mergeOrders, csvCell,
  exportWorkspace, importWorkspace
} from '../core.js';

test('detects common report delimiters', () => {
  assert.equal(detectDelimiter('order-id,sku\n1,A'), ',');
  assert.equal(detectDelimiter('order-id\tsku\n1\tA'), '\t');
  assert.equal(detectDelimiter('order-id;sku\n1;A'), ';');
  assert.equal(detectDelimiter('"Product, Name"\tquantity\ttotal'), '\t');
});

test('parses BOM, CRLF, quoted delimiters, and escaped quotes', () => {
  const rows = parseDelimited('\uFEFFid,name,note\r\n1,"Example, Ltd.","said ""hello"""\r\n');
  assert.deepEqual(rows, [['id','name','note'],['1','Example, Ltd.','said "hello"']]);
});

test('imports order report columns and intentionally drops buyer-contact fields', () => {
  const report = [
    'order-id\tpurchase-date\tproduct-name\tsku\tquantity\titem-price\tcurrency\torder-status\tbuyer-email\tbuyer-phone',
    'ORDER-1\t2026-10-20\t"Blue Mug"\tMUG-BLUE\t2\t29.98\tUSD\tShipped\tbuyer@example.invalid\t+15550000000',
    'ORDER-2\t2026-10-21\tRed Mug\tMUG-RED\t1\t14.99\tUSD\tCancelled\tanother@example.invalid\t+15550000001'
  ].join('\n');
  const result = parseSellerReport(report);
  assert.equal(result.delimiter, '\t');
  assert.equal(result.orders.length, 2);
  assert.equal(result.orders[0].orderId, 'ORDER-1');
  assert.equal(result.orders[0].quantity, 2);
  assert.equal(result.orders[0].itemPrice, 29.98);
  assert.equal(result.orders[0].title, 'Blue Mug');
  assert.equal('buyerEmail' in result.orders[0], false);
  assert.equal('buyerPhone' in result.orders[0], false);
  assert.equal(JSON.stringify(result.orders).includes('buyer@example.invalid'), false);
});

test('parses European-style comma-decimal amounts in semicolon reports', () => {
  const result = parseSellerReport('order-id;quantity;item-price\nEU-1;1;1.234,56\nEU-2;1;12,5');
  assert.equal(result.orders[0].itemPrice, 1234.56);
  assert.equal(result.orders[1].itemPrice, 12.5);
});

test('requires an order identifier and rejects malformed quoted rows', () => {
  assert.throws(() => parseSellerReport('sku,quantity\nA,2'), /order ID column/i);
  assert.throws(() => parseDelimited('id,name\n1,"unterminated'), /unterminated quoted field/i);
});

test('keeps rows with invalid numbers but reports missing or invalid data visibly', () => {
  const result = parseSellerReport('order-id,quantity,item-price\nA,nope,not-money');
  assert.equal(result.orders[0].quantity, 0);
  assert.equal(result.orders[0].itemPrice, 0);
});

test('summarizes active order count, units, currencies and cancellations', () => {
  const summary = summarizeOrders([
    { orderId: 'A', quantity: 2, itemPrice: 20, currency: 'USD', status: 'Shipped' },
    { orderId: 'A', quantity: 1, itemPrice: 10, currency: 'USD', status: 'Shipped' },
    { orderId: 'B', quantity: 5, itemPrice: 45, currency: 'EUR', status: 'Cancelled' },
    { orderId: 'C', quantity: 1, itemPrice: 8, currency: 'EUR', status: 'Pending' }
  ]);
  assert.equal(summary.orders, 2);
  assert.equal(summary.lineItems, 3);
  assert.equal(summary.units, 4);
  assert.deepEqual(summary.revenueByCurrency, { USD: 30, EUR: 8 });
  assert.equal(summary.cancelledLines, 1);
});

test('calculates product contribution and break-even price', () => {
  const result = calculateUnitEconomics({ sellingPrice: 30, unitCost: 10, referralRatePct: 15, fulfillmentCost: 5, shippingCost: 1, adCost: 2 });
  assert.equal(result.referralFee, 4.5);
  assert.equal(result.totalCosts, 22.5);
  assert.equal(result.net, 7.5);
  assert.equal(result.marginPct, 25);
  assert.ok(Math.abs(result.breakEvenPrice - (18 / .85)) < 1e-9);
});

test('rejects invalid costs and does not invent finite break-even at a 100% fee', () => {
  assert.throws(() => calculateUnitEconomics({ sellingPrice: -1 }), /non-negative/i);
  assert.throws(() => calculateUnitEconomics({ sellingPrice: 'nope' }), /non-negative/i);
  assert.throws(() => calculateUnitEconomics({ sellingPrice: 10, unitCost: 1, referralRatePct: 101 }), /100 or less/i);
  const result = calculateUnitEconomics({ sellingPrice: 10, unitCost: 1, referralRatePct: 100 });
  assert.equal(result.breakEvenPrice, Infinity);
});

test('classifies dated and unscheduled follow-ups', () => {
  const today = new Date('2026-10-25T12:00:00');
  assert.equal(dueDateState('2026-10-24', today), 'overdue');
  assert.equal(dueDateState('2026-10-25', today), 'today');
  assert.equal(dueDateState('2026-10-26', today), 'upcoming');
  assert.equal(dueDateState('', today), 'unscheduled');
});

test('deduplicates re-imported order rows', () => {
  const existing = [{ key: 'A|sku|date|1|10|USD', orderId: 'A' }];
  const result = mergeOrders(existing, [
    { key: 'A|sku|date|1|10|USD', orderId: 'A' },
    { key: 'B|sku2|date|1|20|USD', orderId: 'B' }
  ]);
  assert.equal(result.added, 1);
  assert.equal(result.orders.length, 2);
});

test('CSV export quotes fields and neutralizes spreadsheet formulas', () => {
  assert.equal(csvCell('safe, value'), '"safe, value"');
  assert.equal(csvCell('"quoted"'), '"""quoted"""');
  assert.equal(csvCell('=1+1'), '"' + "'=1+1" + '"');
  assert.equal(csvCell('@SUM(A1:A3)'), '"' + "'@SUM(A1:A3)" + '"');
});

test('exports versioned local backups and rejects malformed or newer formats', () => {
  const state = { orders: [{ orderId: 'A', sku: 'SKU-A' }], calls: [{ id: 'C', contact: 'Supplier', purpose: 'Confirm stock' }], tasks: [{ id: 'T', title: 'Review inventory' }] };
  const backup = exportWorkspace(state);
  const restored = importWorkspace(backup);
  assert.equal(restored.orders[0].orderId, 'A');
  assert.equal(restored.calls.length, 1);
  assert.equal(restored.tasks.length, 1);
  assert.throws(() => importWorkspace('{broken'), /valid JSON/i);
  assert.throws(() => importWorkspace('{"schemaVersion":999}'), /Unsupported backup version/i);
});


test('restored backups strip unapproved order fields and bound stored text', () => {
  const malicious = {
    schemaVersion: 1,
    orders: [{
      orderId: 'ORD-1', sku: 'SKU-1', title: 'Example',
      buyerEmail: 'buyer@example.invalid',
      buyerPhone: '+15550000000',
      buyerAddress: '10 Example Street',
      arbitrarySecret: 'must never persist'
    }],
    calls: [{ id: 'C1', contact: 'Supplier', purpose: 'Check ETA', unexpectedField: 'strip me' }],
    tasks: [{ id: 'T1', title: 'Restock', secret: 'strip this too' }]
  };
  const restored = importWorkspace(JSON.stringify(malicious));
  assert.equal(restored.orders.length, 1);
  assert.equal('buyerEmail' in restored.orders[0], false);
  assert.equal('buyerPhone' in restored.orders[0], false);
  assert.equal('buyerAddress' in restored.orders[0], false);
  assert.equal('arbitrarySecret' in restored.orders[0], false);
  assert.equal('unexpectedField' in restored.calls[0], false);
  assert.equal('secret' in restored.tasks[0], false);
  assert.equal(JSON.stringify(restored).includes('buyer@example.invalid'), false);
});
