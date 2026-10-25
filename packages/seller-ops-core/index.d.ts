export type SellerOrder = {
  orderId: string;
  date: string;
  sku: string;
  asin: string;
  title: string;
  quantity: number;
  itemPrice: number;
  currency: string;
  status: string;
  marketplace: string;
  key: string;
};
export type SellerReport = {
  delimiter: string;
  orders: SellerOrder[];
  warnings: string[];
  sourceRows: number;
};
export type UnitEconomicsInput = {
  sellingPrice: number;
  unitCost: number;
  referralRatePct: number;
  fulfillmentCost: number;
  shippingCost: number;
  adCost: number;
};
export type UnitEconomicsResult = {
  sellingPrice: number;
  referralFee: number;
  totalCosts: number;
  net: number;
  marginPct: number;
  breakEvenPrice: number;
};
export type SellerWorkspace = {
  orders: SellerOrder[];
  calls: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
};
export function detectDelimiter(text: string): string;
export function parseDelimited(text: string, delimiter?: string): string[][];
export function parseSellerReport(text: string): SellerReport;
export function isCancelled(order: Partial<SellerOrder>): boolean;
export function summarizeOrders(orders: Partial<SellerOrder>[]): {
  lineItems: number;
  orders: number;
  units: number;
  revenueByCurrency: Record<string, number>;
  unitsByCurrency: Record<string, number>;
  cancelledLines: number;
};
export function calculateUnitEconomics(input: UnitEconomicsInput): UnitEconomicsResult;
export function dueDateState(dateString?: string, today?: Date): "overdue" | "today" | "upcoming" | "unscheduled";
export function normalizeWorkspace(value: unknown): SellerWorkspace;
export function mergeOrders(existing: SellerOrder[], incoming: SellerOrder[]): { orders: SellerOrder[]; added: number };
export function csvCell(value: unknown): string;
export function exportOrdersCsv(orders: Partial<SellerOrder>[]): string;
export function exportWorkspace(state: unknown): string;
export function importWorkspace(text: string): SellerWorkspace;
