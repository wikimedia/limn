require.define('/node_modules/kraken/util/underscore/object.js.js', function(require, module, exports, __dirname, __filename, undefined){

var getProto, OBJ_PROTO, hasOwn, objToString, DEFAULT_DELEGATE_OPTIONS, TOMBSTONE, DEFAULT_NESTED_OPTIONS, _, _ref, _obj, __slice = [].slice;
_ = require('underscore');
getProto = Object.getPrototypeOf;
OBJ_PROTO = Object.prototype;
_ref = {}, hasOwn = _ref.hasOwnProperty, objToString = _ref.toString;
/**
 * Default options for delegate-accessor functions.
 */
DEFAULT_DELEGATE_OPTIONS = exports.DEFAULT_DELEGATE_OPTIONS = {
  getter: 'get',
  setter: 'set',
  deleter: 'unset'
};
/**
 * Tombstone for deleted, non-passthrough keys.
 */
TOMBSTONE = exports.TOMBSTONE = {};
/**
 * Default options for nested-accessor functions.
 */
DEFAULT_NESTED_OPTIONS = exports.DEFAULT_NESTED_OPTIONS = __import({
  ensure: false,
  tombstone: TOMBSTONE
}, DEFAULT_DELEGATE_OPTIONS);
/**
 * @namespace Functions for working with objects and object graphs.
 */
_obj = {
  /**
   * @returns {Boolean} Whether value is a plain object or not.
   */
  isPlainObject: function(obj){
    var key;
    if (!obj || objToString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval) {
      return false;
    }
    if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
      return false;
    }
    for (key in obj) {}
    return key === void 8 || hasOwn.call(obj, key);
  }
  /**
   * In-place removal of a value from an Array or Object.
   */,
  remove: function(obj, v){
    var values, idx, k, _i, _len;
    values = [].slice.call(arguments, 1);
    if (_.isArray(obj) || obj instanceof Array) {
      for (_i = 0, _len = values.length; _i < _len; ++_i) {
        v = values[_i];
        idx = obj.indexOf(v);
        if (idx !== -1) {
          obj.splice(idx, 1);
        }
      }
    } else {
      for (k in obj) {
        v = obj[k];
        if (-1 !== values.indexOf(v)) {
          delete obj[k];
        }
      }
    }
    return obj;
  }
  /**
   * Converts the collection to a list of its items:
   * - Objects become a list of `[key, value]` pairs.
   * - Strings become a list of characters.
   * - Arguments objects become an array.
   * - Arrays are copied.
   */,
  items: function(obj){
    if (_.isObject(obj) && !_.isArguments(obj)) {
      return _.map(obj, function(v, k){
        return [k, v];
      });
    } else {
      return [].slice.call(obj);
    }
  },
  isMember: function(obj, v){
    var values, common;
    values = _.unique([].slice.call(arguments, 1));
    common = _.intersection(_.values(obj), values);
    return _.isEqual(values, common);
  },
  get: function(obj, key, def, opts){
    var getter;
    if (obj == null) {
      return;
    }
    getter = (opts != null ? opts.getter : void 8) || 'get';
    if (typeof obj[getter] === 'function') {
      return obj[getter](key, def, opts);
    } else {
      if (obj[key] !== void 8) {
        return obj[key];
      } else {
        return def;
      }
    }
  },
  set: function(obj, key, value, opts){
    var values, setter, _ref;
    if (obj == null) {
      return;
    }
    if (key != null && _.isObject(key)) {
      _ref = [key, value], values = _ref[0], opts = _ref[1];
    } else {
      values = (_ref = {}, _ref[key + ""] = value, _ref);
    }
    setter = (opts != null ? opts.setter : void 8) || 'set';
    if (typeof obj[setter] === 'function') {
      for (key in values) {
        value = values[key];
        obj[setter](key, value, opts);
      }
    } else {
      for (key in values) {
        value = values[key];
        obj[key] = value;
      }
    }
    return obj;
  },
  unset: function(obj, key, opts){
    var deleter, _ref;
    if (obj == null) {
      return;
    }
    deleter = (opts != null ? opts.deleter : void 8) || 'unset';
    if (typeof obj[deleter] === 'function') {
      return obj[deleter](key, opts);
    } else {
      return _ref = obj[key], delete obj[key], _ref;
    }
  }
  /**
   * Searches a heirarchical object for a given subkey specified in dotted-property syntax,
   * respecting sub-object accessor-methods (e.g., 'get', 'set') if they exist.
   * 
   * @param {Object} base The object to serve as the root of the property-chain.
   * @param {Array|String} chain The property-chain to lookup.
   * @param {Object} [opts] Options:
   * @param {Boolean} [opts.ensure=false] If true, intermediate keys that are `null` or
   *  `undefined` will be filled in with a new empty object `{}`, ensuring the get will
   *   return valid metadata.
   * @param {String} [opts.getter="get"] Name of the sub-object getter method use if it exists.
   * @param {String} [opts.setter="set"] Name of the sub-object setter method use if it exists.
   * @param {String} [opts.deleter="unset"] Name of the sub-object deleter method use if it exists.
   * @param {Object} [opts.tombstone=TOMBSTONE] Sentinel value to be interpreted as no-passthrough,
   *  forcing the lookup to fail and return `undefined`. TODO: opts.returnTombstone
   * @returns {undefined|Object} If found, the object is of the form 
   *  `{ key: Qualified key name, obj: Parent object of key, val: Value at obj[key], opts: Options }`. 
   *  Otherwise `undefined`.
   */,
  getNestedMeta: function(obj, chain, opts){
    var len;
    if (typeof chain === 'string') {
      chain = chain.split('.');
    }
    len = chain.length - 1;
    opts = __import(_.clone(DEFAULT_NESTED_OPTIONS), opts || {});
    return _.reduce(chain, function(obj, key, idx){
      var val;
      if (obj == null) {
        return;
      }
      val = _.get(obj, key, void 8, opts);
      if (val === opts.tombstone) {
        if (!ops.ensure) {
          return;
        }
        val = void 8;
      }
      if (idx === len) {
        return {
          key: key,
          val: val,
          obj: obj,
          opts: opts
        };
      }
      if (val == null && opts.ensure) {
        val = {};
        _.set(obj, key, val, opts);
      }
      return val;
    }, obj);
  }
  /**
   * Searches a heirarchical object for a given subkey specified in dotted-property syntax.
   * @param {Object} obj The object to serve as the root of the property-chain.
   * @param {Array|String} chain The property-chain to lookup.
   * @param {Any} [def=undefined] Value to return if lookup fails.
   * @param {Object} [opts] Options to pass to `{@link #getNestedMeta}`.
   * @returns {null|Object} If found, returns the value, and otherwise `default`.
   */,
  getNested: function(obj, chain, def, opts){
    var meta;
    meta = _.getNestedMeta(obj, chain, opts);
    if ((meta != null ? meta.val : void 8) === void 8) {
      return def;
    }
    return meta.val;
  }
  /**
   * Searches a heirarchical object for a given subkey specified in
   * dotted-property syntax, setting it with the provided value if found.
   * @param {Object} obj The object to serve as the root of the property-chain.
   * @param {Array|String} chain The property-chain to lookup.
   * @param {Any} value The value to set.
   * @param {Object} [opts] Options to pass to `{@link #getNestedMeta}`.
   * @returns {undefined|Any} If found, returns the old value, and otherwise `undefined`.
   */,
  setNested: function(obj, chain, value, opts){
    var meta, key, val;
    if (!(meta = _.getNestedMeta(obj, chain, opts))) {
      return;
    }
    obj = meta.obj, key = meta.key, val = meta.val, opts = meta.opts;
    _.set(obj, key, value, opts);
    return val;
  }
  /**
   * Searches a heirarchical object for a potentially-nested key and removes it.
   * 
   * @param {Object} obj The root of the lookup chain.
   * @param {String|Array<String>} chain The chain of property-keys to navigate.
   *  Nested keys can be supplied as a dot-delimited string (e.g., `_.unsetNested(obj, 'user.name')`),
   *  or an array of strings, allowing for keys with dots (eg.,
   *  `_.unsetNested(obj, ['products', 'by_price', '0.99'])`).
   * @param {Object} [opts] Options to pass to `{@link #getNestedMeta}`.
   * @returns {undefined|Any} The old value if found; otherwise `undefined`.
   */,
  unsetNested: function(obj, chain, opts){
    var meta, key, val;
    if (!(meta = _.getNestedMeta(obj, chain, opts))) {
      return;
    }
    obj = meta.obj, key = meta.key, val = meta.val, opts = meta.opts;
    _.unset(obj, key, opts);
    return val;
  }
  /**
   * Recursively merges together any number of donor objects into the target object.
   * Modified from `jQuery.extend()`.
   * 
   * @param {Object} target Target object of the merge.
   * @param {Object} ...donors Donor objects.
   * @returns {Object} 
   */,
  merge: function(target){
    var donors, donor, _i, _len;
    target == null && (target = {});
    donors = __slice.call(arguments, 1);
    if (!(typeof target === "object" || _.isFunction(target))) {
      target = _.isArray(donors[0])
        ? []
        : {};
    }
    for (_i = 0, _len = donors.length; _i < _len; ++_i) {
      donor = donors[_i];
      if (donor == null) {
        continue;
      }
      _.each(donor, _fn);
    }
    return target;
    function _fn(value, key){
      var current, valueIsArray;
      current = target[key];
      if (target === value) {
        return;
      }
      if (value && (_.isPlainObject(value) || (valueIsArray = _.isArray(value)))) {
        if (valueIsArray) {
          if (!_.isArray(current)) {
            current = [];
          }
        } else {
          if (!(current && typeof current === 'object')) {
            current = {};
          }
        }
        return _.set(target, key, _.merge(current, value));
      } else if (value !== void 8) {
        return _.set(target, key, value);
      }
    }
  }
};
__import(exports, _obj);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
