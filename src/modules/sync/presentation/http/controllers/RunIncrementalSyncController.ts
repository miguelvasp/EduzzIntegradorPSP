import type { FastifyReply, FastifyRequest } from 'fastify';
import { ValidationError } from '../../../../shared/application/errors';
import { PspType, type PspType as PspTypeValue } from '../../../../shared/domain/enums/pspType';
import { ErrorCode } from '../../../../shared/domain/error-codes/errorCode';
import type { SyncExecutionFactory } from '../../../application/services/SyncExecutionFactory';
import type { RunIncrementalSyncUseCase } from '../../../application/use-cases/RunIncrementalSyncUseCase';
import { SyncExecutionHttpMapper } from '../sync.presenters';

type RunIncrementalSyncBody = {
  psp?: string;
  pageLimit?: number;
  itemLimit?: number;
  dryRun?: boolean;
  verbose?: boolean;
};

type RunIncrementalSyncRequest = FastifyRequest<{
  Body: RunIncrementalSyncBody;
}>;

export class RunIncrementalSyncController {
  public constructor(
    private readonly syncExecutionFactory: SyncExecutionFactory,
    private readonly runIncrementalSyncUseCase: RunIncrementalSyncUseCase,
    private readonly syncExecutionHttpMapper: SyncExecutionHttpMapper,
  ) {}

  public async handle(request: RunIncrementalSyncRequest, reply: FastifyReply): Promise<void> {
    const targetPsp = this.parsePsp(request.body?.psp);

    const context = this.syncExecutionFactory.create({
      correlationId: request.requestId,
      triggeredBy: 'http',
      targetPsp,
      mode: request.body?.verbose ? 'verbose' : 'standard',
      verbose: request.body?.verbose ?? false,
      pageLimit: request.body?.pageLimit,
      itemLimit: request.body?.itemLimit,
      dryRun: request.body?.dryRun ?? false,
    });

    const result = await this.runIncrementalSyncUseCase.execute(context);

    reply.status(200).send(this.syncExecutionHttpMapper.map(result));
  }

  private parsePsp(value?: string): PspTypeValue | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === 'pagarme') {
      return PspType.PAGARME;
    }

    if (normalized === 'mercadopago' || normalized === 'mercado_pago') {
      return PspType.MERCADO_PAGO;
    }

    throw new ValidationError({
      message: 'Unsupported PSP value',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        field: 'psp',
        value,
      },
    });
  }
}
