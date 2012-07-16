require.define('/node_modules/limn/base/base.js', function(require, module, exports, __dirname, __filename, undefined){

var EventEmitter, op, Base, k, _ref, _, _i, _len, __slice = [].slice;
EventEmitter = require('events').EventEmitter;
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.trigger = EventEmitter.prototype.emit;
_ref = require('limn/util'), _ = _ref._, op = _ref.op;
/**
 * @class Eventful base class.
 * @extends EventEmitter
 */
Base = (function(superclass){
  /**
   * After the super chain has exhausted (but not necessarily at the end
   * of init -- it depends on when you super()), Base will publish a 'new'
   * event on the instance's class, allowing anyone to subscribe to
   * notifications about new objects.
   * @constructor
   */
  Base.displayName = 'Base';
  var prototype = __extend(Base, superclass).prototype, constructor = Base;
  function Base(){
    this.__class__ = this.constructor;
    this.__superclass__ = this.constructor.superclass;
    this.__apply_bind__();
    superclass.call(this);
    this.__class__.emit('new', this);
  }
  /**
   * A list of method-names to bind on `initialize`; set this on a subclass to override.
   * @type Array<String>
   */
  prototype.__bind__ = [];
  /**
   * Applies the contents of `__bind__`.
   */
  prototype.__apply_bind__ = function(){
    var names;
    names = _(this.pluckSuperAndSelf('__bind__')).chain().flatten().compact().unique().value();
    if (names.length) {
      return _.bindAll.apply(_, [this].concat(__slice.call(names)));
    }
  };
  prototype.getClassName = function(){
    return (this.constructor.name || this.constructor.displayName) + "";
  };
  prototype.toString = function(){
    return this.getClassName() + "()";
  };
  Base.extended = function(Subclass){
    var k, v, _own = {}.hasOwnProperty;
    for (k in this) if (_own.call(this, k)) {
      v = this[k];
      if (typeof v === 'function') {
        Subclass[k] = v;
      }
    }
    Subclass.__super__ = this.prototype;
    return Subclass;
  };
  return Base;
}(EventEmitter));
for (_i = 0, _len = (_ref = ['getSuperClasses', 'pluckSuper', 'pluckSuperAndSelf']).length; _i < _len; ++_i) {
  k = _ref[_i];
  Base[k] = Base.prototype[k] = _.methodize(_[k]);
}
__import(Base, EventEmitter.prototype);
module.exports = Base;
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
