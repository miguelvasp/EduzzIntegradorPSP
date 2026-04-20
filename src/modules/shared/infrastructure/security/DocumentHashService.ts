import { createHash } from 'node:crypto';

export class DocumentHashService {
  public static normalize(value: string): string {
    return value.replace(/\D/g, '').trim();
  }

  public static hash(value: string, salt?: string): string {
    const normalized = this.normalize(value);

    if (!normalized) {
      throw new Error('Document value is required for hashing');
    }

    const input = salt ? `${salt}:${normalized}` : normalized;

    return createHash('sha256').update(input).digest('hex');
  }

  public static hasDocument(value: string | null | undefined): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    return this.normalize(value).length > 0;
  }
}
