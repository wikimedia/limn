/**
 * @license
 * Copyright 2011 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview Based on PlotKitLayout, but modified to meet the needs of
 * dygraphs.
 */

/*jshint globalstrict: true */
/*global Dygraph:false */
"use strict";

/**
 * Creates a new DygraphLayout object.
 *
 * This class contains all the data to be charted.
 * It uses data coordinates, but also records the chart range (in data
 * coordinates) and hence is able to calculate percentage positions ('In this
 * view, Point A lies 25% down the x-axis.')
 *
 * Two things that it does not do are:
 * 1. Record pixel coordinates for anything.
 * 2. (oddly) determine anything about the layout of chart elements.
 *
 * The naming is a vestige of Dygraph's original PlotKit roots.
 *
 * @constructor
 */
var DygraphLayout = function(dygraph) {
  this.dygraph_ = dygraph;
  this.datasets = [];
  this.setNames = [];
  this.annotations = [];
  this.yAxes_ = null;

  // TODO(danvk): it's odd that xTicks_ and yTicks_ are inputs, but xticks and
  // yticks are outputs. Clean this up.
  this.xTicks_ = null;
  this.yTicks_ = null;
};

DygraphLayout.prototype.attr_ = function(name) {
  return this.dygraph_.attr_(name);
};

DygraphLayout.prototype.addDataset = function(setname, set_xy) {
  this.datasets.push(set_xy);
  this.setNames.push(setname);
};

DygraphLayout.prototype.getPlotArea = function() {
  return this.computePlotArea_();
};

// Compute the box which the chart should be drawn in. This is the canvas's
// box, less space needed for axis and chart labels.
DygraphLayout.prototype.computePlotArea_ = function() {
  var area = {
    // TODO(danvk): per-axis setting.
    x: 0,
    y: 0
  };
  if (this.attr_('drawYAxis')) {
   area.x = this.attr_('yAxisLabelWidth') + 2 * this.attr_('axisTickSize');
  }

  area.w = this.dygraph_.width_ - area.x - this.attr_('rightGap');
  area.h = this.dygraph_.height_;
  if (this.attr_('drawXAxis')) {
    if (this.attr_('xAxisHeight')) {
      area.h -= this.attr_('xAxisHeight');
    } else {
      area.h -= this.attr_('axisLabelFontSize') + 2 * this.attr_('axisTickSize');
    }
  }

  // Shrink the drawing area to accomodate additional y-axes.
  if (this.dygraph_.numAxes() == 2) {
    // TODO(danvk): per-axis setting.
    area.w -= (this.attr_('yAxisLabelWidth') + 2 * this.attr_('axisTickSize'));
  } else if (this.dygraph_.numAxes() > 2) {
    this.dygraph_.error("Only two y-axes are supported at this time. (Trying " +
                        "to use " + this.dygraph_.numAxes() + ")");
  }

  // Add space for chart labels: title, xlabel and ylabel.
  if (this.attr_('title')) {
    area.h -= this.attr_('titleHeight');
    area.y += this.attr_('titleHeight');
  }
  if (this.attr_('xlabel')) {
    area.h -= this.attr_('xLabelHeight');
  }
  if (this.attr_('ylabel')) {
    // It would make sense to shift the chart here to make room for the y-axis
    // label, but the default yAxisLabelWidth is large enough that this results
    // in overly-padded charts. The y-axis label should fit fine. If it
    // doesn't, the yAxisLabelWidth option can be increased.
  }

  if (this.attr_('y2label')) {
    // same logic applies here as for ylabel.
    // TODO(danvk): make yAxisLabelWidth a per-axis property
  }

  // Add space for range selector, if needed.
  if (this.attr_('showRangeSelector')) {
    area.h -= this.attr_('rangeSelectorHeight') + 4;
  }

  return area;
};

DygraphLayout.prototype.setAnnotations = function(ann) {
  // The Dygraph object's annotations aren't parsed. We parse them here and
  // save a copy. If there is no parser, then the user must be using raw format.
  this.annotations = [];
  var parse = this.attr_('xValueParser') || function(x) { return x; };
  for (var i = 0; i < ann.length; i++) {
    var a = {};
    if (!ann[i].xval && !ann[i].x) {
      this.dygraph_.error("Annotations must have an 'x' property");
      return;
    }
    if (ann[i].icon &&
        !(ann[i].hasOwnProperty('width') &&
          ann[i].hasOwnProperty('height'))) {
      this.dygraph_.error("Must set width and height when setting " +
                          "annotation.icon property");
      return;
    }
    Dygraph.update(a, ann[i]);
    if (!a.xval) a.xval = parse(a.x);
    this.annotations.push(a);
  }
};

DygraphLayout.prototype.setXTicks = function(xTicks) {
  this.xTicks_ = xTicks;
};

// TODO(danvk): add this to the Dygraph object's API or move it into Layout.
DygraphLayout.prototype.setYAxes = function (yAxes) {
  this.yAxes_ = yAxes;
};

DygraphLayout.prototype.setDateWindow = function(dateWindow) {
  this.dateWindow_ = dateWindow;
};

DygraphLayout.prototype.evaluate = function() {
  this._evaluateLimits();
  this._evaluateLineCharts();
  this._evaluateLineTicks();
  this._evaluateAnnotations();
};

DygraphLayout.prototype._evaluateLimits = function() {
  this.minxval = this.maxxval = null;
  if (this.dateWindow_) {
    this.minxval = this.dateWindow_[0];
    this.maxxval = this.dateWindow_[1];
  } else {
    for (var setIdx = 0; setIdx < this.datasets.length; ++setIdx) {
      var series = this.datasets[setIdx];
      if (series.length > 1) {
        var x1 = series[0][0];
        if (!this.minxval || x1 < this.minxval) this.minxval = x1;

        var x2 = series[series.length - 1][0];
        if (!this.maxxval || x2 > this.maxxval) this.maxxval = x2;
      }
    }
  }
  this.xrange = this.maxxval - this.minxval;
  this.xscale = (this.xrange !== 0 ? 1/this.xrange : 1.0);

  for (var i = 0; i < this.yAxes_.length; i++) {
    var axis = this.yAxes_[i];
    axis.minyval = axis.computedValueRange[0];
    axis.maxyval = axis.computedValueRange[1];
    axis.yrange = axis.maxyval - axis.minyval;
    axis.yscale = (axis.yrange !== 0 ? 1.0 / axis.yrange : 1.0);

    if (axis.g.attr_("logscale")) {
      axis.ylogrange = Dygraph.log10(axis.maxyval) - Dygraph.log10(axis.minyval);
      axis.ylogscale = (axis.ylogrange !== 0 ? 1.0 / axis.ylogrange : 1.0);
      if (!isFinite(axis.ylogrange) || isNaN(axis.ylogrange)) {
        axis.g.error('axis ' + i + ' of graph at ' + axis.g +
            ' can\'t be displayed in log scale for range [' +
            axis.minyval + ' - ' + axis.maxyval + ']');
      }
    }
  }
};

DygraphLayout._calcYNormal = function(axis, value) {
  if (axis.logscale) {
    return 1.0 - ((Dygraph.log10(value) - Dygraph.log10(axis.minyval)) * axis.ylogscale);
  } else {
    return 1.0 - ((value - axis.minyval) * axis.yscale);
  }
};

DygraphLayout.prototype._evaluateLineCharts = function() {
  // add all the rects
  this.points = [];
  // An array to keep track of how many points will be drawn for each set.
  // This will allow for the canvas renderer to not have to check every point
  // for every data set since the points are added in order of the sets in
  // datasets.
  this.setPointsLengths = [];
  this.setPointsOffsets = [];

  var connectSeparated = this.attr_('connectSeparatedPoints');
  for (var setIdx = 0; setIdx < this.datasets.length; ++setIdx) {
    var dataset = this.datasets[setIdx];
    var setName = this.setNames[setIdx];
    var axis = this.dygraph_.axisPropertiesForSeries(setName);

    this.setPointsOffsets.push(this.points.length);
    var setPointsLength = 0;

    for (var j = 0; j < dataset.length; j++) {
      var item = dataset[j];
      var xValue = parseFloat(item[0]);
      var yValue = parseFloat(item[1]);

      // Range from 0-1 where 0 represents left and 1 represents right.
      var xNormal = (xValue - this.minxval) * this.xscale;
      // Range from 0-1 where 0 represents top and 1 represents bottom
      var yNormal = DygraphLayout._calcYNormal(axis, yValue);

      var point = {
        // TODO(danvk): here
        x: xNormal,
        y: yNormal,
        xval: xValue,
        yval: yValue,
        name: setName
      };
      if (connectSeparated && item[1] === null) {
        point.yval = null;
      }
      this.points.push(point);
      setPointsLength += 1;
    }
    this.setPointsLengths.push(setPointsLength);
  }
};

DygraphLayout.prototype._evaluateLineTicks = function() {
  var i, tick, label, pos;
  this.xticks = [];
  for (i = 0; i < this.xTicks_.length; i++) {
    tick = this.xTicks_[i];
    label = tick.label;
    pos = this.xscale * (tick.v - this.minxval);
    if ((pos >= 0.0) && (pos <= 1.0)) {
      this.xticks.push([pos, label]);
    }
  }

  this.yticks = [];
  for (i = 0; i < this.yAxes_.length; i++ ) {
    var axis = this.yAxes_[i];
    for (var j = 0; j < axis.ticks.length; j++) {
      tick = axis.ticks[j];
      label = tick.label;
      pos = this.dygraph_.toPercentYCoord(tick.v, i);
      if ((pos >= 0.0) && (pos <= 1.0)) {
        this.yticks.push([i, pos, label]);
      }
    }
  }
};


/**
 * Behaves the same way as PlotKit.Layout, but also copies the errors
 * @private
 */
DygraphLayout.prototype.evaluateWithError = function() {
  this.evaluate();
  if (!(this.attr_('errorBars') || this.attr_('customBars'))) return;

  // Copy over the error terms
  var i = 0;  // index in this.points
  for (var setIdx = 0; setIdx < this.datasets.length; ++setIdx) {
    var j = 0;
    var dataset = this.datasets[setIdx];
    var setName = this.setNames[setIdx];
    var axis = this.dygraph_.axisPropertiesForSeries(setName);
    for (j = 0; j < dataset.length; j++, i++) {
      var item = dataset[j];
      var xv = parseFloat(item[0]);
      var yv = parseFloat(item[1]);

      if (xv == this.points[i].xval &&
          yv == this.points[i].yval) {
        var errorMinus = parseFloat(item[2]);
        var errorPlus = parseFloat(item[3]);

        var yv_minus = yv - errorMinus;
        var yv_plus = yv + errorPlus;
        this.points[i].y_top = DygraphLayout._calcYNormal(axis, yv_minus);
        this.points[i].y_bottom = DygraphLayout._calcYNormal(axis, yv_plus);
      }
    }
  }
};

DygraphLayout.prototype._evaluateAnnotations = function() {
  // Add the annotations to the point to which they belong.
  // Make a map from (setName, xval) to annotation for quick lookups.
  var i;
  var annotations = {};
  for (i = 0; i < this.annotations.length; i++) {
    var a = this.annotations[i];
    annotations[a.xval + "," + a.series] = a;
  }

  this.annotated_points = [];

  // Exit the function early if there are no annotations.
  if (!this.annotations || !this.annotations.length) {
    return;
  }

  // TODO(antrob): loop through annotations not points.
  for (i = 0; i < this.points.length; i++) {
    var p = this.points[i];
    var k = p.xval + "," + p.name;
    if (k in annotations) {
      p.annotation = annotations[k];
      this.annotated_points.push(p);
    }
  }
};

/**
 * Convenience function to remove all the data sets from a graph
 */
DygraphLayout.prototype.removeAllDatasets = function() {
  delete this.datasets;
  delete this.setNames;
  delete this.setPointsLengths;
  delete this.setPointsOffsets;
  this.datasets = [];
  this.setNames = [];
  this.setPointsLengths = [];
  this.setPointsOffsets = [];
};

/**
 * Return a copy of the point at the indicated index, with its yval unstacked.
 * @param int index of point in layout_.points
 */
DygraphLayout.prototype.unstackPointAtIndex = function(idx) {
  var point = this.points[idx];

  // Clone the point since we modify it
  var unstackedPoint = {};
  for (var pt in point) {
    unstackedPoint[pt] = point[pt];
  }

  if (!this.attr_("stackedGraph")) {
    return unstackedPoint;
  }

  // The unstacked yval is equal to the current yval minus the yval of the
  // next point at the same xval.
  for (var i = idx+1; i < this.points.length; i++) {
    if (this.points[i].xval == point.xval) {
      unstackedPoint.yval -= this.points[i].yval;
      break;
    }
  }

  return unstackedPoint;
};
/**
 * @license
 * Copyright 2006 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview Based on PlotKit.CanvasRenderer, but modified to meet the
 * needs of dygraphs.
 *
 * In particular, support for:
 * - grid overlays
 * - error bars
 * - dygraphs attribute system
 */

/**
 * The DygraphCanvasRenderer class does the actual rendering of the chart onto
 * a canvas. It's based on PlotKit.CanvasRenderer.
 * @param {Object} element The canvas to attach to
 * @param {Object} elementContext The 2d context of the canvas (injected so it
 * can be mocked for testing.)
 * @param {Layout} layout The DygraphLayout object for this graph.
 * @constructor
 */

/*jshint globalstrict: true */
/*global Dygraph:false,RGBColor:false */
"use strict";


var DygraphCanvasRenderer = function(dygraph, element, elementContext, layout) {
  this.dygraph_ = dygraph;

  this.layout = layout;
  this.element = element;
  this.elementContext = elementContext;
  this.container = this.element.parentNode;

  this.height = this.element.height;
  this.width = this.element.width;

  // --- check whether everything is ok before we return
  if (!this.isIE && !(DygraphCanvasRenderer.isSupported(this.element)))
      throw "Canvas is not supported.";

  // internal state
  this.xlabels = [];
  this.ylabels = [];
  this.annotations = [];
  this.chartLabels = {};

  this.area = layout.getPlotArea();
  this.container.style.position = "relative";
  this.container.style.width = this.width + "px";

  // Set up a clipping area for the canvas (and the interaction canvas).
  // This ensures that we don't overdraw.
  if (this.dygraph_.isUsingExcanvas_) {
    this._createIEClipArea();
  } else {
    // on Android 3 and 4, setting a clipping area on a canvas prevents it from
    // displaying anything.
    if (!Dygraph.isAndroid()) {
      var ctx = this.dygraph_.canvas_ctx_;
      ctx.beginPath();
      ctx.rect(this.area.x, this.area.y, this.area.w, this.area.h);
      ctx.clip();

      ctx = this.dygraph_.hidden_ctx_;
      ctx.beginPath();
      ctx.rect(this.area.x, this.area.y, this.area.w, this.area.h);
      ctx.clip();
    }
  }
};

DygraphCanvasRenderer.prototype.attr_ = function(x) {
  return this.dygraph_.attr_(x);
};

DygraphCanvasRenderer.prototype.clear = function() {
  var context;
  if (this.isIE) {
    // VML takes a while to start up, so we just poll every this.IEDelay
    try {
      if (this.clearDelay) {
        this.clearDelay.cancel();
        this.clearDelay = null;
      }
      context = this.elementContext;
    }
    catch (e) {
      // TODO(danvk): this is broken, since MochiKit.Async is gone.
      // this.clearDelay = MochiKit.Async.wait(this.IEDelay);
      // this.clearDelay.addCallback(bind(this.clear, this));
      return;
    }
  }

  context = this.elementContext;
  context.clearRect(0, 0, this.width, this.height);

  function removeArray(ary) {
    for (var i = 0; i < ary.length; i++) {
      var el = ary[i];
      if (el.parentNode) el.parentNode.removeChild(el);
    }
  }

  removeArray(this.xlabels);
  removeArray(this.ylabels);
  removeArray(this.annotations);

  for (var k in this.chartLabels) {
    if (!this.chartLabels.hasOwnProperty(k)) continue;
    var el = this.chartLabels[k];
    if (el.parentNode) el.parentNode.removeChild(el);
  }
  this.xlabels = [];
  this.ylabels = [];
  this.annotations = [];
  this.chartLabels = {};
};


DygraphCanvasRenderer.isSupported = function(canvasName) {
  var canvas = null;
  try {
    if (typeof(canvasName) == 'undefined' || canvasName === null) {
      canvas = document.createElement("canvas");
    } else {
      canvas = canvasName;
    }
    canvas.getContext("2d");
  }
  catch (e) {
    var ie = navigator.appVersion.match(/MSIE (\d\.\d)/);
    var opera = (navigator.userAgent.toLowerCase().indexOf("opera") != -1);
    if ((!ie) || (ie[1] < 6) || (opera))
      return false;
    return true;
  }
  return true;
};

/**
 * @param { [String] } colors Array of color strings. Should have one entry for
 * each series to be rendered.
 */
DygraphCanvasRenderer.prototype.setColors = function(colors) {
  this.colorScheme_ = colors;
};

/**
 * Draw an X/Y grid on top of the existing plot
 */
