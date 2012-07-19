var express, Resource, hasOwn, Controller, exports;
express = require('express');
Resource = require('express-resource');
hasOwn = Object.prototype.hasOwnProperty;
/**
 * @class Resource controller for easily subclassing an express Resource.
 */
Controller = (function(superclass){
  Controller.displayName = 'Controller';
  var prototype = __extend(Controller, superclass).prototype, constructor = Controller;
  /**
   * Singular, lowercase resource-noun.
   * @optional
   * @type String
   * @example "user"
   */
  prototype.id = null;
  /**
   * Plural, lowercase resource-noun.
   * @required
   * @type String
   * @example "users"
   */
  prototype.name = null;
  /**
   * Resource routing prefix.
   * @optional
   * @type String
   */
  prototype.base = '/';
  /**
   * Default format.
   * @type String
   */
  prototype.format = null;
  /**
   * Hash of sub-routes. Keys are routes, and values are either:
   *  - String: the name of a method to be used for used for all HTTP-methods
   *    for this sub-route.
   *  - Object: Hash of HTTP-method (get, put, post, del, or all) to the name
   *    of a method on this Controller.
   * 
   * Example:
   *      { '/foo' => 'foo',
   *        '/bar' => {'get' => 'get_bar', 'del' => 'delete_bar' },
   *      }
   *      If this mapping is in a controller with name 'nonya', then
   *          GET     '/nonya/foo' -> NonyaController.foo(),
   *          GET     '/nonya/bar' -> NonyaController.get_bar()
   *          DELETE  '/nonya/bar' -> NonyaController.delete_bar()
   * 
   * @type Object
   */
  prototype.mapping = null;
  /**
   * @constructor
   */;
  function Controller(app, name){
    var actions, k, fn, _ref;
    this.app = app;
    this.routes || (this.routes = {});
    actions = {};
    for (k in this) {
      fn = this[k];
      if (!(typeof fn === 'function' && k !== 'constructor')) {
        continue;
      }
      actions[k] = this[k] = fn.bind(this);
    }
    delete actions.load;
    if (typeof actions.autoload === 'function') {
      actions.load = actions.autoload;
    }
    ((_ref = this.app).resources || (_ref.resources = {}))[this.name] = this;
    this.applyControllerMapping();
    superclass.call(this, name || this.name, actions, this.app);
  }
  /**
   * Apply the contents of a mapping hash.
   * @private
   */
  prototype.applyControllerMapping = function(mapping){
    var subroute, methods, verb, method;
    mapping == null && (mapping = this.mapping);
    for (subroute in mapping) {
      methods = mapping[subroute];
      if (typeof methods === 'string') {
        methods = {
          all: methods
        };
      }
      for (verb in methods) {
        method = methods[verb];
        this.map(verb, subroute, this[method]);
      }
    }
    return this;
  };
  /**
   * Boilerplate for creating a error-handling callback that otherwise returns JSON {result:'ok'}.
   * @param {Response} res Express response object.
   * @param {String} msg Error message to send on failure.
   * @param {Number} [code=500] HTTP error code to send on failure.
   * @returns {Function} Error-handling callback.
   */
  prototype.errorHandler = function(res, msg, code){
    code == null && (code = 500);
    return function(err){
      var msg;
      if (err) {
        msg || (msg = err.message || String(err));
        console.error(msg);
        return res.send({
          result: "error",
          message: msg
        }, code);
      } else {
        return res.send({
          result: "ok"
        });
      }
    };
  };
  prototype.getClassName = function(){
    return (this.constructor.name || this.constructor.displayName) + "";
  };
  prototype.toString = function(){
    return this.getClassName() + "(name='" + this.name + "')";
  };
  return Controller;
}(Resource));
express.HTTPServer.prototype.controller = express.HTTPSServer.prototype.controller = function(name, ControllerClass, opts){
  var _ref;
  if (typeof name === 'function') {
    _ref = [ControllerClass, name, null], opts = _ref[0], ControllerClass = _ref[1], name = _ref[2];
  }
  return new ControllerClass(this, name);
};
module.exports = exports = Controller;
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}