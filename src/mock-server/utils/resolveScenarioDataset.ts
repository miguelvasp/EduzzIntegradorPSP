import { join } from 'node:path';

type Provider = 'pagarme' | 'mercado-pago';
type Scenario = 'default' | 'pagination' | 'reimport' | 'validation';

export function resolveScenarioDataset(params: { provider: Provider; scenario?: string }): string {
  const scenario = normalizeScenario(params.scenario);

  if (params.provider === 'pagarme') {
    return join(process.cwd(), `src/mock-server/datasets/pagarme/orders.${scenario}.json`);
  }

  return join(process.cwd(), `src/mock-server/datasets/mercado-pago/payments.${scenario}.json`);
}

function normalizeScenario(scenario?: string): Scenario {
  if (scenario === 'pagination' || scenario === 'reimport' || scenario === 'validation') {
    return scenario;
  }

  return 'default';
}
