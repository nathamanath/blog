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

  pageComponent: _knockout2.default.observable('home'),
  pageParams: _knockout2.default.observable({}),
  pageClass: _knockout2.default.observable(),
  pageTitle: _knockout2.default.observable(),

  pageLoading: _knockout2.default.observable(false),

  getPage: function getPage(component, params) {
    var async = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    params = params || {};

    if (async) {
      // Call this after async content loaded
      params.onComponentPageLoaded = function () {
        App.pageLoading(false);
      };

      App.pageLoading(true);
    }

    App.pageComponent(component);
    App.pageParams(params);
  },

  init: function init() {
    _router2.default.init(App);
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
    this.tldr = _knockout2.default.observable();
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
        _this.tldr(article.tldr);
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

  template: '\n    <article>\n\n      <header>\n        <h1 data-bind="text: title"></h1>\n      </header>\n\n      <section class="article-content">\n        <div data-bind="html: content"></div>\n      </section>\n\n      <footer>\n\n        <div class="tldr" data-bind="with: tldr">\n          <h3>tldr:</h3>\n\n          <p data-bind="html: $data"></p>\n        </div>\n\n        <p data-bind="visible: createdAt">Created <time data-bind="timeAgo: createdAt"></time></p>\n        <p data-bind="visible: updatedAt">Updated <time data-bind="timeAgo: updatedAt"></time></p>\n\n        <ul class="next-prev">\n          <li data-bind="visible: next, with: next">\n            Next: <a data-bind="text: title, attr: { href: \'/#\' + path }"></a>\n          </li>\n\n          <li data-bind="visible: prev, with: prev">\n            Previous: <a data-bind="text: title, attr: { href: \'/#\' + path }"></a>\n          </li>\n        </ul>\n\n      </footer>\n\n    </article>\n  '
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
      return '/#' + _this.path;
    });
  },

  template: '\n    <article class="article-preview" data-bind="css: themeClass">\n\n      <header>\n        <a data-bind="attr: { href: url }">\n          <h2 data-bind="text: title"></h2>\n        </a>\n      </header>\n\n      <div data-bind="text: preview"></div>\n\n      <footer>\n        <p>\n          Created <time data-bind="timeAgo: createdAt"></time>\n        </p>\n      </footer>\n\n    </article>\n  '
});
});

;require.register("components/comments/comment.js", function(exports, require, module) {
'use strict';

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

var _remarkable = require('remarkable');

var _remarkable2 = _interopRequireDefault(_remarkable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_knockout2.default.components.register('comment', {
  viewModel: function viewModel(params) {

    this.author = params.author;

    this.text = _knockout2.default.computed(function () {
      var md = new _remarkable2.default();
      return md.render(params.text);
    });
  },

  template: '\n    <h2 data-bind="text: author"></h2>\n    <div data-bind="html: text"></div>\n  '
});
});

;require.register("components/comments/comment_form.js", function(exports, require, module) {
'use strict';

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_knockout2.default.components.register('comment-form', {
  viewModel: function viewModel(params) {
    var _this = this;

    this.author = _knockout2.default.observable();
    this.text = _knockout2.default.observable();

    this.handleSubmit = function () {

      if (!_this.author() || !_this.text()) {
        return;
      }

      var comment = { author: _this.author(), text: _this.text() };

      params.handleAddComment(comment);

      _this.author('');
      _this.text('');
    };
  },

  template: '\n    <form class="comment-form" data-bind="submit: handleSubmit">\n      <input placeholder="name" data-bind=\'value: author\'>\n      <textarea placeholder="say things" data-bind=\'value: text\'></textarea>\n\n      <button>Submit</button>\n    </form>'
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

require.register("lib/history.js", function(exports, require, module) {
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
    json2.js
    2012-10-08

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if ((typeof JSON === 'undefined' ? 'undefined' : _typeof(JSON)) !== 'object') {
  JSON = {};
}

(function () {
  'use strict';

  function f(n) {
    // Format integers to have at least two digits.
    return n < 10 ? '0' + n : n;
  }

  if (typeof Date.prototype.toJSON !== 'function') {

    Date.prototype.toJSON = function (key) {

      return isFinite(this.valueOf()) ? this.getUTCFullYear() + '-' + f(this.getUTCMonth() + 1) + '-' + f(this.getUTCDate()) + 'T' + f(this.getUTCHours()) + ':' + f(this.getUTCMinutes()) + ':' + f(this.getUTCSeconds()) + 'Z' : null;
    };

    String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function (key) {
      return this.valueOf();
    };
  }

  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      gap,
      indent,
      meta = { // table of character substitutions
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"': '\\"',
    '\\': '\\\\'
  },
      rep;

  function quote(string) {

    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.

    escapable.lastIndex = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
      var c = meta[a];
      return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
  }

  function str(key, holder) {

    // Produce a string from holder[key].

    var i,
        // The loop counter.
    k,
        // The member key.
    v,
        // The member value.
    length,
        mind = gap,
        partial,
        value = holder[key];

    // If the value has a toJSON method, call it to obtain a replacement value.

    if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && typeof value.toJSON === 'function') {
      value = value.toJSON(key);
    }

    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.

    if (typeof rep === 'function') {
      value = rep.call(holder, key, value);
    }

    // What happens next depends on the value's type.

    switch (typeof value === 'undefined' ? 'undefined' : _typeof(value)) {
      case 'string':
        return quote(value);

      case 'number':

        // JSON numbers must be finite. Encode non-finite numbers as null.

        return isFinite(value) ? String(value) : 'null';

      case 'boolean':
      case 'null':

        // If the value is a boolean or null, convert it to a string. Note:
        // typeof null does not produce 'null'. The case is included here in
        // the remote chance that this gets fixed someday.

        return String(value);

      // If the type is 'object', we might be dealing with an object or an array or
      // null.

      case 'object':

        // Due to a specification blunder in ECMAScript, typeof null is 'object',
        // so watch out for that case.

        if (!value) {
          return 'null';
        }

        // Make an array to hold the partial results of stringifying this object value.

        gap += indent;
        partial = [];

        // Is the value an array?

        if (Object.prototype.toString.apply(value) === '[object Array]') {

          // The value is an array. Stringify every element. Use null as a placeholder
          // for non-JSON values.

          length = value.length;
          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, value) || 'null';
          }

          // Join all of the elements together, separated with commas, and wrap them in
          // brackets.

          v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' : '[' + partial.join(',') + ']';
          gap = mind;
          return v;
        }

        // If the replacer is an array, use it to select the members to be stringified.

        if (rep && (typeof rep === 'undefined' ? 'undefined' : _typeof(rep)) === 'object') {
          length = rep.length;
          for (i = 0; i < length; i += 1) {
            if (typeof rep[i] === 'string') {
              k = rep[i];
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (gap ? ': ' : ':') + v);
              }
            }
          }
        } else {

          // Otherwise, iterate through all of the keys in the object.

          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (gap ? ': ' : ':') + v);
              }
            }
          }
        }

        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' : '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
  }

  // If the JSON object does not yet have a stringify method, give it one.

  if (typeof JSON.stringify !== 'function') {
    JSON.stringify = function (value, replacer, space) {

      // The stringify method takes a value and an optional replacer, and an optional
      // space parameter, and returns a JSON text. The replacer can be a function
      // that can replace values, or an array of strings that will select the keys.
      // A default replacer method can be provided. Use of the space parameter can
      // produce text that is more easily readable.

      var i;
      gap = '';
      indent = '';

      // If the space parameter is a number, make an indent string containing that
      // many spaces.

      if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
          indent += ' ';
        }

        // If the space parameter is a string, it will be used as the indent string.
      } else if (typeof space === 'string') {
        indent = space;
      }

      // If there is a replacer, it must be a function or an array.
      // Otherwise, throw an error.

      rep = replacer;
      if (replacer && typeof replacer !== 'function' && ((typeof replacer === 'undefined' ? 'undefined' : _typeof(replacer)) !== 'object' || typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
      }

      // Make a fake root object containing our value under the key of ''.
      // Return the result of stringifying the value.

      return str('', { '': value });
    };
  }

  // If the JSON object does not yet have a parse method, give it one.

  if (typeof JSON.parse !== 'function') {
    JSON.parse = function (text, reviver) {

      // The parse method takes a text and an optional reviver function, and returns
      // a JavaScript value if the text is a valid JSON text.

      var j;

      function walk(holder, key) {

        // The walk method is used to recursively walk the resulting structure so
        // that modifications can be made.

        var k,
            v,
            value = holder[key];
        if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = walk(value, k);
              if (v !== undefined) {
                value[k] = v;
              } else {
                delete value[k];
              }
            }
          }
        }
        return reviver.call(holder, key, value);
      }

      // Parsing happens in four stages. In the first stage, we replace certain
      // Unicode characters with escape sequences. JavaScript handles many characters
      // incorrectly, either silently deleting them, or treating them as line endings.

      text = String(text);
      cx.lastIndex = 0;
      if (cx.test(text)) {
        text = text.replace(cx, function (a) {
          return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        });
      }

      // In the second stage, we run the text against regular expressions that look
      // for non-JSON patterns. We are especially concerned with '()' and 'new'
      // because they can cause invocation, and '=' because it can cause mutation.
      // But just to be safe, we want to reject all unexpected forms.

      // We split the second stage into 4 regexp operations in order to work around
      // crippling inefficiencies in IE's and Safari's regexp engines. First we
      // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
      // replace all simple value tokens with ']' characters. Third, we delete all
      // open brackets that follow a colon or comma or that begin the text. Finally,
      // we look to see that the remaining characters are only whitespace or ']' or
      // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

      if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

        // In the third stage we use the eval function to compile the text into a
        // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
        // in JavaScript: it can begin a block or an object literal. We wrap the text
        // in parens to eliminate the ambiguity.

        j = eval('(' + text + ')');

        // In the optional fourth stage, we recursively walk the new structure, passing
        // each name/value pair to a reviver function for possible transformation.

        return typeof reviver === 'function' ? walk({ '': j }, '') : j;
      }

      // If the text is not JSON parseable, then a SyntaxError is thrown.

      throw new SyntaxError('JSON.parse');
    };
  }
})(); /**
      * History.js Native Adapter
      * @author Benjamin Arthur Lupton <contact@balupton.com>
      * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
      * @license New BSD License <http://creativecommons.org/licenses/BSD/>
      */

