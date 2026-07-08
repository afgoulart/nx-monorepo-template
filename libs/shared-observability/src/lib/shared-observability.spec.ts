import { createLogger, sharedObservability, withTrace } from './shared-observability';

describe('sharedObservability', () => {
  it('should work', () => {
    expect(sharedObservability()).toEqual('shared-observability');
  });

  it('writes structured logs', () => {
    const infoSpy = jest.spyOn(console, 'info').mockImplementation();
    const logger = createLogger('unit-test');

    logger.info('message', { key: 'value' });

    expect(infoSpy).toHaveBeenCalledWith(
      JSON.stringify({
        level: 'info',
        scope: 'unit-test',
        message: 'message',
        context: { key: 'value' },
      })
    );
    infoSpy.mockRestore();
  });

  it('wraps handler with trace lifecycle and preserves errors', async () => {
    const infoSpy = jest.spyOn(console, 'info').mockImplementation();
    const wrapped = withTrace('trace-name', async () => {
      throw new Error('boom');
    });

    await expect(wrapped({ id: '1' })).rejects.toThrow('boom');
    expect(infoSpy).toHaveBeenCalledTimes(2);
    infoSpy.mockRestore();
  });
});
