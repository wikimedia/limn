require.define('/node_modules/limn/chart/chart-type.js', function(require, module, exports, __dirname, __filename, undefined){

var moment, Backbone, op, ReadyEmitter, Parsers, ParserMixin, KNOWN_CHART_TYPES, ChartType, _ref, _, __slice = [].slice;
moment = require('moment');
Backbone = require('backbone');
_ref = require('limn/util'), _ = _ref._, op = _ref.op;
ReadyEmitter = require('limn/util/event').ReadyEmitter;
_ref = require('limn/util/parser'), Parsers = _ref.Parsers, ParserMixin = _ref.ParserMixin;
/**
 * Map of known libraries by name.
 * @type Object
 */
KNOWN_CHART_TYPES = exports.KNOWN_CHART_TYPES = {};
/**
 * @class Abstraction of a chart-type or charting library, encapsulating its
 *  logic and options. In addition, a `ChartType` also mediates the
 *  transformation of the domain-specific data types (the model and its view)
 *  with its specific needs.
 *  
 *  `ChartType`s mix in `ParserMixin`: when implementing a `ChartType`, you can
 *  add or supplement parsers merely by subclassing and overriding the
 *  corresponding `parseXXX` method (such as `parseArray` or `parseDate`).
 * 
 * @extends EventEmitter
 * @borrows ParserMixin
 */
exports.ChartType = ChartType = (function(superclass){
  /**
   * Register a new chart type.
   */
  ChartType.displayName = 'ChartType';
  var prototype = __extend(ChartType, superclass).prototype, constructor = ChartType;
  ChartType.register = function(Subclass){
    return KNOWN_CHART_TYPES[Subclass.prototype.typeName] = Subclass;
  };
  /**
   * Look up a `ChartType` by `typeName`.
   */
  ChartType.lookup = function(name){
    if (name instanceof Backbone.Model) {
      name = name.get('chartType');
    }
    return KNOWN_CHART_TYPES[name];
  };
  /**
   * Look up a chart type by name, returning a new instance
   * with the given model (and, optionally, view).
   * @returns {ChartType}
   */
  ChartType.create = function(model, view){
    var Type;
    if (!(Type = this.lookup(model))) {
      return null;
    }
    return new Type(model, view);
  };
  /*
   * These are "class properties": each is set on the prototype at the class-level,
   * and the reference is therefore shared by all instances. It is expected you
   * will not modify this on the instance-level.
   */
  /**
   * URL for the Chart Spec JSON. Loaded once, the first time an instance of
   * that class is created.
   * @type String
   * @readonly
   */
  prototype.SPEC_URL = null;
  /**
   * Chart-type name.
   * @type String
   * @readonly
   */
  prototype.typeName = null;
  /**
   * Map of option name to ChartOption objects.
   * @type { name:ChartOption, ... }
   * @readonly
   */
  prototype.options = null;
  /**
   * Ordered ChartOption objects.
   * 
   * This is a "class-property": it is set on the prototype at the class-level,
   * and the reference is shared by all instances. It is expected you will not
   * modify that instance.
   * 
   * @type ChartOption[]
   * @readonly
   */
  prototype.options_ordered = null;
  /**
   * Hash of role-names to the selector which, when applied to the view,
   * returns the correct element.
   * @type Object
   */
  prototype.roles = {
    viewport: '.viewport'
  };
  /**
   * Whether the ChartType has loaded all its data and is ready.
   * @type Boolean
   */
  prototype.ready = false;
  /**
   * Model to be rendered as a chart.
   * @type Backbone.Model
   */
  prototype.model = null;
  /**
   * View to render the chart into.
   * @type Backbone.View
   */
  prototype.view = null;
  /**
   * Last chart rendered by this ChartType.
   * @private
   */
  prototype.chart = null;
  /**
   * @constructor
   */;
  function ChartType(model, view){
    this.model = model;
    this.view = view;
    this.roles || (this.roles = {});
    _.bindAll.apply(_, [this].concat(__slice.call(this.__bind__)));
    if (!this.ready) {
      this.loadSpec();
    }
  }
  prototype.withModel = function(model){
    this.model = model;
    return this;
  };
  prototype.withView = function(view){
    this.view = view;
    return this;
  };
  /**
   * Load the corresponding chart specification, which includes
   * info about valid options, along with their types and defaults.
   */
  prototype.loadSpec = function(){
    var proto, _this = this;
    if (this.ready) {
      return this;
    }
    proto = this.constructor.prototype;
    jQuery.ajax({
      url: this.SPEC_URL,
      dataType: 'json',
      success: function(spec){
        proto.spec = spec;
        proto.options_ordered = spec;
        proto.options = _.synthesize(spec, function(it){
          return [it.name, it];
        });
        proto.ready = true;
        return _this.triggerReady();
      },
      error: function(it){
        return console.error("Error loading " + _this.typeName + " spec! " + it);
      }
    });
    return this;
  };
  /**
   * @returns {ChartOption} Get an option's spec by name.
   */
  prototype.getOption = function(name, def){
    return this.options[name] || def;
  };
  /**
   * @returns {Object} An object, mapping from option.name to the
   *  result of the supplied function.
   */
  prototype.map = function(fn, context){
    var _this = this;
    context == null && (context = this);
    return _.synthesize(this.options, function(it){
      return [it.name, fn.call(context, it, it.name, _this)];
    });
  };
  /**
   * @param {String} attr Attribute to look up on each options object.
   * @returns {Object} Map from name to the value found at the given attr.
   */
  prototype.pluck = function(attr){
    return this.map(function(it){
      return it[attr];
    });
  };
  /**
   * @returns {Boolean} Whether the supplied value is the same as
   *  the default value for the given key.
   */
  prototype.isDefault = function(name, value){
    return _.isEqual(this.getOption(name)['default'], value);
  };
  /**
   * When implementing a ChartType, you can add or override parsers
   * merely by subclassing.
   * @borrows ParserMixin
   */;
  ParserMixin.mix(ChartType);
  /**
   * @returns {Function} Parser for the given option name.
   */
  prototype.getParserFor = function(name){
    return this.getParser(this.getOption(name).type);
  };
  /**
   * Parses a single serialized option value into its proper type.
   * 
   * @param {String} name Option-name of the value being parsed.
   * @param {String} value Value to parse.
   * @returns {*} Parsed value.
   */
  prototype.parseOption = function(name, value){
    return this.getParserFor(name)(value);
  };
  /**
   * Parses options using `parseOption(name, value)`.
   * 
   * @param {Object} options Options to parse.
   * @returns {Object} Parsed options.
   */
  prototype.parseOptions = function(options){
    var out, k, v;
    out = {};
    for (k in options) {
      v = options[k];
      out[k] = this.parseOption(k, v);
    }
    return out;
  };
  /**
   * Serializes option-value to a String.
   * 
   * @param {*} v Value to serialize.
   * @param {String} k Option-name of the given value.
   * @returns {String} The serialized value
   */
  prototype.serialize = function(v, k){
    if (_.isBoolean(v)) {
      v = Number(v);
    } else if (_.isObject(v)) {
      v = JSON.stringify(v);
    }
    return String(v);
  };
  /**
   * Formats a date for display on an axis: `MM/YYYY`
   * @param {Date} d Date to format.
   * @returns {String}
   */
  prototype.axisDateFormatter = function(d){
    return moment(d).format('MM/YYYY');
  };
  /**
   * Formats a date for display in the legend: `DD MMM YYYY`
   * @param {Date} d Date to format.
   * @returns {String}
   */
  prototype.dateFormatter = function(d){
    return moment(d).format('DD MMM YYYY');
  };
  /**
   * Formats a number for display, first dividing by the greatest suffix
   *  of {B = Billions, M = Millions, K = Thousands} that results in a
   *  absolute value greater than 0, and then rounding to `digits` using
   *  `result.toFixed(digits)`.
   * 
   * @param {Number} n Number to format.
   * @param {Number} [digits=2] Number of digits after the decimal to always display.
   * @param {Boolean} [abbrev=true] Expand number suffixes if false.
   * @returns {Object} Formatted number parts.
   */
  prototype.numberFormatter = function(n, digits, abbrev){
    var suffixes, suffix, d, s, parts, whole, fraction, _i, _len, _ref;
    digits == null && (digits = 2);
    abbrev == null && (abbrev = true);
    suffixes = abbrev
      ? [['B', 1000000000], ['M', 1000000], ['K', 1000], ['', NaN]]
      : [['Billion', 1000000000], ['Million', 1000000], ['', NaN]];
    for (_i = 0, _len = suffixes.length; _i < _len; ++_i) {
      _ref = suffixes[_i], suffix = _ref[0], d = _ref[1];
      if (isNaN(d)) {
        break;
      }
      if (n >= d) {
        n = n / d;
        break;
      }
    }
    s = n.toFixed(digits);
    parts = s.split('.');
    whole = _.rchop(parts[0], 3).join(',');
    fraction = '.' + parts.slice(1).join('.');
    return {
      n: n,
      digits: digits,
      whole: whole,
      fraction: fraction,
      suffix: suffix,
      toString: function(){
        return this.whole + "" + this.fraction + (abbrev ? '' : ' ') + this.suffix;
      }
    };
  };
  /**
   * Finds the element in the view which plays the given role in the chart.
   * Canonically, all charts have a "viewport" element. Other roles might
   * include a "legend" element, or several "axis" elements.
   * 
   * Default implementation looks up a selector in the `roles` hash, and if
   * found, queries the view for matching children.
   * 
   * @param {String} role Name of the role to look up.
   * @returns {jQuery|null} $-wrapped DOM element.
   */
  prototype.getElementsForRole = function(role){
    var that;
    if (!this.view) {
      return null;
    }
    if (that = this.roles[role]) {
      return this.view.$(that);
    } else {
      return null;
    }
  };
  /**
   * Transform/extract the data for this chart from the model. Default
   * implementation calls `model.getData()`.
   * 
   * @returns {*} Data object for the chart.
   */
  prototype.getData = function(){
    return this.model.getData();
  };
  /**
   * Map from option-name to default value. Note that this reference will be
   * modified by `.render()`.
   * 
   * @returns {Object} Default options.
   */
  prototype.getDefaultOptions = function(){
    return this.pluck('default');
  };
  /**
   * Resizes the HTML viewport. Override to disable, etc.
   */
  prototype.resizeViewport = function(){
    var size;
    size = this.determineSize();
    this.getElementsForRole('viewport').css(size);
    return size;
  };
  /**
   * Determines chart viewport size.
   * @return { width, height }
   */
  prototype.determineSize = function(){
    var width, modelW, height, modelH, viewport, Width;
    modelW = width = this.model.get('width');
    modelH = height = this.model.get('height');
    if (!(this.view.ready && width && height)) {
      return {
        width: width,
        height: height
      };
    }
    viewport = this.getElementsForRole('viewport');
    if (width === 'auto') {
      Width = viewport.innerWidth() || 300;
    }
    width == null && (width = modelW);
    if (height === 'auto') {
      height = viewport.innerHeight() || 320;
    }
    height == null && (height = modelH);
    return {
      width: width,
      height: height
    };
  };
  /**
   * Transforms domain data and applies it to the chart library to
   * render or update the corresponding chart.
   * 
   * @returns {Chart}
   */
  prototype.render = function(){
    var data, options, viewport;
    data = this.getData();
    options = __import(this.getDefaultOptions(), this.transform(this.model, this.view));
    viewport = this.getElementsForRole('viewport');
    if (!((data != null && data.length) && (viewport != null && viewport.length))) {
      return this.lastChart;
    }
    return this.lastChart = this.renderChart(data, viewport, options, this.chart);
  };
  /**
   * Transforms the domain objects into a hash of derived values using
   * chart-type-specific keys.
   * 
   * Default implementation returns `model.getOptions()`.
   * 
   * @returns {Object} The derived data.
   */
  prototype.transform = function(model, view){
    return this.model.getOptions();
  };
  /**
   * Called to render the chart.
   * 
   * @abstract
   * @returns {Chart}
   */
  prototype.renderChart = function(data, viewport, options, lastChart){
    throw Error('unimplemented');
  };
  return ChartType;
}(ReadyEmitter));
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

});
