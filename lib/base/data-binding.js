var Backbone, op, DataBinding, _ref, _;
Backbone = require('backbone');
_ref = require('limn/util'), _ = _ref._, op = _ref.op;
exports.DataBinding = DataBinding = (function(){
  DataBinding.displayName = 'DataBinding';
  var prototype = DataBinding.prototype, constructor = DataBinding;
  prototype.data = null;
  prototype.context = null;
  prototype.el = null;
  prototype.$el = null;
  prototype.bindPoints = null;
  function DataBinding(el, context){
    this.context = context != null ? context : el;
    if (el instanceof Backbone.View) {
      el = el.$el;
    }
    this.$el = $(el);
    this.el = this.$el.get(0);
    this.bindPoints = this.$('[data-bind], [name]').not(this.$('[data-subview]').find('[data-bind], [name]'));
  }
  prototype.$ = function(sel){
    return this.$el.find(sel);
  };
  prototype.serialize = function(it){
    return it;
  };
  prototype.update = function(data){
    var key, val, _ref;
    this.data = data;
    for (key in _ref = _.collapseObject(this.data)) {
      val = _ref[key];
      this.updateBinding(key, val);
    }
    return this;
  };
  prototype.updateBinding = function(key, val){
    var bp;
    if (bp = this.findDataBindPoint(key)) {
      if (_.isFunction(val)) {
        val.call(this.context, val, key, bp, this.data);
      } else if (bp.is('input:checkbox')) {
        bp.attr('checked', !!val);
      } else if (bp.is('input, textarea')) {
        bp.val(this.serialize(val));
      } else {
        if (op.toBool(bp.data('data-bind-escape'))) {
          bp.text(this.serialize(val));
        } else {
          bp.html(this.serialize(val));
        }
      }
    } else {
      false && console.warn(this + ".updateBinding(): Unable to find data bind-point for " + key + "=" + val + "!");
    }
    return this;
  };
  prototype.findDataBindPoint = function(key){
    var bp;
    bp = this.bindPoints.filter("[name='" + key + "'], [data-bind='" + key + "']");
    if (bp.length) {
      return bp.eq(0);
    }
  };
  return DataBinding;
}());