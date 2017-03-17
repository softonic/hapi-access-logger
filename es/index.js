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
 * server.register({
 *   register: HapiAccessLogs,
 *   options: {
 *     logger: bunyan.createLogger({ name: 'access-log' }),
 *     whitelistRequestHeaders: [],
 *     blacklistRequestHeaders: [],
 *     whitelistResponseHeaders: [],
 *     blacklistResponseHeaders: []
 *   }
 * }, (error) => {});
 *
 * @type {Object}
 */
const HapiAccessLogs = {

  /**
   * Registers the plugin in the Hapi server
   * @param  {hapi.Server}  server
   * @param  {Object}       options
   * @param  {Logger}       options.logger
   * @param  {string[]}     [options.whitelistRequestHeaders]
   * @param  {string[]}     [options.blacklistRequestHeaders]
   * @param  {string[]}     [options.whitelistResponseHeaders]
   * @param  {string[]}     [options.blacklistResponseHeaders]
   * @param  {Function}     notifyRegistration
   */
  register(server, options, notifyRegistration) {
    const {
      logger,
      whitelistRequestHeaders,
      blacklistRequestHeaders,
      whitelistResponseHeaders,
      blacklistResponseHeaders,
    } = options;

    server.on('response', (request) => {
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

    notifyRegistration();
  },

};

HapiAccessLogs.register.attributes = {
  pkg: packageJSON,
};

export default HapiAccessLogs;
