import {
  formatRequest,
  formatResponse,
  stringifyRequest,
  stringifyResponse,
} from '@softonic/http-log-format';

import packageJSON from '../package.json';

/**
 * Hapi plugin to log finished requests and responses
 *
 * @example
 *
 * // Registration
 * await server.register({
 *   plugin: HapiAccessLogger,
 *   options: {
 *     logger: bunyan.createLogger({ name: 'access-log' }),
 *     whitelistRequestHeaders: [],
 *     blacklistRequestHeaders: [],
 *     whitelistResponseHeaders: [],
 *     blacklistResponseHeaders: []
 *   }
 * });
 *
 * @type {Object}
 */
const HapiAccessLogger = {
  pkg: packageJSON,

  /**
   * Registers the plugin in the Hapi server
   * @param  {hapi.Server}  server
   * @param  {Object}       options
   * @param  {Logger}       options.logger
   * @param  {string[]}     [options.whitelistRequestHeaders]
   * @param  {string[]}     [options.blacklistRequestHeaders]
   * @param  {string[]}     [options.whitelistResponseHeaders]
   * @param  {string[]}     [options.blacklistResponseHeaders]
   */
  async register(server, options) {
    const {
      logger,
      whitelistRequestHeaders,
      blacklistRequestHeaders,
      whitelistResponseHeaders,
      blacklistResponseHeaders,
    } = options;

    server.events.on('response', (request) => {
      const { req, res } = request.raw;

      const receivedTime = new Date(request.info.received);
      const sentTime = new Date();

      const extendedReq = Object.assign({}, req, {
        timestamp: receivedTime.toISOString(),
      });

      const extendedRes = Object.assign({}, res, {
        timestamp: sentTime.toISOString(),
        responseTime: sentTime - receivedTime,
      });

      const loggableRequest = formatRequest(extendedReq, {
        whitelistHeaders: whitelistRequestHeaders,
        blacklistHeaders: blacklistRequestHeaders,
      });

      const loggableResponse = formatResponse(extendedRes, {
        whitelistHeaders: whitelistResponseHeaders,
        blacklistHeaders: blacklistResponseHeaders,
      });

      const message = `${stringifyRequest(loggableRequest)} ${stringifyResponse(loggableResponse)}`;

      logger.info({
        request: loggableRequest,
        response: loggableResponse,
      }, message);
    });
  },
};

export default HapiAccessLogger;
