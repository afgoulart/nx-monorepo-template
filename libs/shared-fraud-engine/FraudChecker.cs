namespace Acme.Shared.FraudEngine;

public enum RiskLevel
{
    Low,
    Medium,
    High,
}

/// <param name="Score">0 (safe) .. 100 (fraudulent).</param>
public sealed record FraudCheckResult(int Score, RiskLevel Risk, IReadOnlyList<string> Signals);

/// <summary>
/// Fraud scoring stub. Returns a deterministic, fictitious score so downstream
/// code and tests have something stable to work against. Replace the body with
/// a call to your real model / provider while keeping the same result shape.
/// </summary>
public static class FraudChecker
{
    public static FraudCheckResult CheckFraud(string documento, long valor)
    {
        var signals = new List<string>();
        var score = 0;

        // Fictitious heuristics — purely illustrative.
        if (valor > 1_000_000)
        {
            score += 45;
            signals.Add("high-ticket");
        }

        var digits = new string(documento.Where(char.IsDigit).ToArray());
        if (digits.Length < 11)
        {
            score += 40;
            signals.Add("malformed-document");
        }

        // Stable pseudo-random contribution derived from the document.
        var seed = documento.Sum(c => c);
        score += seed % 20;

        score = Math.Min(100, score);
        return new FraudCheckResult(score, RiskFromScore(score), signals);
    }

    private static RiskLevel RiskFromScore(int score) => score switch
    {
        >= 70 => RiskLevel.High,
        >= 40 => RiskLevel.Medium,
        _ => RiskLevel.Low,
    };
}
