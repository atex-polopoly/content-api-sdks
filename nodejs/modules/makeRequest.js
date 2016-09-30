// This file have a natural home in another repository that currently
// only exist on Tobbes computer. It was manually copied here...
(function () {

  var fetch = typeof fetch !== 'undefined' ? fetch : require ('node-fetch');

  function querystring (params) {
      var str = [];
      for(var p in params)
        if (params.hasOwnProperty(p)) {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(params[p]));
        }
      return str.join("&");
  }

  module.exports = function (opts) {
    var self = this;
    var fetchopts = {
      'method': opts.method || 'GET',
      'url': opts.params ? opts.uri + '?' + querystring(opts.params) : opts.uri,
      'headers': opts.headers || {}
    };

    if (opts.body) {
      fetchopts.body = JSON.stringify (opts.body);
    }

    fetchopts.headers['content-type'] = fetchopts.headers['content-type'] || 'application/json';

    return fetch (fetchopts.url, fetchopts).then (function (response) {
      switch (response.status) {
        case 400:
        case 401:
        case 403:
        case 404:
        case 409:
        case 500:
          return response.json().then(function (erresp) { return Promise.reject(erresp); }); break;
        case 200:
        case 201:
        case 204:
        case 304:
          if (!response.headers.get('content-type')) {
            return;
          }
          var body = response.json().then(function (content) {
            if (response.headers.get('etag')) {
              self.etags[content.id] = self.etags[content.id] || {};
              self.etags[content.id][content.version] = response.headers.get('etag');
            }
            return content;
          }); return body; break;
        default: return response;
      }
    });
  }

}());