DygraphCanvasRenderer.prototype.render = function() {
  // Draw the new X/Y grid. Lines appear crisper when pixels are rounded to
  // half-integers. This prevents them from drawing in two rows/cols.
  var ctx = this.elementContext;
  function halfUp(x)  { return Math.round(x) + 0.5; }
  function halfDown(y){ return Math.round(y) - 0.5; }

  if (this.attr_('underlayCallback')) {
    // NOTE: we pass the dygraph object to this callback twice to avoid breaking
    // users who expect a deprecated form of this callback.
    this.attr_('underlayCallback')(ctx, this.area, this.dygraph_, this.dygraph_);
  }

  var x, y, i, ticks;
  if (this.attr_('drawYGrid')) {
    ticks = this.layout.yticks;
    // TODO(konigsberg): I don't think these calls to save() have a corresponding restore().
    ctx.save();
    ctx.strokeStyle = this.attr_('gridLineColor');
    ctx.lineWidth = this.attr_('gridLineWidth');
    for (i = 0; i < ticks.length; i++) {
      // TODO(danvk): allow secondary axes to draw a grid, too.
      if (ticks[i][0] !== 0) continue;
      x = halfUp(this.area.x);
      y = halfDown(this.area.y + ticks[i][1] * this.area.h);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + this.area.w, y);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  if (this.attr_('drawXGrid')) {
    ticks = this.layout.xticks;
    ctx.save();
    ctx.strokeStyle = this.attr_('gridLineColor');
    ctx.lineWidth = this.attr_('gridLineWidth');
    for (i=0; i<ticks.length; i++) {
      x = halfUp(this.area.x + ticks[i][0] * this.area.w);
      y = halfDown(this.area.y + this.area.h);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, this.area.y);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Do the ordinary rendering, as before
  this._renderLineChart();
  this._renderAxis();
  this._renderChartLabels();
  this._renderAnnotations();
};

DygraphCanvasRenderer.prototype._createIEClipArea = function() {
  var className = 'dygraph-clip-div';
  var graphDiv = this.dygraph_.graphDiv;

  // Remove old clip divs.
  for (var i = graphDiv.childNodes.length-1; i >= 0; i--) {
    if (graphDiv.childNodes[i].className == className) {
      graphDiv.removeChild(graphDiv.childNodes[i]);
    }
  }

  // Determine background color to give clip divs.
  var backgroundColor = document.bgColor;
  var element = this.dygraph_.graphDiv;
  while (element != document) {
    var bgcolor = element.currentStyle.backgroundColor;
    if (bgcolor && bgcolor != 'transparent') {
      backgroundColor = bgcolor;
      break;
    }
    element = element.parentNode;
  }

  function createClipDiv(area) {
    if (area.w === 0 || area.h === 0) {
      return;
    }
    var elem = document.createElement('div');
    elem.className = className;
    elem.style.backgroundColor = backgroundColor;
    elem.style.position = 'absolute';
    elem.style.left = area.x + 'px';
    elem.style.top = area.y + 'px';
    elem.style.width = area.w + 'px';
    elem.style.height = area.h + 'px';
    graphDiv.appendChild(elem);
  }

  var plotArea = this.area;
  // Left side
  createClipDiv({
    x:0, y:0,
    w:plotArea.x,
    h:this.height
  });

  // Top
  createClipDiv({
    x: plotArea.x, y: 0,
    w: this.width - plotArea.x,
    h: plotArea.y
  });

  // Right side
  createClipDiv({
    x: plotArea.x + plotArea.w, y: 0,
    w: this.width-plotArea.x - plotArea.w,
    h: this.height
  });

  // Bottom
  createClipDiv({
    x: plotArea.x,
    y: plotArea.y + plotArea.h,
    w: this.width - plotArea.x,
    h: this.height - plotArea.h - plotArea.y
  });
};

DygraphCanvasRenderer.prototype._renderAxis = function() {
  if (!this.attr_('drawXAxis') && !this.attr_('drawYAxis')) return;

  // Round pixels to half-integer boundaries for crisper drawing.
  function halfUp(x)  { return Math.round(x) + 0.5; }
  function halfDown(y){ return Math.round(y) - 0.5; }

  var context = this.elementContext;

  var label, x, y, tick, i;

  var labelStyle = {
    position: "absolute",
    fontSize: this.attr_('axisLabelFontSize') + "px",
    zIndex: 10,
    color: this.attr_('axisLabelColor'),
    width: this.attr_('axisLabelWidth') + "px",
    // height: this.attr_('axisLabelFontSize') + 2 + "px",
    lineHeight: "normal",  // Something other than "normal" line-height screws up label positioning.
    overflow: "hidden"
  };
  var makeDiv = function(txt, axis, prec_axis) {
    var div = document.createElement("div");
    for (var name in labelStyle) {
      if (labelStyle.hasOwnProperty(name)) {
        div.style[name] = labelStyle[name];
      }
    }
    var inner_div = document.createElement("div");
    inner_div.className = 'dygraph-axis-label' +
                          ' dygraph-axis-label-' + axis +
                          (prec_axis ? ' dygraph-axis-label-' + prec_axis : '');
    inner_div.innerHTML=txt;
    div.appendChild(inner_div);
    return div;
  };

  // axis lines
  context.save();
  context.strokeStyle = this.attr_('axisLineColor');
  context.lineWidth = this.attr_('axisLineWidth');

  if (this.attr_('drawYAxis')) {
    if (this.layout.yticks && this.layout.yticks.length > 0) {
      var num_axes = this.dygraph_.numAxes();
      for (i = 0; i < this.layout.yticks.length; i++) {
        tick = this.layout.yticks[i];
        if (typeof(tick) == "function") return;
        x = this.area.x;
        var sgn = 1;
        var prec_axis = 'y1';
        if (tick[0] == 1) {  // right-side y-axis
          x = this.area.x + this.area.w;
          sgn = -1;
          prec_axis = 'y2';
        }
        y = this.area.y + tick[1] * this.area.h;

        /* Tick marks are currently clipped, so don't bother drawing them.
        context.beginPath();
        context.moveTo(halfUp(x), halfDown(y));
        context.lineTo(halfUp(x - sgn * this.attr_('axisTickSize')), halfDown(y));
        context.closePath();
        context.stroke();
        */

        label = makeDiv(tick[2], 'y', num_axes == 2 ? prec_axis : null);
        var top = (y - this.attr_('axisLabelFontSize') / 2);
        if (top < 0) top = 0;

        if (top + this.attr_('axisLabelFontSize') + 3 > this.height) {
          label.style.bottom = "0px";
        } else {
          label.style.top = top + "px";
        }
        if (tick[0] === 0) {
          label.style.left = (this.area.x - this.attr_('yAxisLabelWidth') - this.attr_('axisTickSize')) + "px";
          label.style.textAlign = "right";
        } else if (tick[0] == 1) {
          label.style.left = (this.area.x + this.area.w +
                              this.attr_('axisTickSize')) + "px";
          label.style.textAlign = "left";
        }
        label.style.width = this.attr_('yAxisLabelWidth') + "px";
        this.container.appendChild(label);
        this.ylabels.push(label);
      }

      // The lowest tick on the y-axis often overlaps with the leftmost
      // tick on the x-axis. Shift the bottom tick up a little bit to
      // compensate if necessary.
      var bottomTick = this.ylabels[0];
      var fontSize = this.attr_('axisLabelFontSize');
      var bottom = parseInt(bottomTick.style.top, 10) + fontSize;
      if (bottom > this.height - fontSize) {
        bottomTick.style.top = (parseInt(bottomTick.style.top, 10) -
            fontSize / 2) + "px";
      }
    }

    // draw a vertical line on the left to separate the chart from the labels.
    context.beginPath();
    context.moveTo(halfUp(this.area.x), halfDown(this.area.y));
    context.lineTo(halfUp(this.area.x), halfDown(this.area.y + this.area.h));
    context.closePath();
    context.stroke();

    // if there's a secondary y-axis, draw a vertical line for that, too.
    if (this.dygraph_.numAxes() == 2) {
      context.beginPath();
      context.moveTo(halfDown(this.area.x + this.area.w), halfDown(this.area.y));
      context.lineTo(halfDown(this.area.x + this.area.w), halfDown(this.area.y + this.area.h));
      context.closePath();
      context.stroke();
    }
  }

  if (this.attr_('drawXAxis')) {
    if (this.layout.xticks) {
      for (i = 0; i < this.layout.xticks.length; i++) {
        tick = this.layout.xticks[i];
        x = this.area.x + tick[0] * this.area.w;
        y = this.area.y + this.area.h;

        /* Tick marks are currently clipped, so don't bother drawing them.
        context.beginPath();
        context.moveTo(halfUp(x), halfDown(y));
        context.lineTo(halfUp(x), halfDown(y + this.attr_('axisTickSize')));
        context.closePath();
        context.stroke();
        */

        label = makeDiv(tick[1], 'x');
        label.style.textAlign = "center";
        label.style.top = (y + this.attr_('axisTickSize')) + 'px';

        var left = (x - this.attr_('axisLabelWidth')/2);
        if (left + this.attr_('axisLabelWidth') > this.width) {
          left = this.width - this.attr_('xAxisLabelWidth');
          label.style.textAlign = "right";
        }
        if (left < 0) {
          left = 0;
          label.style.textAlign = "left";
        }

        label.style.left = left + "px";
        label.style.width = this.attr_('xAxisLabelWidth') + "px";
        this.container.appendChild(label);
        this.xlabels.push(label);
      }
    }

    context.beginPath();
    context.moveTo(halfUp(this.area.x), halfDown(this.area.y + this.area.h));
    context.lineTo(halfUp(this.area.x + this.area.w), halfDown(this.area.y + this.area.h));
    context.closePath();
    context.stroke();
  }

  context.restore();
};


DygraphCanvasRenderer.prototype._renderChartLabels = function() {
  var div, class_div;

  // Generate divs for the chart title, xlabel and ylabel.
  // Space for these divs has already been taken away from the charting area in
  // the DygraphCanvasRenderer constructor.
  if (this.attr_('title')) {
    div = document.createElement("div");
    div.style.position = 'absolute';
    div.style.top = '0px';
    div.style.left = this.area.x + 'px';
    div.style.width = this.area.w + 'px';
    div.style.height = this.attr_('titleHeight') + 'px';
    div.style.textAlign = 'center';
    div.style.fontSize = (this.attr_('titleHeight') - 8) + 'px';
    div.style.fontWeight = 'bold';
    class_div = document.createElement("div");
    class_div.className = 'dygraph-label dygraph-title';
    class_div.innerHTML = this.attr_('title');
    div.appendChild(class_div);
    this.container.appendChild(div);
    this.chartLabels.title = div;
  }

  if (this.attr_('xlabel')) {
    div = document.createElement("div");
    div.style.position = 'absolute';
    div.style.bottom = 0;  // TODO(danvk): this is lazy. Calculate style.top.
    div.style.left = this.area.x + 'px';
    div.style.width = this.area.w + 'px';
    div.style.height = this.attr_('xLabelHeight') + 'px';
    div.style.textAlign = 'center';
    div.style.fontSize = (this.attr_('xLabelHeight') - 2) + 'px';

    class_div = document.createElement("div");
    class_div.className = 'dygraph-label dygraph-xlabel';
    class_div.innerHTML = this.attr_('xlabel');
    div.appendChild(class_div);
    this.container.appendChild(div);
    this.chartLabels.xlabel = div;
  }

  var that = this;
  function createRotatedDiv(axis, classes, html) {
    var box = {
      left: 0,
      top: that.area.y,
      width: that.attr_('yLabelWidth'),
      height: that.area.h
    };
    // TODO(danvk): is this outer div actually necessary?
    div = document.createElement("div");
    div.style.position = 'absolute';
    if (axis == 1) {
      div.style.left = box.left;
    } else {
      div.style.right = box.left;
    }
    div.style.top = box.top + 'px';
    div.style.width = box.width + 'px';
    div.style.height = box.height + 'px';
    div.style.fontSize = (that.attr_('yLabelWidth') - 2) + 'px';

    var inner_div = document.createElement("div");
    inner_div.style.position = 'absolute';
    inner_div.style.width = box.height + 'px';
    inner_div.style.height = box.width + 'px';
    inner_div.style.top = (box.height / 2 - box.width / 2) + 'px';
    inner_div.style.left = (box.width / 2 - box.height / 2) + 'px';
    inner_div.style.textAlign = 'center';

    // CSS rotation is an HTML5 feature which is not standardized. Hence every
    // browser has its own name for the CSS style.
    var val = 'rotate(' + (axis == 1 ? '-' : '') + '90deg)';
    inner_div.style.transform = val;        // HTML5
    inner_div.style.WebkitTransform = val;  // Safari/Chrome
    inner_div.style.MozTransform = val;     // Firefox
    inner_div.style.OTransform = val;       // Opera
    inner_div.style.msTransform = val;      // IE9

    if (typeof(document.documentMode) !== 'undefined' &&
        document.documentMode < 9) {
      // We're dealing w/ an old version of IE, so we have to rotate the text
      // using a BasicImage transform. This uses a different origin of rotation
      // than HTML5 rotation (top left of div vs. its center).
      inner_div.style.filter =
          'progid:DXImageTransform.Microsoft.BasicImage(rotation=' +
          (axis == 1 ? '3' : '1') + ')';
      inner_div.style.left = '0px';
      inner_div.style.top = '0px';
    }

    class_div = document.createElement("div");
    class_div.className = classes;
    class_div.innerHTML = html;

    inner_div.appendChild(class_div);
    div.appendChild(inner_div);
    return div;
  }

  var div;
  if (this.attr_('ylabel')) {
    div = createRotatedDiv(1, 'dygraph-label dygraph-ylabel',
                           this.attr_('ylabel'));
    this.container.appendChild(div);
    this.chartLabels.ylabel = div;
  }
  if (this.attr_('y2label') && this.dygraph_.numAxes() == 2) {
    div = createRotatedDiv(2, 'dygraph-label dygraph-y2label',
                           this.attr_('y2label'));
    this.container.appendChild(div);
    this.chartLabels.y2label = div;
  }
};


DygraphCanvasRenderer.prototype._renderAnnotations = function() {
  var annotationStyle = {
    "position": "absolute",
    "fontSize": this.attr_('axisLabelFontSize') + "px",
    "zIndex": 10,
    "overflow": "hidden"
  };

  var bindEvt = function(eventName, classEventName, p, self) {
    return function(e) {
      var a = p.annotation;
      if (a.hasOwnProperty(eventName)) {
        a[eventName](a, p, self.dygraph_, e);
      } else if (self.dygraph_.attr_(classEventName)) {
        self.dygraph_.attr_(classEventName)(a, p, self.dygraph_,e );
      }
    };
  };

  // Get a list of point with annotations.
  var points = this.layout.annotated_points;
  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    if (p.canvasx < this.area.x || p.canvasx > this.area.x + this.area.w ||
        p.canvasy < this.area.y || p.canvasy > this.area.y + this.area.h) {
      continue;
    }

    var a = p.annotation;
    var tick_height = 6;
    if (a.hasOwnProperty("tickHeight")) {
      tick_height = a.tickHeight;
    }

    var div = document.createElement("div");
    for (var name in annotationStyle) {
      if (annotationStyle.hasOwnProperty(name)) {
        div.style[name] = annotationStyle[name];
      }
    }
    if (!a.hasOwnProperty('icon')) {
      div.className = "dygraphDefaultAnnotation";
    }
    if (a.hasOwnProperty('cssClass')) {
      div.className += " " + a.cssClass;
    }

    var width = a.hasOwnProperty('width') ? a.width : 16;
    var height = a.hasOwnProperty('height') ? a.height : 16;
    if (a.hasOwnProperty('icon')) {
      var img = document.createElement("img");
      img.src = a.icon;
      img.width = width;
      img.height = height;
      div.appendChild(img);
    } else if (p.annotation.hasOwnProperty('shortText')) {
      div.appendChild(document.createTextNode(p.annotation.shortText));
    }
    div.style.left = (p.canvasx - width / 2) + "px";
    if (a.attachAtBottom) {
      div.style.top = (this.area.h - height - tick_height) + "px";
    } else {
      div.style.top = (p.canvasy - height - tick_height) + "px";
    }
    div.style.width = width + "px";
    div.style.height = height + "px";
    div.title = p.annotation.text;
    div.style.color = this.colors[p.name];
    div.style.borderColor = this.colors[p.name];
    a.div = div;

    Dygraph.addEvent(div, 'click',
        bindEvt('clickHandler', 'annotationClickHandler', p, this));
    Dygraph.addEvent(div, 'mouseover',
        bindEvt('mouseOverHandler', 'annotationMouseOverHandler', p, this));
    Dygraph.addEvent(div, 'mouseout',
        bindEvt('mouseOutHandler', 'annotationMouseOutHandler', p, this));
    Dygraph.addEvent(div, 'dblclick',
        bindEvt('dblClickHandler', 'annotationDblClickHandler', p, this));

    this.container.appendChild(div);
    this.annotations.push(div);

    var ctx = this.elementContext;
    ctx.strokeStyle = this.colors[p.name];
    ctx.beginPath();
    if (!a.attachAtBottom) {
      ctx.moveTo(p.canvasx, p.canvasy);
      ctx.lineTo(p.canvasx, p.canvasy - 2 - tick_height);
    } else {
      ctx.moveTo(p.canvasx, this.area.h);
      ctx.lineTo(p.canvasx, this.area.h - 2 - tick_height);
    }
    ctx.closePath();
    ctx.stroke();
  }
};

DygraphCanvasRenderer.makeNextPointStep_ = function(connect, points, end) {
  if (connect) {
    return function(j) {
      while (++j < end) {
        if (!(points[j].yval === null)) break;
      }
      return j;
    }
  } else {
    return function(j) { return j + 1 };
  }
};

DygraphCanvasRenderer.prototype._drawStyledLine = function(
    ctx, i, setName, color, strokeWidth, strokePattern, drawPoints,
    drawPointCallback, pointSize) {
  var isNullOrNaN = function(x) {
    return (x === null || isNaN(x));
  };

  var stepPlot = this.attr_("stepPlot");
  var firstIndexInSet = this.layout.setPointsOffsets[i];
  var setLength = this.layout.setPointsLengths[i];
  var afterLastIndexInSet = firstIndexInSet + setLength;
  var points = this.layout.points;
  var prevX = null;
  var prevY = null;
  var pointsOnLine = []; // Array of [canvasx, canvasy] pairs.
  if (!Dygraph.isArrayLike(strokePattern)) {
    strokePattern = null;
  }

  var point;
  var next = DygraphCanvasRenderer.makeNextPointStep_(
      this.attr_('connectSeparatedPoints'), points, afterLastIndexInSet);
  ctx.save();
  for (var j = firstIndexInSet; j < afterLastIndexInSet; j = next(j)) {
    point = points[j];
    if (isNullOrNaN(point.canvasy)) {
      if (stepPlot && prevX !== null) {
        // Draw a horizontal line to the start of the missing data
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = this.attr_('strokeWidth');
        this._dashedLine(ctx, prevX, prevY, point.canvasx, prevY, strokePattern);
        ctx.stroke();
      }
      // this will make us move to the next point, not draw a line to it.
      prevX = prevY = null;
    } else {
      // A point is "isolated" if it is non-null but both the previous
      // and next points are null.
      var isIsolated = (!prevX && (j == points.length - 1 ||
                                   isNullOrNaN(points[j+1].canvasy)));
      if (prevX === null) {
        prevX = point.canvasx;
        prevY = point.canvasy;
      } else {
        // Skip over points that will be drawn in the same pixel.
        if (Math.round(prevX) == Math.round(point.canvasx) &&
            Math.round(prevY) == Math.round(point.canvasy)) {
          continue;
        }
        // TODO(antrob): skip over points that lie on a line that is already
        // going to be drawn. There is no need to have more than 2
        // consecutive points that are collinear.
        if (strokeWidth) {
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = strokeWidth;
          if (stepPlot) {
            this._dashedLine(ctx, prevX, prevY, point.canvasx, prevY, strokePattern);
            prevX = point.canvasx;
          }
          this._dashedLine(ctx, prevX, prevY, point.canvasx, point.canvasy, strokePattern);
          prevX = point.canvasx;
          prevY = point.canvasy;
          ctx.stroke();
        }
      }

      if (drawPoints || isIsolated) {
        pointsOnLine.push([point.canvasx, point.canvasy]);
      }
    }
  }
  for (var idx = 0; idx < pointsOnLine.length; idx++) {
    var cb = pointsOnLine[idx];
    ctx.save();
    drawPointCallback(
        this.dygraph_, setName, ctx, cb[0], cb[1], color, pointSize);
    ctx.restore();
  }
  ctx.restore();
};

DygraphCanvasRenderer.prototype._drawLine = function(ctx, i) {
  var setNames = this.layout.setNames;
  var setName = setNames[i];

  var strokeWidth = this.dygraph_.attr_("strokeWidth", setName);
  var borderWidth = this.dygraph_.attr_("strokeBorderWidth", setName);
  var drawPointCallback = this.dygraph_.attr_("drawPointCallback", setName) ||
      Dygraph.Circles.DEFAULT;
  if (borderWidth && strokeWidth) {
    this._drawStyledLine(ctx, i, setName,
        this.dygraph_.attr_("strokeBorderColor", setName),
        strokeWidth + 2 * borderWidth,
        this.dygraph_.attr_("strokePattern", setName),
        this.dygraph_.attr_("drawPoints", setName),
        drawPointCallback,
        this.dygraph_.attr_("pointSize", setName));
  }

  this._drawStyledLine(ctx, i, setName,
      this.colors[setName],
      strokeWidth,
      this.dygraph_.attr_("strokePattern", setName),
      this.dygraph_.attr_("drawPoints", setName),
      drawPointCallback,
      this.dygraph_.attr_("pointSize", setName));
};

/**
 * Actually draw the lines chart, including error bars.
 * TODO(danvk): split this into several smaller functions.
 * @private
 */
DygraphCanvasRenderer.prototype._renderLineChart = function() {
  // TODO(danvk): use this.attr_ for many of these.
  var ctx = this.elementContext;
  var fillAlpha = this.attr_('fillAlpha');
  var errorBars = this.attr_("errorBars") || this.attr_("customBars");
  var fillGraph = this.attr_("fillGraph");
  var stackedGraph = this.attr_("stackedGraph");
  var stepPlot = this.attr_("stepPlot");
  var points = this.layout.points;
  var pointsLength = points.length;
  var point, i, j, prevX, prevY, prevYs, color, setName, newYs, err_color, rgb, yscale, axis;

  var setNames = this.layout.setNames;
  var setCount = setNames.length;

  // TODO(danvk): Move this mapping into Dygraph and get it out of here.
  this.colors = {};
  for (i = 0; i < setCount; i++) {
    this.colors[setNames[i]] = this.colorScheme_[i % this.colorScheme_.length];
  }

  // Update Points
  // TODO(danvk): here
  for (i = pointsLength; i--;) {
    point = points[i];
    point.canvasx = this.area.w * point.x + this.area.x;
    point.canvasy = this.area.h * point.y + this.area.y;
  }

  // create paths
  if (errorBars) {
    ctx.save();
    if (fillGraph) {
      this.dygraph_.warn("Can't use fillGraph option with error bars");
    }

    for (i = 0; i < setCount; i++) {
      setName = setNames[i];
      axis = this.dygraph_.axisPropertiesForSeries(setName);
      color = this.colors[setName];

      var firstIndexInSet = this.layout.setPointsOffsets[i];
      var setLength = this.layout.setPointsLengths[i];
      var afterLastIndexInSet = firstIndexInSet + setLength;

      var next = DygraphCanvasRenderer.makeNextPointStep_(
        this.attr_('connectSeparatedPoints'), points,
        afterLastIndexInSet);

      // setup graphics context
      prevX = NaN;
      prevY = NaN;
      prevYs = [-1, -1];
      yscale = axis.yscale;
      // should be same color as the lines but only 15% opaque.
      rgb = new RGBColor(color);
      err_color = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' +
                            fillAlpha + ')';
      ctx.fillStyle = err_color;
      ctx.beginPath();
      for (j = firstIndexInSet; j < afterLastIndexInSet; j = next(j)) {
        point = points[j];
        if (point.name == setName) { // TODO(klausw): this is always true
          if (!Dygraph.isOK(point.y)) {
            prevX = NaN;
            continue;
          }

          // TODO(danvk): here
          if (stepPlot) {
            newYs = [ point.y_bottom, point.y_top ];
            prevY = point.y;
          } else {
            newYs = [ point.y_bottom, point.y_top ];
          }
          newYs[0] = this.area.h * newYs[0] + this.area.y;
          newYs[1] = this.area.h * newYs[1] + this.area.y;
          if (!isNaN(prevX)) {
            if (stepPlot) {
              ctx.moveTo(prevX, newYs[0]);
            } else {
              ctx.moveTo(prevX, prevYs[0]);
            }
            ctx.lineTo(point.canvasx, newYs[0]);
            ctx.lineTo(point.canvasx, newYs[1]);
            if (stepPlot) {
              ctx.lineTo(prevX, newYs[1]);
            } else {
              ctx.lineTo(prevX, prevYs[1]);
            }
            ctx.closePath();
          }
          prevYs = newYs;
          prevX = point.canvasx;
        }
      }
      ctx.fill();
    }
    ctx.restore();
  } else if (fillGraph) {
    ctx.save();
    var baseline = [];  // for stacked graphs: baseline for filling

    // process sets in reverse order (needed for stacked graphs)
    for (i = setCount - 1; i >= 0; i--) {
      setName = setNames[i];
      color = this.colors[setName];
      axis = this.dygraph_.axisPropertiesForSeries(setName);
      var axisY = 1.0 + axis.minyval * axis.yscale;
      if (axisY < 0.0) axisY = 0.0;
      else if (axisY > 1.0) axisY = 1.0;
      axisY = this.area.h * axisY + this.area.y;
      var firstIndexInSet = this.layout.setPointsOffsets[i];
      var setLength = this.layout.setPointsLengths[i];
      var afterLastIndexInSet = firstIndexInSet + setLength;

      var next = DygraphCanvasRenderer.makeNextPointStep_(
        this.attr_('connectSeparatedPoints'), points,
        afterLastIndexInSet);

      // setup graphics context
      prevX = NaN;
      prevYs = [-1, -1];
      yscale = axis.yscale;
      // should be same color as the lines but only 15% opaque.
      rgb = new RGBColor(color);
      err_color = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' +
                            fillAlpha + ')';
      ctx.fillStyle = err_color;
      ctx.beginPath();
      for (j = firstIndexInSet; j < afterLastIndexInSet; j = next(j)) {
        point = points[j];
        if (point.name == setName) { // TODO(klausw): this is always true
          if (!Dygraph.isOK(point.y)) {
            prevX = NaN;
            continue;
          }
          if (stackedGraph) {
            var lastY = baseline[point.canvasx];
            if (lastY === undefined) lastY = axisY;
            baseline[point.canvasx] = point.canvasy;
            newYs = [ point.canvasy, lastY ];
          } else {
            newYs = [ point.canvasy, axisY ];
          }
          if (!isNaN(prevX)) {
            ctx.moveTo(prevX, prevYs[0]);
            if (stepPlot) {
              ctx.lineTo(point.canvasx, prevYs[0]);
            } else {
              ctx.lineTo(point.canvasx, newYs[0]);
            }
            ctx.lineTo(point.canvasx, newYs[1]);
            ctx.lineTo(prevX, prevYs[1]);
            ctx.closePath();
          }
          prevYs = newYs;
          prevX = point.canvasx;
        }
      }
      ctx.fill();
    }
    ctx.restore();
  }

  // Drawing the lines.
  for (i = 0; i < setCount; i += 1) {
    this._drawLine(ctx, i);
  }
};

/**
 * This does dashed lines onto a canvas for a given pattern. You must call
 * ctx.stroke() after to actually draw it, much line ctx.lineTo(). It remembers
 * the state of the line in regards to where we left off on drawing the pattern.
 * You can draw a dashed line in several function calls and the pattern will be
 * continous as long as you didn't call this function with a different pattern
 * in between.
 * @param ctx The canvas 2d context to draw on.
 * @param x The start of the line's x coordinate.
 * @param y The start of the line's y coordinate.
 * @param x2 The end of the line's x coordinate.
 * @param y2 The end of the line's y coordinate.
 * @param pattern The dash pattern to draw, an array of integers where even 
 * index is drawn and odd index is not drawn (Ex. [10, 2, 5, 2], 10 is drawn 5
 * is drawn, 2 is the space between.). A null pattern, array of length one, or
 * empty array will do just a solid line.
 * @private
 */
DygraphCanvasRenderer.prototype._dashedLine = function(ctx, x, y, x2, y2, pattern) {
  // Original version http://stackoverflow.com/questions/4576724/dotted-stroke-in-canvas
  // Modified by Russell Valentine to keep line history and continue the pattern
  // where it left off.
  var dx, dy, len, rot, patternIndex, segment;

  // If we don't have a pattern or it is an empty array or of size one just
  // do a solid line.
  if (!pattern || pattern.length <= 1) {
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    return;
  }

  // If we have a different dash pattern than the last time this was called we
  // reset our dash history and start the pattern from the begging 
  // regardless of state of the last pattern.
  if (!Dygraph.compareArrays(pattern, this._dashedLineToHistoryPattern)) {
    this._dashedLineToHistoryPattern = pattern;
    this._dashedLineToHistory = [0, 0];
  }
  ctx.save();

  // Calculate transformation parameters
  dx = (x2-x);
  dy = (y2-y);
  len = Math.sqrt(dx*dx + dy*dy);
  rot = Math.atan2(dy, dx);

  // Set transformation
  ctx.translate(x, y);
  ctx.moveTo(0, 0);
  ctx.rotate(rot);

  // Set last pattern index we used for this pattern.
  patternIndex = this._dashedLineToHistory[0];
  x = 0;
  while (len > x) {
    // Get the length of the pattern segment we are dealing with.
    segment = pattern[patternIndex];
    // If our last draw didn't complete the pattern segment all the way we 
    // will try to finish it. Otherwise we will try to do the whole segment.
    if (this._dashedLineToHistory[1]) {
      x += this._dashedLineToHistory[1];
    } else {
      x += segment;
    }
    if (x > len) {
      // We were unable to complete this pattern index all the way, keep
      // where we are the history so our next draw continues where we left off
      // in the pattern.
      this._dashedLineToHistory = [patternIndex, x-len];
      x = len;
    } else {
      // We completed this patternIndex, we put in the history that we are on
      // the beginning of the next segment.
      this._dashedLineToHistory = [(patternIndex+1)%pattern.length, 0];
    }

    // We do a line on a even pattern index and just move on a odd pattern index.
    // The move is the empty space in the dash.
    if(patternIndex % 2 === 0) {
      ctx.lineTo(x, 0);
    } else {
      ctx.moveTo(x, 0);
    }
    // If we are not done, next loop process the next pattern segment, or the
    // first segment again if we are at the end of the pattern.
    patternIndex = (patternIndex+1) % pattern.length;
  }
  ctx.restore();
};
/**
 * @license
 * Copyright 2006 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview Creates an interactive, zoomable graph based on a CSV file or
 * string. Dygraph can handle multiple series with or without error bars. The
 * date/value ranges will be automatically set. Dygraph uses the
 * &lt;canvas&gt; tag, so it only works in FF1.5+.
 * @author danvdk@gmail.com (Dan Vanderkam)

  Usage:
   <div id="graphdiv" style="width:800px; height:500px;"></div>
   <script type="text/javascript">
     new Dygraph(document.getElementById("graphdiv"),
                 "datafile.csv",  // CSV file with headers
                 { }); // options
   </script>

 The CSV file is of the form

   Date,SeriesA,SeriesB,SeriesC
   YYYYMMDD,A1,B1,C1
   YYYYMMDD,A2,B2,C2

 If the 'errorBars' option is set in the constructor, the input should be of
 the form
   Date,SeriesA,SeriesB,...
   YYYYMMDD,A1,sigmaA1,B1,sigmaB1,...
   YYYYMMDD,A2,sigmaA2,B2,sigmaB2,...

 If the 'fractions' option is set, the input should be of the form:

   Date,SeriesA,SeriesB,...
   YYYYMMDD,A1/B1,A2/B2,...
   YYYYMMDD,A1/B1,A2/B2,...

 And error bars will be calculated automatically using a binomial distribution.

 For further documentation and examples, see http://dygraphs.com/

 */

/*jshint globalstrict: true */
/*global DygraphRangeSelector:false, DygraphLayout:false, DygraphCanvasRenderer:false, G_vmlCanvasManager:false */
"use strict";

/**
 * Creates an interactive, zoomable chart.
 *
 * @constructor
 * @param {div | String} div A div or the id of a div into which to construct
 * the chart.
 * @param {String | Function} file A file containing CSV data or a function
 * that returns this data. The most basic expected format for each line is
 * "YYYY/MM/DD,val1,val2,...". For more information, see
 * http://dygraphs.com/data.html.
 * @param {Object} attrs Various other attributes, e.g. errorBars determines
 * whether the input data contains error ranges. For a complete list of
 * options, see http://dygraphs.com/options.html.
 */
var Dygraph = function(div, data, opts) {
  if (arguments.length > 0) {
    if (arguments.length == 4) {
      // Old versions of dygraphs took in the series labels as a constructor
      // parameter. This doesn't make sense anymore, but it's easy to continue
      // to support this usage.
      this.warn("Using deprecated four-argument dygraph constructor");
      this.__old_init__(div, data, arguments[2], arguments[3]);
    } else {
      this.__init__(div, data, opts);
    }
  }
};

Dygraph.NAME = "Dygraph";
Dygraph.VERSION = "1.2";
Dygraph.__repr__ = function() {
  return "[" + this.NAME + " " + this.VERSION + "]";
};

/**
 * Returns information about the Dygraph class.
 */
Dygraph.toString = function() {
  return this.__repr__();
};

// Various default values
Dygraph.DEFAULT_ROLL_PERIOD = 1;
Dygraph.DEFAULT_WIDTH = 480;
Dygraph.DEFAULT_HEIGHT = 320;

Dygraph.ANIMATION_STEPS = 10;
Dygraph.ANIMATION_DURATION = 200;

// These are defined before DEFAULT_ATTRS so that it can refer to them.
/**
 * @private
 * Return a string version of a number. This respects the digitsAfterDecimal
 * and maxNumberWidth options.
 * @param {Number} x The number to be formatted
 * @param {Dygraph} opts An options view
 * @param {String} name The name of the point's data series
 * @param {Dygraph} g The dygraph object
 */
Dygraph.numberValueFormatter = function(x, opts, pt, g) {
  var sigFigs = opts('sigFigs');

  if (sigFigs !== null) {
    // User has opted for a fixed number of significant figures.
    return Dygraph.floatFormat(x, sigFigs);
  }

  var digits = opts('digitsAfterDecimal');
  var maxNumberWidth = opts('maxNumberWidth');

  // switch to scientific notation if we underflow or overflow fixed display.
  if (x !== 0.0 &&
      (Math.abs(x) >= Math.pow(10, maxNumberWidth) ||
       Math.abs(x) < Math.pow(10, -digits))) {
    return x.toExponential(digits);
  } else {
    return '' + Dygraph.round_(x, digits);
  }
};

/**
 * variant for use as an axisLabelFormatter.
 * @private
 */
Dygraph.numberAxisLabelFormatter = function(x, granularity, opts, g) {
  return Dygraph.numberValueFormatter(x, opts, g);
};

/**
 * Convert a JS date (millis since epoch) to YYYY/MM/DD
 * @param {Number} date The JavaScript date (ms since epoch)
 * @return {String} A date of the form "YYYY/MM/DD"
 * @private
 */
Dygraph.dateString_ = function(date) {
  var zeropad = Dygraph.zeropad;
  var d = new Date(date);

  // Get the year:
  var year = "" + d.getFullYear();
  // Get a 0 padded month string
  var month = zeropad(d.getMonth() + 1);  //months are 0-offset, sigh
  // Get a 0 padded day string
  var day = zeropad(d.getDate());

  var ret = "";
  var frac = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  if (frac) ret = " " + Dygraph.hmsString_(date);

  return year + "/" + month + "/" + day + ret;
};

/**
 * Convert a JS date to a string appropriate to display on an axis that
 * is displaying values at the stated granularity.
 * @param {Date} date The date to format
 * @param {Number} granularity One of the Dygraph granularity constants
 * @return {String} The formatted date
 * @private
 */
Dygraph.dateAxisFormatter = function(date, granularity) {
  if (granularity >= Dygraph.DECADAL) {
    return date.strftime('%Y');
  } else if (granularity >= Dygraph.MONTHLY) {
    return date.strftime('%b %y');
  } else {
    var frac = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds();
    if (frac === 0 || granularity >= Dygraph.DAILY) {
      return new Date(date.getTime() + 3600*1000).strftime('%d%b');
    } else {
      return Dygraph.hmsString_(date.getTime());
    }
  }
};


// Default attribute values.
Dygraph.DEFAULT_ATTRS = {
  highlightCircleSize: 3,
  highlightSeriesOpts: null,
  highlightSeriesBackgroundAlpha: 0.5,

  labelsDivWidth: 250,
  labelsDivStyles: {
    // TODO(danvk): move defaults from createStatusMessage_ here.
  },
  labelsSeparateLines: false,
  labelsShowZeroValues: true,
  labelsKMB: false,
  labelsKMG2: false,
  showLabelsOnHighlight: true,

  digitsAfterDecimal: 2,
  maxNumberWidth: 6,
  sigFigs: null,

  strokeWidth: 1.0,
  strokeBorderWidth: 0,
  strokeBorderColor: "white",

  axisTickSize: 3,
  axisLabelFontSize: 14,
  xAxisLabelWidth: 50,
  yAxisLabelWidth: 50,
  rightGap: 5,

  showRoller: false,
  xValueParser: Dygraph.dateParser,

  delimiter: ',',

  sigma: 2.0,
  errorBars: false,
  fractions: false,
  wilsonInterval: true,  // only relevant if fractions is true
  customBars: false,
  fillGraph: false,
  fillAlpha: 0.15,
  connectSeparatedPoints: false,

  stackedGraph: false,
  hideOverlayOnMouseOut: true,

  // TODO(danvk): support 'onmouseover' and 'never', and remove synonyms.
  legend: 'onmouseover',  // the only relevant value at the moment is 'always'.

  stepPlot: false,
  avoidMinZero: false,

  // Sizes of the various chart labels.
  titleHeight: 28,
  xLabelHeight: 18,
  yLabelWidth: 18,

  drawXAxis: true,
  drawYAxis: true,
  axisLineColor: "black",
  axisLineWidth: 0.3,
  gridLineWidth: 0.3,
  axisLabelColor: "black",
  axisLabelFont: "Arial",  // TODO(danvk): is this implemented?
  axisLabelWidth: 50,
  drawYGrid: true,
  drawXGrid: true,
  gridLineColor: "rgb(128,128,128)",

  interactionModel: null,  // will be set to Dygraph.Interaction.defaultModel
  animatedZooms: false,  // (for now)

  // Range selector options
  showRangeSelector: false,
  rangeSelectorHeight: 40,
  rangeSelectorPlotStrokeColor: "#808FAB",
  rangeSelectorPlotFillColor: "#A7B1C4",

  // per-axis options
  axes: {
    x: {
      pixelsPerLabel: 60,
      axisLabelFormatter: Dygraph.dateAxisFormatter,
      valueFormatter: Dygraph.dateString_,
      ticker: null  // will be set in dygraph-tickers.js
    },
    y: {
      pixelsPerLabel: 30,
      valueFormatter: Dygraph.numberValueFormatter,
      axisLabelFormatter: Dygraph.numberAxisLabelFormatter,
      ticker: null  // will be set in dygraph-tickers.js
    },
    y2: {
      pixelsPerLabel: 30,
      valueFormatter: Dygraph.numberValueFormatter,
      axisLabelFormatter: Dygraph.numberAxisLabelFormatter,
      ticker: null  // will be set in dygraph-tickers.js
    }
  }
};

// Directions for panning and zooming. Use bit operations when combined
// values are possible.
Dygraph.HORIZONTAL = 1;
Dygraph.VERTICAL = 2;

// Used for initializing annotation CSS rules only once.
Dygraph.addedAnnotationCSS = false;

Dygraph.prototype.__old_init__ = function(div, file, labels, attrs) {
  // Labels is no longer a constructor parameter, since it's typically set
  // directly from the data source. It also conains a name for the x-axis,
  // which the previous constructor form did not.
  if (labels !== null) {
    var new_labels = ["Date"];
    for (var i = 0; i < labels.length; i++) new_labels.push(labels[i]);
    Dygraph.update(attrs, { 'labels': new_labels });
  }
  this.__init__(div, file, attrs);
};

/**
 * Initializes the Dygraph. This creates a new DIV and constructs the PlotKit
 * and context &lt;canvas&gt; inside of it. See the constructor for details.
 * on the parameters.
 * @param {Element} div the Element to render the graph into.
 * @param {String | Function} file Source data
 * @param {Object} attrs Miscellaneous other options
 * @private
 */
Dygraph.prototype.__init__ = function(div, file, attrs) {
  // Hack for IE: if we're using excanvas and the document hasn't finished
  // loading yet (and hence may not have initialized whatever it needs to
  // initialize), then keep calling this routine periodically until it has.
  if (/MSIE/.test(navigator.userAgent) && !window.opera &&
      typeof(G_vmlCanvasManager) != 'undefined' &&
      document.readyState != 'complete') {
    var self = this;
    setTimeout(function() { self.__init__(div, file, attrs); }, 100);
    return;
  }

  // Support two-argument constructor
  if (attrs === null || attrs === undefined) { attrs = {}; }

  attrs = Dygraph.mapLegacyOptions_(attrs);

  if (!div) {
    Dygraph.error("Constructing dygraph with a non-existent div!");
    return;
  }

  this.isUsingExcanvas_ = typeof(G_vmlCanvasManager) != 'undefined';

  // Copy the important bits into the object
  // TODO(danvk): most of these should just stay in the attrs_ dictionary.
  this.maindiv_ = div;
  this.file_ = file;
  this.rollPeriod_ = attrs.rollPeriod || Dygraph.DEFAULT_ROLL_PERIOD;
  this.previousVerticalX_ = -1;
  this.fractions_ = attrs.fractions || false;
  this.dateWindow_ = attrs.dateWindow || null;

  this.is_initial_draw_ = true;
  this.annotations_ = [];

  // Zoomed indicators - These indicate when the graph has been zoomed and on what axis.
  this.zoomed_x_ = false;
  this.zoomed_y_ = false;

  // Clear the div. This ensure that, if multiple dygraphs are passed the same
  // div, then only one will be drawn.
  div.innerHTML = "";

  // For historical reasons, the 'width' and 'height' options trump all CSS
  // rules _except_ for an explicit 'width' or 'height' on the div.
  // As an added convenience, if the div has zero height (like <div></div> does
  // without any styles), then we use a default height/width.
  if (div.style.width === '' && attrs.width) {
    div.style.width = attrs.width + "px";
  }
  if (div.style.height === '' && attrs.height) {
    div.style.height = attrs.height + "px";
  }
  if (div.style.height === '' && div.clientHeight === 0) {
    div.style.height = Dygraph.DEFAULT_HEIGHT + "px";
    if (div.style.width === '') {
      div.style.width = Dygraph.DEFAULT_WIDTH + "px";
    }
  }
  // these will be zero if the dygraph's div is hidden.
  this.width_ = div.clientWidth;
  this.height_ = div.clientHeight;

  // TODO(danvk): set fillGraph to be part of attrs_ here, not user_attrs_.
  if (attrs.stackedGraph) {
    attrs.fillGraph = true;
    // TODO(nikhilk): Add any other stackedGraph checks here.
  }

  // Dygraphs has many options, some of which interact with one another.
  // To keep track of everything, we maintain two sets of options:
  //
  //  this.user_attrs_   only options explicitly set by the user.
  //  this.attrs_        defaults, options derived from user_attrs_, data.
  //
  // Options are then accessed this.attr_('attr'), which first looks at
  // user_attrs_ and then computed attrs_. This way Dygraphs can set intelligent
  // defaults without overriding behavior that the user specifically asks for.
  this.user_attrs_ = {};
  Dygraph.update(this.user_attrs_, attrs);

  // This sequence ensures that Dygraph.DEFAULT_ATTRS is never modified.
  this.attrs_ = {};
  Dygraph.updateDeep(this.attrs_, Dygraph.DEFAULT_ATTRS);

  this.boundaryIds_ = [];
  this.setIndexByName_ = {};
  this.datasetIndex_ = [];

  // Create the containing DIV and other interactive elements
  this.createInterface_();

  this.start_();
};

/**
 * Returns the zoomed status of the chart for one or both axes.
 *
 * Axis is an optional parameter. Can be set to 'x' or 'y'.
 *
 * The zoomed status for an axis is set whenever a user zooms using the mouse
 * or when the dateWindow or valueRange are updated (unless the isZoomedIgnoreProgrammaticZoom
 * option is also specified).
 */
Dygraph.prototype.isZoomed = function(axis) {
  if (axis == null) return this.zoomed_x_ || this.zoomed_y_;
  if (axis === 'x') return this.zoomed_x_;
  if (axis === 'y') return this.zoomed_y_;
  throw "axis parameter is [" + axis + "] must be null, 'x' or 'y'.";
};

/**
 * Returns information about the Dygraph object, including its containing ID.
 */
Dygraph.prototype.toString = function() {
  var maindiv = this.maindiv_;
  var id = (maindiv && maindiv.id) ? maindiv.id : maindiv;
  return "[Dygraph " + id + "]";
};

/**
 * @private
 * Returns the value of an option. This may be set by the user (either in the
 * constructor or by calling updateOptions) or by dygraphs, and may be set to a
 * per-series value.
 * @param { String } name The name of the option, e.g. 'rollPeriod'.
 * @param { String } [seriesName] The name of the series to which the option
 * will be applied. If no per-series value of this option is available, then
 * the global value is returned. This is optional.
 * @return { ... } The value of the option.
 */
Dygraph.prototype.attr_ = function(name, seriesName) {

  var sources = [];
  sources.push(this.attrs_);
  if (this.user_attrs_) {
    sources.push(this.user_attrs_);
    if (seriesName) {
      if (this.user_attrs_.hasOwnProperty(seriesName)) {
        sources.push(this.user_attrs_[seriesName]);
      }
      if (seriesName === this.highlightSet_ &&
          this.user_attrs_.hasOwnProperty('highlightSeriesOpts')) {
        sources.push(this.user_attrs_['highlightSeriesOpts']);
      }
    }
  }

  var ret = null;
  for (var i = sources.length - 1; i >= 0; --i) {
    var source = sources[i];
    if (source.hasOwnProperty(name)) {
      ret = source[name];
      break;
    }
  }
  return ret;
};

/**
 * @private
 * @param  String} axis The name of the axis (i.e. 'x', 'y' or 'y2')
 * @return { ... } A function mapping string -> option value
 */
Dygraph.prototype.optionsViewForAxis_ = function(axis) {
  var self = this;
  return function(opt) {
    var axis_opts = self.user_attrs_.axes;
    if (axis_opts && axis_opts[axis] && axis_opts[axis][opt]) {
      return axis_opts[axis][opt];
    }
    // user-specified attributes always trump defaults, even if they're less
    // specific.
    if (typeof(self.user_attrs_[opt]) != 'undefined') {
      return self.user_attrs_[opt];
    }

    axis_opts = self.attrs_.axes;
    if (axis_opts && axis_opts[axis] && axis_opts[axis][opt]) {
      return axis_opts[axis][opt];
    }
    // check old-style axis options
    // TODO(danvk): add a deprecation warning if either of these match.
    if (axis == 'y' && self.axes_[0].hasOwnProperty(opt)) {
      return self.axes_[0][opt];
    } else if (axis == 'y2' && self.axes_[1].hasOwnProperty(opt)) {
      return self.axes_[1][opt];
    }
    return self.attr_(opt);
  };
};

/**
 * Returns the current rolling period, as set by the user or an option.
 * @return {Number} The number of points in the rolling window
 */
Dygraph.prototype.rollPeriod = function() {
  return this.rollPeriod_;
};

/**
 * Returns the currently-visible x-range. This can be affected by zooming,
 * panning or a call to updateOptions.
 * Returns a two-element array: [left, right].
 * If the Dygraph has dates on the x-axis, these will be millis since epoch.
 */
Dygraph.prototype.xAxisRange = function() {
  return this.dateWindow_ ? this.dateWindow_ : this.xAxisExtremes();
};

/**
 * Returns the lower- and upper-bound x-axis values of the
 * data set.
 */
Dygraph.prototype.xAxisExtremes = function() {
  var left = this.rawData_[0][0];
  var right = this.rawData_[this.rawData_.length - 1][0];
  return [left, right];
};

/**
 * Returns the currently-visible y-range for an axis. This can be affected by
 * zooming, panning or a call to updateOptions. Axis indices are zero-based. If
 * called with no arguments, returns the range of the first axis.
 * Returns a two-element array: [bottom, top].
 */
Dygraph.prototype.yAxisRange = function(idx) {
  if (typeof(idx) == "undefined") idx = 0;
  if (idx < 0 || idx >= this.axes_.length) {
    return null;
  }
  var axis = this.axes_[idx];
  return [ axis.computedValueRange[0], axis.computedValueRange[1] ];
};

/**
 * Returns the currently-visible y-ranges for each axis. This can be affected by
 * zooming, panning, calls to updateOptions, etc.
 * Returns an array of [bottom, top] pairs, one for each y-axis.
 */
Dygraph.prototype.yAxisRanges = function() {
  var ret = [];
  for (var i = 0; i < this.axes_.length; i++) {
    ret.push(this.yAxisRange(i));
  }
  return ret;
};

// TODO(danvk): use these functions throughout dygraphs.
/**
 * Convert from data coordinates to canvas/div X/Y coordinates.
 * If specified, do this conversion for the coordinate system of a particular
 * axis. Uses the first axis by default.
 * Returns a two-element array: [X, Y]
 *
 * Note: use toDomXCoord instead of toDomCoords(x, null) and use toDomYCoord
 * instead of toDomCoords(null, y, axis).
 */
Dygraph.prototype.toDomCoords = function(x, y, axis) {
  return [ this.toDomXCoord(x), this.toDomYCoord(y, axis) ];
};

/**
 * Convert from data x coordinates to canvas/div X coordinate.
 * If specified, do this conversion for the coordinate system of a particular
 * axis.
 * Returns a single value or null if x is null.
 */
Dygraph.prototype.toDomXCoord = function(x) {
  if (x === null) {
    return null;
  }

  var area = this.plotter_.area;
  var xRange = this.xAxisRange();
  return area.x + (x - xRange[0]) / (xRange[1] - xRange[0]) * area.w;
};

/**
 * Convert from data x coordinates to canvas/div Y coordinate and optional
 * axis. Uses the first axis by default.
 *
 * returns a single value or null if y is null.
 */
Dygraph.prototype.toDomYCoord = function(y, axis) {
  var pct = this.toPercentYCoord(y, axis);

  if (pct === null) {
    return null;
  }
  var area = this.plotter_.area;
  return area.y + pct * area.h;
};

/**
 * Convert from canvas/div coords to data coordinates.
 * If specified, do this conversion for the coordinate system of a particular
 * axis. Uses the first axis by default.
 * Returns a two-element array: [X, Y].
 *
 * Note: use toDataXCoord instead of toDataCoords(x, null) and use toDataYCoord
 * instead of toDataCoords(null, y, axis).
 */
Dygraph.prototype.toDataCoords = function(x, y, axis) {
  return [ this.toDataXCoord(x), this.toDataYCoord(y, axis) ];
};

/**
 * Convert from canvas/div x coordinate to data coordinate.
 *
 * If x is null, this returns null.
 */
Dygraph.prototype.toDataXCoord = function(x) {
  if (x === null) {
    return null;
  }

  var area = this.plotter_.area;
  var xRange = this.xAxisRange();
  return xRange[0] + (x - area.x) / area.w * (xRange[1] - xRange[0]);
};

/**
 * Convert from canvas/div y coord to value.
 *
 * If y is null, this returns null.
 * if axis is null, this uses the first axis.
 */
Dygraph.prototype.toDataYCoord = function(y, axis) {
  if (y === null) {
    return null;
  }

  var area = this.plotter_.area;
  var yRange = this.yAxisRange(axis);

  if (typeof(axis) == "undefined") axis = 0;
  if (!this.axes_[axis].logscale) {
    return yRange[0] + (area.y + area.h - y) / area.h * (yRange[1] - yRange[0]);
  } else {
    // Computing the inverse of toDomCoord.
    var pct = (y - area.y) / area.h;

    // Computing the inverse of toPercentYCoord. The function was arrived at with
    // the following steps:
    //
    // Original calcuation:
    // pct = (logr1 - Dygraph.log10(y)) / (logr1 - Dygraph.log10(yRange[0]));
    //
    // Move denominator to both sides:
    // pct * (logr1 - Dygraph.log10(yRange[0])) = logr1 - Dygraph.log10(y);
    //
    // subtract logr1, and take the negative value.
    // logr1 - (pct * (logr1 - Dygraph.log10(yRange[0]))) = Dygraph.log10(y);
    //
    // Swap both sides of the equation, and we can compute the log of the
    // return value. Which means we just need to use that as the exponent in
    // e^exponent.
    // Dygraph.log10(y) = logr1 - (pct * (logr1 - Dygraph.log10(yRange[0])));

    var logr1 = Dygraph.log10(yRange[1]);
    var exponent = logr1 - (pct * (logr1 - Dygraph.log10(yRange[0])));
    var value = Math.pow(Dygraph.LOG_SCALE, exponent);
    return value;
  }
};

/**
 * Converts a y for an axis to a percentage from the top to the
 * bottom of the drawing area.
 *
 * If the coordinate represents a value visible on the canvas, then
 * the value will be between 0 and 1, where 0 is the top of the canvas.
 * However, this method will return values outside the range, as
 * values can fall outside the canvas.
 *
 * If y is null, this returns null.
 * if axis is null, this uses the first axis.
 *
 * @param { Number } y The data y-coordinate.
 * @param { Number } [axis] The axis number on which the data coordinate lives.
 * @return { Number } A fraction in [0, 1] where 0 = the top edge.
 */
Dygraph.prototype.toPercentYCoord = function(y, axis) {
  if (y === null) {
    return null;
  }
  if (typeof(axis) == "undefined") axis = 0;

  var yRange = this.yAxisRange(axis);

  var pct;
  if (!this.axes_[axis].logscale) {
    // yRange[1] - y is unit distance from the bottom.
    // yRange[1] - yRange[0] is the scale of the range.
    // (yRange[1] - y) / (yRange[1] - yRange[0]) is the % from the bottom.
    pct = (yRange[1] - y) / (yRange[1] - yRange[0]);
  } else {
    var logr1 = Dygraph.log10(yRange[1]);
    pct = (logr1 - Dygraph.log10(y)) / (logr1 - Dygraph.log10(yRange[0]));
  }
  return pct;
};

/**
 * Converts an x value to a percentage from the left to the right of
 * the drawing area.
 *
 * If the coordinate represents a value visible on the canvas, then
 * the value will be between 0 and 1, where 0 is the left of the canvas.
 * However, this method will return values outside the range, as
 * values can fall outside the canvas.
 *
 * If x is null, this returns null.
 * @param { Number } x The data x-coordinate.
 * @return { Number } A fraction in [0, 1] where 0 = the left edge.
 */
Dygraph.prototype.toPercentXCoord = function(x) {
  if (x === null) {
    return null;
  }

  var xRange = this.xAxisRange();
  return (x - xRange[0]) / (xRange[1] - xRange[0]);
};

/**
 * Returns the number of columns (including the independent variable).
 * @return { Integer } The number of columns.
 */
Dygraph.prototype.numColumns = function() {
  return this.rawData_[0] ? this.rawData_[0].length : this.attr_("labels").length;
};

/**
 * Returns the number of rows (excluding any header/label row).
 * @return { Integer } The number of rows, less any header.
 */
Dygraph.prototype.numRows = function() {
  return this.rawData_.length;
};

/**
 * Returns the full range of the x-axis, as determined by the most extreme
 * values in the data set. Not affected by zooming, visibility, etc.
 * TODO(danvk): merge w/ xAxisExtremes
 * @return { Array<Number> } A [low, high] pair
 * @private
 */
Dygraph.prototype.fullXRange_ = function() {
  if (this.numRows() > 0) {
    return [this.rawData_[0][0], this.rawData_[this.numRows() - 1][0]];
  } else {
    return [0, 1];
  }
};

/**
 * Returns the value in the given row and column. If the row and column exceed
 * the bounds on the data, returns null. Also returns null if the value is
 * missing.
 * @param { Number} row The row number of the data (0-based). Row 0 is the
 * first row of data, not a header row.
 * @param { Number} col The column number of the data (0-based)
 * @return { Number } The value in the specified cell or null if the row/col
 * were out of range.
 */
Dygraph.prototype.getValue = function(row, col) {
  if (row < 0 || row > this.rawData_.length) return null;
  if (col < 0 || col > this.rawData_[row].length) return null;

  return this.rawData_[row][col];
};

/**
 * Generates interface elements for the Dygraph: a containing div, a div to
 * display the current point, and a textbox to adjust the rolling average
 * period. Also creates the Renderer/Layout elements.
 * @private
 */
Dygraph.prototype.createInterface_ = function() {
  // Create the all-enclosing graph div
  var enclosing = this.maindiv_;

  this.graphDiv = document.createElement("div");
  this.graphDiv.style.width = this.width_ + "px";
  this.graphDiv.style.height = this.height_ + "px";
  enclosing.appendChild(this.graphDiv);

  // Create the canvas for interactive parts of the chart.
  this.canvas_ = Dygraph.createCanvas();
  this.canvas_.style.position = "absolute";
  this.canvas_.width = this.width_;
  this.canvas_.height = this.height_;
  this.canvas_.style.width = this.width_ + "px";    // for IE
  this.canvas_.style.height = this.height_ + "px";  // for IE

  this.canvas_ctx_ = Dygraph.getContext(this.canvas_);

  // ... and for static parts of the chart.
  this.hidden_ = this.createPlotKitCanvas_(this.canvas_);
  this.hidden_ctx_ = Dygraph.getContext(this.hidden_);

  if (this.attr_('showRangeSelector')) {
    // The range selector must be created here so that its canvases and contexts get created here.
    // For some reason, if the canvases and contexts don't get created here, things don't work in IE.
    // The range selector also sets xAxisHeight in order to reserve space.
    this.rangeSelector_ = new DygraphRangeSelector(this);
  }

  // The interactive parts of the graph are drawn on top of the chart.
  this.graphDiv.appendChild(this.hidden_);
  this.graphDiv.appendChild(this.canvas_);
  this.mouseEventElement_ = this.createMouseEventElement_();

  // Create the grapher
  this.layout_ = new DygraphLayout(this);

  if (this.rangeSelector_) {
    // This needs to happen after the graph canvases are added to the div and the layout object is created.
    this.rangeSelector_.addToGraph(this.graphDiv, this.layout_);
  }

  var dygraph = this;
  
  this.mouseMoveHandler = function(e) {
    dygraph.mouseMove_(e);
  };
  Dygraph.addEvent(this.mouseEventElement_, 'mousemove', this.mouseMoveHandler);
  
  this.mouseOutHandler = function(e) {
    dygraph.mouseOut_(e);
  };
  Dygraph.addEvent(this.mouseEventElement_, 'mouseout', this.mouseOutHandler);

  this.createStatusMessage_();
  this.createDragInterface_();

  this.resizeHandler = function(e) {
    dygraph.resize();
  };

  // Update when the window is resized.
  // TODO(danvk): drop frames depending on complexity of the chart.
  Dygraph.addEvent(window, 'resize', this.resizeHandler);
};

/**
 * Detach DOM elements in the dygraph and null out all data references.
 * Calling this when you're done with a dygraph can dramatically reduce memory
 * usage. See, e.g., the tests/perf.html example.
 */
Dygraph.prototype.destroy = function() {
  var removeRecursive = function(node) {
    while (node.hasChildNodes()) {
      removeRecursive(node.firstChild);
      node.removeChild(node.firstChild);
    }
  };
  
  // remove mouse event handlers
  Dygraph.removeEvent(this.mouseEventElement_, 'mouseout', this.mouseOutHandler);
  Dygraph.removeEvent(this.mouseEventElement_, 'mousemove', this.mouseMoveHandler);
  Dygraph.removeEvent(this.mouseEventElement_, 'mousemove', this.mouseUpHandler_);
  removeRecursive(this.maindiv_);

  var nullOut = function(obj) {
    for (var n in obj) {
      if (typeof(obj[n]) === 'object') {
        obj[n] = null;
      }
    }
  };
  // remove event handlers
  Dygraph.removeEvent(window,'resize',this.resizeHandler);
  this.resizeHandler = null;
  // These may not all be necessary, but it can't hurt...
  nullOut(this.layout_);
  nullOut(this.plotter_);
  nullOut(this);
};

/**
 * Creates the canvas on which the chart will be drawn. Only the Renderer ever
 * draws on this particular canvas. All Dygraph work (i.e. drawing hover dots
 * or the zoom rectangles) is done on this.canvas_.
 * @param {Object} canvas The Dygraph canvas over which to overlay the plot
 * @return {Object} The newly-created canvas
 * @private
 */
Dygraph.prototype.createPlotKitCanvas_ = function(canvas) {
  var h = Dygraph.createCanvas();
  h.style.position = "absolute";
  // TODO(danvk): h should be offset from canvas. canvas needs to include
  // some extra area to make it easier to zoom in on the far left and far
  // right. h needs to be precisely the plot area, so that clipping occurs.
  h.style.top = canvas.style.top;
  h.style.left = canvas.style.left;
  h.width = this.width_;
  h.height = this.height_;
  h.style.width = this.width_ + "px";    // for IE
  h.style.height = this.height_ + "px";  // for IE
  return h;
};

/**
 * Creates an overlay element used to handle mouse events.
 * @return {Object} The mouse event element.
 * @private
 */
Dygraph.prototype.createMouseEventElement_ = function() {
  if (this.isUsingExcanvas_) {
    var elem = document.createElement("div");
    elem.style.position = 'absolute';
    elem.style.backgroundColor = 'white';
    elem.style.filter = 'alpha(opacity=0)';
    elem.style.width = this.width_ + "px";
    elem.style.height = this.height_ + "px";
    this.graphDiv.appendChild(elem);
    return elem;
  } else {
    return this.canvas_;
  }
};

/**
 * Generate a set of distinct colors for the data series. This is done with a
 * color wheel. Saturation/Value are customizable, and the hue is
 * equally-spaced around the color wheel. If a custom set of colors is
 * specified, that is used instead.
 * @private
 */
Dygraph.prototype.setColors_ = function() {
  var num = this.attr_("labels").length - 1;
  this.colors_ = [];
  var colors = this.attr_('colors');
  var i;
  if (!colors) {
    var sat = this.attr_('colorSaturation') || 1.0;
    var val = this.attr_('colorValue') || 0.5;
    var half = Math.ceil(num / 2);
    for (i = 1; i <= num; i++) {
      if (!this.visibility()[i-1]) continue;
      // alternate colors for high contrast.
      var idx = i % 2 ? Math.ceil(i / 2) : (half + i / 2);
      var hue = (1.0 * idx/ (1 + num));
      this.colors_.push(Dygraph.hsvToRGB(hue, sat, val));
    }
  } else {
    for (i = 0; i < num; i++) {
      if (!this.visibility()[i]) continue;
      var colorStr = colors[i % colors.length];
      this.colors_.push(colorStr);
    }
  }

  this.plotter_.setColors(this.colors_);
};

/**
 * Return the list of colors. This is either the list of colors passed in the
 * attributes or the autogenerated list of rgb(r,g,b) strings.
 * @return {Array<string>} The list of colors.
 */
Dygraph.prototype.getColors = function() {
  return this.colors_;
};

/**
 * Create the div that contains information on the selected point(s)
 * This goes in the top right of the canvas, unless an external div has already
 * been specified.
 * @private
 */
Dygraph.prototype.createStatusMessage_ = function() {
  var userLabelsDiv = this.user_attrs_.labelsDiv;
  if (userLabelsDiv && null !== userLabelsDiv &&
      (typeof(userLabelsDiv) == "string" || userLabelsDiv instanceof String)) {
    this.user_attrs_.labelsDiv = document.getElementById(userLabelsDiv);
  }
  if (!this.attr_("labelsDiv")) {
    var divWidth = this.attr_('labelsDivWidth');
    var messagestyle = {
      "position": "absolute",
      "fontSize": "14px",
      "zIndex": 10,
      "width": divWidth + "px",
      "top": "0px",
      "left": (this.width_ - divWidth - 2) + "px",
      "background": "white",
      "lineHeight": "normal",
      "textAlign": "left",
      "overflow": "hidden"};
    Dygraph.update(messagestyle, this.attr_('labelsDivStyles'));
    var div = document.createElement("div");
    div.className = "dygraph-legend";
    for (var name in messagestyle) {
      if (messagestyle.hasOwnProperty(name)) {
        try {
          div.style[name] = messagestyle[name];
        } catch (e) {
          this.warn("You are using unsupported css properties for your browser in labelsDivStyles");
        }
      }
    }
    this.graphDiv.appendChild(div);
    this.attrs_.labelsDiv = div;
  }
};

/**
 * Position the labels div so that:
 * - its right edge is flush with the right edge of the charting area
 * - its top edge is flush with the top edge of the charting area
 * @private
 */
Dygraph.prototype.positionLabelsDiv_ = function() {
  // Don't touch a user-specified labelsDiv.
  if (this.user_attrs_.hasOwnProperty("labelsDiv")) return;

  var area = this.plotter_.area;
  var div = this.attr_("labelsDiv");
  div.style.left = area.x + area.w - this.attr_("labelsDivWidth") - 1 + "px";
  div.style.top = area.y + "px";
};

/**
 * Create the text box to adjust the averaging period
 * @private
 */
Dygraph.prototype.createRollInterface_ = function() {
  // Create a roller if one doesn't exist already.
  if (!this.roller_) {
    this.roller_ = document.createElement("input");
    this.roller_.type = "text";
    this.roller_.style.display = "none";
    this.graphDiv.appendChild(this.roller_);
  }

  var display = this.attr_('showRoller') ? 'block' : 'none';

  var area = this.plotter_.area;
  var textAttr = { "position": "absolute",
                   "zIndex": 10,
                   "top": (area.y + area.h - 25) + "px",
                   "left": (area.x + 1) + "px",
                   "display": display
                  };
  this.roller_.size = "2";
  this.roller_.value = this.rollPeriod_;
  for (var name in textAttr) {
    if (textAttr.hasOwnProperty(name)) {
      this.roller_.style[name] = textAttr[name];
    }
  }

  var dygraph = this;
  this.roller_.onchange = function() { dygraph.adjustRoll(dygraph.roller_.value); };
};

/**
 * @private
 * Converts page the x-coordinate of the event to pixel x-coordinates on the
 * canvas (i.e. DOM Coords).
 */
Dygraph.prototype.dragGetX_ = function(e, context) {
  return Dygraph.pageX(e) - context.px;
};

/**
 * @private
 * Converts page the y-coordinate of the event to pixel y-coordinates on the
 * canvas (i.e. DOM Coords).
 */
Dygraph.prototype.dragGetY_ = function(e, context) {
  return Dygraph.pageY(e) - context.py;
};

/**
 * Set up all the mouse handlers needed to capture dragging behavior for zoom
 * events.
 * @private
 */
Dygraph.prototype.createDragInterface_ = function() {
  var context = {
    // Tracks whether the mouse is down right now
    isZooming: false,
    isPanning: false,  // is this drag part of a pan?
    is2DPan: false,    // if so, is that pan 1- or 2-dimensional?
    dragStartX: null, // pixel coordinates
    dragStartY: null, // pixel coordinates
    dragEndX: null, // pixel coordinates
    dragEndY: null, // pixel coordinates
    dragDirection: null,
    prevEndX: null, // pixel coordinates
    prevEndY: null, // pixel coordinates
    prevDragDirection: null,
    cancelNextDblclick: false,  // see comment in dygraph-interaction-model.js

    // The value on the left side of the graph when a pan operation starts.
    initialLeftmostDate: null,

    // The number of units each pixel spans. (This won't be valid for log
    // scales)
    xUnitsPerPixel: null,

    // TODO(danvk): update this comment
    // The range in second/value units that the viewport encompasses during a
    // panning operation.
    dateRange: null,

    // Top-left corner of the canvas, in DOM coords
    // TODO(konigsberg): Rename topLeftCanvasX, topLeftCanvasY.
    px: 0,
    py: 0,

    // Values for use with panEdgeFraction, which limit how far outside the
    // graph's data boundaries it can be panned.
    boundedDates: null, // [minDate, maxDate]
    boundedValues: null, // [[minValue, maxValue] ...]

    initializeMouseDown: function(event, g, context) {
      // prevents mouse drags from selecting page text.
      if (event.preventDefault) {
        event.preventDefault();  // Firefox, Chrome, etc.
      } else {
        event.returnValue = false;  // IE
        event.cancelBubble = true;
      }

      context.px = Dygraph.findPosX(g.canvas_);
      context.py = Dygraph.findPosY(g.canvas_);
      context.dragStartX = g.dragGetX_(event, context);
      context.dragStartY = g.dragGetY_(event, context);
      context.cancelNextDblclick = false;
    }
  };

  var interactionModel = this.attr_("interactionModel");

  // Self is the graph.
  var self = this;

  // Function that binds the graph and context to the handler.
  var bindHandler = function(handler) {
    return function(event) {
      handler(event, self, context);
    };
  };

  for (var eventName in interactionModel) {
    if (!interactionModel.hasOwnProperty(eventName)) continue;
    Dygraph.addEvent(this.mouseEventElement_, eventName,
        bindHandler(interactionModel[eventName]));
  }

  // If the user releases the mouse button during a drag, but not over the
  // canvas, then it doesn't count as a zooming action.
  this.mouseUpHandler_ = function(event) {
    if (context.isZooming || context.isPanning) {
      context.isZooming = false;
      context.dragStartX = null;
      context.dragStartY = null;
    }

    if (context.isPanning) {
      context.isPanning = false;
      context.draggingDate = null;
      context.dateRange = null;
      for (var i = 0; i < self.axes_.length; i++) {
        delete self.axes_[i].draggingValue;
        delete self.axes_[i].dragValueRange;
      }
    }
  };

  Dygraph.addEvent(document, 'mouseup', this.mouseUpHandler_);
};

/**
 * Draw a gray zoom rectangle over the desired area of the canvas. Also clears
 * up any previous zoom rectangles that were drawn. This could be optimized to
 * avoid extra redrawing, but it's tricky to avoid interactions with the status
 * dots.
 *
 * @param {Number} direction the direction of the zoom rectangle. Acceptable
 * values are Dygraph.HORIZONTAL and Dygraph.VERTICAL.
 * @param {Number} startX The X position where the drag started, in canvas
 * coordinates.
 * @param {Number} endX The current X position of the drag, in canvas coords.
 * @param {Number} startY The Y position where the drag started, in canvas
 * coordinates.
 * @param {Number} endY The current Y position of the drag, in canvas coords.
 * @param {Number} prevDirection the value of direction on the previous call to
 * this function. Used to avoid excess redrawing
 * @param {Number} prevEndX The value of endX on the previous call to this
 * function. Used to avoid excess redrawing
 * @param {Number} prevEndY The value of endY on the previous call to this
 * function. Used to avoid excess redrawing
 * @private
 */
Dygraph.prototype.drawZoomRect_ = function(direction, startX, endX, startY,
                                           endY, prevDirection, prevEndX,
                                           prevEndY) {
  var ctx = this.canvas_ctx_;

  // Clean up from the previous rect if necessary
  if (prevDirection == Dygraph.HORIZONTAL) {
    ctx.clearRect(Math.min(startX, prevEndX), this.layout_.getPlotArea().y,
                  Math.abs(startX - prevEndX), this.layout_.getPlotArea().h);
  } else if (prevDirection == Dygraph.VERTICAL){
    ctx.clearRect(this.layout_.getPlotArea().x, Math.min(startY, prevEndY),
                  this.layout_.getPlotArea().w, Math.abs(startY - prevEndY));
  }

  // Draw a light-grey rectangle to show the new viewing area
  if (direction == Dygraph.HORIZONTAL) {
    if (endX && startX) {
      ctx.fillStyle = "rgba(128,128,128,0.33)";
      ctx.fillRect(Math.min(startX, endX), this.layout_.getPlotArea().y,
                   Math.abs(endX - startX), this.layout_.getPlotArea().h);
    }
  } else if (direction == Dygraph.VERTICAL) {
    if (endY && startY) {
      ctx.fillStyle = "rgba(128,128,128,0.33)";
      ctx.fillRect(this.layout_.getPlotArea().x, Math.min(startY, endY),
                   this.layout_.getPlotArea().w, Math.abs(endY - startY));
    }
  }

  if (this.isUsingExcanvas_) {
    this.currentZoomRectArgs_ = [direction, startX, endX, startY, endY, 0, 0, 0];
  }
};

/**
 * Clear the zoom rectangle (and perform no zoom).
 * @private
 */
Dygraph.prototype.clearZoomRect_ = function() {
  this.currentZoomRectArgs_ = null;
  this.canvas_ctx_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
};

/**
 * Zoom to something containing [lowX, highX]. These are pixel coordinates in
 * the canvas. The exact zoom window may be slightly larger if there are no data
 * points near lowX or highX. Don't confuse this function with doZoomXDates,
 * which accepts dates that match the raw data. This function redraws the graph.
 *
 * @param {Number} lowX The leftmost pixel value that should be visible.
 * @param {Number} highX The rightmost pixel value that should be visible.
 * @private
 */
Dygraph.prototype.doZoomX_ = function(lowX, highX) {
  this.currentZoomRectArgs_ = null;
  // Find the earliest and latest dates contained in this canvasx range.
  // Convert the call to date ranges of the raw data.
  var minDate = this.toDataXCoord(lowX);
  var maxDate = this.toDataXCoord(highX);
  this.doZoomXDates_(minDate, maxDate);
};

/**
 * Transition function to use in animations. Returns values between 0.0
 * (totally old values) and 1.0 (totally new values) for each frame.
 * @private
 */
Dygraph.zoomAnimationFunction = function(frame, numFrames) {
  var k = 1.5;
  return (1.0 - Math.pow(k, -frame)) / (1.0 - Math.pow(k, -numFrames));
};

/**
 * Zoom to something containing [minDate, maxDate] values. Don't confuse this
 * method with doZoomX which accepts pixel coordinates. This function redraws
 * the graph.
 *
 * @param {Number} minDate The minimum date that should be visible.
 * @param {Number} maxDate The maximum date that should be visible.
 * @private
 */
Dygraph.prototype.doZoomXDates_ = function(minDate, maxDate) {
  // TODO(danvk): when yAxisRange is null (i.e. "fit to data", the animation
  // can produce strange effects. Rather than the y-axis transitioning slowly
  // between values, it can jerk around.)
  var old_window = this.xAxisRange();
  var new_window = [minDate, maxDate];
  this.zoomed_x_ = true;
  var that = this;
  this.doAnimatedZoom(old_window, new_window, null, null, function() {
    if (that.attr_("zoomCallback")) {
      that.attr_("zoomCallback")(minDate, maxDate, that.yAxisRanges());
    }
  });
};

/**
 * Zoom to something containing [lowY, highY]. These are pixel coordinates in
 * the canvas. This function redraws the graph.
 *
 * @param {Number} lowY The topmost pixel value that should be visible.
 * @param {Number} highY The lowest pixel value that should be visible.
 * @private
 */
Dygraph.prototype.doZoomY_ = function(lowY, highY) {
  this.currentZoomRectArgs_ = null;
  // Find the highest and lowest values in pixel range for each axis.
  // Note that lowY (in pixels) corresponds to the max Value (in data coords).
  // This is because pixels increase as you go down on the screen, whereas data
  // coordinates increase as you go up the screen.
  var oldValueRanges = this.yAxisRanges();
  var newValueRanges = [];
  for (var i = 0; i < this.axes_.length; i++) {
    var hi = this.toDataYCoord(lowY, i);
    var low = this.toDataYCoord(highY, i);
    newValueRanges.push([low, hi]);
  }

  this.zoomed_y_ = true;
  var that = this;
  this.doAnimatedZoom(null, null, oldValueRanges, newValueRanges, function() {
    if (that.attr_("zoomCallback")) {
      var xRange = that.xAxisRange();
      that.attr_("zoomCallback")(xRange[0], xRange[1], that.yAxisRanges());
    }
  });
};

/**
 * Reset the zoom to the original view coordinates. This is the same as
 * double-clicking on the graph.
 *
 * @private
 */
Dygraph.prototype.doUnzoom_ = function() {
  var dirty = false, dirtyX = false, dirtyY = false;
  if (this.dateWindow_ !== null) {
    dirty = true;
    dirtyX = true;
  }

  for (var i = 0; i < this.axes_.length; i++) {
    if (typeof(this.axes_[i].valueWindow) !== 'undefined' && this.axes_[i].valueWindow !== null) {
      dirty = true;
      dirtyY = true;
    }
  }

  // Clear any selection, since it's likely to be drawn in the wrong place.
  this.clearSelection();

  if (dirty) {
    this.zoomed_x_ = false;
    this.zoomed_y_ = false;

    var minDate = this.rawData_[0][0];
    var maxDate = this.rawData_[this.rawData_.length - 1][0];

    // With only one frame, don't bother calculating extreme ranges.
    // TODO(danvk): merge this block w/ the code below.
    if (!this.attr_("animatedZooms")) {
      this.dateWindow_ = null;
      for (i = 0; i < this.axes_.length; i++) {
        if (this.axes_[i].valueWindow !== null) {
          delete this.axes_[i].valueWindow;
        }
      }
      this.drawGraph_();
      if (this.attr_("zoomCallback")) {
        this.attr_("zoomCallback")(minDate, maxDate, this.yAxisRanges());
      }
      return;
    }

    var oldWindow=null, newWindow=null, oldValueRanges=null, newValueRanges=null;
    if (dirtyX) {
      oldWindow = this.xAxisRange();
      newWindow = [minDate, maxDate];
    }

    if (dirtyY) {
      oldValueRanges = this.yAxisRanges();
      // TODO(danvk): this is pretty inefficient
      var packed = this.gatherDatasets_(this.rolledSeries_, null);
      var extremes = packed[1];

      // this has the side-effect of modifying this.axes_.
      // this doesn't make much sense in this context, but it's convenient (we
      // need this.axes_[*].extremeValues) and not harmful since we'll be
      // calling drawGraph_ shortly, which clobbers these values.
      this.computeYAxisRanges_(extremes);

      newValueRanges = [];
      for (i = 0; i < this.axes_.length; i++) {
        var axis = this.axes_[i];
        newValueRanges.push(axis.valueRange != null ? axis.valueRange : axis.extremeRange);
      }
    }

    var that = this;
    this.doAnimatedZoom(oldWindow, newWindow, oldValueRanges, newValueRanges,
        function() {
          that.dateWindow_ = null;
          for (var i = 0; i < that.axes_.length; i++) {
            if (that.axes_[i].valueWindow !== null) {
              delete that.axes_[i].valueWindow;
            }
          }
          if (that.attr_("zoomCallback")) {
            that.attr_("zoomCallback")(minDate, maxDate, that.yAxisRanges());
          }
        });
  }
};

/**
 * Combined animation logic for all zoom functions.
 * either the x parameters or y parameters may be null.
 * @private
 */
Dygraph.prototype.doAnimatedZoom = function(oldXRange, newXRange, oldYRanges, newYRanges, callback) {
  var steps = this.attr_("animatedZooms") ? Dygraph.ANIMATION_STEPS : 1;

  var windows = [];
  var valueRanges = [];
  var step, frac;

  if (oldXRange !== null && newXRange !== null) {
    for (step = 1; step <= steps; step++) {
      frac = Dygraph.zoomAnimationFunction(step, steps);
      windows[step-1] = [oldXRange[0]*(1-frac) + frac*newXRange[0],
                         oldXRange[1]*(1-frac) + frac*newXRange[1]];
    }
  }

  if (oldYRanges !== null && newYRanges !== null) {
    for (step = 1; step <= steps; step++) {
      frac = Dygraph.zoomAnimationFunction(step, steps);
      var thisRange = [];
      for (var j = 0; j < this.axes_.length; j++) {
        thisRange.push([oldYRanges[j][0]*(1-frac) + frac*newYRanges[j][0],
                        oldYRanges[j][1]*(1-frac) + frac*newYRanges[j][1]]);
      }
      valueRanges[step-1] = thisRange;
    }
  }

  var that = this;
  Dygraph.repeatAndCleanup(function(step) {
    if (valueRanges.length) {
      for (var i = 0; i < that.axes_.length; i++) {
        var w = valueRanges[step][i];
        that.axes_[i].valueWindow = [w[0], w[1]];
      }
    }
    if (windows.length) {
      that.dateWindow_ = windows[step];
    }
    that.drawGraph_();
  }, steps, Dygraph.ANIMATION_DURATION / steps, callback);
};

/**
 * Get the current graph's area object.
 *
 * Returns: {x, y, w, h}
 */
Dygraph.prototype.getArea = function() {
  return this.plotter_.area;
};

/**
 * Convert a mouse event to DOM coordinates relative to the graph origin.
 *
 * Returns a two-element array: [X, Y].
 */
Dygraph.prototype.eventToDomCoords = function(event) {
  var canvasx = Dygraph.pageX(event) - Dygraph.findPosX(this.mouseEventElement_);
  var canvasy = Dygraph.pageY(event) - Dygraph.findPosY(this.mouseEventElement_);
  return [canvasx, canvasy];
};

/**
 * Given a canvas X coordinate, find the closest row.
 * @param {Number} domX graph-relative DOM X coordinate
 * Returns: row number, integer
 * @private
 */
Dygraph.prototype.findClosestRow = function(domX) {
  var minDistX = Infinity;
  var idx = -1;
  var points = this.layout_.points;
  var l = points.length;
  for (var i = 0; i < l; i++) {
    var point = points[i];
    if (!Dygraph.isValidPoint(point, true)) continue;
    var dist = Math.abs(point.canvasx - domX);
    if (dist < minDistX) {
      minDistX = dist;
      idx = i;
    }
  }
  return this.idxToRow_(idx);
};

/**
 * Given canvas X,Y coordinates, find the closest point.
 *
 * This finds the individual data point across all visible series
 * that's closest to the supplied DOM coordinates using the standard
 * Euclidean X,Y distance.
 *
 * @param {Number} domX graph-relative DOM X coordinate
 * @param {Number} domY graph-relative DOM Y coordinate
 * Returns: {row, seriesName, point}
 * @private
 */
Dygraph.prototype.findClosestPoint = function(domX, domY) {
  var minDist = Infinity;
  var idx = -1;
  var points = this.layout_.points;
  var dist, dx, dy, point, closestPoint, closestSeries;
  for (var setIdx = 0; setIdx < this.layout_.datasets.length; ++setIdx) {
    var first = this.layout_.setPointsOffsets[setIdx];
    var len = this.layout_.setPointsLengths[setIdx];
    for (var i = 0; i < len; ++i) {
      var point = points[first + i];
      if (!Dygraph.isValidPoint(point)) continue;
      dx = point.canvasx - domX;
      dy = point.canvasy - domY;
      dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        closestPoint = point;
        closestSeries = setIdx;
        idx = i;
      }
    }
  }
  var name = this.layout_.setNames[closestSeries];
  return {
    row: idx + this.getLeftBoundary_(),
    seriesName: name,
    point: closestPoint
  };
};

