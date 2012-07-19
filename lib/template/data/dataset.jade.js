var template = function (locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('\n<section');
buf.push(attrs({ "class": ('dataset-ui') + ' ' + ('dataset') }));
buf.push('>\n  <div');
buf.push(attrs({ "class": ('inner') }));
buf.push('>\n    <form');
buf.push(attrs({ "class": ('dataset-ui-form') }));
buf.push('>\n      <h4>Graph Data Set\n      </h4>\n      <div');
buf.push(attrs({ "class": ('dataset-buttons') }));
buf.push('><a');
buf.push(attrs({ 'href':("#"), "class": ('new-metric-button') + ' ' + ('btn') + ' ' + ('btn-success') + ' ' + ('btn-small') }));
buf.push('><i');
buf.push(attrs({ "class": ('icon-plus-sign') + ' ' + ('icon-white') }));
buf.push('></i> Add Metric\n</a>\n      </div>\n      <div');
buf.push(attrs({ "class": ('dataset-metrics') }));
buf.push('>\n        <table');
buf.push(attrs({ "class": ('table') + ' ' + ('table-striped') }));
buf.push('>\n          <thead>\n            <tr>\n              <th');
buf.push(attrs({ "class": ('col-label') }));
buf.push('>Label\n              </th>\n              <th');
buf.push(attrs({ "class": ('col-source') }));
buf.push('>Source\n              </th>\n              <th');
buf.push(attrs({ "class": ('col-times') }));
buf.push('>Timespan\n              </th>\n              <th');
buf.push(attrs({ "class": ('col-actions') }));
buf.push('>Actions\n              </th>\n            </tr>\n          </thead>\n          <tbody');
buf.push(attrs({ 'data-subview':("DataSetMetricView"), "class": ('metrics') }));
buf.push('>\n          </tbody>\n        </table>\n      </div>\n    </form>\n  </div>\n</section>');
}
return buf.join("");
};
if (typeof module != 'undefined') {
    module.exports = exports = template;
}