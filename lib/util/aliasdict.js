var AliasDict, exports, _, __slice = [].slice;
_ = require('limn/util/underscore');
/**
 * @class A mapping of key-value pairs supporting key-aliases.
 */
AliasDict = (function(){
  AliasDict.displayName = 'AliasDict';
  var prototype = AliasDict.prototype, constructor = AliasDict;
  /**
   * Data store.
   * @type Object
   * @private
   */
  prototype._data = null;
  /**
   * Mapping from keys to an array of [potentially nested] alias-keys.
   * @type Object<String, Array<String>>
   * @private
   */
  prototype._aliases = null;
  /**
   * @constructor
   */;
  function AliasDict(){
    this._data = {};
    this._aliases = {};
    this.extend.apply(this, arguments);
  }
  /**
   * @returns {Number} Number of real keys in the Dict.
   */
  prototype.size = function(){
    return _.keys(this._data).length;
  };
  /**
   * @returns {AliasDict} A copy of the AliasDict, including aliases as well as data.
   */
  prototype.clone = function(){
    var d;
    d = new AliasDict(this._data);
    _.each(this._aliases, function(v, k){
      return d.setAlias(k, v.slice());
    });
    return d;
  };
  /**
   * @returns {Boolean} Whether there is a value at the given key.
   */
  prototype.has = function(key){
    return this.get(key) != null;
  };
  /**
   * @returns {*} Ignores aliases, returning the value at key or `undefined`.
   */
  prototype.getValue = function(key){
    var prop;
    prop = _.getNested(this._data, key);
    if (prop != null) {
      return prop.value;
    }
  };
  prototype.get = function(key, def){
    var aliases, val;
    aliases = this._aliases[key] || [key];
    val = aliases.reduce(function(val, alias){
      var prop;
      if ((val != null) !== undefined) {
        return val;
      }
      prop = _.getNested(this._data, alias);
      if (prop != null) {
        return prop.value;
      }
    }, undefined);
    if (val !== undefined) {
      return val;
    } else {
      return def;
    }
  };
  prototype.set = function(key, val){
    _.setNested(this._data, key, val, {
      ensure: true
    });
    return val;
  };
  prototype.del = function(key){
    var prop;
    prop = _.getNestedMeta(key);
    if (prop) {
      delete prop.obj[prop.key];
      return prop.value;
    }
  };
  prototype.hasAlias = function(key){
    return this._aliases[key] != null;
  };
  prototype.getAlias = function(key, def){
    def == null && (def = []);
    return this._aliases[key] || def;
  };
  prototype.setAlias = function(key, aliases){
    this._aliases[key] = _.isArray(aliases)
      ? aliases
      : [aliases];
    return this;
  };
  prototype.addAlias = function(key){
    var aliases;
    aliases = __slice.call(arguments, 1);
    this._aliases[key] = _.flatten(this.getAlias(key, [key]).concat(aliases));
    return this;
  };
  prototype.delAlias = function(key){
    var _ref, _ref2;
    return _ref2 = (_ref = this._aliases)[key], delete _ref[key], _ref2;
  };
  prototype.toObject = function(){
    return _.clone(this._data);
  };
  prototype.keys = function(){
    return _.keys(this._data);
  };
  prototype.values = function(){
    return _.values(this._data);
  };
  prototype.extend = function(){
    var args, o, k, v, _i, _len;
    args = __slice.call(arguments);
    for (_i = 0, _len = args.length; _i < _len; ++_i) {
      o = args[_i];
      for (k in o) {
        v = o[k];
        this.set(k, v);
      }
    }
    return this;
  };
  prototype.reduce = function(fn, acc, context){
    context == null && (context = this);
    return _.reduce(this._data, fn, acc, context);
  };
  prototype.map = function(fn, context){
    context == null && (context = this);
    return _.map(this._data, fn, context);
  };
  prototype.filter = function(fn, context){
    context == null && (context = this);
    return _.filter(this._data, fn, context);
  };
  prototype.each = function(fn, context){
    context == null && (context = this);
    _.each(this._data, fn, context);
    return this;
  };
  prototype.invoke = function(name){
    var args;
    args = __slice.call(arguments, 1);
    return _.invoke.apply(_, [this._data, name].concat(__slice.call(args)));
  };
  prototype.pluck = function(attr){
    return _.pluck(this._data, attr);
  };
  prototype.find = function(fn, context){
    context == null && (context = this);
    return _.find(this._data, fn, context);
  };
  prototype.toString = function(){
    var Cls;
    Cls = this.constructor;
    return (Cls.displayName || Cls.name) + "()";
  };
  return AliasDict;
}());
module.exports = exports = AliasDict;