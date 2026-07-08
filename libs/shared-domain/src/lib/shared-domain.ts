export enum Status {
  Recebida = 'RECEBIDA',
  EmValidacao = 'EM_VALIDACAO',
  EmRevisaoManual = 'EM_REVISAO_MANUAL',
  Finalizada = 'FINALIZADA',
  Rejeitada = 'REJEITADA',
}

export interface Cliente {
  id: string;
  nome: string;
  documento: string;
}

export interface Proposta {
  id: string;
  workflow: 'workflow-a' | 'workflow-b';
  status: Status;
  cliente: Cliente;
  valorSolicitado: number;
}

export function sharedDomain(): string {
  return 'shared-domain';
}
