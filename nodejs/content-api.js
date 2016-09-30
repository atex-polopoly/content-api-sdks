// This file have a natural home in another repository that currently
// only exist on Tobbes computer. It was manually copied here...
(function () {
  'use strict';

  var makeRequest = require ('./modules/makeRequest.js'),
      _ = require ('./modules/underscore.js'),
      configurations = {},
      etags = {},
      API = {};

  // I think it is hard to pin-point exactly where etags belong.

  makeRequest = makeRequest.bind({ 'etags': etags });

  function urlBuild (baseUrl) {
    baseUrl = ('' + baseUrl).replace (/\/+$/, "");
    return {
      'auth':   baseUrl + '/security/token',
      'get':    baseUrl + '/content/contentid',
      'getx':   baseUrl + '/content',
      'put':    baseUrl + '/content/contentid',
      'putx':   baseUrl + '/content',
      'post':   baseUrl + '/content',
      'search': baseUrl + '/search',
      'type':   baseUrl + '/type'
    };
  }

  /**
   * Registers a configuration scheme and activates it. If no settings object is
   * provided, it tries to switch to the named configuration. Returns a copy of
   * the active configuration.
   *
   * If an function is provided instead of a settings object that function is
   * invoked and is expected to return a settings object.
   */
  API.conf = function (name, settings) {

    if (!name || _.isObject (name) || _.isFunction (name)) {
      settings = name;
      name = API.conf.active;
    }

    if (_.isFunction (settings)) {
      return API.conf (name, settings());
    }

    if (_.isObject(settings)) {
      configurations[name] = _.extend({}, configurations[name], settings);
      configurations[name].urls = urlBuild(configurations[name].url);
    }

    API.conf.active = configurations[name] ? name : API.conf.active;
    //return configurations[API.conf.active];
    return JSON.parse(JSON.stringify(configurations[API.conf.active]));
  };

  API.conf('default', {
    'url': 'http://localhost:8080/ace',
    'user': {},
    'variant': '',
    'search': {
      'index': 'public'
    }
  });

  API.switch = function (confName) { throw 'Operation not supported';  };

  /**
   * Authenticates a user with the given username and password for the currently
   * active configuration.
   */
  API.auth = function (username, passwd) {

    var conf = configurations[API.conf.active];
    return makeRequest ({
      'uri': conf.urls.auth,
      'method': 'POST',
      'body': { 'username': username, 'password': passwd }
    }).then(function (result) {
      if (result.token) {
        conf.user = result;
        return conf.user.token;
      } else {
        throw new Error('ERROR [AUTH] No token.');
      }
    });
  };

  /**
   * Verifies the current authentication present for the current configuration
   * or verifies the provided token with the server.
   */
  API.auth.verify = function (token) {
    var conf = configurations[API.conf.active];
    return makeRequest ({
      'uri': conf.urls.auth,
      'method': 'GET',
      'headers': { 'x-auth-token': (token || conf.user.token)  }
    }).then(function (result) {
      if (result.token) {
        return result.token;
      } else {
        throw new Error('ERROR [AUTH.verify] Could find token in response.');
      }
    });
  };

  /**
   * Invalidates the token of the current configuration or the provided
   * token. * Does not seem to be implemented in ACE *
   *
   * TODO: Should the token be removed from the configuration?
   */

  API.auth.invalidate = function (token) {
    var conf =  configurations[API.conf.active];
    return makeRequest ({
      'uri': conf.urls.auth,
      'method': 'DELETE',
      'headers': { 'x-auth-token': token || conf.user.token }
    });
  };

  /**
   * TODO: There is also a call to renew a token, it should be implemented...
   */
  // API.auth.renew = function (token) {}

  /**
   * Create a content. Returns a promise that is resolved to the newly created
   * content.
   */

  API.create = function (content) {
    var conf = configurations[API.conf.active];
    return makeRequest ({
      'uri': conf.urls.post,
      'method': 'POST',
      'headers': { 'x-auth-token': conf.user.token },
      'body': content
    });
  };

  /**
   * Read a content from the server. Opts is an object containing a required
   * alias and optional other self-explanatory parameters:
   *
   * {
   *   'namespace': 'contentid',
   *   'alias': 'mycontentid',  // required
   *   'variant': 'myvariant',
   *   'view': 'myview'
   * }
   *
   * Note that all type of id's are considered aliases. Reading a content by a
   * content id is done by using the (reserved) namespace contentid:
   *
   * If no namespace property is provided the namespace must be specified in the
   * alias:
   *
   * {
   *   'alias': 'contentid/mycontentalias'
   * }
   *
   * For convenience, if opts is a string it is assumed to be a content id.
   *
   * api.read ('mycontentid', 'myvariant').then(...)
   *
   *   -> get myvariant of contentid/mycontentid
   *
   * ...but, maybe this is just confusing?
   *
   * Also if the second parameter 'variant' is provided it will be used as
   * variant in the request (overriding the variant parameter in the
   * opts-object).
   *
   * api.read ({ 'alias': 'contentid/mycontentid', 'variant': 'somevariant' }, 'someothervariant').then(...)
   *
   *   -> get someothervariant of contentid/mycontentid
   */
  API.read = function (opts, variant) {

    var conf = configurations[API.conf.active],
        url = conf.urls.getx;

    if (opts.view) {
      url = url + '/view/' + opts.view;
    }

    if (typeof opts === 'string' || opts instanceof String) {
      opts = {
        alias: 'contentid/' + opts,
        variant: variant
      }
    } else {
      variant = variant || opts.variant;
    }

    opts.alias = opts.namespace ? opts.namespace + '/' + opts.alias : opts.alias;

    url = url + '/' + opts.alias;

    return makeRequest ({
      'uri': url,
      'params': variant ? { 'variant': variant } : undefined,
      'method': 'GET',
      'headers': { 'x-auth-token': conf.user.token }
    });
  };

  /**
   * Get type description for a content type in the system.
   */
  API.type = function (typename, recursive) {
    var conf = configurations[API.conf.active];
    return makeRequest ({
      'uri': conf.urls.type + '/' + typename,
      'qs': { 'recursive': !!recursive },
      'method': 'GET',
      'json': true,
      'headers': { 'x-auth-token': conf.user.token }
    });
  };

  /**
   * Get the content history for a content
   */
  API.history = function (alias) {
    var conf = configurations[API.conf.active];
    return makeRequest ({
      'uri': conf.urls.getx + '/' + alias + '/history',
      'method': 'GET',
      'json': true,
      'headers': { 'x-auth-token': conf.user.token }
    });
  };

  /**
   * Awkward:
   * As of now, you _must_ have performed a read of the content, *with this instance of the client*, before updating
   * it... Users of a contentAPI should not have to be aware of http headers getting set, it should be handled by the
   * client.
   */
  API.update = function (content) {
    var conf = configurations[API.conf.active];

    return makeRequest ({
      'uri': conf.urls.put + '/' + content.id,
      'method': 'PUT',
      'headers': { 'x-auth-token': conf.user.token, 'if-match': etags[content.id][content.version] },
      'body': content
    });
  };

  API.delete = function (content) {
    var conf = configurations[API.conf.active];

    return makeRequest ({
      'uri': conf.urls.get + '/' + content.id,
      'method': 'DELETE',
      'headers': { 'x-auth-token': conf.user.token, 'if-match': etags[content.id][content.version] }
    });
  };

  API.search = function (core, params, variant) {
    var conf = configurations[API.conf.active];

    if (variant) {
      params.variant = variant;
    }

    return makeRequest ({
      'uri': conf.urls.search + '/' + core + '/' + 'select',
      'params': params,
      'method': 'GET',
      'headers': { 'x-auth-token': conf.user.token }
    });
  };

  /**
   * Returns a json stringified object representing the current state of the
   * contentAPI. Does not store etag info at the moment.
   *
   * If supplied with the argument snapshot, a json string representing a
   * previous state of the contentAPI, it will reset the contentAPI to that
   * state.
   */
  API.snapshot = function (snapshot) {
    var jsonSnapshot = JSON.stringify(configurations);
    if (snapshot) {
      configurations = JSON.parse(snapshot);
    }
    return jsonSnapshot;
  };

  module.exports =  Object.create(API);

} ());
