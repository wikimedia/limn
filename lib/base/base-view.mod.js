require.define('/node_modules/limn/base/base-view.js', function(require, module, exports, __dirname, __filename, undefined){

var Backbone, op, mixinBase, BaseModel, DataBinding, BaseView, ViewList, _ref, _, __slice = [].slice;
Backbone = require('backbone');
_ref = require('../util'), _ = _ref._, op = _ref.op;
mixinBase = require('./base-mixin').mixinBase;
BaseModel = require('./base-model').BaseModel;
DataBinding = require('./data-binding').DataBinding;
/**
 * @class Base view, extending Backbone.View, used by scaffold and others.
 * @extends Backbone.View
 */
BaseView = exports.BaseView = Backbone.View.extend(mixinBase({
  tagName: 'section',
  model: BaseModel
  /**
   * Method-name called by `onReturnKeypress` when used as an event-handler.
   * @type String
   */,
  callOnReturnKeypress: null
  /**
   * Parent view of this view.
   * @type BaseView
   */,
  parent: null
  /**
   * Array of [view, selector]-pairs.
   * @type Array<[BaseView, String]>
   */,
  subviews: []
  /**
   * Whether this view has been added to the DOM.
   * @type Boolean
   */,
  isAttached: false,
  constructor: (function(){
    function BaseView(){
      this.__class__ = this.constructor;
      this.__superclass__ = this.constructor.__super__.constructor;
      this.waitingOn = 0;
      this.subviews = new ViewList;
      this.onReturnKeypress = _.debounce(this.onReturnKeypress.bind(this), 50);
      Backbone.View.apply(this, arguments);
      return this.trigger('create', this);
    }
    return BaseView;
  }()),
  initialize: function(){
    this.__apply_bind__();
    this.setModel(this.model);
    this.build();
    return this.$el.on('form submit', function(it){
      return it.preventDefault();
    });
  },
  setModel: function(model){
    var data;
    if (this.model) {
      this.model.off('change', this.render, this);
      this.model.off('destroy', this.remove, this);
      delete this.model.view;
      data = this.$el.data();
      delete data.model;
      delete data.view;
    }
    if (this.model = model) {
      this.model.view = this;
      this.$el.data({
        model: this.model,
        view: this
      });
      this.model.on('change', this.render, this);
      this.model.on('destroy', this.remove, this);
      this.trigger('change:model', this, model);
    }
    return model;
  },
  setParent: function(parent){
    var old_parent, _ref;
    _ref = [this.parent, parent], old_parent = _ref[0], this.parent = _ref[1];
    this.trigger('parent', this, parent, old_parent);
    return this;
  },
  unsetParent: function(){
    var old_parent, _ref;
    _ref = [this.parent, null], old_parent = _ref[0], this.parent = _ref[1];
    this.trigger('unparent', this, old_parent);
    return this;
  },
  addSubview: function(view){
    this.removeSubview(view);
    this.subviews.push(view);
    view.setParent(this);
    return view;
  },
  removeSubview: function(view){
    if (this.hasSubview(view)) {
      view.remove();
      this.subviews.remove(view);
      view.unsetParent();
    }
    return view;
  },
  hasSubview: function(view){
    return this.subviews.contains(view);
  },
  invokeSubviews: function(){
    var _ref;
    return (_ref = this.subviews).invoke.apply(_ref, arguments);
  },
  removeAllSubviews: function(){
    this.subviews.forEach(this.removeSubview, this);
    return this;
  },
  attach: function(el){
    var _this = this;
    this.$el.appendTo(el);
    if (this.isAttached) {
      return this;
    }
    this.isAttached = true;
    _.delay(function(){
      _this.delegateEvents();
      return _this.trigger('attach', _this);
    }, 50);
    return this;
  },
  remove: function(){
    this.$el.remove();
    if (!this.isAttached) {
      return this;
    }
    this.isAttached = false;
    this.trigger('unattach', this);
    return this;
  },
  clear: function(){
    this.remove();
    this.model.destroy();
    this.trigger('clear', this);
    return this;
  },
  hide: function(){
    this.$el.hide();
    this.trigger('hide', this);
    return this;
  },
  show: function(){
    this.$el.show();
    this.trigger('show', this);
    return this;
  }
  /**
   * Attach each subview to its bind-point.
   * @returns {this}
   */,
  attachSubviews: function(){
    var bps, view, bp, _i, _ref, _len;
    bps = this.getOwnSubviewBindPoints();
    if (this.subviews.length && !bps.length) {
      console.warn(this + ".attachSubviews(): no subview bind-points found!");
      return this;
    }
    for (_i = 0, _len = (_ref = this.subviews).length; _i < _len; ++_i) {
      view = _ref[_i];
      if (bp = this.findSubviewBindPoint(view, bps)) {
        view.attach(bp);
      } else {
        console.warn(this + ".attachSubviews(): Unable to find bind-point for " + view + "!");
      }
    }
    return this;
  }
  /**
   * Finds all subview bind-points under this view's element, but not under
   * the view element of any subview.
   * @returns {jQuery|undefined}
   */,
  getOwnSubviewBindPoints: function(){
    return this.$('[data-subview]').add(this.$el.filter('[data-subview]')).not(this.$('[data-subview] [data-subview]'));
  }
  /**
   * Find the matching subview bind-point for the given view.
   */,
  findSubviewBindPoint: function(view, bind_points){
    var bp;
    bind_points || (bind_points = this.getOwnSubviewBindPoints());
    if (view.id) {
      bp = bind_points.filter("[data-subview$=':" + view.id + "']");
      if (bp.length) {
        return bp.eq(0);
      }
    }
    bp = bind_points.filter("[data-subview='" + view.getClassName() + "']");
    if (bp.length) {
      return bp.eq(0);
    }
  },
  toTemplateLocals: function(){
    return this.model.toJSON();
  },
  $template: function(){
    return $(this.template((__import({
      _: _,
      op: op,
      model: this.model,
      view: this
    }, this.toTemplateLocals()))));
  },
  build: function(){
    var outer, attrs, idx, attr, _ref, _len;
    if (!this.template) {
      return this;
    }
    outer = this.$template();
    attrs = {
      id: outer.attr('id'),
      'class': outer.attr('class')
    };
    for (idx = 0, _len = (_ref = outer[0].attributes).length; idx < _len; ++idx) {
      attr = _ref[idx];
      attrs[attr.name] = attr.value;
    }
    this.$el.html(outer.html()).attr(attrs);
    this.attachSubviews();
    this.isBuilt = true;
    return this;
  },
  render: function(){
    this.wait();
    if (this.isBuilt) {
      this.update();
    } else {
      this.build();
    }
    this.renderSubviews();
    this.trigger('render', this);
    this.unwait();
    return this;
  },
  renderSubviews: function(){
    this.attachSubviews();
    this.subviews.invoke('render');
    return this;
  },
  update: function(){
    var locals;
    new DataBinding(this).update(locals = this.toTemplateLocals());
    this.trigger('update', this, locals);
    return this;
  }
  /* * * *  Events  * * * */,
  bubbleEventDown: function(evt){
    this.invokeSubviews.apply(this, ['trigger'].concat(__slice.call(arguments)));
    return this;
  },
  redispatch: function(evt){
    var args;
    args = __slice.call(arguments, 1);
    this.trigger.apply(this, [evt, this].concat(__slice.call(args)));
    return this;
  },
  onlyOnReturn: function(fn){
    var args, _this = this;
    args = __slice.call(arguments, 1);
    fn = _.debounce(fn.bind(this), 50);
    return function(evt){
      if (evt.keyCode === 13) {
        return fn.apply(_this, args);
      }
    };
  }
  /**
   * Call a delegate on keypress == the return key.
   * @returns {Function} Keypress event handler.
   */,
  onReturnKeypress: function(evt){
    var fn;
    if (this.callOnReturnKeypress) {
      fn = this[this.callOnReturnKeypress];
    }
    if (fn && evt.keyCode === 13) {
      return fn.call(this);
    }
  },
  toString: function(){
    return this.getClassName() + "(model=" + this.model + ")";
  }
}));
['get', 'set', 'unset', 'toJSON', 'toKV', 'toURL'].forEach(function(methodname){
  return BaseView.prototype[methodname] = function(){
    return this.model[methodname].apply(this.model, arguments);
  };
});
exports.ViewList = ViewList = (function(superclass){
  ViewList.displayName = 'ViewList';
  var prototype = __extend(ViewList, superclass).prototype, constructor = ViewList;
  function ViewList(views){
    views == null && (views = []);
    superclass.apply(this, arguments);
  }
  prototype.extend = function(views){
    var _this = this;
    _.each(views, function(it){
      return _this.push(it);
    });
    return this;
  };
  prototype.findByModel = function(model){
    return this.find(function(it){
      return it.model === model;
    });
  };
  prototype.toString = function(){
    var contents;
    contents = this.length ? "\"" + this.join('","') + "\"" : '';
    return "ViewList[" + this.length + "](" + contents + ")";
  };
  return ViewList;
}(Array));
['each', 'contains', 'invoke', 'pluck', 'find', 'remove', 'compact', 'flatten', 'without', 'union', 'intersection', 'difference', 'unique', 'uniq'].forEach(function(methodname){
  return ViewList.prototype[methodname] = function(){
    var _ref;
    return (_ref = _[methodname]).call.apply(_ref, [_, this].concat(__slice.call(arguments)));
  };
});
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});
