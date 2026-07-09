/**
 * Fraud scoring stub.
 *
 * Returns a deterministic, fictitious score so downstream code and tests have
 * something stable to work against. Replace `checkFraud` with a call to your
 * real model / provider while keeping the same result shape.
 */
export type RiskLevel = 'low' | 'medium' | 'high';

export interface FraudCheckPayload {
  documento: string;
  valor: number;
  /** Optional extra signals a workflow may pass through. */
  [key: string]: unknown;
}

export interface FraudCheckResult {
  /** 0 (safe) .. 100 (fraudulent). */
  score: number;
  risk: RiskLevel;
  signals: string[];
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function checkFraud(payload: FraudCheckPayload): FraudCheckResult {
  const signals: string[] = [];
  let score = 0;

  // Fictitious heuristics — purely illustrative.
  if (payload.valor > 1_000_000) {
    score += 45;
    signals.push('high-ticket');
  }
  if (payload.documento.replace(/\D/g, '').length < 11) {
    score += 40;
    signals.push('malformed-document');
  }
  // Stable pseudo-random contribution derived from the document.
  const seed = [...payload.documento].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  score += seed % 20;

  score = Math.min(100, score);
  return { score, risk: riskFromScore(score), signals };
}
