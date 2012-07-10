require.define('/node_modules/kraken/base/base-mixin.js.js', function(require, module, exports, __dirname, __filename, undefined){

var Backbone, op, BaseBackboneMixin, Mixin, mixinBase, _ref, _, __slice = [].slice;
Backbone = require('backbone');
_ref = require('kraken/util'), _ = _ref._, op = _ref.op;
BaseBackboneMixin = exports.BaseBackboneMixin = {
  initialize: function(){
    return this.__apply_bind__();
  }
  /**
   * A list of method-names to bind on `initialize`; set this on a subclass to override.
   * @type Array<String>
   */,
  __bind__: []
  /**
   * Applies the contents of `__bind__`.
   */,
  __apply_bind__: function(){
    var names;
    names = _(this.pluckSuperAndSelf('__bind__')).chain().flatten().compact().unique().value();
    if (names.length) {
      return _.bindAll.apply(_, [this].concat(__slice.call(names)));
    }
  }
  /**
   * Whether we're ready.
   * @type Boolean
   */,
  ready: false
  /**
   * Triggers the 'ready' event if it has not yet been triggered.
   * Subsequent listeners added on this event will be auto-triggered.
   * @returns {this}
   */,
  triggerReady: function(lock, event){
    lock == null && (lock = 'ready');
    event == null && (event = 'ready');
    if (this[lock]) {
      return this;
    }
    this[lock] = true;
    this.trigger(event, this);
    return this;
  }
  /**
   * Resets the 'ready' event to its non-triggered state, firing a
   * 'ready-reset' event.
   * @returns {this}
   */,
  resetReady: function(lock, event){
    lock == null && (lock = 'ready');
    event == null && (event = 'ready');
    if (!this[lock]) {
      return this;
    }
    this[lock] = false;
    this.trigger(event + "-reset", this);
    return this;
  }
  /**
   * Wrap {@link Backbone.Event#on} registration to handle registrations
   * on 'ready' after we've broadcast the event. Handler will always still
   * be registered, however, in case the emitter is reset.
   * 
   * @param {String} events Space-separated events for which to register.
   * @param {Function} callback
   * @param {Object} [context]
   * @returns {this}
   */,
  on: function(events, callback, context){
    context == null && (context = this);
    if (!callback) {
      return this;
    }
    Backbone.Events.on.apply(this, arguments);
    if (this.ready && _.contains(events.split(/\s+/), 'ready')) {
      callback.call(context, this);
    }
    return this;
  },
  makeHandlersForCallback: function(cb){
    var _this = this;
    return {
      success: function(){
        return cb.call(_this, [null].concat(arguments));
      },
      error: function(it){
        return cb.call(_this, it);
      }
    };
  }
  /**
   * Count of outstanding tasks.
   * @type Number
   */,
  waitingOn: 0
  /**
   * Increment the waiting task counter.
   * @returns {this}
   */,
  wait: function(){
    var count;
    count = this.waitingOn;
    this.waitingOn += 1;
    if (count === 0 && this.waitingOn > 0) {
      this.trigger('start-waiting', this);
    }
    return this;
  }
  /**
   * Decrement the waiting task counter.
   * @returns {this}
   */,
  unwait: function(){
    var count;
    count = this.waitingOn;
    this.waitingOn -= 1;
    if (this.waitingOn === 0 && count > 0) {
      this.trigger('stop-waiting', this);
    }
    return this;
  }
  /**
   * @param {Function} fn Function to wrap.
   * @returns {Function} A function wrapping the passed function with a call
   *  to `unwait()`, then delegating with current context and arguments.
   */,
  unwaitAnd: function(fn){
    var self;
    self = this;
    return function(){
      self.unwait();
      return fn.apply(this, arguments);
    };
  },
  getClassName: function(){
    return (this.constructor.name || this.constructor.displayName) + "";
  },
  toString: function(){
    return this.getClassName() + "()";
  }
};
/**
 * @class Base mixin class. Extend this to create a new mixin, attaching the
 *  donor methods as you would instance methods.
 *  
 *  To mingle your mixin with another class or object:
 *  
 *  class MyMixin extends Mixin
 *      foo: -> "foo!"
 *  
 *  # Mix into an object...
 *  o = MyMixin.mix { bar:1 }
 *  
 *  # Mix into a Coco class...
 *  class Bar
 *      MyMixin.mix this
 *      bar : 1
 *  
 */
exports.Mixin = Mixin = (function(){
  /**
   * Mixes this mixin into the target. If `target` is not a class, a new
   * object will be returned which inherits from the mixin.
   */
  Mixin.displayName = 'Mixin';
  var prototype = Mixin.prototype, constructor = Mixin;
  Mixin.mix = function(target){
    var MixinClass;
    if (!target) {
      return that;
    }
    MixinClass = Mixin;
    if (this instanceof Mixin) {
      MixinClass = this.constructor;
    }
    if (this instanceof Function) {
      MixinClass = this;
    }
    if (typeof target === 'function') {
      __import(target.prototype, MixinClass.prototype);
    } else {
      target = __import(_.clone(MixinClass.prototype), target);
    }
    (target.__mixins__ || (target.__mixins__ = [])).push(MixinClass);
    return target;
  };
  /**
   * Coco metaprogramming hook to propagate class properties and methods.
   */
  Mixin.extended = function(SubClass){
    var SuperClass, k, v, _own = {}.hasOwnProperty;
    SuperClass = this;
    for (k in SuperClass) if (_own.call(SuperClass, k)) {
      v = SuperClass[k];
      if (!SubClass[k]) {
        SubClass[k] = v;
      }
    }
    return SubClass;
  };
  function Mixin(){}
  return Mixin;
}());
/**
 * Mixes BaseBackboneMixin into another object or prototype.
 * @returns {Object} The merged prototype object.
 */
mixinBase = exports.mixinBase = function(){
  var bodies;
  bodies = __slice.call(arguments);
  return _.extend.apply(_, [_.clone(BaseBackboneMixin)].concat(__slice.call(bodies)));
};
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
