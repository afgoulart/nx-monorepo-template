import type { Cliente, Proposta } from '@org/shared-domain';

/**
 * Data and identity validation helpers.
 *
 * Kept dependency-free so any workflow can validate inbound payloads before
 * doing real work. `validateProposta` composes the smaller checks.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Validate a Brazilian CPF (11 digits) using the check-digit algorithm. */
export function isValidCPF(value: string): boolean {
  const cpf = value.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }
  const digit = (factorStart: number, length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(cpf[i]) * (factorStart - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(10, 9) === Number(cpf[9]) && digit(11, 10) === Number(cpf[10]);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Validate the identity fields of a Cliente. */
export function validateIdentity(cliente: Cliente): ValidationResult {
  const errors: string[] = [];
  if (!cliente.nome.trim()) {
    errors.push('nome is required');
  }
  if (!isValidCPF(cliente.documento)) {
    errors.push('documento is not a valid CPF');
  }
  if (cliente.email !== undefined && !isValidEmail(cliente.email)) {
    errors.push('email is malformed');
  }
  return { valid: errors.length === 0, errors };
}

export function validateProposta(proposta: Proposta): ValidationResult {
  const errors: string[] = [];
  if (proposta.valor <= 0) {
    errors.push('valor must be positive');
  }
  errors.push(...validateIdentity(proposta.cliente).errors);
  return { valid: errors.length === 0, errors };
}
