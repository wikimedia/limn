require.define('/node_modules/kraken/util/underscore/array.js.js', function(require, module, exports, __dirname, __filename, undefined){

var I, defined, _, _array;
_ = require('underscore');
I = function(it){
  return it;
};
defined = function(o){
  return o != null;
};
_array = {
  /**
   * Transforms an Array of tuples (two-element Arrays) into an Object, such that for each
   * tuple [k, v]:
   *      result[k] = v if filter(v)
   * @param {Array} o A collection.
   * @param {Function} [filter=defined] Optional filter function. If omitted, will 
   *  exclude `undefined` and `null` values.
   * @return {Object} Transformed result.
   */
  generate: function(o, filter){
    filter == null && (filter = defined);
    return _.reduce(o, function(acc, _arg, idx){
      var k, v;
      k = _arg[0], v = _arg[1];
      if (k && (!filter || filter(v, k))) {
        acc[k] = v;
      }
      return acc;
    }, {});
  }
  /**
   * As {@link _.generate}, but first transforms the collection using `fn`.
   * @param {Array} o A collection.
   * @param {Function} [fn=I] Transformation function. Defaults to the identity transform.
   * @param {Function} [filter=defined] Optional filter function. If omitted, will 
   *  exclude `undefined` and `null` values.
   * @param {Object} [context=o] Function context.
   * @return {Object} Transformed result.
   */,
  synthesize: function(o, fn, filter, context){
    fn == null && (fn = I);
    filter == null && (filter = defined);
    return _array.generate(_.map(o, fn, context), filter);
  }
  /**
   * Symmetric Difference
   */,
  xor: function(a, b){
    a = _.values(a);
    b = _.values(b);
    return _.union(_.difference(a, b), _.difference(b, a));
  }
};
__import(exports, _array);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
