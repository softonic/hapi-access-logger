import { formatRequest, formatResponse } from '@softonic/http-log-format';
import { pick, omit } from 'lodash';
import packageJSON from '../package.json';

/**
 * Filters the given headers object picking the given whitelisted headers (if any) and removing
 * all blacklisted ones
 * @param  {Object.<string, string>} options.headers
 * @param  {string[]} [options.whitelistHeaders]
 * @param  {string[]} [options.blacklistHeaders]
 * @return {Object.<string, string>}
 */
function filterHeaders({ headers, whitelistHeaders, blacklistHeaders }) {
  const whitelistedHeaders = whitelistHeaders ? pick(headers, whitelistHeaders) : headers;
  return omit(whitelistedHeaders, blacklistHeaders);
}

/**
 * Hapi plugin to log finished requests and responses
 *
 * @example
 *
 * // Registration
 * server.register({
 *   register: HapiAccessLogs,
 *   options: {
 *     logger: bunyan.createLogger({ name: 'access-log' })
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

      const loggableRequest = formatRequest(extendedReq);
      loggableRequest.headers = filterHeaders({
        headers: loggableRequest.headers,
        whitelistHeaders: whitelistRequestHeaders,
        blacklistHeaders: blacklistRequestHeaders,
      });

      const loggableResponse = formatResponse(extendedRes);
      loggableResponse.headers = filterHeaders({
        headers: loggableResponse.headers,
        whitelistHeaders: whitelistResponseHeaders,
        blacklistHeaders: blacklistResponseHeaders,
      });

      logger.info({
        request: loggableRequest,
        response: loggableResponse,
      });
    });

    notifyRegistration();
  },

};

HapiAccessLogs.register.attributes = {
  pkg: packageJSON,
};

export default HapiAccessLogs;
