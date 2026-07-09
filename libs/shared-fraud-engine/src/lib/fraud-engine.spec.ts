import { checkFraud } from './fraud-engine.js';

describe('shared-fraud-engine', () => {
  it('flags high-ticket, malformed documents as high risk', () => {
    const result = checkFraud({ documento: '123', valor: 2_000_000 });

    expect(result.signals).toContain('high-ticket');
    expect(result.signals).toContain('malformed-document');
    expect(result.risk).toBe('high');
  });

  it('is deterministic and bounded to 0..100', () => {
    const a = checkFraud({ documento: '12345678900', valor: 1000 });
    const b = checkFraud({ documento: '12345678900', valor: 1000 });

    expect(a).toEqual(b);
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
  });
});
