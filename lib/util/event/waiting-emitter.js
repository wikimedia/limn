var Base, WaitingEmitter, exports;
Base = require('../../base/base');
/**
 * @class An EventEmitter with a ratchet-up waiting counter.
 * @extends Base
 */
WaitingEmitter = (function(superclass){
  WaitingEmitter.displayName = 'WaitingEmitter';
  var prototype = __extend(WaitingEmitter, superclass).prototype, constructor = WaitingEmitter;
  /**
   * Count of outstanding tasks.
   * @type Number
   */
  prototype.waitingOn = 0;
  /**
   * Increment the waiting task counter.
   * @returns {this}
   */
  prototype.wait = function(){
    var count;
    count = this.waitingOn;
    this.waitingOn += 1;
    if (count === 0 && this.waitingOn > 0) {
      this.trigger('start-waiting', this);
    }
    return this;
  };
  /**
   * Decrement the waiting task counter.
   * @returns {this}
   */
  prototype.unwait = function(){
    var count;
    count = this.waitingOn;
    this.waitingOn -= 1;
    if (this.waitingOn === 0 && count > 0) {
      this.trigger('stop-waiting', this);
    }
    return this;
  };
  /**
   * @param {Function} fn Function to wrap.
   * @returns {Function} A function wrapping the passed function with a call
   *  to `unwait()`, then delegating with current context and arguments.
   */
  prototype.unwaitAnd = function(fn){
    var self;
    self = this;
    return function(){
      self.unwait();
      return fn.apply(this, arguments);
    };
  };
  /**
   * Copy WaitingEmitter instance methods (and EventEmitter) methods to target.
   * @returns {Object} The target object.
   */;
  WaitingEmitter.decorate = function(target){
    var k, _i, _ref, _len;
    for (_i = 0, _len = (_ref = ['waitingOn', 'wait', 'unwait', 'unwaitAnd', 'emit', 'trigger', 'on', 'off', 'addListener', 'removeListener', 'removeAllListeners', 'once', 'listeners']).length; _i < _len; ++_i) {
      k = _ref[_i];
      target[k] = WaitingEmitter.prototype[k];
    }
    return target;
  };
  function WaitingEmitter(){}
  return WaitingEmitter;
}(Base));
module.exports = exports = WaitingEmitter;
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}