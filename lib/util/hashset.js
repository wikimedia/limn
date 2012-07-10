var HashSet, pt, exports, _, __slice = [].slice;
_ = require('underscore');
/**
 * A Set class, implemented using the `__id__` property on non-primitive objects it is passed. 
 * Arrays are hashed based on their contents. If an object lacks `__id__`, an exception will be
 * thrown. This class does not keep values in sorted order.
 * 
 * Underscore provides an easy way to generate unique IDs with the (surprise!) `_.uniqueId()`
 * function.
 * @see http://documentcloud.github.com/underscore/#uniqueId
 * 
 * @class
 */
HashSet = (function(){
  HashSet.displayName = 'HashSet';
  var prototype = HashSet.prototype, constructor = HashSet;
  /**
   * Objects by Id.
   * @private
   */
  prototype._byId = {};
  /**
   * Set contents.
   * @private
   */
  prototype._o = [];
  /**
   * Number of elements in the set.
   * @property {Number}
   */
  prototype.length = 0;
  /**
   * Accepts any number of collections to be added to the set.
   * @constructor
   */;
  function HashSet(){
    this._byId = {};
    this._o = [];
    if (arguments.length) {
      this.update.apply(this, arguments);
    }
  }
  /**
   * Determine unique identifier for the given value.
   * @private
   * @returns {String} Id for this value.
   */
  prototype._getIdSafe = function(v){
    var t;
    t = typeof v;
    switch (t) {
    case 'undefined':
      return 'u';
    case 'boolean':
    case 'string':
    case 'number':
      return t.charAt(0) + ":" + v;
    }
    if (v === null) {
      return 'n';
    }
    if ('__id__' in v) {
      return 'o:' + v.__id__;
    }
    if (_.isArray(v)) {
      return 'a:' + v.map(this._getIdSafe, this).join(',');
    }
  };
  /**
   * Determine unique identifier for the given value, throwing an exception otherwise.
   * @private
   * @returns {String} Id for this value.
   */
  prototype._getId = function(v){
    var id;
    id = this._getIdSafe(v);
    if (id == null) {
      throw new Error("HashSet elements must be hashable (" + v + ")");
    }
    return id;
  };
  /**
   * Aliases: HashSet#has
   * @param {Any} v Value to test.
   * @returns {Boolean} Whether HashSet contains value.
   */
  prototype.contains = function(v){
    return this._getIdSafe(v) in this._byId;
  };
  /**
   * @private
   * @returns {this}
   */
  prototype._addOne = function(v){
    var id;
    id = this._getId(v);
    if (!(id in this._byId)) {
      this._byId[id] = v;
      this._o.push(v);
      this.length = this._o.length;
    }
    return this;
  };
  /**
   * Add values to the HashSet.
   * Aliases: HashSet#push HashSet#unshift
   * @param {Any} values... Values to add.
   * @returns {this}
   */
  prototype.add = function(){
    var values;
    values = __slice.call(arguments);
    _.each(arguments, this._addOne, this);
    return this;
  };
  /**
   * @private
   * @returns {this}
   */
  prototype._removeOne = function(v){
    var id;
    id = this._getId(v);
    if (id in this._byId) {
      delete this._byId[id];
      this._o.splice(this._o.indexOf(v), 1);
      this.length = this._o.length;
    }
    return this;
  };
  /**
   * Remove values from the HashSet.
   * Aliases: HashSet#without
   * @param {Any} values... Values to remove.
   * @returns {this}
   */
  prototype.remove = function(){
    var values;
    values = __slice.call(arguments);
    _.each(arguments, this._removeOne, this);
    return this;
  };
  /**
   * Update this HashSet (in-place) with other collections.
   * Aliases: HashSet#extend HashSet#concat
   * @param {Array|Object} it... Collection to add.
   * @returns {this}
   */
  prototype.update = function(vs){
    var _this = this;
    _.each(arguments, function(it){
      return _.each(it, _this._addOne, _this);
    });
    return this;
  };
  /**
   * Remove and return an element from the set.
   * Aliases: HashSet#shift
   * @returns {Any} An element from the set.
   */
  prototype.pop = function(){
    var v, id;
    if (!this._o.length) {
      return;
    }
    v = this._o.shift();
    id = this._getIdSafe(v);
    delete this._byId[id];
    return v;
  };
  /**
   * Returns but does not remove the an element from the set.
   * @returns {Any} An element from the set.
   */
  prototype.element = function(){
    return this._o[0];
  };
  /**
   * Clones the set, returning a new object.
   * @returns {HashSet}
   */
  prototype.clone = function(){
    return new HashSet(this._o);
  };
  /**
   * Removes all elements from the set.
   * Aliases: HashSet#empty
   * @returns {this}
   */
  prototype.clear = function(){
    this._byId = {};
    this._o = [];
    this.length = 0;
    return this;
  };
  /**
   * Transforms the collection into a single value, front-to-back.
   * Aliases: HashSet#inject HashSet#fold HashSet#foldl HashSet#foldr
   * @param {Function} fn Reducer function.
   * @param {Any} [acc] Starting accumulator value.
   * @param {Object} [cxt=this] Context; defaults to this HashSet.
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
   * @returns {Any}
   */
  prototype.reduce = function(fn, acc, cxt){
    return _.reduce(this._o, fn, acc, cxt) || this;
  };
  /**
   * Applies a function to each element.
   * Aliases: HashSet#each
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
   * @returns {this}
   */
  prototype.forEach = function(fn, cxt){
    _.forEach(this._o, fn, cxt) || this;
    return this;
  };
  /**
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map
   * @return {HashSet} A new HashSet of elements produced by applying the transform across each element.
   */
  prototype.map = function(fn, cxt){
    return new HashSet(_.map(this._o, fn, cxt)) || this;
  };
  /**
   * Aliases: HashSet#select
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter
   * @return {HashSet} A new HashSet of only the elements passing the filter.
   */
  prototype.filter = function(fn, cxt){
    return new HashSet(_.filter(this._o, fn, cxt)) || this;
  };
  /**
   * Like `HashSet.filter()`, but instead keeps values for which the filter returns false.
   * @see HashSet#filter
   * @return {HashSet} A new HashSet of only the elements for which the filter returns false.
   */
  prototype.reject = function(fn, cxt){
    return new HashSet(_.reject(this._o, fn, cxt)) || this;
  };
  /**
   * Aliases: HashSet#any
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
   * @return {Boolean}
   */
  prototype.some = function(fn, cxt){
    return _.some(this._o, fn, cxt) || this;
  };
  /**
   * Aliases: HashSet#all
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
   * @return {Boolean}
   */
  prototype.every = function(fn, cxt){
    return _.every(this._o, fn, cxt) || this;
  };
  /**
   * Iterates through the HashSet, returning the first value for which `fn` returns truth-y.
   * Aliases: HashSet#detect
   * @returns {Any}
   */
  prototype.find = function(fn, cxt){
    return _.find(this._o, fn, cxt) || this;
  };
  /**
   * @returns {Array} List of all values at property `prop`.
   */
  prototype.pluck = function(prop){
    return _.pluck(this._o, prop);
  };
  /**
   * Invokes the named method on each element in the set, returning a list of the results.
   * @param {String} methodName Name of the method on each element to call.
   * @param {Any...} [args...] Optional arguments to call pass to method call.
   * @returns {Array} List of results.
   */
  prototype.invoke = function(methodName){
    return _.invoke.apply(_, [this._o].concat(__slice.call(arguments)));
  };
  /**
   * @returns {Array} List of the unique identifiers for each element of the set.
   */
  prototype.keys = function(){
    return _.keys(this._byId);
  };
  /**
   * Converts this HashSet to an Array.
   * Aliases: HashSet#toArray
   * @returns {Array}
   */
  prototype.values = function(){
    return this._o.slice();
  };
  /**
   * Tests if `a` is a Collection and has all elements in common with the set.
   * Sets are equal if and only if their intersection has the same size as both sets.
   * @param {Collection} a
   * @returns {Boolean}
   */
  prototype.equals = function(a){
    var L;
    if (!a) {
      return false;
    }
    L = this._o.length;
    return L === a.length && L === this.intersect(a).length;
  };
  /**
   * Tests if the set has no elements in common with `a`.
   * Sets are disjoint if and only if their intersection is the empty set.
   * @param {Collection} a
   * @returns {Boolean}
   */
  prototype.isDisjoint = function(a){
    if (!a) {
      return true;
    }
    return !_.some(a, this.contains, this);
  };
  /**
   * Test whether every element in the set is in `a`.
   * @param {Collection} a
   * @returns {Boolean}
   */
  prototype.isSubset = function(a){
    var A;
    if (!a) {
      return false;
    }
    A = _(_.isArray(a)
      ? a
      : _.values(a));
    return this.every(A.contains, A);
  };
  /**
   * Test whether every element in `a` is in the set.
   * @param {Array|Object} a
   * @returns {Boolean}
   */
  prototype.isSuperset = function(a){
    if (!a) {
      return false;
    }
    return _.every(a, this.contains, this);
  };
  /**
   * HashSet Intersection (A ^ B)
   * Intersects this YArray with another collection, returning a new YArray.
   * The membership test uses _(a).contains(), so it is possible to intersect collections of different types.
   * For YArray and YObject, .contains() uses strict equality (is) via .indexOf().
   * 
   * @param {Array|Object} a Comparison collection.
   * @returns {HashSet} A new YArray of all elements of {this} found in the supplied collection.
   * 
   * @example
   *      foo = /foo/
   *      A = [foo, 'A', 1, 2, 3, 'C', /foo/]
   *      B = [foo, 'B', 3, 'A', 1, /foo/]
   *      ins = _(A).intersect(B)
   *      ins.toString() is "HashSet([/foo/,A,1,3])"; # true
   *      ins.get(0) is foo; # true
   */
  prototype.intersect = function(a){
    return new HashSet(_.intersect(this._o, _.map(arguments, _.values)));
  };
  /**
   * HashSet Union (A v B)
   * Aliases: HashSet#extend HashSet#concat
   * @param {Array|Object} a Other collection(s).
   * @returns {HashSet} A new HashSet of all elements of both collections, without duplicates.
   */
  prototype.union = function(a){
    return _.reduce(arguments, function(out, it){
      return out.update(it);
    }, this.clone());
  };
  /**
   * HashSet Difference (A - B)
   * @param {Array|Object} a Comparison collection(s).
   * @returns {HashSet} A new HashSet of only elements of this HashSet not in supplied collection(s).
   */
  prototype.difference = function(a){
    return new HashSet(_.difference(this._o, _.map(arguments, _.values)));
  };
  /**
   * Symmetric Difference (A - B) v (B - A)
   * @returns {HashSet} 
   */
  prototype.xor = function(a){
    a = _.values(a);
    return this.difference(a).union(_.difference(a, this._o));
  };
  prototype.toString = function(){
    return "HashSet([" + this._o + "])";
  };
  return HashSet;
}());
pt = HashSet.prototype;
pt.push = pt.unshift = pt.add;
pt.shift = pt.pop;
pt.without = pt.remove;
pt.empty = pt.clear;
pt.has = pt.include = pt.contains;
pt.fold = pt.foldl = pt.foldr = pt.inject = pt.reduce;
pt.each = pt.forEach;
pt.select = pt.filter;
pt.all = pt.every;
pt.any = pt.some;
pt.detect = pt.find;
pt.toArray = pt.values;
pt.extend = pt.concat = pt.union;
exports = module.exports = HashSet;