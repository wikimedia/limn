require.define('/node_modules/limn/chart/type/d3/d3-chart-element.js', function(require, module, exports, __dirname, __filename, undefined){

var d3, ColorBrewer, op, ReadyEmitter, root, KNOWN_CHART_ELEMENTS, D3ChartElement, _ref, _, __slice = [].slice;
d3 = require('d3');
ColorBrewer = require('colorbrewer');
_ref = require('limn/util'), _ = _ref._, op = _ref.op;
ReadyEmitter = require('limn/util/event').ReadyEmitter;
root = function(){
  return this;
}();
/**
 * Map of known libraries by name.
 * @type Object
 */
KNOWN_CHART_ELEMENTS = exports.KNOWN_CHART_ELEMENTS = {};
exports.D3ChartElement = D3ChartElement = (function(superclass){
  D3ChartElement.displayName = 'D3ChartElement';
  var prototype = __extend(D3ChartElement, superclass).prototype, constructor = D3ChartElement;
  prototype.__bind__ = [];
  prototype.SPEC_URL = '/schema/d3/d3-chart.json';
  /**
   * Register a new d3 element
   */;
  D3ChartElement.register = function(Subclass){
    return KNOWN_CHART_ELEMENTS[Subclass.prototype.chartElement] = Subclass;
  };
  /**
   * Look up a `charttype` by `typeName`.
   */
  D3ChartElement.lookup = function(name){
    if (name instanceof Backbone.Model) {
      name = name.get('chartElement');
    }
    return KNOWN_CHART_ELEMENTS[name];
  };
  /**
   * Look up a chart type by name, returning a new instance
   * with the given model (and, optionally, view).
   * @returns {D3ChartElement}
   */
  D3ChartElement.create = function(name){
    var Type;
    if (!(Type = this.lookup(name))) {
      return null;
    }
    return new Type;
  };
  function D3ChartElement(){
    _.bindAll.apply(_, [this].concat(__slice.call(this.__bind__)));
    if (!this.ready) {
      this.loadSpec();
    }
    superclass.apply(this, arguments);
  }
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
  prototype.renderChartElement = function(metric, svgEl, xScale, yScale){
    return svgEl;
  };
  return D3ChartElement;
}(ReadyEmitter));
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});
