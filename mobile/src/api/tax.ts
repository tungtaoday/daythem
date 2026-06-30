import api from './client';

export type TaxSummary = {
  year: number;
  total_collected: number;
  threshold: number;
  taxable_amount: number;
  tax_owed: number;
  status: 'exempt' | 'taxable';
  by_month: { month: string; amount: number }[];
  by_class: { class_name: string; amount: number }[];
  summary_text: string;
};

export type TaxDeclaration = {
  year: number;
  fields: Record<string, any>;
  declaration_text: string;
};

export const getTaxSummary = (year: number): Promise<TaxSummary> =>
  api.get('/tax/summary', { params: { year } }).then(r => r.data);

export const getTaxDeclaration = (year: number): Promise<TaxDeclaration> =>
  api.get('/tax/declaration', { params: { year } }).then(r => r.data);