/**
 * Given canvas X,Y coordinates, find the touched area in a stacked graph.
 *
 * This first finds the X data point closest to the supplied DOM X coordinate,
 * then finds the series which puts the Y coordinate on top of its filled area,
 * using linear interpolation between adjacent point pairs.
 *
 * @param {Number} domX graph-relative DOM X coordinate
 * @param {Number} domY graph-relative DOM Y coordinate
 * Returns: {row, seriesName, point}
 * @private
 */
Dygraph.prototype.findStackedPoint = function(domX, domY) {
  var row = this.findClosestRow(domX);
  var boundary = this.getLeftBoundary_();
  var rowIdx = row - boundary;
  var points = this.layout_.points;
  var closestPoint, closestSeries;
  for (var setIdx = 0; setIdx < this.layout_.datasets.length; ++setIdx) {
    var first = this.layout_.setPointsOffsets[setIdx];
    var len = this.layout_.setPointsLengths[setIdx];
    if (rowIdx >= len) continue;
    var p1 = points[first + rowIdx];
    if (!Dygraph.isValidPoint(p1)) continue;
    var py = p1.canvasy;
    if (domX > p1.canvasx && rowIdx + 1 < len) {
      // interpolate series Y value using next point
      var p2 = points[first + rowIdx + 1];
      if (Dygraph.isValidPoint(p2)) {
        var dx = p2.canvasx - p1.canvasx;
        if (dx > 0) {
          var r = (domX - p1.canvasx) / dx;
          py += r * (p2.canvasy - p1.canvasy);
        }
      }
    } else if (domX < p1.canvasx && rowIdx > 0) {
      // interpolate series Y value using previous point
      var p0 = points[first + rowIdx - 1];
      if (Dygraph.isValidPoint(p0)) {
        var dx = p1.canvasx - p0.canvasx;
        if (dx > 0) {
          var r = (p1.canvasx - domX) / dx;
          py += r * (p0.canvasy - p1.canvasy);
        }
      }
    }
    // Stop if the point (domX, py) is above this series' upper edge
    if (setIdx == 0 || py < domY) {
      closestPoint = p1;
      closestSeries = setIdx;
    }
  }
  var name = this.layout_.setNames[closestSeries];
  return {
    row: row,
    seriesName: name,
    point: closestPoint
  };
};

