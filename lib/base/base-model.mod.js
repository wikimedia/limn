require.define('/node_modules/limn/base/base-model.js', function(require, module, exports, __dirname, __filename, undefined){

var Backbone, op, BaseBackboneMixin, mixinBase, BaseModel, BaseList, _ref, _, __slice = [].slice;
Backbone = require('backbone');
_ref = require('../util'), _ = _ref._, op = _ref.op;
_ref = require('./base-mixin'), BaseBackboneMixin = _ref.BaseBackboneMixin, mixinBase = _ref.mixinBase;
/**
 * @class Base model, extending Backbone.Model, used by scaffold and others.
 * @extends Backbone.Model
 */
BaseModel = exports.BaseModel = Backbone.Model.extend(mixinBase({
  constructor: (function(){
    function BaseModel(){
      this.__class__ = this.constructor;
      this.__superclass__ = this.constructor.__super__.constructor;
      this.waitingOn = 0;
      return Backbone.Model.apply(this, arguments);
    }
    return BaseModel;
  }()),
  url: function(){
    return this.urlRoot + "/" + this.get('id') + ".json";
  },
  has: function(key){
    return this.get(key) != null;
  },
  get: function(key){
    return _.getNested(this.attributes, key);
  }
  /**
   * Override to customize what data or assets the model requires,
   * and how they should be loaded.
   * 
   * By default, `load()` simply calls `loadModel()` via `loader()`.
   * 
   * @see BaseModel#loader
   * @see BaseModel#loadModel
   * @returns {this}
   */,
  load: function(){
    console.log(this + ".load()");
    this.loader({
      start: this.loadModel,
      completeEvent: 'fetch-success'
    });
    return this;
  }
  /**
   * Wraps the loading workflow boilerplate:
   *  - Squelches multiple loads from running at once
   *  - Squelches loads post-ready, unless forced
   *  - Triggers a start event
   *  - Triggers "ready" when complete
   *  - Wraps workflow with wait/unwait
   *  - Cleans up "loading" state
   * 
   * @protected
   * @param {Object} [opts={}] Options:
   * @param {Function} opts.start Function that starts the loading process. Always called with `this` as the context.
   * @param {String} [opts.startEvent='load'] Event to trigger before beginning the load.
   * @param {String} [opts.completeEvent='load-success'] Event which signals loading has completed successfully.
   * @param {String} [opts.errorEvent='load-error'] Event which signals loading has completed but failed.
   * @param {Boolean} [opts.force=false] If true, reset ready state if we're ready before proceeding.
   * @param {Boolean} [opts.readyIfError=false] If true, move fire the ready event when loading completes, even if it failed.
   * @returns {this}
   */,
  loader: function(opts){
    var _this = this;
    opts == null && (opts = {});
    opts = (__import({
      force: false,
      readyIfError: false,
      startEvent: 'load',
      completeEvent: 'load-success',
      errorEvent: 'load-error'
    }, opts));
    if (opts.force) {
      this.resetReady();
    }
    if (!opts.start) {
      throw new Error('You must specify a `start` function to start loading!');
    }
    if (this.loading || this.ready) {
      return this;
    }
    this.wait();
    this.loading = true;
    this.trigger(opts.startEvent, this);
    this.once(opts.completeEvent, function(){
      _this.loading = false;
      _this.unwait();
      if (opts.completeEvent !== 'load-success') {
        _this.trigger('load-success', _this);
      }
      return _this.triggerReady();
    });
    this.once(opts.errorEvent, function(){
      _this.loading = false;
      _this.unwait();
      if (opts.errorEvent !== 'load-error') {
        _this.trigger('load-error', _this);
      }
      if (opts.readyIfError) {
        return _this.triggerReady();
      }
    });
    opts.start.call(this);
    return this;
  }
  /**
   * Runs `.fetch()`, triggering a `fetch` event at start, and
   * `fetch-success` / `fetch-error` on completion.
   * 
   * @protected
   * @returns {this}
   */,
  loadModel: function(){
    var _this = this;
    this.wait();
    this.trigger('fetch', this);
    this.fetch({
      success: function(){
        _this.unwait();
        return _this.trigger('fetch-success', _this);
      },
      error: function(){
        _this.unwait();
        return _this.trigger.apply(_this, ['fetch-error', _this].concat(__slice.call(arguments)));
      }
    });
    return this;
  },
  serialize: function(v){
    if (_.isBoolean(v)) {
      v = Number(v);
    } else if (_.isObject(v)) {
      v = JSON.stringify(v);
    }
    return String(v);
  }
  /**
   * Like `.toJSON()` in that it should return a plain object with no functions,
   * but for the purpose of `.toKV()`, allowing you to customize the values
   * included and keys used.
   * 
   * @param {Object} [opts={}] Options:
   * @param {Boolean} [opts.keepFunctions=false] If false, functions will be omitted from the result.
   * @returns {Object}
   */,
  toKVPairs: function(opts){
    var kvo, k, v;
    opts == null && (opts = {});
    opts = (__import({
      keepFunctions: false
    }, opts));
    kvo = _.collapseObject(this.toJSON());
    for (k in kvo) {
      v = kvo[k];
      if (opts.keepFunctions || typeof v !== 'function') {
        kvo[k] = this.serialize(v);
      }
    }
    return kvo;
  }
  /**
   * Serialize the model into a `www-form-encoded` string suitable for use as
   * a query string or a POST body.
   * @returns {String}
   */,
  toKV: function(item_delim, kv_delim){
    item_delim == null && (item_delim = '&');
    kv_delim == null && (kv_delim = '=');
    return _.toKV(this.toKVPairs(), item_delim, kv_delim);
  }
  /**
   * @returns {String} URL identifying this model.
   */,
  toURL: function(){
    return "?" + this.toKV.apply(this, arguments);
  },
  toString: function(){
    return this.getClassName() + "(cid=" + this.cid + ", id=" + this.id + ")";
  }
}));
__import(BaseModel, {
  /**
   * Factory method which constructs an instance of this model from a string of KV-pairs.
   * This is a class method inherited by models which extend {BaseModel}.
   * @static
   * @param {String|Object} o Serialized KV-pairs (or a plain object).
   * @returns {BaseModel} An instance of this model.
   */
  fromKV: function(o, item_delim, kv_delim){
    var Cls;
    item_delim == null && (item_delim = '&');
    kv_delim == null && (kv_delim = '=');
    if (typeof o === 'string') {
      o = _.fromKV(o, item_delim, kv_delim);
    }
    Cls = typeof this === 'function'
      ? this
      : this.constructor;
    return new Cls(_.uncollapseObject(o));
  }
});
/**
 * @class Base collection, extending Backbone.Collection, used by scaffold and others.
 * @extends Backbone.Collection
 */
BaseList = exports.BaseList = Backbone.Collection.extend(mixinBase({
  constructor: (function(){
    function BaseList(){
      this.__class__ = this.constructor;
      this.__superclass__ = this.constructor.__super__.constructor;
      this.waitingOn = 0;
      return Backbone.Collection.apply(this, arguments);
    }
    return BaseList;
  }()),
  getIds: function(){
    return this.models.map(function(it){
      return it.id || it.get('id') || it.cid;
    });
  },
  url: function(){
    var id;
    id = this.get('id') || this.get('slug');
    if (id) {
      return this.urlRoot + "/" + id + ".json";
    } else {
      return this.urlRoot + ".json";
    }
  },
  load: function(){
    return this.loadCollection();
  },
  loadCollection: function(){
    var _this = this;
    this.wait();
    this.trigger('load', this);
    this.fetch({
      success: function(){
        _this.unwait();
        return _this.trigger('load-success', _this);
      },
      error: function(){
        _this.unwait();
        return _this.trigger.apply(_this, ['load-error', _this].concat(__slice.call(arguments)));
      }
    });
    return this;
  },
  toKVPairs: function(){
    return _.collapseObject(this.toJSON());
  },
  toKV: function(item_delim, kv_delim){
    item_delim == null && (item_delim = '&');
    kv_delim == null && (kv_delim = '=');
    return _.toKV(this.toKVPairs(), item_delim, kv_delim);
  },
  toURL: function(item_delim, kv_delim){
    item_delim == null && (item_delim = '&');
    kv_delim == null && (kv_delim = '=');
    return "?" + this.toKV.apply(this, arguments);
  },
  toString: function(){
    return this.getClassName() + "[" + this.length + "]";
  },
  toStringWithIds: function(){
    var modelIds;
    modelIds = this.models.map(function(it){
      var _ref;
      return "\"" + ((_ref = it.id) != null
        ? _ref
        : it.cid) + "\"";
    }).join(', ');
    return this.getClassName() + "[" + this.length + "](" + modelIds + ")";
  }
}));
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
