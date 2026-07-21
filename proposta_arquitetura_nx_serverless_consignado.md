# Proposta Técnica — Arquitetura de Workflows Desacoplados para Consignado

**Squad:** Mesa – Consignado Público
**Contexto:** Desacoplamento dos workflows por convênio (SIAPE, Governo de Minas, etc.), hoje monolíticos no sistema Futuro
**Data:** 07/07/2026

---

## 1. Objetivo

Desenhar uma arquitetura que permita que **cada convênio/workflow evolua de forma independente**, sem impactar os demais, mantendo compartilhamento de lógicas comuns (motor de regras, fraude, biometria, integração Kafka/WebCred) através de uma **lib centralizada** dentro de um **monorepo Nx**, com **infraestrutura isolada por workflow** (AWS Serverless via Terraform) e **CI/CD independente por pacote**.

---

## 2. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     Nx Monorepo (GitHub)                    │
│                                                               │
│  apps/                                                        │
│   ├─ workflow-siape/          (Lambda isolada)               │
│   ├─ workflow-minas/          (Lambda isolada)                │
│   ├─ workflow-sp-cp/          (Lambda isolada)                │
│   └─ workflow-<novo-convenio>/ (plugável, sem tocar nos demais)│
│                                                               │
│  libs/                                                         │
│   ├─ shared-rules-engine/     (motor de regras)               │
│   ├─ shared-fraud-engine/     (motor de fraude)                │
│   ├─ shared-biometrics/       (validação biométrica)           │
│   ├─ shared-kafka-client/     (consumo do tópico único)        │
│   ├─ shared-domain/           (tipos, entidades, contratos)    │
│   └─ shared-observability/    (logging, tracing, métricas)     │
│                                                               │
│  infra/                                                        │
│   ├─ workflow-siape/terraform/                                 │
│   ├─ workflow-minas/terraform/                                 │
│   ├─ workflow-sp-cp/terraform/                                 │
│   └─ shared-infra/terraform/  (recursos compartilhados: Kafka,│
│       VPC, IAM roles base, camada de observabilidade)          │
│                                                               │
│  .github/workflows/                                            │
│   ├─ ci-affected.yml          (build/test apenas do que mudou) │
│   ├─ deploy-workflow.yml       (reusable workflow por pacote)  │
│   └─ deploy-shared-libs.yml     (publica libs versionadas)     │
└─────────────────────────────────────────────────────────────┘
```

Cada convênio é um **app independente** dentro do Nx, com seu próprio ciclo de vida de deploy e sua própria stack Terraform. As libs compartilhadas são consumidas como dependências internas do monorepo (via `tsconfig paths` / Nx project references), nunca copiadas.

---

## 3. Estrutura do Monorepo Nx

### 3.1 Apps (um por workflow/convênio)

Cada `apps/workflow-<convenio>` representa uma função serverless (ou conjunto de funções) que implementa a jornada específica daquele convênio:

```
apps/workflow-siape/
├─ src/
│  ├─ handlers/
│  │  ├─ receive-proposal.handler.ts   (consome evento do Kafka)
│  │  ├─ validate-margin.handler.ts
│  │  ├─ manual-review.handler.ts
│  │  └─ averbacao.handler.ts
│  ├─ rules/                            (regras específicas do SIAPE)
│  └─ main.ts
├─ project.json                         (target Nx: build, test, deploy)
└─ serverless.ts / template.yaml        (definição das functions)
```

Vantagem: se o SIAPE precisa de uma regra nova (ex: aumento de margem), a mudança fica **contida no seu próprio app**, sem tocar em `workflow-minas` ou `workflow-sp-cp`.

### 3.2 Libs (lógica compartilhada)

```
libs/shared-rules-engine/
libs/shared-fraud-engine/
libs/shared-biometrics/
libs/shared-kafka-client/
libs/shared-domain/
libs/shared-observability/
```

Regras de uso:
- Libs são **versionadas semanticamente** dentro do monorepo (Nx release / changesets).
- Nenhum app pode importar código de outro app diretamente — apenas via libs. Isso é reforçado com **Nx module boundaries** (`enforce-module-boundaries` lint rule), evitando acoplamento indevido entre convênios.
- Mudança em uma lib compartilhada roda os testes de **todos os apps afetados** (via `nx affected`), garantindo que uma alteração no motor de regras não quebre um convênio silenciosamente.

---

## 4. Infraestrutura AWS Serverless (isolada por workflow)

Cada workflow tem sua própria stack de infraestrutura, com **Terraform state isolado** (backend S3 + DynamoDB lock separado por workspace/convênio):

```
infra/workflow-siape/terraform/
├─ main.tf
├─ lambda.tf              # Lambdas do workflow-siape
├─ sqs.tf / eventbridge.tf # filas/eventos específicos do convênio
├─ iam.tf                 # roles com least privilege, escopo só desse workflow
├─ variables.tf
└─ backend.tf             # state isolado: s3://tfstate-consignado/workflow-siape/
```

Componentes AWS sugeridos por workflow:
- **AWS Lambda** — cada handler do app vira uma function.
- **Amazon EventBridge / SQS** — desacopla o consumo do tópico Kafka único (via um consumer compartilhado que republica por convênio) das filas de processamento internas de cada workflow.
- **Step Functions** (opcional, recomendado) — para orquestrar os estágios da esteira (validação → biometria → mesa manual → averbação) de forma visual e resiliente por convênio.
- **DynamoDB** — estado da proposta/esteira, com tabela isolada ou partition key por convênio.
- **IAM roles** com escopo mínimo por workflow — impede que uma falha de permissão ou bug em um convênio tenha acesso a recursos de outro.

### 4.1 Infra compartilhada (`infra/shared-infra`)

Recursos verdadeiramente transversais ficam num módulo Terraform à parte, referenciado (não duplicado) pelos módulos de cada workflow:
- Cluster/tópico Kafka (ou MSK) de ingestão única.
- VPC, subnets, security groups base.
- Camada de observabilidade (CloudWatch dashboards, X-Ray, alarmes).

Isso evita que "compartilhado" vire desculpa para recriar o monolito — a regra é: **só entra em shared-infra o que não tem lógica de negócio específica de convênio**.

---

## 5. CI/CD — GitHub Actions + Terraform por pacote

### 5.1 Estratégia geral

- Usar `nx affected` para detectar **quais apps/libs/infra mudaram** em cada PR/commit e rodar build, test e plano de Terraform **apenas para o que foi afetado**.
- Cada workflow tem seu próprio **pipeline de deploy independente**, reaproveitando um *reusable workflow* do GitHub Actions para evitar duplicação de YAML.

### 5.2 Exemplo de pipeline (`ci-affected.yml`)

```yaml
name: CI - Affected
on: [pull_request]

