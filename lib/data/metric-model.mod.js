require.define('/node_modules/limn/data/metric-model.js', function(require, module, exports, __dirname, __filename, undefined){

var op, BaseModel, BaseList, ProjectColors, DataSourceList, DataSource, Metric, MetricList, _ref, _;
_ref = require('../util'), _ = _ref._, op = _ref.op;
_ref = require('../base'), BaseModel = _ref.BaseModel, BaseList = _ref.BaseList;
ProjectColors = require('./project-colors');
DataSource = DataSourceList = null;
/**
 * @class
 */
Metric = exports.Metric = BaseModel.extend({
  NEW_METRIC_LABEL: 'New Metric',
  urlRoot: '/metrics'
  /**
   * Data source of the Metric.
   * @type DataSource
   */,
  source: null,
  is_def_label: true,
  defaults: function(){
    return {
      index: 0,
      label: '',
      type: 'int',
      timespan: {
        start: null,
        end: null,
        step: null
      },
      disabled: false,
      source_id: null,
      source_col: -1,
      color: null,
      visible: true,
      format_value: null,
      format_axis: null,
      transforms: [],
      scale: 1.0,
      chartType: null
    };
  },
  constructor: (function(){
    function Metric(){
      return BaseModel.apply(this, arguments);
    }
    return Metric;
  }()),
  initialize: function(){
    BaseModel.prototype.initialize.apply(this, arguments);
    this.is_def_label = this.isDefaultLabel();
    this.on('change:source_id', this.load, this);
    this.on('change:source_col', this.updateId, this);
    this.on('change:label', this.updateLabel, this);
    return this.load();
  },
  getDateColumn: function(){
    var _ref;
    return (_ref = this.source) != null ? _ref.getDateColumn() : void 8;
  },
  getData: function(){
    var _ref;
    return (_ref = this.source) != null ? _ref.getColumn(this.get('source_col')) : void 8;
  },
  getLabel: function(){
    return this.get('label') || this.getPlaceholderLabel();
  },
  getPlaceholderLabel: function(){
    var col, name;
    col = this.get('source_col');
    if (this.source && col >= 0) {
      name = this.source.get('shortName') + ", " + this.source.getColumnName(col);
    }
    return name || this.NEW_METRIC_LABEL;
  },
  getSourceColumnName: function(){
    var col;
    col = this.get('source_col');
    if (this.source && col > 0) {
      return this.source.getColumnName(col);
    }
  },
  getColor: function(){
    return this.get('color') || ProjectColors.lookup(this.get('label')) || 'black';
  },
  load: function(opts){
    var source_id, _ref, _this = this;
    opts == null && (opts = {});
    source_id = this.get('source_id');
    if (opts.force || ((_ref = this.source) != null ? _ref.id : void 8) !== source_id) {
      this.resetReady();
    }
    if (this.loading || this.ready) {
      return this;
    }
    if (!(source_id && this.get('source_col') >= 0)) {
      return this.triggerReady();
    }
    this.updateId();
    this.loading = true;
    this.wait();
    this.trigger('load', this);
    DataSource.lookup(source_id, function(err, source){
      _this.loading = false;
      _this.unwait();
      if (err) {
        return console.error(_this + " Error loading DataSource! " + err);
      } else {
        _this.source = source;
        _this.is_def_label = _this.isDefaultLabel();
        _this.updateId();
        return _this.triggerReady();
      }
    });
    return this;
  },
  isDefaultLabel: function(){
    var label;
    label = this.get('label');
    return !label || label === this.getPlaceholderLabel() || label === this.NEW_METRIC_LABEL;
  },
  updateLabel: function(){
    var label;
    if (!this.source) {
      return this;
    }
    label = this.get('label');
    if (!label || this.is_def_label) {
      this.set('label', '');
      this.is_def_label = true;
    } else {
      this.is_def_label = this.isDefaultLabel();
    }
    return this;
  },
  updateId: function(){
    var source_id, source_col;
    source_id = this.get('source_id');
    source_col = this.get('source_col');
    if (source_id && source_col != null) {
      this.id = source_id + "[" + source_col + "]";
    }
    this.updateLabel();
    return this;
  }
  /**
   * Check whether the metric has aiight-looking values so we don't
   * attempt to graph unconfigured crap.
   */,
  isOk: function(){
    var _ref;
    return (_ref = this.source) != null ? _ref.ready : void 8;
  }
});
/**
 * @class
 */
MetricList = exports.MetricList = BaseList.extend({
  urlRoot: '/metrics',
  model: Metric,
  constructor: (function(){
    function MetricList(){
      return BaseList.apply(this, arguments);
    }
    return MetricList;
  }()),
  initialize: function(){
    return BaseList.prototype.initialize.apply(this, arguments);
  },
  comparator: function(metric){
    var _ref;
    return (_ref = metric.get('index')) != null ? _ref : Infinity;
  },
  onlyOk: function(){
    return new MetricList(this.filter(function(it){
      return it.isOk();
    }));
  }
});
setTimeout(function(){
  var _ref;
  return _ref = require('./datasource-model'), DataSource = _ref.DataSource, DataSourceList = _ref.DataSourceList, _ref;
}, 10);

});
