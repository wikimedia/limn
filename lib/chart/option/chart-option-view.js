var op, BaseView, ChartOption, ChartOptionList, DEBOUNCE_RENDER, ChartOptionView, ChartOptionScaffold, _ref, _;
_ref = require('kraken/util'), _ = _ref._, op = _ref.op;
BaseView = require('kraken/base').BaseView;
_ref = require('kraken/chart/option/chart-option-model'), ChartOption = _ref.ChartOption, ChartOptionList = _ref.ChartOptionList;
DEBOUNCE_RENDER = exports.DEBOUNCE_RENDER = 100;
/**
 * @class View for a single configurable option in a chart type.
 */
ChartOptionView = exports.ChartOptionView = BaseView.extend({
  tagName: 'section',
  className: 'chart-option field',
  template: require('kraken/template/chart/chart-option'),
  type: 'string',
  isCollapsed: true,
  events: {
    'blur .value': 'onChange',
    'click input[type="checkbox"].value': 'onChange',
    'submit .value': 'onChange',
    'click .close': 'toggleCollapsed',
    'click h3': 'toggleCollapsed',
    'click .collapsed': 'onClick'
  },
  constructor: (function(){
    function ChartOptionView(){
      return BaseView.apply(this, arguments);
    }
    return ChartOptionView;
  }()),
  initialize: function(){
    ChartOptionView.__super__.initialize.apply(this, arguments);
    return this.type = this.model.get('type').toLowerCase() || 'string';
  }
  /* * * *  Rendering  * * * */,
  toTemplateLocals: function(){
    var json, v;
    json = ChartOptionView.__super__.toTemplateLocals.apply(this, arguments);
    json.id || (json.id = _.camelize(json.name));
    json.value == null && (json.value = '');
    v = json.value;
    if (v && (_.isArray(v) || _.isPlainObject(v))) {
      json.value = JSON.stringify(v);
    }
    return json;
  }
  /**
   * Override to annotate with collapsed state and to kill off ignored options
   * so they do not contribute their values when looking at form updates.
   */,
  render: function(){
    if (this.model.get('ignore')) {
      return this.remove();
    }
    ChartOptionView.__super__.render.apply(this, arguments);
    if (this.isCollapsed) {
      this.$el.addClass('collapsed');
    }
    return this;
  }
  /* * * *  Option Collapsing  * * * */
  /**
   * Sets the state of `isCollapsed` and updates the UI. If the state changed,
   * a `'change:collapse`` event will be fired.`
   * 
   * @param {Boolean} [makeCollapsed=true] If true, set state to collapsed.
   * @returns {Boolean} Whether the state changed.
   */,
  collapse: function(state){
    state == null && (state = true);
    state = !!state;
    this.isCollapsed = this.$el.hasClass('collapsed');
    if (state === this.isCollapsed) {
      return this;
    }
    if (state) {
      this.$el.addClass('collapsed');
    } else {
      this.$el.removeClass('collapsed');
    }
    this.isCollapsed = state;
    this.trigger('change:collapse', this, this.isCollapsed);
    return true;
  }
  /**
   * Toggles the collapsed state, updating the UI and firing a `'change:collapse'` event.
   * @returns {this}
   */,
  toggleCollapsed: function(){
    this.collapse(!this.$el.hasClass('collapsed'));
    return this;
  }
  /* * * *  Events  * * * */
  /**
   * To prevent `toggleCollapsed()` from being called multiple times due to
   * overlapping listeners, we're only looking for clicks on the collapsed header.
   */,
  onClick: function(evt){
    var target;
    target = $(evt.target);
    if (this.$el.hasClass('collapsed') && !target.hasClass('close')) {
      return this.toggleCollapsed();
    }
  }
  /**
   * Propagate user input changes to the model, and upward to the parent view.
   */,
  onChange: function(){
    var val, current;
    if (this.type === 'boolean') {
      val = !!this.$('.value').attr('checked');
    } else {
      val = this.model.getParser()(this.$('.value').val());
    }
    current = this.model.getValue();
    if (_.isEqual(val, current)) {
      return;
    }
    console.log(this + ".onChange( " + current + " -> " + val + " )");
    this.model.setValue(val, {
      silent: true
    });
    return this.trigger('change', this.model, this);
  }
});
/**
 * @class View for configuring a chart type.
 */