/**
 * When the mouse moves in the canvas, display information about a nearby data
 * point and draw dots over those points in the data series. This function
 * takes care of cleanup of previously-drawn dots.
 * @param {Object} event The mousemove event from the browser.
 * @private
 */
Dygraph.prototype.mouseMove_ = function(event) {
  // This prevents JS errors when mousing over the canvas before data loads.
  var points = this.layout_.points;
  if (points === undefined) return;

  var canvasCoords = this.eventToDomCoords(event);
  var canvasx = canvasCoords[0];
  var canvasy = canvasCoords[1];

  var highlightSeriesOpts = this.attr_("highlightSeriesOpts");
  var selectionChanged = false;
  if (highlightSeriesOpts) {
    var closest;
    if (this.attr_("stackedGraph")) {
      closest = this.findStackedPoint(canvasx, canvasy);
    } else {
      closest = this.findClosestPoint(canvasx, canvasy);
    }
    selectionChanged = this.setSelection(closest.row, closest.seriesName);
  } else {
    var idx = this.findClosestRow(canvasx);
    selectionChanged = this.setSelection(idx);
  }

  var callback = this.attr_("highlightCallback");
  if (callback && selectionChanged) {
    callback(event, this.lastx_, this.selPoints_, this.lastRow_, this.highlightSet_);
  }
};

/**
 * Fetch left offset from first defined boundaryIds record (see bug #236).
 */
Dygraph.prototype.getLeftBoundary_ = function() {
  for (var i = 0; i < this.boundaryIds_.length; i++) {
    if (this.boundaryIds_[i] !== undefined) {
      return this.boundaryIds_[i][0];
    }
  }
  return 0;
};

/**
 * Transforms layout_.points index into data row number.
 * @param int layout_.points index
 * @return int row number, or -1 if none could be found.
 * @private
 */
Dygraph.prototype.idxToRow_ = function(idx) {
  if (idx < 0) return -1;

  var boundary = this.getLeftBoundary_();
  for (var setIdx = 0; setIdx < this.layout_.datasets.length; ++setIdx) {
    var set = this.layout_.datasets[setIdx];
    if (idx < set.length) {
      return boundary + idx;
    }
    idx -= set.length;
  }
  return -1;
};

/**
 * @private
 * Generates legend html dash for any stroke pattern. It will try to scale the
 * pattern to fit in 1em width. Or if small enough repeat the partern for 1em
 * width.
 * @param strokePattern The pattern
 * @param color The color of the series.
 * @param oneEmWidth The width in pixels of 1em in the legend.
 */
Dygraph.prototype.generateLegendDashHTML_ = function(strokePattern, color, oneEmWidth) {
  var dash = "";
  var i, j, paddingLeft, marginRight;
  var strokePixelLength = 0, segmentLoop = 0;
  var normalizedPattern = [];
  var loop;
  // IE 7,8 fail at these divs, so they get boring legend, have not tested 9.
  var isIE = (/MSIE/.test(navigator.userAgent) && !window.opera);
  if(isIE) {
    return "&mdash;";
  }
  if (!strokePattern || strokePattern.length <= 1) {
    // Solid line
    dash = "<div style=\"display: inline-block; position: relative; " +
    "bottom: .5ex; padding-left: 1em; height: 1px; " +
    "border-bottom: 2px solid " + color + ";\"></div>";
  } else {
    // Compute the length of the pixels including the first segment twice, 
    // since we repeat it.
    for (i = 0; i <= strokePattern.length; i++) {
      strokePixelLength += strokePattern[i%strokePattern.length];
    }

    // See if we can loop the pattern by itself at least twice.
    loop = Math.floor(oneEmWidth/(strokePixelLength-strokePattern[0]));
    if (loop > 1) {
      // This pattern fits at least two times, no scaling just convert to em;
      for (i = 0; i < strokePattern.length; i++) {
        normalizedPattern[i] = strokePattern[i]/oneEmWidth;
      }
      // Since we are repeating the pattern, we don't worry about repeating the
      // first segment in one draw.
      segmentLoop = normalizedPattern.length;
    } else {
      // If the pattern doesn't fit in the legend we scale it to fit.
      loop = 1;
      for (i = 0; i < strokePattern.length; i++) {
        normalizedPattern[i] = strokePattern[i]/strokePixelLength;
      }
      // For the scaled patterns we do redraw the first segment.
      segmentLoop = normalizedPattern.length+1;
    }
    // Now make the pattern.
    for (j = 0; j < loop; j++) {
      for (i = 0; i < segmentLoop; i+=2) {
        // The padding is the drawn segment.
        paddingLeft = normalizedPattern[i%normalizedPattern.length];
        if (i < strokePattern.length) {
          // The margin is the space segment.
          marginRight = normalizedPattern[(i+1)%normalizedPattern.length];
        } else {
          // The repeated first segment has no right margin.
          marginRight = 0;
        }
        dash += "<div style=\"display: inline-block; position: relative; " +
          "bottom: .5ex; margin-right: " + marginRight + "em; padding-left: " +
          paddingLeft + "em; height: 1px; border-bottom: 2px solid " + color +
          ";\"></div>";
      }
    }
  }
  return dash;
};

/**
 * @private
 * Generates HTML for the legend which is displayed when hovering over the
 * chart. If no selected points are specified, a default legend is returned
 * (this may just be the empty string).
 * @param { Number } [x] The x-value of the selected points.
 * @param { [Object] } [sel_points] List of selected points for the given
 * x-value. Should have properties like 'name', 'yval' and 'canvasy'.
 * @param { Number } [oneEmWidth] The pixel width for 1em in the legend.
 */
Dygraph.prototype.generateLegendHTML_ = function(x, sel_points, oneEmWidth) {
  // If no points are selected, we display a default legend. Traditionally,
  // this has been blank. But a better default would be a conventional legend,
  // which provides essential information for a non-interactive chart.
  var html, sepLines, i, c, dash, strokePattern;
  if (typeof(x) === 'undefined') {
    if (this.attr_('legend') != 'always') return '';

    sepLines = this.attr_('labelsSeparateLines');
    var labels = this.attr_('labels');
    html = '';
    for (i = 1; i < labels.length; i++) {
      if (!this.visibility()[i - 1]) continue;
      c = this.plotter_.colors[labels[i]];
      if (html !== '') html += (sepLines ? '<br/>' : ' ');
      strokePattern = this.attr_("strokePattern", labels[i]);
      dash = this.generateLegendDashHTML_(strokePattern, c, oneEmWidth);
      html += "<span style='font-weight: bold; color: " + c + ";'>" + dash +
        " " + labels[i] + "</span>";
    }
    return html;
  }

  var xOptView = this.optionsViewForAxis_('x');
  var xvf = xOptView('valueFormatter');
  html = xvf(x, xOptView, this.attr_('labels')[0], this) + ":";

  var yOptViews = [];
  var num_axes = this.numAxes();
  for (i = 0; i < num_axes; i++) {
    yOptViews[i] = this.optionsViewForAxis_('y' + (i ? 1 + i : ''));
  }
  var showZeros = this.attr_("labelsShowZeroValues");
  sepLines = this.attr_("labelsSeparateLines");
  for (i = 0; i < this.selPoints_.length; i++) {
    var pt = this.selPoints_[i];
    if (pt.yval === 0 && !showZeros) continue;
    if (!Dygraph.isOK(pt.canvasy)) continue;
    if (sepLines) html += "<br/>";

    var yOptView = yOptViews[this.seriesToAxisMap_[pt.name]];
    var fmtFunc = yOptView('valueFormatter');
    c = this.plotter_.colors[pt.name];
    var yval = fmtFunc(pt.yval, yOptView, pt.name, this);

    var cls = (pt.name == this.highlightSet_) ? " class='highlight'" : "";
    // TODO(danvk): use a template string here and make it an attribute.
    html += "<span" + cls + ">" + " <b><span style='color: " + c + ";'>" + pt.name +
        ":</span></b>" + yval + "</span>";
  }
  return html;
};

/**
 * @private
 * Displays information about the selected points in the legend. If there is no
 * selection, the legend will be cleared.
 * @param { Number } [x] The x-value of the selected points.
 * @param { [Object] } [sel_points] List of selected points for the given
 * x-value. Should have properties like 'name', 'yval' and 'canvasy'.
 */
Dygraph.prototype.setLegendHTML_ = function(x, sel_points) {
  var labelsDiv = this.attr_("labelsDiv");
  if (!labelsDiv) return;

  var sizeSpan = document.createElement('span');
  // Calculates the width of 1em in pixels for the legend.
  sizeSpan.setAttribute('style', 'margin: 0; padding: 0 0 0 1em; border: 0;');
  labelsDiv.appendChild(sizeSpan);
  var oneEmWidth=sizeSpan.offsetWidth;

  var html = this.generateLegendHTML_(x, sel_points, oneEmWidth);
  if (labelsDiv !== null) {
    labelsDiv.innerHTML = html;
  } else {
    if (typeof(this.shown_legend_error_) == 'undefined') {
      this.error('labelsDiv is set to something nonexistent; legend will not be shown.');
      this.shown_legend_error_ = true;
    }
  }
};

Dygraph.prototype.animateSelection_ = function(direction) {
  var totalSteps = 10;
  var millis = 30;
  if (this.fadeLevel === undefined) this.fadeLevel = 0;
  if (this.animateId === undefined) this.animateId = 0;
  var start = this.fadeLevel;
  var steps = direction < 0 ? start : totalSteps - start;
  if (steps <= 0) {
    if (this.fadeLevel) {
      this.updateSelection_(1.0);
    }
    return;
  }

  var thisId = ++this.animateId;
  var that = this;
  Dygraph.repeatAndCleanup(
    function(n) {
      // ignore simultaneous animations
      if (that.animateId != thisId) return;

      that.fadeLevel += direction;
      if (that.fadeLevel === 0) {
        that.clearSelection();
      } else {
        that.updateSelection_(that.fadeLevel / totalSteps);
      }
    },
    steps, millis, function() {});
};

/**
 * Draw dots over the selectied points in the data series. This function
 * takes care of cleanup of previously-drawn dots.
 * @private
 */
Dygraph.prototype.updateSelection_ = function(opt_animFraction) {
  // Clear the previously drawn vertical, if there is one
  var i;
  var ctx = this.canvas_ctx_;
  if (this.attr_('highlightSeriesOpts')) {
    ctx.clearRect(0, 0, this.width_, this.height_);
    var alpha = 1.0 - this.attr_('highlightSeriesBackgroundAlpha');
    if (alpha) {
      // Activating background fade includes an animation effect for a gradual
      // fade. TODO(klausw): make this independently configurable if it causes
      // issues? Use a shared preference to control animations?
      var animateBackgroundFade = true;
      if (animateBackgroundFade) {
        if (opt_animFraction === undefined) {
          // start a new animation
          this.animateSelection_(1);
          return;
        }
        alpha *= opt_animFraction;
      }
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.fillRect(0, 0, this.width_, this.height_);
    }
    var setIdx = this.datasetIndexFromSetName_(this.highlightSet_);
    this.plotter_._drawLine(ctx, setIdx);
  } else if (this.previousVerticalX_ >= 0) {
    // Determine the maximum highlight circle size.
    var maxCircleSize = 0;
    var labels = this.attr_('labels');
    for (i = 1; i < labels.length; i++) {
      var r = this.attr_('highlightCircleSize', labels[i]);
      if (r > maxCircleSize) maxCircleSize = r;
    }
    var px = this.previousVerticalX_;
    ctx.clearRect(px - maxCircleSize - 1, 0,
                  2 * maxCircleSize + 2, this.height_);
  }

  if (this.isUsingExcanvas_ && this.currentZoomRectArgs_) {
    Dygraph.prototype.drawZoomRect_.apply(this, this.currentZoomRectArgs_);
  }

  if (this.selPoints_.length > 0) {
    // Set the status message to indicate the selected point(s)
    if (this.attr_('showLabelsOnHighlight')) {
      this.setLegendHTML_(this.lastx_, this.selPoints_);
    }

    // Draw colored circles over the center of each selected point
    var canvasx = this.selPoints_[0].canvasx;
    ctx.save();
    for (i = 0; i < this.selPoints_.length; i++) {
      var pt = this.selPoints_[i];
      if (!Dygraph.isOK(pt.canvasy)) continue;

      var circleSize = this.attr_('highlightCircleSize', pt.name);
      var callback = this.attr_("drawHighlightPointCallback", pt.name);
      var color = this.plotter_.colors[pt.name];
      if (!callback) {
        callback = Dygraph.Circles.DEFAULT;
      }
      ctx.lineWidth = this.attr_('strokeWidth', pt.name);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      callback(this.g, pt.name, ctx, canvasx, pt.canvasy,
          color, circleSize);
    }
    ctx.restore();

    this.previousVerticalX_ = canvasx;
  }
};

/**
 * Manually set the selected points and display information about them in the
 * legend. The selection can be cleared using clearSelection() and queried
 * using getSelection().
 * @param { Integer } row number that should be highlighted (i.e. appear with
 * hover dots on the chart). Set to false to clear any selection.
 * @param { seriesName } optional series name to highlight that series with the
 * the highlightSeriesOpts setting.
 */
Dygraph.prototype.setSelection = function(row, opt_seriesName) {
  // Extract the points we've selected
  this.selPoints_ = [];
  var pos = 0;

  if (row !== false) {
    row -= this.getLeftBoundary_();
  }

  var changed = false;
  if (row !== false && row >= 0) {
    if (row != this.lastRow_) changed = true;
    this.lastRow_ = row;
    for (var setIdx = 0; setIdx < this.layout_.datasets.length; ++setIdx) {
      var set = this.layout_.datasets[setIdx];
      if (row < set.length) {
        var point = this.layout_.points[pos+row];

        if (this.attr_("stackedGraph")) {
          point = this.layout_.unstackPointAtIndex(pos+row);
        }

        if (!(point.yval === null)) this.selPoints_.push(point);
      }
      pos += set.length;
    }
  } else {
    if (this.lastRow_ >= 0) changed = true;
    this.lastRow_ = -1;
  }

  if (this.selPoints_.length) {
    this.lastx_ = this.selPoints_[0].xval;
  } else {
    this.lastx_ = -1;
  }

  if (opt_seriesName !== undefined) {
    if (this.highlightSet_ !== opt_seriesName) changed = true;
    this.highlightSet_ = opt_seriesName;
  }

  if (changed) {
    this.updateSelection_(undefined);
  }
  return changed;
};

/**
 * The mouse has left the canvas. Clear out whatever artifacts remain
 * @param {Object} event the mouseout event from the browser.
 * @private
 */
Dygraph.prototype.mouseOut_ = function(event) {
  if (this.attr_("unhighlightCallback")) {
    this.attr_("unhighlightCallback")(event);
  }

  if (this.attr_("hideOverlayOnMouseOut")) {
    this.clearSelection();
  }
};

/**
 * Clears the current selection (i.e. points that were highlighted by moving
 * the mouse over the chart).
 */
Dygraph.prototype.clearSelection = function() {
  // Get rid of the overlay data
  if (this.fadeLevel) {
    this.animateSelection_(-1);
    return;
  }
  this.canvas_ctx_.clearRect(0, 0, this.width_, this.height_);
  this.fadeLevel = 0;
  this.setLegendHTML_();
  this.selPoints_ = [];
  this.lastx_ = -1;
  this.lastRow_ = -1;
  this.highlightSet_ = null;
};

/**
 * Returns the number of the currently selected row. To get data for this row,
 * you can use the getValue method.
 * @return { Integer } row number, or -1 if nothing is selected
 */
Dygraph.prototype.getSelection = function() {
  if (!this.selPoints_ || this.selPoints_.length < 1) {
    return -1;
  }

  for (var row=0; row<this.layout_.points.length; row++ ) {
    if (this.layout_.points[row].x == this.selPoints_[0].x) {
      return row + this.getLeftBoundary_();
    }
  }
  return -1;
};

Dygraph.prototype.getHighlightSeries = function() {
  return this.highlightSet_;
};

/**
 * Fires when there's data available to be graphed.
 * @param {String} data Raw CSV data to be plotted
 * @private
 */
Dygraph.prototype.loadedEvent_ = function(data) {
  this.rawData_ = this.parseCSV_(data);
  this.predraw_();
};

/**
 * Add ticks on the x-axis representing years, months, quarters, weeks, or days
 * @private
 */
Dygraph.prototype.addXTicks_ = function() {
  // Determine the correct ticks scale on the x-axis: quarterly, monthly, ...
  var range;
  if (this.dateWindow_) {
    range = [this.dateWindow_[0], this.dateWindow_[1]];
  } else {
    range = this.fullXRange_();
  }

  var xAxisOptionsView = this.optionsViewForAxis_('x');
  var xTicks = xAxisOptionsView('ticker')(
      range[0],
      range[1],
      this.width_,  // TODO(danvk): should be area.width
      xAxisOptionsView,
      this);
  // var msg = 'ticker(' + range[0] + ', ' + range[1] + ', ' + this.width_ + ', ' + this.attr_('pixelsPerXLabel') + ') -> ' + JSON.stringify(xTicks);
  // console.log(msg);
  this.layout_.setXTicks(xTicks);
};

/**
 * @private
 * Computes the range of the data series (including confidence intervals).
 * @param { [Array] } series either [ [x1, y1], [x2, y2], ... ] or
 * [ [x1, [y1, dev_low, dev_high]], [x2, [y2, dev_low, dev_high]], ...
 * @return [low, high]
 */
Dygraph.prototype.extremeValues_ = function(series) {
  var minY = null, maxY = null, j, y;

  var bars = this.attr_("errorBars") || this.attr_("customBars");
  if (bars) {
    // With custom bars, maxY is the max of the high values.
    for (j = 0; j < series.length; j++) {
      y = series[j][1][0];
      if (!y) continue;
      var low = y - series[j][1][1];
      var high = y + series[j][1][2];
      if (low > y) low = y;    // this can happen with custom bars,
      if (high < y) high = y;  // e.g. in tests/custom-bars.html
      if (maxY === null || high > maxY) {
        maxY = high;
      }
      if (minY === null || low < minY) {
        minY = low;
      }
    }
  } else {
    for (j = 0; j < series.length; j++) {
      y = series[j][1];
      if (y === null || isNaN(y)) continue;
      if (maxY === null || y > maxY) {
        maxY = y;
      }
      if (minY === null || y < minY) {
        minY = y;
      }
    }
  }

  return [minY, maxY];
};

/**
 * @private
 * This function is called once when the chart's data is changed or the options
 * dictionary is updated. It is _not_ called when the user pans or zooms. The
 * idea is that values derived from the chart's data can be computed here,
 * rather than every time the chart is drawn. This includes things like the
 * number of axes, rolling averages, etc.
 */
Dygraph.prototype.predraw_ = function() {
  var start = new Date();

  // TODO(danvk): move more computations out of drawGraph_ and into here.
  this.computeYAxes_();

  // Create a new plotter.
  if (this.plotter_) this.plotter_.clear();
  this.plotter_ = new DygraphCanvasRenderer(this,
                                            this.hidden_,
                                            this.hidden_ctx_,
                                            this.layout_);

  // The roller sits in the bottom left corner of the chart. We don't know where
  // this will be until the options are available, so it's positioned here.
  this.createRollInterface_();

  // Same thing applies for the labelsDiv. It's right edge should be flush with
  // the right edge of the charting area (which may not be the same as the right
  // edge of the div, if we have two y-axes.
  this.positionLabelsDiv_();

  if (this.rangeSelector_) {
    this.rangeSelector_.renderStaticLayer();
  }

  // Convert the raw data (a 2D array) into the internal format and compute
  // rolling averages.
  this.rolledSeries_ = [null];  // x-axis is the first series and it's special
  for (var i = 1; i < this.numColumns(); i++) {
    var logScale = this.attr_('logscale', i); // TODO(klausw): this looks wrong
    var series = this.extractSeries_(this.rawData_, i, logScale);
    series = this.rollingAverage(series, this.rollPeriod_);
    this.rolledSeries_.push(series);
  }

  // If the data or options have changed, then we'd better redraw.
  this.drawGraph_();

  // This is used to determine whether to do various animations.
  var end = new Date();
  this.drawingTimeMs_ = (end - start);
};

/**
 * Loop over all fields and create datasets, calculating extreme y-values for
 * each series and extreme x-indices as we go.
 *
 * dateWindow is passed in as an explicit parameter so that we can compute
 * extreme values "speculatively", i.e. without actually setting state on the
 * dygraph.
 *
 * TODO(danvk): make this more of a true function
 * @return [ datasets, seriesExtremes, boundaryIds ]
 * @private
 */
Dygraph.prototype.gatherDatasets_ = function(rolledSeries, dateWindow) {
  var boundaryIds = [];
  var cumulative_y = [];  // For stacked series.
  var datasets = [];
  var extremes = {};  // series name -> [low, high]
  var i, j, k;

  // Loop over the fields (series).  Go from the last to the first,
  // because if they're stacked that's how we accumulate the values.
  var num_series = rolledSeries.length - 1;
  for (i = num_series; i >= 1; i--) {
    if (!this.visibility()[i - 1]) continue;

    // TODO(danvk): is this copy really necessary?
    var series = [];
    for (j = 0; j < rolledSeries[i].length; j++) {
      series.push(rolledSeries[i][j]);
    }

    // Prune down to the desired range, if necessary (for zooming)
    // Because there can be lines going to points outside of the visible area,
    // we actually prune to visible points, plus one on either side.
    var bars = this.attr_("errorBars") || this.attr_("customBars");
    if (dateWindow) {
      var low = dateWindow[0];
      var high = dateWindow[1];
      var pruned = [];
      // TODO(danvk): do binary search instead of linear search.
      // TODO(danvk): pass firstIdx and lastIdx directly to the renderer.
      var firstIdx = null, lastIdx = null;
      for (k = 0; k < series.length; k++) {
        if (series[k][0] >= low && firstIdx === null) {
          firstIdx = k;
        }
        if (series[k][0] <= high) {
          lastIdx = k;
        }
      }
      if (firstIdx === null) firstIdx = 0;
      if (firstIdx > 0) firstIdx--;
      if (lastIdx === null) lastIdx = series.length - 1;
      if (lastIdx < series.length - 1) lastIdx++;
      boundaryIds[i-1] = [firstIdx, lastIdx];
      for (k = firstIdx; k <= lastIdx; k++) {
        pruned.push(series[k]);
      }
      series = pruned;
    } else {
      boundaryIds[i-1] = [0, series.length-1];
    }

    var seriesExtremes = this.extremeValues_(series);

    if (bars) {
      for (j=0; j<series.length; j++) {
        series[j] = [series[j][0],
                     series[j][1][0],
                     series[j][1][1],
                     series[j][1][2]];
      }
    } else if (this.attr_("stackedGraph")) {
      var l = series.length;
      var actual_y;
      for (j = 0; j < l; j++) {
        // If one data set has a NaN, let all subsequent stacked
        // sets inherit the NaN -- only start at 0 for the first set.
        var x = series[j][0];
        if (cumulative_y[x] === undefined) {
          cumulative_y[x] = 0;
        }

        actual_y = series[j][1];
        if (actual_y === null) {
          series[j] = [x, null];
          continue;
        }

        cumulative_y[x] += actual_y;

        series[j] = [x, cumulative_y[x]];

        if (cumulative_y[x] > seriesExtremes[1]) {
          seriesExtremes[1] = cumulative_y[x];
        }
        if (cumulative_y[x] < seriesExtremes[0]) {
          seriesExtremes[0] = cumulative_y[x];
        }
      }
    }

    var seriesName = this.attr_("labels")[i];
    extremes[seriesName] = seriesExtremes;
    datasets[i] = series;
  }

  // For stacked graphs, a NaN value for any point in the sum should create a
  // clean gap in the graph. Back-propagate NaNs to all points at this X value.
  if (this.attr_("stackedGraph")) {
    for (k = datasets.length - 1; k >= 0; --k) {
      // Use the first nonempty dataset to get X values.
      if (!datasets[k]) continue;
      for (j = 0; j < datasets[k].length; j++) {
        var x = datasets[k][j][0];
        if (isNaN(cumulative_y[x])) {
          // Set all Y values to NaN at that X value.
          for (i = datasets.length - 1; i >= 0; i--) {
            if (!datasets[i]) continue;
            datasets[i][j][1] = NaN;
          }
        }
      }
      break;
    }
  }

  return [ datasets, extremes, boundaryIds ];
};

/**
 * Update the graph with new data. This method is called when the viewing area
 * has changed. If the underlying data or options have changed, predraw_ will
 * be called before drawGraph_ is called.
 *
 * clearSelection, when undefined or true, causes this.clearSelection to be
 * called at the end of the draw operation. This should rarely be defined,
 * and never true (that is it should be undefined most of the time, and
 * rarely false.)
 *
 * @private
 */
Dygraph.prototype.drawGraph_ = function(clearSelection) {
  var start = new Date();

  if (typeof(clearSelection) === 'undefined') {
    clearSelection = true;
  }

  // This is used to set the second parameter to drawCallback, below.
  var is_initial_draw = this.is_initial_draw_;
  this.is_initial_draw_ = false;

  this.layout_.removeAllDatasets();
  this.setColors_();
  this.attrs_.pointSize = 0.5 * this.attr_('highlightCircleSize');

  var packed = this.gatherDatasets_(this.rolledSeries_, this.dateWindow_);
  var datasets = packed[0];
  var extremes = packed[1];
  this.boundaryIds_ = packed[2];

  this.setIndexByName_ = {};
  var labels = this.attr_("labels");
  if (labels.length > 0) {
    this.setIndexByName_[labels[0]] = 0;
  }
  var dataIdx = 0;
  for (var i = 1; i < datasets.length; i++) {
    this.setIndexByName_[labels[i]] = i;
    if (!this.visibility()[i - 1]) continue;
    this.layout_.addDataset(labels[i], datasets[i]);
    this.datasetIndex_[i] = dataIdx++;
  }

  this.computeYAxisRanges_(extremes);
  this.layout_.setYAxes(this.axes_);

  this.addXTicks_();

  // Save the X axis zoomed status as the updateOptions call will tend to set it erroneously
  var tmp_zoomed_x = this.zoomed_x_;
  // Tell PlotKit to use this new data and render itself
  this.layout_.setDateWindow(this.dateWindow_);
  this.zoomed_x_ = tmp_zoomed_x;
  this.layout_.evaluateWithError();
  this.renderGraph_(is_initial_draw, false);

  if (this.attr_("timingName")) {
    var end = new Date();
    if (console) {
      console.log(this.attr_("timingName") + " - drawGraph: " + (end - start) + "ms");
    }
  }
};

Dygraph.prototype.renderGraph_ = function(is_initial_draw, clearSelection) {
  this.plotter_.clear();
  this.plotter_.render();
  this.canvas_.getContext('2d').clearRect(0, 0, this.canvas_.width,
                                          this.canvas_.height);

  // Generate a static legend before any particular point is selected.
  this.setLegendHTML_();

  if (!is_initial_draw) {
    if (clearSelection) {
      if (typeof(this.selPoints_) !== 'undefined' && this.selPoints_.length) {
        // We should select the point nearest the page x/y here, but it's easier
        // to just clear the selection. This prevents erroneous hover dots from
        // being displayed.
        this.clearSelection();
      } else {
        this.clearSelection();
      }
    }
  }

  if (this.rangeSelector_) {
    this.rangeSelector_.renderInteractiveLayer();
  }

  if (this.attr_("drawCallback") !== null) {
    this.attr_("drawCallback")(this, is_initial_draw);
  }
};

/**
 * @private
 * Determine properties of the y-axes which are independent of the data
 * currently being displayed. This includes things like the number of axes and
 * the style of the axes. It does not include the range of each axis and its
 * tick marks.
 * This fills in this.axes_ and this.seriesToAxisMap_.
 * axes_ = [ { options } ]
 * seriesToAxisMap_ = { seriesName: 0, seriesName2: 1, ... }
 *   indices are into the axes_ array.
 */
Dygraph.prototype.computeYAxes_ = function() {
  // Preserve valueWindow settings if they exist, and if the user hasn't
  // specified a new valueRange.
  var i, valueWindows, seriesName, axis, index, opts, v;
  if (this.axes_ !== undefined && this.user_attrs_.hasOwnProperty("valueRange") === false) {
    valueWindows = [];
    for (index = 0; index < this.axes_.length; index++) {
      valueWindows.push(this.axes_[index].valueWindow);
    }
  }

  this.axes_ = [{ yAxisId : 0, g : this }];  // always have at least one y-axis.
  this.seriesToAxisMap_ = {};

  // Get a list of series names.
  var labels = this.attr_("labels");
  var series = {};
  for (i = 1; i < labels.length; i++) series[labels[i]] = (i - 1);

  // all options which could be applied per-axis:
  var axisOptions = [
    'includeZero',
    'valueRange',
    'labelsKMB',
    'labelsKMG2',
    'pixelsPerYLabel',
    'yAxisLabelWidth',
    'axisLabelFontSize',
    'axisTickSize',
    'logscale'
  ];

  // Copy global axis options over to the first axis.
  for (i = 0; i < axisOptions.length; i++) {
    var k = axisOptions[i];
    v = this.attr_(k);
    if (v) this.axes_[0][k] = v;
  }

  // Go through once and add all the axes.
  for (seriesName in series) {
    if (!series.hasOwnProperty(seriesName)) continue;
    axis = this.attr_("axis", seriesName);
    if (axis === null) {
      this.seriesToAxisMap_[seriesName] = 0;
      continue;
    }
    if (typeof(axis) == 'object') {
      // Add a new axis, making a copy of its per-axis options.
      opts = {};
      Dygraph.update(opts, this.axes_[0]);
      Dygraph.update(opts, { valueRange: null });  // shouldn't inherit this.
      var yAxisId = this.axes_.length;
      opts.yAxisId = yAxisId;
      opts.g = this;
      Dygraph.update(opts, axis);
      this.axes_.push(opts);
      this.seriesToAxisMap_[seriesName] = yAxisId;
    }
  }

  // Go through one more time and assign series to an axis defined by another
  // series, e.g. { 'Y1: { axis: {} }, 'Y2': { axis: 'Y1' } }
  for (seriesName in series) {
    if (!series.hasOwnProperty(seriesName)) continue;
    axis = this.attr_("axis", seriesName);
    if (typeof(axis) == 'string') {
      if (!this.seriesToAxisMap_.hasOwnProperty(axis)) {
        this.error("Series " + seriesName + " wants to share a y-axis with " +
                   "series " + axis + ", which does not define its own axis.");
        return null;
      }
      var idx = this.seriesToAxisMap_[axis];
      this.seriesToAxisMap_[seriesName] = idx;
    }
  }

  if (valueWindows !== undefined) {
    // Restore valueWindow settings.
    for (index = 0; index < valueWindows.length; index++) {
      this.axes_[index].valueWindow = valueWindows[index];
    }
  }

  // New axes options
  for (axis = 0; axis < this.axes_.length; axis++) {
    if (axis === 0) {
      opts = this.optionsViewForAxis_('y' + (axis ? '2' : ''));
      v = opts("valueRange");
      if (v) this.axes_[axis].valueRange = v;
    } else {  // To keep old behavior
      var axes = this.user_attrs_.axes;
      if (axes && axes.y2) {
        v = axes.y2.valueRange;
        if (v) this.axes_[axis].valueRange = v;
      }
    }
  }

};

/**
 * Returns the number of y-axes on the chart.
 * @return {Number} the number of axes.
 */
Dygraph.prototype.numAxes = function() {
  var last_axis = 0;
  for (var series in this.seriesToAxisMap_) {
    if (!this.seriesToAxisMap_.hasOwnProperty(series)) continue;
    var idx = this.seriesToAxisMap_[series];
    if (idx > last_axis) last_axis = idx;
  }
  return 1 + last_axis;
};

/**
 * @private
 * Returns axis properties for the given series.
 * @param { String } setName The name of the series for which to get axis
 * properties, e.g. 'Y1'.
 * @return { Object } The axis properties.
 */
Dygraph.prototype.axisPropertiesForSeries = function(series) {
  // TODO(danvk): handle errors.
  return this.axes_[this.seriesToAxisMap_[series]];
};

/**
 * @private
 * Determine the value range and tick marks for each axis.
 * @param {Object} extremes A mapping from seriesName -> [low, high]
 * This fills in the valueRange and ticks fields in each entry of this.axes_.
 */
