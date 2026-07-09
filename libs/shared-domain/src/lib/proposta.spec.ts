import { createProposta, isTerminalStatus } from './proposta.js';

describe('shared-domain', () => {
  it('createProposta stamps an initial RECEIVED status and timestamps', () => {
    const proposta = createProposta({
      id: 'p-1',
      workflow: 'workflow-a',
      valor: 150000,
      cliente: { id: 'c-1', nome: 'Ana', documento: '12345678900' },
    });

    expect(proposta.status).toBe('RECEIVED');
    expect(proposta.criadoEm).toBe(proposta.atualizadoEm);
    expect(new Date(proposta.criadoEm).toString()).not.toBe('Invalid Date');
  });

  it('isTerminalStatus is true only for FINALIZED and REJECTED', () => {
    expect(isTerminalStatus('FINALIZED')).toBe(true);
    expect(isTerminalStatus('REJECTED')).toBe(true);
    expect(isTerminalStatus('IN_REVIEW')).toBe(false);
  });
});
