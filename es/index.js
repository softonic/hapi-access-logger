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
 * Returns a string with some information from the given request
 * E.g.: 'GET example.com/test'
 * @param  {http.ClientRequest} request
 * @return {string}
 */
function makeRequestLine(request) {
  /* eslint-disable no-underscore-dangle */
  const headers = request.headers || request._headers || {};
  /* eslint-enable no-underscore-dangle */
  const host = headers.host || '';
  const url = request.url || request.path;
  return `${request.method} ${host}${url}`;
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

      const requestLine = makeRequestLine(loggableRequest);

      logger.info({
        request: loggableRequest,
        response: loggableResponse,
      }, `${requestLine} ${loggableResponse.statusCode}`);
    });

    notifyRegistration();
  },

};

HapiAccessLogs.register.attributes = {
  pkg: packageJSON,
};

export default HapiAccessLogs;
