'use strict';

var http = require('http'),
    q = require('q'),
    _ = require('underscore');

var ContentApiClient = function(host, port, path) {

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

  return {
    authenticate: function(username, password) {
      var payload = {
        'username': username,
        'password': password
      };

      return makeRequest('POST', urls.auth, undefined, payload);
    },

    invalidateToken: function(token) {
      return makeRequest('DELETE', urls.auth, token);
    },

    search: function(token, index, searchExpression, variant, rows) {
      var path = urls.search+'/'+ encodeURIComponent(index) +'/select?q='+ encodeURIComponent(searchExpression) +'&wt=json';

      if(rows) path += '&rows='+encodeURIComponent(rows);
      if(variant) path += '&variant='+encodeURIComponent(variant);

      return makeRequest('GET', path, token);
    },

    create: function(token, payload, variant) {
      return makeRequest('POST', urls.create+'?variant='+variant, token, payload);
    },

    read: function(token, contentId, variant) {
      var path = (/\d+\.\d+/.test(contentId) ? urls.readContentId : urls.readExternalId) + contentId;

      if(variant) path += "?variant="+ variant;

      return makeRequest('GET', path, token);
    },

    update: function(token, payload, etag, variant) {
      var path = (/\d+\.\d+/.test(payload.id) ? urls.readContentId : urls.readExternalId) + payload.id;
      if(variant) path += "?variant="+ variant;

      return makeRequest('PUT', path, token, payload, { 'If-Match': etag });
    }
  };
};

module.exports = {
  client: ContentApiClient
};
