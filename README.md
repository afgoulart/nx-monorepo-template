# Workflows Monorepo (.NET + Nx)

Monorepo for **decoupled workflow platforms** on AWS. Each *workflow* is an
independent business flow (e.g. `workflow-a`, `workflow-b`) that evolves and
deploys on its own, while common logic (rules engine, fraud engine, validation,
event client, observability, domain types) lives in shared libraries.

- **Language / runtime:** C# on **.NET 8** (AWS Lambda `dotnet8` managed runtime).
- **Orchestration:** [Nx](https://nx.dev) via the [`@nx-dotnet`](https://www.nx-dotnet.com/) plugin — gives us `nx affected`, task caching and enforced module boundaries over MSBuild projects.
- **Infra:** Terraform, **isolated state per workflow**.
- **CI/CD:** GitHub Actions — affected-only PR checks + one deploy pipeline per workflow.

---

## Why isolation per workflow

Each workflow is a separate blast radius:

| Concern            | How it is isolated                                                            |
| ------------------ | ----------------------------------------------------------------------------- |
| **Code**           | `apps/workflow-a` may **not** import `apps/workflow-b` (enforced at build).    |
| **Sharing**        | The only way to share code is a `libs/shared-*` library.                       |
| **Infrastructure** | Each workflow has its own Terraform stack under `infra/<workflow>/terraform`.  |
| **State**          | Each Terraform stack uses its own S3 state key (`<workflow>/terraform.tfstate`).|
| **IAM**            | Each workflow owns its own least-privilege IAM role.                            |
| **Deploy**         | Each workflow has its own pipeline, triggered only by its own paths.            |
| **Build/Test**     | `nx affected` builds/tests only what a change actually touches.                |

A change to `workflow-a` can never break, redeploy, or widen the permissions of
`workflow-b`. A change to a shared library fans out to every workflow that
depends on it — by design.

## Repository layout

```
apps/
  workflow-a/            # Acme.WorkflowA  — Lambda handlers (class library)
    Handlers/            #   ReceiveEvent / Validate / ManualReview / Finalize
  workflow-a-test/       # Acme.WorkflowA.Test (xUnit)
  workflow-b/ ...
libs/
  shared-domain/         # Proposta, Cliente, Status, WorkflowEvent<T>
  shared-rules-engine/   # RuleEngine<T> + example MinimumValueRule
  shared-fraud-engine/   # FraudChecker.CheckFraud (stub score)
  shared-validation/     # CPF / identity / proposta validators
  shared-event-client/   # EventRouter + Kafka consumer stub (single topic)
  shared-observability/  # StructuredLogger (JSON) + Tracing.WithSpan
infra/
  shared-infra/terraform # VPC, MSK event backbone, CloudWatch
  workflow-a/terraform   # lambda.tf, sqs.tf, backend.tf (isolated state), ...
  workflow-b/terraform
.github/workflows/
  ci-affected.yml        # PR: nx affected -t lint,test,build
  deploy-workflow.yml    # reusable: build + package + terraform apply
  deploy-workflow-a.yml  # push to main (paths-filtered) -> reusable
  deploy-workflow-b.yml
```

Nx project names drop the folder prefix: the project in `apps/workflow-a` is
`workflow-a`, and its test project (`apps/workflow-a-test`) is `workflow-a-test`.

## Prerequisites

- **Node.js 24** (`.nvmrc` pins it; run `nvm use`). Node is only the runtime for
  the Nx CLI — no application code is JavaScript.
- **.NET SDK 8.0**.
- For deploys: **Terraform ≥ 1.6** and AWS credentials.

Install the toolchain dependencies once:

```bash
npm ci
```

## Running locally

Nx shells out to `dotnet`, so make sure `dotnet` is on your `PATH`.

```bash
# Build a single project (and its dependencies)
nx build workflow-a

# Test a single project (tests live in the *-test project)
nx test workflow-a-test
nx test shared-rules-engine-test

# Everything
nx run-many -t build
nx run-many -t test

# Only what changed vs. main (what CI runs)
nx affected -t lint,test,build --base=origin/main

# Visualize the project graph
nx graph
```

### Module boundaries

Boundaries are declared as tags in each `project.json` and enforced by
`@nx-dotnet` **on every build** (via `Directory.Build.targets`), so even a plain
`dotnet build` rejects an illegal reference. Tags:

- `scope:workflow-a` / `scope:workflow-b` / `scope:shared`
- `type:app` / `type:lib` / `type:test`

The constraints live in [`nx.json`](nx.json) under the `@nx-dotnet/core` plugin
`moduleBoundaries`. Adding a reference from `workflow-a` to `workflow-b` fails
with:

```
workflow-a cannot depend on workflow-b. Project tag {"sourceTag":"scope:workflow-a", ...} is not satisfied.
```

## Adding a new workflow

Say you want `workflow-c`. Follow the same pattern end to end:

1. **App + test project**

   ```bash
   nx g @nx-dotnet/core:app  --name=workflow-c --directory=apps \
     --namespaceName=Acme.WorkflowC --template=classlib \
     --testTemplate=xunit --language=C# --tags="scope:workflow-c,type:app"
   ```

   - Rename the nx project in `apps/workflow-c/project.json` to `workflow-c`
     (drop the `apps-` prefix).
   - Add `apps/workflow-c-test/project.json` with tags `["scope:workflow-c","type:test"]`.

2. **Reference the shared libraries** it needs:

   ```bash
   dotnet add apps/workflow-c/Acme.WorkflowC.csproj reference \
     libs/shared-domain/Acme.Shared.Domain.csproj   # ...and the others
   dotnet add apps/workflow-c/Acme.WorkflowC.csproj package Amazon.Lambda.Core
   dotnet add apps/workflow-c/Acme.WorkflowC.csproj package Amazon.Lambda.Serialization.SystemTextJson
   ```

   Copy `apps/workflow-a/Handlers/*` as a starting point (adjust namespace and
   the workflow-specific `WorkflowConstants`).

3. **Boundary rule** — add a constraint in `nx.json`:

   ```json
   { "sourceTag": "scope:workflow-c", "onlyDependOnLibsWithTags": ["scope:workflow-c", "scope:shared"] }
   ```

4. **Infrastructure** — copy `infra/workflow-a/terraform` to
   `infra/workflow-c/terraform` and update:
   - `backend.tf` → `key = "workflow-c/terraform.tfstate"`
   - `variables.tf` → `workflow_name`, `assembly_name`, `handler_namespace` defaults.

5. **Pipeline** — copy `.github/workflows/deploy-workflow-a.yml` to
   `deploy-workflow-c.yml`, set `workflow_name: workflow-c` and the `paths`
   filter to `apps/workflow-c/**`, `infra/workflow-c/**`, `libs/**`.

6. Verify: `nx build workflow-c && nx test workflow-c-test`.

### Sharing new logic

Need shared logic? Create a library, never a cross-workflow import:

```bash
nx g @nx-dotnet/core:lib --name=shared-<thing> --directory=libs \
  --namespaceName=Acme.Shared.<Thing> --template=classlib \
  --testTemplate=xunit --language=C# --tags="scope:shared,type:lib"
```

## Manual setup checklist (before the first deploy)

These are one-time, out-of-band steps this template intentionally leaves as
placeholders:

- [ ] **Create the S3 state bucket** and replace `REPLACE_ME-terraform-state` in
      every `infra/**/backend.tf`.
- [ ] **Create the DynamoDB lock table** and replace `REPLACE_ME-terraform-locks`.
- [ ] **Apply `infra/shared-infra`** first (VPC + MSK + CloudWatch) — the
      workflow stacks read it via `terraform_remote_state`.
- [ ] **Configure the AWS OIDC deploy role** and add its ARN as the
      `AWS_ROLE_ARN` GitHub secret (used by every deploy pipeline).
- [ ] Review IAM policies in each `infra/<workflow>/terraform/lambda.tf` and
      tighten to your actual resources.
