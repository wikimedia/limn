require.define('/node_modules/limn/base/model-cache.js', function(require, module, exports, __dirname, __filename, undefined){

var Seq, ReadyEmitter, ModelCache, _;
_ = require('underscore');
Seq = require('seq');
ReadyEmitter = require('../util/event').ReadyEmitter;
/**
 * @class Caches models and provides static lookups by ID.
 */
exports.ModelCache = ModelCache = (function(superclass){
  ModelCache.displayName = 'ModelCache';
  var prototype = __extend(ModelCache, superclass).prototype, constructor = ModelCache;
  /**
   * @see ReadyEmitter#readyEventName
   * @private
   * @constant
   * @type String
   */
  prototype.readyEventName = 'cache-ready';
  /**
   * Default options.
   * @private
   * @constant
   * @type Object
   */
  prototype.DEFAULT_OPTIONS = {
    ready: true,
    cache: null,
    create: null,
    ModelType: null
  };
  /**
   * @private
   * @type Object
   */
  prototype.options = null;
  /**
   * Type we're caching (presumably extending `Backbone.Model`), used to create new
   * instances unless a `create` function was provided in options.
   * @private
   * @type Class<Backbone.Model>
   */
  prototype.ModelType = null;
  /**
   * Collection holding the cached Models.
   * @private
   * @type Backbone.Collection
   */
  prototype.cache = null;
  /**
   * @constructor
   * @param {Class<Backbone.Model>} [ModelType] Type of cached object (presumably extending
   *  `Backbone.Model`), used to create new instances unless `options.create`
   *  is provided.
   * @param {Object} [options] Options:
   * @param {Boolean} [options.ready=true] Starting `ready` state. If false,
   *  the cache will queue lookup calls until `triggerReady()` is called.
   * @param {Class<Backbone.Collection>} [options.cache=new Backbone.Collection]
   *  The backing data-structure for the cache. If omitted, we'll use a new
   *  `Backbone.Collection`, but really, anything with a `get(id)` method for
   *  model lookup will work here.
   * @param {Function} [options.create] A function called when a new Model
   *  object is needed, being passed the new model ID.
   * @param {Class<Backbone.Model>} [options.ModelType] Type of cached object
   *  (presumably extending `Backbone.Model`), used to create new instances
   *  unless `options.create` is provided.
   */;
  function ModelCache(ModelType, options){
    var that, _ref;
    if (!_.isFunction(ModelType)) {
      _ref = [ModelType || {}, null], options = _ref[0], ModelType = _ref[1];
    }
    this.options = (_ref = {}, __import(_ref, this.DEFAULT_OPTIONS), __import(_ref, options));
    this.cache = this.options.cache || new Backbone.Collection;
    this.ModelType = ModelType || this.options.ModelType;
    if (that = this.options.create) {
      this.createModel = that;
    }
    this.ready = !!this.options.ready;
    if (this.ModelType) {
      this.decorate(this.ModelType);
    }
  }
  /**
   * Called when a new Model object is needed, being passed the new model ID.
   * Uses the supplied `ModelType`; overriden by `options.create` if provided.
   * 
   * @param {String} id The model ID to create.
   * @returns {Model} Created model.
   */
  prototype.createModel = function(id){
    return new this.ModelType({
      id: id
    });
  };
  /**
   * Registers a model with the cache. If a model by this ID already exists
   * in the cache, it will be removed and this one will take its place.
   *
   * Fires an `add` event.
   * 
   * @param {Model} model The model.
   * @returns {Model} The model.
   */
  prototype.register = function(model){
    if (this.cache.contains(model)) {
      this.cache.remove(model, {
        silent: true
      });
    }
    this.cache.add(model);
    this.trigger('add', this, model);
    return model;
  };
  /**
   * Synchronously check if a model is in the cache, returning it if so.
   * 
   * @param {String} id The model ID to get.
   * @returns {Model}
   */
  prototype.get = function(id){
    return this.cache.get(id);
  };
  /**
   * Asynchronously look up any number of models, requesting them from the
   * server if not already known to the cache.
   *
   * @param {String|Array<String>} ids List of model IDs to lookup.
   * @param {Function} cb Callback of the form `(err, models)`,
   *  where `err` will be null on success and `models` will be an Array
   *  of model objects.
   * @param {Object} [cxt=this] Callback context.
   * @returns {this}
   */
  prototype.lookupAll = function(ids, cb, cxt){
    var _this = this;
    cxt == null && (cxt = this);
    if (!_.isArray(ids)) {
      ids = [ids];
    }
    if (!this.ready) {
      this.on('cache-ready', function(){
        _this.off('cache-ready', arguments.callee);
        return _this.lookupAll(ids, cb, cxt);
      });
      return this;
    }
    Seq(ids).parMap_(function(next, id){
      var that;
      if (that = _this.cache.get(id)) {
        return next.ok(that);
      }
      return _this.register(_this.createModel(id)).on('ready', function(it){
        return next.ok(it);
      }).load();
    }).unflatten().seq(function(models){
      return cb.call(cxt, null, models);
    })['catch'](function(err){
      return cb.call(cxt, err);
    });
    return this;
  };
  /**
   * Looks up a model, requesting it from the server if it is not already
   * known to the cache.
   *
   * @param {String|Array<String>} id Model ID to lookup.
   * @param {Function} cb Callback of the form `(err, model)`,
   *  where `err` will be null on success and `model` will be the
   *  model object.
   * @param {Object} [cxt=this] Callback context.
   * @returns {this}
   */
  prototype.lookup = function(id, cb, cxt){
    cxt == null && (cxt = this);
    return this.lookupAll([id], function(err, models){
      if (err) {
        return cb.call(cxt, err);
      } else {
        return cb.call(cxt, null, models[0]);
      }
    });
  };
  /**
   * Decorate an object with the cache methods:
   *  - register
   *  - get
   *  - lookup
   *  - lookupAll
   * 
   * This is automatically called on `ModelType` if supplied.
   * 
   * @param {Object} obj Object to decorate.
   * @returns {obj} The supplied object.
   */
  prototype.decorate = function(obj){
    var m, _i, _ref, _len;
    obj.__cache__ = this;
    for (_i = 0, _len = (_ref = ['register', 'get', 'lookup', 'lookupAll']).length; _i < _len; ++_i) {
      m = _ref[_i];
      obj[m] = this[m].bind(this);
    }
    return obj;
  };
  prototype.toString = function(){
    return (this.constructor.displayName || this.constructor.name) + "(cache=" + this.cache + ")";
  };
  return ModelCache;
}(ReadyEmitter));
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
