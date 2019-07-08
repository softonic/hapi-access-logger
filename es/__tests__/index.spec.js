import hapi from 'hapi';
import HapiAccessLogger from '../index';

async function createServerWithPlugin(options) {
  const server = new hapi.Server();

  await server.register({
    plugin: HapiAccessLogger,
    options,
  });

  server.route({
    method: 'GET',
    path: '/path',
    handler: async (request, h) => (
      h.response('Hola mundo')
        .header('x-bar', 'baz')
        .header('content-type', 'text/plain; charset=utf-8')
        .header('content-language', 'es-ES')
    ),
  });

  await server.start();

  return { server };
}

describe('HapiAccessLogger', () => {
  it('should be a Hapi plugin', () => {
    expect(HapiAccessLogger.register).toBeInstanceOf(Function);
    expect(HapiAccessLogger.pkg.name).toBe('@softonic/hapi-access-logger');
  });

  describe('when it is registered', () => {
    describe('if a request is loggable', () => {
      it('should log a completed request', async () => {
        const logger = {
          info: jest.fn(),
        };
        const { server } = await createServerWithPlugin({ logger });

        await server.inject({
          method: 'GET',
          url: '/path',
          headers: {
            host: 'example.com',
            'x-foo': 'bar',
          },
        });

        expect(logger.info).toHaveBeenCalledWith({
          request: expect.objectContaining({
            method: 'GET',
            url: '/path',
            headers: expect.objectContaining({
              'x-foo': 'bar',
            }),
          }),
          response: expect.objectContaining({
            statusCode: 200,
            timestamp: expect.any(String),
            headers: expect.objectContaining({
              'x-bar': 'baz',
            }),
          }),
        }, 'GET example.com/path 200 (OK)');
      });

      it('should whitelist the specified headers', async () => {
        const logger = {
          info: jest.fn(),
        };
        const { server } = await createServerWithPlugin({
          logger,
          whitelistRequestHeaders: [
            'host',
            'accept',
            'accept-language',
          ],
          whitelistResponseHeaders: [
            'content-type',
            'content-language',
          ],
        });

        await server.inject({
          method: 'GET',
          url: '/path',
          headers: {
            'x-foo': 'bar',
            host: 'example.com',
            accept: 'text/plain',
            'accept-language': 'es-ES',
          },
        });

        expect(logger.info).toHaveBeenCalledWith({
          request: expect.objectContaining({
            method: 'GET',
            url: '/path',
            headers: {
              host: 'example.com',
              accept: 'text/plain',
              'accept-language': 'es-ES',
            },
          }),
          response: expect.objectContaining({
            statusCode: 200,
            timestamp: expect.any(String),
            headers: {
              'content-type': 'text/plain; charset=utf-8',
              'content-language': 'es-ES',
            },
          }),
        }, expect.any(String));
      });

      it('should blacklist the specified headers', async () => {
        const logger = {
          info: jest.fn(),
        };
        const { server } = await createServerWithPlugin({
          logger,
          blacklistRequestHeaders: [
            'accept',
            'accept-language',
          ],
          blacklistResponseHeaders: [
            'content-type',
            'content-language',
          ],
        });

        await server.inject({
          method: 'GET',
          url: '/path',
          headers: {
            'x-foo': 'bar',
            host: 'example.com',
            accept: 'text/plain',
            'accept-language': 'es-ES',
          },
        });

        expect(logger.info).toHaveBeenCalledWith({
          request: expect.objectContaining({
            method: 'GET',
            url: '/path',
            headers: expect.objectContaining({
              'x-foo': 'bar',
              host: 'example.com',
            }),
          }),
          response: expect.objectContaining({
            statusCode: 200,
            timestamp: expect.any(String),
            headers: expect.objectContaining({
              'x-bar': 'baz',
            }),
          }),
        }, expect.any(String));

        const logEntry = logger.info.mock.calls[0][0];

        expect(logEntry.request.headers.accept).toBeUndefined();
        expect(logEntry.request.headers['accept-language']).toBeUndefined();
        expect(logEntry.response.headers['content-type']).toBeUndefined();
        expect(logEntry.response.headers['content-language']).toBeUndefined();
      });
    });

    describe('if a request is not loggable', () => {
      it('should not log anything', async () => {
        const logger = {
          info: jest.fn(),
        };
        const isLoggableRequest = jest.fn(() => false);
        const { server } = await createServerWithPlugin({
          logger,
          isLoggableRequest,
        });

        const response = await server.inject({
          method: 'GET',
          url: '/path',
          headers: {
            host: 'example.com',
            'x-foo': 'bar',
          },
        });

        expect(isLoggableRequest).toHaveBeenCalledWith(response.request);
        expect(logger.info).not.toHaveBeenCalled();
      });
    });
  });
});
