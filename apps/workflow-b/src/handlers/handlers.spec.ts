import type { Context } from 'aws-lambda';
import type { Proposta } from '@org/shared-domain';
import { handler as receive } from './receive-event.handler.js';
import { handler as validate } from './validate.handler.js';
import { handler as manualReview } from './manual-review.handler.js';
import { handler as finalize } from './finalize.handler.js';
import { MIN_VALOR, WORKFLOW_NAME, type PropostaEvent } from './types.js';

const context = { awsRequestId: 'test-req' } as Context;

function makeEvent(overrides: Partial<Proposta> = {}): PropostaEvent {
  const proposta: Proposta = {
    id: 'p-1',
    workflow: WORKFLOW_NAME,
    valor: MIN_VALOR,
    status: 'RECEIVED',
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
    // 529.982.247-25 is a structurally valid CPF used for tests.
    cliente: { id: 'c-1', nome: 'Ana', documento: '52998224725' },
    ...overrides,
  };
  return {
    eventId: 'e-1',
    workflow: WORKFLOW_NAME,
    type: 'proposta.received',
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: proposta,
  };
}

describe(`${WORKFLOW_NAME} handlers`, () => {
  it('receive-event acknowledges as RECEIVED', async () => {
    const result = await receive(makeEvent(), context);
    expect(result).toMatchObject({ step: 'receive-event', status: 'RECEIVED' });
  });

  it('validate approves a clean proposal at/above the threshold', async () => {
    const result = await validate(makeEvent(), context);
    expect(result.status).toBe('APPROVED');
  });

  it('validate rejects a proposal below the workflow threshold', async () => {
    const result = await validate(makeEvent({ valor: MIN_VALOR - 1 }), context);
    expect(result.status).toBe('REJECTED');
    expect(result.detail?.['ruleFailures']).toContain('minimum-value');
  });

  it('manual-review honors the reviewer decision', async () => {
    const event = { ...makeEvent(), review: { approve: true, reviewer: 'ana' } };
    const result = await manualReview(event, context);
    expect(result.status).toBe('APPROVED');
  });

  it('finalize marks the proposal FINALIZED', async () => {
    const result = await finalize(makeEvent(), context);
    expect(result.status).toBe('FINALIZED');
  });
});
