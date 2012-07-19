var template = function (locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('\n<section');
buf.push(attrs({ "class": ('datasource-ui') + ' ' + ("datasource-ui-" + (cid) + "") }));
buf.push('>\n  <form');
buf.push(attrs({ "class": ('datasource-ui-form') }));
buf.push('>\n    <section');
buf.push(attrs({ 'data-toggle':("collapse"), 'data-target':("#" + (graph_id) + " .datasource-ui.datasource-ui-" + (cid) + " .datasource-selector"), "class": ('datasource-summary') }));
buf.push('><i');
buf.push(attrs({ "class": ('expand-datasource-ui-button') + ' ' + ('icon-chevron-down') }));
buf.push('></i><i');
buf.push(attrs({ "class": ('collapse-datasource-ui-button') + ' ' + ('icon-chevron-up') }));
buf.push('></i>\n      <ul');
buf.push(attrs({ "class": ('breadcrumb') }));
buf.push('>\n        <li>' + escape((interp = source_summary) == null ? '' : interp) + ' <span');
buf.push(attrs({ "class": ('divider') }));
buf.push('>/</span>\n        </li>\n        <li>' + escape((interp = metric_summary) == null ? '' : interp) + ' <span');
buf.push(attrs({ "class": ('divider') }));
buf.push('>/</span>\n        </li>\n        <li>' + escape((interp = timespan_summary) == null ? '' : interp) + '\n        </li>\n      </ul>\n    </section>\n    <section');
buf.push(attrs({ "class": ('datasource-selector') + ' ' + ('collapse') }));
buf.push('>\n      <div');
buf.push(attrs({ "class": ('datasource-tabs') }));
buf.push('>\n        <div');
buf.push(attrs({ "class": ('tabbable') + ' ' + ('tabs-left') }));
buf.push('>\n          <ul');
buf.push(attrs({ "class": ('datasource-sources-list') + ' ' + ('nav') + ' ' + ('nav-tabs') }));
buf.push('>\n            <li>\n              <h6>Data Sources\n              </h6>\n            </li>');
// iterate datasources.models
(function(){
  if ('number' == typeof datasources.models.length) {
    for (var k = 0, $$l = datasources.models.length; k < $$l; k++) {
      var source = datasources.models[k];

 var ds = source.attributes
 var activeClass = (source_id === ds.id ? 'active' : '')
 var ds_target = "#"+graph_id+" .datasource-ui .datasource-selector .datasource-source.datasource-source-"+ds.id
buf.push('\n            <li');
buf.push(attrs({ "class": (activeClass) }));
buf.push('><a');
buf.push(attrs({ 'href':("#datasource-selector_datasource-source-" + (ds.id) + ""), 'data-toggle':("tab"), 'data-target':(ds_target) }));
buf.push('>' + escape((interp = ds.shortName) == null ? '' : interp) + '</a>\n            </li>');
    }
  } else {
    for (var k in datasources.models) {
      var source = datasources.models[k];

 var ds = source.attributes
 var activeClass = (source_id === ds.id ? 'active' : '')
 var ds_target = "#"+graph_id+" .datasource-ui .datasource-selector .datasource-source.datasource-source-"+ds.id
buf.push('\n            <li');
buf.push(attrs({ "class": (activeClass) }));
buf.push('><a');
buf.push(attrs({ 'href':("#datasource-selector_datasource-source-" + (ds.id) + ""), 'data-toggle':("tab"), 'data-target':(ds_target) }));
buf.push('>' + escape((interp = ds.shortName) == null ? '' : interp) + '</a>\n            </li>');
   }
  }
}).call(this);

buf.push('\n          </ul>\n          <div');
buf.push(attrs({ "class": ('datasource-sources-info') + ' ' + ('tab-content') }));
buf.push('>');
// iterate datasources.models
(function(){
  if ('number' == typeof datasources.models.length) {
    for (var k = 0, $$l = datasources.models.length; k < $$l; k++) {
      var source = datasources.models[k];

 var ds = source.attributes
 var activeClass = (source_id === ds.id ? 'active' : '')
buf.push('\n            <div');
buf.push(attrs({ "class": ('datasource-source') + ' ' + ('tab-pane') + ' ' + ("datasource-source-" + (ds.id) + " " + (activeClass) + "") }));
buf.push('>\n              <div');
buf.push(attrs({ "class": ('datasource-source-details') + ' ' + ('well') }));
buf.push('>\n                <div');
buf.push(attrs({ "class": ('source-name') }));
buf.push('>' + escape((interp = ds.name) == null ? '' : interp) + '\n                </div>\n                <div');
buf.push(attrs({ "class": ('source-id') }));
buf.push('>' + escape((interp = ds.id) == null ? '' : interp) + '\n                </div>\n                <div');
buf.push(attrs({ "class": ('source-format') }));
buf.push('>' + escape((interp = ds.format) == null ? '' : interp) + '\n                </div>\n                <div');
buf.push(attrs({ "class": ('source-charttype') }));
buf.push('>' + escape((interp = ds.chart.chartType) == null ? '' : interp) + '\n                </div>\n                <input');
buf.push(attrs({ 'type':("text"), 'name':("source-url"), 'value':(ds.url), "class": ('source-url') }));
buf.push('/>\n                <div');
buf.push(attrs({ "class": ('datasource-source-time') }));
buf.push('>\n                  <div');
buf.push(attrs({ "class": ('source-time-start') }));
buf.push('>' + escape((interp = ds.timespan.start) == null ? '' : interp) + '\n                  </div>\n                  <div');
buf.push(attrs({ "class": ('source-time-end') }));
buf.push('>' + escape((interp = ds.timespan.end) == null ? '' : interp) + '\n                  </div>\n                  <div');
buf.push(attrs({ "class": ('source-time-step') }));
buf.push('>' + escape((interp = ds.timespan.step) == null ? '' : interp) + '\n                  </div>\n                </div>\n              </div>\n              <div');
buf.push(attrs({ "class": ('datasource-source-metrics') }));
buf.push('>\n                <table');
buf.push(attrs({ "class": ('table') + ' ' + ('table-striped') }));
buf.push('>\n                  <thead>\n                    <tr>\n                      <th');
buf.push(attrs({ "class": ('source-metric-idx') }));
buf.push('>#\n                      </th>\n                      <th');
buf.push(attrs({ "class": ('source-metric-label') }));
buf.push('>Label\n                      </th>\n                      <th');
buf.push(attrs({ "class": ('source-metric-type') }));
buf.push('>Type\n                      </th>\n                    </tr>\n                  </thead>\n                  <tbody');
buf.push(attrs({ "class": ('source-metrics') }));
buf.push('>');
// iterate ds.metrics.slice(1)
(function(){
  if ('number' == typeof ds.metrics.slice(1).length) {
    for (var idx = 0, $$l = ds.metrics.slice(1).length; idx < $$l; idx++) {
      var m = ds.metrics.slice(1)[idx];

 var activeColClass = (activeClass && source_col === m.idx) ? 'active' : ''
buf.push('\n                    <tr');
buf.push(attrs({ 'data-source_id':(ds.id), 'data-source_col':(m.idx), "class": ('datasource-source-metric') + ' ' + (activeColClass) }));
buf.push('>\n                      <td');
buf.push(attrs({ "class": ('source-metric-idx') }));
buf.push('>' + escape((interp = m.idx) == null ? '' : interp) + '\n                      </td>\n                      <td');
buf.push(attrs({ "class": ('source-metric-label') }));
buf.push('>' + escape((interp = m.label) == null ? '' : interp) + '\n                      </td>\n                      <td');
buf.push(attrs({ "class": ('source-metric-type') }));
buf.push('>' + escape((interp = m.type) == null ? '' : interp) + '\n                      </td>\n                    </tr>');
    }
  } else {
    for (var idx in ds.metrics.slice(1)) {
      var m = ds.metrics.slice(1)[idx];

 var activeColClass = (activeClass && source_col === m.idx) ? 'active' : ''
buf.push('\n                    <tr');
buf.push(attrs({ 'data-source_id':(ds.id), 'data-source_col':(m.idx), "class": ('datasource-source-metric') + ' ' + (activeColClass) }));
buf.push('>\n                      <td');
buf.push(attrs({ "class": ('source-metric-idx') }));
buf.push('>' + escape((interp = m.idx) == null ? '' : interp) + '\n                      </td>\n                      <td');
buf.push(attrs({ "class": ('source-metric-label') }));
buf.push('>' + escape((interp = m.label) == null ? '' : interp) + '\n                      </td>\n                      <td');
buf.push(attrs({ "class": ('source-metric-type') }));
buf.push('>' + escape((interp = m.type) == null ? '' : interp) + '\n                      </td>\n                    </tr>');
   }
  }
}).call(this);

buf.push('\n                  </tbody>\n                </table>\n              </div>\n            </div>');
    }
  } else {
    for (var k in datasources.models) {
      var source = datasources.models[k];

 var ds = source.attributes
 var activeClass = (source_id === ds.id ? 'active' : '')
buf.push('\n            <div');
buf.push(attrs({ "class": ('datasource-source') + ' ' + ('tab-pane') + ' ' + ("datasource-source-" + (ds.id) + " " + (activeClass) + "") }));
buf.push('>\n              <div');
buf.push(attrs({ "class": ('datasource-source-details') + ' ' + ('well') }));
buf.push('>\n                <div');
buf.push(attrs({ "class": ('source-name') }));
buf.push('>' + escape((interp = ds.name) == null ? '' : interp) + '\n                </div>\n                <div');
buf.push(attrs({ "class": ('source-id') }));
buf.push('>' + escape((interp = ds.id) == null ? '' : interp) + '\n                </div>\n                <div');
buf.push(attrs({ "class": ('source-format') }));
buf.push('>' + escape((interp = ds.format) == null ? '' : interp) + '\n                </div>\n                <div');
buf.push(attrs({ "class": ('source-charttype') }));
buf.push('>' + escape((interp = ds.chart.chartType) == null ? '' : interp) + '\n                </div>\n                <input');
buf.push(attrs({ 'type':("text"), 'name':("source-url"), 'value':(ds.url), "class": ('source-url') }));
buf.push('/>\n                <div');
buf.push(attrs({ "class": ('datasource-source-time') }));
buf.push('>\n                  <div');
buf.push(attrs({ "class": ('source-time-start') }));
buf.push('>' + escape((interp = ds.timespan.start) == null ? '' : interp) + '\n                  </div>\n                  <div');
buf.push(attrs({ "class": ('source-time-end') }));
buf.push('>' + escape((interp = ds.timespan.end) == null ? '' : interp) + '\n                  </div>\n                  <div');
buf.push(attrs({ "class": ('source-time-step') }));
buf.push('>' + escape((interp = ds.timespan.step) == null ? '' : interp) + '\n                  </div>\n                </div>\n              </div>\n              <div');
buf.push(attrs({ "class": ('datasource-source-metrics') }));
buf.push('>\n                <table');
buf.push(attrs({ "class": ('table') + ' ' + ('table-striped') }));
buf.push('>\n                  <thead>\n                    <tr>\n                      <th');
buf.push(attrs({ "class": ('source-metric-idx') }));
buf.push('>#\n                      </th>\n                      <th');
buf.push(attrs({ "class": ('source-metric-label') }));
buf.push('>Label\n                      </th>\n                      <th');
buf.push(attrs({ "class": ('source-metric-type') }));
buf.push('>Type\n                      </th>\n                    </tr>\n                  </thead>\n                  <tbody');
buf.push(attrs({ "class": ('source-metrics') }));
buf.push('>');
// iterate ds.metrics.slice(1)
(function(){
  if ('number' == typeof ds.metrics.slice(1).length) {
    for (var idx = 0, $$l = ds.metrics.slice(1).length; idx < $$l; idx++) {
      var m = ds.metrics.slice(1)[idx];

 var activeColClass = (activeClass && source_col === m.idx) ? 'active' : ''
buf.push('\n                    <tr');
buf.push(attrs({ 'data-source_id':(ds.id), 'data-source_col':(m.idx), "class": ('datasource-source-metric') + ' ' + (activeColClass) }));
buf.push('>\n                      <td');
buf.push(attrs({ "class": ('source-metric-idx') }));
buf.push('>' + escape((interp = m.idx) == null ? '' : interp) + '\n                      </td>\n                      <td');
buf.push(attrs({ "class": ('source-metric-label') }));
buf.push('>' + escape((interp = m.label) == null ? '' : interp) + '\n                      </td>\n                      <td');
buf.push(attrs({ "class": ('source-metric-type') }));
buf.push('>' + escape((interp = m.type) == null ? '' : interp) + '\n                      </td>\n                    </tr>');
    }
  } else {
    for (var idx in ds.metrics.slice(1)) {
      var m = ds.metrics.slice(1)[idx];

 var activeColClass = (activeClass && source_col === m.idx) ? 'active' : ''
buf.push('\n                    <tr');
buf.push(attrs({ 'data-source_id':(ds.id), 'data-source_col':(m.idx), "class": ('datasource-source-metric') + ' ' + (activeColClass) }));
buf.push('>\n                      <td');
buf.push(attrs({ "class": ('source-metric-idx') }));
buf.push('>' + escape((interp = m.idx) == null ? '' : interp) + '\n                      </td>\n                      <td');
buf.push(attrs({ "class": ('source-metric-label') }));
buf.push('>' + escape((interp = m.label) == null ? '' : interp) + '\n                      </td>\n                      <td');
buf.push(attrs({ "class": ('source-metric-type') }));
buf.push('>' + escape((interp = m.type) == null ? '' : interp) + '\n                      </td>\n                    </tr>');
   }
  }
}).call(this);

buf.push('\n                  </tbody>\n                </table>\n              </div>\n            </div>');
   }
  }
}).call(this);

buf.push('\n          </div>\n        </div>\n      </div>\n    </section>\n  </form>\n</section>');
}
return buf.join("");
};
if (typeof module != 'undefined') {
    module.exports = exports = template;
}