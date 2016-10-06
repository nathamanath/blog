(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = null;
    hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    return aliases[name] ? expandAlias(aliases[name]) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = window;
var process;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("ajax.js", function(exports, require, module) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var CONTENT_TYPES = {
  'URLENCODED': 'application/x-www-form-urlencoded',
  'JSON': 'application/json'
};

var CALLBACKS = ['onStart', 'onSuccess', 'onError', 'onFinish', 'onTimeout'];

// ['URLENCODED', 'JSON'...]
var TYPES = function (CONTENT_TYPES) {

  var out = [];

  for (var key in CONTENT_TYPES) {
    if (CONTENT_TYPES.hasOwnProperty(key)) {
      out.push(key);
    }
  }

  return out;
}(CONTENT_TYPES);

/** @returns {bool} */
var isLocal = function isLocal(url) {
  var a = document.createElement('a');

  a.href = url;

  return a.hostname === window.location.hostname;
};

/** @returns {boolean} */
var isFormData = function isFormData(data) {
  return !!data.constructor.toString().match('FormData');
};

/** @returns xhr instance */
var xhrFactory = function xhrFactory(url) {
  var xhr = new XMLHttpRequest();

  // ie >= 10 and browsers
  if ('withCredentials' in xhr) {
    return xhr;
  }

  // ie9 xDomain
  if (!isLocal(url)) {
    return new XDomainRequest();
  }

  // ie9 local
  return new ActiveXObject('Msxml2.XMLHTTP');
};

var noop = function noop() {};

// Cause minification
var objectKeys = Object.keys;

/** Default args for ajax request. */
var defaults = {
  url: null,
  method: 'GET',
  type: 'URLENCODED',
  data: {},
  token: null,
  timeout: 0,
  headers: {}
};

CALLBACKS.forEach(function (callback) {
  defaults[callback] = noop;
});

/**
 * @param {object} a
 * @param {object} b
 * @returns {object} - a merged into b
 */
var merge = function merge(a, b) {
  objectKeys(a).forEach(function (key) {
    b[key] = a[key];
  });

  return b;
};

var mergeData = function mergeData(a, b) {
  if (isFormData(a)) {
    objectKeys(b).forEach(function (key) {
      a.append(key, b[key]);
    });

    return a;
  } else {
    return merge(b, a);
  }
};

/**
 * Take form and turn into js object
 *
 * @param form - form object
 * @returns form data as js object
 */
var serializeForm = function serializeForm(form) {
  var fields = form.querySelectorAll('input, textarea, select');

  var out = {};

  [].forEach.call(fields, function (field) {
    var key = field.name;
    var value = field.value;

    if (key) {
      out[key] = value;
    }
  });

  return out;
};

/**
 * Represents an ajax request
 *
 * @class Request
 * @private
 * @param {object} args - See Ajax.request
 */
var Request = function Request(args) {
  var self = this;

  self.url = args.url || defaults.url;
  self.method = args.method || defaults.method;
  self.type = args.type || defaults.type;
  self.token = args.token || defaults.token || self._getToken();
  self.timeout = args.timeout || defaults.timeout;

  self.headers = merge(args.headers || {}, defaults.headers);

  self.data = self._prepData(args.data);

  CALLBACKS.forEach(function (callback) {
    self[callback] = args[callback] || defaults[callback];
  });
};

Request.prototype = {
  init: function init() {
    var self = this;

    self._validate();
    self._defaultHeaders();

    self.xhr = xhrFactory(self.url);

    self.xhr.open(self.method, self.url, true);
    self.xhr.timeout = self.timeout;

    self._setRequestHeaders();
    self._bindEvents();

    var xhr = self.xhr;

    self.onStart(xhr);

    // fix for ie9 xdomain
    window.setTimeout(function () {
      self.xhr.send(self._parseData());
    }, 0);

    return this;
  },

  /**
   * @param data - request data / params
   * @returns data params merged with defaults
   */
  _prepData: function _prepData(data) {
    data = data || {};

    if (!!data.constructor.toString().match('HTMLFormElement')) {
      data = serializeForm(data);
    } else {
      data = data;
    }

    return mergeData(data, defaults.data);
  },

  _bindEvents: function _bindEvents() {
    var self = this;
    var xhr = self.xhr;

    xhr.ontimeout = self.onTimeout;

    // TODO: this is a bit nasty
    if (this._xDomainRequest()) {

      xhr.onload = function () {
        self.onSuccess(xhr);
        self.onFinish(xhr);
      };

      xhr.onerror = function () {
        self.onError(xhr);
        self.onFinish(xhr);
      };

      xhr.ontimeout = noop;
      xhr.pnprogress = noop;
    } else {

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status.toString().match(/2[0-9]{1,2}/)) {
            self.onSuccess(xhr);
          } else {
            self.onError(xhr);
          }

          self.onFinish(xhr);
        }
      };
    }
  },

  /** Are we using XDomainRequest object? */
  _xDomainRequest: function _xDomainRequest() {
    // TODO: make this nicer
    return !('withCredentials' in new XMLHttpRequest()) && !isLocal();
  },

  _setRequestHeaders: function _setRequestHeaders() {
    var self = this;

    // no headers for XDomainRequest (ie < 10)  :(
    if (self._xDomainRequest()) {
      return;
    }

    var headers = self.headers;

    objectKeys(headers).forEach(function (key) {
      self.xhr.setRequestHeader(key, headers[key]);
    });
  },

  _validate: function _validate() {
    if (TYPES.indexOf(this.type) === -1) {
      throw new Error('Ajax: Invalid type');
    }

    if (!this.url && !defaults.url) {
      throw new Error('Ajax: URL required');
    }
  },

  _defaultHeaders: function _defaultHeaders() {
    var headers = this.headers;
    var token = this.token;

    if (!isFormData(this.data)) {
      headers['Content-Type'] = this._contentType();
    }

    if (token) {
      headers['X-CSRF-Token'] = token;
    }
  },

  _contentType: function _contentType() {
    return CONTENT_TYPES[this.type];
  },

  /** look for CSRF token in meta tag */
  _getToken: function _getToken() {
    var el = document.getElementsByName('csrf-token')[0];

    if (typeof el !== 'undefined' && el !== null) {
      return el.content;
    }

    return null;
  },

  /** @returns this.data formatted for request type, this.type */
  _parseData: function _parseData() {
    var self = this;
    var data = self.data;

    if (isFormData(data)) {
      return data;
    }

    if (self.type === 'JSON') {
      return JSON.stringify(data);
    } else {
      return self._dataToURLEncoded();
    }
  },

  /** @returns this.data as url encoded params */
  _dataToURLEncoded: function _dataToURLEncoded() {
    var data = this.data;

    var out = objectKeys(data).map(function (key) {
      return key + '=' + encodeURIComponent(data[key]);
    });

    return out.join('&');
  }
};

