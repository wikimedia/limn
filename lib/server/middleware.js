var exists, fs, dirname, path, exec, spawn, subproc, glob, yaml, Seq, express, op, mkdirp, mkdirpAsync, readFilesAsync, Controller, BASE, DATA, LIB, SRC, STATIC, VAR, WWW, NODE_ENV, IS_DEV, IS_PROD, LOG_LEVEL, REV, DEFAULT_OPTIONS, exports, application, _ref, _;
fs = (_ref = require('fs'), exists = _ref.existsSync, _ref);
path = (_ref = require('path'), dirname = _ref.dirname, _ref);
subproc = (_ref = require('child_process'), exec = _ref.exec, spawn = _ref.spawn, _ref);
glob = require('glob');
yaml = require('js-yaml');
Seq = require('seq');
express = require('express');
_ref = require('../util'), _ = _ref._, op = _ref.op;
_ref = require('./mkdirp'), mkdirp = _ref.mkdirp, mkdirpAsync = _ref.mkdirpAsync;
readFilesAsync = require('./files').readFilesAsync;
Controller = require('./controller');
/**
 * Limn project-internals
 */
BASE = dirname(dirname(__dirname));
DATA = BASE + "/data";
LIB = BASE + "/llb";
SRC = BASE + "/src";
STATIC = BASE + "/static";
VAR = BASE + "/var";
WWW = BASE + "/www";
NODE_ENV = process.env.NODE_ENV || 'development';
IS_DEV = NODE_ENV === 'development';
IS_PROD = NODE_ENV === 'production';
LOG_LEVEL = process.env.KRAKEN_LOG_LEVEL;
LOG_LEVEL || (LOG_LEVEL = IS_DEV ? 'INFO' : 'WARN');
LOG_LEVEL = LOG_LEVEL.toUpperCase();
REV = process.env.KRAKEN_REV || 'HEAD';
try {
  REV = require('../version');
} catch (e) {}
DEFAULT_OPTIONS = {
  dataDir: './data',
  proxy: {
    enabled: false,
    whitelist: null,
    blacklist: null
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
  app.init();
  return app;
}
application = limn.application = {
  /**
   * @constructor
   */
  init: function(opts){
    var opx, YAML_EXT_PAT, proxy;
    opts == null && (opts = {});
    this.REV = REV;
    this.BASE = BASE;
    opts = _.merge({}, DEFAULT_OPTIONS, opts);
    opx = opts.proxy;
    if (opx.enabled === false && (opx.whitelist || opx.blacklist)) {
      opx.enabled = true;
    }
    if (opx.enabled) {
      opx.whitelist || (opx.whitelist = [/.*/]);
      opx.blacklist || (opx.blacklist = []);
    }
    this.set('limn options', opts);
    this.configure(function(){
      this.set('views', WWW);
      this.set('view engine', 'jade');
      this.set('view options', __import({
        layout: false,
        version: REV,
        IS_DEV: IS_DEV,
        IS_PROD: IS_PROD
      }, require('./view-helpers')));
      this.use(require('./reqinfo')({}));
      this.use(express.bodyParser());
      this.use(express.methodOverride());
      this.use(this.router);
      return this.use(require('browserify')({
        mount: '/vendor/browserify.js',
        require: ['seq', 'd3', 'events'],
        cache: BASE + "/.cache/browserify/cache.json"
      }));
    });
    this.configure('production', function(){
      this.use(express.logger());
      this.set('static max age', 108000000);
      return this.use(express.errorHandler());
    });
    this.configure('development', function(){
      var compiler;
      this.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
      }));
      this.set('view options').pretty = true;
      compiler = require('connect-compiler-extras');
      this.use('/js/kraken', compiler({
        enabled: 'coco',
        src: SRC,
        dest: VAR + "/js/kraken",
        log_level: LOG_LEVEL
      }));
      this.use(compiler({
        enabled: ['jade-browser', 'stylus', 'yaml'],
        src: WWW,
        dest: VAR,
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
        src: DATA,
        dest: VAR + "/data",
        log_level: LOG_LEVEL
      }));
      this.use(compiler({
        enabled: 'commonjs_define',
        src: [STATIC],
        dest: VAR,
        options: {
          commonjs: {
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
        enabled: 'commonjs_define',
        src: [VAR, WWW],
        dest: VAR,
        options: {
          commonjs: {
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
      var opts;
      opts = this.set('static file options') || {};
      this.use(express['static'](VAR, __clone(opts)));
      this.use(express['static'](WWW, __clone(opts)));
      return this.use(express['static'](STATIC, __clone(opts)));
    });
    this.controller(require('./controllers/graph'));
    this.controller(require('./controllers/dashboard'));
    YAML_EXT_PAT = /\.ya?ml$/i;
    this.get('/datasources/all', function(req, res, next){
      var data;
      data = {};
      return Seq().seq(glob, 'data/datasources/**/*.@(yaml|json)', {
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
          console.error("[/data/all] catch! " + err);
          console.error(err);
          if (that = err.stack) {
            console.error(that);
          }
          return res.send({
            error: String(err),
            partial_data: data
          });
        }
      }).seq(function(){
        return res.send(data);
      })['catch'](function(err){
        var that;
        console.error('[/data/all] catch!');
        console.error(err);
        if (that = err.stack) {
          console.error(that);
        }
        return res.send({
          error: String(err),
          partial_data: data
        });
      });
    });
    this.controller(require('./controllers/datasource'));
    if (opts.proxy.enabled) {
      proxy = require('./proxy')({
        blacklist: opts.proxy.blacklist,
        whitelist: opts.proxy.whitelist
      });
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
function __clone(it){
  function fun(){} fun.prototype = it;
  return new fun;
}