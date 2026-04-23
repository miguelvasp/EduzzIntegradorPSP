import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DomainError,
  InternalError,
  NotFoundError,
  ValidationError,
} from '../../modules/shared/application/errors';
import { ErrorCode } from '../../modules/shared/domain/error-codes/errorCode';

const buildContainerMock = vi.fn();

vi.mock('../../app/container', () => ({
  buildContainer: buildContainerMock,
}));

vi.mock('../../app/container/index', () => ({
  buildContainer: buildContainerMock,
}));

function createContainerMock() {
  return {
    persistence: {
      transactionQueryRepository: {} as never,
      installmentQueryRepository: {} as never,
      payerQueryRepository: {} as never,
    },
    syncExecutionFactory: {
      create: vi.fn(),
    },
    runSyncUseCase: {
      execute: vi.fn(),
    },
    runIncrementalSyncUseCase: {
      execute: vi.fn(),
    },
  };
}

describe('error handler integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    buildContainerMock.mockReset();
  });

  it('deve retornar 400 para ValidationError', async () => {
    buildContainerMock.mockResolvedValue(createContainerMock());

    const { createServer } = await import('../../app/server/createServer.js');
    const app = createServer();

    app.get('/__test/validation', async () => {
      throw new ValidationError({
        message: 'Invalid query params',
        details: {
          field: 'status',
        },
      });
    });

    await app.ready();

    const response = await request(app.server).get('/__test/validation');

    expect(response.status).toBe(400);
    expect(response.body.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    expect(response.body.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(response.body.message).toBe('Invalid query params');
    expect(response.body.path).toBe('/__test/validation');
    expect(response.body.requestId).toBeTruthy();
    expect(response.body.timestamp).toBeTruthy();
    expect(response.body.details).toEqual({
      field: 'status',
    });

    await app.close();
  });

  it('deve retornar 404 para NotFoundError', async () => {
    buildContainerMock.mockResolvedValue(createContainerMock());

    const { createServer } = await import('../../app/server/createServer.js');
    const app = createServer();

    app.get('/__test/not-found', async () => {
      throw new NotFoundError({
        message: 'Transaction not found',
      });
    });

    await app.ready();

    const response = await request(app.server).get('/__test/not-found');

    expect(response.status).toBe(404);
    expect(response.body.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
    expect(response.body.code).toBe(ErrorCode.NOT_FOUND);
    expect(response.body.message).toBe('Transaction not found');
    expect(response.body.path).toBe('/__test/not-found');
    expect(response.body.requestId).toBeTruthy();
    expect(response.body.timestamp).toBeTruthy();

    await app.close();
  });

  it('deve retornar 422 para DomainError', async () => {
    buildContainerMock.mockResolvedValue(createContainerMock());

    const { createServer } = await import('../../app/server/createServer.js');
    const app = createServer();

    app.get('/__test/domain', async () => {
      throw new DomainError({
        message: 'Installments are incomplete',
        code: ErrorCode.INCOMPLETE_INSTALLMENTS,
      });
    });

    await app.ready();

    const response = await request(app.server).get('/__test/domain');

    expect(response.status).toBe(422);
    expect(response.body.status).toBe(422);
    expect(response.body.error).toBe('Unprocessable Entity');
    expect(response.body.code).toBe(ErrorCode.INCOMPLETE_INSTALLMENTS);
    expect(response.body.message).toBe('Installments are incomplete');
    expect(response.body.path).toBe('/__test/domain');
    expect(response.body.requestId).toBeTruthy();
    expect(response.body.timestamp).toBeTruthy();

    await app.close();
  });

  it('deve retornar 500 seguro para erro inesperado', async () => {
    buildContainerMock.mockResolvedValue(createContainerMock());

    const { createServer } = await import('../../app/server/createServer.js');
    const app = createServer();

    app.get('/__test/unexpected', async () => {
      throw new Error('database exploded with stack and internal detail');
    });

    await app.ready();

    const response = await request(app.server).get('/__test/unexpected');

    expect(response.status).toBe(500);
    expect(response.body.status).toBe(500);
    expect(response.body.error).toBe('Internal Server Error');
    expect(response.body.code).toBe(ErrorCode.INFRASTRUCTURE_ERROR);
    expect(response.body.message).toBe('Internal server error');
    expect(response.body.path).toBe('/__test/unexpected');
    expect(response.body.requestId).toBeTruthy();
    expect(response.body.timestamp).toBeTruthy();
    expect(response.body.details).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain('database exploded');

    await app.close();
  });

  it('nao deve vazar dado sensivel em details expostos', async () => {
    buildContainerMock.mockResolvedValue(createContainerMock());

    const { createServer } = await import('../../app/server/createServer.js');
    const app = createServer();

    app.get('/__test/sensitive-details', async () => {
      throw new ValidationError({
        message: 'Invalid payer payload',
        details: {
          document: '123.456.789-01',
          email: 'user@example.com',
          token: 'secret-token',
          safe: 'ok',
        },
      });
    });

    await app.ready();

    const response = await request(app.server).get('/__test/sensitive-details');

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual({
      document: '[DOCUMENT_REDACTED]',
      email: '[MASKED_EMAIL]',
      token: '[REDACTED]',
      safe: 'ok',
    });

    await app.close();
  });

  it('deve respeitar requestId e correlationId enviados no header', async () => {
    buildContainerMock.mockResolvedValue(createContainerMock());

    const { createServer } = await import('../../app/server/createServer.js');
    const app = createServer();

    app.get('/__test/request-id', async () => {
      throw new InternalError();
    });

    await app.ready();

    const response = await request(app.server)
      .get('/__test/request-id')
      .set('x-request-id', 'req-test-123')
      .set('x-correlation-id', 'corr-test-456');

    expect(response.status).toBe(500);
    expect(response.body.requestId).toBe('req-test-123');

    await app.close();
  });
});