/** @class Ajax */
exports.default = {
  /**
   * Makes an ajax request...
   *
   * @static
   * @param {string} args.url - Request url
   * @param {string} [args.method=GET] - Request method. Should be upper case string
   * @param {string} [args.type=URLENCODED] - Request type. Must be `URLENCODED`, or `JSON`.
   * @param {object} [args.data] - Request params as js object, form object, or FormData.
   * @param {string} [args.token] - Manually set X-CSRF-Token token header.
   * @param {integer} [args.timeout] - Request timeout. Default is no timeout.
   * @param {object} [args.object] - Request headers as key value pairs.
   * @param {function} [args.onStart] - Callback fired at start of request.
   * @param {function} [args.onSuccess] - Callback fired on successful completion of request (2xx response).
   * @param {function} [args.onError] - Callback fired if request response is not in 200 range.
   * @param {function} [args.onTimeout] - Callback fired at if request times out.
   * @param {function} [args.onFinish] - Callback fired after request successful or not.
   */
  request: function request(args) {
    return new Request(args).init();
  },

  /**
   * Change defaults for #request
   *
   * @static
   * @param {object} config - Defaults for future calls to #request. Keys are
   * the same as those documented for #request.
   * @returns {object} - new defaults for #request (config merged into defaults)
   */
  configure: function configure(config) {
    return merge(config, defaults);
  }
};
});

;require.register("app.js", function(exports, require, module) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

var _router = require('router');

var _router2 = _interopRequireDefault(_router);

require('controllers/home');

require('controllers/articles');

require('bindings');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var App = {

  API_URL: '/',

  pageComponent: _knockout2.default.observable('home'),
  pageParams: _knockout2.default.observable({}),
  pageClass: _knockout2.default.observable(),
  pageTitle: _knockout2.default.observable(),

  pageLoading: _knockout2.default.observable(false),

  getPage: function getPage(component, params) {
    params = params || {};

    // Call this after async content loaded
    params.onComponentPageLoaded = function () {
      App.pageLoading(false);
    };

    App.pageLoading(true);
    App.pageComponent(component);
    App.pageParams(params);
  },

  init: function init() {
    _router2.default.init();
    _knockout2.default.applyBindings(App, document.getElementById("htmlTop"));
  }

};

exports.default = App;
});

