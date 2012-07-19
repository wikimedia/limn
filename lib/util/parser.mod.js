require.define('/node_modules/limn/util/parser.js', function(require, module, exports, __dirname, __filename, undefined){

var op, Parsers, _;
_ = require('./underscore');
op = require('./op');
/**
 * @namespace Parsers by type.
 */
Parsers = exports.Parsers = {
  parseBoolean: function(v){
    return op.toBool(v);
  },
  parseInteger: function(v){
    var r;
    r = op.toInt(v);
    if (!isNaN(r)) {
      return r;
    } else {
      return null;
    }
  },
  parseFloat: function(v){
    var r;
    r = op.toFloat(v);
    if (!isNaN(r)) {
      return r;
    } else {
      return null;
    }
  },
  parseString: function(v){
    if (v != null) {
      return op.toStr(v);
    } else {
      return null;
    }
  },
  parseDate: function(v){
    if (v) {
      return op.toDate(v);
    } else {
      return null;
    }
  },
  parseRegExp: function(v){
    if (v) {
      return op.toRegExp(v);
    } else {
      return null;
    }
  },
  parseArray: function(v){
    if (v) {
      return op.toObject(v);
    } else {
      return null;
    }
  },
  parseObject: function(v){
    if (v) {
      return op.toObject(v);
    } else {
      return null;
    }
  },
  parseFunction: function(v){
    if (v && _.startswith(String(v), 'function')) {
      try {
        return eval("(" + v + ")");
      } catch (err) {
        return null;
      }
    } else {
      return null;
    }
  }
};
Parsers.parseNumber = Parsers.parseFloat;

});
