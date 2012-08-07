var Base, ReadyEmitter, exports;
Base = require('../../base/base');
/**
 * @class An EventEmitter that auto-triggers new handlers once "ready".
 */
ReadyEmitter = (function(superclass){
  ReadyEmitter.displayName = 'ReadyEmitter';
  var prototype = __extend(ReadyEmitter, superclass).prototype, constructor = ReadyEmitter;
  prototype.readyEventName = 'ready';
  prototype.ready = false;
  /**
   * Triggers the 'ready' event if it has not yet been triggered.
   * Subsequent listeners added to this event will be auto-triggered.
   * @param {Boolean} [force=false] Trigger the event even if already ready.
   * @returns {this}
   */
  prototype.triggerReady = function(force){
    if (this.ready && !force) {
      return this;
    }
    this.ready = true;
    this.emit(this.readyEventName, this);
    return this;
  };
  /**
   * Resets the 'ready' event to its non-triggered state, firing a
   * 'ready-reset' event.
   * @param {Boolean} [force=false] Trigger the event even if already reset.
   * @returns {this}
   */
  prototype.resetReady = function(force){
    if (!(this.ready && !force)) {
      return this;
    }
    this.ready = false;
    this.emit(this.readyEventName + "-reset", this);
    return this;
  };
  /**
   * Wrap {@link EventEmitter#on} registration to handle registrations
   * on 'ready' after we've broadcast the event. Handler will always still
   * be registered, however, in case the emitter is reset.
   * 
   * @param {String} events Space-separated events for which to register.
   * @param {Function} callback
   * @param {Object} [context]
   * @returns {this}
   */
  prototype.on = function(events, callback, context){
    var _this = this;
    context == null && (context = this);
    if (!callback) {
      return this;
    }
    superclass.prototype.on.apply(this, arguments);
    if (this.ready && -1 !== events.split(/\s+/).indexOf(this.readyEventName)) {
      setTimeout(function(){
        return callback.call(context, _this);
      });
    }
    return this;
  };
  /**
   * Copy ReadyEmitter instance methods (and EventEmitter) methods to target.
   * @returns {Object} The target object.
   */;
  ReadyEmitter.decorate = function(target){
    var k, _i, _ref, _len;
    for (_i = 0, _len = (_ref = ['readyEventName', 'ready', 'triggerReady', 'resetReady', 'on', 'emit', 'trigger', 'on', 'off', 'addListener', 'removeListener', 'removeAllListeners', 'once', 'listeners']).length; _i < _len; ++_i) {
      k = _ref[_i];
      target[k] = ReadyEmitter.prototype[k];
    }
    return target;
  };
  function ReadyEmitter(){}
  return ReadyEmitter;
}(Base));
module.exports = exports = ReadyEmitter;
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}