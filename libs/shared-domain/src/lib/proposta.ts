/**
 * Core business types shared across every workflow.
 *
 * A "Proposta" (proposal) is the unit of work that flows through a workflow:
 * it is received, validated, optionally sent to manual review and finalized.
 */

/** Lifecycle a proposal moves through, regardless of the workflow. */
export type Status =
  | 'RECEIVED'
  | 'VALIDATING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'FINALIZED';

/** Statuses from which a proposal can no longer transition. */
export const TERMINAL_STATUSES: readonly Status[] = ['FINALIZED', 'REJECTED'];

export interface Cliente {
  id: string;
  nome: string;
  /** CPF or CNPJ, digits only. */
  documento: string;
  email?: string;
  /** ISO-8601 date (YYYY-MM-DD). */
  nascimento?: string;
}

export interface Proposta {
  id: string;
  /** Which workflow owns this proposal (used for routing). */
  workflow: string;
  cliente: Cliente;
  /** Monetary amount in the smallest currency unit (e.g. centavos). */
  valor: number;
  status: Status;
  /** ISO-8601 timestamp. */
  criadoEm: string;
  /** ISO-8601 timestamp. */
  atualizadoEm: string;
  metadata?: Record<string, unknown>;
}

export function isTerminalStatus(status: Status): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Convenience factory that stamps timestamps and an initial status. */
export function createProposta(
  input: Omit<Proposta, 'status' | 'criadoEm' | 'atualizadoEm'> &
    Partial<Pick<Proposta, 'status'>>
): Proposta {
  const now = new Date().toISOString();
  return {
    status: 'RECEIVED',
    criadoEm: now,
    atualizadoEm: now,
    ...input,
  };
}
