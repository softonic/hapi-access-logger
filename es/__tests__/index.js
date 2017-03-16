import hapi from 'hapi';
import HapiAccessLogs from '../index';

function createServerWithPlugin(options) {
  const server = new hapi.Server();
  server.connection();
  server.register({
    register: HapiAccessLogs,
    options,
  });
  server.route({
    method: 'GET',
    path: '/',
    handler: (request, reply) => (
      reply('Hola mundo')
        .header('x-bar', 'baz')
        .header('content-type', 'text/plain; charset=utf-8')
        .header('content-language', 'es-ES')
    ),
  });
  return { server };
}

describe('HapiAccessLogs', () => {
  it('should be a Hapi plugin', () => {
    expect(HapiAccessLogs.register).toBeInstanceOf(Function);
    expect(HapiAccessLogs.register.attributes.pkg.name).toBe('@softonic/hapi-access-logger');
  });

  describe('when it is registered', () => {
    it('should log a completed request', async () => {
      const logger = {
        info: jest.fn(),
      };
      const { server } = createServerWithPlugin({ logger });

      await server.inject({
        method: 'GET',
        url: '/',
        headers: {
          host: 'example.com',
          'x-foo': 'bar',
        },
      });

      expect(logger.info).toHaveBeenCalledWith({
        request: expect.objectContaining({
          method: 'GET',
          url: '/',
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
      }, 'GET example.com/ 200');
    });

    it('should whitelist the specified headers', async () => {
      const logger = {
        info: jest.fn(),
      };
      const { server } = createServerWithPlugin({
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
        url: '/',
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
          url: '/',
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
      }, 'GET example.com/ 200');
    });

    it('should blacklist the specified headers', async () => {
      const logger = {
        info: jest.fn(),
      };
      const { server } = createServerWithPlugin({
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
        url: '/',
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
          url: '/',
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
      }, 'GET example.com/ 200');

      const logEntry = logger.info.mock.calls[0][0];

      expect(logEntry.request.headers.accept).toBeUndefined();
      expect(logEntry.request.headers['accept-language']).toBeUndefined();
      expect(logEntry.response.headers['content-type']).toBeUndefined();
      expect(logEntry.response.headers['content-language']).toBeUndefined();
    });
  });
});
