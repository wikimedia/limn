var op, BaseModel, BaseList, Field, FieldList, _, _ref, __slice = [].slice;
_ = require('limn/util/underscore');
op = require('limn/util/op');
_ref = require('limn/base'), BaseModel = _ref.BaseModel, BaseList = _ref.BaseList;
Field = exports.Field = BaseModel.extend({
  valueAttribute: 'value',
  defaults: function(){
    return {
      name: '',
      type: 'String',
      'default': null,
      desc: '',
      include: 'diff',
      tags: [],
      examples: []
    };
  },
  constructor: (function(){
    function Field(){
      return BaseModel.apply(this, arguments);
    }
    return Field;
  }()),
  initialize: function(){
    _.bindAll.apply(_, [this].concat(__slice.call(_.functions(this).filter(function(it){
      return _.startsWith(it, 'parse');
    }))));
    this.set('id', this.id = _.camelize(this.get('name')));
    if (!this.has('value')) {
      this.set('value', this.get('default'), {
        silent: true
      });
    }
    return Field.__super__.initialize.apply(this, arguments);
  }
  /* * * Value Accessors * * */,
  getValue: function(def){
    return this.getParser()(this.get(this.valueAttribute, def));
  },
  setValue: function(v, options){
    var def, val;
    def = this.get('default');
    if (!v && def == null) {
      val = null;
    } else {
      val = this.getParser()(v);
    }
    return this.set(this.valueAttribute, val, options);
  },
  clearValue: function(){
    return this.set(this.valueAttribute, this.get('default'));
  },
  isDefault: function(){
    return this.get(this.valueAttribute) === this.get('default');
  }
  /* * * Serializers * * */,
  serializeValue: function(){
    return this.serialize(this.getValue());
  },
  toJSON: function(){
    var _ref;
    return __import({
      id: this.id
    }, (_ref = _.clone(this.attributes), _ref.value = this.getValue(), _ref.def = this.get('default'), _ref));
  },
  toKVPairs: function(){
    var _ref;
    return _ref = {}, _ref[this.id + ""] = this.serializeValue(), _ref;
  },
  toString: function(){
    return "(" + this.id + ": " + this.serializeValue() + ")";
  }
});
FieldList = exports.FieldList = BaseList.extend({
  model: Field,
  constructor: (function(){
    function FieldList(){
      return BaseList.apply(this, arguments);
    }
    return FieldList;
  }())
  /**
   * Collects a map of fields to their values, excluding those set to `null` or their default.
   * @returns {Object}
   */,
  values: function(opts){
    opts == null && (opts = {});
    opts = __import({
      keepDefaults: true,
      serialize: false
    }, opts);
    return _.synthesize(opts.keepDefaults
      ? this.models
      : this.models.filter(function(it){
        return !it.isDefault();
      }), function(it){
      return [
        it.get('name'), opts.serialize
          ? it.serializeValue()
          : it.getValue()
      ];
    });
  },
  toJSON: function(){
    return this.values({
      keepDefaults: true,
      serialize: false
    });
  },
  toKVPairs: function(){
    return _.collapseObject(this.values({
      keepDefaults: true,
      serialize: true
    }));
  },
  toKV: function(item_delim, kv_delim){
    item_delim == null && (item_delim = '&');
    kv_delim == null && (kv_delim = '=');
    return _.toKV(this.toKVPairs(), item_delim, kv_delim);
  },
  toURL: function(item_delim, kv_delim){
    item_delim == null && (item_delim = '&');
    kv_delim == null && (kv_delim = '=');
    return "?" + this.toKV.apply(this, arguments);
  }
});
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}