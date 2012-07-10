require.define('/node_modules/kraken/util/underscore/function.js.js', function(require, module, exports, __dirname, __filename, undefined){

var _, _fn, __slice = [].slice;
_ = require('underscore');
_fn = {
  /**
   * Decorates a function so that its receiver (`this`) is always added as the
   * first argument, followed by the call arguments.
   * @returns {Function}
   */
  methodize: function(fn){
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
  }
};
__import(exports, _fn);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
