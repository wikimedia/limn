var limn, op, TimeSeriesData, CSVData, BaseModel, BaseList, ModelCache, Metric, MetricList, DataSource, DataSourceList, ALL_SOURCES, sourceCache, _ref, _;
limn = require('../client');
_ref = require('../util'), _ = _ref._, op = _ref.op;
_ref = require('../util/timeseries'), TimeSeriesData = _ref.TimeSeriesData, CSVData = _ref.CSVData;
_ref = require('../base'), BaseModel = _ref.BaseModel, BaseList = _ref.BaseList, ModelCache = _ref.ModelCache;
_ref = require('./metric-model'), Metric = _ref.Metric, MetricList = _ref.MetricList;
/**
 * @class
 */
DataSource = exports.DataSource = BaseModel.extend({
  __bind__: ['onLoadDataSuccess', 'onLoadDataError'],
  urlRoot: '/datasources',
  ready: false
  /**
   * Parsed data for this datasource.
   * @type Array
   */,
  data: null,
  defaults: function(){
    return {
      id: '',
      url: '',
      format: 'json',
      name: '',
      shortName: '',
      title: '',
      subtitle: '',
      desc: '',
      notes: '',
      timespan: {
        start: null,
        end: null,
        step: '1mo'
      },
      columns: [],
      chart: {
        chartType: 'dygraphs',
        options: {}
      }
    };
  },
  url: function(){
    return "/datasources/" + this.id + ".json";
  },
  constructor: (function(){
    function DataSource(){
      return BaseModel.apply(this, arguments);
    }
    return DataSource;
  }()),
  initialize: function(){
    this.attributes = this.canonicalize(this.attributes);
    BaseModel.prototype.initialize.apply(this, arguments);
    this.constructor.register(this);
    this.metrics = new MetricList(this.attributes.metrics);
    return this.on('change:metrics', this.onMetricChange, this);
  },
  canonicalize: function(ds){
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
          col.type || (col.type = 'int');
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
  loadAll: function(){
    this.loader({
      start: function(){
        var _this = this;
        return Seq().seq_(function(next){
          _this.once('fetch-success', next.ok);
          return _this.loadModel();
        }).seq_(function(next){
          _this.once('load-data-success', next.ok);
          return _this.loadData();
        }).seq(function(){
          return _this.trigger('load-success', _this);
        });
      }
    });
    return this;
  },
  loadData: function(){
    this.wait();
    this.trigger('load-data', this);
    if (this.data) {
      return this.onLoadDataSuccess(this.data);
    }
    switch (this.get('format')) {
    case 'json':
      this.loadJSON();
      break;
    case 'csv':
      this.loadCSV();
      break;
    default:
      console.error(this + ".load() Unknown Data Format!");
      this.onLoadDataError(null, 'Unknown Data Format!', new Error('Unknown Data Format!'));
    }
    return this;
  },
  loadJSON: function(){
    var _this = this;
    $.ajax({
      url: this.get('url'),
      dataType: 'json',
      success: function(data){
        return _this.onLoadDataSuccess(new TimeSeriesData(data));
      },
      error: this.onLoadDataError
    });
    return this;
  },
  loadCSV: function(){
    var _this = this;
    $.ajax({
      url: this.get('url'),
      dataType: 'text',
      success: function(data){
        return _this.onLoadDataSuccess(new CSVData(data));
      },
      error: this.onLoadDataError
    });
    return this;
  },
  onLoadDataSuccess: function(data){
    this.data = data;
    this.unwait();
    this.trigger('load-data-success', this);
    return this.triggerReady();
  },
  onLoadDataError: function(jqXHR, txtStatus, err){
    console.error(this + " Error loading data! -- " + msg + ": " + (err || ''));
    this.unwait();
    this._errorLoading = true;
    return this.trigger('load-data-error', this, txtStatus, err);
  },
  getDateColumn: function(){
    var _ref;
    return (_ref = this.data) != null ? _ref.dateColumn : void 8;
  },
  getData: function(){
    var _ref;
    return ((_ref = this.data) != null ? typeof _ref.toJSON == 'function' ? _ref.toJSON() : void 8 : void 8) || this.data;
  },
  getColumn: function(idx){
    var _ref;
    return (_ref = this.data) != null ? _ref.columns[idx] : void 8;
  },
  getColumnName: function(idx){
    var _ref, _ref2;
    return (_ref = this.get('metrics')) != null ? (_ref2 = _ref[idx]) != null ? _ref2.label : void 8 : void 8;
  },
  getColumnIndex: function(name){
    var that;
    if (that = _.find(this.get('metrics'), function(it){
      return it.label === name;
    })) {
      return that.idx;
    }
    return -1;
  },
  onMetricChange: function(){
    return this.metrics.reset(this.get('metrics'));
  }
});
/**
 * @class
 */
DataSourceList = exports.DataSourceList = BaseList.extend({
  urlRoot: '/datasources',
  model: DataSource,
  constructor: (function(){
    function DataSourceList(){
      return BaseList.apply(this, arguments);
    }
    return DataSourceList;
  }()),
  initialize: function(){
    return BaseList.prototype.initialize.apply(this, arguments);
  }
});
ALL_SOURCES = new DataSourceList;
sourceCache = new ModelCache(DataSource, {
  ready: false,
  cache: ALL_SOURCES
});
limn.on('main', function(){
  return $.getJSON(limn.mount('/datasources/all'), function(data){
    ALL_SOURCES.reset(_.map(data, op.I));
    return sourceCache.triggerReady();
  });
});
DataSource.getAllSources = function(){
  return ALL_SOURCES;
};