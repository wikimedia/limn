var Backbone, that, methodize, Cls, _, _bb_events, _backbone, _methodized, _i, _ref, _len, __slice = [].slice;
_ = require('underscore');
if (typeof window != 'undefined' && window !== null) {
  window._ = _;
}
Backbone = require('backbone');
if (typeof window != 'undefined' && window !== null) {
  window.Backbone = Backbone;
}
if (that = (typeof window != 'undefined' && window !== null) && (window.jQuery || window.Zepto || window.ender)) {
  Backbone.setDomLibrary(that);
}
_bb_events = {
  /**
   * Registers an event listener on the given event(s) to be fired only once.
   * 
   * @param {String} events Space delimited list of event names.
   * @param {Function} callback Event listener function.
   * @param {Object} [context=this] Object to be supplied as the context for the listener.
   * @returns {this}
   */
  once: function(events, callback, context){
    var fn, _this = this;
    fn = function(){
      _this.off(events, arguments.callee, _this);
      return callback.apply(context || _this, arguments);
    };
    this.on(events, fn, this);
    return this;
  }
  /**
   * Compatibility with Node's `EventEmitter`.
   */,
  emit: Backbone.Events.trigger
};
/**
 * @namespace Meta-utilities for working with Backbone classes.
 */
_backbone = {
  /**
   * @returns {Array<Class>} The list of all superclasses for this class or object.
   */
  getSuperClasses: (function(){
    function getSuperClasses(Cls){
      var that, superclass, _ref;
      if (!Cls) {
        return [];
      }
      if (that = Cls.__superclass__) {
        superclass = that;
      } else {
        if (typeof Cls !== 'function') {
          Cls = Cls.constructor;
        }
        if (that = (_ref = Cls.__super__) != null ? _ref.constructor : void 8) {
          superclass = that;
        } else if (Cls.prototype.constructor !== Cls) {
          superclass;
        }
      }
      if (superclass) {
        return [superclass].concat(getSuperClasses(superclass));
      } else {
        return [];
      }
    }
    return getSuperClasses;
  }())
  /**
   * Looks up an attribute on the prototype of each class in the class
   * hierarchy.
   * @returns {Array}
   */,
  pluckSuper: function(obj, prop){
    if (!obj) {
      return [];
    }
    return _(_backbone.getSuperClasses(obj)).chain().pluck('prototype').pluck(prop).value();
  }
  /**
   * As `.pluckSuper()` but includes value of `prop` on passed `obj`.
   * @returns {Array}
   */,
  pluckSuperAndSelf: function(obj, prop){
    if (!obj) {
      return [];
    }
    return [obj[prop]].concat(_backbone.pluckSuper(obj, prop));
  }
};
__import(exports, _backbone);
/**
 * Decorates a function so that its receiver (`this`) is always added as the
 * first argument, followed by the call arguments.
 * @returns {Function}
 */
methodize = exports.methodize = function(fn){
  var m, g, that;
  m = fn.__methodized__;
  if (m) {
    return m;
  }
  g = fn.__genericized__;
  if (that = g != null ? g.__wraps__ : void 8) {
    return that;
  }
  m = fn.__methodized__ = function(){
    var args;
    args = __slice.call(arguments);
    args.unshift(this);
    return fn.apply(this, args);
  };
  m.__wraps__ = fn;
  return m;
};
_methodized = exports._methodized = _.reduce(_backbone, function(o, v, k){
  o[k] = typeof v === 'function' ? methodize(v) : v;
  return o;
}, {});
_.extend(Backbone.Events, _bb_events);
for (_i = 0, _len = (_ref = [Backbone['Model'], Backbone['Collection'], Backbone['View']]).length; _i < _len; ++_i) {
  Cls = _ref[_i];
  __import(__import(__import(Cls, _methodized), _bb_events), Backbone.Events);
  __import(__import(Cls.prototype, _methodized), _bb_events);
}
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}