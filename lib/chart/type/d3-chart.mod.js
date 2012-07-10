require.define('/node_modules/kraken/chart/type/d3-chart.js.js', function(require, module, exports, __dirname, __filename, undefined){

var d3, ColorBrewer, op, ChartType, D3ChartElement, root, D3ChartType, _ref, _;
d3 = require('d3');
ColorBrewer = require('colorbrewer');
_ref = require('kraken/util'), _ = _ref._, op = _ref.op;
ChartType = require('kraken/chart/chart-type').ChartType;
D3ChartElement = require('kraken/chart/type/d3/d3-chart-element').D3ChartElement;
root = function(){
  return this;
}();
exports.D3ChartType = D3ChartType = (function(superclass){
  D3ChartType.displayName = 'D3ChartType';
  var prototype = __extend(D3ChartType, superclass).prototype, constructor = D3ChartType;
  prototype.__bind__ = ['determineSize'];
  prototype.SPEC_URL = '/schema/d3/d3-chart.json';
  prototype.typeName = 'd3-chart';
  ChartType.register(D3ChartType);
  /**
   * Hash of role-names to the selector which, when applied to the view,
   * returns the correct element.
   * @type Object
   */
  prototype.roles = {
    viewport: '.viewport',
    legend: '.graph-legend'
  };
  function D3ChartType(){
    superclass.apply(this, arguments);
  }
  prototype.getData = function(){
    return this.model.dataset.getColumns();
  };
  prototype.transform = function(){
    var dataset, options;
    dataset = this.model.dataset;
    options = __import(this.model.getOptions(), this.determineSize());
    __import(options, {
      colors: dataset.getColors(),
      labels: dataset.getLabels()
    });
    return options;
  };
  prototype.renderChart = function(data, viewport, options, lastChart){
    var margin, width, height, xScale, yScale, dates, cols, allValues, svg, enterFrame, frame, xAxis, metrics;
    margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    };
    width = 760 - margin.left - margin.right;
    height = 320 - margin.top - margin.bottom;
    xScale = d3.time.scale();
    yScale = d3.scale.linear();
    dates = data[0];
    cols = data.slice(1);
    allValues = d3.merge(cols);
    xScale.domain(d3.extent(dates)).range([0, width]);
    yScale.domain(d3.extent(allValues)).range([height, 0]);
    svg = d3.select(viewport[0]).selectAll("svg").remove();
    svg = d3.select(viewport[0]).selectAll("svg").data([cols]);
    enterFrame = svg.enter().append("svg").append("g").attr("class", "frame");
    svg.attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);
    frame = svg.select("g.frame").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("width", width).attr("height", height);
    enterFrame.append("g").attr("class", "x axis time");
    xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickSize(6, 0);
    frame.select(".x.axis.time").attr("transform", "translate(0," + yScale.range()[0] + ")").call(xAxis);
    metrics = frame.selectAll("metric").data(this.model.dataset.metrics.models);
    metrics.enter().append("g").attr("class", function(d){
      return "g metric line " + d.get('label');
    }).each(function(d){
      var chartElement, chEl;
      chartElement = d.get("chartElement");
      chartElement == null && (chartElement = 'd3-line');
      chEl = D3ChartElement.create(chartElement);
      return chEl.renderChartElement(d, frame, xScale, yScale);
    });
    metrics.exit().remove();
    return svg;
  };
  return D3ChartType;
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