ChartOptionScaffold = exports.ChartOptionScaffold = BaseView.extend({
  __bind__: ['addField'],
  tagName: 'form',
  className: 'chart-options scaffold',
  template: require('kraken/template/chart/chart-scaffold'),
  collectionType: ChartOptionList,
  subviewType: ChartOptionView,
  events: {
    'click .options-filter-button': 'onFilterOptions',
    'click .collapse-all-options-button': 'collapseAll',
    'click .expand-all-options-button': 'expandAll'
  },
  constructor: (function(){
    function ChartOptionScaffold(){
      return BaseView.apply(this, arguments);
    }
    return ChartOptionScaffold;
  }()),
  initialize: function(){
    var CollectionType;
    this.render = _.debounce(this.render.bind(this), DEBOUNCE_RENDER);
    CollectionType = this.collectionType;
    this.model = this.collection || (this.collection = new CollectionType);
    ChartOptionScaffold.__super__.initialize.apply(this, arguments);
    this.collection.on('add', this.addField, this);
    this.collection.on('reset', this.onReset, this);
    return this.on('render', this.onRender, this);
  }
  /**
   * Bookkeeping for new ChartOptions, creating it a new subview and subscribing
   * to its activity, and then rendering it.
   * @returns {ChartOptionView} The Option's new view.
   */,
  addField: function(field){
    var SubviewType, view;
    if (field.view) {
      this.removeSubview(field.view);
    }
    field.off('change:value', this.onChange, this);
    field.on('change:value', this.onChange, this);
    SubviewType = this.subviewType;
    this.addSubview(view = new SubviewType({
      model: field
    })).on('change', this.onChange.bind(this, field)).on('change:collapse', this.render, this);
    this.render();
    return view;
  }
  /* * * *  UI  * * * */
  /**
   * Collapse all expanded subviews.
   * @returns {false} Returns false so event-dispatchers don't propagate
   *  the triggering event (usually a click or submit).
   */,
  collapseAll: function(){
    _.invoke(this.subviews, 'collapse', true);
    return false;
  }
  /**
   * Expand all collapsed subviews.
   * @returns {false} Returns false so event-dispatchers don't propagate
   *  the triggering event (usually a click or submit).
   */,
  expandAll: function(){
    _.invoke(this.subviews, 'collapse', false);
    return false;
  }
  /**
   * Reflow Isotope post-`render()`.
   */,
  onRender: function(){
    if (!this.$el.is(':visible')) {
      return;
    }
    return this.$('.isotope').isotope({
      itemSelector: '.chart-option.field',
      layoutMode: 'masonry',
      masonry: {
        columnWidth: 10
      },
      filter: this.getOptionsFilter(),
      sortBy: 'category',
      getSortData: {
        category: function($el){
          return $el.data('model').getCategory();
        }
      }
    });
  }
  /**
   * @returns {String} Selector representing the selected set of Option filters.
   */,
  getOptionsFilter: function(){
    var data, sel;
    data = this.$('.options-filter-button.active').toArray().map(function(it){
      return $(it).data();
    });
    sel = data.reduce(function(sel, d){
      var that;
      return sel += (that = d.filter) ? that : '';
    }, ':not(.ignore)');
    return sel;
  }
  /* * * *  Events  * * * */
  /**
   * Propagate change events from fields as if they were attribute changes.
   * Note: `field` is bound to the handler 
   */,
  onChange: function(field){
    var key, value;
    key = field.get('name');
    value = field.getValue();
    this.trigger("change:" + key, this, value, key, field);
    this.trigger("change", this, value, key, field);
    return this;
  },
  onReset: function(){
    this.removeAllSubviews();
    this.collection.each(this.addField);
    return _.defer(this.render);
  },
  onFilterOptions: function(evt){
    evt.preventDefault();
    return _.defer(this.render);
  }
});
['get', 'at', 'pluck', 'invoke', 'values', 'toJSON', 'toKVPairs', 'toKV', 'toURL'].forEach(function(methodname){
  return ChartOptionScaffold.prototype[methodname] = function(){
    return this.collection[methodname].apply(this.collection, arguments);
  };
});