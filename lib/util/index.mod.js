require.define('/node_modules/limn/util/index.js', function(require, module, exports, __dirname, __filename, undefined){

var op, root, backbone, parser, Cascade, _, _ref, __slice = [].slice;
_ = exports._ = require('./underscore');
op = exports.op = require('./op');
root = exports.root = function(){
  return this;
}();
root.console || (root.console = _(['log', 'info', 'warn', 'error', 'dir', 'table', 'group', 'groupCollapsed', 'groupEnd']).synthesize(function(it){
  return [it, op.nop];
}));
/**
 * @returns {Object} Object of the data from the form, via `.serializeArray()`.
 */
if ((_ref = root.jQuery) != null) {
  _ref.fn.formData = function(){
    return _.synthesize(this.serializeArray(), function(it){
      return [it.name, it.value];
    });
  };
}
/**
 * Invokes a jQuery method on each element, returning the array of the result.
 * @returns {Array} Results.
 */
if ((_ref = root.jQuery) != null) {
  _ref.fn.invoke = function(method){
    var args, idx, el, _len, _ref, _results = [];
    args = __slice.call(arguments, 1);
    for (idx = 0, _len = this.length; idx < _len; ++idx) {
      el = this[idx];
      _results.push((_ref = jQuery(el))[method].apply(_ref, args));
    }
    return _results;
  };
}
__import(exports, require('./event'));
backbone = exports.backbone = require('./backbone');
parser = exports.parser = require('./parser');
Cascade = exports.Cascade = require('./cascade');
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
