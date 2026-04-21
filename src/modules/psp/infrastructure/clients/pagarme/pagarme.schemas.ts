export type PagarmePagingResponse = {
  total?: number;
  has_more?: boolean;
};

export type PagarmeCustomerResponse = {
  id?: string;
  name?: string;
  email?: string;
  document?: string;
  document_type?: string;
  type?: string;
};

export type PagarmeLastTransactionResponse = {
  id?: string;
  transaction_type?: string;
  amount?: number;
  installments?: number;
  status?: string;
  gateway_response?: {
    code?: string;
  };
};

export type PagarmeChargeResponse = {
  id?: string;
  amount?: number;
  paid_amount?: number;
  status?: string;
  payment_method?: string;
  last_transaction?: PagarmeLastTransactionResponse;
};

export type PagarmeOrderResponse = {
  id?: string;
  code?: string;
  amount?: number;
  currency?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  customer?: PagarmeCustomerResponse;
  charges?: PagarmeChargeResponse[];
};

export type PagarmeListOrdersResponse = {
  data?: PagarmeOrderResponse[];
  paging?: PagarmePagingResponse;
};

export type PagarmeListOrdersParams = {
  page: number;
  size: number;
};

export function isPagarmeOrderResponse(value: unknown): value is PagarmeOrderResponse {
  return Boolean(value && typeof value === 'object');
}

export function isPagarmeListOrdersResponse(value: unknown): value is PagarmeListOrdersResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as PagarmeListOrdersResponse;

  if (candidate.data !== undefined && !Array.isArray(candidate.data)) {
    return false;
  }

  if (candidate.paging !== undefined && typeof candidate.paging !== 'object') {
    return false;
  }

  return true;
}
