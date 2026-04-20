export interface MoneyValueObject {
  amountInCents: number;
}

export interface CreateMoneyInput {
  amountInCents: number;
}

export function createMoneyValueObject(input: CreateMoneyInput): MoneyValueObject {
  if (!Number.isInteger(input.amountInCents) || input.amountInCents < 0) {
    throw new Error('Money amount must be a non-negative integer in cents');
  }

  return {
    amountInCents: input.amountInCents,
  };
}
