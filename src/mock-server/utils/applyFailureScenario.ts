import type { FastifyReply, FastifyRequest } from 'fastify';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function applyFailureScenario(params: {
  request: FastifyRequest;
  reply: FastifyReply;
  route: string;
  scenario?: string;
  failureMode?: string;
  timeoutMs?: number;
}): Promise<boolean> {
  if (params.scenario !== 'failure') {
    return false;
  }

  const failureMode = params.failureMode ?? 'http_500';

  if (failureMode === 'http_500') {
    params.request.log.warn({
      route: params.route,
      scenario: params.scenario,
      failureMode,
      statusCode: 500,
      simulatedFailure: true,
    });

    await params.reply.status(500).send({
      message: 'Simulated temporary internal error',
      code: 'mock.internal_error',
    });

    return true;
  }

  if (failureMode === 'timeout') {
    const timeoutMs = params.timeoutMs ?? 1500;

    params.request.log.warn({
      route: params.route,
      scenario: params.scenario,
      failureMode,
      timeoutMs,
      simulatedFailure: true,
    });

    await sleep(timeoutMs);

    return false;
  }

  if (failureMode === 'invalid_payload') {
    params.request.log.warn({
      route: params.route,
      scenario: params.scenario,
      failureMode,
      statusCode: 200,
      simulatedFailure: true,
    });

    await params.reply.status(200).send({
      invalid: true,
      data: 'unexpected-string-payload',
    });

    return true;
  }

  return false;
}
