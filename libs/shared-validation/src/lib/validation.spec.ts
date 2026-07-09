import type { Proposta } from '@org/shared-domain';
import { isValidCPF, validateProposta } from './validation.js';

describe('shared-validation', () => {
  it('validates CPF check digits', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
    expect(isValidCPF('111.111.111-11')).toBe(false);
    expect(isValidCPF('123')).toBe(false);
  });

  it('collects proposta errors', () => {
    const proposta: Proposta = {
      id: 'p-1',
      workflow: 'workflow-a',
      valor: -1,
      status: 'RECEIVED',
      criadoEm: '2026-01-01T00:00:00.000Z',
      atualizadoEm: '2026-01-01T00:00:00.000Z',
      cliente: { id: 'c-1', nome: '', documento: '000' },
    };

    const result = validateProposta(proposta);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'valor must be positive',
        'nome is required',
        'documento is not a valid CPF',
      ])
    );
  });
});
