var op, Parsers, ParserMixin, ParsingModel, ParsingView, BaseModel, BaseList, TagSet, KNOWN_TAGS, ChartOption, ChartOptionList, _ref, _, __slice = [].slice;
_ref = require('kraken/util'), _ = _ref._, op = _ref.op;
_ref = require('kraken/util/parser'), Parsers = _ref.Parsers, ParserMixin = _ref.ParserMixin, ParsingModel = _ref.ParsingModel, ParsingView = _ref.ParsingView;
_ref = require('kraken/base'), BaseModel = _ref.BaseModel, BaseList = _ref.BaseList;
/**
 * @class A set of tags.
 */
exports.TagSet = TagSet = (function(superclass){
  TagSet.displayName = 'TagSet';
  var prototype = __extend(TagSet, superclass).prototype, constructor = TagSet;
  prototype.tags = {};
  function TagSet(values){
    values == null && (values = []);
    this.tags = {};
    if (values != null && values.length) {
      this.add(values);
    }
  }
  prototype.has = function(tag){
    return this.tags[tag] != null;
  };
  prototype.get = function(tag){
    if (!tag) {
      return -1;
    }
    if (this.tags[tag] == null) {
      this.tags[tag] = this.length;
      this.push(tag);
    }
    return this.tags[tag];
  };
  prototype.update = function(tags){
    var is_single, tag, indices, _res, _i, _len;
    is_single = typeof tags === 'string';
    if (is_single) {
      tags = [tags];
    }
    _res = [];
    for (_i = 0, _len = tags.length; _i < _len; ++_i) {
      tag = tags[_i];
      _res.push(this.get(tag));
    }
    indices = _res;
    if (is_single) {
      return indices[0];
    } else {
      return indices;
    }
  };
  prototype.toString = function(){
    return "TagSet(length=" + this.length + ", values=[\"" + this.join('", "') + "\"])";
  };
  return TagSet;
}(Array));
/**
 * @namespace All known tags, for mapping consistently onto colors.
 */
KNOWN_TAGS = exports.KNOWN_TAGS = new TagSet();
/**
 * @class Field with chart-option-specific handling for validation, parsing, tags, etc.
 */
ChartOption = exports.ChartOption = ParsingModel.extend({
  IGNORED_TAGS: ['callback', 'deprecated', 'debugging'],
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
    function ChartOption(){
      return ParsingModel.apply(this, arguments);
    }
    return ChartOption;
  }()),
  initialize: function(){
    var type, tags;
    _.bindAll.apply(_, [this].concat(__slice.call(_.functions(this).filter(function(it){
      return _.startsWith(it, 'parse');
    }))));
    ChartOption.__super__.initialize.apply(this, arguments);
    this.set('id', this.id = _.camelize(this.get('name')));
    if (!this.has('value')) {
      this.set('value', this.get('default'), {
        silent: true
      });
    }
    KNOWN_TAGS.update(this.getCategory());
    type = this.get('type').toLowerCase() || '';
    tags = this.get('tags') || [];
    if (_.str.include(type, 'function') || _.intersection(tags, this.IGNORED_TAGS).length) {
      return this.set('ignore', true);
    }
  },
  addTag: function(tag){
    var tags;
    if (!tag) {
      return this;
    }
    tags = this.get('tags') || [];
    tags.push(tag);
    this.set('tags', tags);
    return this;
  },
  removeTag: function(tag){
    var tags;
    if (!tag) {
      return this;
    }
    tags = this.get('tags') || [];
    _.remove(tags, tag);
    this.set('tags', tags);
    return this;
  },
  onTagUpdate: function(){
    KNOWN_TAGS.update(this.get('tags'));
    return this;
  },
  getTagIndex: function(tag){
    return KNOWN_TAGS.get(tag);
  },
  getCategory: function(){
    var tags;
    return tags = (this.get('tags') || [])[0];
  },
  getCategoryIndex: function(){
    return this.getTagIndex(this.getCategory());
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
  /* * * Serialization * * */
  /**
   * Override to default `type` to the model attribute of the same name.
   * @returns {Function} Parser for the given type.
   */,
  getParser: function(type){
    type || (type = this.get('type') || 'String');
    return ChartOption.__super__.getParser.call(this, type);
  },
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
/**
 * @class List of ChartOption fields.
 */
ChartOptionList = exports.ChartOptionList = BaseList.extend({
  model: ChartOption,
  constructor: (function(){
    function ChartOptionList(){
      return BaseList.apply(this, arguments);
    }
    return ChartOptionList;
  }())
  /**
   * Collects a map of fields to their values, excluding those set to `null` or their default.
   * 
   * @param {Object} [opts={}] Options:
   * @param {Boolean} [opts.keepDefaults=true] If false, exclude pairs that
   *  haven't changed from their default value.
   * @param {Boolean} [opts.serialize=false] If true, replace each value
   *  with its String version by calling `value.serializeValue()`.
   * @returns {Object} Map of fields to their values.
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
  }
  /**
   * Override to omit defaults from URL.
   */,
  toKVPairs: function(){
    return _.collapseObject(this.values({
      keepDefaults: false,
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
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}