var d3, op, ChartType, root, BarChartType, _ref, _;
d3 = require('d3');
_ref = require('../../../util'), _ = _ref._, op = _ref.op;
ChartType = require('../../chart-type').ChartType;
root = function(){
  return this;
}();
exports.BarChartType = BarChartType = (function(superclass){
  BarChartType.displayName = 'BarChartType';
  var prototype = __extend(BarChartType, superclass).prototype, constructor = BarChartType;
  prototype.__bind__ = ['determineSize'];
  prototype.SPEC_URL = '/schema/d3/d3-bar.json';
  prototype.typeName = 'd3-bar';
  ChartType.register(BarChartType);
  /**
   * Hash of role-names to the selector which, when applied to the view,
   * returns the correct element.
   * @type Object
   */
  prototype.roles = {
    viewport: '.viewport',
    legend: '.graph-legend'
  };
  function BarChartType(){
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
  prototype.renderChartType = function(metric, svgEl, xScale, yScale){
    var X, Y, metricBars, data, barWidth, barHeight, chT;
    X = function(d, i){
      return xScale(d[0]);
    };
    Y = function(d, i){
      return yScale(d[1]);
    };
    metricBars = root.metricBars = svgEl.append("g").attr("class", "metric bars " + metric.get('label'));
    data = d3.zip(metric.getDateColumn(), metric.getData());
    barWidth = svgEl.attr('width') / data.length;
    barHeight = function(d){
      return svgEl.attr('height') - Y(d);
    };
    metricBars.selectAll("bar").data(data).enter().append("rect").attr("class", function(d, i){
      return "metric bar " + i;
    }).attr("x", X).attr("y", Y).attr("height", barHeight).attr("width", function(){
      return barWidth;
    }).attr("fill", metric.get('color')).attr("stroke", "white").style("opacity", "0.4").style("z-index", -10);
    chT = this;
    metricBars.selectAll(".metric.bar").on("mouseover", function(d, i){
      return svgEl.append("text").attr("class", "mf").attr("dx", 50).attr("dy", 100).style("font-size", "0px").transition().duration(800).text("Uh boy, the target would be:  " + chT.numberFormatter(d[1]).toString()).style("font-size", "25px");
    }).on("mouseout", function(d, i){
      return svgEl.selectAll(".mf").transition().duration(300).text("BUMMER!!!").style("font-size", "0px").remove();
    });
    return svgEl;
  };
  prototype.renderChart = function(data, viewport, options, lastChart){
    var margin, width, height, xScale, yScale, dates, cols, allValues, svg, enterFrame, frame, xAxis, X, Y, barWidth, barHeight, bars, lens, gLens, gInner, mf;
    margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    };
    width = 760;
    height = 320;
    xScale = d3.time.scale();
    yScale = d3.scale.linear();
    dates = data[0];
    cols = data.slice(1);
    allValues = d3.merge(cols);
    xScale.domain(d3.extent(dates)).range([0, width - margin.left - margin.right]);
    yScale.domain(d3.extent(allValues)).range([height - margin.top - margin.bottom, 0]);
    svg = d3.select(viewport[0]).selectAll("svg").data([cols]);
    enterFrame = svg.enter().append("svg").append("g").attr("class", "frame");
    enterFrame.append("g").attr("class", "x axis time");
    svg.attr("width", width).attr("height", height);
    frame = svg.select("g.frame").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickSize(6, 0);
    frame.select(".x.axis.time").attr("transform", "translate(0," + yScale.range()[0] + ")").call(xAxis);
    X = function(d, i){
      return xScale(d[0]);
    };
    Y = function(d, i){
      return yScale(d[1]);
    };
    barWidth = svg.attr('width') / dates.length;
    barHeight = function(d){
      return svg.attr('height') - Y(d);
    };
    bars = frame.selectAll("g.bars").data(cols.map(function(it){
      return d3.zip(dates, it);
    }));
    bars.enter().append("g").attr("class", function(col, i){
      return "metric bars " + i;
    });
    bars.exit().remove();
    bars.selectAll(".bar").data(op.first).enter().append("rect").attr("class", "bar").attr("x", X).attr("y", Y).attr("height", barHeight).attr("width", function(){
      return barWidth;
    }).attr("fill", "red").attr("stroke", "white");
    lens = root.lens = frame.selectAll("g.lens").data([[]]);
    gLens = lens.enter().append("g").attr("class", "lens").style("z-index", 1e9);
    gInner = gLens.append("g").attr("transform", "translate(1.5em,0)");
    gInner.append("circle").attr("r", "1.5em").style("fill", "rgba(255, 255, 255, 0.4)").style("stroke", "white").style("stroke-width", "3px");
    gInner.append("text").attr("y", "0.5em").attr("text-anchor", "middle").style("fill", "white").style("font", "12px Helvetica").style("font-weight", "bold");
    mf = frame.selectAll("g.mf").data(["mf"]).enter().append("g").attr("class", "mf").append("text").attr("class", "yoyo").attr("dx", 50).attr("dy", 100);
    bars.selectAll(".bar").on("mouseover", function(d, i){
      var el;
      el = root.el = el;
      return mf.transition().duration(300).ease("exp").text("Uh boy, the target would be:" + d[1]).style("font-size", "25px");
    }).on("mouseout", function(d, i){
      return mf.transition().duration(1000).text("BUMMER!!!").style("font-size", "0px");
    });
    return svg;
  };
  return BarChartType;
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