;require.register("bindings.js", function(exports, require, module) {
'use strict';

require('bindings/time_ago');

require('bindings/title');

require('bindings/page_component');

require('bindings/header');
});

;require.register("bindings/header.js", function(exports, require, module) {
'use strict';

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

var _utils = require('../lib/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TIMELINE_LENGTH = 300; // px
var HEADER_RANGE = { from: 500, to: 80 };
var LOGO_RANGE = { from: 190, to: 60 };

// @returns % of way through 'timeline'
var getProgress = function getProgress(scrolled) {
  return Math.min(scrolled / TIMELINE_LENGTH * 100, 100);
};

var gap = function gap(props) {
  return props.from - props.to;
};

var value = function value(progress, props) {
  return props.from - progress / 100 * gap(props);
};

_knockout2.default.bindingHandlers.header = {

  init: function init(el, valueAccessor, allBindings, viewModel, bindingContext) {

    var scrollY = window.scrollY;

    var container = (0, _utils.dgid)('container');
    var logo = (0, _utils.dgid)('logo');

    var update = function update(progress) {
      var elHeight = value(progress, HEADER_RANGE) + 'px';

      el.style.height = elHeight;
      container.style.paddingTop = elHeight;
      logo.style.height = value(progress, LOGO_RANGE) + 'px';
    };

    update(getProgress(scrollY));

    var onScroll = (0, _utils.throttle)(function (e) {
      scrollY = window.scrollY;
      update(getProgress(scrollY));
    }, 1000 / 60, this);

    window.addEventListener('scroll', onScroll);
  }

};
});

;require.register("bindings/page_component.js", function(exports, require, module) {
'use strict';

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SHOW_CLASS = 'animate-in';

_knockout2.default.bindingHandlers.pageComponent = {

  init: function init(el, valueAccessor, allBindings, viewModel, bindingContext) {
    var value = valueAccessor();
    var componentName = value.name;
    var actualComponentName = _knockout2.default.observable(componentName());

    // Get transition changing between pages with same template
    componentName.extend({ notify: 'always' });

    el.addEventListener('animationend', function () {
      el.classList.remove(SHOW_CLASS);
      // Take on actual height with new content
      el.style.height = '';
    });

    componentName.subscribe(function (newComponent) {

      // Keep current height so that footer dosent jump up the  page
      el.style.height = el.offsetHeight + 'px';

      // Vanish
      window.scroll(0, 0);

      // Change page content
      actualComponentName(newComponent);

      // TODO: Handle loading state... callback to page component to signal ready.

      // Re-appear
      el.classList.add(SHOW_CLASS);
    });

    // Use component binding to handle actual component changes :)
    _knockout2.default.bindingHandlers.component.init(el, function () {
      return { name: actualComponentName, params: value.params };
    }, allBindings, viewModel, bindingContext);
  }
};
});

;require.register("bindings/time_ago.js", function(exports, require, module) {
'use strict';

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

var _time_ago = require('../lib/time_ago');

var _time_ago2 = _interopRequireDefault(_time_ago);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var timeAgo = void 0;

_knockout2.default.bindingHandlers.timeAgo = {

  update: function update(el, valueAccessor, allBindings, viewModel, bindingContext) {
    var time = _knockout2.default.unwrap(valueAccessor());

    if (timeAgo) {
      timeAgo.destroy();
    }

    timeAgo = new _time_ago2.default(el, time);
  }
};
});

;require.register("bindings/title.js", function(exports, require, module) {
'use strict';

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var baseTitle = void 0;

_knockout2.default.bindingHandlers.title = {

  init: function init(el, valueAccessor, allBindings, viewModel, bindingContext) {
    baseTitle = document.title;
  },

  update: function update(el, valueAccessor, allBindings, viewModel, bindingContext) {
    var pageTitle = _knockout2.default.unwrap(valueAccessor());

    document.title = pageTitle ? pageTitle + ' | ' + baseTitle : baseTitle;
  }
};
});

;require.register("components/article.js", function(exports, require, module) {
'use strict';

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

var _ajax = require('ajax');

var _ajax2 = _interopRequireDefault(_ajax);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_knockout2.default.components.register('article', {
  viewModel: function viewModel(params) {
    var _this = this;

    this.title = _knockout2.default.observable();
    this.content = _knockout2.default.observable();
    this.createdAt = _knockout2.default.observable();
    this.updatedAt = _knockout2.default.observable();
    this.themeClass = _knockout2.default.observable();
    this.next = _knockout2.default.observable();
    this.prev = _knockout2.default.observable();

    // this.commentsUrl = params.commentsUrl

    _ajax2.default.request({
      url: params.url,

      onSuccess: function onSuccess(xhr) {

        var article = JSON.parse(xhr.responseText);

        _this.title(article.title);
        _this.content(article.content);
        _this.createdAt(article.created_at);
        _this.updatedAt(article.updated_at);
        _this.next(article.next);
        _this.prev(article.prev);

        params.pageClassAccessor(article.theme_class);
        params.pageTitleAccessor(article.title);
        params.onComponentPageLoaded.call();
      },

      onError: function onError() {
        alert('Could not get article. Please try again later.');
      }
    });
  },

  template: '\n    <article>\n\n      <header>\n        <h1 data-bind="text: title"></h1>\n      </header>\n\n      <section class="article-content">\n        <div data-bind="html: content"></div>\n      </section>\n\n      <footer>\n\n        <p data-bind="visible: createdAt">Created <time data-bind="timeAgo: createdAt"></time></p>\n        <p data-bind="visible: updatedAt">Updated <time data-bind="timeAgo: updatedAt"></time></p>\n\n        <ul class="next-prev">\n          <li data-bind="visible: next, with: next">\n            Next: <a data-bind="text: title, attr: { href: \'/#\' + path }"></a>\n          </li>\n\n          <li data-bind="visible: prev, with: prev">\n            Previous: <a data-bind="text: title, attr: { href: \'/#\' + path }"></a>\n          </li>\n        </ul>\n\n      </footer>\n\n    </article>\n  '
});
});

;require.register("components/article_list.js", function(exports, require, module) {
'use strict';

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

var _ajax = require('ajax');

var _ajax2 = _interopRequireDefault(_ajax);

require('components/article_preview');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_knockout2.default.components.register('article-list', {
  viewModel: function viewModel(params) {
    var _this = this;

    this.articles = _knockout2.default.observableArray();

    _ajax2.default.request({
      url: params.url,
      onSuccess: function onSuccess(xhr) {
        _this.articles(JSON.parse(xhr.responseText));
        params.onLoad.call();
      }
    });
  },

  template: '\n    <ul data-bind=\'foreach: articles\' class="article-list">\n      <li>\n        <article-preview params="{ path: path, title: title, preview: preview, createdAt: created_at, themeClass: theme_class }">\n        </article-preview>\n      </li>\n    </ul>\n  '
});
});

;require.register("components/article_preview.js", function(exports, require, module) {
'use strict';

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_knockout2.default.components.register('article-preview', {
  viewModel: function viewModel(params) {
    var _this = this;

    this.title = params.title;
    this.createdAt = params.createdAt;
    this.preview = params.preview;
    this.path = params.path;
    this.themeClass = params.themeClass;

    this.url = _knockout2.default.computed(function () {
      return '' + _this.path;
    });
  },

  template: '\n    <article class="article-preview" data-bind="css: themeClass">\n\n      <header>\n        <a data-bind="attr: { href: url }">\n          <h2 data-bind="text: title"></h2>\n        </a>\n      </header>\n\n      <div data-bind="text: preview"></div>\n\n      <footer>\n        <p>\n          Created <time data-bind="timeAgo: createdAt"></time>\n        </p>\n      </footer>\n\n    </article>\n  '
});
});

;require.register("components/home.js", function(exports, require, module) {
'use strict';

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

require('components/article_list');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_knockout2.default.components.register('home', {
  viewModel: function viewModel(params) {
    this.articlesURL = params.url;
    this.onLoad = params.onComponentPageLoaded;
  },

  template: '\n    <article-list params="{ url: articlesURL, onLoad: onLoad }"></article-list>\n  '
});
});

;require.register("controllers/articles.js", function(exports, require, module) {
'use strict';

var _crossroads = require('crossroads');

var _crossroads2 = _interopRequireDefault(_crossroads);

var _app = require('app');

var _app2 = _interopRequireDefault(_app);

require('../components/article');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_crossroads2.default.addRoute('{year}/{slug}', function (year, slug) {

  var url = '/' + year + '/' + slug + '.json';

  _app2.default.getPage('article', {
    url: url,
    pageClassAccessor: _app2.default.pageClass,
    pageTitleAccessor: _app2.default.pageTitle
  });
});
});

;require.register("controllers/home.js", function(exports, require, module) {
'use strict';

var _crossroads = require('crossroads');

var _crossroads2 = _interopRequireDefault(_crossroads);

var _app = require('app');

var _app2 = _interopRequireDefault(_app);

require('../components/home');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_crossroads2.default.addRoute('', function () {
  _app2.default.pageClass('');
  _app2.default.pageTitle('');
  _app2.default.getPage('home', { url: '/index.json' });
});
});

;require.register("initialize.js", function(exports, require, module) {
'use strict';

var _app = require('app');

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

document.addEventListener('DOMContentLoaded', function () {
  _app2.default.init();
});
});

require.register("lib/time_ago.js", function(exports, require, module) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * @fileOverview Time ago in words in js but without jquery.
 * @author NathanG
 * @version 0.1.0
 */

/**
 * Units of time required by TimeAgo
 * @private
 * @type array
 */
var UNITS = [{ name: 'second', time: 30000,
  fn: function fn(ms) {
    return Math.abs(ms) / 1000;
  } }, { name: 'minute', time: 45000,
  fn: function fn(ms) {
    return UNITS[0].fn(ms) / 60;
  } }, { name: 'hour', time: 600000,
  fn: function fn(ms) {
    return UNITS[1].fn(ms) / 60;
  } }, { name: 'day', fn: function fn(ms) {
    return UNITS[2].fn(ms) / 24;
  } }, { name: 'week', fn: function fn(ms) {
    return UNITS[3].fn(ms) / 7;
  } }, { name: 'month', fn: function fn(ms) {
    return UNITS[4].fn(ms) / 4;
  } }, { name: 'year', fn: function fn(ms) {
    return UNITS[5].fn(ms) / 12;
  } }];

/**
 * Represents a time ago instance
 *
 * @param {object} el - Dom node. Should be time element with data-time
 * attribute set
 * @class TimeAgo
 */
var TimeAgo = function TimeAgo(el, time) {
  this.el = el;
  this.time = time;
  this.date = this._parseTime();

  this.update();

  return this;
};

/** @memberof TimeAgo */
TimeAgo.prototype = {

  /**
   * diff current time and el time
   * @private
   * @returns {number}
   */
  _getDifference: function _getDifference() {
    return new Date() - this.date;
  },

  /**
   * Get time to diff from this.el
   * @private
   * @returns {string}
   */
  _getTime: function _getTime() {
    return this.time || this.el.getAttribute('data-time');
  },

  /**
   * Parse el time to date instance. Handle string of date or UTC
   * @private
   * @returns Date instance
   */
  _parseTime: function _parseTime() {
    var time = this._getTime(),
        t;

    return new Date(!!(t = time * 1) ? t : time);
  },

  /**
   * Work out measure of time we are counting time in... how many of which
   * unit. Set this.unit, aswell as this.measure
   *
   * @private
   */
  _calculateMeasure: function _calculateMeasure() {
    var lastMeasure;
    var lastUnit = UNITS[0];

    var i = 0;
    var unit;
    var measure;

    while (unit = UNITS[i]) {
      measure = unit.fn(this.difference);

      if (measure < 1) {
        this.measure = lastMeasure;
        this.unit = lastUnit;
        return;
      }

      lastUnit = unit;
      lastMeasure = measure;

      i++;
    }

    // if we get to last unit
    this.measure = lastMeasure;
    this.unit = lastUnit;
  },

  /**
   * Set timeout for next update of instance. This is declared in unit.time
   * if unit.time is falsy, then no live updates happen for unit.
   *
   * @private
   */
  _setTimeout: function _setTimeout() {
    var time = this.unit.time,
        that = this;

    if (!time) {
      return;
    }

    this._timeout = setTimeout(function () {
      that.update();
    }, time);
  },

  /**
   * Either a count of unit, or words
   *
   * @private
   * @returns {string}
   */
  _measureString: function _measureString() {
    var out,
        measure = this.measure;

    if (measure < 2) {
      out = this.unit.name === 'hour' ? 'an' : 'a';
    } else {
      out = String(Math.floor(measure));
    }

    return out;
  },

  /**
   * Output when a long amount of time has passed. i.e. not seconds.
   * @private
   * @returns {string} time ago in words
   */
  _longOutput: function _longOutput() {
    var prefix = null;
    var measure = this.measure;
    var measureFloor = Math.floor(measure);
    var unitString = this.unit.name;

    if (measureFloor !== measure) {
      prefix = 'about';
    }

    if (measure >= 2) {
      unitString += 's';
    }

    var out = [this._measureString(), unitString, 'ago'];

    if (prefix) {
      out.unshift(prefix);
    }

    return out.join(' ');
  },

  /**
   * Output for when less than a minute has passed.
   * @private
   * @retuens {string}
   */
  _shortOutput: function _shortOutput() {
    return 'less than a minute ago';
  },

  /**
   * Is time diff in seconds?
   * @private
   * @returns {boolean}
   */
  _isSeconds: function _isSeconds() {
    return this.unit !== UNITS[0];
  },

  /**
   * @private
   * @returns {string}
   */
  _outputString: function _outputString() {
    return this._isSeconds() ? this._longOutput() : this._shortOutput();
  },

  /**
   * update diff and update dom
   */
  update: function update() {
    this.difference = this._getDifference();
    this._calculateMeasure();

    this.el.innerHTML = this._outputString();
    this._setTimeout();
  },

  destroy: function destroy() {
    // remove timeouts
    clearTimeout(this._timeout);
  }
};

/**
 * Kick off TimeAgo for 1 or more dom nodes
 *
 * @param {array} els - array of dom nodes, see TimeAgo
 */
TimeAgo.init = function (els) {
  var times = [];

  if (!els instanceof Array) {
    throw new Error('TimeAgo.init requires els');
  }

  for (var i = 0; i < els.length; i++) {
    var el = els[i];

    times.push(TimeAgo.new(el));
  }

  return times;
};

/**
 * New Timeago instance
 *
 * @param {object} el - see TimeAgo
 * @returs TimeAgo instance
 */
TimeAgo.new = function (el) {
  if (typeof el === 'undefined') {
    throw new Error('TimeAgo.new requires el');
  }

  return new TimeAgo(el);
};

exports.default = TimeAgo;
});

