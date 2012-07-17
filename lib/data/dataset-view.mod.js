require.define('/node_modules/limn/data/dataset-view.js', function(require, module, exports, __dirname, __filename, undefined){

var op, BaseView, DataSetView, DataSetMetricView, _ref, _;
_ref = require('../util'), _ = _ref._, op = _ref.op;
BaseView = require('../base').BaseView;
/**
 * @class
 */
DataSetView = exports.DataSetView = BaseView.extend({
  tagName: 'section',
  className: 'dataset-ui dataset',
  template: require('../template/data/dataset'),
  events: {
    'click  .new-metric-button': 'onNewMetric',
    'click  .delete-metric-button': 'onDeleteMetric',
    'click  .metrics .dataset-metric': 'selectMetric'
  },
  views_by_cid: {},
  active_view: null,
  constructor: (function(){
    function DataSetView(){
      return BaseView.apply(this, arguments);
    }
    return DataSetView;
  }()),
  initialize: function(){
    var _ref;
    _ref = this.options, this.graph_id = _ref.graph_id, this.datasources = _ref.datasources, this.dataset = _ref.dataset;
    BaseView.prototype.initialize.apply(this, arguments);
    this.views_by_cid = {};
    this.model.on('ready', this.addAllMetrics, this);
    return this.model.metrics.on('add', this.addMetric, this).on('remove', this.removeMetric, this).on('change', this.onMetricChange, this).on('reset', this.addAllMetrics, this);
  },
  addMetric: function(metric){
    var that, view;
    if (that = this.views_by_cid[metric.cid]) {
      this.removeSubview(that);
      delete this.views_by_cid[metric.cid];
    }
    view = this.addSubview(new DataSetMetricView({
      model: metric,
      graph_id: this.graph_id
    }));
    this.views_by_cid[metric.cid] = view;
    this.trigger('add-metric', metric, view, this);
    this.render();
    return view;
  },
  removeMetric: function(metric){
    var view;
    if (metric instanceof jQuery.Event || metric instanceof Event) {
      metric = this.getMetricForElement(metric.target);
    }
    if (!metric) {
      return;
    }
    if (view = this.views_by_cid[metric.cid]) {
      this.removeSubview(view);
      delete this.views_by_cid[metric.cid];
      this.trigger('remove-metric', metric, view, this);
    }
    return view;
  },
  addAllMetrics: function(){
    this.removeAllSubviews();
    this.model.metrics.each(this.addMetric, this);
    return this;
  },
  selectMetric: function(metric){
    var view;
    if (metric instanceof jQuery.Event || metric instanceof Event) {
      metric = this.getMetricForElement(metric.target);
    }
    if (!metric) {
      return;
    }
    view = this.active_view = this.views_by_cid[metric.cid];
    this.$('.metrics .dataset-metric').removeClass('metric-active');
    view.$el.addClass('metric-active');
    view.$('.activity-arrow').css('font-size', 2 + view.$el.height());
    this.trigger('select-metric', metric, view, this);
    return this;
  },
  onMetricChange: function(metric){
    var view;
    if (!(view = this.views_by_cid[metric != null ? metric.cid : void 8])) {
      return;
    }
    return view.$('.activity-arrow:visible').css('font-size', 2 + view.$el.height());
  },
  onNewMetric: function(){
    this.model.newMetric();
    return false;
  },
  onDeleteMetric: function(evt){
    var metric;
    metric = this.getMetricForElement(evt.target);
    this.model.metrics.remove(metric);
    return false;
  },
  getMetricForElement: function(el){
    return $(el).parents('.dataset-metric').eq(0).data('model');
  }
});
/**
 * @class
 */
DataSetMetricView = exports.DataSetMetricView = BaseView.extend({
  tagName: 'tr',
  className: 'dataset-metric metric',
  template: require('../template/data/dataset-metric'),
  constructor: (function(){
    function DataSetMetricView(){
      return BaseView.apply(this, arguments);
    }
    return DataSetMetricView;
  }()),
  initialize: function(){
    this.graph_id = this.options.graph_id;
    BaseView.prototype.initialize.apply(this, arguments);
    return this.on('update', this.onUpdate, this);
  },
  toTemplateLocals: function(){
    var m, ts;
    m = DataSetMetricView.__super__.toTemplateLocals.apply(this, arguments);
    return m.graph_id = this.graph_id, m.label = this.model.getLabel(), m.viewClasses = _.compact([this.model.isOk() ? 'valid' : 'invalid', m.visible ? 'visible' : 'hidden', m.disabled ? 'disabled' : void 8]).map(function(it){
      return "metric-" + it;
    }).join(' '), m.source = m.source_id && m.source_col ? m.source_id + "[" + m.source_col + "]" : 'No source', m.timespan = _.every(ts = m.timespan, op.ok) ? ts.start + " to " + ts.end + " by " + ts.step : '&mdash;', m;
  },
  onUpdate: function(){
    return this.$('.col-color').css('color', this.model.get('color'));
  }
});

});
