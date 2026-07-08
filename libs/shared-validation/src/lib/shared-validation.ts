import { type Proposta } from 'shared-domain';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePropostaData(proposta: Proposta): ValidationResult {
  const errors: string[] = [];

  if (!proposta.cliente.documento) {
    errors.push('Documento do cliente é obrigatório.');
  }

  if (proposta.valorSolicitado <= 0) {
    errors.push('Valor solicitado deve ser maior que zero.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sharedValidation(): string {
  return 'shared-validation';
}
