using Amazon.Lambda.Core;
using Acme.Shared.Domain;
using Acme.Shared.FraudEngine;
using Acme.Shared.Observability;
using Acme.Shared.RulesEngine;
using Acme.Shared.Validation;

namespace Acme.WorkflowB.Handlers;

/// <summary>
/// Validates the proposal, runs the shared rule + fraud engines and decides the
/// next status:
///   - invalid data or failing rules -> Rejected
///   - high fraud risk               -> InReview (manual review)
///   - otherwise                     -> Approved
/// </summary>
public sealed class ValidateHandler
{
    private static readonly IStructuredLogger Logger = StructuredLogger.Create(
        new Dictionary<string, object?> { ["service"] = WorkflowConstants.Name, ["handler"] = "validate" });

    private static readonly RuleEngine<Proposta> Rules =
        new RuleEngine<Proposta>().Add(new MinimumValueRule(WorkflowConstants.MinValor));

    public Task<StepResult> Handle(WorkflowEvent<Proposta> evt, ILambdaContext context) =>
        Tracing.WithSpanAsync("validate", Logger, span =>
        {
            var proposta = evt.Payload;

            var validation = Validators.ValidateProposta(proposta);
            var rules = Rules.Run(proposta);
            var fraud = FraudChecker.CheckFraud(proposta.Cliente.Documento, proposta.Valor);

            var status = (validation.Valid && rules.Passed, fraud.Risk) switch
            {
                (false, _) => Status.Rejected,
                (true, RiskLevel.High) => Status.InReview,
                _ => Status.Approved,
            };

            span.Info("proposta.validated", new Dictionary<string, object?>
            {
                ["requestId"] = context.AwsRequestId,
                ["propostaId"] = proposta.Id,
                ["status"] = status.ToString(),
                ["fraudScore"] = fraud.Score,
                ["ruleFailures"] = rules.Failures,
            });

            var detail = new Dictionary<string, object?>
            {
                ["validationErrors"] = validation.Errors,
                ["ruleFailures"] = rules.Failures,
                ["fraudScore"] = fraud.Score,
                ["fraudRisk"] = fraud.Risk.ToString(),
            };
            return Task.FromResult(new StepResult(
                WorkflowConstants.Name, "validate", proposta.Id, status, detail));
        });
}