Dygraph.prototype.computeYAxisRanges_ = function(extremes) {
  // Build a map from axis number -> [list of series names]
  var seriesForAxis = [], series;
  for (series in this.seriesToAxisMap_) {
    if (!this.seriesToAxisMap_.hasOwnProperty(series)) continue;
    var idx = this.seriesToAxisMap_[series];
    while (seriesForAxis.length <= idx) seriesForAxis.push([]);
    seriesForAxis[idx].push(series);
  }

  // Compute extreme values, a span and tick marks for each axis.
  for (var i = 0; i < this.axes_.length; i++) {
    var axis = this.axes_[i];

    if (!seriesForAxis[i]) {
      // If no series are defined or visible then use a reasonable default
      axis.extremeRange = [0, 1];
    } else {
      // Calculate the extremes of extremes.
      series = seriesForAxis[i];
      var minY = Infinity;  // extremes[series[0]][0];
      var maxY = -Infinity;  // extremes[series[0]][1];
      var extremeMinY, extremeMaxY;

      for (var j = 0; j < series.length; j++) {
        // this skips invisible series
        if (!extremes.hasOwnProperty(series[j])) continue;

        // Only use valid extremes to stop null data series' from corrupting the scale.
        extremeMinY = extremes[series[j]][0];
        if (extremeMinY !== null) {
          minY = Math.min(extremeMinY, minY);
        }
        extremeMaxY = extremes[series[j]][1];
        if (extremeMaxY !== null) {
          maxY = Math.max(extremeMaxY, maxY);
        }
      }
      if (axis.includeZero && minY > 0) minY = 0;

      // Ensure we have a valid scale, otherwise default to [0, 1] for safety.
      if (minY == Infinity) minY = 0;
      if (maxY == -Infinity) maxY = 1;

      // Add some padding and round up to an integer to be human-friendly.
      var span = maxY - minY;
      // special case: if we have no sense of scale, use +/-10% of the sole value.
      if (span === 0) { span = maxY; }

      var maxAxisY, minAxisY;
      if (axis.logscale) {
        maxAxisY = maxY + 0.1 * span;
        minAxisY = minY;
      } else {
        maxAxisY = maxY + 0.1 * span;
        minAxisY = minY - 0.1 * span;

        // Try to include zero and make it minAxisY (or maxAxisY) if it makes sense.
        if (!this.attr_("avoidMinZero")) {
          if (minAxisY < 0 && minY >= 0) minAxisY = 0;
          if (maxAxisY > 0 && maxY <= 0) maxAxisY = 0;
        }

        if (this.attr_("includeZero")) {
          if (maxY < 0) maxAxisY = 0;
          if (minY > 0) minAxisY = 0;
        }
      }
      axis.extremeRange = [minAxisY, maxAxisY];
    }
    if (axis.valueWindow) {
      // This is only set if the user has zoomed on the y-axis. It is never set
      // by a user. It takes precedence over axis.valueRange because, if you set
      // valueRange, you'd still expect to be able to pan.
      axis.computedValueRange = [axis.valueWindow[0], axis.valueWindow[1]];
    } else if (axis.valueRange) {
      // This is a user-set value range for this axis.
      axis.computedValueRange = [axis.valueRange[0], axis.valueRange[1]];
    } else {
      axis.computedValueRange = axis.extremeRange;
    }

    // Add ticks. By default, all axes inherit the tick positions of the
    // primary axis. However, if an axis is specifically marked as having
    // independent ticks, then that is permissible as well.
    var opts = this.optionsViewForAxis_('y' + (i ? '2' : ''));
    var ticker = opts('ticker');
    if (i === 0 || axis.independentTicks) {
      axis.ticks = ticker(axis.computedValueRange[0],
                          axis.computedValueRange[1],
                          this.height_,  // TODO(danvk): should be area.height
                          opts,
                          this);
    } else {
      var p_axis = this.axes_[0];
      var p_ticks = p_axis.ticks;
      var p_scale = p_axis.computedValueRange[1] - p_axis.computedValueRange[0];
      var scale = axis.computedValueRange[1] - axis.computedValueRange[0];
      var tick_values = [];
      for (var k = 0; k < p_ticks.length; k++) {
        var y_frac = (p_ticks[k].v - p_axis.computedValueRange[0]) / p_scale;
        var y_val = axis.computedValueRange[0] + y_frac * scale;
        tick_values.push(y_val);
      }

      axis.ticks = ticker(axis.computedValueRange[0],
                          axis.computedValueRange[1],
                          this.height_,  // TODO(danvk): should be area.height
                          opts,
                          this,
                          tick_values);
    }
  }
};

/**
 * Extracts one series from the raw data (a 2D array) into an array of (date,
 * value) tuples.
 *
 * This is where undesirable points (i.e. negative values on log scales and
 * missing values through which we wish to connect lines) are dropped.
 * 
 * @private
 */
Dygraph.prototype.extractSeries_ = function(rawData, i, logScale) {
  var series = [];
  for (var j = 0; j < rawData.length; j++) {
    var x = rawData[j][0];
    var point = rawData[j][i];
    if (logScale) {
      // On the log scale, points less than zero do not exist.
      // This will create a gap in the chart.
      if (point <= 0) {
        point = null;
      }
    }
    series.push([x, point]);
  }
  return series;
};

/**
 * @private
 * Calculates the rolling average of a data set.
 * If originalData is [label, val], rolls the average of those.
 * If originalData is [label, [, it's interpreted as [value, stddev]
 *   and the roll is returned in the same form, with appropriately reduced
 *   stddev for each value.
 * Note that this is where fractional input (i.e. '5/10') is converted into
 *   decimal values.
 * @param {Array} originalData The data in the appropriate format (see above)
 * @param {Number} rollPeriod The number of points over which to average the
 *                            data
 */
Dygraph.prototype.rollingAverage = function(originalData, rollPeriod) {
  if (originalData.length < 2)
    return originalData;
  rollPeriod = Math.min(rollPeriod, originalData.length);
  var rollingData = [];
  var sigma = this.attr_("sigma");

  var low, high, i, j, y, sum, num_ok, stddev;
  if (this.fractions_) {
    var num = 0;
    var den = 0;  // numerator/denominator
    var mult = 100.0;
    for (i = 0; i < originalData.length; i++) {
      num += originalData[i][1][0];
      den += originalData[i][1][1];
      if (i - rollPeriod >= 0) {
        num -= originalData[i - rollPeriod][1][0];
        den -= originalData[i - rollPeriod][1][1];
      }

      var date = originalData[i][0];
      var value = den ? num / den : 0.0;
      if (this.attr_("errorBars")) {
        if (this.attr_("wilsonInterval")) {
          // For more details on this confidence interval, see:
          // http://en.wikipedia.org/wiki/Binomial_confidence_interval
          if (den) {
            var p = value < 0 ? 0 : value, n = den;
            var pm = sigma * Math.sqrt(p*(1-p)/n + sigma*sigma/(4*n*n));
            var denom = 1 + sigma * sigma / den;
            low  = (p + sigma * sigma / (2 * den) - pm) / denom;
            high = (p + sigma * sigma / (2 * den) + pm) / denom;
            rollingData[i] = [date,
                              [p * mult, (p - low) * mult, (high - p) * mult]];
          } else {
            rollingData[i] = [date, [0, 0, 0]];
          }
        } else {
          stddev = den ? sigma * Math.sqrt(value * (1 - value) / den) : 1.0;
          rollingData[i] = [date, [mult * value, mult * stddev, mult * stddev]];
        }
      } else {
        rollingData[i] = [date, mult * value];
      }
    }
  } else if (this.attr_("customBars")) {
    low = 0;
    var mid = 0;
    high = 0;
    var count = 0;
    for (i = 0; i < originalData.length; i++) {
      var data = originalData[i][1];
      y = data[1];
      rollingData[i] = [originalData[i][0], [y, y - data[0], data[2] - y]];

      if (y !== null && !isNaN(y)) {
        low += data[0];
        mid += y;
        high += data[2];
        count += 1;
      }
      if (i - rollPeriod >= 0) {
        var prev = originalData[i - rollPeriod];
        if (prev[1][1] !== null && !isNaN(prev[1][1])) {
          low -= prev[1][0];
          mid -= prev[1][1];
          high -= prev[1][2];
          count -= 1;
        }
      }
      if (count) {
        rollingData[i] = [originalData[i][0], [ 1.0 * mid / count,
                                                1.0 * (mid - low) / count,
                                                1.0 * (high - mid) / count ]];
      } else {
        rollingData[i] = [originalData[i][0], [null, null, null]];
      }
    }
  } else {
    // Calculate the rolling average for the first rollPeriod - 1 points where
    // there is not enough data to roll over the full number of points
    if (!this.attr_("errorBars")){
      if (rollPeriod == 1) {
        return originalData;
      }

      for (i = 0; i < originalData.length; i++) {
        sum = 0;
        num_ok = 0;
        for (j = Math.max(0, i - rollPeriod + 1); j < i + 1; j++) {
          y = originalData[j][1];
          if (y === null || isNaN(y)) continue;
          num_ok++;
          sum += originalData[j][1];
        }
        if (num_ok) {
          rollingData[i] = [originalData[i][0], sum / num_ok];
        } else {
          rollingData[i] = [originalData[i][0], null];
        }
      }

    } else {
      for (i = 0; i < originalData.length; i++) {
        sum = 0;
        var variance = 0;
        num_ok = 0;
        for (j = Math.max(0, i - rollPeriod + 1); j < i + 1; j++) {
          y = originalData[j][1][0];
          if (y === null || isNaN(y)) continue;
          num_ok++;
          sum += originalData[j][1][0];
          variance += Math.pow(originalData[j][1][1], 2);
        }
        if (num_ok) {
          stddev = Math.sqrt(variance) / num_ok;
          rollingData[i] = [originalData[i][0],
                            [sum / num_ok, sigma * stddev, sigma * stddev]];
        } else {
          rollingData[i] = [originalData[i][0], [null, null, null]];
        }
      }
    }
  }

  return rollingData;
};

/**
 * Detects the type of the str (date or numeric) and sets the various
 * formatting attributes in this.attrs_ based on this type.
 * @param {String} str An x value.
 * @private
 */
Dygraph.prototype.detectTypeFromString_ = function(str) {
  var isDate = false;
  var dashPos = str.indexOf('-');  // could be 2006-01-01 _or_ 1.0e-2
  if ((dashPos > 0 && (str[dashPos-1] != 'e' && str[dashPos-1] != 'E')) ||
      str.indexOf('/') >= 0 ||
      isNaN(parseFloat(str))) {
    isDate = true;
  } else if (str.length == 8 && str > '19700101' && str < '20371231') {
    // TODO(danvk): remove support for this format.
    isDate = true;
  }

  if (isDate) {
    this.attrs_.xValueParser = Dygraph.dateParser;
    this.attrs_.axes.x.valueFormatter = Dygraph.dateString_;
    this.attrs_.axes.x.ticker = Dygraph.dateTicker;
    this.attrs_.axes.x.axisLabelFormatter = Dygraph.dateAxisFormatter;
  } else {
    /** @private (shut up, jsdoc!) */
    this.attrs_.xValueParser = function(x) { return parseFloat(x); };
    // TODO(danvk): use Dygraph.numberValueFormatter here?
    /** @private (shut up, jsdoc!) */
    this.attrs_.axes.x.valueFormatter = function(x) { return x; };
    this.attrs_.axes.x.ticker = Dygraph.numericLinearTicks;
    this.attrs_.axes.x.axisLabelFormatter = this.attrs_.axes.x.valueFormatter;
  }
};

/**
 * Parses the value as a floating point number. This is like the parseFloat()
 * built-in, but with a few differences:
 * - the empty string is parsed as null, rather than NaN.
 * - if the string cannot be parsed at all, an error is logged.
 * If the string can't be parsed, this method returns null.
 * @param {String} x The string to be parsed
 * @param {Number} opt_line_no The line number from which the string comes.
 * @param {String} opt_line The text of the line from which the string comes.
 * @private
 */

// Parse the x as a float or return null if it's not a number.
Dygraph.prototype.parseFloat_ = function(x, opt_line_no, opt_line) {
  var val = parseFloat(x);
  if (!isNaN(val)) return val;

  // Try to figure out what happeend.
  // If the value is the empty string, parse it as null.
  if (/^ *$/.test(x)) return null;

  // If it was actually "NaN", return it as NaN.
  if (/^ *nan *$/i.test(x)) return NaN;

  // Looks like a parsing error.
  var msg = "Unable to parse '" + x + "' as a number";
  if (opt_line !== null && opt_line_no !== null) {
    msg += " on line " + (1+opt_line_no) + " ('" + opt_line + "') of CSV.";
  }
  this.error(msg);

  return null;
};

/**
 * @private
 * Parses a string in a special csv format.  We expect a csv file where each
 * line is a date point, and the first field in each line is the date string.
 * We also expect that all remaining fields represent series.
 * if the errorBars attribute is set, then interpret the fields as:
 * date, series1, stddev1, series2, stddev2, ...
 * @param {[Object]} data See above.
 *
 * @return [Object] An array with one entry for each row. These entries
 * are an array of cells in that row. The first entry is the parsed x-value for
 * the row. The second, third, etc. are the y-values. These can take on one of
 * three forms, depending on the CSV and constructor parameters:
 * 1. numeric value
 * 2. [ value, stddev ]
 * 3. [ low value, center value, high value ]
 */
Dygraph.prototype.parseCSV_ = function(data) {
  var ret = [];
  var lines = data.split("\n");
  var vals, j;

  // Use the default delimiter or fall back to a tab if that makes sense.
  var delim = this.attr_('delimiter');
  if (lines[0].indexOf(delim) == -1 && lines[0].indexOf('\t') >= 0) {
    delim = '\t';
  }

  var start = 0;
  if (!('labels' in this.user_attrs_)) {
    // User hasn't explicitly set labels, so they're (presumably) in the CSV.
    start = 1;
    this.attrs_.labels = lines[0].split(delim);  // NOTE: _not_ user_attrs_.
  }
  var line_no = 0;

  var xParser;
  var defaultParserSet = false;  // attempt to auto-detect x value type
  var expectedCols = this.attr_("labels").length;
  var outOfOrder = false;
  for (var i = start; i < lines.length; i++) {
    var line = lines[i];
    line_no = i;
    if (line.length === 0) continue;  // skip blank lines
    if (line[0] == '#') continue;    // skip comment lines
    var inFields = line.split(delim);
    if (inFields.length < 2) continue;

    var fields = [];
    if (!defaultParserSet) {
      this.detectTypeFromString_(inFields[0]);
      xParser = this.attr_("xValueParser");
      defaultParserSet = true;
    }
    fields[0] = xParser(inFields[0], this);

    // If fractions are expected, parse the numbers as "A/B"
    if (this.fractions_) {
      for (j = 1; j < inFields.length; j++) {
        // TODO(danvk): figure out an appropriate way to flag parse errors.
        vals = inFields[j].split("/");
        if (vals.length != 2) {
          this.error('Expected fractional "num/den" values in CSV data ' +
                     "but found a value '" + inFields[j] + "' on line " +
                     (1 + i) + " ('" + line + "') which is not of this form.");
          fields[j] = [0, 0];
        } else {
          fields[j] = [this.parseFloat_(vals[0], i, line),
                       this.parseFloat_(vals[1], i, line)];
        }
      }
    } else if (this.attr_("errorBars")) {
      // If there are error bars, values are (value, stddev) pairs
      if (inFields.length % 2 != 1) {
        this.error('Expected alternating (value, stdev.) pairs in CSV data ' +
                   'but line ' + (1 + i) + ' has an odd number of values (' +
                   (inFields.length - 1) + "): '" + line + "'");
      }
      for (j = 1; j < inFields.length; j += 2) {
        fields[(j + 1) / 2] = [this.parseFloat_(inFields[j], i, line),
                               this.parseFloat_(inFields[j + 1], i, line)];
      }
    } else if (this.attr_("customBars")) {
      // Bars are a low;center;high tuple
      for (j = 1; j < inFields.length; j++) {
        var val = inFields[j];
        if (/^ *$/.test(val)) {
          fields[j] = [null, null, null];
        } else {
          vals = val.split(";");
          if (vals.length == 3) {
            fields[j] = [ this.parseFloat_(vals[0], i, line),
                          this.parseFloat_(vals[1], i, line),
                          this.parseFloat_(vals[2], i, line) ];
          } else {
            this.warn('When using customBars, values must be either blank ' +
                      'or "low;center;high" tuples (got "' + val +
                      '" on line ' + (1+i));
          }
        }
      }
    } else {
      // Values are just numbers
      for (j = 1; j < inFields.length; j++) {
        fields[j] = this.parseFloat_(inFields[j], i, line);
      }
    }
    if (ret.length > 0 && fields[0] < ret[ret.length - 1][0]) {
      outOfOrder = true;
    }

    if (fields.length != expectedCols) {
      this.error("Number of columns in line " + i + " (" + fields.length +
                 ") does not agree with number of labels (" + expectedCols +
                 ") " + line);
    }

    // If the user specified the 'labels' option and none of the cells of the
    // first row parsed correctly, then they probably double-specified the
    // labels. We go with the values set in the option, discard this row and
    // log a warning to the JS console.
    if (i === 0 && this.attr_('labels')) {
      var all_null = true;
      for (j = 0; all_null && j < fields.length; j++) {
        if (fields[j]) all_null = false;
      }
      if (all_null) {
        this.warn("The dygraphs 'labels' option is set, but the first row of " +
                  "CSV data ('" + line + "') appears to also contain labels. " +
                  "Will drop the CSV labels and use the option labels.");
        continue;
      }
    }
    ret.push(fields);
  }

  if (outOfOrder) {
    this.warn("CSV is out of order; order it correctly to speed loading.");
    ret.sort(function(a,b) { return a[0] - b[0]; });
  }

  return ret;
};

/**
 * @private
 * The user has provided their data as a pre-packaged JS array. If the x values
 * are numeric, this is the same as dygraphs' internal format. If the x values
 * are dates, we need to convert them from Date objects to ms since epoch.
 * @param {[Object]} data
 * @return {[Object]} data with numeric x values.
 */
Dygraph.prototype.parseArray_ = function(data) {
  // Peek at the first x value to see if it's numeric.
  if (data.length === 0) {
    this.error("Can't plot empty data set");
    return null;
  }
  if (data[0].length === 0) {
    this.error("Data set cannot contain an empty row");
    return null;
  }

  var i;
  if (this.attr_("labels") === null) {
    this.warn("Using default labels. Set labels explicitly via 'labels' " +
              "in the options parameter");
    this.attrs_.labels = [ "X" ];
    for (i = 1; i < data[0].length; i++) {
      this.attrs_.labels.push("Y" + i);
    }
  }

  if (Dygraph.isDateLike(data[0][0])) {
    // Some intelligent defaults for a date x-axis.
    this.attrs_.axes.x.valueFormatter = Dygraph.dateString_;
    this.attrs_.axes.x.axisLabelFormatter = Dygraph.dateAxisFormatter;
    this.attrs_.axes.x.ticker = Dygraph.dateTicker;

    // Assume they're all dates.
    var parsedData = Dygraph.clone(data);
    for (i = 0; i < data.length; i++) {
      if (parsedData[i].length === 0) {
        this.error("Row " + (1 + i) + " of data is empty");
        return null;
      }
      if (parsedData[i][0] === null ||
          typeof(parsedData[i][0].getTime) != 'function' ||
          isNaN(parsedData[i][0].getTime())) {
        this.error("x value in row " + (1 + i) + " is not a Date");
        return null;
      }
      parsedData[i][0] = parsedData[i][0].getTime();
    }
    return parsedData;
  } else {
    // Some intelligent defaults for a numeric x-axis.
    /** @private (shut up, jsdoc!) */
    this.attrs_.axes.x.valueFormatter = function(x) { return x; };
    this.attrs_.axes.x.axisLabelFormatter = Dygraph.numberAxisLabelFormatter;
    this.attrs_.axes.x.ticker = Dygraph.numericLinearTicks;
    return data;
  }
};

/**
 * Parses a DataTable object from gviz.
 * The data is expected to have a first column that is either a date or a
 * number. All subsequent columns must be numbers. If there is a clear mismatch
 * between this.xValueParser_ and the type of the first column, it will be
 * fixed. Fills out rawData_.
 * @param {[Object]} data See above.
 * @private
 */
Dygraph.prototype.parseDataTable_ = function(data) {
  var shortTextForAnnotationNum = function(num) {
    // converts [0-9]+ [A-Z][a-z]*
    // example: 0=A, 1=B, 25=Z, 26=Aa, 27=Ab
    // and continues like.. Ba Bb .. Za .. Zz..Aaa...Zzz Aaaa Zzzz
    var shortText = String.fromCharCode(65 /* A */ + num % 26);
    num = Math.floor(num / 26);
    while ( num > 0 ) {
      shortText = String.fromCharCode(65 /* A */ + (num - 1) % 26 ) + shortText.toLowerCase();
      num = Math.floor((num - 1) / 26);
    }
    return shortText;
  }

  var cols = data.getNumberOfColumns();
  var rows = data.getNumberOfRows();

  var indepType = data.getColumnType(0);
  if (indepType == 'date' || indepType == 'datetime') {
    this.attrs_.xValueParser = Dygraph.dateParser;
    this.attrs_.axes.x.valueFormatter = Dygraph.dateString_;
    this.attrs_.axes.x.ticker = Dygraph.dateTicker;
    this.attrs_.axes.x.axisLabelFormatter = Dygraph.dateAxisFormatter;
  } else if (indepType == 'number') {
    this.attrs_.xValueParser = function(x) { return parseFloat(x); };
    this.attrs_.axes.x.valueFormatter = function(x) { return x; };
    this.attrs_.axes.x.ticker = Dygraph.numericLinearTicks;
    this.attrs_.axes.x.axisLabelFormatter = this.attrs_.axes.x.valueFormatter;
  } else {
    this.error("only 'date', 'datetime' and 'number' types are supported for " +
               "column 1 of DataTable input (Got '" + indepType + "')");
    return null;
  }

  // Array of the column indices which contain data (and not annotations).
  var colIdx = [];
  var annotationCols = {};  // data index -> [annotation cols]
  var hasAnnotations = false;
  var i, j;
  for (i = 1; i < cols; i++) {
    var type = data.getColumnType(i);
    if (type == 'number') {
      colIdx.push(i);
    } else if (type == 'string' && this.attr_('displayAnnotations')) {
      // This is OK -- it's an annotation column.
      var dataIdx = colIdx[colIdx.length - 1];
      if (!annotationCols.hasOwnProperty(dataIdx)) {
        annotationCols[dataIdx] = [i];
      } else {
        annotationCols[dataIdx].push(i);
      }
      hasAnnotations = true;
    } else {
      this.error("Only 'number' is supported as a dependent type with Gviz." +
                 " 'string' is only supported if displayAnnotations is true");
    }
  }

  // Read column labels
  // TODO(danvk): add support back for errorBars
  var labels = [data.getColumnLabel(0)];
  for (i = 0; i < colIdx.length; i++) {
    labels.push(data.getColumnLabel(colIdx[i]));
    if (this.attr_("errorBars")) i += 1;
  }
  this.attrs_.labels = labels;
  cols = labels.length;

  var ret = [];
  var outOfOrder = false;
  var annotations = [];
  for (i = 0; i < rows; i++) {
    var row = [];
    if (typeof(data.getValue(i, 0)) === 'undefined' ||
        data.getValue(i, 0) === null) {
      this.warn("Ignoring row " + i +
                " of DataTable because of undefined or null first column.");
      continue;
    }

    if (indepType == 'date' || indepType == 'datetime') {
      row.push(data.getValue(i, 0).getTime());
    } else {
      row.push(data.getValue(i, 0));
    }
    if (!this.attr_("errorBars")) {
      for (j = 0; j < colIdx.length; j++) {
        var col = colIdx[j];
        row.push(data.getValue(i, col));
        if (hasAnnotations &&
            annotationCols.hasOwnProperty(col) &&
            data.getValue(i, annotationCols[col][0]) !== null) {
          var ann = {};
          ann.series = data.getColumnLabel(col);
          ann.xval = row[0];
          ann.shortText = shortTextForAnnotationNum(annotations.length);
          ann.text = '';
          for (var k = 0; k < annotationCols[col].length; k++) {
            if (k) ann.text += "\n";
            ann.text += data.getValue(i, annotationCols[col][k]);
          }
          annotations.push(ann);
        }
      }

      // Strip out infinities, which give dygraphs problems later on.
      for (j = 0; j < row.length; j++) {
        if (!isFinite(row[j])) row[j] = null;
      }
    } else {
      for (j = 0; j < cols - 1; j++) {
        row.push([ data.getValue(i, 1 + 2 * j), data.getValue(i, 2 + 2 * j) ]);
      }
    }
    if (ret.length > 0 && row[0] < ret[ret.length - 1][0]) {
      outOfOrder = true;
    }
    ret.push(row);
  }

  if (outOfOrder) {
    this.warn("DataTable is out of order; order it correctly to speed loading.");
    ret.sort(function(a,b) { return a[0] - b[0]; });
  }
  this.rawData_ = ret;

  if (annotations.length > 0) {
    this.setAnnotations(annotations, true);
  }
};

/**
 * Get the CSV data. If it's in a function, call that function. If it's in a
 * file, do an XMLHttpRequest to get it.
 * @private
 */
Dygraph.prototype.start_ = function() {
  var data = this.file_;

  // Functions can return references of all other types.
  if (typeof data == 'function') {
    data = data();
  }

  if (Dygraph.isArrayLike(data)) {
    this.rawData_ = this.parseArray_(data);
    this.predraw_();
  } else if (typeof data == 'object' &&
             typeof data.getColumnRange == 'function') {
    // must be a DataTable from gviz.
    this.parseDataTable_(data);
    this.predraw_();
  } else if (typeof data == 'string') {
    // Heuristic: a newline means it's CSV data. Otherwise it's an URL.
    if (data.indexOf('\n') >= 0) {
      this.loadedEvent_(data);
    } else {
      var req = new XMLHttpRequest();
      var caller = this;
      req.onreadystatechange = function () {
        if (req.readyState == 4) {
          if (req.status === 200 ||  // Normal http
              req.status === 0) {    // Chrome w/ --allow-file-access-from-files
            caller.loadedEvent_(req.responseText);
          }
        }
      };

      req.open("GET", data, true);
      req.send(null);
    }
  } else {
    this.error("Unknown data format: " + (typeof data));
  }
};

/**
 * Changes various properties of the graph. These can include:
 * <ul>
 * <li>file: changes the source data for the graph</li>
 * <li>errorBars: changes whether the data contains stddev</li>
 * </ul>
 *
 * There's a huge variety of options that can be passed to this method. For a
 * full list, see http://dygraphs.com/options.html.
 *
 * @param {Object} attrs The new properties and values
 * @param {Boolean} [block_redraw] Usually the chart is redrawn after every
 * call to updateOptions(). If you know better, you can pass true to explicitly
 * block the redraw. This can be useful for chaining updateOptions() calls,
 * avoiding the occasional infinite loop and preventing redraws when it's not
 * necessary (e.g. when updating a callback).
 */
Dygraph.prototype.updateOptions = function(input_attrs, block_redraw) {
  if (typeof(block_redraw) == 'undefined') block_redraw = false;

  // mapLegacyOptions_ drops the "file" parameter as a convenience to us.
  var file = input_attrs.file;
  var attrs = Dygraph.mapLegacyOptions_(input_attrs);

  // TODO(danvk): this is a mess. Move these options into attr_.
  if ('rollPeriod' in attrs) {
    this.rollPeriod_ = attrs.rollPeriod;
  }
  if ('dateWindow' in attrs) {
    this.dateWindow_ = attrs.dateWindow;
    if (!('isZoomedIgnoreProgrammaticZoom' in attrs)) {
      this.zoomed_x_ = (attrs.dateWindow !== null);
    }
  }
  if ('valueRange' in attrs && !('isZoomedIgnoreProgrammaticZoom' in attrs)) {
    this.zoomed_y_ = (attrs.valueRange !== null);
  }

  // TODO(danvk): validate per-series options.
  // Supported:
  // strokeWidth
  // pointSize
  // drawPoints
  // highlightCircleSize

  // Check if this set options will require new points.
  var requiresNewPoints = Dygraph.isPixelChangingOptionList(this.attr_("labels"), attrs);

  Dygraph.updateDeep(this.user_attrs_, attrs);

  if (file) {
    this.file_ = file;
    if (!block_redraw) this.start_();
  } else {
    if (!block_redraw) {
      if (requiresNewPoints) {
        this.predraw_();
      } else {
        this.renderGraph_(false, false);
      }
    }
  }
};

/**
 * Returns a copy of the options with deprecated names converted into current
 * names. Also drops the (potentially-large) 'file' attribute. If the caller is
 * interested in that, they should save a copy before calling this.
 * @private
 */
Dygraph.mapLegacyOptions_ = function(attrs) {
  var my_attrs = {};
  for (var k in attrs) {
    if (k == 'file') continue;
    if (attrs.hasOwnProperty(k)) my_attrs[k] = attrs[k];
  }

  var set = function(axis, opt, value) {
    if (!my_attrs.axes) my_attrs.axes = {};
    if (!my_attrs.axes[axis]) my_attrs.axes[axis] = {};
    my_attrs.axes[axis][opt] = value;
  };
  var map = function(opt, axis, new_opt) {
    if (typeof(attrs[opt]) != 'undefined') {
      set(axis, new_opt, attrs[opt]);
      delete my_attrs[opt];
    }
  };

  // This maps, e.g., xValueFormater -> axes: { x: { valueFormatter: ... } }
  map('xValueFormatter', 'x', 'valueFormatter');
  map('pixelsPerXLabel', 'x', 'pixelsPerLabel');
  map('xAxisLabelFormatter', 'x', 'axisLabelFormatter');
  map('xTicker', 'x', 'ticker');
  map('yValueFormatter', 'y', 'valueFormatter');
  map('pixelsPerYLabel', 'y', 'pixelsPerLabel');
  map('yAxisLabelFormatter', 'y', 'axisLabelFormatter');
  map('yTicker', 'y', 'ticker');
  return my_attrs;
};

/**
 * Resizes the dygraph. If no parameters are specified, resizes to fill the
 * containing div (which has presumably changed size since the dygraph was
 * instantiated. If the width/height are specified, the div will be resized.
 *
 * This is far more efficient than destroying and re-instantiating a
 * Dygraph, since it doesn't have to reparse the underlying data.
 *
 * @param {Number} [width] Width (in pixels)
 * @param {Number} [height] Height (in pixels)
 */
Dygraph.prototype.resize = function(width, height) {
  if (this.resize_lock) {
    return;
  }
  this.resize_lock = true;

  if ((width === null) != (height === null)) {
    this.warn("Dygraph.resize() should be called with zero parameters or " +
              "two non-NULL parameters. Pretending it was zero.");
    width = height = null;
  }

  var old_width = this.width_;
  var old_height = this.height_;

  if (width) {
    this.maindiv_.style.width = width + "px";
    this.maindiv_.style.height = height + "px";
    this.width_ = width;
    this.height_ = height;
  } else {
    this.width_ = this.maindiv_.clientWidth;
    this.height_ = this.maindiv_.clientHeight;
  }

  if (old_width != this.width_ || old_height != this.height_) {
    // TODO(danvk): there should be a clear() method.
    this.maindiv_.innerHTML = "";
    this.roller_ = null;
    this.attrs_.labelsDiv = null;
    this.createInterface_();
    if (this.annotations_.length) {
      // createInterface_ reset the layout, so we need to do this.
      this.layout_.setAnnotations(this.annotations_);
    }
    this.predraw_();
  }

  this.resize_lock = false;
};

/**
 * Adjusts the number of points in the rolling average. Updates the graph to
 * reflect the new averaging period.
 * @param {Number} length Number of points over which to average the data.
 */
Dygraph.prototype.adjustRoll = function(length) {
  this.rollPeriod_ = length;
  this.predraw_();
};

/**
 * Returns a boolean array of visibility statuses.
 */
Dygraph.prototype.visibility = function() {
  // Do lazy-initialization, so that this happens after we know the number of
  // data series.
  if (!this.attr_("visibility")) {
    this.attrs_.visibility = [];
  }
  // TODO(danvk): it looks like this could go into an infinite loop w/ user_attrs.
  while (this.attr_("visibility").length < this.numColumns() - 1) {
    this.attrs_.visibility.push(true);
  }
  return this.attr_("visibility");
};

/**
 * Changes the visiblity of a series.
 */
Dygraph.prototype.setVisibility = function(num, value) {
  var x = this.visibility();
  if (num < 0 || num >= x.length) {
    this.warn("invalid series number in setVisibility: " + num);
  } else {
    x[num] = value;
    this.predraw_();
  }
};

/**
 * How large of an area will the dygraph render itself in?
 * This is used for testing.
 * @return A {width: w, height: h} object.
 * @private
 */
Dygraph.prototype.size = function() {
  return { width: this.width_, height: this.height_ };
};

/**
 * Update the list of annotations and redraw the chart.
 * See dygraphs.com/annotations.html for more info on how to use annotations.
 * @param ann {Array} An array of annotation objects.
 * @param suppressDraw {Boolean} Set to "true" to block chart redraw (optional).
 */
Dygraph.prototype.setAnnotations = function(ann, suppressDraw) {
  // Only add the annotation CSS rule once we know it will be used.
  Dygraph.addAnnotationRule();
  this.annotations_ = ann;
  this.layout_.setAnnotations(this.annotations_);
  if (!suppressDraw) {
    this.predraw_();
  }
};

/**
 * Return the list of annotations.
 */
Dygraph.prototype.annotations = function() {
  return this.annotations_;
};

/**
 * Get the list of label names for this graph. The first column is the
 * x-axis, so the data series names start at index 1.
 */
Dygraph.prototype.getLabels = function(name) {
  return this.attr_("labels").slice();
};

/**
 * Get the index of a series (column) given its name. The first column is the
 * x-axis, so the data series start with index 1.
 */
Dygraph.prototype.indexFromSetName = function(name) {
  return this.setIndexByName_[name];
};

/**
 * Get the internal dataset index given its name. These are numbered starting from 0,
 * and only count visible sets.
 * @private
 */
Dygraph.prototype.datasetIndexFromSetName_ = function(name) {
  return this.datasetIndex_[this.indexFromSetName(name)];
};

/**
 * @private
 * Adds a default style for the annotation CSS classes to the document. This is
 * only executed when annotations are actually used. It is designed to only be
 * called once -- all calls after the first will return immediately.
 */
Dygraph.addAnnotationRule = function() {
  if (Dygraph.addedAnnotationCSS) return;

  var rule = "border: 1px solid black; " +
             "background-color: white; " +
             "text-align: center;";

  var styleSheetElement = document.createElement("style");
  styleSheetElement.type = "text/css";
  document.getElementsByTagName("head")[0].appendChild(styleSheetElement);

  // Find the first style sheet that we can access.
  // We may not add a rule to a style sheet from another domain for security
  // reasons. This sometimes comes up when using gviz, since the Google gviz JS
  // adds its own style sheets from google.com.
  for (var i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].disabled) continue;
    var mysheet = document.styleSheets[i];
    try {
      if (mysheet.insertRule) {  // Firefox
        var idx = mysheet.cssRules ? mysheet.cssRules.length : 0;
        mysheet.insertRule(".dygraphDefaultAnnotation { " + rule + " }", idx);
      } else if (mysheet.addRule) {  // IE
        mysheet.addRule(".dygraphDefaultAnnotation", rule);
      }
      Dygraph.addedAnnotationCSS = true;
      return;
    } catch(err) {
      // Was likely a security exception.
    }
  }

  this.warn("Unable to add default annotation CSS rule; display may be off.");
};

// Older pages may still use this name.
var DateGraph = Dygraph;
/**
 * @license
 * Copyright 2011 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview This file contains utility functions used by dygraphs. These
 * are typically static (i.e. not related to any particular dygraph). Examples
 * include date/time formatting functions, basic algorithms (e.g. binary
 * search) and generic DOM-manipulation functions.
 */

/*jshint globalstrict: true */
/*global Dygraph:false, G_vmlCanvasManager:false, Node:false, printStackTrace: false */
"use strict";

Dygraph.LOG_SCALE = 10;
Dygraph.LN_TEN = Math.log(Dygraph.LOG_SCALE);

/** @private */
Dygraph.log10 = function(x) {
  return Math.log(x) / Dygraph.LN_TEN;
};

// Various logging levels.
Dygraph.DEBUG = 1;
Dygraph.INFO = 2;
Dygraph.WARNING = 3;
Dygraph.ERROR = 3;

