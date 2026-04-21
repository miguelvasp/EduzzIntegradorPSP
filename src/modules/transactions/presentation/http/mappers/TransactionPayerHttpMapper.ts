import type { TransactionPayerDto } from '../../../application/dto/TransactionPayerDto';

export class TransactionPayerHttpMapper {
  public map(payer: TransactionPayerDto): TransactionPayerDto {
    return {
      id: payer.id,
      externalId: payer.externalId,
      name: payer.name,
      email: payer.email,
      documentType: payer.documentType,
      hasDocument: payer.hasDocument,
    };
  }
}