// Closure
(function (window, undefined) {
  "use strict";

  // Localise Globals

  var History = window.History = window.History || {};

  // Check Existence
  if (typeof History.Adapter !== 'undefined') {
    throw new Error('History.js Adapter has already been loaded...');
  }

  // Add the Adapter
  History.Adapter = {
    /**
     * History.Adapter.handlers[uid][eventName] = Array
     */
    handlers: {},

    /**
     * History.Adapter._uid
     * The current element unique identifier
     */
    _uid: 1,

    /**
     * History.Adapter.uid(element)
     * @param {Element} element
     * @return {String} uid
     */
    uid: function uid(element) {
      return element._uid || (element._uid = History.Adapter._uid++);
    },

    /**
     * History.Adapter.bind(el,event,callback)
     * @param {Element} element
     * @param {String} eventName - custom and standard events
     * @param {Function} callback
     * @return
     */
    bind: function bind(element, eventName, callback) {
      // Prepare
      var uid = History.Adapter.uid(element);

      // Apply Listener
      History.Adapter.handlers[uid] = History.Adapter.handlers[uid] || {};
      History.Adapter.handlers[uid][eventName] = History.Adapter.handlers[uid][eventName] || [];
      History.Adapter.handlers[uid][eventName].push(callback);

      // Bind Global Listener
      element['on' + eventName] = function (element, eventName) {
        return function (event) {
          History.Adapter.trigger(element, eventName, event);
        };
      }(element, eventName);
    },

    /**
     * History.Adapter.trigger(el,event)
     * @param {Element} element
     * @param {String} eventName - custom and standard events
     * @param {Object} event - a object of event data
     * @return
     */
    trigger: function trigger(element, eventName, event) {
      // Prepare
      event = event || {};
      var uid = History.Adapter.uid(element),
          i,
          n;

      // Apply Listener
      History.Adapter.handlers[uid] = History.Adapter.handlers[uid] || {};
      History.Adapter.handlers[uid][eventName] = History.Adapter.handlers[uid][eventName] || [];

      // Fire Listeners
      for (i = 0, n = History.Adapter.handlers[uid][eventName].length; i < n; ++i) {
        History.Adapter.handlers[uid][eventName][i].apply(this, [event]);
      }
    },

    /**
     * History.Adapter.extractEventData(key,event,extra)
     * @param {String} key - key for the event data to extract
     * @param {String} event - custom and standard events
     * @return {mixed}
     */
    extractEventData: function extractEventData(key, event) {
      var result = event && event[key] || undefined;
      return result;
    },

    /**
     * History.Adapter.onDomLoad(callback)
     * @param {Function} callback
     * @return
     */
    onDomLoad: function onDomLoad(callback) {
      var timeout = window.setTimeout(function () {
        callback();
      }, 2000);
      window.onload = function () {
        clearTimeout(timeout);
        callback();
      };
    }
  };

  // Try to Initialise History
  if (typeof History.init !== 'undefined') {
    History.init();
  }
})(window);
/**
 * History.js HTML4 Support
 * Depends on the HTML5 Support
 * @author Benjamin Arthur Lupton <contact@balupton.com>
 * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

(function (window, undefined) {
  "use strict";

  // ========================================================================
  // Initialise

  // Localise Globals

  var document = window.document,
      // Make sure we are using the correct document
  setTimeout = window.setTimeout || setTimeout,
      clearTimeout = window.clearTimeout || clearTimeout,
      setInterval = window.setInterval || setInterval,
      History = window.History = window.History || {}; // Public History Object

  // Check Existence
  if (typeof History.initHtml4 !== 'undefined') {
    throw new Error('History.js HTML4 Support has already been loaded...');
  }

  // ========================================================================
  // Initialise HTML4 Support

  // Initialise HTML4 Support
  History.initHtml4 = function () {
    // Initialise
    if (typeof History.initHtml4.initialized !== 'undefined') {
      // Already Loaded
      return false;
    } else {
      History.initHtml4.initialized = true;
    }

    // ====================================================================
    // Properties

    /**
     * History.enabled
     * Is History enabled?
     */
    History.enabled = true;

    // ====================================================================
    // Hash Storage

    /**
     * History.savedHashes
     * Store the hashes in an array
     */
    History.savedHashes = [];

    /**
     * History.isLastHash(newHash)
     * Checks if the hash is the last hash
     * @param {string} newHash
     * @return {boolean} true
     */
    History.isLastHash = function (newHash) {
      // Prepare
      var oldHash = History.getHashByIndex(),
          isLast;

      // Check
      isLast = newHash === oldHash;

      // Return isLast
      return isLast;
    };

    /**
     * History.isHashEqual(newHash, oldHash)
     * Checks to see if two hashes are functionally equal
     * @param {string} newHash
     * @param {string} oldHash
     * @return {boolean} true
     */
    History.isHashEqual = function (newHash, oldHash) {
      newHash = encodeURIComponent(newHash).replace(/%25/g, "%");
      oldHash = encodeURIComponent(oldHash).replace(/%25/g, "%");
      return newHash === oldHash;
    };

    /**
     * History.saveHash(newHash)
     * Push a Hash
     * @param {string} newHash
     * @return {boolean} true
     */
    History.saveHash = function (newHash) {
      // Check Hash
      if (History.isLastHash(newHash)) {
        return false;
      }

      // Push the Hash
      History.savedHashes.push(newHash);

      // Return true
      return true;
    };

    /**
     * History.getHashByIndex()
     * Gets a hash by the index
     * @param {integer} index
     * @return {string}
     */
    History.getHashByIndex = function (index) {
      // Prepare
      var hash = null;

      // Handle
      if (typeof index === 'undefined') {
        // Get the last inserted
        hash = History.savedHashes[History.savedHashes.length - 1];
      } else if (index < 0) {
        // Get from the end
        hash = History.savedHashes[History.savedHashes.length + index];
      } else {
        // Get from the beginning
        hash = History.savedHashes[index];
      }

      // Return hash
      return hash;
    };

    // ====================================================================
    // Discarded States

    /**
     * History.discardedHashes
     * A hashed array of discarded hashes
     */
    History.discardedHashes = {};

    /**
     * History.discardedStates
     * A hashed array of discarded states
     */
    History.discardedStates = {};

    /**
     * History.discardState(State)
     * Discards the state by ignoring it through History
     * @param {object} State
     * @return {true}
     */
    History.discardState = function (discardedState, forwardState, backState) {
      //History.debug('History.discardState', arguments);
      // Prepare
      var discardedStateHash = History.getHashByState(discardedState),
          discardObject;

      // Create Discard Object
      discardObject = {
        'discardedState': discardedState,
        'backState': backState,
        'forwardState': forwardState
      };

      // Add to DiscardedStates
      History.discardedStates[discardedStateHash] = discardObject;

      // Return true
      return true;
    };

    /**
     * History.discardHash(hash)
     * Discards the hash by ignoring it through History
     * @param {string} hash
     * @return {true}
     */
    History.discardHash = function (discardedHash, forwardState, backState) {
      //History.debug('History.discardState', arguments);
      // Create Discard Object
      var discardObject = {
        'discardedHash': discardedHash,
        'backState': backState,
        'forwardState': forwardState
      };

      // Add to discardedHash
      History.discardedHashes[discardedHash] = discardObject;

      // Return true
      return true;
    };

    /**
     * History.discardedState(State)
     * Checks to see if the state is discarded
     * @param {object} State
     * @return {bool}
     */
    History.discardedState = function (State) {
      // Prepare
      var StateHash = History.getHashByState(State),
          discarded;

      // Check
      discarded = History.discardedStates[StateHash] || false;

      // Return true
      return discarded;
    };

    /**
     * History.discardedHash(hash)
     * Checks to see if the state is discarded
     * @param {string} State
     * @return {bool}
     */
    History.discardedHash = function (hash) {
      // Check
      var discarded = History.discardedHashes[hash] || false;

      // Return true
      return discarded;
    };

    /**
     * History.recycleState(State)
     * Allows a discarded state to be used again
     * @param {object} data
     * @param {string} title
     * @param {string} url
     * @return {true}
     */
    History.recycleState = function (State) {
      //History.debug('History.recycleState', arguments);
      // Prepare
      var StateHash = History.getHashByState(State);

      // Remove from DiscardedStates
      if (History.discardedState(State)) {
        delete History.discardedStates[StateHash];
      }

      // Return true
      return true;
    };

    // ====================================================================
    // HTML4 HashChange Support

    if (History.emulated.hashChange) {
      /*
       * We must emulate the HTML4 HashChange Support by manually checking for hash changes
       */

      /**
       * History.hashChangeInit()
       * Init the HashChange Emulation
       */
      History.hashChangeInit = function () {
        // Define our Checker Function
        History.checkerFunction = null;

        // Define some variables that will help in our checker function
        var lastDocumentHash = '',
            iframeId,
            iframe,
            lastIframeHash,
            checkerRunning,
            startedWithHash = Boolean(History.getHash());

        // Handle depending on the browser
        if (History.isInternetExplorer()) {
          // IE6 and IE7
          // We need to use an iframe to emulate the back and forward buttons

          // Create iFrame
          iframeId = 'historyjs-iframe';
          iframe = document.createElement('iframe');

          // Adjust iFarme
          // IE 6 requires iframe to have a src on HTTPS pages, otherwise it will throw a
          // "This page contains both secure and nonsecure items" warning.
          iframe.setAttribute('id', iframeId);
          iframe.setAttribute('src', '#');
          iframe.style.display = 'none';

          // Append iFrame
          document.body.appendChild(iframe);

          // Create initial history entry
          iframe.contentWindow.document.open();
          iframe.contentWindow.document.close();

          // Define some variables that will help in our checker function
          lastIframeHash = '';
          checkerRunning = false;

          // Define the checker function
          History.checkerFunction = function () {
            // Check Running
            if (checkerRunning) {
              return false;
            }

            // Update Running
            checkerRunning = true;

            // Fetch
            var documentHash = History.getHash(),
                iframeHash = History.getHash(iframe.contentWindow.document);

            // The Document Hash has changed (application caused)
            if (documentHash !== lastDocumentHash) {
              // Equalise
              lastDocumentHash = documentHash;

              // Create a history entry in the iframe
              if (iframeHash !== documentHash) {
                //History.debug('hashchange.checker: iframe hash change', 'documentHash (new):', documentHash, 'iframeHash (old):', iframeHash);

                // Equalise
                lastIframeHash = iframeHash = documentHash;

                // Create History Entry
                iframe.contentWindow.document.open();
                iframe.contentWindow.document.close();

                // Update the iframe's hash
                iframe.contentWindow.document.location.hash = History.escapeHash(documentHash);
              }

              // Trigger Hashchange Event
              History.Adapter.trigger(window, 'hashchange');
            }

            // The iFrame Hash has changed (back button caused)
            else if (iframeHash !== lastIframeHash) {
                //History.debug('hashchange.checker: iframe hash out of sync', 'iframeHash (new):', iframeHash, 'documentHash (old):', documentHash);

                // Equalise
                lastIframeHash = iframeHash;

                // If there is no iframe hash that means we're at the original
                // iframe state.
                // And if there was a hash on the original request, the original
                // iframe state was replaced instantly, so skip this state and take
                // the user back to where they came from.
                if (startedWithHash && iframeHash === '') {
                  History.back();
                } else {
                  // Update the Hash
                  History.setHash(iframeHash, false);
                }
              }

            // Reset Running
            checkerRunning = false;

            // Return true
            return true;
          };
        } else {
          // We are not IE
          // Firefox 1 or 2, Opera

          // Define the checker function
          History.checkerFunction = function () {
            // Prepare
            var documentHash = History.getHash() || '';

            // The Document Hash has changed (application caused)
            if (documentHash !== lastDocumentHash) {
              // Equalise
              lastDocumentHash = documentHash;

              // Trigger Hashchange Event
              History.Adapter.trigger(window, 'hashchange');
            }

            // Return true
            return true;
          };
        }

        // Apply the checker function
        History.intervalList.push(setInterval(History.checkerFunction, History.options.hashChangeInterval));

        // Done
        return true;
      }; // History.hashChangeInit

      // Bind hashChangeInit
      History.Adapter.onDomLoad(History.hashChangeInit);
    } // History.emulated.hashChange


    // ====================================================================
    // HTML5 State Support

    // Non-Native pushState Implementation
    if (History.emulated.pushState) {
      /*
       * We must emulate the HTML5 State Management by using HTML4 HashChange
       */

      /**
       * History.onHashChange(event)
       * Trigger HTML5's window.onpopstate via HTML4 HashChange Support
       */
      History.onHashChange = function (event) {
        //History.debug('History.onHashChange', arguments);

        // Prepare
        var currentUrl = event && event.newURL || History.getLocationHref(),
            currentHash = History.getHashByUrl(currentUrl),
            currentState = null,
            currentStateHash = null,
            currentStateHashExits = null,
            discardObject;

        // Check if we are the same state
        if (History.isLastHash(currentHash)) {
          // There has been no change (just the page's hash has finally propagated)
          //History.debug('History.onHashChange: no change');
          History.busy(false);
          return false;
        }

        // Reset the double check
        History.doubleCheckComplete();

        // Store our location for use in detecting back/forward direction
        History.saveHash(currentHash);

        // Expand Hash
        if (currentHash && History.isTraditionalAnchor(currentHash)) {
          //History.debug('History.onHashChange: traditional anchor', currentHash);
          // Traditional Anchor Hash
          History.Adapter.trigger(window, 'anchorchange');
          History.busy(false);
          return false;
        }

        // Create State
        currentState = History.extractState(History.getFullUrl(currentHash || History.getLocationHref()), true);

        // Check if we are the same state
        if (History.isLastSavedState(currentState)) {
          //History.debug('History.onHashChange: no change');
          // There has been no change (just the page's hash has finally propagated)
          History.busy(false);
          return false;
        }

        // Create the state Hash
        currentStateHash = History.getHashByState(currentState);

        // Check if we are DiscardedState
        discardObject = History.discardedState(currentState);
        if (discardObject) {
          // Ignore this state as it has been discarded and go back to the state before it
          if (History.getHashByIndex(-2) === History.getHashByState(discardObject.forwardState)) {
            // We are going backwards
            //History.debug('History.onHashChange: go backwards');
            History.back(false);
          } else {
            // We are going forwards
            //History.debug('History.onHashChange: go forwards');
            History.forward(false);
          }
          return false;
        }

        // Push the new HTML5 State
        //History.debug('History.onHashChange: success hashchange');
        History.pushState(currentState.data, currentState.title, encodeURI(currentState.url), false);

        // End onHashChange closure
        return true;
      };
      History.Adapter.bind(window, 'hashchange', History.onHashChange);

      /**
       * History.pushState(data,title,url)
       * Add a new State to the history object, become it, and trigger onpopstate
       * We have to trigger for HTML4 compatibility
       * @param {object} data
       * @param {string} title
       * @param {string} url
       * @return {true}
       */
      History.pushState = function (data, title, url, queue) {
        //History.debug('History.pushState: called', arguments);

        // We assume that the URL passed in is URI-encoded, but this makes
        // sure that it's fully URI encoded; any '%'s that are encoded are
        // converted back into '%'s
        url = encodeURI(url).replace(/%25/g, "%");

        // Check the State
        if (History.getHashByUrl(url)) {
          throw new Error('History.js does not support states with fragment-identifiers (hashes/anchors).');
        }

        // Handle Queueing
        if (queue !== false && History.busy()) {
          // Wait + Push to Queue
          //History.debug('History.pushState: we must wait', arguments);
          History.pushQueue({
            scope: History,
            callback: History.pushState,
            args: arguments,
            queue: queue
          });
          return false;
        }

        // Make Busy
        History.busy(true);

        // Fetch the State Object
        var newState = History.createStateObject(data, title, url),
            newStateHash = History.getHashByState(newState),
            oldState = History.getState(false),
            oldStateHash = History.getHashByState(oldState),
            html4Hash = History.getHash(),
            wasExpected = History.expectedStateId == newState.id;

        // Store the newState
        History.storeState(newState);
        History.expectedStateId = newState.id;

        // Recycle the State
        History.recycleState(newState);

        // Force update of the title
        History.setTitle(newState);

        // Check if we are the same State
        if (newStateHash === oldStateHash) {
          //History.debug('History.pushState: no change', newStateHash);
          History.busy(false);
          return false;
        }

        // Update HTML5 State
        History.saveState(newState);

        // Fire HTML5 Event
        if (!wasExpected) History.Adapter.trigger(window, 'statechange');

        // Update HTML4 Hash
        if (!History.isHashEqual(newStateHash, html4Hash) && !History.isHashEqual(newStateHash, History.getShortUrl(History.getLocationHref()))) {
          History.setHash(newStateHash, false);
        }

        History.busy(false);

        // End pushState closure
        return true;
      };

      /**
       * History.replaceState(data,title,url)
       * Replace the State and trigger onpopstate
       * We have to trigger for HTML4 compatibility
       * @param {object} data
       * @param {string} title
       * @param {string} url
       * @return {true}
       */
      History.replaceState = function (data, title, url, queue) {
        //History.debug('History.replaceState: called', arguments);

        // We assume that the URL passed in is URI-encoded, but this makes
        // sure that it's fully URI encoded; any '%'s that are encoded are
        // converted back into '%'s
        url = encodeURI(url).replace(/%25/g, "%");

        // Check the State
        if (History.getHashByUrl(url)) {
          throw new Error('History.js does not support states with fragment-identifiers (hashes/anchors).');
        }

        // Handle Queueing
        if (queue !== false && History.busy()) {
          // Wait + Push to Queue
          //History.debug('History.replaceState: we must wait', arguments);
          History.pushQueue({
            scope: History,
            callback: History.replaceState,
            args: arguments,
            queue: queue
          });
          return false;
        }

        // Make Busy
        History.busy(true);

        // Fetch the State Objects
        var newState = History.createStateObject(data, title, url),
            newStateHash = History.getHashByState(newState),
            oldState = History.getState(false),
            oldStateHash = History.getHashByState(oldState),
            previousState = History.getStateByIndex(-2);

        // Discard Old State
        History.discardState(oldState, newState, previousState);

        // If the url hasn't changed, just store and save the state
        // and fire a statechange event to be consistent with the
        // html 5 api
        if (newStateHash === oldStateHash) {
          // Store the newState
          History.storeState(newState);
          History.expectedStateId = newState.id;

          // Recycle the State
          History.recycleState(newState);

          // Force update of the title
          History.setTitle(newState);

          // Update HTML5 State
          History.saveState(newState);

          // Fire HTML5 Event
          //History.debug('History.pushState: trigger popstate');
          History.Adapter.trigger(window, 'statechange');
          History.busy(false);
        } else {
          // Alias to PushState
          History.pushState(newState.data, newState.title, newState.url, false);
        }

        // End replaceState closure
        return true;
      };
    } // History.emulated.pushState


    // ====================================================================
    // Initialise

    // Non-Native pushState Implementation
    if (History.emulated.pushState) {
      /**
       * Ensure initial state is handled correctly
       */
      if (History.getHash() && !History.emulated.hashChange) {
        History.Adapter.onDomLoad(function () {
          History.Adapter.trigger(window, 'hashchange');
        });
      }
    } // History.emulated.pushState
  }; // History.initHtml4

  // Try to Initialise History
  if (typeof History.init !== 'undefined') {
    History.init();
  }
})(window);
/**
 * History.js Core
 * @author Benjamin Arthur Lupton <contact@balupton.com>
 * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

(function (window, undefined) {
  "use strict";

  // ========================================================================
  // Initialise

  // Localise Globals

  var console = window.console || undefined,
      // Prevent a JSLint complain
  document = window.document,
      // Make sure we are using the correct document
  navigator = window.navigator,
      // Make sure we are using the correct navigator
  sessionStorage = false,
      // sessionStorage
  setTimeout = window.setTimeout,
      clearTimeout = window.clearTimeout,
      setInterval = window.setInterval,
      clearInterval = window.clearInterval,
      JSON = window.JSON,
      alert = window.alert,
      History = window.History = window.History || {},
      // Public History Object
  history = window.history; // Old History Object

  try {
    sessionStorage = window.sessionStorage; // This will throw an exception in some browsers when cookies/localStorage are explicitly disabled (i.e. Chrome)
    sessionStorage.setItem('TEST', '1');
    sessionStorage.removeItem('TEST');
  } catch (e) {
    sessionStorage = false;
  }

  // MooTools Compatibility
  JSON.stringify = JSON.stringify || JSON.encode;
  JSON.parse = JSON.parse || JSON.decode;

  // Check Existence
  if (typeof History.init !== 'undefined') {
    throw new Error('History.js Core has already been loaded...');
  }

  // Initialise History
  History.init = function (options) {
    // Check Load Status of Adapter
    if (typeof History.Adapter === 'undefined') {
      return false;
    }

    // Check Load Status of Core
    if (typeof History.initCore !== 'undefined') {
      History.initCore();
    }

    // Check Load Status of HTML4 Support
    if (typeof History.initHtml4 !== 'undefined') {
      History.initHtml4();
    }

    // Return true
    return true;
  };

  // ========================================================================
  // Initialise Core

  // Initialise Core
  History.initCore = function (options) {
    // Initialise
    if (typeof History.initCore.initialized !== 'undefined') {
      // Already Loaded
      return false;
    } else {
      History.initCore.initialized = true;
    }

    // ====================================================================
    // Options

    /**
     * History.options
     * Configurable options
     */
    History.options = History.options || {};

    /**
     * History.options.hashChangeInterval
     * How long should the interval be before hashchange checks
     */
    History.options.hashChangeInterval = History.options.hashChangeInterval || 100;

    /**
     * History.options.safariPollInterval
     * How long should the interval be before safari poll checks
     */
    History.options.safariPollInterval = History.options.safariPollInterval || 500;

    /**
     * History.options.doubleCheckInterval
     * How long should the interval be before we perform a double check
     */
    History.options.doubleCheckInterval = History.options.doubleCheckInterval || 500;

    /**
     * History.options.disableSuid
     * Force History not to append suid
     */
    History.options.disableSuid = History.options.disableSuid || false;

    /**
     * History.options.storeInterval
     * How long should we wait between store calls
     */
    History.options.storeInterval = History.options.storeInterval || 1000;

    /**
     * History.options.busyDelay
     * How long should we wait between busy events
     */
    History.options.busyDelay = History.options.busyDelay || 250;

    /**
     * History.options.debug
     * If true will enable debug messages to be logged
     */
    History.options.debug = History.options.debug || false;

    /**
     * History.options.initialTitle
     * What is the title of the initial state
     */
    History.options.initialTitle = History.options.initialTitle || document.title;

    /**
     * History.options.html4Mode
     * If true, will force HTMl4 mode (hashtags)
     */
    History.options.html4Mode = History.options.html4Mode || false;

    /**
     * History.options.delayInit
     * Want to override default options and call init manually.
     */
    History.options.delayInit = History.options.delayInit || false;

    // ====================================================================
    // Interval record

    /**
     * History.intervalList
     * List of intervals set, to be cleared when document is unloaded.
     */
    History.intervalList = [];

    /**
     * History.clearAllIntervals
     * Clears all setInterval instances.
     */
    History.clearAllIntervals = function () {
      var i,
          il = History.intervalList;
      if (typeof il !== "undefined" && il !== null) {
        for (i = 0; i < il.length; i++) {
          clearInterval(il[i]);
        }
        History.intervalList = null;
      }
    };

    // ====================================================================
    // Debug

    /**
     * History.debug(message,...)
     * Logs the passed arguments if debug enabled
     */
    History.debug = function () {
      if (History.options.debug || false) {
        History.log.apply(History, arguments);
      }
    };

    /**
     * History.log(message,...)
     * Logs the passed arguments
     */
    History.log = function () {
      // Prepare
      var consoleExists = !(typeof console === 'undefined' || typeof console.log === 'undefined' || typeof console.log.apply === 'undefined'),
          textarea = document.getElementById('log'),
          message,
          i,
          n,
          args,
          arg;

      // Write to Console
      if (consoleExists) {
        args = Array.prototype.slice.call(arguments);
        message = args.shift();
        if (typeof console.debug !== 'undefined') {
          console.debug.apply(console, [message, args]);
        } else {
          console.log.apply(console, [message, args]);
        }
      } else {
        message = "\n" + arguments[0] + "\n";
      }

      // Write to log
      for (i = 1, n = arguments.length; i < n; ++i) {
        arg = arguments[i];
        if ((typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && typeof JSON !== 'undefined') {
          try {
            arg = JSON.stringify(arg);
          } catch (Exception) {
            // Recursive Object
          }
        }
        message += "\n" + arg + "\n";
      }

      // Textarea
      if (textarea) {
        textarea.value += message + "\n-----\n";
        textarea.scrollTop = textarea.scrollHeight - textarea.clientHeight;
      }
      // No Textarea, No Console
      else if (!consoleExists) {
          alert(message);
        }

      // Return true
      return true;
    };

    // ====================================================================
    // Emulated Status

    /**
     * History.getInternetExplorerMajorVersion()
     * Get's the major version of Internet Explorer
     * @return {integer}
     * @license Public Domain
     * @author Benjamin Arthur Lupton <contact@balupton.com>
     * @author James Padolsey <https://gist.github.com/527683>
     */
    History.getInternetExplorerMajorVersion = function () {
      var result = History.getInternetExplorerMajorVersion.cached = typeof History.getInternetExplorerMajorVersion.cached !== 'undefined' ? History.getInternetExplorerMajorVersion.cached : function () {
        var v = 3,
            div = document.createElement('div'),
            all = div.getElementsByTagName('i');
        while ((div.innerHTML = '<!--[if gt IE ' + ++v + ']><i></i><![endif]-->') && all[0]) {}
        return v > 4 ? v : false;
      }();
      return result;
    };

    /**
     * History.isInternetExplorer()
     * Are we using Internet Explorer?
     * @return {boolean}
     * @license Public Domain
     * @author Benjamin Arthur Lupton <contact@balupton.com>
     */
    History.isInternetExplorer = function () {
      var result = History.isInternetExplorer.cached = typeof History.isInternetExplorer.cached !== 'undefined' ? History.isInternetExplorer.cached : Boolean(History.getInternetExplorerMajorVersion());
      return result;
    };

    /**
     * History.emulated
     * Which features require emulating?
     */

    if (History.options.html4Mode) {
      History.emulated = {
        pushState: true,
        hashChange: true
      };
    } else {

      History.emulated = {
        pushState: !Boolean(window.history && window.history.pushState && window.history.replaceState && !(/ Mobile\/([1-7][a-z]|(8([abcde]|f(1[0-8]))))/i.test(navigator.userAgent) /* disable for versions of iOS before version 4.3 (8F190) */
        || /AppleWebKit\/5([0-2]|3[0-2])/i.test(navigator.userAgent) /* disable for the mercury iOS browser, or at least older versions of the webkit engine */
        )),
        hashChange: Boolean(!('onhashchange' in window || 'onhashchange' in document) || History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 8)
      };
    }

    /**
     * History.enabled
     * Is History enabled?
     */
    History.enabled = !History.emulated.pushState;

    /**
     * History.bugs
     * Which bugs are present
     */
    History.bugs = {
      /**
       * Safari 5 and Safari iOS 4 fail to return to the correct state once a hash is replaced by a `replaceState` call
       * https://bugs.webkit.org/show_bug.cgi?id=56249
       */
      setHash: Boolean(!History.emulated.pushState && navigator.vendor === 'Apple Computer, Inc.' && /AppleWebKit\/5([0-2]|3[0-3])/.test(navigator.userAgent)),

      /**
       * Safari 5 and Safari iOS 4 sometimes fail to apply the state change under busy conditions
       * https://bugs.webkit.org/show_bug.cgi?id=42940
       */
      safariPoll: Boolean(!History.emulated.pushState && navigator.vendor === 'Apple Computer, Inc.' && /AppleWebKit\/5([0-2]|3[0-3])/.test(navigator.userAgent)),

      /**
       * MSIE 6 and 7 sometimes do not apply a hash even it was told to (requiring a second call to the apply function)
       */
      ieDoubleCheck: Boolean(History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 8),

      /**
       * MSIE 6 requires the entire hash to be encoded for the hashes to trigger the onHashChange event
       */
      hashEscape: Boolean(History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 7)
    };

    /**
     * History.isEmptyObject(obj)
     * Checks to see if the Object is Empty
     * @param {Object} obj
     * @return {boolean}
     */
    History.isEmptyObject = function (obj) {
      for (var name in obj) {
        if (obj.hasOwnProperty(name)) {
          return false;
        }
      }
      return true;
    };

    /**
     * History.cloneObject(obj)
     * Clones a object and eliminate all references to the original contexts
     * @param {Object} obj
     * @return {Object}
     */
    History.cloneObject = function (obj) {
      var hash, newObj;
      if (obj) {
        hash = JSON.stringify(obj);
        newObj = JSON.parse(hash);
      } else {
        newObj = {};
      }
      return newObj;
    };

    // ====================================================================
    // URL Helpers

    /**
     * History.getRootUrl()
     * Turns "http://mysite.com/dir/page.html?asd" into "http://mysite.com"
     * @return {String} rootUrl
     */
    History.getRootUrl = function () {
      // Create
      var rootUrl = document.location.protocol + '//' + (document.location.hostname || document.location.host);
      if (document.location.port || false) {
        rootUrl += ':' + document.location.port;
      }
      rootUrl += '/';

      // Return
      return rootUrl;
    };

    /**
     * History.getBaseHref()
     * Fetches the `href` attribute of the `<base href="...">` element if it exists
     * @return {String} baseHref
     */
    History.getBaseHref = function () {
      // Create
      var baseElements = document.getElementsByTagName('base'),
          baseElement = null,
          baseHref = '';

      // Test for Base Element
      if (baseElements.length === 1) {
        // Prepare for Base Element
        baseElement = baseElements[0];
        baseHref = baseElement.href.replace(/[^\/]+$/, '');
      }

      // Adjust trailing slash
      baseHref = baseHref.replace(/\/+$/, '');
      if (baseHref) baseHref += '/';

      // Return
      return baseHref;
    };

    /**
     * History.getBaseUrl()
     * Fetches the baseHref or basePageUrl or rootUrl (whichever one exists first)
     * @return {String} baseUrl
     */
    History.getBaseUrl = function () {
      // Create
      var baseUrl = History.getBaseHref() || History.getBasePageUrl() || History.getRootUrl();

      // Return
      return baseUrl;
    };

    /**
     * History.getPageUrl()
     * Fetches the URL of the current page
     * @return {String} pageUrl
     */
    History.getPageUrl = function () {
      // Fetch
      var State = History.getState(false, false),
          stateUrl = (State || {}).url || History.getLocationHref(),
          pageUrl;

      // Create
      pageUrl = stateUrl.replace(/\/+$/, '').replace(/[^\/]+$/, function (part, index, string) {
        return (/\./.test(part) ? part : part + '/'
        );
      });

      // Return
      return pageUrl;
    };

    /**
     * History.getBasePageUrl()
     * Fetches the Url of the directory of the current page
     * @return {String} basePageUrl
     */
    History.getBasePageUrl = function () {
      // Create
      var basePageUrl = History.getLocationHref().replace(/[#\?].*/, '').replace(/[^\/]+$/, function (part, index, string) {
        return (/[^\/]$/.test(part) ? '' : part
        );
      }).replace(/\/+$/, '') + '/';

      // Return
      return basePageUrl;
    };

    /**
     * History.getFullUrl(url)
     * Ensures that we have an absolute URL and not a relative URL
     * @param {string} url
     * @param {Boolean} allowBaseHref
     * @return {string} fullUrl
     */
    History.getFullUrl = function (url, allowBaseHref) {
      // Prepare
      var fullUrl = url,
          firstChar = url.substring(0, 1);
      allowBaseHref = typeof allowBaseHref === 'undefined' ? true : allowBaseHref;

      // Check
      if (/[a-z]+\:\/\//.test(url)) {
        // Full URL
      } else if (firstChar === '/') {
        // Root URL
        fullUrl = History.getRootUrl() + url.replace(/^\/+/, '');
      } else if (firstChar === '#') {
        // Anchor URL
        fullUrl = History.getPageUrl().replace(/#.*/, '') + url;
      } else if (firstChar === '?') {
        // Query URL
        fullUrl = History.getPageUrl().replace(/[\?#].*/, '') + url;
      } else {
        // Relative URL
        if (allowBaseHref) {
          fullUrl = History.getBaseUrl() + url.replace(/^(\.\/)+/, '');
        } else {
          fullUrl = History.getBasePageUrl() + url.replace(/^(\.\/)+/, '');
        }
        // We have an if condition above as we do not want hashes
        // which are relative to the baseHref in our URLs
        // as if the baseHref changes, then all our bookmarks
        // would now point to different locations
        // whereas the basePageUrl will always stay the same
      }

      // Return
      return fullUrl.replace(/\#$/, '');
    };

    /**
     * History.getShortUrl(url)
     * Ensures that we have a relative URL and not a absolute URL
     * @param {string} url
     * @return {string} url
     */
    History.getShortUrl = function (url) {
      // Prepare
      var shortUrl = url,
          baseUrl = History.getBaseUrl(),
          rootUrl = History.getRootUrl();

      // Trim baseUrl
      if (History.emulated.pushState) {
        // We are in a if statement as when pushState is not emulated
        // The actual url these short urls are relative to can change
        // So within the same session, we the url may end up somewhere different
        shortUrl = shortUrl.replace(baseUrl, '');
      }

      // Trim rootUrl
      shortUrl = shortUrl.replace(rootUrl, '/');

      // Ensure we can still detect it as a state
      if (History.isTraditionalAnchor(shortUrl)) {
        shortUrl = './' + shortUrl;
      }

      // Clean It
      shortUrl = shortUrl.replace(/^(\.\/)+/g, './').replace(/\#$/, '');

      // Return
      return shortUrl;
    };

    /**
     * History.getLocationHref(document)
     * Returns a normalized version of document.location.href
     * accounting for browser inconsistencies, etc.
     *
     * This URL will be URI-encoded and will include the hash
     *
     * @param {object} document
     * @return {string} url
     */
    History.getLocationHref = function (doc) {
      doc = doc || document;

      // most of the time, this will be true
      if (doc.URL === doc.location.href) return doc.location.href;

      // some versions of webkit URI-decode document.location.href
      // but they leave document.URL in an encoded state
      if (doc.location.href === decodeURIComponent(doc.URL)) return doc.URL;

      // FF 3.6 only updates document.URL when a page is reloaded
      // document.location.href is updated correctly
      if (doc.location.hash && decodeURIComponent(doc.location.href.replace(/^[^#]+/, "")) === doc.location.hash) return doc.location.href;

      if (doc.URL.indexOf('#') == -1 && doc.location.href.indexOf('#') != -1) return doc.location.href;

      return doc.URL || doc.location.href;
    };

    // ====================================================================
    // State Storage

    /**
     * History.store
     * The store for all session specific data
     */
    History.store = {};

    /**
     * History.idToState
     * 1-1: State ID to State Object
     */
    History.idToState = History.idToState || {};

    /**
     * History.stateToId
     * 1-1: State String to State ID
     */
    History.stateToId = History.stateToId || {};

    /**
     * History.urlToId
     * 1-1: State URL to State ID
     */
    History.urlToId = History.urlToId || {};

    /**
     * History.storedStates
     * Store the states in an array
     */
    History.storedStates = History.storedStates || [];

    /**
     * History.savedStates
     * Saved the states in an array
     */
    History.savedStates = History.savedStates || [];

    /**
     * History.noramlizeStore()
     * Noramlize the store by adding necessary values
     */
    History.normalizeStore = function () {
      History.store.idToState = History.store.idToState || {};
      History.store.urlToId = History.store.urlToId || {};
      History.store.stateToId = History.store.stateToId || {};
    };

    /**
     * History.getState()
     * Get an object containing the data, title and url of the current state
     * @param {Boolean} friendly
     * @param {Boolean} create
     * @return {Object} State
     */
    History.getState = function (friendly, create) {
      // Prepare
      if (typeof friendly === 'undefined') {
        friendly = true;
      }
      if (typeof create === 'undefined') {
        create = true;
      }

      // Fetch
      var State = History.getLastSavedState();

      // Create
      if (!State && create) {
        State = History.createStateObject();
      }

      // Adjust
      if (friendly) {
        State = History.cloneObject(State);
        State.url = State.cleanUrl || State.url;
      }

      // Return
      return State;
    };

    /**
     * History.getIdByState(State)
     * Gets a ID for a State
     * @param {State} newState
     * @return {String} id
     */
    History.getIdByState = function (newState) {

      // Fetch ID
      var id = History.extractId(newState.url),
          str;

      if (!id) {
        // Find ID via State String
        str = History.getStateString(newState);
        if (typeof History.stateToId[str] !== 'undefined') {
          id = History.stateToId[str];
        } else if (typeof History.store.stateToId[str] !== 'undefined') {
          id = History.store.stateToId[str];
        } else {
          // Generate a new ID
          while (true) {
            id = new Date().getTime() + String(Math.random()).replace(/\D/g, '');
            if (typeof History.idToState[id] === 'undefined' && typeof History.store.idToState[id] === 'undefined') {
              break;
            }
          }

          // Apply the new State to the ID
          History.stateToId[str] = id;
          History.idToState[id] = newState;
        }
      }

      // Return ID
      return id;
    };

    /**
     * History.normalizeState(State)
     * Expands a State Object
     * @param {object} State
     * @return {object}
     */
    History.normalizeState = function (oldState) {
      // Variables
      var newState, dataNotEmpty;

      // Prepare
      if (!oldState || (typeof oldState === 'undefined' ? 'undefined' : _typeof(oldState)) !== 'object') {
        oldState = {};
      }

      // Check
      if (typeof oldState.normalized !== 'undefined') {
        return oldState;
      }

      // Adjust
      if (!oldState.data || _typeof(oldState.data) !== 'object') {
        oldState.data = {};
      }

      // ----------------------------------------------------------------

      // Create
      newState = {};
      newState.normalized = true;
      newState.title = oldState.title || '';
      newState.url = History.getFullUrl(oldState.url ? oldState.url : History.getLocationHref());
      newState.hash = History.getShortUrl(newState.url);
      newState.data = History.cloneObject(oldState.data);

      // Fetch ID
      newState.id = History.getIdByState(newState);

      // ----------------------------------------------------------------

      // Clean the URL
      newState.cleanUrl = newState.url.replace(/\??\&_suid.*/, '');
      newState.url = newState.cleanUrl;

      // Check to see if we have more than just a url
      dataNotEmpty = !History.isEmptyObject(newState.data);

      // Apply
      if ((newState.title || dataNotEmpty) && History.options.disableSuid !== true) {
        // Add ID to Hash
        newState.hash = History.getShortUrl(newState.url).replace(/\??\&_suid.*/, '');
        if (!/\?/.test(newState.hash)) {
          newState.hash += '?';
        }
        newState.hash += '&_suid=' + newState.id;
      }

      // Create the Hashed URL
      newState.hashedUrl = History.getFullUrl(newState.hash);

      // ----------------------------------------------------------------

      // Update the URL if we have a duplicate
      if ((History.emulated.pushState || History.bugs.safariPoll) && History.hasUrlDuplicate(newState)) {
        newState.url = newState.hashedUrl;
      }

      // ----------------------------------------------------------------

      // Return
      return newState;
    };

    /**
     * History.createStateObject(data,title,url)
     * Creates a object based on the data, title and url state params
     * @param {object} data
     * @param {string} title
     * @param {string} url
     * @return {object}
     */
    History.createStateObject = function (data, title, url) {
      // Hashify
      var State = {
        'data': data,
        'title': title,
        'url': url
      };

      // Expand the State
      State = History.normalizeState(State);

      // Return object
      return State;
    };

    /**
     * History.getStateById(id)
     * Get a state by it's UID
     * @param {String} id
     */
    History.getStateById = function (id) {
      // Prepare
      id = String(id);

      // Retrieve
      var State = History.idToState[id] || History.store.idToState[id] || undefined;

      // Return State
      return State;
    };

    /**
     * Get a State's String
     * @param {State} passedState
     */
    History.getStateString = function (passedState) {
      // Prepare
      var State, cleanedState, str;

      // Fetch
      State = History.normalizeState(passedState);

      // Clean
      cleanedState = {
        data: State.data,
        title: passedState.title,
        url: passedState.url
      };

      // Fetch
      str = JSON.stringify(cleanedState);

      // Return
      return str;
    };

    /**
     * Get a State's ID
     * @param {State} passedState
     * @return {String} id
     */
    History.getStateId = function (passedState) {
      // Prepare
      var State, id;

      // Fetch
      State = History.normalizeState(passedState);

      // Fetch
      id = State.id;

      // Return
      return id;
    };

    /**
     * History.getHashByState(State)
     * Creates a Hash for the State Object
     * @param {State} passedState
     * @return {String} hash
     */
    History.getHashByState = function (passedState) {
      // Prepare
      var State, hash;

      // Fetch
      State = History.normalizeState(passedState);

      // Hash
      hash = State.hash;

      // Return
      return hash;
    };

    /**
     * History.extractId(url_or_hash)
     * Get a State ID by it's URL or Hash
     * @param {string} url_or_hash
     * @return {string} id
     */
    History.extractId = function (url_or_hash) {
      // Prepare
      var id, parts, url, tmp;

      // Extract

      // If the URL has a #, use the id from before the #
      if (url_or_hash.indexOf('#') != -1) {
        tmp = url_or_hash.split("#")[0];
      } else {
        tmp = url_or_hash;
      }

      parts = /(.*)\&_suid=([0-9]+)$/.exec(tmp);
      url = parts ? parts[1] || url_or_hash : url_or_hash;
      id = parts ? String(parts[2] || '') : '';

      // Return
      return id || false;
    };

    /**
     * History.isTraditionalAnchor
     * Checks to see if the url is a traditional anchor or not
     * @param {String} url_or_hash
     * @return {Boolean}
     */
    History.isTraditionalAnchor = function (url_or_hash) {
      // Check
      var isTraditional = !/[\/\?\.]/.test(url_or_hash);

      // Return
      return isTraditional;
    };

    /**
     * History.extractState
     * Get a State by it's URL or Hash
     * @param {String} url_or_hash
     * @return {State|null}
     */
    History.extractState = function (url_or_hash, create) {
      // Prepare
      var State = null,
          id,
          url;
      create = create || false;

      // Fetch SUID
      id = History.extractId(url_or_hash);
      if (id) {
        State = History.getStateById(id);
      }

      // Fetch SUID returned no State
      if (!State) {
        // Fetch URL
        url = History.getFullUrl(url_or_hash);

        // Check URL
        id = History.getIdByUrl(url) || false;
        if (id) {
          State = History.getStateById(id);
        }

        // Create State
        if (!State && create && !History.isTraditionalAnchor(url_or_hash)) {
          State = History.createStateObject(null, null, url);
        }
      }

      // Return
      return State;
    };

    /**
     * History.getIdByUrl()
     * Get a State ID by a State URL
     */
    History.getIdByUrl = function (url) {
      // Fetch
      var id = History.urlToId[url] || History.store.urlToId[url] || undefined;

      // Return
      return id;
    };

    /**
     * History.getLastSavedState()
     * Get an object containing the data, title and url of the current state
     * @return {Object} State
     */
    History.getLastSavedState = function () {
      return History.savedStates[History.savedStates.length - 1] || undefined;
    };

    /**
     * History.getLastStoredState()
     * Get an object containing the data, title and url of the current state
     * @return {Object} State
     */
    History.getLastStoredState = function () {
      return History.storedStates[History.storedStates.length - 1] || undefined;
    };

    /**
     * History.hasUrlDuplicate
     * Checks if a Url will have a url conflict
     * @param {Object} newState
     * @return {Boolean} hasDuplicate
     */
    History.hasUrlDuplicate = function (newState) {
      // Prepare
      var hasDuplicate = false,
          oldState;

      // Fetch
      oldState = History.extractState(newState.url);

      // Check
      hasDuplicate = oldState && oldState.id !== newState.id;

      // Return
      return hasDuplicate;
    };

    /**
     * History.storeState
     * Store a State
     * @param {Object} newState
     * @return {Object} newState
     */
    History.storeState = function (newState) {
      // Store the State
      History.urlToId[newState.url] = newState.id;

      // Push the State
      History.storedStates.push(History.cloneObject(newState));

      // Return newState
      return newState;
    };

    /**
     * History.isLastSavedState(newState)
     * Tests to see if the state is the last state
     * @param {Object} newState
     * @return {boolean} isLast
     */
    History.isLastSavedState = function (newState) {
      // Prepare
      var isLast = false,
          newId,
          oldState,
          oldId;

      // Check
      if (History.savedStates.length) {
        newId = newState.id;
        oldState = History.getLastSavedState();
        oldId = oldState.id;

        // Check
        isLast = newId === oldId;
      }

      // Return
      return isLast;
    };

    /**
     * History.saveState
     * Push a State
     * @param {Object} newState
     * @return {boolean} changed
     */
    History.saveState = function (newState) {
      // Check Hash
      if (History.isLastSavedState(newState)) {
        return false;
      }

      // Push the State
      History.savedStates.push(History.cloneObject(newState));

      // Return true
      return true;
    };

    /**
     * History.getStateByIndex()
     * Gets a state by the index
     * @param {integer} index
     * @return {Object}
     */
    History.getStateByIndex = function (index) {
      // Prepare
      var State = null;

      // Handle
      if (typeof index === 'undefined') {
        // Get the last inserted
        State = History.savedStates[History.savedStates.length - 1];
      } else if (index < 0) {
        // Get from the end
        State = History.savedStates[History.savedStates.length + index];
      } else {
        // Get from the beginning
        State = History.savedStates[index];
      }

      // Return State
      return State;
    };

    /**
     * History.getCurrentIndex()
     * Gets the current index
     * @return (integer)
    */
    History.getCurrentIndex = function () {
      // Prepare
      var index = null;

      // No states saved
      if (History.savedStates.length < 1) {
        index = 0;
      } else {
        index = History.savedStates.length - 1;
      }
      return index;
    };

    // ====================================================================
    // Hash Helpers

    /**
     * History.getHash()
     * @param {Location=} location
     * Gets the current document hash
     * Note: unlike location.hash, this is guaranteed to return the escaped hash in all browsers
     * @return {string}
     */
    History.getHash = function (doc) {
      var url = History.getLocationHref(doc),
          hash;
      hash = History.getHashByUrl(url);
      return hash;
    };

    /**
     * History.unescapeHash()
     * normalize and Unescape a Hash
     * @param {String} hash
     * @return {string}
     */
    History.unescapeHash = function (hash) {
      // Prepare
      var result = History.normalizeHash(hash);

      // Unescape hash
      result = decodeURIComponent(result);

      // Return result
      return result;
    };

    /**
     * History.normalizeHash()
     * normalize a hash across browsers
     * @return {string}
     */
    History.normalizeHash = function (hash) {
      // Prepare
      var result = hash.replace(/[^#]*#/, '').replace(/#.*/, '');

      // Return result
      return result;
    };

    /**
     * History.setHash(hash)
     * Sets the document hash
     * @param {string} hash
     * @return {History}
     */
    History.setHash = function (hash, queue) {
      // Prepare
      var State, pageUrl;

      // Handle Queueing
      if (queue !== false && History.busy()) {
        // Wait + Push to Queue
        //History.debug('History.setHash: we must wait', arguments);
        History.pushQueue({
          scope: History,
          callback: History.setHash,
          args: arguments,
          queue: queue
        });
        return false;
      }

      // Log
      //History.debug('History.setHash: called',hash);

      // Make Busy + Continue
      History.busy(true);

      // Check if hash is a state
      State = History.extractState(hash, true);
      if (State && !History.emulated.pushState) {
        // Hash is a state so skip the setHash
        //History.debug('History.setHash: Hash is a state so skipping the hash set with a direct pushState call',arguments);

        // PushState
        History.pushState(State.data, State.title, State.url, false);
      } else if (History.getHash() !== hash) {
        // Hash is a proper hash, so apply it

        // Handle browser bugs
        if (History.bugs.setHash) {
          // Fix Safari Bug https://bugs.webkit.org/show_bug.cgi?id=56249

          // Fetch the base page
          pageUrl = History.getPageUrl();

          // Safari hash apply
          History.pushState(null, null, pageUrl + '#' + hash, false);
        } else {
          // Normal hash apply
          document.location.hash = hash;
        }
      }

      // Chain
      return History;
    };

    /**
     * History.escape()
     * normalize and Escape a Hash
     * @return {string}
     */
    History.escapeHash = function (hash) {
      // Prepare
      var result = History.normalizeHash(hash);

      // Escape hash
      result = window.encodeURIComponent(result);

      // IE6 Escape Bug
      if (!History.bugs.hashEscape) {
        // Restore common parts
        result = result.replace(/\%21/g, '!').replace(/\%26/g, '&').replace(/\%3D/g, '=').replace(/\%3F/g, '?');
      }

      // Return result
      return result;
    };

    /**
     * History.getHashByUrl(url)
     * Extracts the Hash from a URL
     * @param {string} url
     * @return {string} url
     */
    History.getHashByUrl = function (url) {
      // Extract the hash
      var hash = String(url).replace(/([^#]*)#?([^#]*)#?(.*)/, '$2');

      // Unescape hash
      hash = History.unescapeHash(hash);

      // Return hash
      return hash;
    };

    /**
     * History.setTitle(title)
     * Applies the title to the document
     * @param {State} newState
     * @return {Boolean}
     */
    History.setTitle = function (newState) {
      // Prepare
      var title = newState.title,
          firstState;

      // Initial
      if (!title) {
        firstState = History.getStateByIndex(0);
        if (firstState && firstState.url === newState.url) {
          title = firstState.title || History.options.initialTitle;
        }
      }

      // Apply
      try {
        document.getElementsByTagName('title')[0].innerHTML = title.replace('<', '&lt;').replace('>', '&gt;').replace(' & ', ' &amp; ');
      } catch (Exception) {}
      document.title = title;

      // Chain
      return History;
    };

    // ====================================================================
    // Queueing

    /**
     * History.queues
     * The list of queues to use
     * First In, First Out
     */
    History.queues = [];

    /**
     * History.busy(value)
     * @param {boolean} value [optional]
     * @return {boolean} busy
     */
    History.busy = function (value) {
      // Apply
      if (typeof value !== 'undefined') {
        //History.debug('History.busy: changing ['+(History.busy.flag||false)+'] to ['+(value||false)+']', History.queues.length);
        History.busy.flag = value;
      }
      // Default
      else if (typeof History.busy.flag === 'undefined') {
          History.busy.flag = false;
        }

      // Queue
      if (!History.busy.flag) {
        // Execute the next item in the queue
        clearTimeout(History.busy.timeout);
        var fireNext = function fireNext() {
          var i, queue, item;
          if (History.busy.flag) return;
          for (i = History.queues.length - 1; i >= 0; --i) {
            queue = History.queues[i];
            if (queue.length === 0) continue;
            item = queue.shift();
            History.fireQueueItem(item);
            History.busy.timeout = setTimeout(fireNext, History.options.busyDelay);
          }
        };
        History.busy.timeout = setTimeout(fireNext, History.options.busyDelay);
      }

      // Return
      return History.busy.flag;
    };

    /**
     * History.busy.flag
     */
    History.busy.flag = false;

    /**
     * History.fireQueueItem(item)
     * Fire a Queue Item
     * @param {Object} item
     * @return {Mixed} result
     */
    History.fireQueueItem = function (item) {
      return item.callback.apply(item.scope || History, item.args || []);
    };

    /**
     * History.pushQueue(callback,args)
     * Add an item to the queue
     * @param {Object} item [scope,callback,args,queue]
     */
    History.pushQueue = function (item) {
      // Prepare the queue
      History.queues[item.queue || 0] = History.queues[item.queue || 0] || [];

      // Add to the queue
      History.queues[item.queue || 0].push(item);

      // Chain
      return History;
    };

    /**
     * History.queue (item,queue), (func,queue), (func), (item)
     * Either firs the item now if not busy, or adds it to the queue
     */
    History.queue = function (item, queue) {
      // Prepare
      if (typeof item === 'function') {
        item = {
          callback: item
        };
      }
      if (typeof queue !== 'undefined') {
        item.queue = queue;
      }

      // Handle
      if (History.busy()) {
        History.pushQueue(item);
      } else {
        History.fireQueueItem(item);
      }

      // Chain
      return History;
    };

    /**
     * History.clearQueue()
     * Clears the Queue
     */
    History.clearQueue = function () {
      History.busy.flag = false;
      History.queues = [];
      return History;
    };

    // ====================================================================
    // IE Bug Fix

    /**
     * History.stateChanged
     * States whether or not the state has changed since the last double check was initialised
     */
    History.stateChanged = false;

    /**
     * History.doubleChecker
     * Contains the timeout used for the double checks
     */
    History.doubleChecker = false;

    /**
     * History.doubleCheckComplete()
     * Complete a double check
     * @return {History}
     */
    History.doubleCheckComplete = function () {
      // Update
      History.stateChanged = true;

      // Clear
      History.doubleCheckClear();

      // Chain
      return History;
    };

    /**
     * History.doubleCheckClear()
     * Clear a double check
     * @return {History}
     */
    History.doubleCheckClear = function () {
      // Clear
      if (History.doubleChecker) {
        clearTimeout(History.doubleChecker);
        History.doubleChecker = false;
      }

      // Chain
      return History;
    };

    /**
     * History.doubleCheck()
     * Create a double check
     * @return {History}
     */
    History.doubleCheck = function (tryAgain) {
      // Reset
      History.stateChanged = false;
      History.doubleCheckClear();

      // Fix IE6,IE7 bug where calling history.back or history.forward does not actually change the hash (whereas doing it manually does)
      // Fix Safari 5 bug where sometimes the state does not change: https://bugs.webkit.org/show_bug.cgi?id=42940
      if (History.bugs.ieDoubleCheck) {
        // Apply Check
        History.doubleChecker = setTimeout(function () {
          History.doubleCheckClear();
          if (!History.stateChanged) {
            //History.debug('History.doubleCheck: State has not yet changed, trying again', arguments);
            // Re-Attempt
            tryAgain();
          }
          return true;
        }, History.options.doubleCheckInterval);
      }

      // Chain
      return History;
    };

    // ====================================================================
    // Safari Bug Fix

    /**
     * History.safariStatePoll()
     * Poll the current state
     * @return {History}
     */
    History.safariStatePoll = function () {
      // Poll the URL

      // Get the Last State which has the new URL
      var urlState = History.extractState(History.getLocationHref()),
          newState;

      // Check for a difference
      if (!History.isLastSavedState(urlState)) {
        newState = urlState;
      } else {
        return;
      }

      // Check if we have a state with that url
      // If not create it
      if (!newState) {
        //History.debug('History.safariStatePoll: new');
        newState = History.createStateObject();
      }

      // Apply the New State
      //History.debug('History.safariStatePoll: trigger');
      History.Adapter.trigger(window, 'popstate');

      // Chain
      return History;
    };

    // ====================================================================
    // State Aliases

    /**
     * History.back(queue)
     * Send the browser history back one item
     * @param {Integer} queue [optional]
     */
    History.back = function (queue) {
      //History.debug('History.back: called', arguments);

      // Handle Queueing
      if (queue !== false && History.busy()) {
        // Wait + Push to Queue
        //History.debug('History.back: we must wait', arguments);
        History.pushQueue({
          scope: History,
          callback: History.back,
          args: arguments,
          queue: queue
        });
        return false;
      }

      // Make Busy + Continue
      History.busy(true);

      // Fix certain browser bugs that prevent the state from changing
      History.doubleCheck(function () {
        History.back(false);
      });

      // Go back
      history.go(-1);

      // End back closure
      return true;
    };

    /**
     * History.forward(queue)
     * Send the browser history forward one item
     * @param {Integer} queue [optional]
     */
    History.forward = function (queue) {
      //History.debug('History.forward: called', arguments);

      // Handle Queueing
      if (queue !== false && History.busy()) {
        // Wait + Push to Queue
        //History.debug('History.forward: we must wait', arguments);
        History.pushQueue({
          scope: History,
          callback: History.forward,
          args: arguments,
          queue: queue
        });
        return false;
      }

      // Make Busy + Continue
      History.busy(true);

      // Fix certain browser bugs that prevent the state from changing
      History.doubleCheck(function () {
        History.forward(false);
      });

      // Go forward
      history.go(1);

      // End forward closure
      return true;
    };

    /**
     * History.go(index,queue)
     * Send the browser history back or forward index times
     * @param {Integer} queue [optional]
     */
    History.go = function (index, queue) {
      //History.debug('History.go: called', arguments);

      // Prepare
      var i;

      // Handle
      if (index > 0) {
        // Forward
        for (i = 1; i <= index; ++i) {
          History.forward(queue);
        }
      } else if (index < 0) {
        // Backward
        for (i = -1; i >= index; --i) {
          History.back(queue);
        }
      } else {
        throw new Error('History.go: History.go requires a positive or negative integer passed.');
      }

      // Chain
      return History;
    };

    // ====================================================================
    // HTML5 State Support

    // Non-Native pushState Implementation
    if (History.emulated.pushState) {
      /*
       * Provide Skeleton for HTML4 Browsers
       */

      // Prepare
      var emptyFunction = function emptyFunction() {};
      History.pushState = History.pushState || emptyFunction;
      History.replaceState = History.replaceState || emptyFunction;
    } // History.emulated.pushState

    // Native pushState Implementation
    else {
        /*
         * Use native HTML5 History API Implementation
         */

        /**
         * History.onPopState(event,extra)
         * Refresh the Current State
         */
        History.onPopState = function (event, extra) {
          // Prepare
          var stateId = false,
              newState = false,
              currentHash,
              currentState;

          // Reset the double check
          History.doubleCheckComplete();

          // Check for a Hash, and handle apporiatly
          currentHash = History.getHash();
          if (currentHash) {
            // Expand Hash
            currentState = History.extractState(currentHash || History.getLocationHref(), true);
            if (currentState) {
              // We were able to parse it, it must be a State!
              // Let's forward to replaceState
              //History.debug('History.onPopState: state anchor', currentHash, currentState);
              History.replaceState(currentState.data, currentState.title, currentState.url, false);
            } else {
              // Traditional Anchor
              //History.debug('History.onPopState: traditional anchor', currentHash);
              History.Adapter.trigger(window, 'anchorchange');
              History.busy(false);
            }

            // We don't care for hashes
            History.expectedStateId = false;
            return false;
          }

          // Ensure
          stateId = History.Adapter.extractEventData('state', event, extra) || false;

          // Fetch State
          if (stateId) {
            // Vanilla: Back/forward button was used
            newState = History.getStateById(stateId);
          } else if (History.expectedStateId) {
            // Vanilla: A new state was pushed, and popstate was called manually
            newState = History.getStateById(History.expectedStateId);
          } else {
            // Initial State
            newState = History.extractState(History.getLocationHref());
          }

          // The State did not exist in our store
          if (!newState) {
            // Regenerate the State
            newState = History.createStateObject(null, null, History.getLocationHref());
          }

          // Clean
          History.expectedStateId = false;

          // Check if we are the same state
          if (History.isLastSavedState(newState)) {
            // There has been no change (just the page's hash has finally propagated)
            //History.debug('History.onPopState: no change', newState, History.savedStates);
            History.busy(false);
            return false;
          }

          // Store the State
          History.storeState(newState);
          History.saveState(newState);

          // Force update of the title
          History.setTitle(newState);

          // Fire Our Event
          History.Adapter.trigger(window, 'statechange');
          History.busy(false);

          // Return true
          return true;
        };
        History.Adapter.bind(window, 'popstate', History.onPopState);

        /**
         * History.pushState(data,title,url)
         * Add a new State to the history object, become it, and trigger onpopstate
         * We have to trigger for HTML4 compatibility
         * @param {object} data
         * @param {string} title
         * @param {string} url
         * @return {true}
         */
        History.pushState = function (data, title, url, queue) {
          //History.debug('History.pushState: called', arguments);

          // Check the State
          if (History.getHashByUrl(url) && History.emulated.pushState) {
            throw new Error('History.js does not support states with fragement-identifiers (hashes/anchors).');
          }

          // Handle Queueing
          if (queue !== false && History.busy()) {
            // Wait + Push to Queue
            //History.debug('History.pushState: we must wait', arguments);
            History.pushQueue({
              scope: History,
              callback: History.pushState,
              args: arguments,
              queue: queue
            });
            return false;
          }

          // Make Busy + Continue
          History.busy(true);

          // Create the newState
          var newState = History.createStateObject(data, title, url);

          // Check it
          if (History.isLastSavedState(newState)) {
            // Won't be a change
            History.busy(false);
          } else {
            // Store the newState
            History.storeState(newState);
            History.expectedStateId = newState.id;

            // Push the newState
            history.pushState(newState.id, newState.title, newState.url);

            // Fire HTML5 Event
            History.Adapter.trigger(window, 'popstate');
          }

          // End pushState closure
          return true;
        };

        /**
         * History.replaceState(data,title,url)
         * Replace the State and trigger onpopstate
         * We have to trigger for HTML4 compatibility
         * @param {object} data
         * @param {string} title
         * @param {string} url
         * @return {true}
         */
        History.replaceState = function (data, title, url, queue) {
          //History.debug('History.replaceState: called', arguments);

          // Check the State
          if (History.getHashByUrl(url) && History.emulated.pushState) {
            throw new Error('History.js does not support states with fragement-identifiers (hashes/anchors).');
          }

          // Handle Queueing
          if (queue !== false && History.busy()) {
            // Wait + Push to Queue
            //History.debug('History.replaceState: we must wait', arguments);
            History.pushQueue({
              scope: History,
              callback: History.replaceState,
              args: arguments,
              queue: queue
            });
            return false;
          }

          // Make Busy + Continue
          History.busy(true);

          // Create the newState
          var newState = History.createStateObject(data, title, url);

          // Check it
          if (History.isLastSavedState(newState)) {
            // Won't be a change
            History.busy(false);
          } else {
            // Store the newState
            History.storeState(newState);
            History.expectedStateId = newState.id;

            // Push the newState
            history.replaceState(newState.id, newState.title, newState.url);

            // Fire HTML5 Event
            History.Adapter.trigger(window, 'popstate');
          }

          // End replaceState closure
          return true;
        };
      } // !History.emulated.pushState


    // ====================================================================
    // Initialise

    /**
     * Load the Store
     */
    if (sessionStorage) {
      // Fetch
      try {
        History.store = JSON.parse(sessionStorage.getItem('History.store')) || {};
      } catch (err) {
        History.store = {};
      }

      // Normalize
      History.normalizeStore();
    } else {
      // Default Load
      History.store = {};
      History.normalizeStore();
    }

    /**
     * Clear Intervals on exit to prevent memory leaks
     */
    History.Adapter.bind(window, "unload", History.clearAllIntervals);

    /**
     * Create the initial State
     */
    History.saveState(History.storeState(History.extractState(History.getLocationHref(), true)));

    /**
     * Bind for Saving Store
     */
    if (sessionStorage) {
      // When the page is closed
      History.onUnload = function () {
        // Prepare
        var currentStore, item, currentStoreString;

        // Fetch
        try {
          currentStore = JSON.parse(sessionStorage.getItem('History.store')) || {};
        } catch (err) {
          currentStore = {};
        }

        // Ensure
        currentStore.idToState = currentStore.idToState || {};
        currentStore.urlToId = currentStore.urlToId || {};
        currentStore.stateToId = currentStore.stateToId || {};

        // Sync
        for (item in History.idToState) {
          if (!History.idToState.hasOwnProperty(item)) {
            continue;
          }
          currentStore.idToState[item] = History.idToState[item];
        }
        for (item in History.urlToId) {
          if (!History.urlToId.hasOwnProperty(item)) {
            continue;
          }
          currentStore.urlToId[item] = History.urlToId[item];
        }
        for (item in History.stateToId) {
          if (!History.stateToId.hasOwnProperty(item)) {
            continue;
          }
          currentStore.stateToId[item] = History.stateToId[item];
        }

        // Update
        History.store = currentStore;
        History.normalizeStore();

        // In Safari, going into Private Browsing mode causes the
        // Session Storage object to still exist but if you try and use
        // or set any property/function of it it throws the exception
        // "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to
        // add something to storage that exceeded the quota." infinitely
        // every second.
        currentStoreString = JSON.stringify(currentStore);
        try {
          // Store
          sessionStorage.setItem('History.store', currentStoreString);
        } catch (e) {
          if (e.code === DOMException.QUOTA_EXCEEDED_ERR) {
            if (sessionStorage.length) {
              // Workaround for a bug seen on iPads. Sometimes the quota exceeded error comes up and simply
              // removing/resetting the storage can work.
              sessionStorage.removeItem('History.store');
              sessionStorage.setItem('History.store', currentStoreString);
            } else {
              // Otherwise, we're probably private browsing in Safari, so we'll ignore the exception.
            }
          } else {
            throw e;
          }
        }
      };

      // For Internet Explorer
      History.intervalList.push(setInterval(History.onUnload, History.options.storeInterval));

      // For Other Browsers
      History.Adapter.bind(window, 'beforeunload', History.onUnload);
      History.Adapter.bind(window, 'unload', History.onUnload);

      // Both are enabled for consistency
    }

    // Non-Native pushState Implementation
    if (!History.emulated.pushState) {
      // Be aware, the following is only for native pushState implementations
      // If you are wanting to include something for all browsers
      // Then include it above this if block

      /**
       * Setup Safari Fix
       */
      if (History.bugs.safariPoll) {
        History.intervalList.push(setInterval(History.safariStatePoll, History.options.safariPollInterval));
      }

      /**
       * Ensure Cross Browser Compatibility
       */
      if (navigator.vendor === 'Apple Computer, Inc.' || (navigator.appCodeName || '') === 'Mozilla') {
        /**
         * Fix Safari HashChange Issue
         */

        // Setup Alias
        History.Adapter.bind(window, 'hashchange', function () {
          History.Adapter.trigger(window, 'popstate');
        });

        // Initialise Alias
        if (History.getHash()) {
          History.Adapter.onDomLoad(function () {
            History.Adapter.trigger(window, 'hashchange');
          });
        }
      }
    } // !History.emulated.pushState

  }; // History.initCore

  // Try to Initialise History
  if (!History.options || !History.options.delayInit) {
    History.init();
  }
})(window);
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
  init: function init(App) {

    var State = void 0;

    _crossroads2.default.parse(document.location.pathname + document.location.search);

    _crossroads2.default.bypassed.add(function (route) {
      alert('Not found.');
    });

    History = window.History;

    if (History.enabled) {
      State = History.getState();

      // set initial state to first page that was loaded
      History.pushState({ urlPath: window.location.pathname }, '', State.urlPath);
    } else {
      return false;
    }

    History.Adapter.bind(window, 'statechange', function () {
      _crossroads2.default.parse(document.location.pathname + document.location.search);
    });

    document.body.addEventListener('click', function (e) {

      var target = e.target;

      while (target.tagName !== 'BODY') {

        if (target.tagName === 'A') {

          var href = target.getAttribute('href');

          if (href.match(/^\//)) {

            e.preventDefault();

            History.pushState({ urlPath: href }, '', href);

            return false;
          }
        }

        target = target.parentNode;
      }
    });
  }

};
});

;require.alias("process/browser.js", "process");process = require('process');require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');


//# sourceMappingURL=app.js.map