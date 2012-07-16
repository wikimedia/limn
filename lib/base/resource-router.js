var Backbone, op, BaseBackboneMixin, mixinBase, ResourceRouter, _ref, _;
Backbone = require('backbone');
_ref = require('limn/util'), _ = _ref._, op = _ref.op;
_ref = require('limn/base/base-mixin'), BaseBackboneMixin = _ref.BaseBackboneMixin, mixinBase = _ref.mixinBase;
ResourceRouter = exports.ResourceRouter = Backbone.Router.extend(mixinBase({
  __bind__: []
  /**
   * Singular, lowercase resource-noun.
   * @optional
   * @type String
   * @example "user"
   */,
  id: null
  /**
   * Plural, lowercase resource-noun.
   * @required
   * @type String
   * @example "users"
   */,
  name: null,
  constructor: (function(){
    function ResourceRouter(opts){
      opts == null && (opts = {});
      this.__class__ = this.constructor;
      this.__superclass__ = this.constructor.__super__.constructor;
      this.waitingOn = 0;
      opts.routes || (opts.routes = this.makeRoutes());
      return Backbone.Router.apply(this, opts);
    }
    return ResourceRouter;
  }()),
  makeRoutes: function(){
    var name, id, routes;
    name = this.name, id = this.id;
    routes = {};
    if (typeof this.create === 'function') {
      routes[name + "/(new|edit)"] = this.create;
    }
    if (typeof this.edit === 'function') {
      routes[name + "/:" + id + "/edit"] = this.edit;
    }
    if (typeof this.show === 'function') {
      routes[name + "/:" + id] = this.show;
    }
    if (typeof this.index === 'function') {
      return routes[name + ""] = this.index;
    }
  }
}));