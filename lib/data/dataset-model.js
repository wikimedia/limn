var Seq, ColorBrewer, op, BaseModel, BaseList, Metric, MetricList, DataSource, DataSourceList, DataSet, _ref, _;
Seq = require('seq');
ColorBrewer = require('colorbrewer');
_ref = require('../util'), _ = _ref._, op = _ref.op;
_ref = require('../base'), BaseModel = _ref.BaseModel, BaseList = _ref.BaseList;
_ref = require('./metric-model'), Metric = _ref.Metric, MetricList = _ref.MetricList;
_ref = require('./datasource-model'), DataSource = _ref.DataSource, DataSourceList = _ref.DataSourceList;
/**
 * @class
 */
DataSet = exports.DataSet = BaseModel.extend({
  urlRoot: '/datasets'
  /**
   * @type DataSourceList
   */,
  sources: null
  /**
   * @type MetricList
   */,
  metrics: null,
  defaults: function(){
    return {
      palette: null,
      lines: [],
      metrics: []
    };
  },
  constructor: (function(){
    function DataSet(attributes, opts){
      attributes == null && (attributes = {});
      this.metrics = new MetricList(attributes.metrics);
      return BaseModel.call(this, attributes, opts);
    }
    return DataSet;
  }()),
  initialize: function(){
    BaseModel.prototype.initialize.apply(this, arguments);
    this.set('metrics', this.metrics, {
      silent: true
    });
    return this.on('change:metrics', this.onMetricChange, this);
  },
  load: function(opts){
    var _this = this;
    opts == null && (opts = {});
    if (opts.force) {
      this.resetReady();
    }
    if (this.loading || this.ready) {
      return this;
    }
    if (!this.metrics.length) {
      return this.triggerReady();
    }
    this.wait();
    this.loading = true;
    this.trigger('load', this);
    Seq(this.metrics.models).parEach_(function(next, metric){
      return metric.once('ready', next.ok).load();
    }).seq(function(){
      _this.loading = false;
      _this.unwait();
      return _this.triggerReady();
    });
    return this;
  }
  /**
   * Override to handle the case where one of our rich sub-objects 
   * (basically `metrics`) is set as a result of the `fetch()` call by the
   * Graph object. To prevent it from blowing away the `MetricList`, we
   * perform a `reset()` here. But that won't trigger a `change:metrics` event,
   * so we do a little dance to set it twice, as object identity would otherwise
   * cause it to think nothing has changed.
   */,
  set: function(key, value, opts){
    var values, _ref;
    if (_.isObject(key) && key != null) {
      _ref = [key, value], values = _ref[0], opts = _ref[1];
    } else {
      values = (_ref = {}, _ref[key + ""] = value, _ref);
    }
    opts || (opts = {});
    for (key in values) {
      value = values[key];
      if (!(key === 'metrics' && _.isArray(value))) {
        continue;
      }
      this.metrics.reset(value);
      delete values[key];
      if (!opts.silent) {
        DataSet.__super__.set.call(this, 'metrics', value, {
          silent: true
        });
        DataSet.__super__.set.call(this, 'metrics', this.metrics, opts);
      }
    }
    return DataSet.__super__.set.call(this, values, opts);
  },
  toJSON: function(){
    var json;
    json = DataSet.__super__.toJSON.apply(this, arguments);
    delete json.id;
    return json;
  }
  /* * * *  TimeSeriesData interface  * * * {{{ */
  /**
   * @returns {Array<Array>} The reified dataset, materialized to a list of rows including timestamps.
   */,
  getData: function(){
    var columns;
    if (!this.ready) {
      return [];
    }
    columns = this.getColumns();
    if (columns != null && columns.length) {
      return _.zip.apply(_, columns);
    } else {
      return [];
    }
  }
  /**
   * @returns {Array<Array>} List of all columns (including date column).
   */,
  getColumns: function(){
    if (!this.ready) {
      return [];
    }
    return _.compact([this.getDateColumn()].concat(this.getDataColumns()));
  }
  /**
   * @returns {Array<Date>} The date column.
   */,
  getDateColumn: function(){
    var dates, maxLen;
    if (!this.ready) {
      return [];
    }
    dates = this.metrics.onlyOk().invoke('getDateColumn');
    maxLen = _.max(_.pluck(dates, 'length'));
    return _.find(dates, function(it){
      return it.length === maxLen;
    });
  }
  /**
   * @returns {Array<Array>} List of all columns except the date column.
   */,
  getDataColumns: function(){
    if (!this.ready) {
      return [];
    }
    return this.metrics.onlyOk().invoke('getData');
  }
  /**
   * @returns {Array<String>} List of column labels.
   */,
  getLabels: function(){
    if (!this.ready) {
      return [];
    }
    return ['Date'].concat(this.metrics.onlyOk().invoke('getLabel'));
  },
  getColors: function(){
    if (!this.ready) {
      return [];
    }
    return this.metrics.onlyOk().invoke('getColor');
  },
  newMetric: function(){
    var index, m, _this = this;
    index = this.metrics.length;
    this.metrics.add(m = new Metric({
      index: index,
      color: ColorBrewer.Spectral[11][index]
    }));
    m.on('ready', function(){
      return _this.trigger('metric-data-loaded', _this, m);
    });
    return m;
  },
  onMetricChange: function(){
    this.resetReady();
    return this.load();
  }
});