;require.register("lib/utils.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var dgid = exports.dgid = function dgid(id) {
  return document.getElementById(id);
};

var $ = exports.$ = function $(selector, scope) {
  scope = scope || document;
  return scope.querySelector(selector);
};

/** @returns Array of matching nodes */
var $$ = exports.$$ = function $$(selector, scope) {
  scope = scope || document;
  return Array.prototype.slice.call(scope.querySelectorAll(selector));
};

/**
 * @param fn - function to be throttled
 * @param threshhold - min time in ms between calls to fn
 * @param scope - scope in which fn is executed
 * @returns throttled version of function
 */
var throttle = exports.throttle = function throttle(fn, threshhold, scope) {
  threshhold = threshhold || 300;

  var last = void 0;
  var deferTimer = void 0;

  return function () {
    var context = scope || this;
    var now = new Date().getTime();
    var args = arguments;

    if (last && now < last + threshhold) {
      clearTimeout(deferTimer);

      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
};
});

;require.register("router.js", function(exports, require, module) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _crossroads = require('crossroads');

var _crossroads2 = _interopRequireDefault(_crossroads);

require('historyjs/scripts/uncompressed/history');

require('historyjs/scripts/uncompressed/history.adapter.native');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {

  init: function init() {
    _crossroads2.default.parse(document.location.pathname + document.location.search);

    // log all requests that were bypassed / not matched
    _crossroads2.default.bypassed.add(console.log, console);

    var State = void 0;

    if (History.enabled) {
      State = History.getState();

      History.pushState({ urlPath: window.location.pathname }, '', State.urlPath);
    } else {
      return false;
    }

    History.Adapter.bind(window, 'statechange', function () {
      _crossroads2.default.parse(document.location.pathname + document.location.search);
    });

    document.body.addEventListener('click', function (e) {
      var target = e.target;
      var tag = target.tagName;

      while (tag !== 'BODY') {
        if (tag === 'A') {

          var urlPath = target.getAttribute('href');

          // Local links only
          // TODO: be more clever about link selection... data attribute or ko binding
          if (urlPath.startsWith('/')) {
            e.preventDefault();

            History.pushState({ urlPath: urlPath }, '', urlPath);

            return;
          }
        }

        target = target.parentNode;
        tag = target.tagName;
      }
    });
  }

};
});

;require.alias("process/browser.js", "process");process = require('process');require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');


//# sourceMappingURL=app.js.map