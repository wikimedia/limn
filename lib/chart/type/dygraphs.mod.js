require.define('/node_modules/limn/chart/type/dygraphs.js', function(require, module, exports, __dirname, __filename, undefined){

var ChartType, DygraphsChartType, _;
_ = require('../../../util/underscore');
ChartType = require('../../chart-type').ChartType;
exports.DygraphsChartType = DygraphsChartType = (function(superclass){
  DygraphsChartType.displayName = 'DygraphsChartType';
  var prototype = __extend(DygraphsChartType, superclass).prototype, constructor = DygraphsChartType;
  prototype.__bind__ = ['dygNumberFormatter', 'dygNumberFormatterHTML'];
  prototype.SPEC_URL = '/schema/dygraph.json';
  prototype.typeName = 'dygraphs';
  ChartType.register(DygraphsChartType);
  /**
   * Hash of role-names to the selector which, when applied to the view,
   * returns the correct element.
   * @type Object
   */
  prototype.roles = {
    viewport: '.viewport',
    legend: '.graph-legend'
  };
  function DygraphsChartType(){
    superclass.apply(this, arguments);
  }
  prototype.makeAxisFormatter = function(fmttr){
    return function(n, granularity, opts, g){
      return fmttr(n, opts, g);
    };
  };
  prototype.dygAxisDateFormatter = function(n, granularity, opts, g){
    return moment(n).format('MM/YYYY');
  };
  prototype.dygDateFormatter = function(n, opts, g){
    return moment(n).format('DD MMM YYYY');
  };
  prototype.dygNumberFormatter = function(n, opts, g){
    var that, digits, whole, fraction, suffix, _ref;
    digits = (that = typeof opts('digitsAfterDecimal') === 'number') ? that : 2;
    _ref = this.numberFormatter(n, digits), whole = _ref.whole, fraction = _ref.fraction, suffix = _ref.suffix;
    return whole + "" + fraction + suffix;
  };
  prototype.dygNumberFormatterHTML = function(n, opts, g){
    var that, digits, whole, fraction, suffix, _ref;
    digits = (that = typeof opts('digitsAfterDecimal') === 'number') ? that : 2;
    _ref = this.numberFormatter(n, digits), whole = _ref.whole, fraction = _ref.fraction, suffix = _ref.suffix;
    return "<span class='value'><span class='whole'>" + whole + "</span><span class='fraction'>" + fraction + "</span><span class='suffix'>" + suffix + "</span></span>";
  };
  /**
   * Determines chart viewport size.
   * @return { width, height }
   */
  prototype.determineSize = function(){
    var width, modelW, height, modelH, viewport, legend, vpWidth, legendW;
    modelW = width = this.model.get('width');
    modelH = height = this.model.get('height');
    if (!(this.view.ready && width && height)) {
      return {
        width: width,
        height: height
      };
    }
    viewport = this.getElementsForRole('viewport');
    legend = this.getElementsForRole('legend');
    if (width === 'auto') {
      delete viewport.prop('style').width;
      vpWidth = viewport.innerWidth() || 300;
      legendW = legend.outerWidth() || 228;
      width = vpWidth - legendW - 10 - (vpWidth - legend.position().left - legendW);
    }
    width == null && (width = modelW);
    if (height === 'auto') {
      delete viewport.prop('style').height;
      height = viewport.innerHeight() || 320;
    }
    height == null && (height = modelH);
    return {
      width: width,
      height: height
    };
  };
  /**
   * Transforms the domain objects into a hash of derived values using
   *  chart-type-specific keys.
   * @returns {Object} The derived chart options.
   */
  prototype.transform = function(){
    var dataset, options;
    dataset = this.model.dataset;
    options = __import(this.view.chartOptions(), this.determineSize());
    return __import(options, {
      colors: dataset.getColors(),
      labels: dataset.getLabels(),
      labelsDiv: this.getElementsForRole('legend')[0],
      valueFormatter: this.dygNumberFormatterHTML,
      axes: {
        x: {
          axisLabelFormatter: this.dygAxisDateFormatter,
          valueFormatter: this.dygDateFormatter
        },
        y: {
          axisLabelFormatter: this.makeAxisFormatter(this.dygNumberFormatter),
          valueFormatter: this.dygNumberFormatterHTML
        }
      }
    });
  };
  /**
   * @returns {Dygraph} The Dygraph chart object.
   */
  prototype.renderChart = function(data, viewport, options, lastChart){
    this.resizeViewport();
    if (lastChart != null) {
      lastChart.destroy();
    }
    return new Dygraph(viewport[0], data, options);
  };
  return DygraphsChartType;
}(ChartType));
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
