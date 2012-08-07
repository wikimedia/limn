require.define('/node_modules/limn/graph/graph-edit-view.js', function(require, module, exports, __dirname, __filename, undefined){

var Seq, moment, Graph, GraphView, ChartOptionScaffold, DEBOUNCE_RENDER, DataView, DataSetView, DataSet, DataSource, root, GraphEditView, _, _ref;
Seq = require('seq');
moment = require('moment');
_ = require('../util/underscore');
Graph = require('./graph-model').Graph;
GraphView = require('./graph-view').GraphView;
_ref = require('../chart'), ChartOptionScaffold = _ref.ChartOptionScaffold, DEBOUNCE_RENDER = _ref.DEBOUNCE_RENDER;
_ref = require('../data'), DataView = _ref.DataView, DataSetView = _ref.DataSetView, DataSet = _ref.DataSet, DataSource = _ref.DataSource;
root = function(){
  return this;
}();
/**
 * @class View for a graph visualization encapsulating the editing UI for:
 * - Graph metadata, such as name, description, slug
 * - Chart options, using ChartOptionScaffold
 */
GraphEditView = exports.GraphEditView = GraphView.extend({
  __bind__: ['wait', 'unwait', 'onChartTypeReady', 'onScaffoldChange', 'onFirstClickRenderOptionsTab', 'onFirstClickRenderDataTab'],
  className: 'graph-edit graph',
  template: require('../template/graph/graph-edit'),
  events: {
    'click    .redraw-button': 'stopAndRender',
    'click    .load-button': 'load',
    'click    .save-button': 'save',
    'click    .done-button': 'done',
    'keypress .graph-name': 'onNameKeypress',
    'keypress .graph-details input[type="text"]': 'onKeypress',
    'keypress .chart-options .value': 'onKeypress',
    'submit   form.graph-details': 'onDetailsSubmit',
    'change   :not(.chart-options) select': 'onDetailsSubmit',
    'submit   form.chart-options': 'onOptionsSubmit',
    'change   .chart-options input[type="checkbox"]': 'onOptionsSubmit'
  },
  routes: {
    'graphs/:graph/edit/info': 'showInfoPane',
    'graphs/:graph/edit/data/metric/:metric': 'showDataPane',
    'graphs/:graph/edit/data': 'showDataPane',
    'graphs/:graph/edit/options/:optionsFilter': 'showOptionsPane',
    'graphs/:graph/edit/options': 'showOptionsPane'
  },
  constructor: (function(){
    function GraphEditView(){
      return GraphView.apply(this, arguments);
    }
    return GraphEditView;
  }()),
  initialize: function(o){
    o == null && (o = {});
    GraphEditView.__super__.initialize.apply(this, arguments);
    this.wait();
    this.scaffold = this.addSubview(new ChartOptionScaffold);
    this.data_view = this.addSubview(new DataView({
      model: this.model.dataset,
      graph_id: this.id
    }));
    this.data_view.on('start-waiting', this.wait, this).on('stop-waiting', this.unwait, this).on('metric-change', this.onDataChange, this);
    this.$el.on('click', '.graph-data-tab', this.onFirstClickRenderDataTab);
    this.$el.on('click', '.graph-options-tab', this.onFirstClickRenderOptionsTab);
    return this.loadData();
  },
  onChartTypeReady: function(){
    this.scaffold.collection.reset(this.model.chartType.options_ordered);
    this.scaffold.on('change', this.onScaffoldChange);
    return this.chartOptions(this.model.getOptions(), {
      silent: true
    });
  },
  loadData: function(){
    var _this = this;
    this.resizeViewport();
    this.wait();
    return Seq().seq_(function(next){
      return DataSource.once('ready', next.ok);
    }).seq_(function(next){
      return GraphEditView.__super__.loadData.apply(_this, arguments);
    }).seq(function(){
      _this.unwait();
      return _this.onReady();
    });
  },
  onReady: function(){
    if (this.ready) {
      return;
    }
    this.unwait();
    this.model.chartType.on('ready', this.onChartTypeReady);
    this.triggerReady();
    this.scaffold.triggerReady();
    this.chartOptions(this.model.getOptions(), {
      silent: true
    });
    this.render();
    this.model.dataset.metrics.on('add remove change', this.render, this);
    this.model.on('metric-data-loaded', this.render, this);
    return _.delay(this.checkWaiting, 50);
  }
  /**
   * Save the graph and return to the graph viewer/browser.
   */,
  done: function(){
    return this.save();
  }
  /**
   * Flush all changes.
   */,
  change: function(){
    this.model.change();
    this.scaffold.invoke('change');
    return this;
  },
  chartOptions: function(values, opts){
    var k, v, fields, options, _ref, _i, _len;
    if (arguments.length > 1 && typeof values === 'string') {
      k = arguments[0], v = arguments[1], opts = arguments[2];
      values = (_ref = {}, _ref[k + ""] = v, _ref);
    }
    fields = this.scaffold.collection;
    if (values) {
      for (k in values) {
        v = values[k];
        if ((_ref = fields.get(k)) != null) {
          _ref.setValue(v, opts);
        }
      }
      return this;
    } else {
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
    }
  },
  attachSubviews: function(){
    GraphEditView.__super__.attachSubviews.apply(this, arguments);
    return this.checkWaiting();
  },
  render: function(){
    if (!(this.ready && !this.isRendering)) {
      return this;
    }
    this.wait();
    this.checkWaiting();
    root.title = this.get('name') + " | Limn";
    GraphEditView.__super__.render.apply(this, arguments);
    this.unwait();
    this.isRendering = false;
    return this;
  }
  /**
   * Update the page URL using HTML5 History API
   */,
  updateURL: function(){
    var json, title, url;
    json = this.toJSON();
    title = (this.model.get('name') || 'New Graph') + " | Edit Graph | Limn";
    url = this.toURL('edit');
    return History.pushState(json, title, url);
  },
  onScaffoldChange: function(scaffold, value, key, field){
    var current;
    current = this.model.getOption(key);
    if (!(_.isEqual(value, current) || (current === void 8 && field.isDefault()))) {
      return this.model.setOption(key, value, {
        silent: true
      });
    }
  },
  onDataChange: function(){
    console.log(this + ".onDataChange!");
    return this.model.once('data-ready', this.render, this).loadData({
      force: true
    });
  },
  onFirstClickRenderOptionsTab: function(){
    this.$el.off('click', '.graph-options-tab', this.onFirstClickRenderOptionsTab);
    return this.scaffold.render();
  },
  onFirstClickRenderDataTab: function(){
    var _this = this;
    this.$el.off('click', '.graph-data-tab', this.onFirstClickRenderDataTab);
    return _.defer(function(){
      return _this.data_view.onMetricsChanged();
    });
  },
  onKeypress: function(evt){
    if (evt.keyCode === 13) {
      return $(evt.target).submit();
    }
  },
  onNameKeypress: function(evt){
    if (evt.keyCode === 13) {
      return this.$('form.graph-details').submit();
    }
  },
  onDetailsSubmit: function(){
    var details;
    console.log(this + ".onDetailsSubmit!");
    this.$('form.graph-details .graph-name').val(this.$('.graph-name-row .graph-name').val());
    details = this.$('form.graph-details').formData();
    this.model.set(details);
    return false;
  },
  onOptionsSubmit: function(){
    console.log(this + ".onOptionsSubmit!");
    this.render();
    return false;
  }
});

});
