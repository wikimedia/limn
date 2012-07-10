require.define('/node_modules/kraken/template/data/datasource.jade.js.js', function(require, module, exports, __dirname, __filename, undefined){

var template = function (locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
 var ds = source.attributes
 var id = ds.id || source.cid
 var activeClass = (source_id === ds.id ? 'active' : '')
buf.push('\n<div');
buf.push(attrs({ "class": ('datasource-source') + ' ' + ('tab-pane') + ' ' + ("datasource-source-" + (id) + " " + (activeClass) + "") }));
buf.push('>\n  <form');
buf.push(attrs({ "class": ('datasource-source-form') }));
buf.push('>\n    <div');
buf.push(attrs({ "class": ('datasource-source-details') + ' ' + ('well') }));
buf.push('>\n      <div');
buf.push(attrs({ "class": ('source-name') }));
buf.push('>' + escape((interp = ds.name) == null ? '' : interp) + '\n      </div>\n      <div');
buf.push(attrs({ "class": ('source-id') }));
buf.push('>' + escape((interp = ds.id) == null ? '' : interp) + '\n      </div>\n      <div');
buf.push(attrs({ "class": ('source-format') }));
buf.push('>' + escape((interp = ds.format) == null ? '' : interp) + '\n      </div>\n      <div');
buf.push(attrs({ "class": ('source-charttype') }));
buf.push('>' + escape((interp = ds.chart.chartType) == null ? '' : interp) + '\n      </div>\n      <input');
buf.push(attrs({ 'type':("text"), 'name':("source-url"), 'value':(ds.url), "class": ('source-url') }));
buf.push('/>\n      <div');
buf.push(attrs({ "class": ('datasource-source-time') }));
buf.push('>\n        <div');
buf.push(attrs({ "class": ('source-time-start') }));
buf.push('>' + escape((interp = ds.timespan.start) == null ? '' : interp) + '\n        </div>\n        <div');
buf.push(attrs({ "class": ('source-time-end') }));
buf.push('>' + escape((interp = ds.timespan.end) == null ? '' : interp) + '\n        </div>\n        <div');
buf.push(attrs({ "class": ('source-time-step') }));
buf.push('>' + escape((interp = ds.timespan.step) == null ? '' : interp) + '\n        </div>\n      </div>\n    </div>\n    <div');
buf.push(attrs({ "class": ('datasource-source-metrics') }));
buf.push('>\n      <table');
buf.push(attrs({ "class": ('table') + ' ' + ('table-striped') }));
buf.push('>\n        <thead>\n          <tr>\n            <th');
buf.push(attrs({ "class": ('source-metric-idx') }));
buf.push('>#\n            </th>\n            <th');
buf.push(attrs({ "class": ('source-metric-label') }));
buf.push('>Label\n            </th>\n            <th');
buf.push(attrs({ "class": ('source-metric-type') }));
buf.push('>Type\n            </th>\n          </tr>\n        </thead>\n        <tbody');
buf.push(attrs({ "class": ('source-metrics') }));
buf.push('>');
// iterate ds.metrics.slice(1)
(function(){
  if ('number' == typeof ds.metrics.slice(1).length) {
    for (var idx = 0, $$l = ds.metrics.slice(1).length; idx < $$l; idx++) {
      var m = ds.metrics.slice(1)[idx];

 var activeColClass = (activeClass && source_col === m.idx) ? 'active' : ''
buf.push('\n          <tr');
buf.push(attrs({ "class": ('datasource-source-metric') + ' ' + (activeColClass) }));
buf.push('>\n            <td');
buf.push(attrs({ "class": ('source-metric-idx') }));
buf.push('>' + escape((interp = m.idx) == null ? '' : interp) + '\n            </td>\n            <td');
buf.push(attrs({ "class": ('source-metric-label') }));
buf.push('>' + escape((interp = m.label) == null ? '' : interp) + '\n            </td>\n            <td');
buf.push(attrs({ "class": ('source-metric-type') }));
buf.push('>' + escape((interp = m.type) == null ? '' : interp) + '\n            </td>\n          </tr>');
    }
  } else {
    for (var idx in ds.metrics.slice(1)) {
      var m = ds.metrics.slice(1)[idx];

 var activeColClass = (activeClass && source_col === m.idx) ? 'active' : ''
buf.push('\n          <tr');
buf.push(attrs({ "class": ('datasource-source-metric') + ' ' + (activeColClass) }));
buf.push('>\n            <td');
buf.push(attrs({ "class": ('source-metric-idx') }));
buf.push('>' + escape((interp = m.idx) == null ? '' : interp) + '\n            </td>\n            <td');
buf.push(attrs({ "class": ('source-metric-label') }));
buf.push('>' + escape((interp = m.label) == null ? '' : interp) + '\n            </td>\n            <td');
buf.push(attrs({ "class": ('source-metric-type') }));
buf.push('>' + escape((interp = m.type) == null ? '' : interp) + '\n            </td>\n          </tr>');
   }
  }
}).call(this);

buf.push('\n        </tbody>\n      </table>\n    </div>\n  </form>\n</div>');
}
return buf.join("");
};
if (typeof module != 'undefined') {
    module.exports = exports = template;
}

});