// Set this to log stack traces on warnings, etc.
// This requires stacktrace.js, which is up to you to provide.
// A copy can be found in the dygraphs repo, or at
// https://github.com/eriwen/javascript-stacktrace
Dygraph.LOG_STACK_TRACES = false;

/** A dotted line stroke pattern. */
Dygraph.DOTTED_LINE = [2, 2];
/** A dashed line stroke pattern. */
Dygraph.DASHED_LINE = [7, 3];
/** A dot dash stroke pattern. */
Dygraph.DOT_DASH_LINE = [7, 2, 2, 2];

/**
 * @private
 * Log an error on the JS console at the given severity.
 * @param { Integer } severity One of Dygraph.{DEBUG,INFO,WARNING,ERROR}
 * @param { String } The message to log.
 */
Dygraph.log = function(severity, message) {
  var st;
  if (typeof(printStackTrace) != 'undefined') {
    // Remove uninteresting bits: logging functions and paths.
    st = printStackTrace({guess:false});
    while (st[0].indexOf("stacktrace") != -1) {
      st.splice(0, 1);
    }

    st.splice(0, 2);
    for (var i = 0; i < st.length; i++) {
      st[i] = st[i].replace(/\([^)]*\/(.*)\)/, '@$1')
          .replace(/\@.*\/([^\/]*)/, '@$1')
          .replace('[object Object].', '');
    }
    var top_msg = st.splice(0, 1)[0];
    message += ' (' + top_msg.replace(/^.*@ ?/, '') + ')';
  }

  if (typeof(console) != 'undefined') {
    switch (severity) {
      case Dygraph.DEBUG:
        console.debug('dygraphs: ' + message);
        break;
      case Dygraph.INFO:
        console.info('dygraphs: ' + message);
        break;
      case Dygraph.WARNING:
        console.warn('dygraphs: ' + message);
        break;
      case Dygraph.ERROR:
        console.error('dygraphs: ' + message);
        break;
    }
  }

  if (Dygraph.LOG_STACK_TRACES) {
    console.log(st.join('\n'));
  }
};

/** @private */
Dygraph.info = function(message) {
  Dygraph.log(Dygraph.INFO, message);
};
/** @private */
Dygraph.prototype.info = Dygraph.info;

/** @private */
Dygraph.warn = function(message) {
  Dygraph.log(Dygraph.WARNING, message);
};
/** @private */
Dygraph.prototype.warn = Dygraph.warn;

/** @private */
Dygraph.error = function(message) {
  Dygraph.log(Dygraph.ERROR, message);
};
/** @private */
Dygraph.prototype.error = Dygraph.error;

/**
 * @private
 * Return the 2d context for a dygraph canvas.
 *
 * This method is only exposed for the sake of replacing the function in
 * automated tests, e.g.
 *
 * var oldFunc = Dygraph.getContext();
 * Dygraph.getContext = function(canvas) {
 *   var realContext = oldFunc(canvas);
 *   return new Proxy(realContext);
 * };
 */
Dygraph.getContext = function(canvas) {
  return canvas.getContext("2d");
};

/**
 * @private
 * Add an event handler. This smooths a difference between IE and the rest of
 * the world.
 * @param { DOM element } elem The element to add the event to.
 * @param { String } type The type of the event, e.g. 'click' or 'mousemove'.
 * @param { Function } fn The function to call on the event. The function takes
 * one parameter: the event object.
 */
Dygraph.addEvent = function addEvent(elem, type, fn) {
  if (elem.addEventListener) {
    elem.addEventListener(type, fn, false);
  } else {
    elem[type+fn] = function(){fn(window.event);};
    elem.attachEvent('on'+type, elem[type+fn]);
  }
};

/**
 * @private
 * Remove an event handler. This smooths a difference between IE and the rest of
 * the world.
 * @param { DOM element } elem The element to add the event to.
 * @param { String } type The type of the event, e.g. 'click' or 'mousemove'.
 * @param { Function } fn The function to call on the event. The function takes
 * one parameter: the event object.
 */
Dygraph.removeEvent = function addEvent(elem, type, fn) {
  if (elem.removeEventListener) {
    elem.removeEventListener(type, fn, false);
  } else {
    elem.detachEvent('on'+type, elem[type+fn]);
    elem[type+fn] = null;
  }
};

/**
 * @private
 * Cancels further processing of an event. This is useful to prevent default
 * browser actions, e.g. highlighting text on a double-click.
 * Based on the article at
 * http://www.switchonthecode.com/tutorials/javascript-tutorial-the-scroll-wheel
 * @param { Event } e The event whose normal behavior should be canceled.
 */
Dygraph.cancelEvent = function(e) {
  e = e ? e : window.event;
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.cancelBubble = true;
  e.cancel = true;
  e.returnValue = false;
  return false;
};

/**
 * Convert hsv values to an rgb(r,g,b) string. Taken from MochiKit.Color. This
 * is used to generate default series colors which are evenly spaced on the
 * color wheel.
 * @param { Number } hue Range is 0.0-1.0.
 * @param { Number } saturation Range is 0.0-1.0.
 * @param { Number } value Range is 0.0-1.0.
 * @return { String } "rgb(r,g,b)" where r, g and b range from 0-255.
 * @private
 */
Dygraph.hsvToRGB = function (hue, saturation, value) {
  var red;
  var green;
  var blue;
  if (saturation === 0) {
    red = value;
    green = value;
    blue = value;
  } else {
    var i = Math.floor(hue * 6);
    var f = (hue * 6) - i;
    var p = value * (1 - saturation);
    var q = value * (1 - (saturation * f));
    var t = value * (1 - (saturation * (1 - f)));
    switch (i) {
      case 1: red = q; green = value; blue = p; break;
      case 2: red = p; green = value; blue = t; break;
      case 3: red = p; green = q; blue = value; break;
      case 4: red = t; green = p; blue = value; break;
      case 5: red = value; green = p; blue = q; break;
      case 6: // fall through
      case 0: red = value; green = t; blue = p; break;
    }
  }
  red = Math.floor(255 * red + 0.5);
  green = Math.floor(255 * green + 0.5);
  blue = Math.floor(255 * blue + 0.5);
  return 'rgb(' + red + ',' + green + ',' + blue + ')';
};

// The following functions are from quirksmode.org with a modification for Safari from
// http://blog.firetree.net/2005/07/04/javascript-find-position/
// http://www.quirksmode.org/js/findpos.html
// ... and modifications to support scrolling divs.

/**
 * Find the x-coordinate of the supplied object relative to the left side
 * of the page.
 * @private
 */
Dygraph.findPosX = function(obj) {
  var curleft = 0;
  if(obj.offsetParent) {
    var copyObj = obj;
    while(1) {
      curleft += copyObj.offsetLeft;
      if(!copyObj.offsetParent) {
        break;
      }
      copyObj = copyObj.offsetParent;
    }
  } else if(obj.x) {
    curleft += obj.x;
  }
  // This handles the case where the object is inside a scrolled div.
  while(obj && obj != document.body) {
    curleft -= obj.scrollLeft;
    obj = obj.parentNode;
  }
  return curleft;
};

/**
 * Find the y-coordinate of the supplied object relative to the top of the
 * page.
 * @private
 */
Dygraph.findPosY = function(obj) {
  var curtop = 0;
  if(obj.offsetParent) {
    var copyObj = obj;
    while(1) {
      curtop += copyObj.offsetTop;
      if(!copyObj.offsetParent) {
        break;
      }
      copyObj = copyObj.offsetParent;
    }
  } else if(obj.y) {
    curtop += obj.y;
  }
  // This handles the case where the object is inside a scrolled div.
  while(obj && obj != document.body) {
    curtop -= obj.scrollTop;
    obj = obj.parentNode;
  }
  return curtop;
};

/**
 * @private
 * Returns the x-coordinate of the event in a coordinate system where the
 * top-left corner of the page (not the window) is (0,0).
 * Taken from MochiKit.Signal
 */
Dygraph.pageX = function(e) {
  if (e.pageX) {
    return (!e.pageX || e.pageX < 0) ? 0 : e.pageX;
  } else {
    var de = document;
    var b = document.body;
    return e.clientX +
        (de.scrollLeft || b.scrollLeft) -
        (de.clientLeft || 0);
  }
};

/**
 * @private
 * Returns the y-coordinate of the event in a coordinate system where the
 * top-left corner of the page (not the window) is (0,0).
 * Taken from MochiKit.Signal
 */
Dygraph.pageY = function(e) {
  if (e.pageY) {
    return (!e.pageY || e.pageY < 0) ? 0 : e.pageY;
  } else {
    var de = document;
    var b = document.body;
    return e.clientY +
        (de.scrollTop || b.scrollTop) -
        (de.clientTop || 0);
  }
};

/**
 * @private
 * @param { Number } x The number to consider.
 * @return { Boolean } Whether the number is zero or NaN.
 */
// TODO(danvk): rename this function to something like 'isNonZeroNan'.
// TODO(danvk): determine when else this returns false (e.g. for undefined or null)
Dygraph.isOK = function(x) {
  return x && !isNaN(x);
};

/**
 * @private
 * @param { Object } p The point to consider, valid points are {x, y} objects
 * @param { Boolean } allowNaNY Treat point with y=NaN as valid
 * @return { Boolean } Whether the point has numeric x and y.
 */
Dygraph.isValidPoint = function(p, allowNaNY) {
  if (!p) return false; // null or undefined object
  if (p.yval === null) return false; // missing point
  if (p.x === null || p.x === undefined) return false;
  if (p.y === null || p.y === undefined) return false;
  if (isNaN(p.x) || (!allowNaNY && isNaN(p.y))) return false;
  return true;
};

/**
 * Number formatting function which mimicks the behavior of %g in printf, i.e.
 * either exponential or fixed format (without trailing 0s) is used depending on
 * the length of the generated string.  The advantage of this format is that
 * there is a predictable upper bound on the resulting string length,
 * significant figures are not dropped, and normal numbers are not displayed in
 * exponential notation.
 *
 * NOTE: JavaScript's native toPrecision() is NOT a drop-in replacement for %g.
 * It creates strings which are too long for absolute values between 10^-4 and
 * 10^-6, e.g. '0.00001' instead of '1e-5'. See tests/number-format.html for
 * output examples.
 *
 * @param {Number} x The number to format
 * @param {Number} opt_precision The precision to use, default 2.
 * @return {String} A string formatted like %g in printf.  The max generated
 *                  string length should be precision + 6 (e.g 1.123e+300).
 */
Dygraph.floatFormat = function(x, opt_precision) {
  // Avoid invalid precision values; [1, 21] is the valid range.
  var p = Math.min(Math.max(1, opt_precision || 2), 21);

  // This is deceptively simple.  The actual algorithm comes from:
  //
  // Max allowed length = p + 4
  // where 4 comes from 'e+n' and '.'.
  //
  // Length of fixed format = 2 + y + p
  // where 2 comes from '0.' and y = # of leading zeroes.
  //
  // Equating the two and solving for y yields y = 2, or 0.00xxxx which is
  // 1.0e-3.
  //
  // Since the behavior of toPrecision() is identical for larger numbers, we
  // don't have to worry about the other bound.
  //
  // Finally, the argument for toExponential() is the number of trailing digits,
  // so we take off 1 for the value before the '.'.
  return (Math.abs(x) < 1.0e-3 && x !== 0.0) ?
      x.toExponential(p - 1) : x.toPrecision(p);
};

/**
 * @private
 * Converts '9' to '09' (useful for dates)
 */
Dygraph.zeropad = function(x) {
  if (x < 10) return "0" + x; else return "" + x;
};

/**
 * Return a string version of the hours, minutes and seconds portion of a date.
 * @param {Number} date The JavaScript date (ms since epoch)
 * @return {String} A time of the form "HH:MM:SS"
 * @private
 */
Dygraph.hmsString_ = function(date) {
  var zeropad = Dygraph.zeropad;
  var d = new Date(date);
  if (d.getSeconds()) {
    return zeropad(d.getHours()) + ":" +
           zeropad(d.getMinutes()) + ":" +
           zeropad(d.getSeconds());
  } else {
    return zeropad(d.getHours()) + ":" + zeropad(d.getMinutes());
  }
};

/**
 * Round a number to the specified number of digits past the decimal point.
 * @param {Number} num The number to round
 * @param {Number} places The number of decimals to which to round
 * @return {Number} The rounded number
 * @private
 */
Dygraph.round_ = function(num, places) {
  var shift = Math.pow(10, places);
  return Math.round(num * shift)/shift;
};

/**
 * @private
 * Implementation of binary search over an array.
 * Currently does not work when val is outside the range of arry's values.
 * @param { Integer } val the value to search for
 * @param { Integer[] } arry is the value over which to search
 * @param { Integer } abs If abs > 0, find the lowest entry greater than val
 * If abs < 0, find the highest entry less than val.
 * if abs == 0, find the entry that equals val.
 * @param { Integer } [low] The first index in arry to consider (optional)
 * @param { Integer } [high] The last index in arry to consider (optional)
 */
Dygraph.binarySearch = function(val, arry, abs, low, high) {
  if (low === null || low === undefined ||
      high === null || high === undefined) {
    low = 0;
    high = arry.length - 1;
  }
  if (low > high) {
    return -1;
  }
  if (abs === null || abs === undefined) {
    abs = 0;
  }
  var validIndex = function(idx) {
    return idx >= 0 && idx < arry.length;
  };
  var mid = parseInt((low + high) / 2, 10);
  var element = arry[mid];
  if (element == val) {
    return mid;
  }

  var idx;
  if (element > val) {
    if (abs > 0) {
      // Accept if element > val, but also if prior element < val.
      idx = mid - 1;
      if (validIndex(idx) && arry[idx] < val) {
        return mid;
      }
    }
    return Dygraph.binarySearch(val, arry, abs, low, mid - 1);
  }
  if (element < val) {
    if (abs < 0) {
      // Accept if element < val, but also if prior element > val.
      idx = mid + 1;
      if (validIndex(idx) && arry[idx] > val) {
        return mid;
      }
    }
    return Dygraph.binarySearch(val, arry, abs, mid + 1, high);
  }
};

/**
 * @private
 * Parses a date, returning the number of milliseconds since epoch. This can be
 * passed in as an xValueParser in the Dygraph constructor.
 * TODO(danvk): enumerate formats that this understands.
 * @param {String} A date in YYYYMMDD format.
 * @return {Number} Milliseconds since epoch.
 */
Dygraph.dateParser = function(dateStr) {
  var dateStrSlashed;
  var d;

  // Let the system try the format first, with one caveat:
  // YYYY-MM-DD[ HH:MM:SS] is interpreted as UTC by a variety of browsers.
  // dygraphs displays dates in local time, so this will result in surprising
  // inconsistencies. But if you specify "T" or "Z" (i.e. YYYY-MM-DDTHH:MM:SS),
  // then you probably know what you're doing, so we'll let you go ahead.
  // Issue: http://code.google.com/p/dygraphs/issues/detail?id=255
  if (dateStr.search("-") == -1 ||
      dateStr.search("T") != -1 || dateStr.search("Z") != -1) {
    d = Dygraph.dateStrToMillis(dateStr);
    if (d && !isNaN(d)) return d;
  }

  if (dateStr.search("-") != -1) {  // e.g. '2009-7-12' or '2009-07-12'
    dateStrSlashed = dateStr.replace("-", "/", "g");
    while (dateStrSlashed.search("-") != -1) {
      dateStrSlashed = dateStrSlashed.replace("-", "/");
    }
    d = Dygraph.dateStrToMillis(dateStrSlashed);
  } else if (dateStr.length == 8) {  // e.g. '20090712'
    // TODO(danvk): remove support for this format. It's confusing.
    dateStrSlashed = dateStr.substr(0,4) + "/" + dateStr.substr(4,2) + "/" +
        dateStr.substr(6,2);
    d = Dygraph.dateStrToMillis(dateStrSlashed);
  } else {
    // Any format that Date.parse will accept, e.g. "2009/07/12" or
    // "2009/07/12 12:34:56"
    d = Dygraph.dateStrToMillis(dateStr);
  }

  if (!d || isNaN(d)) {
    Dygraph.error("Couldn't parse " + dateStr + " as a date");
  }
  return d;
};

/**
 * @private
 * This is identical to JavaScript's built-in Date.parse() method, except that
 * it doesn't get replaced with an incompatible method by aggressive JS
 * libraries like MooTools or Joomla.
 * @param { String } str The date string, e.g. "2011/05/06"
 * @return { Integer } millis since epoch
 */
Dygraph.dateStrToMillis = function(str) {
  return new Date(str).getTime();
};

// These functions are all based on MochiKit.
/**
 * Copies all the properties from o to self.
 *
 * @private
 */
Dygraph.update = function (self, o) {
  if (typeof(o) != 'undefined' && o !== null) {
    for (var k in o) {
      if (o.hasOwnProperty(k)) {
        self[k] = o[k];
      }
    }
  }
  return self;
};

/**
 * Copies all the properties from o to self.
 *
 * @private
 */
Dygraph.updateDeep = function (self, o) {
  // Taken from http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
  function isNode(o) {
    return (
      typeof Node === "object" ? o instanceof Node :
      typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
    );
  }

  if (typeof(o) != 'undefined' && o !== null) {
    for (var k in o) {
      if (o.hasOwnProperty(k)) {
        if (o[k] === null) {
          self[k] = null;
        } else if (Dygraph.isArrayLike(o[k])) {
          self[k] = o[k].slice();
        } else if (isNode(o[k])) {
          // DOM objects are shallowly-copied.
          self[k] = o[k];
        } else if (typeof(o[k]) == 'object') {
          if (typeof(self[k]) != 'object') {
            self[k] = {};
          }
          Dygraph.updateDeep(self[k], o[k]);
        } else {
          self[k] = o[k];
        }
      }
    }
  }
  return self;
};

/**
 * @private
 */
Dygraph.isArrayLike = function (o) {
  var typ = typeof(o);
  if (
      (typ != 'object' && !(typ == 'function' &&
        typeof(o.item) == 'function')) ||
      o === null ||
      typeof(o.length) != 'number' ||
      o.nodeType === 3
     ) {
    return false;
  }
  return true;
};

/**
 * @private
 */
Dygraph.isDateLike = function (o) {
  if (typeof(o) != "object" || o === null ||
      typeof(o.getTime) != 'function') {
    return false;
  }
  return true;
};

/**
 * Note: this only seems to work for arrays.
 * @private
 */
Dygraph.clone = function(o) {
  // TODO(danvk): figure out how MochiKit's version works
  var r = [];
  for (var i = 0; i < o.length; i++) {
    if (Dygraph.isArrayLike(o[i])) {
      r.push(Dygraph.clone(o[i]));
    } else {
      r.push(o[i]);
    }
  }
  return r;
};

/**
 * @private
 * Create a new canvas element. This is more complex than a simple
 * document.createElement("canvas") because of IE and excanvas.
 */
Dygraph.createCanvas = function() {
  var canvas = document.createElement("canvas");

  var isIE = (/MSIE/.test(navigator.userAgent) && !window.opera);
  if (isIE && (typeof(G_vmlCanvasManager) != 'undefined')) {
    canvas = G_vmlCanvasManager.initElement(canvas);
  }

  return canvas;
};

/**
 * @private
 * Checks whether the user is on an Android browser.
 * Android does not fully support the <canvas> tag, e.g. w/r/t/ clipping.
 */
Dygraph.isAndroid = function() {
  return (/Android/).test(navigator.userAgent);
};

/**
 * @private
 * Call a function N times at a given interval, then call a cleanup function
 * once. repeat_fn is called once immediately, then (times - 1) times
 * asynchronously. If times=1, then cleanup_fn() is also called synchronously.
 * @param repeat_fn {Function} Called repeatedly -- takes the number of calls
 * (from 0 to times-1) as an argument.
 * @param times {number} The number of times to call repeat_fn
 * @param every_ms {number} Milliseconds between calls
 * @param cleanup_fn {Function} A function to call after all repeat_fn calls.
 * @private
 */
Dygraph.repeatAndCleanup = function(repeat_fn, times, every_ms, cleanup_fn) {
  var count = 0;
  var start_time = new Date().getTime();
  repeat_fn(count);
  if (times == 1) {
    cleanup_fn();
    return;
  }

  (function loop() {
    if (count >= times) return;
    var target_time = start_time + (1 + count) * every_ms;
    setTimeout(function() {
      count++;
      repeat_fn(count);
      if (count >= times - 1) {
        cleanup_fn();
      } else {
        loop();
      }
    }, target_time - new Date().getTime());
    // TODO(danvk): adjust every_ms to produce evenly-timed function calls.
  })();
};

/**
 * @private
 * This function will scan the option list and determine if they
 * require us to recalculate the pixel positions of each point.
 * @param { List } a list of options to check.
 * @return { Boolean } true if the graph needs new points else false.
 */
Dygraph.isPixelChangingOptionList = function(labels, attrs) {
  // A whitelist of options that do not change pixel positions.
  var pixelSafeOptions = {
    'annotationClickHandler': true,
    'annotationDblClickHandler': true,
    'annotationMouseOutHandler': true,
    'annotationMouseOverHandler': true,
    'axisLabelColor': true,
    'axisLineColor': true,
    'axisLineWidth': true,
    'clickCallback': true,
    'digitsAfterDecimal': true,
    'drawCallback': true,
    'drawHighlightPointCallback': true,
    'drawPoints': true,
    'drawPointCallback': true,
    'drawXGrid': true,
    'drawYGrid': true,
    'fillAlpha': true,
    'gridLineColor': true,
    'gridLineWidth': true,
    'hideOverlayOnMouseOut': true,
    'highlightCallback': true,
    'highlightCircleSize': true,
    'interactionModel': true,
    'isZoomedIgnoreProgrammaticZoom': true,
    'labelsDiv': true,
    'labelsDivStyles': true,
    'labelsDivWidth': true,
    'labelsKMB': true,
    'labelsKMG2': true,
    'labelsSeparateLines': true,
    'labelsShowZeroValues': true,
    'legend': true,
    'maxNumberWidth': true,
    'panEdgeFraction': true,
    'pixelsPerYLabel': true,
    'pointClickCallback': true,
    'pointSize': true,
    'rangeSelectorPlotFillColor': true,
    'rangeSelectorPlotStrokeColor': true,
    'showLabelsOnHighlight': true,
    'showRoller': true,
    'sigFigs': true,
    'strokeWidth': true,
    'underlayCallback': true,
    'unhighlightCallback': true,
    'xAxisLabelFormatter': true,
    'xTicker': true,
    'xValueFormatter': true,
    'yAxisLabelFormatter': true,
    'yValueFormatter': true,
    'zoomCallback': true
  };

  // Assume that we do not require new points.
  // This will change to true if we actually do need new points.
  var requiresNewPoints = false;

  // Create a dictionary of series names for faster lookup.
  // If there are no labels, then the dictionary stays empty.
  var seriesNamesDictionary = { };
  if (labels) {
    for (var i = 1; i < labels.length; i++) {
      seriesNamesDictionary[labels[i]] = true;
    }
  }

  // Iterate through the list of updated options.
  for (var property in attrs) {
    // Break early if we already know we need new points from a previous option.
    if (requiresNewPoints) {
      break;
    }
    if (attrs.hasOwnProperty(property)) {
      // Find out of this field is actually a series specific options list.
      if (seriesNamesDictionary[property]) {
        // This property value is a list of options for this series.
        // If any of these sub properties are not pixel safe, set the flag.
        for (var subProperty in attrs[property]) {
          // Break early if we already know we need new points from a previous option.
          if (requiresNewPoints) {
            break;
          }
          if (attrs[property].hasOwnProperty(subProperty) && !pixelSafeOptions[subProperty]) {
            requiresNewPoints = true;
          }
        }
      // If this was not a series specific option list, check if its a pixel changing property.
      } else if (!pixelSafeOptions[property]) {
        requiresNewPoints = true;
      }
    }
  }

  return requiresNewPoints;
};

/**
 * Compares two arrays to see if they are equal. If either parameter is not an
 * array it will return false. Does a shallow compare 
 * Dygraph.compareArrays([[1,2], [3, 4]], [[1,2], [3,4]]) === false.
 * @param array1 first array
 * @param array2 second array
 * @return True if both parameters are arrays, and contents are equal.
 */
Dygraph.compareArrays = function(array1, array2) {
  if (!Dygraph.isArrayLike(array1) || !Dygraph.isArrayLike(array2)) {
    return false;
  }
  if (array1.length !== array2.length) {
    return false;
  }
  for (var i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
};

/**
 * ctx: the canvas context
 * sides: the number of sides in the shape.
 * radius: the radius of the image.
 * cx: center x coordate
 * cy: center y coordinate
 * rotationRadians: the shift of the initial angle, in radians.
 * delta: the angle shift for each line. If missing, creates a regular
 *   polygon.
 */
Dygraph.regularShape_ = function(
    ctx, sides, radius, cx, cy, rotationRadians, delta) {
  rotationRadians = rotationRadians ? rotationRadians : 0;
  delta = delta ? delta : Math.PI * 2 / sides;

  ctx.beginPath();
  var first = true;
  var initialAngle = rotationRadians;
  var angle = initialAngle;

  var computeCoordinates = function() {
    var x = cx + (Math.sin(angle) * radius);
    var y = cy + (-Math.cos(angle) * radius);
    return [x, y]; 
  };

  var initialCoordinates = computeCoordinates();
  var x = initialCoordinates[0];
  var y = initialCoordinates[1];
  ctx.moveTo(x, y);

  for (var idx = 0; idx < sides; idx++) {
    angle = (idx == sides - 1) ? initialAngle : (angle + delta);
    var coords = computeCoordinates();
    ctx.lineTo(coords[0], coords[1]);
  }
  ctx.fill();
  ctx.stroke();
}

Dygraph.shapeFunction_ = function(sides, rotationRadians, delta) {
  return function(g, name, ctx, cx, cy, color, radius) {
    ctx.strokeStyle = color;
    ctx.fillStyle = "white";
    Dygraph.regularShape_(ctx, sides, radius, cx, cy, rotationRadians, delta);
  };
};

Dygraph.DrawPolygon_ = function(sides, rotationRadians, ctx, cx, cy, color, radius, delta) {
  new Dygraph.RegularShape_(sides, rotationRadians, delta).draw(ctx, cx, cy, radius);
}

Dygraph.Circles = {
  DEFAULT : function(g, name, ctx, canvasx, canvasy, color, radius) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(canvasx, canvasy, radius, 0, 2 * Math.PI, false);
    ctx.fill();
  },
  TRIANGLE : Dygraph.shapeFunction_(3),
  SQUARE : Dygraph.shapeFunction_(4, Math.PI / 4),
  DIAMOND : Dygraph.shapeFunction_(4),
  PENTAGON : Dygraph.shapeFunction_(5),
  HEXAGON : Dygraph.shapeFunction_(6),
  CIRCLE : function(g, name, ctx, cx, cy, color, radius) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.fillStyle = "white";
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.stroke();
  },
  STAR : Dygraph.shapeFunction_(5, 0, 4 * Math.PI / 5),
  PLUS : function(g, name, ctx, cx, cy, color, radius) {
    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.moveTo(cx + radius, cy);
    ctx.lineTo(cx - radius, cy);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy + radius);
    ctx.lineTo(cx, cy - radius);
    ctx.closePath();
    ctx.stroke();
  },
  EX : function(g, name, ctx, cx, cy, color, radius) {
    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.moveTo(cx + radius, cy + radius);
    ctx.lineTo(cx - radius, cy - radius);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + radius, cy - radius);
    ctx.lineTo(cx - radius, cy + radius);
    ctx.closePath();
    ctx.stroke();
  }
};
/**
 * @license
 * Copyright 2011 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview A wrapper around the Dygraph class which implements the
 * interface for a GViz (aka Google Visualization API) visualization.
 * It is designed to be a drop-in replacement for Google's AnnotatedTimeline,
 * so the documentation at
 * http://code.google.com/apis/chart/interactive/docs/gallery/annotatedtimeline.html
 * translates over directly.
 *
 * For a full demo, see:
 * - http://dygraphs.com/tests/gviz.html
 * - http://dygraphs.com/tests/annotation-gviz.html
 */

/*jshint globalstrict: true */
/*global Dygraph:false */
"use strict";

/**
 * A wrapper around Dygraph that implements the gviz API.
 * @param {Object} container The DOM object the visualization should live in.
 */
Dygraph.GVizChart = function(container) {
  this.container = container;
};

Dygraph.GVizChart.prototype.draw = function(data, options) {
  // Clear out any existing dygraph.
  // TODO(danvk): would it make more sense to simply redraw using the current
  // date_graph object?
  this.container.innerHTML = '';
  if (typeof(this.date_graph) != 'undefined') {
    this.date_graph.destroy();
  }

  this.date_graph = new Dygraph(this.container, data, options);
};

/**
 * Google charts compatible setSelection
 * Only row selection is supported, all points in the row will be highlighted
 * @param {Array} array of the selected cells
 * @public
 */
Dygraph.GVizChart.prototype.setSelection = function(selection_array) {
  var row = false;
  if (selection_array.length) {
    row = selection_array[0].row;
  }
  this.date_graph.setSelection(row);
};

/**
 * Google charts compatible getSelection implementation
 * @return {Array} array of the selected cells
 * @public
 */
Dygraph.GVizChart.prototype.getSelection = function() {
  var selection = [];

  var row = this.date_graph.getSelection();

  if (row < 0) return selection;

  var datasets = this.date_graph.layout_.datasets;
  for (var setIdx = 0; setIdx < datasets.length; ++setIdx) {
    selection.push({row: row, column: setIdx + 1});
  }

  return selection;
};
/**
 * @license
 * Copyright 2011 Robert Konigsberg (konigsberg@google.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview The default interaction model for Dygraphs. This is kept out
 * of dygraph.js for better navigability.
 * @author Robert Konigsberg (konigsberg@google.com)
 */

/*jshint globalstrict: true */
/*global Dygraph:false */
"use strict";

/**
 * A collection of functions to facilitate build custom interaction models.
 * @class
 */
Dygraph.Interaction = {};

