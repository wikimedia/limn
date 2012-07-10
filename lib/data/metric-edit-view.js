var op, BaseView, Metric, DataSourceUIView, MetricEditView, _ref, _;
_ref = require('kraken/util'), _ = _ref._, op = _ref.op;
BaseView = require('kraken/base').BaseView;
Metric = require('kraken/data/metric-model').Metric;
DataSourceUIView = require('kraken/data/datasource-ui-view').DataSourceUIView;
/**
 * @class
 * Model is a Metric.
 */
MetricEditView = exports.MetricEditView = BaseView.extend({
  __bind__: ['onChange'],
  tagName: 'section',
  className: 'metric-edit-ui',
  template: require('kraken/template/data/metric-edit'),
  callOnReturnKeypress: 'onChange',
  events: {
    'keydown .metric-label': 'onReturnKeypress'
  },
  graph_id: null,
  dataset: null,
  datasources: null,
  datasource_ui_view: null,
  constructor: (function(){
    function MetricEditView(){
      return BaseView.apply(this, arguments);
    }
    return MetricEditView;
  }()),
  initialize: function(){
    var _ref, _this = this;
    this.graph_id = (_ref = this.options).graph_id;
    this.dataset = _ref.dataset;
    this.datasources = _ref.datasources;
    this.model || (this.model = new Metric);
    BaseView.prototype.initialize.apply(this, arguments);
    this.on('attach', this.onAttach, this);
    this.datasource_ui_view = new DataSourceUIView({
      model: this.model,
      graph_id: this.graph_id,
      dataset: this.dataset,
      datasources: this.datasources
    });
    return this.addSubview(this.datasource_ui_view).on('metric-update', function(){
      return _this.trigger('update', _this);
    }).on('metric-change', this.onSourceMetricChange, this);
  },
  toTemplateLocals: function(){
    var locals;
    locals = MetricEditView.__super__.toTemplateLocals.apply(this, arguments);
    return locals.graph_id = this.graph_id, locals.dataset = this.dataset, locals.datasources = this.datasources, locals.placeholder_label = this.model.getPlaceholderLabel(), locals;
  },
  update: function(){
    MetricEditView.__super__.update.apply(this, arguments);
    this.$('.metric-label').attr('placeholder', this.model.getPlaceholderLabel());
    this.$('.color-swatch').data('color', this.model.getColor()).colorpicker('update');
    return this;
  },
  onAttach: function(){
    return this.$('.color-swatch').data('color', this.model.get('color')).colorpicker().on('hide', this.onChange);
  },
  onChange: function(evt){
    var attrs, same;
    attrs = this.$('form.metric-edit-form').formData();
    same = _.isEqual(this.model.attributes, attrs);
    console.log(this + ".onChange! (same? " + same + ")");
    _.dump(this.model.attributes, 'old', !same);
    _.dump(attrs, 'new', !same);
    if (!_.isEqual(this.model.attributes, attrs)) {
      this.model.set(attrs, {
        silent: true
      });
      return this.trigger('metric-update', this);
    }
  },
  onSourceMetricChange: function(metric){
    console.log(this + ".onSourceMetricChange!", metric);
    this.$('.metric-label').attr('placeholder', this.model.getPlaceholderLabel());
    this.trigger('metric-change', this.model, this);
    return this;
  }
});