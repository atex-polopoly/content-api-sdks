'use strict';

var http = require('http'),
    q = require('q'),
    _ = require('underscore');

/**
 * @typedef {Object} SuccessfulResponse
 * @property {String} etag - the returned etag header (if none, this is undefined)
 * @property {Object} responseData - the returned payload
 */

/**
 * The ContentApiClientFactory constructs ContentApiClient objects.
 *
 * @param {String} host - host to where the Content API is hosted
 * @param {Number} port - port where the Content API is listening
 * @param {String} path - path to the Content API relative to the host (should include leading slash)
 *
 * @returns a {@link ContentApiClient} instance
 *
 * @example var client = ContentApiClientFactory('localhost', 8080, '/onecms');
 */
var ContentApiClientFactory = function(host, port, path) {

  var urls = {
    auth: path +'/security/token',
    readContentId: path+'/content/contentid/',
    readExternalId: path+'/content/externalid/',
    create: path+'/content',
    search: path+'/search'
  };

  var makeRequest = function(method, path, token, payload, customHeaders) {
    var deferred = q.defer();
    var responseData = '';

    var params = {
      'hostname': host,
      'port': port,
      'method': method,
      'path': path,
      'headers': _.extend({ 'Content-Type': 'application/json' }, customHeaders)
    };

    if(token) {
      params.headers['X-Auth-Token'] = token;
    }

    var req = http.request(params, function(incomingMessage) {
      var statusCode = incomingMessage.statusCode;
      var etag = incomingMessage.headers.etag;

      incomingMessage.on('data', function(chunk) {
        responseData += chunk;
      });

      incomingMessage.on('end', function() {
        if(statusCode === 204) {
          deferred.resolve();
        }

        else {
          var jsonData = JSON.parse(responseData);

          if(new String(statusCode).indexOf(4) === 0 || new String(statusCode).indexOf(5) === 0) {
            deferred.reject('HTTP '+ statusCode +': '+ (jsonData.message || jsonData.error.msg));
          }

          if(statusCode === 303) {
            makeRequest(method, jsonData.location, token, payload, customHeaders).then(function(response) {
              deferred.resolve(response);
            }, function(error ) {
              deferred.reject(error);
            });
          } else {
            deferred.resolve({ etag: etag, responseData: jsonData });
          }
        }
      });
    });

    req.on('error', function(error) {
      console.log('ERROR: '+ error);
      deferred.reject(error);
    });

    if(params.method === 'POST' || params.method === 'PUT') {
      req.write(JSON.stringify(payload));
    }

    req.end();

    return deferred.promise;
  };

  /**
   * <p>The ContentApiClient is a stateless object which provides methods for
   * communicating with the Content API present in a Polopoly 10.10 or 10.10.1
   * installation. It is not compatible with Polopoly versions earlier than 10.10.</p>
   *
   * <p>All methods return Q promises which, if successful, are resolved with
   * {@link SuccessfulResponse} objects.
   *
   * <p>An operation will be deemed unsuccessful if the server responds with an
   * HTTP status code of 4XX or 5XX. An unsuccessful operation rejects the
   * returned promise with a string containing error details.</p>
   *
   * <p>To create objects of this type, you must use {@link ContentApiClientFactory}.</p>
   *
   * @class ContentApiClient
   */
  return {

    /**
     * Performs authentication using the given username and password. The token
     * contained by the response must be used in further communication with the
     * Content API.
     *
     * @memberof ContentApiClient
     * @instance
     *
     * @param {String} username - a username
     * @param {String} password - a password
     *
     * @returns a promise resolved with a {@link SuccessfulResponse} object.
     */
    authenticate: function(username, password) {
      var payload = {
        'username': username,
        'password': password
      };

      return makeRequest('POST', urls.auth, undefined, payload);
    },

    /**
     * Invalidates a token. After calling this method, the token can no longer
     * be used in communication with the Content API.
     *
     * @memberof ContentApiClient
     * @instance
     *
     * @param {String} token - a token to invalidate
     *
     * @returns a promise resolved with a {@link SuccessfulResponse} object.
     */
    invalidateToken: function(token) {
      return makeRequest('DELETE', urls.auth, token);
    },

    /**
     * Performs a search in the Content API.
     *
     * @memberof ContentApiClient
     * @instance
     *
     * @param {String} token - a previously acquired authentication token
     * @param {String} index - an index name for which to perform the search in
     * @param {String} searchExpression - a Solr search expression
     * @param {String} [variant] - if provided, data from Polopoly with be inlined using this variant
     * @param {Number} [rows] - number of rows included in the result
     *
     * @returns a promise resolved with a {@link SuccessfulResponse} object.
     */
    search: function(token, index, searchExpression, variant, rows) {
      var path = urls.search + '/' +
        encodeURIComponent(index) +
        '/select?q=' + encodeURIComponent(searchExpression) + '&wt=json';

      if(rows) path += '&rows='+encodeURIComponent(rows);
      if(variant) path += '&variant='+encodeURIComponent(variant);

      return makeRequest('GET', path, token);
    },

    /**
     * Creates a content.
     *
     * @memberof ContentApiClient
     * @instance
     *
     * @param {String} token - a previously acquired authentication token
     * @param {Object} payload - the payload
     *
     * @returns a promise resolved with a {@link SuccessfulResponse} object.
     */
    create: function(token, payload) {
      return makeRequest('POST', urls.create, token, payload);
    },

    /**
     * Reads a content.
     *
     * @memberof ContentApiClient
     * @instance
     *
     * @param {String} token - a previously acquired authentication token
     * @param {String} contentId - a contentId (e.g. '1.200' or 'PolopolyPost.d')
     * @param {String} [variant] - a variant to use when reading the content
     *
     * @returns a promise resolved with a {@link SuccessfulResponse} object.
     */
    read: function(token, contentId, variant) {
      var path = (/\d+\.\d+/.test(contentId) ? urls.readContentId : urls.readExternalId) + contentId;

      if(variant) path += "?variant="+ variant;

      return makeRequest('GET', path, token);
    },

    /**
     * Updates a content. Which content to update is derived from the id
     * property in the payload.
     *
     * @memberof ContentApiClient
     * @instance
     *
     * @param {String} token - a previously acquired authentication token
     * @param {Object} payload - the payload
     * @param {String} etag - the etag receieved when previously reading the content
     *
     * @returns a promise resolved with a {@link SuccessfulResponse} object.
     */
    update: function(token, payload, etag) {
      var path = (/\d+\.\d+/.test(payload.id) ? urls.readContentId : urls.readExternalId) + payload.id;
      return makeRequest('PUT', path, token, payload, { 'If-Match': etag });
    }
  };
};

module.exports = {
  client: ContentApiClient
};
