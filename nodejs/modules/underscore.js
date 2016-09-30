// This file have a natural home in another repository that currently
// only exist on Tobbes computer. It was manually copied here...
(function () {
  'use strict';

  // Everything is pretty much stolen from underscore.js...

  var api = {};

  var createAssigner = function (keysFunc, defaults) {
    return function (obj) {
      var length = arguments.length;
      if (defaults) obj = Object(obj);
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!defaults || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  api.allKeys = function (obj) {
    if (!api.isObject (obj)) { return []; }
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
  };

  api.isObject = function (obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  api.extend = createAssigner (api.allKeys);

  [ 'Arguments', 'Function', 'String',
    'Number', 'Date', 'RegExp', 'Error',
    'Symbol', 'Map', 'WeakMap', 'Set',
    'WeakSet' ].forEach (function (name) {

    api['is' + name] = function (obj) {
      return Object.prototype.toString.call(obj) == '[object Function]';

    };
  });

  module.exports = api;
} ());
