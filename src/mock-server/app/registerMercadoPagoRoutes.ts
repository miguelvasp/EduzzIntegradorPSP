import type { FastifyInstance } from 'fastify';
import { applyFailureScenario } from '../utils/applyFailureScenario';
import { loadJsonDataset } from '../utils/loadJsonDataset';
import { paginateByOffsetAndLimit } from '../utils/pagination';
import { resolveScenarioDataset } from '../utils/resolveScenarioDataset';

type MercadoPagoPayment = {
  id: number;
  payment_type_id?: string;
  [key: string]: unknown;
};

export async function registerMercadoPagoRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/payments/search', async (request, reply) => {
    const query = request.query as {
      scenario?: string;
      failureMode?: string;
      payment_type_id?: string;
      offset?: string;
      limit?: string;
    };

    const handledFailure = await applyFailureScenario({
      request,
      reply,
      route: '/v1/payments/search',
      scenario: query.scenario,
      failureMode: query.failureMode,
    });

    if (handledFailure) {
      return reply;
    }

    const datasetPath = resolveScenarioDataset({
      provider: 'mercado-pago',
      scenario: query.scenario,
    });

    const payments = loadJsonDataset<MercadoPagoPayment[]>(datasetPath);
    const paymentTypeId = query.payment_type_id ?? 'credit_card';
    const offset = Number(query.offset ?? '0');
    const limit = Number(query.limit ?? '20');

    const filtered = payments.filter((item) => item.payment_type_id === paymentTypeId);

    const paginated = paginateByOffsetAndLimit(filtered, offset, limit);

    request.log.info({
      route: '/v1/payments/search',
      scenario: query.scenario ?? 'default',
      failureMode: query.failureMode,
      paymentTypeId,
      offset,
      limit,
      dataset: datasetPath,
      statusCode: 200,
    });

    return reply.status(200).send({
      results: paginated.data,
      paging: {
        total: paginated.total,
        limit: paginated.limit,
        offset: paginated.offset,
      },
    });
  });

  app.get('/v1/payments/:id', async (request, reply) => {
    const query = request.query as {
      scenario?: string;
      failureMode?: string;
    };

    const handledFailure = await applyFailureScenario({
      request,
      reply,
      route: '/v1/payments/:id',
      scenario: query.scenario,
      failureMode: query.failureMode,
    });

    if (handledFailure) {
      return reply;
    }

    const params = request.params as { id: string };
    const paymentId = Number(params.id);

    const datasetPath = resolveScenarioDataset({
      provider: 'mercado-pago',
      scenario: query.scenario,
    });

    const payments = loadJsonDataset<MercadoPagoPayment[]>(datasetPath);
    const payment = payments.find((item) => item.id === paymentId);

    request.log.info({
      route: '/v1/payments/:id',
      scenario: query.scenario ?? 'default',
      failureMode: query.failureMode,
      paymentId,
      dataset: datasetPath,
      statusCode: payment ? 200 : 404,
    });

    if (!payment) {
      return reply.status(404).send({
        message: 'Payment not found',
      });
    }

    return reply.status(200).send(payment);
  });
}
