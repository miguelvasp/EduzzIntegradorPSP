export type MercadoPagoPagingResponse = {
  total?: number;
  limit?: number;
  offset?: number;
};

export type MercadoPagoFeeDetailResponse = {
  type?: string;
  amount?: number;
  fee_payer?: string;
};

export type MercadoPagoPayerIdentificationResponse = {
  type?: string;
  number?: string;
};

export type MercadoPagoPayerResponse = {
  id?: string | number;
  email?: string;
  first_name?: string;
  last_name?: string;
  identification?: MercadoPagoPayerIdentificationResponse;
};

export type MercadoPagoPaymentResponse = {
  id?: string | number;
  date_created?: string;
  date_approved?: string;
  date_last_updated?: string;
  payment_type_id?: string;
  status?: string;
  status_detail?: string;
  currency_id?: string;
  transaction_amount?: number;
  net_received_amount?: number;
  total_paid_amount?: number;
  installments?: number;
  fee_details?: MercadoPagoFeeDetailResponse[];
  payer?: MercadoPagoPayerResponse;
};

export type MercadoPagoSearchPaymentsResponse = {
  paging?: MercadoPagoPagingResponse;
  results?: MercadoPagoPaymentResponse[];
};

export type MercadoPagoSearchPaymentsParams = {
  offset: number;
  limit: number;
};

export function isMercadoPagoPaymentResponse(value: unknown): value is MercadoPagoPaymentResponse {
  return Boolean(value && typeof value === 'object');
}

export function isMercadoPagoSearchPaymentsResponse(
  value: unknown,
): value is MercadoPagoSearchPaymentsResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as MercadoPagoSearchPaymentsResponse;

  if (candidate.results !== undefined && !Array.isArray(candidate.results)) {
    return false;
  }

  if (candidate.paging !== undefined && typeof candidate.paging !== 'object') {
    return false;
  }

  return true;
}
