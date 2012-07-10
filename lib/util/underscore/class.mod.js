require.define('/node_modules/kraken/util/underscore/class.js.js', function(require, module, exports, __dirname, __filename, undefined){

var _, _cls;
_ = require('underscore');
_cls = {
  /**
   * @returns {Array<Class>} The list of all superclasses for this class
   *  or object. Typically does not include Object or Function due to
   *  the prototype's constructor being set by the subclass.
   */
  getSuperClasses: (function(){
    function getSuperClasses(Cls){
      var that, superclass, _ref;
      if (!Cls) {
        return [];
      }
      if (that = Cls.__superclass__ || Cls.superclass || ((_ref = Cls.__super__) != null ? _ref.constructor : void 8)) {
        if (that !== Cls) {
          superclass = that;
        }
      }
      if (!superclass) {
        if (typeof Cls !== 'function') {
          Cls = Cls.constructor;
        }
        if (that = Cls.__superclass__ || Cls.superclass || ((_ref = Cls.__super__) != null ? _ref.constructor : void 8)) {
          if (that !== Cls) {
            superclass = that;
          }
        }
      }
      if (!superclass) {
        return [];
      } else {
        return [superclass].concat(getSuperClasses(superclass));
      }
    }
    return getSuperClasses;
  }())
  /**
   * Looks up an attribute on the prototype of each class in the class
   * hierarchy. Values from Object or Function are not typically included --
   * see the note at `getSuperClasses()`.
   * 
   * @param {Object} obj Object on which to reflect.
   * @param {String} prop Property to nab.
   * @returns {Array} List of the values, from closest parent to furthest.
   */,
  pluckSuper: function(obj, prop){
    if (!obj) {
      return [];
    }
    return _(_cls.getSuperClasses(obj)).chain().pluck('prototype').pluck(prop).value();
  }
  /**
   * As `.pluckSuper()` but includes value of `prop` on passed `obj`. Values
   *  from Object or Function are not typically included -- see the note
   *  at `getSuperClasses()`.
   * 
   * @returns {Array} List of the values, starting with the object's own
   *  value, and then moving from closest parent to furthest.
   */,
  pluckSuperAndSelf: function(obj, prop){
    if (!obj) {
      return [];
    }
    return [obj[prop]].concat(_cls.pluckSuper(obj, prop));
  }
};
__import(exports, _cls);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