jobs:
  affected:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx nx affected -t lint,test,build --base=origin/main
      - run: npx nx affected -t terraform-plan --base=origin/main
```

### 5.3 Deploy por workflow (reusable workflow)

```yaml
# .github/workflows/deploy-workflow.yml
name: Deploy Workflow
on:
  workflow_call:
    inputs:
      workflow_name:
        required: true
        type: string

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx nx build ${{ inputs.workflow_name }}
      - name: Terraform Init & Apply
        working-directory: infra/${{ inputs.workflow_name }}/terraform
        run: |
          terraform init
          terraform apply -auto-approve
```

Chamado individualmente por convênio:

```yaml
# .github/workflows/deploy-siape.yml
name: Deploy SIAPE
on:
  push:
    branches: [main]
    paths:
      - 'apps/workflow-siape/**'
      - 'infra/workflow-siape/**'
      - 'libs/shared-**'

jobs:
  call-deploy:
    uses: ./.github/workflows/deploy-workflow.yml
    with:
      workflow_name: workflow-siape
```

Efeito prático: **um push que só mexe no `workflow-siape` não dispara deploy de `workflow-minas`**, resolvendo diretamente o problema relatado na reunião (mudança em um convênio impactando os demais).

### 5.4 Terraform state por pacote

- Cada `infra/workflow-<convenio>/terraform/backend.tf` aponta para um **prefixo de state isolado** (ex: `workflow-siape/terraform.tfstate`), garantindo que um `apply` de um convênio nunca trave ou colida com o de outro.
- Terraform workspaces adicionais podem ser usados para ambientes (dev/hml/prod) dentro de cada pacote.

---

## 6. Governança e Boas Práticas

| Prática | Benefício |
|---|---|
| Nx module boundaries (lint) | Impede import direto entre apps de convênios distintos |
| `nx affected` no CI | Build/test/deploy só do que mudou → pipelines rápidos e seguros |
| Terraform state isolado por pacote | Elimina risco de um convênio derrubar o outro na infra |
| Libs versionadas (shared-*) | Mudança em regra/motor compartilhado é testada contra todos os workflows afetados antes do merge |
| IAM least privilege por workflow | Isolamento de blast radius em caso de incidente |
| Reusable GitHub Actions workflows | Onboarding de novo convênio = copiar template, sem reescrever pipeline |

---

## 7. Caminho de Implementação (Roadmap sugerido)

1. **Fase 0 — Fundação**: criar o monorepo Nx, mover motor de regras/fraude/biometria/Kafka client para `libs/shared-*`.
2. **Fase 1 — Piloto**: migrar **um convênio** (ex: SIAPE) para `apps/workflow-siape` com infra Terraform isolada e pipeline próprio, validando o modelo ponta a ponta.
3. **Fase 2 — Expansão**: migrar os demais convênios existentes (Governo de Minas, SP-CP, etc.) seguindo o mesmo template.
4. **Fase 3 — Novo produto plugável**: usar a estrutura para provar o ganho real — adicionar refin/portabilidade a um convênio sem tocar nos demais.
5. **Fase 4 — Novas averbadoras**: usar o mesmo padrão de isolamento para plugar novas integrações de averbação sem risco ao que já está em produção.

---

## 8. Riscos e Pontos de Atenção

- **Consumo do tópico Kafka único**: é preciso um componente de roteamento (consumer compartilhado) que direcione o evento para a fila/EventBridge do workflow correto — esse componente deve ser mantido em `shared-kafka-client`, mas com regra de roteamento simples e sem lógica de negócio, para não recriar o monolito.
- **Duplicação de infraestrutura básica**: workflows terão recursos AWS semelhantes (Lambda, filas, tabelas); vale avaliar um módulo Terraform reutilizável (`modules/serverless-workflow`) para reduzir boilerplate sem acoplar os pacotes entre si.
- **Custo operacional**: mais pipelines e stacks isoladas implicam mais superfície para monitorar — mitigado pela camada de observabilidade compartilhada.
