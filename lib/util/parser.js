var op, BaseModel, BaseList, BaseView, Mixin, Parsers, ParserMixin, ParsingModel, ParsingList, ParsingView, _, _ref;
_ = require('./underscore');
op = require('./op');
_ref = require('../base'), BaseModel = _ref.BaseModel, BaseList = _ref.BaseList, BaseView = _ref.BaseView, Mixin = _ref.Mixin;
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
/**
 * @class Methods for a class to select parsers by type reflection.
 * @mixin
 */
exports.ParserMixin = ParserMixin = (function(superclass){
  ParserMixin.displayName = 'ParserMixin';
  var prototype = __extend(ParserMixin, superclass).prototype, constructor = ParserMixin;
  __import(ParserMixin.prototype, Parsers);
  function ParserMixin(target){
    return Mixin.call(ParserMixin, target);
  }
  prototype.parseValue = function(v, type){
    return this.getParser(type)(v);
  };
  prototype.getParser = function(type){
    var fn, t, _i, _ref, _len;
    type == null && (type = 'String');
    fn = this["parse" + type];
    if (typeof fn === 'function') {
      return fn;
    }
    type = _(String(type).toLowerCase());
    for (_i = 0, _len = (_ref = ['Integer', 'Float', 'Number', 'Boolean', 'Object', 'Array', 'Function']).length; _i < _len; ++_i) {
      t = _ref[_i];
      if (type.startsWith(t.toLowerCase())) {
        return this["parse" + t];
      }
    }
    return this.defaultParser || this.parseString;
  };
  prototype.getParserFromExample = function(v){
    var type;
    if (v == null) {
      return null;
    }
    type = typeof v;
    if (type !== 'object') {
      return this.getParser(type);
    } else if (_.isArray(v)) {
      return this.getParser('Array');
    } else {
      return this.getParser('Object');
    }
  };
  return ParserMixin;
}(Mixin));
/**
 * @class Basic model which mixes in the ParserMixin.
 * @extends BaseModel
 * @borrows ParserMixin
 */
ParsingModel = exports.ParsingModel = BaseModel.extend(ParserMixin.mix({
  constructor: (function(){
    function ParsingModel(){
      return BaseModel.apply(this, arguments);
    }
    return ParsingModel;
  }())
}));
/**
 * @class Basic collection which mixes in the ParserMixin.
 * @extends BaseList
 * @borrows ParserMixin
 */
ParsingList = exports.ParsingList = BaseList.extend(ParserMixin.mix({
  constructor: (function(){
    function ParsingList(){
      return BaseList.apply(this, arguments);
    }
    return ParsingList;
  }())
}));
/**
 * @class Basic view which mixes in the ParserMixin.
 * @extends BaseView
 * @borrows ParserMixin
 */
ParsingView = exports.ParsingView = BaseView.extend(ParserMixin.mix({
  constructor: (function(){
    function ParsingView(){
      return BaseView.apply(this, arguments);
    }
    return ParsingView;
  }())
}));
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