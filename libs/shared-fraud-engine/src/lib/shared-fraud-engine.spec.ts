import { sharedFraudEngine } from './shared-fraud-engine';

describe('sharedFraudEngine', () => {
  it('should work', () => {
    expect(sharedFraudEngine()).toEqual('shared-fraud-engine');
  });
});
