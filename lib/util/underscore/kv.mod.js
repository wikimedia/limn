require.define('/node_modules/limn/util/underscore/kv.js', function(require, module, exports, __dirname, __filename, undefined){

var _, _kv;
_ = require('underscore');
_kv = {
  /**
   * Transforms an object to a string of URL-encoded KV-pairs (aka "www-form-encoding").
   */
  toKV: function(o, item_delim, kv_delim){
    item_delim == null && (item_delim = '&');
    kv_delim == null && (kv_delim = '=');
    return _.reduce(o, function(acc, v, k){
      if (k) {
        acc.push(encodeURIComponent(k) + kv_delim + encodeURIComponent(v));
      }
      return acc;
    }, []).join(item_delim);
  }
  /**
   * Restores an object from a string of URL-encoded KV-pairs (aka "www-form-encoding").
   */,
  fromKV: function(qs, item_delim, kv_delim){
    item_delim == null && (item_delim = '&');
    kv_delim == null && (kv_delim = '=');
    return _.reduce(qs.split(item_delim), function(acc, pair){
      var idx, k, v, _ref;
      idx = pair.indexOf(kv_delim);
      if (idx !== -1) {
        _ref = [pair.slice(0, idx), pair.slice(idx + 1)], k = _ref[0], v = _ref[1];
      } else {
        _ref = [pair, ''], k = _ref[0], v = _ref[1];
      }
      if (k) {
        acc[decodeURIComponent(k)] = decodeURIComponent(v);
      }
      return acc;
    }, {});
  }
  /**
   * Copies and flattens a tree of sub-objects into namespaced keys on the parent object, such 
   * that `{ "foo":{ "bar":1 } }` becomes `{ "foo.bar":1 }`.
   */,
  collapseObject: function(obj, parent, prefix){
    parent == null && (parent = {});
    prefix == null && (prefix = '');
    if (prefix) {
      prefix += '.';
    }
    _.each(obj, function(v, k){
      if (_.isPlainObject(v)) {
        return _.collapseObject(v, parent, prefix + k);
      } else {
        return parent[prefix + k] = v;
      }
    });
    return parent;
  }
  /**
   * Inverse of `.collapseObject()` -- copies and expands any dot-namespaced keys in the object, such
   * that `{ "foo.bar":1 }` becomes `{ "foo":{ "bar":1 }}`.
   */,
  uncollapseObject: function(obj){
    return _.reduce(obj, function(acc, v, k){
      _.setNested(acc, k, v, {
        ensure: true
      });
      return acc;
    }, {});
  }
};
__import(exports, _kv);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
