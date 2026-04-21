import type { FastifyInstance } from 'fastify';
import { applyFailureScenario } from '../utils/applyFailureScenario';
import { loadJsonDataset } from '../utils/loadJsonDataset';
import { paginateByPageAndSize } from '../utils/pagination';
import { resolveScenarioDataset } from '../utils/resolveScenarioDataset';

type PagarmeOrder = {
  id: string;
  [key: string]: unknown;
};

export async function registerPagarmeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/core/v5/orders', async (request, reply) => {
    const query = request.query as {
      scenario?: string;
      failureMode?: string;
      page?: string;
      size?: string;
    };

    const handledFailure = await applyFailureScenario({
      request,
      reply,
      route: '/core/v5/orders',
      scenario: query.scenario,
      failureMode: query.failureMode,
    });

    if (handledFailure) {
      return reply;
    }

    const datasetPath = resolveScenarioDataset({
      provider: 'pagarme',
      scenario: query.scenario,
    });

    const orders = loadJsonDataset<PagarmeOrder[]>(datasetPath);
    const page = Number(query.page ?? '1');
    const size = Number(query.size ?? '20');
    const paginated = paginateByPageAndSize(orders, page, size);

    request.log.info({
      route: '/core/v5/orders',
      scenario: query.scenario ?? 'default',
      failureMode: query.failureMode,
      page,
      size,
      dataset: datasetPath,
      statusCode: 200,
    });

    return reply.status(200).send({
      data: paginated.data,
      paging: {
        total: paginated.total,
        has_more: paginated.hasMore,
      },
    });
  });

  app.get('/core/v5/orders/:id', async (request, reply) => {
    const query = request.query as {
      scenario?: string;
      failureMode?: string;
    };

    const handledFailure = await applyFailureScenario({
      request,
      reply,
      route: '/core/v5/orders/:id',
      scenario: query.scenario,
      failureMode: query.failureMode,
    });

    if (handledFailure) {
      return reply;
    }

    const params = request.params as { id: string };
    const datasetPath = resolveScenarioDataset({
      provider: 'pagarme',
      scenario: query.scenario,
    });

    const orders = loadJsonDataset<PagarmeOrder[]>(datasetPath);
    const order = orders.find((item) => item.id === params.id);

    request.log.info({
      route: '/core/v5/orders/:id',
      scenario: query.scenario ?? 'default',
      failureMode: query.failureMode,
      orderId: params.id,
      dataset: datasetPath,
      statusCode: order ? 200 : 404,
    });

    if (!order) {
      return reply.status(404).send({
        message: 'Order not found',
      });
    }

    return reply.status(200).send(order);
  });
}
