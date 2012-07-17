require.define('/node_modules/limn/base/parser-mixin.js', function(require, module, exports, __dirname, __filename, undefined){

var Parsers, BaseModel, BaseList, BaseView, Mixin, ParserMixin, ParsingModel, ParsingList, ParsingView, _ref;
Parsers = require('../util/parser').Parsers;
_ref = require('../base'), BaseModel = _ref.BaseModel, BaseList = _ref.BaseList, BaseView = _ref.BaseView, Mixin = _ref.Mixin;
exports.Parsers = Parsers;
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

});
