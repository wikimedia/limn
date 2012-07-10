require.define('/node_modules/kraken/util/cascade.js.js', function(require, module, exports, __dirname, __filename, undefined){

var hasOwn, MISSING, TOMBSTONE, Cascade, ALIASES, dest, src, exports, _, __slice = [].slice;
_ = require('kraken/util/underscore');
hasOwn = {}.hasOwnProperty;
/**
 * Sentinel for missing values.
 */
MISSING = void 8;
/**
 * Tombstone for deleted, non-passthrough keys.
 */
TOMBSTONE = {};
/**
 * @class A mapping of key-value pairs supporting lookup fallback across multiple objects.
 */
Cascade = (function(){
  /**
   * Sentinel tombstone for deleted, non-passthrough keys.
   * @type TOMBSTONE
   * @readonly
   */
  Cascade.displayName = 'Cascade';
  var prototype = Cascade.prototype, constructor = Cascade;
  Cascade.TOMBSTONE = TOMBSTONE;
  /**
   * Map holding the object's KV-pairs; always the second element of the
   * cascade lookup.
   * @type Object
   * @private
   */
  prototype._data = null;
  /**
   * Map of tombstones, marking intentionally unset keys in the object's
   * KV-pairs; always the first element of the cascade lookup.
   * @type Object<String, TOMBSTONE>
   * @private
   */
  prototype._tombstones = null;
  /**
   * List of objects for lookups.
   * @type Array
   * @private
   */
  prototype._lookups = null;
  /**
   * @constructor
   */;
  function Cascade(data, lookups, tombstones){
    data == null && (data = {});
    lookups == null && (lookups = []);
    tombstones == null && (tombstones = {});
    this._data = data;
    this._tombstones = tombstones;
    this._lookups = [this._data].concat(lookups);
  }
  /**
   * @returns {Cascade} A copy of the data and lookup chain.
   */
  prototype.clone = function(){
    return new Cascade(__import({}, this._data), this._lookups.slice(), __import({}, this._tombstones));
  };
  prototype.getData = function(){
    return this._data;
  };
  prototype.setData = function(data){
    this._data = this._lookups[0] = data;
    return this;
  };
  prototype.getTombstones = function(){
    return this._tombstones;
  };
  /**
   * @returns {Number} Number of lookup dictionaries.
   */
  prototype.size = function(){
    return this._lookups.length - 1;
  };
  /**
   * @returns {Array<Object>} The array of lookup dictionaries.
   */
  prototype.getLookups = function(){
    return this._lookups;
  };
  /**
   * @returns {Array<Object>} The array of lookup dictionaries.
   */
  prototype.getLookups = function(){
    return this._lookups;
  };
  /**
   * Adds a new lookup dictionary to the chain.
   * @returns {this}
   */
  prototype.addLookup = function(dict){
    if (dict == null) {
      return this;
    }
    if (!_.isObject(dict)) {
      throw new Error("Lookup dictionary must be an object! dict=" + dict);
    }
    this._lookups.push(dict);
    return this;
  };
  /**
   * Removes a lookup dictionary from the chain (but will not remove the data object).
   * @returns {this}
   */
  prototype.removeLookup = function(dict){
    if (dict && dict !== this._data) {
      _.remove(this._lookups, dict);
    }
    return this;
  };
  /**
   * Pops the last dictionary off the lookup chain and returns it.
   * @returns {*} The last dictionary, or `undefined` if there are no additional lookups.
   */
  prototype.popLookup = function(){
    if (this.size() <= 1) {
      return;
    }
    return this._lookups.pop();
  };
  /**
   * Shifts the first additional lookup dictionary off the chain and returns it.
   * @returns {*} The first dictionary, or `undefined` if there are no additional lookups.
   */
  prototype.shiftLookup = function(){
    if (this.size() <= 1) {
      return;
    }
    return this._lookups.splice(1, 1)[0];
  };
  /**
   * Adds a lookup dictionary to the front of the chain, just after the Cascade's own data
   * object.
   * @returns {this}
   */
  prototype.unshiftLookup = function(dict){
    if (dict == null) {
      return this;
    }
    if (!_.isObject(dict)) {
      throw new Error("Lookup dictionary must be an object! dict=" + dict);
    }
    this._lookups.splice(1, 0, dict);
    return this;
  };
  /**
   * @returns {Boolean} Whether there is a tombstone set for `key`.
   */
  prototype.hasTombstone = function(key){
    var o, part, _i, _ref, _len;
    o = this._tombstones;
    for (_i = 0, _len = (_ref = key.split('.')).length; _i < _len; ++_i) {
      part = _ref[_i];
      o = o[part];
      if (o === TOMBSTONE) {
        return true;
      }
      if (!o) {
        return false;
      }
    }
    return false;
  };
  /**
   * @returns {Boolean} Whether `key` belongs to this object (not inherited
   *  from the cascade).
   */
  prototype.isOwnProperty = function(key){
    var meta;
    if (this.hasTombstone(key)) {
      return true;
    }
    meta = _.getNestedMeta(this._data, key);
    return (meta != null ? meta.obj : void 8) && hasOwn.call(meta.obj, key);
  };
  /**
   * @returns {Boolean} Whether `key` belongs to this object (not inherited
   *  from the cascade) and is defined.
   */
  prototype.isOwnValue = function(key){
    return !this.hasTombstone(key) && this.isOwnProperty(key) && _.getNested(this._data, key, MISSING) !== MISSING;
  };
  /**
   * @returns {Boolean} Whether the value at `key` is the same as that
   *  inherited by from the cascade.
   */
  prototype.isInheritedValue = function(key, strict){
    var val, cVal;
    strict == null && (strict = false);
    if (this.hasTombstone(key)) {
      return false;
    }
    val = this.get(key);
    cVal = this._getInCascade(key, MISSING, 2);
    if (strict) {
      return val === cVal;
    } else {
      return _.isEqual(val, cVal);
    }
  };
  /**
   * @returns {Boolean} Whether the value at `key` is different from that
   *  inherited by from the cascade.
   */
  prototype.isModifiedValue = function(key, strict){
    strict == null && (strict = false);
    return !this.isInheritedValue(key, strict);
  };
  /**
   * @private
   * @param {String} key Key to look up.
   * @param {*} [def=undefined] Value to return if lookup fails.
   * @param {Number} [idx=0] Index into lookup list to begin search.
   * @returns {*} First value for `key` found in the lookup chain starting at `idx`,
   *  and `def` otherwise.
   */
  prototype._getInCascade = function(key, def, idx){
    var lookups, data, val, _i, _len;
    idx == null && (idx = 0);
    if (this.hasTombstone(key)) {
      return def;
    }
    lookups = idx
      ? this._lookups.slice(idx)
      : this._lookups;
    for (_i = 0, _len = lookups.length; _i < _len; ++_i) {
      data = lookups[_i];
      val = _.getNested(data, key, MISSING, {
        tombstone: TOMBSTONE
      });
      if (val === TOMBSTONE) {
        return def;
      }
      if (val !== MISSING) {
        return val;
      }
    }
    return def;
  };
  /**
   * @returns {Boolean} Whether there is a value at the given key.
   */
  prototype.has = function(key){
    return this.get(key, MISSING) !== MISSING;
  };
  /**
   * @param {String} key Key to look up.
   * @param {*} [def=undefined] Value to return if lookup fails.
   * @returns {*} First value for `key` found in the lookup chain,
   *  and `def` otherwise.
   */
  prototype.get = function(key, def){
    return this._getInCascade(key, def);
  };
  /**
   * Sets a key to a value, accepting nested keys and creating intermediary objects as necessary.
   * @public
   * @name set
   * @param {String} key Key to set.
   * @param {*} value Non-`undefined` value to set.
   * @returns {this}
   */
  /**
   * @public
   * @name set
   * @param {Object} values Map of pairs to set. No value may be `undefined`.
   * @returns {this}
   */
  prototype.set = function(values){
    var key, val, _ref;
    if (arguments.length > 1 && typeof values === 'string') {
      key = arguments[0], val = arguments[1];
      if (!key || val === void 8) {
        throw new Error("Value and key cannot be undefined!");
      }
      values = (_ref = {}, _ref[key + ""] = val, _ref);
    }
    for (key in values) {
      val = values[key];
      _.unsetNested(this._tombstones, key, {
        ensure: true
      });
      _.setNested(this._data, key, val, {
        ensure: true
      });
    }
    return this;
  };
  /**
   * Delete the given key from this object's data dictionary and set a tombstone
   * which ensures that future lookups do not cascade and thus see the key as
   * `undefined`.
   * 
   * If the key is missing from the data dictionary the delete does not cascade,
   * but the tombstone is still set.
   * 
   * @param {String} key Key to unset.
   * @returns {undefined|*} If found, returns the old value, and otherwise `undefined`.
   */
  prototype.unset = function(key){
    var old;
    old = this.get(key);
    _.unsetNested(this._data, key);
    _.setNested(this._tombstones, key, TOMBSTONE, {
      ensure: true
    });
    return old;
  };
  /**
   * Unsets the key in the data dictionary, but ensures future lookups also
   * see the key as `undefined`, as opposed.
   * 
   * @param {String} key Key to unset.
   * @returns {this} 
   */
  prototype.inherit = function(key){
    _.unsetNested(this._tombstones, key, {
      ensure: true
    });
    return _.unsetNested(this._data, key);
  };
  prototype.extend = function(){
    var o, _i, _len;
    for (_i = 0, _len = arguments.length; _i < _len; ++_i) {
      o = arguments[_i];
      this.set(o);
    }
    return this;
  };
  /**
   * Recursively collapses the Cascade to a plain object by recursively merging the
   * lookups (in reverse order) into the data.
   * @returns {Object}
   */
  prototype.collapse = function(){
    var o, k;
    o = _.merge.apply(_, [{}].concat(__slice.call(this._lookups.slice(1).reverse())));
    for (k in this._tombstones) {
      delete o[k];
    }
    return _.merge(o, this._data);
  };
  /**
   * Returns a plain object for JSON serialization via {@link Cascade#collapse()}.
   * The name of this method is a bit confusing, as it doesn't actually return a 
   * JSON string -- but I'm afraid that it's the way that the JavaScript API for 
   * `JSON.stringify()` works.
   * 
   * @see https://developer.mozilla.org/en/JSON#toJSON()_method
   * @return {Object} Plain object for JSON serialization.
   */
  prototype.toJSON = function(){
    return this.collapse();
  };
  prototype.keys = function(){
    return _.flatten(_.map(this._lookups, function(it){
      return _.keys(it);
    }));
  };
  prototype.values = function(){
    return _.flatten(_.map(this._lookups, function(it){
      return _.values(it);
    }));
  };
  prototype.reduce = function(fn, acc, context){
    context == null && (context = this);
    return _.reduce(this._lookups, fn, acc, context);
  };
  prototype.map = function(fn, context){
    context == null && (context = this);
    return _.map(this._lookups, fn, context);
  };
  prototype.filter = function(fn, context){
    context == null && (context = this);
    return _.filter(this._lookups, fn, context);
  };
  prototype.each = function(fn, context){
    context == null && (context = this);
    _.each(this._lookups, fn, context);
    return this;
  };
  prototype.invoke = function(name){
    var args;
    args = __slice.call(arguments, 1);
    return _.invoke.apply(_, [this._lookups, name].concat(__slice.call(args)));
  };
  prototype.pluck = function(attr){
    return _.pluck(this._lookups, attr);
  };
  prototype.find = function(fn, context){
    context == null && (context = this);
    return _.find(this._lookups, fn, context);
  };
  prototype.toString = function(){
    var Cls;
    Cls = this.constructor;
    return (Cls.displayName || Cls.name) + "()";
  };
  return Cascade;
}());
ALIASES = {
  setTombstone: 'unset',
  toObject: 'collapse',
  forEach: 'each'
};
for (dest in ALIASES) {
  src = ALIASES[dest];
  Cascade.prototype[dest] = Cascade.prototype[src];
}
module.exports = exports = Cascade;
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
