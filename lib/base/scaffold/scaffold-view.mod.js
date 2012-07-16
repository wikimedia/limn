require.define('/node_modules/limn/base/scaffold/scaffold-view.js', function(require, module, exports, __dirname, __filename, undefined){

var op, BaseView, Field, FieldList, FieldView, Scaffold, _, _ref;
_ = require('limn/util/underscore');
op = require('limn/util/op');
BaseView = require('limn/base').BaseView;
_ref = require('limn/base/scaffold/scaffold-model'), Field = _ref.Field, FieldList = _ref.FieldList;
FieldView = exports.FieldView = BaseView.extend({
  tagName: 'div',
  className: 'field',
  type: 'string',
  events: {
    'blur .value': 'onChange',
    'submit .value': 'onChange'
  },
  constructor: (function(){
    function FieldView(){
      return BaseView.apply(this, arguments);
    }
    return FieldView;
  }()),
  initialize: function(){
    BaseView.prototype.initialize.apply(this, arguments);
    return this.type = this.model.get('type').toLowerCase() || 'string';
  },
  onChange: function(){
    var val, current;
    if (this.type === 'boolean') {
      val = !!this.$('.value').attr('checked');
    } else {
      val = this.model.getParser()(this.$('.value').val());
    }
    current = this.model.getValue();
    if (_.isEqual(val, current)) {
      return;
    }
    this.model.setValue(val, {
      silent: true
    });
    return this.trigger('change', this);
  },
  toTemplateLocals: function(){
    var json, v;
    json = FieldView.__super__.toTemplateLocals.apply(this, arguments);
    json.id || (json.id = _.camelize(json.name));
    json.value == null && (json.value = '');
    if (v = json.value && (_.isArray(v) || _.isPlainObject(v))) {
      json.value = JSON.stringify(v);
    }
    return json;
  }
  /**
   * A ghetto default template, typically overridden by superclass.
   */,
  template: function(locals){
    return $("<label class=\"name\" for=\"" + locals.id + "\">" + locals.name + "</label>\n<input class=\"value\" type=\"text\" id=\"" + locals.id + "\" name=\"" + locals.id + "\" value=\"" + locals.value + "\">");
  },
  render: function(){
    if (this.model.get('ignore')) {
      return this.remove();
    }
    return FieldView.__super__.render.apply(this, arguments);
  }
});
Scaffold = exports.Scaffold = BaseView.extend({
  __bind__: ['addField', 'resetFields'],
  tagName: 'form',
  className: 'scaffold',
  collectionType: FieldList,
  subviewType: FieldView,
  constructor: (function(){
    function Scaffold(){
      return BaseView.apply(this, arguments);
    }
    return Scaffold;
  }()),
  initialize: function(){
    var CollectionType;
    CollectionType = this.collectionType;
    this.model = this.collection || (this.collection = new CollectionType);
    BaseView.prototype.initialize.apply(this, arguments);
    this.collection.on('add', this.addField, this);
    return this.collection.on('reset', this.resetFields, this);
  },
  addField: function(field){
    var SubviewType, view;
    if (field.view) {
      this.removeSubview(field.view);
    }
    field.off('change:value', this.onChange, this);
    field.on('change:value', this.onChange, this);
    SubviewType = this.subviewType;
    view = this.addSubview(new SubviewType({
      model: field
    }));
    view.on('change', this.onChange.bind(this, field));
    this.render();
    return view;
  },
  resetFields: function(){
    this.removeAllSubviews();
    this.collection.each(this.addField);
    return this;
  },
  onChange: function(field){
    var key, value;
    key = field.get('name');
    value = field.getValue();
    this.trigger("change:" + key, this, value, key, field);
    this.trigger("change", this, value, key, field);
    return this;
  }
});
['get', 'at', 'pluck', 'invoke', 'values', 'toJSON', 'toKVPairs', 'toKV', 'toURL'].forEach(function(methodname){
  return Scaffold.prototype[methodname] = function(){
    return this.collection[methodname].apply(this.collection, arguments);
  };
});

});