/**
 * Called in response to an interaction model operation that
 * should start the default panning behavior.
 *
 * It's used in the default callback for "mousedown" operations.
 * Custom interaction model builders can use it to provide the default
 * panning behavior.
 *
 * @param { Event } event the event object which led to the startPan call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.startPan = function(event, g, context) {
  var i, axis;
  context.isPanning = true;
  var xRange = g.xAxisRange();
  context.dateRange = xRange[1] - xRange[0];
  context.initialLeftmostDate = xRange[0];
  context.xUnitsPerPixel = context.dateRange / (g.plotter_.area.w - 1);

  if (g.attr_("panEdgeFraction")) {
    var maxXPixelsToDraw = g.width_ * g.attr_("panEdgeFraction");
    var xExtremes = g.xAxisExtremes(); // I REALLY WANT TO CALL THIS xTremes!

    var boundedLeftX = g.toDomXCoord(xExtremes[0]) - maxXPixelsToDraw;
    var boundedRightX = g.toDomXCoord(xExtremes[1]) + maxXPixelsToDraw;

    var boundedLeftDate = g.toDataXCoord(boundedLeftX);
    var boundedRightDate = g.toDataXCoord(boundedRightX);
    context.boundedDates = [boundedLeftDate, boundedRightDate];

    var boundedValues = [];
    var maxYPixelsToDraw = g.height_ * g.attr_("panEdgeFraction");

    for (i = 0; i < g.axes_.length; i++) {
      axis = g.axes_[i];
      var yExtremes = axis.extremeRange;

      var boundedTopY = g.toDomYCoord(yExtremes[0], i) + maxYPixelsToDraw;
      var boundedBottomY = g.toDomYCoord(yExtremes[1], i) - maxYPixelsToDraw;

      var boundedTopValue = g.toDataYCoord(boundedTopY);
      var boundedBottomValue = g.toDataYCoord(boundedBottomY);

      boundedValues[i] = [boundedTopValue, boundedBottomValue];
    }
    context.boundedValues = boundedValues;
  }

  // Record the range of each y-axis at the start of the drag.
  // If any axis has a valueRange or valueWindow, then we want a 2D pan.
  // We can't store data directly in g.axes_, because it does not belong to us
  // and could change out from under us during a pan (say if there's a data
  // update).
  context.is2DPan = false;
  context.axes = [];
  for (i = 0; i < g.axes_.length; i++) {
    axis = g.axes_[i];
    var axis_data = {};
    var yRange = g.yAxisRange(i);
    // TODO(konigsberg): These values should be in |context|.
    // In log scale, initialTopValue, dragValueRange and unitsPerPixel are log scale.
    if (axis.logscale) {
      axis_data.initialTopValue = Dygraph.log10(yRange[1]);
      axis_data.dragValueRange = Dygraph.log10(yRange[1]) - Dygraph.log10(yRange[0]);
    } else {
      axis_data.initialTopValue = yRange[1];
      axis_data.dragValueRange = yRange[1] - yRange[0];
    }
    axis_data.unitsPerPixel = axis_data.dragValueRange / (g.plotter_.area.h - 1);
    context.axes.push(axis_data);

    // While calculating axes, set 2dpan.
    if (axis.valueWindow || axis.valueRange) context.is2DPan = true;
  }
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that pans the view.
 *
 * It's used in the default callback for "mousemove" operations.
 * Custom interaction model builders can use it to provide the default
 * panning behavior.
 *
 * @param { Event } event the event object which led to the movePan call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.movePan = function(event, g, context) {
  context.dragEndX = g.dragGetX_(event, context);
  context.dragEndY = g.dragGetY_(event, context);

  var minDate = context.initialLeftmostDate -
    (context.dragEndX - context.dragStartX) * context.xUnitsPerPixel;
  if (context.boundedDates) {
    minDate = Math.max(minDate, context.boundedDates[0]);
  }
  var maxDate = minDate + context.dateRange;
  if (context.boundedDates) {
    if (maxDate > context.boundedDates[1]) {
      // Adjust minDate, and recompute maxDate.
      minDate = minDate - (maxDate - context.boundedDates[1]);
      maxDate = minDate + context.dateRange;
    }
  }

  g.dateWindow_ = [minDate, maxDate];

  // y-axis scaling is automatic unless this is a full 2D pan.
  if (context.is2DPan) {
    // Adjust each axis appropriately.
    for (var i = 0; i < g.axes_.length; i++) {
      var axis = g.axes_[i];
      var axis_data = context.axes[i];

      var pixelsDragged = context.dragEndY - context.dragStartY;
      var unitsDragged = pixelsDragged * axis_data.unitsPerPixel;

      var boundedValue = context.boundedValues ? context.boundedValues[i] : null;

      // In log scale, maxValue and minValue are the logs of those values.
      var maxValue = axis_data.initialTopValue + unitsDragged;
      if (boundedValue) {
        maxValue = Math.min(maxValue, boundedValue[1]);
      }
      var minValue = maxValue - axis_data.dragValueRange;
      if (boundedValue) {
        if (minValue < boundedValue[0]) {
          // Adjust maxValue, and recompute minValue.
          maxValue = maxValue - (minValue - boundedValue[0]);
          minValue = maxValue - axis_data.dragValueRange;
        }
      }
      if (axis.logscale) {
        axis.valueWindow = [ Math.pow(Dygraph.LOG_SCALE, minValue),
                             Math.pow(Dygraph.LOG_SCALE, maxValue) ];
      } else {
        axis.valueWindow = [ minValue, maxValue ];
      }
    }
  }

  g.drawGraph_(false);
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that ends panning.
 *
 * It's used in the default callback for "mouseup" operations.
 * Custom interaction model builders can use it to provide the default
 * panning behavior.
 *
 * @param { Event } event the event object which led to the endPan call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.endPan = function(event, g, context) {
  context.dragEndX = g.dragGetX_(event, context);
  context.dragEndY = g.dragGetY_(event, context);

  var regionWidth = Math.abs(context.dragEndX - context.dragStartX);
  var regionHeight = Math.abs(context.dragEndY - context.dragStartY);

  if (regionWidth < 2 && regionHeight < 2 &&
      g.lastx_ !== undefined && g.lastx_ != -1) {
    Dygraph.Interaction.treatMouseOpAsClick(g, event, context);
  }

  // TODO(konigsberg): mouseup should just delete the
  // context object, and mousedown should create a new one.
  context.isPanning = false;
  context.is2DPan = false;
  context.initialLeftmostDate = null;
  context.dateRange = null;
  context.valueRange = null;
  context.boundedDates = null;
  context.boundedValues = null;
  context.axes = null;
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that starts zooming.
 *
 * It's used in the default callback for "mousedown" operations.
 * Custom interaction model builders can use it to provide the default
 * zooming behavior.
 *
 * @param { Event } event the event object which led to the startZoom call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.startZoom = function(event, g, context) {
  context.isZooming = true;
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that defines zoom boundaries.
 *
 * It's used in the default callback for "mousemove" operations.
 * Custom interaction model builders can use it to provide the default
 * zooming behavior.
 *
 * @param { Event } event the event object which led to the moveZoom call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.moveZoom = function(event, g, context) {
  context.dragEndX = g.dragGetX_(event, context);
  context.dragEndY = g.dragGetY_(event, context);

  var xDelta = Math.abs(context.dragStartX - context.dragEndX);
  var yDelta = Math.abs(context.dragStartY - context.dragEndY);

  // drag direction threshold for y axis is twice as large as x axis
  context.dragDirection = (xDelta < yDelta / 2) ? Dygraph.VERTICAL : Dygraph.HORIZONTAL;

  g.drawZoomRect_(
      context.dragDirection,
      context.dragStartX,
      context.dragEndX,
      context.dragStartY,
      context.dragEndY,
      context.prevDragDirection,
      context.prevEndX,
      context.prevEndY);

  context.prevEndX = context.dragEndX;
  context.prevEndY = context.dragEndY;
  context.prevDragDirection = context.dragDirection;
};

Dygraph.Interaction.treatMouseOpAsClick = function(g, event, context) {
  var clickCallback = g.attr_('clickCallback');
  var pointClickCallback = g.attr_('pointClickCallback');

  var selectedPoint = null;

  // Find out if the click occurs on a point. This only matters if there's a pointClickCallback.
  if (pointClickCallback) {
    var closestIdx = -1;
    var closestDistance = Number.MAX_VALUE;

    // check if the click was on a particular point.
    for (var i = 0; i < g.selPoints_.length; i++) {
      var p = g.selPoints_[i];
      var distance = Math.pow(p.canvasx - context.dragEndX, 2) +
                     Math.pow(p.canvasy - context.dragEndY, 2);
      if (!isNaN(distance) &&
          (closestIdx == -1 || distance < closestDistance)) {
        closestDistance = distance;
        closestIdx = i;
      }
    }

    // Allow any click within two pixels of the dot.
    var radius = g.attr_('highlightCircleSize') + 2;
    if (closestDistance <= radius * radius) {
      selectedPoint = g.selPoints_[closestIdx];
    }
  }

  if (selectedPoint) {
    pointClickCallback(event, selectedPoint);
  }

  // TODO(danvk): pass along more info about the points, e.g. 'x'
  if (clickCallback) {
    clickCallback(event, g.lastx_, g.selPoints_);
  }
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that performs a zoom based on previously defined
 * bounds..
 *
 * It's used in the default callback for "mouseup" operations.
 * Custom interaction model builders can use it to provide the default
 * zooming behavior.
 *
 * @param { Event } event the event object which led to the endZoom call.
 * @param { Dygraph} g The dygraph on which to end the zoom.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.endZoom = function(event, g, context) {
  context.isZooming = false;
  context.dragEndX = g.dragGetX_(event, context);
  context.dragEndY = g.dragGetY_(event, context);
  var regionWidth = Math.abs(context.dragEndX - context.dragStartX);
  var regionHeight = Math.abs(context.dragEndY - context.dragStartY);

  if (regionWidth < 2 && regionHeight < 2 &&
      g.lastx_ !== undefined && g.lastx_ != -1) {
    Dygraph.Interaction.treatMouseOpAsClick(g, event, context);
  }

  if (regionWidth >= 10 && context.dragDirection == Dygraph.HORIZONTAL) {
    g.doZoomX_(Math.min(context.dragStartX, context.dragEndX),
               Math.max(context.dragStartX, context.dragEndX));
    context.cancelNextDblclick = true;
  } else if (regionHeight >= 10 && context.dragDirection == Dygraph.VERTICAL) {
    g.doZoomY_(Math.min(context.dragStartY, context.dragEndY),
               Math.max(context.dragStartY, context.dragEndY));
    context.cancelNextDblclick = true;
  } else {
    g.clearZoomRect_();
  }
  context.dragStartX = null;
  context.dragStartY = null;
};

/**
 * @private
 */
Dygraph.Interaction.startTouch = function(event, g, context) {
  event.preventDefault();  // touch browsers are all nice.
  var touches = [];
  for (var i = 0; i < event.touches.length; i++) {
    var t = event.touches[i];
    // we dispense with 'dragGetX_' because all touchBrowsers support pageX
    touches.push({
      pageX: t.pageX,
      pageY: t.pageY,
      dataX: g.toDataXCoord(t.pageX),
      dataY: g.toDataYCoord(t.pageY)
      // identifier: t.identifier
    });
  }
  context.initialTouches = touches;

  if (touches.length == 1) {
    // This is just a swipe.
    context.initialPinchCenter = touches[0];
    context.touchDirections = { x: true, y: true };
  } else if (touches.length == 2) {
    // It's become a pinch!

    // only screen coordinates can be averaged (data coords could be log scale).
    context.initialPinchCenter = {
      pageX: 0.5 * (touches[0].pageX + touches[1].pageX),
      pageY: 0.5 * (touches[0].pageY + touches[1].pageY),

      // TODO(danvk): remove
      dataX: 0.5 * (touches[0].dataX + touches[1].dataX),
      dataY: 0.5 * (touches[0].dataY + touches[1].dataY)
    };

    // Make pinches in a 45-degree swath around either axis 1-dimensional zooms.
    var initialAngle = 180 / Math.PI * Math.atan2(
        context.initialPinchCenter.pageY - touches[0].pageY,
        touches[0].pageX - context.initialPinchCenter.pageX);

    // use symmetry to get it into the first quadrant.
    initialAngle = Math.abs(initialAngle);
    if (initialAngle > 90) initialAngle = 90 - initialAngle;

    context.touchDirections = {
      x: (initialAngle < (90 - 45/2)),
      y: (initialAngle > 45/2)
    };
  }

  // save the full x & y ranges.
  context.initialRange = {
    x: g.xAxisRange(),
    y: g.yAxisRange()
  };
};

/**
 * @private
 */
Dygraph.Interaction.moveTouch = function(event, g, context) {
  var i, touches = [];
  for (i = 0; i < event.touches.length; i++) {
    var t = event.touches[i];
    touches.push({
      pageX: t.pageX,
      pageY: t.pageY
    });
  }
  var initialTouches = context.initialTouches;

  var c_now;

  // old and new centers.
  var c_init = context.initialPinchCenter;
  if (touches.length == 1) {
    c_now = touches[0];
  } else {
    c_now = {
      pageX: 0.5 * (touches[0].pageX + touches[1].pageX),
      pageY: 0.5 * (touches[0].pageY + touches[1].pageY)
    };
  }

  // this is the "swipe" component
  // we toss it out for now, but could use it in the future.
  var swipe = {
    pageX: c_now.pageX - c_init.pageX,
    pageY: c_now.pageY - c_init.pageY
  };
  var dataWidth = context.initialRange.x[1] - context.initialRange.x[0];
  var dataHeight = context.initialRange.y[0] - context.initialRange.y[1];
  swipe.dataX = (swipe.pageX / g.plotter_.area.w) * dataWidth;
  swipe.dataY = (swipe.pageY / g.plotter_.area.h) * dataHeight;
  var xScale, yScale;

  // The residual bits are usually split into scale & rotate bits, but we split
  // them into x-scale and y-scale bits.
  if (touches.length == 1) {
    xScale = 1.0;
    yScale = 1.0;
  } else if (touches.length == 2) {
    var initHalfWidth = (initialTouches[1].pageX - c_init.pageX);
    xScale = (touches[1].pageX - c_now.pageX) / initHalfWidth;

    var initHalfHeight = (initialTouches[1].pageY - c_init.pageY);
    yScale = (touches[1].pageY - c_now.pageY) / initHalfHeight;
  }

  // Clip scaling to [1/8, 8] to prevent too much blowup.
  xScale = Math.min(8, Math.max(0.125, xScale));
  yScale = Math.min(8, Math.max(0.125, yScale));

  if (context.touchDirections.x) {
    g.dateWindow_ = [
      c_init.dataX - swipe.dataX + (context.initialRange.x[0] - c_init.dataX) / xScale,
      c_init.dataX - swipe.dataX + (context.initialRange.x[1] - c_init.dataX) / xScale
    ];
  }
  
  if (context.touchDirections.y) {
    for (i = 0; i < 1  /*g.axes_.length*/; i++) {
      var axis = g.axes_[i];
      if (axis.logscale) {
        // TODO(danvk): implement
      } else {
        axis.valueWindow = [
          c_init.dataY - swipe.dataY + (context.initialRange.y[0] - c_init.dataY) / yScale,
          c_init.dataY - swipe.dataY + (context.initialRange.y[1] - c_init.dataY) / yScale
        ];
      }
    }
  }

  g.drawGraph_(false);
};

/**
 * @private
 */
Dygraph.Interaction.endTouch = function(event, g, context) {
  if (event.touches.length != 0) {
    // this is effectively a "reset"
    Dygraph.Interaction.startTouch(event, g, context);
  }
};

/**
 * Default interation model for dygraphs. You can refer to specific elements of
 * this when constructing your own interaction model, e.g.:
 * g.updateOptions( {
 *   interactionModel: {
 *     mousedown: Dygraph.defaultInteractionModel.mousedown
 *   }
 * } );
 */
Dygraph.Interaction.defaultModel = {
  // Track the beginning of drag events
  mousedown: function(event, g, context) {
    // Right-click should not initiate a zoom.
    if (event.button && event.button == 2) return;

    context.initializeMouseDown(event, g, context);

    if (event.altKey || event.shiftKey) {
      Dygraph.startPan(event, g, context);
    } else {
      Dygraph.startZoom(event, g, context);
    }
  },

  // Draw zoom rectangles when the mouse is down and the user moves around
  mousemove: function(event, g, context) {
    if (context.isZooming) {
      Dygraph.moveZoom(event, g, context);
    } else if (context.isPanning) {
      Dygraph.movePan(event, g, context);
    }
  },

  mouseup: function(event, g, context) {
    if (context.isZooming) {
      Dygraph.endZoom(event, g, context);
    } else if (context.isPanning) {
      Dygraph.endPan(event, g, context);
    }
  },

  touchstart: function(event, g, context) {
    Dygraph.Interaction.startTouch(event, g, context);
  },
  touchmove: function(event, g, context) {
    Dygraph.Interaction.moveTouch(event, g, context);
  },
  touchend: function(event, g, context) {
    Dygraph.Interaction.endTouch(event, g, context);
  },

  // Temporarily cancel the dragging event when the mouse leaves the graph
  mouseout: function(event, g, context) {
    if (context.isZooming) {
      context.dragEndX = null;
      context.dragEndY = null;
    }
  },

  // Disable zooming out if panning.
  dblclick: function(event, g, context) {
    if (context.cancelNextDblclick) {
      context.cancelNextDblclick = false;
      return;
    }
    if (event.altKey || event.shiftKey) {
      return;
    }
    // TODO(konigsberg): replace g.doUnzoom()_ with something that is
    // friendlier to public use.
    g.doUnzoom_();
  }
};

Dygraph.DEFAULT_ATTRS.interactionModel = Dygraph.Interaction.defaultModel;

// old ways of accessing these methods/properties
Dygraph.defaultInteractionModel = Dygraph.Interaction.defaultModel;
Dygraph.endZoom = Dygraph.Interaction.endZoom;
Dygraph.moveZoom = Dygraph.Interaction.moveZoom;
Dygraph.startZoom = Dygraph.Interaction.startZoom;
Dygraph.endPan = Dygraph.Interaction.endPan;
Dygraph.movePan = Dygraph.Interaction.movePan;
Dygraph.startPan = Dygraph.Interaction.startPan;

Dygraph.Interaction.nonInteractiveModel_ = {
  mousedown: function(event, g, context) {
    context.initializeMouseDown(event, g, context);
  },
  mouseup: function(event, g, context) {
    // TODO(danvk): this logic is repeated in Dygraph.Interaction.endZoom
    context.dragEndX = g.dragGetX_(event, context);
    context.dragEndY = g.dragGetY_(event, context);
    var regionWidth = Math.abs(context.dragEndX - context.dragStartX);
    var regionHeight = Math.abs(context.dragEndY - context.dragStartY);

    if (regionWidth < 2 && regionHeight < 2 &&
        g.lastx_ !== undefined && g.lastx_ != -1) {
      Dygraph.Interaction.treatMouseOpAsClick(g, event, context);
    }
  }
};

// Default interaction model when using the range selector.
Dygraph.Interaction.dragIsPanInteractionModel = {
  mousedown: function(event, g, context) {
    context.initializeMouseDown(event, g, context);
    Dygraph.startPan(event, g, context);
  },
  mousemove: function(event, g, context) {
    if (context.isPanning) {
      Dygraph.movePan(event, g, context);
    }
  },
  mouseup: function(event, g, context) {
    if (context.isPanning) {
      Dygraph.endPan(event, g, context);
    }
  }
};
// Copyright 2011 Paul Felix (paul.eric.felix@gmail.com)
// All Rights Reserved.

/**
 * @fileoverview This file contains the DygraphRangeSelector class used to provide
 * a timeline range selector widget for dygraphs.
 */

/*jshint globalstrict: true */
/*global Dygraph:false */
"use strict";

/**
 * The DygraphRangeSelector class provides a timeline range selector widget.
 * @param {Dygraph} dygraph The dygraph object
 * @constructor
 */
var DygraphRangeSelector = function(dygraph) {
  this.isIE_ = /MSIE/.test(navigator.userAgent) && !window.opera;
  this.isUsingExcanvas_ = dygraph.isUsingExcanvas_;
  this.dygraph_ = dygraph;
  this.createCanvases_();
  if (this.isUsingExcanvas_) {
    this.createIEPanOverlay_();
  }
  this.createZoomHandles_();
  this.initInteraction_();
};

/**
 * Adds the range selector to the dygraph.
 * @param {Object} graphDiv The container div for the range selector.
 * @param {DygraphLayout} layout The DygraphLayout object for this graph.
 */
DygraphRangeSelector.prototype.addToGraph = function(graphDiv, layout) {
  this.layout_ = layout;
  this.resize_();
  graphDiv.appendChild(this.bgcanvas_);
  graphDiv.appendChild(this.fgcanvas_);
  graphDiv.appendChild(this.leftZoomHandle_);
  graphDiv.appendChild(this.rightZoomHandle_);
};

/**
 * Renders the static background portion of the range selector.
 */
DygraphRangeSelector.prototype.renderStaticLayer = function() {
  this.resize_();
  this.drawStaticLayer_();
};

/**
 * Renders the interactive foreground portion of the range selector.
 */
DygraphRangeSelector.prototype.renderInteractiveLayer = function() {
  if (this.isChangingRange_) {
    return;
  }
  this.placeZoomHandles_();
  this.drawInteractiveLayer_();
};

/**
 * @private
 * Resizes the range selector.
 */
DygraphRangeSelector.prototype.resize_ = function() {
  function setElementRect(canvas, rect) {
    canvas.style.top = rect.y + 'px';
    canvas.style.left = rect.x + 'px';
    canvas.width = rect.w;
    canvas.height = rect.h;
    canvas.style.width = canvas.width + 'px';    // for IE
    canvas.style.height = canvas.height + 'px';  // for IE
  }

  var plotArea = this.layout_.getPlotArea();
  var xAxisLabelHeight = this.attr_('axisLabelFontSize') + 2 * this.attr_('axisTickSize');
  this.canvasRect_ = {
    x: plotArea.x,
    y: plotArea.y + plotArea.h + xAxisLabelHeight + 4,
    w: plotArea.w,
    h: this.attr_('rangeSelectorHeight')
  };

  setElementRect(this.bgcanvas_, this.canvasRect_);
  setElementRect(this.fgcanvas_, this.canvasRect_);
};

DygraphRangeSelector.prototype.attr_ = function(name) {
  return this.dygraph_.attr_(name);
};

/**
 * @private
 * Creates the background and foreground canvases.
 */
DygraphRangeSelector.prototype.createCanvases_ = function() {
  this.bgcanvas_ = Dygraph.createCanvas();
  this.bgcanvas_.className = 'dygraph-rangesel-bgcanvas';
  this.bgcanvas_.style.position = 'absolute';
  this.bgcanvas_.style.zIndex = 9;
  this.bgcanvas_ctx_ = Dygraph.getContext(this.bgcanvas_);

  this.fgcanvas_ = Dygraph.createCanvas();
  this.fgcanvas_.className = 'dygraph-rangesel-fgcanvas';
  this.fgcanvas_.style.position = 'absolute';
  this.fgcanvas_.style.zIndex = 9;
  this.fgcanvas_.style.cursor = 'default';
  this.fgcanvas_ctx_ = Dygraph.getContext(this.fgcanvas_);
};

/**
 * @private
 * Creates overlay divs for IE/Excanvas so that mouse events are handled properly.
 */
DygraphRangeSelector.prototype.createIEPanOverlay_ = function() {
  this.iePanOverlay_ = document.createElement("div");
  this.iePanOverlay_.style.position = 'absolute';
  this.iePanOverlay_.style.backgroundColor = 'white';
  this.iePanOverlay_.style.filter = 'alpha(opacity=0)';
  this.iePanOverlay_.style.display = 'none';
  this.iePanOverlay_.style.cursor = 'move';
  this.fgcanvas_.appendChild(this.iePanOverlay_);
};

/**
 * @private
 * Creates the zoom handle elements.
 */
DygraphRangeSelector.prototype.createZoomHandles_ = function() {
  var img = new Image();
  img.className = 'dygraph-rangesel-zoomhandle';
  img.style.position = 'absolute';
  img.style.zIndex = 10;
  img.style.visibility = 'hidden'; // Initially hidden so they don't show up in the wrong place.
  img.style.cursor = 'col-resize';
  if (/MSIE 7/.test(navigator.userAgent)) { // IE7 doesn't support embedded src data.
      img.width = 7;
      img.height = 14;
      img.style.backgroundColor = 'white';
      img.style.border = '1px solid #333333'; // Just show box in IE7.
  } else {
      img.width = 9;
      img.height = 16;
      img.src = 'data:image/png;base64,' +
'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAQCAYAAADESFVDAAAAAXNSR0IArs4c6QAAAAZiS0dEANAA' +
'zwDP4Z7KegAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB9sHGw0cMqdt1UwAAAAZdEVYdENv' +
'bW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAaElEQVQoz+3SsRFAQBCF4Z9WJM8KCDVwownl' +
'6YXsTmCUsyKGkZzcl7zkz3YLkypgAnreFmDEpHkIwVOMfpdi9CEEN2nGpFdwD03yEqDtOgCaun7s' +
'qSTDH32I1pQA2Pb9sZecAxc5r3IAb21d6878xsAAAAAASUVORK5CYII=';
  }

  this.leftZoomHandle_ = img;
  this.rightZoomHandle_ = img.cloneNode(false);
};

/**
 * @private
 * Sets up the interaction for the range selector.
 */
DygraphRangeSelector.prototype.initInteraction_ = function() {
  var self = this;
  var topElem = this.isIE_ ? document : window;
  var xLast = 0;
  var handle = null;
  var isZooming = false;
  var isPanning = false;

  // functions, defined below.  Defining them this way (rather than with
  // "function foo() {...}" makes JSHint happy.
  var toXDataWindow, onZoomStart, onZoom, onZoomEnd, doZoom, isMouseInPanZone,
      onPanStart, onPan, onPanEnd, doPan, onCanvasMouseMove;

  toXDataWindow = function(zoomHandleStatus) {
    var xDataLimits = self.dygraph_.xAxisExtremes();
    var fact = (xDataLimits[1] - xDataLimits[0])/self.canvasRect_.w;
    var xDataMin = xDataLimits[0] + (zoomHandleStatus.leftHandlePos - self.canvasRect_.x)*fact;
    var xDataMax = xDataLimits[0] + (zoomHandleStatus.rightHandlePos - self.canvasRect_.x)*fact;
    return [xDataMin, xDataMax];
  };

  onZoomStart = function(e) {
    Dygraph.cancelEvent(e);
    isZooming = true;
    xLast = e.screenX;
    handle = e.target ? e.target : e.srcElement;
    Dygraph.addEvent(topElem, 'mousemove', onZoom);
    Dygraph.addEvent(topElem, 'mouseup', onZoomEnd);
    self.fgcanvas_.style.cursor = 'col-resize';
  };

  onZoom = function(e) {
    if (!isZooming) {
      return;
    }
    var delX = e.screenX - xLast;
    if (Math.abs(delX) < 4) {
      return;
    }
    xLast = e.screenX;
    var zoomHandleStatus = self.getZoomHandleStatus_();
    var newPos;
    if (handle == self.leftZoomHandle_) {
      newPos = zoomHandleStatus.leftHandlePos + delX;
      newPos = Math.min(newPos, zoomHandleStatus.rightHandlePos - handle.width - 3);
      newPos = Math.max(newPos, self.canvasRect_.x);
    } else {
      newPos = zoomHandleStatus.rightHandlePos + delX;
      newPos = Math.min(newPos, self.canvasRect_.x + self.canvasRect_.w);
      newPos = Math.max(newPos, zoomHandleStatus.leftHandlePos + handle.width + 3);
    }
    var halfHandleWidth = handle.width/2;
    handle.style.left = (newPos - halfHandleWidth) + 'px';
    self.drawInteractiveLayer_();

    // Zoom on the fly (if not using excanvas).
    if (!self.isUsingExcanvas_) {
      doZoom();
    }
  };

  onZoomEnd = function(e) {
    if (!isZooming) {
      return;
    }
    isZooming = false;
    Dygraph.removeEvent(topElem, 'mousemove', onZoom);
    Dygraph.removeEvent(topElem, 'mouseup', onZoomEnd);
    self.fgcanvas_.style.cursor = 'default';

    // If using excanvas, Zoom now.
    if (self.isUsingExcanvas_) {
      doZoom();
    }
  };

  doZoom = function() {
    try {
      var zoomHandleStatus = self.getZoomHandleStatus_();
      self.isChangingRange_ = true;
      if (!zoomHandleStatus.isZoomed) {
        self.dygraph_.doUnzoom_();
      } else {
        var xDataWindow = toXDataWindow(zoomHandleStatus);
        self.dygraph_.doZoomXDates_(xDataWindow[0], xDataWindow[1]);
      }
    } finally {
      self.isChangingRange_ = false;
    }
  };

  isMouseInPanZone = function(e) {
    if (self.isUsingExcanvas_) {
        return e.srcElement == self.iePanOverlay_;
    } else {
      // Getting clientX directly from the event is not accurate enough :(
      var clientX;
      if (e.offsetX != undefined) {
        clientX = self.canvasRect_.x + e.offsetX;
      } else {
        clientX = e.clientX;
      }
      var zoomHandleStatus = self.getZoomHandleStatus_();
      return (clientX > zoomHandleStatus.leftHandlePos && clientX < zoomHandleStatus.rightHandlePos);
    }
  };

  onPanStart = function(e) {
    if (!isPanning && isMouseInPanZone(e) && self.getZoomHandleStatus_().isZoomed) {
      Dygraph.cancelEvent(e);
      isPanning = true;
      xLast = e.screenX;
      Dygraph.addEvent(topElem, 'mousemove', onPan);
      Dygraph.addEvent(topElem, 'mouseup', onPanEnd);
    }
  };

  onPan = function(e) {
    if (!isPanning) {
      return;
    }
    Dygraph.cancelEvent(e);

    var delX = e.screenX - xLast;
    if (Math.abs(delX) < 4) {
      return;
    }
    xLast = e.screenX;

    // Move range view
    var zoomHandleStatus = self.getZoomHandleStatus_();
    var leftHandlePos = zoomHandleStatus.leftHandlePos;
    var rightHandlePos = zoomHandleStatus.rightHandlePos;
    var rangeSize = rightHandlePos - leftHandlePos;
    if (leftHandlePos + delX <= self.canvasRect_.x) {
      leftHandlePos = self.canvasRect_.x;
      rightHandlePos = leftHandlePos + rangeSize;
    } else if (rightHandlePos + delX >= self.canvasRect_.x + self.canvasRect_.w) {
      rightHandlePos = self.canvasRect_.x + self.canvasRect_.w;
      leftHandlePos = rightHandlePos - rangeSize;
    } else {
      leftHandlePos += delX;
      rightHandlePos += delX;
    }
    var halfHandleWidth = self.leftZoomHandle_.width/2;
    self.leftZoomHandle_.style.left = (leftHandlePos - halfHandleWidth) + 'px';
    self.rightZoomHandle_.style.left = (rightHandlePos - halfHandleWidth) + 'px';
    self.drawInteractiveLayer_();

    // Do pan on the fly (if not using excanvas).
    if (!self.isUsingExcanvas_) {
      doPan();
    }
  };

  onPanEnd = function(e) {
    if (!isPanning) {
      return;
    }
    isPanning = false;
    Dygraph.removeEvent(topElem, 'mousemove', onPan);
    Dygraph.removeEvent(topElem, 'mouseup', onPanEnd);
    // If using excanvas, do pan now.
    if (self.isUsingExcanvas_) {
      doPan();
    }
  };

  doPan = function() {
    try {
      self.isChangingRange_ = true;
      self.dygraph_.dateWindow_ = toXDataWindow(self.getZoomHandleStatus_());
      self.dygraph_.drawGraph_(false);
    } finally {
      self.isChangingRange_ = false;
    }
  };

  onCanvasMouseMove = function(e) {
    if (isZooming || isPanning) {
      return;
    }
    var cursor = isMouseInPanZone(e) ? 'move' : 'default';
    if (cursor != self.fgcanvas_.style.cursor) {
      self.fgcanvas_.style.cursor = cursor;
    }
  };

  this.dygraph_.attrs_.interactionModel =
      Dygraph.Interaction.dragIsPanInteractionModel;
  this.dygraph_.attrs_.panEdgeFraction = 0.0001;

  var dragStartEvent = window.opera ? 'mousedown' : 'dragstart';
  Dygraph.addEvent(this.leftZoomHandle_, dragStartEvent, onZoomStart);
  Dygraph.addEvent(this.rightZoomHandle_, dragStartEvent, onZoomStart);

  if (this.isUsingExcanvas_) {
    Dygraph.addEvent(this.iePanOverlay_, 'mousedown', onPanStart);
  } else {
    Dygraph.addEvent(this.fgcanvas_, 'mousedown', onPanStart);
    Dygraph.addEvent(this.fgcanvas_, 'mousemove', onCanvasMouseMove);
  }
};

/**
 * @private
 * Draws the static layer in the background canvas.
 */
DygraphRangeSelector.prototype.drawStaticLayer_ = function() {
  var ctx = this.bgcanvas_ctx_;
  ctx.clearRect(0, 0, this.canvasRect_.w, this.canvasRect_.h);
  try {
    this.drawMiniPlot_();
  } catch(ex) {
    Dygraph.warn(ex);
  }

  var margin = 0.5;
  this.bgcanvas_ctx_.lineWidth = 1;
  ctx.strokeStyle = 'gray';
  ctx.beginPath();
  ctx.moveTo(margin, margin);
  ctx.lineTo(margin, this.canvasRect_.h-margin);
  ctx.lineTo(this.canvasRect_.w-margin, this.canvasRect_.h-margin);
  ctx.lineTo(this.canvasRect_.w-margin, margin);
  ctx.stroke();
};


/**
 * @private
 * Draws the mini plot in the background canvas.
 */
DygraphRangeSelector.prototype.drawMiniPlot_ = function() {
  var fillStyle = this.attr_('rangeSelectorPlotFillColor');
  var strokeStyle = this.attr_('rangeSelectorPlotStrokeColor');
  if (!fillStyle && !strokeStyle) {
    return;
  }

  var combinedSeriesData = this.computeCombinedSeriesAndLimits_();
  var yRange = combinedSeriesData.yMax - combinedSeriesData.yMin;

  // Draw the mini plot.
  var ctx = this.bgcanvas_ctx_;
  var margin = 0.5;

  var xExtremes = this.dygraph_.xAxisExtremes();
  var xRange = Math.max(xExtremes[1] - xExtremes[0], 1.e-30);
  var xFact = (this.canvasRect_.w - margin)/xRange;
  var yFact = (this.canvasRect_.h - margin)/yRange;
  var canvasWidth = this.canvasRect_.w - margin;
  var canvasHeight = this.canvasRect_.h - margin;

  ctx.beginPath();
  ctx.moveTo(margin, canvasHeight);
  for (var i = 0; i < combinedSeriesData.data.length; i++) {
    var dataPoint = combinedSeriesData.data[i];
    var x = (dataPoint[0] - xExtremes[0])*xFact;
    var y = canvasHeight - (dataPoint[1] - combinedSeriesData.yMin)*yFact;
    if (isFinite(x) && isFinite(y)) {
      ctx.lineTo(x, y);
    }
  }
  ctx.lineTo(canvasWidth, canvasHeight);
  ctx.closePath();

  if (fillStyle) {
    var lingrad = this.bgcanvas_ctx_.createLinearGradient(0, 0, 0, canvasHeight);
    lingrad.addColorStop(0, 'white');
    lingrad.addColorStop(1, fillStyle);
    this.bgcanvas_ctx_.fillStyle = lingrad;
    ctx.fill();
  }

  if (strokeStyle) {
    this.bgcanvas_ctx_.strokeStyle = strokeStyle;
    this.bgcanvas_ctx_.lineWidth = 1.5;
    ctx.stroke();
  }
};

/**
 * @private
 * Computes and returns the combinded series data along with min/max for the mini plot.
 * @return {Object} An object containing combinded series array, ymin, ymax.
 */
DygraphRangeSelector.prototype.computeCombinedSeriesAndLimits_ = function() {
  var data = this.dygraph_.rawData_;
  var logscale = this.attr_('logscale');

  // Create a combined series (average of all series values).
  var combinedSeries = [];
  var sum;
  var count;
  var yVal, y;
  var mutipleValues;
  var i, j, k;

  // Find out if data has multiple values per datapoint.
  // Go to first data point that actually has values (see http://code.google.com/p/dygraphs/issues/detail?id=246)
  for (i = 0; i < data.length; i++) {
    if (data[i].length > 1 && data[i][1] != null) {
      mutipleValues = typeof data[i][1] != 'number';
      if (mutipleValues) {
        sum = [];
        count = [];
        for (k = 0; k < data[i][1].length; k++) {
          sum.push(0);
          count.push(0);
        }
      }
      break;
    }
  }

  for (i = 0; i < data.length; i++) {
    var dataPoint = data[i];
    var xVal = dataPoint[0];

    if (mutipleValues) {
      for (k = 0; k < sum.length; k++) {
        sum[k] = count[k] = 0;
      }
    } else {
      sum = count = 0;
    }

    for (j = 1; j < dataPoint.length; j++) {
      if (this.dygraph_.visibility()[j-1]) {
        if (mutipleValues) {
          for (k = 0; k < sum.length; k++) {
            y = dataPoint[j][k];
            if (y === null || isNaN(y)) continue;
            sum[k] += y;
            count[k]++;
          }
        } else {
          y = dataPoint[j];
          if (y === null || isNaN(y)) continue;
          sum += y;
          count++;
        }
      }
    }

    if (mutipleValues) {
      for (k = 0; k < sum.length; k++) {
        sum[k] /= count[k];
      }
      yVal = sum.slice(0);
    } else {
      yVal = sum/count;
    }

    combinedSeries.push([xVal, yVal]);
  }

  // Account for roll period, fractions.
  combinedSeries = this.dygraph_.rollingAverage(combinedSeries, this.dygraph_.rollPeriod_);

  if (typeof combinedSeries[0][1] != 'number') {
    for (i = 0; i < combinedSeries.length; i++) {
      yVal = combinedSeries[i][1];
      combinedSeries[i][1] = yVal[0];
    }
  }

  // Compute the y range.
  var yMin = Number.MAX_VALUE;
  var yMax = -Number.MAX_VALUE;
  for (i = 0; i < combinedSeries.length; i++) {
    yVal = combinedSeries[i][1];
    if (yVal !== null && isFinite(yVal) && (!logscale || yVal > 0)) {
      yMin = Math.min(yMin, yVal);
      yMax = Math.max(yMax, yVal);
    }
  }

  // Convert Y data to log scale if needed.
  // Also, expand the Y range to compress the mini plot a little.
  var extraPercent = 0.25;
  if (logscale) {
    yMax = Dygraph.log10(yMax);
    yMax += yMax*extraPercent;
    yMin = Dygraph.log10(yMin);
    for (i = 0; i < combinedSeries.length; i++) {
      combinedSeries[i][1] = Dygraph.log10(combinedSeries[i][1]);
    }
  } else {
    var yExtra;
    var yRange = yMax - yMin;
    if (yRange <= Number.MIN_VALUE) {
      yExtra = yMax*extraPercent;
    } else {
      yExtra = yRange*extraPercent;
    }
    yMax += yExtra;
    yMin -= yExtra;
  }

  return {data: combinedSeries, yMin: yMin, yMax: yMax};
};

