using Acme.Shared.FraudEngine;

namespace Acme.Shared.FraudEngine.Test;

public class FraudCheckerTests
{
    [Fact]
    public void Flags_High_Ticket_Malformed_Document_As_High_Risk()
    {
        var result = FraudChecker.CheckFraud("123", 2_000_000);

        Assert.Contains("high-ticket", result.Signals);
        Assert.Contains("malformed-document", result.Signals);
        Assert.Equal(RiskLevel.High, result.Risk);
    }

    [Fact]
    public void Is_Deterministic_And_Bounded()
    {
        var a = FraudChecker.CheckFraud("52998224725", 1000);
        var b = FraudChecker.CheckFraud("52998224725", 1000);

        // Compare fields explicitly: record equality would use reference
        // equality for the Signals list.
        Assert.Equal(a.Score, b.Score);
        Assert.Equal(a.Risk, b.Risk);
        Assert.Equal(a.Signals, b.Signals);
        Assert.InRange(a.Score, 0, 100);
    }
}
