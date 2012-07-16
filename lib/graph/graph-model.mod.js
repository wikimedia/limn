require.define('/node_modules/limn/graph/graph-model.js', function(require, module, exports, __dirname, __filename, undefined){

var Seq, Cascade, BaseModel, BaseList, ModelCache, ChartType, DataSet, root, Graph, GraphList, _ref, _;
Seq = require('seq');
_ref = require('limn/util'), _ = _ref._, Cascade = _ref.Cascade;
_ref = require('limn/base'), BaseModel = _ref.BaseModel, BaseList = _ref.BaseList, ModelCache = _ref.ModelCache;
ChartType = require('limn/chart').ChartType;
DataSet = require('limn/data').DataSet;
root = function(){
  return this;
}();
/**
 * Represents a Graph, including its charting options, dataset, annotations, and all
 * other settings for both its content and presentation.
 */
Graph = exports.Graph = BaseModel.extend({
  IGNORE_OPTIONS: ['width', 'height', 'timingName'],
  urlRoot: '/graphs'
  /**
   * Whether this Graph has loaded all assets, parent-graphs, and related
   * resources.
   * @type Boolean
   */,
  ready: false
  /**
   * Whether this Graph has loaded the actual data needed to draw the chart.
   * @type Boolean
   */,
  dataReady: false
  /**
   * The chart type backing this graph.
   * @type ChartType
   */,
  chartType: null
  /**
   * List of graph parents.
   * @type GraphList
   */,
  parents: null
  /**
   * Cascade of objects for options lookup (includes own options).
   * @type Cascade
   * @private
   */,
  optionCascade: null
  /**
   * Attribute defaults.
   */,
  defaults: function(){
    return {
      slug: '',
      name: '',
      desc: '',
      notes: '',
      width: 'auto',
      height: 320,
      parents: ['root'],
      data: {
        palette: null,
        metrics: [],
        lines: []
      },
      callout: {
        enabled: true,
        metric_idx: 0,
        label: ''
      },
      chartType: 'dygraphs',
      options: {}
    };
  },
  url: function(){
    return this.urlRoot + "/" + this.get('slug') + ".json";
  },
  constructor: (function(){
    function Graph(attributes, opts){
      attributes == null && (attributes = {});
      attributes.options || (attributes.options = {});
      if (attributes.id != null) {
        attributes.slug || (attributes.slug = attributes.id);
      }
      this.optionCascade = new Cascade(attributes.options);
      return BaseModel.call(this, attributes, opts);
    }
    return Graph;
  }()),
  initialize: function(attributes){
    var _this = this;
    BaseModel.prototype.initialize.apply(this, arguments);
    this.constructor.register(this);
    this.parents = new GraphList;
    this.chartType = ChartType.create(this);
    this.on('change:chartType', function(){
      return _this.chartType = ChartType.create(_this);
    });
    this.dataset = new DataSet((__import({
      id: this.id
    }, this.get('data')))).on('change', this.onDataSetChange, this).on('metric-data-loaded', function(dataset, metric){
      return _this.trigger('metric-data-loaded', _this, metric);
    });
    this.set('data', this.dataset, {
      silent: true
    });
    return this.trigger('init', this);
  },
  load: function(opts){
    var _this = this;
    opts == null && (opts = {});
    if ((this.loading || this.ready) && !opts.force) {
      return this;
    }
    this.loading = true;
    this.wait();
    this.trigger('load', this);
    Seq().seq_(function(next){
      if (_this.isNew()) {
        return next.ok();
      }
      _this.wait();
      return _this.fetch({
        error: _this.unwaitAnd(function(err){
          console.error(_this + ".fetch() --> error! " + arguments);
          return next.ok();
        }),
        success: _this.unwaitAnd(function(model, res){
          _this.dataset.set(_this.get('data'));
          _this.set('data', _this.dataset, {
            silent: true
          });
          return next.ok(res);
        })
      });
    }).seq_(function(next){
      return next.ok(_this.get('parents'));
    }).flatten().seqMap_(function(next, parent_id){
      _this.wait();
      return Graph.lookup(parent_id, next);
    }).seqEach_(function(next, parent){
      _this.parents.add(parent);
      _this.optionCascade.addLookup(parent.get('options'));
      _this.unwait();
      return next.ok();
    }).seq_(function(next){
      return _this.dataset.once('ready', next.ok).load();
    }).seq(function(){
      _this.loading = false;
      _this.unwait();
      return _this.triggerReady();
    });
    return this;
  },
  loadData: function(opts){
    var _this = this;
    opts == null && (opts = {});
    if (opts.force) {
      this.resetReady('dataReady', 'data-ready');
    }
    if (this.loading || this.dataReady) {
      return this;
    }
    if (!this.dataset.metrics.length) {
      return this.triggerReady('dataReady', 'data-ready');
    }
    this.wait();
    this.loading = true;
    this.trigger('load-data', this);
    Seq(this.dataset.metrics.models).parEach_(function(next, metric){
      return metric.once('ready', next.ok).load();
    }).parEach_(function(next, metric){
      if (!metric.source) {
        console.warn(_this + ".loadData() -- Skipping metric " + metric + " with invalid source!", metric);
        return next.ok();
      }
      return metric.source.once('load-data-success', next.ok).loadData();
    }).seq(function(){
      _this.loading = false;
      _this.unwait();
      return _this.triggerReady('dataReady', 'data-ready');
    });
    return this;
  },
  getData: function(){
    return this.dataset.getData();
  },
  onDataSetChange: function(){
    return this.trigger('change', this, this.dataset, 'data');
  },
  get: function(key){
    if (_.startsWith(key, 'options.')) {
      return this.getOption(key.slice(8));
    } else {
      return Graph.__super__.get.call(this, key);
    }
  },
  set: function(key, value, opts){
    var values, setter, options, _ref;
    if (_.isObject(key) && key != null) {
      _ref = [key, value], values = _ref[0], opts = _ref[1];
    } else {
      values = (_ref = {}, _ref[key + ""] = value, _ref);
    }
    values = this.parse(values);
    setter = Graph.__super__.set;
    if (values.options) {
      options = values.options, delete values.options;
      if (!this.attributes.options) {
        setter.call(this, {
          options: options
        }, {
          silent: true
        });
      }
      this.setOption(options, opts);
    }
    return setter.call(this, values, opts);
  },
  getCalloutData: function(){
    var m, data, dates, len, i, v, last, latest, last_month, last_year, callout;
    if (!((m = this.dataset.metrics.at(0)) && (data = m.getData()) && (dates = m.getDateColumn()))) {
      return;
    }
    len = Math.min(data.length, dates.length);
    if (data.length < len) {
      data = data.slice(data.length - len);
    }
    if (dates.length < len) {
      dates = dates.slice(dates.length - len);
    }
    for (i = 0; i < len; ++i) {
      v = data[i];
      if (v != null && !isNaN(v)) {
        break;
      }
    }
    if (i > 0) {
      data = data.slice(i);
      dates = dates.slice(i);
    }
    last = len - 1;
    for (i = 0; i < len; ++i) {
      v = data[last - i];
      if (v != null && !isNaN(v)) {
        break;
      }
    }
    if (i > 0) {
      data = data.slice(0, last - (i - 1));
      dates = dates.slice(0, last - (i - 1));
    }
    latest = data.length - 1;
    last_month = latest - 1;
    last_year = latest - 12;
    return callout = {
      latest: data[latest],
      month: {
        dates: [dates[last_month], dates[latest]],
        value: [data[last_month], data[latest], data[latest] - data[last_month]]
      },
      year: {
        dates: [dates[last_year], dates[latest]],
        value: [data[last_year], data[latest], data[latest] - data[last_year]]
      }
    };
  },
  hasOption: function(key){
    return this.getOption(key) === void 8;
  },
  getOption: function(key, def){
    return this.optionCascade.get(key, def);
  },
  setOption: function(key, value, opts){
    var values, options, changed, _ref;
    opts == null && (opts = {});
    if (_.isObject(key) && key != null) {
      _ref = [key, value || {}], values = _ref[0], opts = _ref[1];
    } else {
      values = (_ref = {}, _ref[key + ""] = value, _ref);
    }
    options = this.get('options');
    changed = false;
    for (key in values) {
      value = values[key];
      if (_.contains(this.IGNORE_OPTIONS, key)) {
        continue;
      }
      changed = true;
      _.setNested(options, key, value, {
        ensure: true
      });
      if (!opts.silent) {
        this.trigger("change:options." + key, this, value, key, opts);
      }
    }
    if (changed && !opts.silent) {
      this.trigger("change:options", this, options, 'options', opts);
      this.trigger("change", this, options, 'options', opts);
    }
    return this;
  },
  unsetOption: function(key, opts){
    var options;
    opts == null && (opts = {});
    if (!(this.optionCascade.unset(key) === void 8 || opts.silent)) {
      options = this.get('options');
      this.trigger("change:options." + key, this, void 8, key, opts);
      this.trigger("change:options", this, options, 'options', opts);
      this.trigger("change", this, options, 'options', opts);
    }
    return this;
  },
  inheritOption: function(key, opts){
    var old, options;
    opts == null && (opts = {});
    old = this.getOption(key);
    this.optionCascade.inherit(key);
    if (!(this.getOption(key) === old || opts.silent)) {
      options = this.get('options');
      this.trigger("change:options." + key, this, void 8, key, opts);
      this.trigger("change:options", this, options, 'options', opts);
      this.trigger("change:options", this, options, 'options', opts);
    }
    return this;
  },
  getOptions: function(opts){
    var options, k, v;
    opts == null && (opts = {});
    opts = __import({
      keepDefaults: true,
      keepUnchanged: true
    }, opts);
    options = this.optionCascade.collapse();
    for (k in options) {
      v = options[k];
      if (v === void 8 || (!opts.keepDefaults && this.isDefaultOption(k)) || (!opts.keepUnchanged && !this.isChangedOption(k))) {
        delete options[k];
      }
    }
    return options;
  },
  parse: function(data){
    var k, v;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    for (k in data) {
      v = data[k];
      if (v !== 'auto' && _.contains(['width', 'height'], k)) {
        data[k] = Number(v);
      }
    }
    return data;
  }
  /**
   * @returns {Boolean} Whether the value for option `k` is inherited or not.
   */,
  isOwnOption: function(k){
    return this.optionCascade.isOwnValue(k);
  }
  /**
   * @returns {Boolean} Whether the value for option `k` is the graph default or not.
   */,
  isDefaultOption: function(k){
    return this.chartType.isDefault(k, this.getOption(k));
  }
  /**
   * Whether the value for option `k` differs from that of its parent graphs.
   * @returns {Boolean}
   */,
  isChangedOption: function(k){
    return this.optionCascade.isModifiedValue(k) && !this.isDefaultOption(k);
  },
  toJSON: function(opts){
    var json, _ref;
    opts == null && (opts = {});
    opts = __import({
      keepDefaults: true,
      keepUnchanged: true
    }, opts);
    return json = (_ref = _.clone(this.attributes), _ref.options = this.getOptions(opts), _ref);
  },
  toKVPairs: function(opts){
    var kvo, k, v, _ref;
    opts == null && (opts = {});
    opts = __import({
      keepSlug: false,
      keepDefaults: false,
      keepUnchanged: false
    }, opts);
    kvo = this.toJSON(opts);
    kvo.parents = JSON.stringify(kvo.parents);
    if (!opts.keepSlug) {
      delete kvo.slug;
    }
    delete kvo.data;
    for (k in _ref = kvo.options) {
      v = _ref[k];
      kvo.options[k] = this.serialize(v);
    }
    return _.collapseObject(kvo);
  },
  toKV: function(opts){
    return _.toKV(this.toKVPairs(opts));
  }
  /**
   * @returns {String} URL identifying this model.
   */,
  toURL: function(action){
    var slug, path;
    slug = this.get('slug');
    path = _.compact([this.urlRoot, slug, action]).join('/');
    return path + "?" + this.toKV({
      keepSlug: !!slug
    });
  }
  /**
   * @returns {String} Path portion of slug URL, e.g.  /graphs/:slug
   */,
  toLink: function(){
    return this.urlRoot + "/" + this.get('slug');
  }
  /**
   * @returns {String} Permalinked URI, e.g. http://reportcard.wmflabs.org/:slug
   */,
  toPermalink: function(){
    return root.location.protocol + "//" + window.location.host + this.toLink();
  }
});
new ModelCache(Graph);
GraphList = exports.GraphList = BaseList.extend({
  urlRoot: '/graphs',
  model: Graph,
  constructor: (function(){
    function GraphList(){
      return BaseList.apply(this, arguments);
    }
    return GraphList;
  }()),
  initialize: function(){
    return BaseList.prototype.initialize.apply(this, arguments);
  },
  toString: function(){
    return this.toStringWithIds();
  }
});
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
