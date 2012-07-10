var Backbone, op, AppView, _ref, _;
Backbone = require('backbone');
_ref = require('kraken/util'), _ = _ref._, op = _ref.op;
/**
 * @class Application view, automatically attaching to an existing element
 *  found at `appSelector`.
 * @extends Backbone.View
 */
AppView = exports.AppView = Backbone.View.extend({
  appSelector: '#content .inner'
  /**
   * @constructor
   */,
  constructor: (function(){
    function AppView(options){
      var that, _this = this;
      options == null && (options = {});
      if (typeof options === 'function') {
        this.initialize = options;
        options = {};
      } else {
        if (that = options.initialize) {
          this.initialize = that;
        }
      }
      if (that = options.appSelector) {
        this.appSelector = that;
      }
      options.el || (options.el = jQuery(this.appSelector)[0]);
      Backbone.View.call(this, options);
      jQuery(function(){
        return _this.render();
      });
      return this;
    }
    return AppView;
  }())
  /**
   * Override to set up your app. This method may be passed
   * as an option to the constructor.
   */,
  initialize: function(){}
  /**
   * Append subviews.
   */,
  render: function(){
    var _ref;
    if (this.view && !((_ref = this.view.$el.parent()) != null && _ref.length)) {
      return this.$el.append(this.view.el);
    }
  },
  getClassName: function(){
    return (this.constructor.name || this.constructor.displayName) + "";
  },
  toString: function(){
    return this.getClassName() + "()";
  }
});