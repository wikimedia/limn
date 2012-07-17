var fs, dirname, path, exec, spawn, subproc, exists, Seq, glob, yaml, express, op, mkdirp, mkdirpAsync, readFilesAsync, Controller, BASE, LIB, SRC, STATIC, WWW, NODE_ENV, IS_DEV, IS_PROD, LOG_LEVEL, REV, DEFAULT_OPTIONS, exports, application, _ref, _;
fs = require('fs');
path = (_ref = require('path'), dirname = _ref.dirname, _ref);
subproc = (_ref = require('child_process'), exec = _ref.exec, spawn = _ref.spawn, _ref);
exists = fs.existsSync || path.existsSync;
Seq = require('seq');
glob = require('glob');
yaml = require('js-yaml');
express = require('express');
_ref = require('../util'), _ = _ref._, op = _ref.op;
_ref = require('./mkdirp'), mkdirp = _ref.mkdirp, mkdirpAsync = _ref.mkdirpAsync;
readFilesAsync = require('./files').readFilesAsync;
Controller = require('./controller');
/**
 * Limn project-internals
 */
BASE = dirname(dirname(__dirname));
LIB = BASE + "/lib";
SRC = BASE + "/src";
STATIC = BASE + "/static";
WWW = BASE + "/www";
NODE_ENV = process.env.NODE_ENV || 'development';
IS_DEV = NODE_ENV === 'development';
IS_PROD = NODE_ENV === 'production';
LOG_LEVEL = process.env.LIMN_LOG_LEVEL;
LOG_LEVEL || (LOG_LEVEL = IS_DEV ? 'INFO' : 'WARN');
LOG_LEVEL = LOG_LEVEL.toUpperCase();
REV = process.env.LIMN_REV || 'HEAD';
try {
  REV = require('../version');
} catch (e) {}
/**
 * Limn option defaults.
 */
DEFAULT_OPTIONS = {
  /**
   * @name dataDir
   * @type String
   * Path to directory where data and metadata files are stored.
   */
  dataDir: './data'
  /**
   * @name varDir
   * @type String
   * Path to directory where derived files are written while in dev-mode.
   */,
  varDir: './var'
  /**
   * @name proxy
   * @type Object
   */,
  proxy: {
    /**
     * @name enabled
     * @type Boolean
     * Enables remote dataset proxy. If omitted, the proxy will be enabled
     * if either `proxy.whitelist` or `proxy.blacklist` are set.
     */
    enabled: false
    /**
     * @name whitelist
     * @type Array<String|RegExp>
     * Array of domain patterns to whitelist for proxy. Strings are matched
     * via glob syntax, but regular expressions may also be passed. 
     * If `proxy.enabled` is true but no whitelist is provided, it defaults to `['*']`.
     */,
    whitelist: null
    /**
     * @name blacklist
     * @type Array<String|RegExp>
     * Array of domain patterns to blacklist from proxying. Strings are matched
     * via glob syntax, but regular expressions may also be passed.
     */,
    blacklist: null
  }
  /**
   * @name staticMaxAge
   * @type Object
   * Max-Age of static files served by Limn. Object is a hash from NODE_ENV to
   * expiry time in miliseconds, with a special key "default" that does what you
   * expect.
   */,
  staticMaxAge: {
    'default': 0,
    development: 0,
    production: 108000000
  }
};
exports = module.exports = limn;
/**
 * Create a new instance of the Limn middleware.
 * @param {Object} [options={}] Options:
 */
function limn(options){
  var app;
  app = express.createServer();
  app = _.extend(app, application);
  app.init(options);
  return app;
}
/**
 * Application pseudo-prototype (as we don't actually inherit from the Express server).
 */
