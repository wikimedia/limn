require.define('/node_modules/limn/graph/graph-view.js', function(require, module, exports, __dirname, __filename, undefined){

var Seq, moment, BaseView, Graph, root, DEBOUNCE_RENDER, GraphView, _;
Seq = require('seq');
moment = require('moment');
_ = require('../util/underscore');
BaseView = require('../base').BaseView;
Graph = require('./graph-model').Graph;
root = function(){
  return this;
}();
DEBOUNCE_RENDER = 100;
/**
 * @class Base view for a Graph visualizations.
 */
GraphView = exports.GraphView = BaseView.extend({
  FILTER_CHART_OPTIONS: ['file', 'labels', 'visibility', 'colors', 'dateWindow', 'ticker', 'timingName', 'xValueParser', 'axisLabelFormatter', 'xAxisLabelFormatter', 'yAxisLabelFormatter', 'valueFormatter', 'xValueFormatter', 'yValueFormatter'],
  __bind__: ['render', 'stopAndRender', 'resizeViewport', 'checkWaiting', 'onReady', 'onSync', 'onModelChange'],
  __debounce__: ['render'],
  tagName: 'section'
  /**
   * The chart type backing this graph.
   * @type ChartType
   */,
  chartType: null,
  constructor: (function(){
    function GraphView(){
      return BaseView.apply(this, arguments);
    }
    return GraphView;
  }()),
  initialize: function(o){
    var name, _i, _ref, _len;
    o == null && (o = {});
    this.model || (this.model = new Graph);
    this.id = this.graph_id = _.domize('graph', this.model.id || this.model.get('slug') || this.model.cid);
    GraphView.__super__.initialize.apply(this, arguments);
    for (_i = 0, _len = (_ref = this.__debounce__).length; _i < _len; ++_i) {
      name = _ref[_i];
      this[name] = _.debounce(this[name], DEBOUNCE_RENDER);
    }
    this.on('start-waiting', this.onStartWaiting, this);
    this.on('stop-waiting', this.onStopWaiting, this);
    if (this.waitingOn) {
      this.onStartWaiting();
    }
    this.on('update', this.onUpdate, this);
    this.model.on('start-waiting', this.wait, this).on('stop-waiting', this.unwait, this).on('sync', this.onSync, this).on('destroy', this.remove, this).on('change', this.render, this).on('change:dataset', this.onModelChange, this).on('change:options', this.onModelChange, this).on('error', this.onModelError, this);
    this.resizeViewport();
    return $(root).on('resize', _.debounce(this.resizeViewport, DEBOUNCE_RENDER));
  },
  loadData: function(){
    var _this = this;
    this.resizeViewport();
    this.wait();
    return Seq().seq_(function(next){
      return _this.model.once('ready', next.ok).load();
    }).seq_(function(next){
      return _this.model.chartType.once('ready', next.ok);
    }).seq_(function(next){
      return _this.model.once('data-ready', next.ok).loadData();
    }).seq(function(){
      _this.unwait();
      return _this.onReady();
    });
  },
  onReady: function(){
    if (this.ready) {
      return;
    }
    this.triggerReady();
    return this.onSync();
  }
  /**
   * Reload the graph definition from the server.
   */,
  load: function(){
    console.log(this + ".load!");
    this.wait();
    this.model.fetch({
      success: this.unwait,
      error: this.unwait
    });
    return false;
  }
  /**
   * Save the graph definition to the server.
   */,
  save: function(){
    var id;
    console.log(this + ".save!");
    this.wait();
    id = this.model.get('slug') || this.model.id;
    this.model.save({
      id: id
    }, {
      wait: true,
      success: this.unwait,
      error: this.unwait
    });
    return false;
  }
  /**
   * Flush all changes.
   */,
  change: function(){
    this.model.change();
    return this;
  },
  chartOptions: function(values, opts){
    var k, v, options, _ref, _i, _len;
    if (arguments.length > 1 && typeof values === 'string') {
      k = arguments[0], v = arguments[1], opts = arguments[2];
      values = (_ref = {}, _ref[k + ""] = v, _ref);
    }
    values || (values = {});
    options = this.model.getOptions({
      keepDefaults: false,
      keepUnchanged: true
    });
    for (_i = 0, _len = (_ref = this.FILTER_CHART_OPTIONS).length; _i < _len; ++_i) {
      k = _ref[_i];
      if (k in options && !options[k]) {
        delete options[k];
      }
    }
    return options;
  },
  toTemplateLocals: function(){
    var attrs, that, callout, yoy, mom;
    attrs = _.extend({}, this.model.attributes);
    if (that = attrs.desc) {
      attrs.desc = jade.filters.markdown(that);
    }
    if (that = attrs.notes) {
      attrs.notes = jade.filters.markdown(that);
    }
    delete attrs.options;
    delete attrs.callout;
    if (callout = this.model.getCalloutData()) {
      yoy = callout.year, mom = callout.month;
      attrs.callout = {
        latest: this.model.chartType.numberFormatter(callout.latest, 2, false).toString(),
        year: {
          dates: yoy.dates.map(function(it){
            return moment(it).format('MMM YY');
          }).join(' &mdash; '),
          value: (100 * yoy.value[2] / yoy.value[0]).toFixed(2) + '%',
          delta: yoy.value[2]
        },
        month: {
          dates: mom.dates.map(function(it){
            return moment(it).format('MMM YY');
          }).join(' &mdash; '),
          value: (100 * mom.value[2] / mom.value[0]).toFixed(2) + '%',
          delta: mom.value[2]
        }
      };
    }
    return __import({
      model: this.model,
      graph_id: this.graph_id,
      view: this,
      slug: '',
      name: '',
      desc: '',
      callout: {
        latest: '',
        year: {
          dates: '',
          value: ''
        },
        month: {
          dates: '',
          value: ''
        }
      }
    }, attrs);
  }
  /**
   * Resize the viewport to the model-specified bounds.
   */,
  resizeViewport: function(){
    var _ref;
    return (_ref = this.model.chartType) != null ? _ref.withView(this).resizeViewport() : void 8;
  }
  /**
   * Redraw chart inside viewport.
   */,
  renderChart: function(){
    var _ref;
    this.chart = (_ref = this.model.chartType) != null ? _ref.withView(this).render() : void 8;
    return this;
  }
  /**
   * Render the chart and other Graph-derived view components.
   */,
  render: function(){
    if (!this.ready) {
      return this;
    }
    this.wait();
    this.checkWaiting();
    GraphView.__super__.render.apply(this, arguments);
    this.renderChart();
    this.unwait();
    this.checkWaiting();
    return this;
  },
  onUpdate: function(self, locals){
    var co, el;
    co = locals.callout;
    el = this.$('.callout');
    el.find('.metric-change .value').removeClass('delta-positive delta-negative');
    if (co.year.delta > 0) {
      el.find(' .metric-change.year-over-year .value').addClass('delta-positive');
    } else if (co.year.delta < 0) {
      el.find(' .metric-change.year-over-year .value').addClass('delta-negative');
    }
    if (co.month.delta > 0) {
      el.find(' .metric-change.month-over-month .value').addClass('delta-positive');
    } else if (co.month.delta < 0) {
      el.find(' .metric-change.month-over-month .value').addClass('delta-negative');
    }
    return this;
  },
  onSync: function(){
    if (!this.ready) {
      return;
    }
    console.info(this + ".sync() --> success!");
    this.chartOptions(this.model.getOptions(), {
      silent: true
    });
    return this.render();
  },
  onStartWaiting: function(){
    var status;
    return status = this.checkWaiting();
  },
  onStopWaiting: function(){
    var status;
    return status = this.checkWaiting();
  },
  onModelError: function(){
    return console.error(this + ".error!", arguments);
  },
  onModelChange: function(){
    var changes, options;
    changes = this.model.changedAttributes();
    options = this.model.getOptions();
    if (changes != null && changes.options) {
      return this.chartOptions(options, {
        silent: true
      });
    }
  },
  stopAndRender: function(){
    this.render.apply(this, arguments);
    return false;
  }
  /**
   * Retrieve or construct the spinner.
   */,
  spinner: function(){
    var el, opts, isHidden;
    el = this.$('.graph-spinner');
    if (!el.data('spinner')) {
      opts = {
        lines: 9,
        length: 2,
        width: 1,
        radius: 7,
        rotate: -10.5,
        trail: 50,
        opacity: 1 / 4,
        shadow: false,
        speed: 1,
        zIndex: 2e9,
        color: '#000',
        top: 'auto',
        left: 'auto',
        className: 'spinner',
        fps: 20,
        hwaccel: Modernizr.csstransforms3d
      };
      isHidden = el.css('display') === 'none';
      el.show().spin(opts);
      if (isHidden) {
        el.hide();
      }
    }
    return el;
  },
  checkWaiting: function(){
    var spinner, isWaiting;
    spinner = this.spinner();
    if (isWaiting = this.waitingOn > 0) {
      spinner.show();
      if (spinner.find('.spinner').css('top') === '0px') {
        spinner.spin(false);
        this.spinner();
      }
    } else {
      spinner.hide();
    }
    return isWaiting;
  }
});
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
