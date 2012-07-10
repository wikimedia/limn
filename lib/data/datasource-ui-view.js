var op, BaseModel, BaseList, BaseView, DataSourceUIView, _ref, _;
_ref = require('kraken/util'), _ = _ref._, op = _ref.op;
_ref = require('kraken/base'), BaseModel = _ref.BaseModel, BaseList = _ref.BaseList, BaseView = _ref.BaseView;
/**
 * @class
 * Model is a Metric.
 */
DataSourceUIView = exports.DataSourceUIView = BaseView.extend({
  __bind__: [],
  tagName: 'section',
  className: 'datasource-ui',
  template: require('kraken/template/data/datasource-ui'),
  events: {
    'click .datasource-summary': 'onHeaderClick',
    'click .datasource-source-metric': 'onSelectMetric'
  },
  graph_id: null,
  dataset: null,
  datasources: null,
  constructor: (function(){
    function DataSourceUIView(){
      return BaseView.apply(this, arguments);
    }
    return DataSourceUIView;
  }()),
  initialize: function(){
    var _ref;
    this.graph_id = (_ref = this.options).graph_id;
    this.dataset = _ref.dataset;
    this.datasources = _ref.datasources;
    return BaseView.prototype.initialize.apply(this, arguments);
  },
  toTemplateLocals: function(){
    var locals, ds, hasSource, hasMetric, dsts, ts, hasTimespan;
    locals = this.model.toJSON();
    locals.graph_id = this.graph_id;
    locals.dataset = this.dataset;
    locals.datasources = this.datasources;
    locals.cid = this.model.cid;
    ds = this.model.source;
    hasSource = this.model.get('source_id') != null && ds;
    locals.source_summary = !hasSource
      ? '<Select Source>'
      : ds.get('shortName');
    hasMetric = hasSource && this.model.get('source_col') != null;
    locals.metric_summary = !hasMetric
      ? '<Select Metric>'
      : this.model.getSourceColumnName();
    dsts = (ds != null ? ds.get('timespan') : void 8) || {};
    ts = locals.timespan = _.defaults(_.clone(this.model.get('timespan')), dsts);
    hasTimespan = hasMetric && ts.start && ts.end && ts.step;
    locals.timespan_summary = !hasTimespan
      ? '<Select Timespan>'
      : ts.start + " &mdash; " + ts.end;
    return locals;
  },
  onHeaderClick: function(){
    return this.$el.toggleClass('in');
  },
  onSelectMetric: function(evt){
    var el, source_id, source_col, _ref;
    el = $(evt.currentTarget);
    _ref = el.data(), source_id = _ref.source_id, source_col = _ref.source_col;
    source_col = parseInt(source_col);
    if (!source_id || isNaN(source_col)) {
      return;
    }
    this.$('.source-metrics .datasource-source-metric').removeClass('active');
    el.addClass('active');
    this.model.set({
      source_col: source_col,
      source_id: source_id
    });
    return this.trigger('metric-change', this.model, this);
  }
});