application = limn.application = {
  /**
   * @constructor
   */
  init: function(opts){
    var app, opx, YAML_EXT_PAT, proxy;
    opts == null && (opts = {});
    app = this;
    this.REV = REV;
    this.BASE = BASE;
    opts = _.merge({}, DEFAULT_OPTIONS, opts);
    opx = opts.proxy;
    if (typeof opx === 'boolean') {
      opx = opts.proxy = {
        enabled: opx
      };
    }
    if (opx.enabled === false && (opx.whitelist || opx.blacklist)) {
      opx.enabled = true;
    }
    if (opx.enabled) {
      opx.whitelist || (opx.whitelist = [/.*/]);
      opx.blacklist || (opx.blacklist = []);
    }
    this.set('limn options', opts);
    mkdirp(opts.dataDir);
    this.configure(function(){
      var view_opts;
      this.set('views', WWW);
      this.set('view engine', 'jade');
      view_opts = __import({
        layout: false,
        config: this.set('limn options'),
        version: REV,
        IS_DEV: IS_DEV,
        IS_PROD: IS_PROD,
        REV: REV
      }, require('./view-helpers'));
      view_opts.__defineGetter__('mount', function(){
        return app.route || '/';
      });
      this.set('view options', view_opts);
      this.use(require('./reqinfo')({}));
      this.use(express.bodyParser());
      this.use(express.methodOverride());
      return this.use(this.router);
    });
    this.configure('development', function(){
      var varDir, dataDir, opts, compiler, _ref;
      opts = (_ref = this.set('limn options'), varDir = _ref.varDir, dataDir = _ref.dataDir, _ref);
      this.set('view options').pretty = true;
      this.use(require('browserify')({
        mount: '/vendor/browserify.js',
        require: ['seq', 'd3', 'events'],
        cache: varDir + "/.cache/browserify/cache.json"
      }));
      compiler = require('connect-compiler-extras');
      this.use('/js/limn', compiler({
        enabled: 'coco',
        src: SRC,
        dest: varDir + "/js/limn",
        log_level: LOG_LEVEL
      }));
      this.use(compiler({
        enabled: ['jade-browser', 'stylus', 'yaml'],
        src: WWW,
        dest: varDir,
        options: {
          stylus: {
            nib: true,
            include: WWW + "/css"
          }
        },
        log_level: LOG_LEVEL
      }));
      this.use(compiler({
        enabled: 'yaml',
        src: dataDir,
        dest: varDir + "/data",
        log_level: LOG_LEVEL
      }));
      this.use(compiler({
        enabled: ['amd', 'commonjs_define'],
        src: [STATIC],
        dest: varDir,
        options: {
          amd: {
            drop_path_parts: 1,
            drop_full_ext: false
          },
          commonjs_define: {
            drop_path_parts: 1,
            drop_full_ext: false
          }
        },
        log_level: LOG_LEVEL
      }));
      return this.use(compiler({
        enabled: ['amd', 'commonjs_define'],
        src: [varDir, WWW],
        dest: varDir,
        options: {
          amd: {
            drop_path_parts: 1,
            drop_full_ext: true
          },
          commonjs_define: {
            drop_path_parts: 1,
            drop_full_ext: true
          }
        },
        log_level: LOG_LEVEL
      }));
    });
    this.configure(function(){
      var varDir, staticMaxAge, maxAge, _ref;
      _ref = this.set('limn options'), varDir = _ref.varDir, staticMaxAge = _ref.staticMaxAge;
      maxAge = (_ref = staticMaxAge[NODE_ENV]) != null
        ? _ref
        : staticMaxAge['default'];
      this.use(express['static'](varDir, {
        maxAge: maxAge
      }));
      this.use(express['static'](WWW, {
        maxAge: maxAge
      }));
      return this.use(express['static'](STATIC, {
        maxAge: maxAge
      }));
    });
    this.controller(require('./controllers/graph'));
    this.controller(require('./controllers/dashboard'));
    YAML_EXT_PAT = /\.ya?ml$/i;
    this.get('/datasources/all', function(req, res, next){
      var varDir, dataDir, opts, data, _ref;
      opts = (_ref = app.set('limn options'), varDir = _ref.varDir, dataDir = _ref.dataDir, _ref);
      data = {};
      return Seq().seq(glob, dataDir + "/datasources/**/*.@(yaml|json)", {
        nocase: true,
        nosort: true
      }, Seq).seq(function(paths){
        return readFilesAsync(paths, this);
      }).seq(function(txts){
        return this.ok(_.items(txts));
      }).flatten(false).parMap(function(_arg){
        var f, text, k, v, that;
        f = _arg[0], text = _arg[1];
        k = f.replace(YAML_EXT_PAT, '.json');
        v = data[k] = {};
        try {
          if (YAML_EXT_PAT.test(f)) {
            v = data[k] = yaml.load(text);
          } else {
            v = data[k] = JSON.parse(text);
          }
          return this.ok(v);
        } catch (err) {
          console.error("[/datasources/all] Error parsing data!");
          console.error(err);
          if (that = err.stack) {
            console.error(that);
          }
          return res.send({
            error: String(err),
            partial_data: data
          }, 500);
        }
      }).seq(function(){
        return res.send(data);
      })['catch'](function(err){
        var that;
        console.error('[/datasources/all] Error!');
        console.error(err);
        if (that = err.stack) {
          console.error(that);
        }
        return res.send({
          error: String(err),
          partial_data: data
        }, 500);
      });
    });
    this.controller(require('./controllers/datasource'));
    if (opts.proxy.enabled) {
      proxy = require('./proxy')(opts.proxy);
      this.get('/x', proxy);
      this.get('/x/*', proxy);
    }
    this.get('/', function(req, res){
      return res.render('dashboard/view');
    });
    this.get('/geo', function(req, res){
      return res.render('geo');
    });
    this.get('/:type/:action/?', function(req, res, next){
      var type, action, _ref;
      _ref = req.params, type = _ref.type, action = _ref.action;
      if (exists(WWW + "/" + type + "/" + action + ".jade")) {
        return res.render(type + "/" + action);
      } else {
        return next();
      }
    });
    this.get('/:type/?', function(req, res, next){
      var type;
      type = req.params.type;
      if (exists(WWW + "/" + type + ".jade")) {
        return res.render(type + "");
      } else {
        return next();
      }
    });
    return this;
  }
};
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}