var op, BaseModel, BaseList, Cascade, CascadingModel, _ref, _;
_ref = require('../util'), _ = _ref._, op = _ref.op;
_ref = require('./base-model'), BaseModel = _ref.BaseModel, BaseList = _ref.BaseList;
Cascade = require('../util/cascade');
/**
 * @class A model that implements cascading lookups for its attributes.
 */
CascadingModel = exports.CascadingModel = BaseModel.extend({
  /**
   * The lookup cascade.
   * @type Cascade
   */
  cascade: null,
  constructor: (function(){
    function CascadingModel(attributes, opts){
      attributes == null && (attributes = {});
      this.cascade = new Cascade(attributes);
      return BaseModel.call(this, attributes, opts);
    }
    return CascadingModel;
  }()),
  initialize: function(){
    return BaseModel.prototype.initialize.apply(this, arguments);
  }
  /**
   * Recursively look up a (potenitally nested) attribute in the lookup chain.
   * @param {String} key Attribute key (potenitally nested using dot-delimited subkeys).
   * @returns {*}
   */,
  get: function(key){
    return this.cascade.get(key);
  },
  toJSON: function(opts){
    opts == null && (opts = {});
    opts = (__import({
      collapseCascade: false
    }, opts));
    if (opts.collapseCascade) {
      return this.cascade.collapse();
    } else {
      return BaseModel.prototype.toJSON.apply(this, arguments);
    }
  }
});
['addLookup', 'removeLookup', 'popLookup', 'shiftLookup', 'unshiftLookup', 'isOwnProperty', 'isOwnValue', 'isInheritedValue', 'isModifiedValue'].forEach(function(methodname){
  return CascadingModel.prototype[methodname] = function(){
    return this.cascade[methodname].apply(this.cascade, arguments);
  };
});
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}