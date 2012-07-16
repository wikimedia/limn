var Seq, op, BaseView, ViewList, DataSetView, MetricEditView, DataSource, DataView, _ref, _;
Seq = require('seq');
_ref = require('limn/util'), _ = _ref._, op = _ref.op;
_ref = require('limn/base'), BaseView = _ref.BaseView, ViewList = _ref.ViewList;
DataSetView = require('limn/data/dataset-view').DataSetView;
MetricEditView = require('limn/data/metric-edit-view').MetricEditView;
DataSource = require('limn/data/datasource-model').DataSource;
/**
 * @class DataSet selection and customization UI (root of the `data` tab).
 */
DataView = exports.DataView = BaseView.extend({
  __bind__: ['onMetricsChanged'],
  tagName: 'section',
  className: 'data-ui',
  template: require('limn/template/data/data'),
  datasources: null
  /**
   * @constructor
   */,
  constructor: (function(){
    function DataView(){
      return BaseView.apply(this, arguments);
    }
    return DataView;
  }()),
  initialize: function(){
    this.graph_id = this.options.graph_id;
    BaseView.prototype.initialize.apply(this, arguments);
    this.metric_views = new ViewList;
    this.datasources = DataSource.getAllSources();
    this.model.metrics.on('add', this.addMetric, this).on('remove', this.removeMetric, this);
    return this.model.once('ready', this.onReady, this);
  },
  onReady: function(){
    var dataset;
    dataset = this.model;
    this.model.metrics.each(this.addMetric, this);
    this.dataset_view = new DataSetView({
      model: this.model,
      graph_id: this.graph_id,
      dataset: dataset,
      datasources: this.datasources
    });
    this.addSubview(this.dataset_view).on('add-metric', this.onMetricsChanged, this).on('remove-metric', this.onMetricsChanged, this).on('select-metric', this.selectMetric, this);
    this.render();
    this.triggerReady();
    return this;
  }
  /**
   * Transform the `columns` field to ensure an Array of {label, type} objects.
   */,
  canonicalizeDataSource: function(ds){
    var cols;
    ds.shortName || (ds.shortName = ds.name);
    ds.title || (ds.title = ds.name);
    ds.subtitle || (ds.subtitle = '');
    cols = ds.columns;
    if (_.isArray(cols)) {
      ds.metrics = _.map(cols, function(col, idx){
        var label, type;
        if (_.isArray(col)) {
          label = col[0], type = col[1];
          return {
            idx: idx,
            label: label,
            type: type || 'int'
          };
        } else {
          return col;
        }
      });
    } else {
      ds.metrics = _.map(cols.labels, function(label, idx){
        return {
          idx: idx,
          label: label,
          type: cols.types[idx] || 'int'
        };
      });
    }
    return ds;
  },
  toTemplateLocals: function(){
    var attrs;
    attrs = _.clone(this.model.attributes);
    return __import({
      graph_id: this.graph_id,
      datasources: this.datasources
    }, attrs);
  },
  addMetric: function(metric){
    var view;
    if (this.metric_views.findByModel(metric)) {
      return metric;
    }
    view = new MetricEditView({
      model: metric,
      graph_id: this.graph_id,
      dataset: this.model,
      datasources: this.datasources
    }).on('metric-update', this.onUpdateMetric, this).on('metric-change', this.onUpdateMetric, this);
    this.metric_views.push(this.addSubview(view));
    this.renderSubviews();
    return metric;
  },
  removeMetric: function(metric){
    var view;
    if (!(view = this.metric_views.findByModel(metric))) {
      return;
    }
    this.metric_views.remove(view);
    this.removeSubview(view);
    return metric;
  },
  selectMetric: function(metric){
    var _ref;
    this.metric_views.invoke('hide');
    this.metric_edit_view = this.metric_views.findByModel(metric);
    if ((_ref = this.metric_edit_view) != null) {
      _ref.show();
    }
    return _.delay(this.onMetricsChanged, 10);
  },
  onMetricsChanged: function(){
    var oldMinHeight, newMinHeight, _ref;
    if (!this.dataset_view) {
      return;
    }
    oldMinHeight = parseInt(this.$el.css('min-height'));
    newMinHeight = Math.max(this.dataset_view.$el.height(), (_ref = this.metric_edit_view) != null ? _ref.$el.height() : void 8);
    return this.$el.css('min-height', newMinHeight);
  },
  onUpdateMetric: function(){
    this.trigger('metric-change', this.model, this);
    return this.render();
  }
});
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}