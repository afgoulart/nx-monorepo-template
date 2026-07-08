import { type Proposta } from 'shared-domain';

export interface FraudEvaluation {
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
}

export function evaluateFraudRisk(proposta: Proposta): FraudEvaluation {
  if (proposta.valorSolicitado > 50000) {
    return { riskLevel: 'medium', reasons: ['Valor solicitado acima do limiar inicial.'] };
  }

  return { riskLevel: 'low', reasons: [] };
}

export function sharedFraudEngine(): string {
  return 'shared-fraud-engine';
}