/**
 * @private
 * Places the zoom handles in the proper position based on the current X data window.
 */
DygraphRangeSelector.prototype.placeZoomHandles_ = function() {
  var xExtremes = this.dygraph_.xAxisExtremes();
  var xWindowLimits = this.dygraph_.xAxisRange();
  var xRange = xExtremes[1] - xExtremes[0];
  var leftPercent = Math.max(0, (xWindowLimits[0] - xExtremes[0])/xRange);
  var rightPercent = Math.max(0, (xExtremes[1] - xWindowLimits[1])/xRange);
  var leftCoord = this.canvasRect_.x + this.canvasRect_.w*leftPercent;
  var rightCoord = this.canvasRect_.x + this.canvasRect_.w*(1 - rightPercent);
  var handleTop = Math.max(this.canvasRect_.y, this.canvasRect_.y + (this.canvasRect_.h - this.leftZoomHandle_.height)/2);
  var halfHandleWidth = this.leftZoomHandle_.width/2;
  this.leftZoomHandle_.style.left = (leftCoord - halfHandleWidth) + 'px';
  this.leftZoomHandle_.style.top = handleTop + 'px';
  this.rightZoomHandle_.style.left = (rightCoord - halfHandleWidth) + 'px';
  this.rightZoomHandle_.style.top = this.leftZoomHandle_.style.top;

  this.leftZoomHandle_.style.visibility = 'visible';
  this.rightZoomHandle_.style.visibility = 'visible';
};

/**
 * @private
 * Draws the interactive layer in the foreground canvas.
 */
DygraphRangeSelector.prototype.drawInteractiveLayer_ = function() {
  var ctx = this.fgcanvas_ctx_;
  ctx.clearRect(0, 0, this.canvasRect_.w, this.canvasRect_.h);
  var margin = 1;
  var width = this.canvasRect_.w - margin;
  var height = this.canvasRect_.h - margin;
  var zoomHandleStatus = this.getZoomHandleStatus_();

  ctx.strokeStyle = 'black';
  if (!zoomHandleStatus.isZoomed) {
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, margin);
    ctx.stroke();
    if (this.iePanOverlay_) {
      this.iePanOverlay_.style.display = 'none';
    }
  } else {
    var leftHandleCanvasPos = Math.max(margin, zoomHandleStatus.leftHandlePos - this.canvasRect_.x);
    var rightHandleCanvasPos = Math.min(width, zoomHandleStatus.rightHandlePos - this.canvasRect_.x);

    ctx.fillStyle = 'rgba(240, 240, 240, 0.6)';
    ctx.fillRect(0, 0, leftHandleCanvasPos, this.canvasRect_.h);
    ctx.fillRect(rightHandleCanvasPos, 0, this.canvasRect_.w - rightHandleCanvasPos, this.canvasRect_.h);

    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(leftHandleCanvasPos, margin);
    ctx.lineTo(leftHandleCanvasPos, height);
    ctx.lineTo(rightHandleCanvasPos, height);
    ctx.lineTo(rightHandleCanvasPos, margin);
    ctx.lineTo(width, margin);
    ctx.stroke();

    if (this.isUsingExcanvas_) {
      this.iePanOverlay_.style.width = (rightHandleCanvasPos - leftHandleCanvasPos) + 'px';
      this.iePanOverlay_.style.left = leftHandleCanvasPos + 'px';
      this.iePanOverlay_.style.height = height + 'px';
      this.iePanOverlay_.style.display = 'inline';
    }
  }
};

/**
 * @private
 * Returns the current zoom handle position information.
 * @return {Object} The zoom handle status.
 */
DygraphRangeSelector.prototype.getZoomHandleStatus_ = function() {
  var halfHandleWidth = this.leftZoomHandle_.width/2;
  var leftHandlePos = parseInt(this.leftZoomHandle_.style.left, 10) + halfHandleWidth;
  var rightHandlePos = parseInt(this.rightZoomHandle_.style.left, 10) + halfHandleWidth;
  return {
      leftHandlePos: leftHandlePos,
      rightHandlePos: rightHandlePos,
      isZoomed: (leftHandlePos - 1 > this.canvasRect_.x || rightHandlePos + 1 < this.canvasRect_.x+this.canvasRect_.w)
  };
};
/**
 * @license
 * Copyright 2011 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview Description of this file.
 * @author danvk@google.com (Dan Vanderkam)
 *
 * A ticker is a function with the following interface:
 *
 * function(a, b, pixels, options_view, dygraph, forced_values);
 * -> [ { v: tick1_v, label: tick1_label[, label_v: label_v1] },
 *      { v: tick2_v, label: tick2_label[, label_v: label_v2] },
 *      ...
 *    ]
 *
 * The returned value is called a "tick list".
 *
 * Arguments
 * ---------
 *
 * [a, b] is the range of the axis for which ticks are being generated. For a
 * numeric axis, these will simply be numbers. For a date axis, these will be
 * millis since epoch (convertable to Date objects using "new Date(a)" and "new
 * Date(b)").
 *
 * opts provides access to chart- and axis-specific options. It can be used to
 * access number/date formatting code/options, check for a log scale, etc.
 *
 * pixels is the length of the axis in pixels. opts('pixelsPerLabel') is the
 * minimum amount of space to be allotted to each label. For instance, if
 * pixels=400 and opts('pixelsPerLabel')=40 then the ticker should return
 * between zero and ten (400/40) ticks.
 *
 * dygraph is the Dygraph object for which an axis is being constructed.
 *
 * forced_values is used for secondary y-axes. The tick positions are typically
 * set by the primary y-axis, so the secondary y-axis has no choice in where to
 * put these. It simply has to generate labels for these data values.
 *
 * Tick lists
 * ----------
 * Typically a tick will have both a grid/tick line and a label at one end of
 * that line (at the bottom for an x-axis, at left or right for the y-axis).
 *
 * A tick may be missing one of these two components:
 * - If "label_v" is specified instead of "v", then there will be no tick or
 *   gridline, just a label.
 * - Similarly, if "label" is not specified, then there will be a gridline
 *   without a label.
 *
 * This flexibility is useful in a few situations:
 * - For log scales, some of the tick lines may be too close to all have labels.
 * - For date scales where years are being displayed, it is desirable to display
 *   tick marks at the beginnings of years but labels (e.g. "2006") in the
 *   middle of the years.
 */

/*jshint globalstrict: true */
/*global Dygraph:false */
"use strict";

Dygraph.numericLinearTicks = function(a, b, pixels, opts, dygraph, vals) {
  var nonLogscaleOpts = function(opt) {
    if (opt === 'logscale') return false;
    return opts(opt);
  };
  return Dygraph.numericTicks(a, b, pixels, nonLogscaleOpts, dygraph, vals);
};

Dygraph.numericTicks = function(a, b, pixels, opts, dygraph, vals) {
  var pixels_per_tick = opts('pixelsPerLabel');
  var ticks = [];
  var i, j, tickV, nTicks;
  if (vals) {
    for (i = 0; i < vals.length; i++) {
      ticks.push({v: vals[i]});
    }
  } else {
    // TODO(danvk): factor this log-scale block out into a separate function.
    if (opts("logscale")) {
      nTicks  = Math.floor(pixels / pixels_per_tick);
      var minIdx = Dygraph.binarySearch(a, Dygraph.PREFERRED_LOG_TICK_VALUES, 1);
      var maxIdx = Dygraph.binarySearch(b, Dygraph.PREFERRED_LOG_TICK_VALUES, -1);
      if (minIdx == -1) {
        minIdx = 0;
      }
      if (maxIdx == -1) {
        maxIdx = Dygraph.PREFERRED_LOG_TICK_VALUES.length - 1;
      }
      // Count the number of tick values would appear, if we can get at least
      // nTicks / 4 accept them.
      var lastDisplayed = null;
      if (maxIdx - minIdx >= nTicks / 4) {
        for (var idx = maxIdx; idx >= minIdx; idx--) {
          var tickValue = Dygraph.PREFERRED_LOG_TICK_VALUES[idx];
          var pixel_coord = Math.log(tickValue / a) / Math.log(b / a) * pixels;
          var tick = { v: tickValue };
          if (lastDisplayed === null) {
            lastDisplayed = {
              tickValue : tickValue,
              pixel_coord : pixel_coord
            };
          } else {
            if (Math.abs(pixel_coord - lastDisplayed.pixel_coord) >= pixels_per_tick) {
              lastDisplayed = {
                tickValue : tickValue,
                pixel_coord : pixel_coord
              };
            } else {
              tick.label = "";
            }
          }
          ticks.push(tick);
        }
        // Since we went in backwards order.
        ticks.reverse();
      }
    }

    // ticks.length won't be 0 if the log scale function finds values to insert.
    if (ticks.length === 0) {
      // Basic idea:
      // Try labels every 1, 2, 5, 10, 20, 50, 100, etc.
      // Calculate the resulting tick spacing (i.e. this.height_ / nTicks).
      // The first spacing greater than pixelsPerYLabel is what we use.
      // TODO(danvk): version that works on a log scale.
      var kmg2 = opts("labelsKMG2");
      var mults;
      if (kmg2) {
        mults = [1, 2, 4, 8];
      } else {
        mults = [1, 2, 5];
      }
      var scale, low_val, high_val;
      for (i = -10; i < 50; i++) {
        var base_scale;
        if (kmg2) {
          base_scale = Math.pow(16, i);
        } else {
          base_scale = Math.pow(10, i);
        }
        var spacing = 0;
        for (j = 0; j < mults.length; j++) {
          scale = base_scale * mults[j];
          low_val = Math.floor(a / scale) * scale;
          high_val = Math.ceil(b / scale) * scale;
          nTicks = Math.abs(high_val - low_val) / scale;
          spacing = pixels / nTicks;
          // wish I could break out of both loops at once...
          if (spacing > pixels_per_tick) break;
        }
        if (spacing > pixels_per_tick) break;
      }

      // Construct the set of ticks.
      // Allow reverse y-axis if it's explicitly requested.
      if (low_val > high_val) scale *= -1;
      for (i = 0; i < nTicks; i++) {
        tickV = low_val + i * scale;
        ticks.push( {v: tickV} );
      }
    }
  }

  // Add formatted labels to the ticks.
  var k;
  var k_labels = [];
  if (opts("labelsKMB")) {
    k = 1000;
    k_labels = [ "K", "M", "B", "T", "Q" ];
  }
  if (opts("labelsKMG2")) {
    if (k) Dygraph.warn("Setting both labelsKMB and labelsKMG2. Pick one!");
    k = 1024;
    k_labels = [ "k", "M", "G", "T", "P", "E" ];
  }

  var formatter = opts('axisLabelFormatter');

  // Add labels to the ticks.
  for (i = 0; i < ticks.length; i++) {
    if (ticks[i].label !== undefined) continue;  // Use current label.
    tickV = ticks[i].v;
    var absTickV = Math.abs(tickV);
    // TODO(danvk): set granularity to something appropriate here.
    var label = formatter(tickV, 0, opts, dygraph);
    if (k_labels.length > 0) {
      // TODO(danvk): should this be integrated into the axisLabelFormatter?
      // Round up to an appropriate unit.
      var n = Math.pow(k, k_labels.length);
      for (j = k_labels.length - 1; j >= 0; j--, n /= k) {
        if (absTickV >= n) {
          label = Dygraph.round_(tickV / n, opts('digitsAfterDecimal')) +
              k_labels[j];
          break;
        }
      }
    }
    ticks[i].label = label;
  }

  return ticks;
};


Dygraph.dateTicker = function(a, b, pixels, opts, dygraph, vals) {
  var chosen = Dygraph.pickDateTickGranularity(a, b, pixels, opts);

  if (chosen >= 0) {
    return Dygraph.getDateAxis(a, b, chosen, opts, dygraph);
  } else {
    // this can happen if self.width_ is zero.
    return [];
  }
};

// Time granularity enumeration
Dygraph.SECONDLY = 0;
Dygraph.TWO_SECONDLY = 1;
Dygraph.FIVE_SECONDLY = 2;
Dygraph.TEN_SECONDLY = 3;
Dygraph.THIRTY_SECONDLY  = 4;
Dygraph.MINUTELY = 5;
Dygraph.TWO_MINUTELY = 6;
Dygraph.FIVE_MINUTELY = 7;
Dygraph.TEN_MINUTELY = 8;
Dygraph.THIRTY_MINUTELY = 9;
Dygraph.HOURLY = 10;
Dygraph.TWO_HOURLY = 11;
Dygraph.SIX_HOURLY = 12;
Dygraph.DAILY = 13;
Dygraph.WEEKLY = 14;
Dygraph.MONTHLY = 15;
Dygraph.QUARTERLY = 16;
Dygraph.BIANNUAL = 17;
Dygraph.ANNUAL = 18;
Dygraph.DECADAL = 19;
Dygraph.CENTENNIAL = 20;
Dygraph.NUM_GRANULARITIES = 21;

Dygraph.SHORT_SPACINGS = [];
Dygraph.SHORT_SPACINGS[Dygraph.SECONDLY]        = 1000 * 1;
Dygraph.SHORT_SPACINGS[Dygraph.TWO_SECONDLY]    = 1000 * 2;
Dygraph.SHORT_SPACINGS[Dygraph.FIVE_SECONDLY]   = 1000 * 5;
Dygraph.SHORT_SPACINGS[Dygraph.TEN_SECONDLY]    = 1000 * 10;
Dygraph.SHORT_SPACINGS[Dygraph.THIRTY_SECONDLY] = 1000 * 30;
Dygraph.SHORT_SPACINGS[Dygraph.MINUTELY]        = 1000 * 60;
Dygraph.SHORT_SPACINGS[Dygraph.TWO_MINUTELY]    = 1000 * 60 * 2;
Dygraph.SHORT_SPACINGS[Dygraph.FIVE_MINUTELY]   = 1000 * 60 * 5;
Dygraph.SHORT_SPACINGS[Dygraph.TEN_MINUTELY]    = 1000 * 60 * 10;
Dygraph.SHORT_SPACINGS[Dygraph.THIRTY_MINUTELY] = 1000 * 60 * 30;
Dygraph.SHORT_SPACINGS[Dygraph.HOURLY]          = 1000 * 3600;
Dygraph.SHORT_SPACINGS[Dygraph.TWO_HOURLY]      = 1000 * 3600 * 2;
Dygraph.SHORT_SPACINGS[Dygraph.SIX_HOURLY]      = 1000 * 3600 * 6;
Dygraph.SHORT_SPACINGS[Dygraph.DAILY]           = 1000 * 86400;
Dygraph.SHORT_SPACINGS[Dygraph.WEEKLY]          = 1000 * 604800;

/**
 * @private
 * This is a list of human-friendly values at which to show tick marks on a log
 * scale. It is k * 10^n, where k=1..9 and n=-39..+39, so:
 * ..., 1, 2, 3, 4, 5, ..., 9, 10, 20, 30, ..., 90, 100, 200, 300, ...
 * NOTE: this assumes that Dygraph.LOG_SCALE = 10.
 */
Dygraph.PREFERRED_LOG_TICK_VALUES = function() {
  var vals = [];
  for (var power = -39; power <= 39; power++) {
    var range = Math.pow(10, power);
    for (var mult = 1; mult <= 9; mult++) {
      var val = range * mult;
      vals.push(val);
    }
  }
  return vals;
}();

/**
 * Determine the correct granularity of ticks on a date axis.
 *
 * @param {Number} a Left edge of the chart (ms)
 * @param {Number} b Right edge of the chart (ms)
 * @param {Number} pixels Size of the chart in the relevant dimension (width).
 * @param {Function} opts Function mapping from option name -> value.
 * @return {Number} The appropriate axis granularity for this chart. See the
 * enumeration of possible values in dygraph-tickers.js.
 */
Dygraph.pickDateTickGranularity = function(a, b, pixels, opts) {
  var pixels_per_tick = opts('pixelsPerLabel');
  for (var i = 0; i < Dygraph.NUM_GRANULARITIES; i++) {
    var num_ticks = Dygraph.numDateTicks(a, b, i);
    if (pixels / num_ticks >= pixels_per_tick) {
      return i;
    }
  }
  return -1;
};

Dygraph.numDateTicks = function(start_time, end_time, granularity) {
  if (granularity < Dygraph.MONTHLY) {
    // Generate one tick mark for every fixed interval of time.
    var spacing = Dygraph.SHORT_SPACINGS[granularity];
    return Math.floor(0.5 + 1.0 * (end_time - start_time) / spacing);
  } else {
    var year_mod = 1;  // e.g. to only print one point every 10 years.
    var num_months = 12;
    if (granularity == Dygraph.QUARTERLY) num_months = 3;
    if (granularity == Dygraph.BIANNUAL) num_months = 2;
    if (granularity == Dygraph.ANNUAL) num_months = 1;
    if (granularity == Dygraph.DECADAL) { num_months = 1; year_mod = 10; }
    if (granularity == Dygraph.CENTENNIAL) { num_months = 1; year_mod = 100; }

    var msInYear = 365.2524 * 24 * 3600 * 1000;
    var num_years = 1.0 * (end_time - start_time) / msInYear;
    return Math.floor(0.5 + 1.0 * num_years * num_months / year_mod);
  }
};

Dygraph.getDateAxis = function(start_time, end_time, granularity, opts, dg) {
  var formatter = opts("axisLabelFormatter");
  var ticks = [];
  var t;

  if (granularity < Dygraph.MONTHLY) {
    // Generate one tick mark for every fixed interval of time.
    var spacing = Dygraph.SHORT_SPACINGS[granularity];

    // Find a time less than start_time which occurs on a "nice" time boundary
    // for this granularity.
    var g = spacing / 1000;
    var d = new Date(start_time);
    var x;
    if (g <= 60) {  // seconds
      x = d.getSeconds(); d.setSeconds(x - x % g);
    } else {
      d.setSeconds(0);
      g /= 60;
      if (g <= 60) {  // minutes
        x = d.getMinutes(); d.setMinutes(x - x % g);
      } else {
        d.setMinutes(0);
        g /= 60;

        if (g <= 24) {  // days
          x = d.getHours(); d.setHours(x - x % g);
        } else {
          d.setHours(0);
          g /= 24;

          if (g == 7) {  // one week
            d.setDate(d.getDate() - d.getDay());
          }
        }
      }
    }
    start_time = d.getTime();

    for (t = start_time; t <= end_time; t += spacing) {
      ticks.push({ v:t,
                   label: formatter(new Date(t), granularity, opts, dg)
                 });
    }
  } else {
    // Display a tick mark on the first of a set of months of each year.
    // Years get a tick mark iff y % year_mod == 0. This is useful for
    // displaying a tick mark once every 10 years, say, on long time scales.
    var months;
    var year_mod = 1;  // e.g. to only print one point every 10 years.

    if (granularity == Dygraph.MONTHLY) {
      months = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ];
    } else if (granularity == Dygraph.QUARTERLY) {
      months = [ 0, 3, 6, 9 ];
    } else if (granularity == Dygraph.BIANNUAL) {
      months = [ 0, 6 ];
    } else if (granularity == Dygraph.ANNUAL) {
      months = [ 0 ];
    } else if (granularity == Dygraph.DECADAL) {
      months = [ 0 ];
      year_mod = 10;
    } else if (granularity == Dygraph.CENTENNIAL) {
      months = [ 0 ];
      year_mod = 100;
    } else {
      Dygraph.warn("Span of dates is too long");
    }

    var start_year = new Date(start_time).getFullYear();
    var end_year   = new Date(end_time).getFullYear();
    var zeropad = Dygraph.zeropad;
    for (var i = start_year; i <= end_year; i++) {
      if (i % year_mod !== 0) continue;
      for (var j = 0; j < months.length; j++) {
        var date_str = i + "/" + zeropad(1 + months[j]) + "/01";
        t = Dygraph.dateStrToMillis(date_str);
        if (t < start_time || t > end_time) continue;
        ticks.push({ v:t,
                     label: formatter(new Date(t), granularity, opts, dg)
                   });
      }
    }
  }

  return ticks;
};

// These are set here so that this file can be included after dygraph.js.
Dygraph.DEFAULT_ATTRS.axes.x.ticker = Dygraph.dateTicker;
Dygraph.DEFAULT_ATTRS.axes.y.ticker = Dygraph.numericTicks;
Dygraph.DEFAULT_ATTRS.axes.y2.ticker = Dygraph.numericTicks;
/**
 * A class to parse color values
 *
 * NOTE: modified by danvk. I removed the "getHelpXML" function to reduce the
 * file size, added "use strict" and a few "var" declarations where needed.
 *
 * @author Stoyan Stefanov <sstoo@gmail.com>
 * @link   http://www.phpied.com/rgb-color-parser-in-javascript/
 * @license Use it if you like it
 */
"use strict";

function RGBColor(color_string)
{
    this.ok = false;

    // strip any leading #
    if (color_string.charAt(0) == '#') { // remove # if any
        color_string = color_string.substr(1,6);
    }

    color_string = color_string.replace(/ /g,'');
    color_string = color_string.toLowerCase();

    // before getting into regexps, try simple matches
    // and overwrite the input
    var simple_colors = {
        aliceblue: 'f0f8ff',
        antiquewhite: 'faebd7',
        aqua: '00ffff',
        aquamarine: '7fffd4',
        azure: 'f0ffff',
        beige: 'f5f5dc',
        bisque: 'ffe4c4',
        black: '000000',
        blanchedalmond: 'ffebcd',
        blue: '0000ff',
        blueviolet: '8a2be2',
        brown: 'a52a2a',
        burlywood: 'deb887',
        cadetblue: '5f9ea0',
        chartreuse: '7fff00',
        chocolate: 'd2691e',
        coral: 'ff7f50',
        cornflowerblue: '6495ed',
        cornsilk: 'fff8dc',
        crimson: 'dc143c',
        cyan: '00ffff',
        darkblue: '00008b',
        darkcyan: '008b8b',
        darkgoldenrod: 'b8860b',
        darkgray: 'a9a9a9',
        darkgreen: '006400',
        darkkhaki: 'bdb76b',
        darkmagenta: '8b008b',
        darkolivegreen: '556b2f',
        darkorange: 'ff8c00',
        darkorchid: '9932cc',
        darkred: '8b0000',
        darksalmon: 'e9967a',
        darkseagreen: '8fbc8f',
        darkslateblue: '483d8b',
        darkslategray: '2f4f4f',
        darkturquoise: '00ced1',
        darkviolet: '9400d3',
        deeppink: 'ff1493',
        deepskyblue: '00bfff',
        dimgray: '696969',
        dodgerblue: '1e90ff',
        feldspar: 'd19275',
        firebrick: 'b22222',
        floralwhite: 'fffaf0',
        forestgreen: '228b22',
        fuchsia: 'ff00ff',
        gainsboro: 'dcdcdc',
        ghostwhite: 'f8f8ff',
        gold: 'ffd700',
        goldenrod: 'daa520',
        gray: '808080',
        green: '008000',
        greenyellow: 'adff2f',
        honeydew: 'f0fff0',
        hotpink: 'ff69b4',
        indianred : 'cd5c5c',
        indigo : '4b0082',
        ivory: 'fffff0',
        khaki: 'f0e68c',
        lavender: 'e6e6fa',
        lavenderblush: 'fff0f5',
        lawngreen: '7cfc00',
        lemonchiffon: 'fffacd',
        lightblue: 'add8e6',
        lightcoral: 'f08080',
        lightcyan: 'e0ffff',
        lightgoldenrodyellow: 'fafad2',
        lightgrey: 'd3d3d3',
        lightgreen: '90ee90',
        lightpink: 'ffb6c1',
        lightsalmon: 'ffa07a',
        lightseagreen: '20b2aa',
        lightskyblue: '87cefa',
        lightslateblue: '8470ff',
        lightslategray: '778899',
        lightsteelblue: 'b0c4de',
        lightyellow: 'ffffe0',
        lime: '00ff00',
        limegreen: '32cd32',
        linen: 'faf0e6',
        magenta: 'ff00ff',
        maroon: '800000',
        mediumaquamarine: '66cdaa',
        mediumblue: '0000cd',
        mediumorchid: 'ba55d3',
        mediumpurple: '9370d8',
        mediumseagreen: '3cb371',
        mediumslateblue: '7b68ee',
        mediumspringgreen: '00fa9a',
        mediumturquoise: '48d1cc',
        mediumvioletred: 'c71585',
        midnightblue: '191970',
        mintcream: 'f5fffa',
        mistyrose: 'ffe4e1',
        moccasin: 'ffe4b5',
        navajowhite: 'ffdead',
        navy: '000080',
        oldlace: 'fdf5e6',
        olive: '808000',
        olivedrab: '6b8e23',
        orange: 'ffa500',
        orangered: 'ff4500',
        orchid: 'da70d6',
        palegoldenrod: 'eee8aa',
        palegreen: '98fb98',
        paleturquoise: 'afeeee',
        palevioletred: 'd87093',
        papayawhip: 'ffefd5',
        peachpuff: 'ffdab9',
        peru: 'cd853f',
        pink: 'ffc0cb',
        plum: 'dda0dd',
        powderblue: 'b0e0e6',
        purple: '800080',
        red: 'ff0000',
        rosybrown: 'bc8f8f',
        royalblue: '4169e1',
        saddlebrown: '8b4513',
        salmon: 'fa8072',
        sandybrown: 'f4a460',
        seagreen: '2e8b57',
        seashell: 'fff5ee',
        sienna: 'a0522d',
        silver: 'c0c0c0',
        skyblue: '87ceeb',
        slateblue: '6a5acd',
        slategray: '708090',
        snow: 'fffafa',
        springgreen: '00ff7f',
        steelblue: '4682b4',
        tan: 'd2b48c',
        teal: '008080',
        thistle: 'd8bfd8',
        tomato: 'ff6347',
        turquoise: '40e0d0',
        violet: 'ee82ee',
        violetred: 'd02090',
        wheat: 'f5deb3',
        white: 'ffffff',
        whitesmoke: 'f5f5f5',
        yellow: 'ffff00',
        yellowgreen: '9acd32'
    };
    for (var key in simple_colors) {
        if (color_string == key) {
            color_string = simple_colors[key];
        }
    }
    // emd of simple type-in colors

    // array of color definition objects
    var color_defs = [
        {
            re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
            example: ['rgb(123, 234, 45)', 'rgb(255,234,245)'],
            process: function (bits){
                return [
                    parseInt(bits[1]),
                    parseInt(bits[2]),
                    parseInt(bits[3])
                ];
            }
        },
        {
            re: /^(\w{2})(\w{2})(\w{2})$/,
            example: ['#00ff00', '336699'],
            process: function (bits){
                return [
                    parseInt(bits[1], 16),
                    parseInt(bits[2], 16),
                    parseInt(bits[3], 16)
                ];
            }
        },
        {
            re: /^(\w{1})(\w{1})(\w{1})$/,
            example: ['#fb0', 'f0f'],
            process: function (bits){
                return [
                    parseInt(bits[1] + bits[1], 16),
                    parseInt(bits[2] + bits[2], 16),
                    parseInt(bits[3] + bits[3], 16)
                ];
            }
        }
    ];

    // search through the definitions to find a match
    for (var i = 0; i < color_defs.length; i++) {
        var re = color_defs[i].re;
        var processor = color_defs[i].process;
        var bits = re.exec(color_string);
        if (bits) {
            var channels = processor(bits);
            this.r = channels[0];
            this.g = channels[1];
            this.b = channels[2];
            this.ok = true;
        }

    }

    // validate/cleanup values
    this.r = (this.r < 0 || isNaN(this.r)) ? 0 : ((this.r > 255) ? 255 : this.r);
    this.g = (this.g < 0 || isNaN(this.g)) ? 0 : ((this.g > 255) ? 255 : this.g);
    this.b = (this.b < 0 || isNaN(this.b)) ? 0 : ((this.b > 255) ? 255 : this.b);

    // some getters
    this.toRGB = function () {
        return 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')';
    }
    this.toHex = function () {
        var r = this.r.toString(16);
        var g = this.g.toString(16);
        var b = this.b.toString(16);
        if (r.length == 1) r = '0' + r;
        if (g.length == 1) g = '0' + g;
        if (b.length == 1) b = '0' + b;
        return '#' + r + g + b;
    }


}

Date.ext={};Date.ext.util={};Date.ext.util.xPad=function(x,pad,r){if(typeof (r)=="undefined"){r=10}for(;parseInt(x,10)<r&&r>1;r/=10){x=pad.toString()+x}return x.toString()};Date.prototype.locale="en-GB";if(document.getElementsByTagName("html")&&document.getElementsByTagName("html")[0].lang){Date.prototype.locale=document.getElementsByTagName("html")[0].lang}Date.ext.locales={};Date.ext.locales.en={a:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],A:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],b:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],B:["January","February","March","April","May","June","July","August","September","October","November","December"],c:"%a %d %b %Y %T %Z",p:["AM","PM"],P:["am","pm"],x:"%d/%m/%y",X:"%T"};Date.ext.locales["en-US"]=Date.ext.locales.en;Date.ext.locales["en-US"].c="%a %d %b %Y %r %Z";Date.ext.locales["en-US"].x="%D";Date.ext.locales["en-US"].X="%r";Date.ext.locales["en-GB"]=Date.ext.locales.en;Date.ext.locales["en-AU"]=Date.ext.locales["en-GB"];Date.ext.formats={a:function(d){return Date.ext.locales[d.locale].a[d.getDay()]},A:function(d){return Date.ext.locales[d.locale].A[d.getDay()]},b:function(d){return Date.ext.locales[d.locale].b[d.getMonth()]},B:function(d){return Date.ext.locales[d.locale].B[d.getMonth()]},c:"toLocaleString",C:function(d){return Date.ext.util.xPad(parseInt(d.getFullYear()/100,10),0)},d:["getDate","0"],e:["getDate"," "],g:function(d){return Date.ext.util.xPad(parseInt(Date.ext.util.G(d)/100,10),0)},G:function(d){var y=d.getFullYear();var V=parseInt(Date.ext.formats.V(d),10);var W=parseInt(Date.ext.formats.W(d),10);if(W>V){y++}else{if(W===0&&V>=52){y--}}return y},H:["getHours","0"],I:function(d){var I=d.getHours()%12;return Date.ext.util.xPad(I===0?12:I,0)},j:function(d){var ms=d-new Date(""+d.getFullYear()+"/1/1 GMT");ms+=d.getTimezoneOffset()*60000;var doy=parseInt(ms/60000/60/24,10)+1;return Date.ext.util.xPad(doy,0,100)},m:function(d){return Date.ext.util.xPad(d.getMonth()+1,0)},M:["getMinutes","0"],p:function(d){return Date.ext.locales[d.locale].p[d.getHours()>=12?1:0]},P:function(d){return Date.ext.locales[d.locale].P[d.getHours()>=12?1:0]},S:["getSeconds","0"],u:function(d){var dow=d.getDay();return dow===0?7:dow},U:function(d){var doy=parseInt(Date.ext.formats.j(d),10);var rdow=6-d.getDay();var woy=parseInt((doy+rdow)/7,10);return Date.ext.util.xPad(woy,0)},V:function(d){var woy=parseInt(Date.ext.formats.W(d),10);var dow1_1=(new Date(""+d.getFullYear()+"/1/1")).getDay();var idow=woy+(dow1_1>4||dow1_1<=1?0:1);if(idow==53&&(new Date(""+d.getFullYear()+"/12/31")).getDay()<4){idow=1}else{if(idow===0){idow=Date.ext.formats.V(new Date(""+(d.getFullYear()-1)+"/12/31"))}}return Date.ext.util.xPad(idow,0)},w:"getDay",W:function(d){var doy=parseInt(Date.ext.formats.j(d),10);var rdow=7-Date.ext.formats.u(d);var woy=parseInt((doy+rdow)/7,10);return Date.ext.util.xPad(woy,0,10)},y:function(d){return Date.ext.util.xPad(d.getFullYear()%100,0)},Y:"getFullYear",z:function(d){var o=d.getTimezoneOffset();var H=Date.ext.util.xPad(parseInt(Math.abs(o/60),10),0);var M=Date.ext.util.xPad(o%60,0);return(o>0?"-":"+")+H+M},Z:function(d){return d.toString().replace(/^.*\(([^)]+)\)$/,"$1")},"%":function(d){return"%"}};Date.ext.aggregates={c:"locale",D:"%m/%d/%y",h:"%b",n:"\n",r:"%I:%M:%S %p",R:"%H:%M",t:"\t",T:"%H:%M:%S",x:"locale",X:"locale"};Date.ext.aggregates.z=Date.ext.formats.z(new Date());Date.ext.aggregates.Z=Date.ext.formats.Z(new Date());Date.ext.unsupported={};Date.prototype.strftime=function(fmt){if(!(this.locale in Date.ext.locales)){if(this.locale.replace(/-[a-zA-Z]+$/,"") in Date.ext.locales){this.locale=this.locale.replace(/-[a-zA-Z]+$/,"")}else{this.locale="en-GB"}}var d=this;while(fmt.match(/%[cDhnrRtTxXzZ]/)){fmt=fmt.replace(/%([cDhnrRtTxXzZ])/g,function(m0,m1){var f=Date.ext.aggregates[m1];return(f=="locale"?Date.ext.locales[d.locale][m1]:f)})}var str=fmt.replace(/%([aAbBCdegGHIjmMpPSuUVwWyY%])/g,function(m0,m1){var f=Date.ext.formats[m1];if(typeof (f)=="string"){return d[f]()}else{if(typeof (f)=="function"){return f.call(d,d)}else{if(typeof (f)=="object"&&typeof (f[0])=="string"){return Date.ext.util.xPad(d[f[0]](),f[1])}else{return m1}}}});d=null;return str};
