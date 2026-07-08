# Nx Monorepo Template - Workflows Desacoplados

Template inicial de monorepo **Nx + TypeScript** para uma plataforma serverless na AWS, com **isolamento de infraestrutura por workflow**.

## Estrutura

```text
apps/
  workflow-a/
  workflow-b/

libs/
  shared-domain/
  shared-event-client/
  shared-fraud-engine/
  shared-observability/
  shared-rules-engine/
  shared-validation/

infra/
  workflow-a/terraform/
  workflow-b/terraform/
  shared-infra/terraform/
```

## Arquitetura e racional

- Cada workflow é um app independente em `apps/<workflow>` com handlers de exemplo:
  - `receive-event`
  - `validate`
  - `manual-review`
  - `finalize`
- A infraestrutura de cada workflow fica em `infra/<workflow>/terraform`, incluindo:
  - Lambda dedicada
  - IAM role com permissões mínimas
  - fila/event bus próprio
  - `backend.tf` com state S3 isolado por workflow
- Recursos comuns de plataforma ficam em `infra/shared-infra/terraform` (VPC, barramento de eventos e observabilidade).
- Bibliotecas `shared-*` concentram domínio e capacidades reutilizáveis sem acoplamento entre apps.

## Module boundaries (Nx)

A regra `@nx/enforce-module-boundaries` está ativa para impedir importação direta entre apps.

- Projetos com tag `type:app` só podem depender de libs com tag `type:shared`.
- Projetos com tag `type:shared` só podem depender de libs com tag `type:shared`.

## CI/CD

- `.github/workflows/ci-affected.yml`
  - Em pull request, executa `nx affected -t lint test build`.
- `.github/workflows/deploy-workflow.yml`
  - Reusable workflow para build do app e deploy Terraform do workflow informado.
- `.github/workflows/deploy-workflow-a.yml` e `deploy-workflow-b.yml`
  - Disparam no `main`, com `paths` restritos ao app/infra do workflow.

## Requisitos de runtime

- Node.js **24**
- Terraform **>= 1.6**
- AWS Provider estável mais recente da major 5 (`~> 5.0`)

## Como adicionar um novo workflow

1. Gerar novo app em `apps/workflow-c` com handlers no mesmo padrão.
2. Criar infraestrutura isolada em `infra/workflow-c/terraform` com `backend.tf` próprio.
3. Reutilizar libs `shared-*` para domínio, validação, regras, fraude e observabilidade.
4. Criar workflow de deploy dedicado (`deploy-workflow-c.yml`) chamando o reusable `deploy-workflow.yml`.
5. Aplicar tags Nx (`type:app,scope:workflow-c`) para manter boundaries.
