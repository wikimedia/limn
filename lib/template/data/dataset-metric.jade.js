var template = function (locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('\n<tr');
buf.push(attrs({ "class": ('dataset-metric') + ' ' + (viewClasses) }));
buf.push('>\n  <td');
buf.push(attrs({ 'style':("color: " + (color) + ";"), 'data-bind':("label"), "class": ('col-label') + ' ' + ('col-color') }));
buf.push('>' + escape((interp = label) == null ? '' : interp) + '\n  </td>\n  <td');
buf.push(attrs({ 'data-bind':("source"), "class": ('col-source') }));
buf.push('>' + escape((interp = source) == null ? '' : interp) + '\n  </td>\n  <td');
buf.push(attrs({ 'data-bind':("timespan"), 'data-bind-escape':("false"), "class": ('col-time') }));
buf.push('>' + escape((interp = timespan) == null ? '' : interp) + '\n  </td>\n  <td');
buf.push(attrs({ "class": ('col-actions') }));
buf.push('><a');
buf.push(attrs({ 'href':("#"), "class": ('delete-metric-button') + ' ' + ('control') + ' ' + ('close') }));
buf.push('>&times;</a>\n    <div');
buf.push(attrs({ "class": ('activity-arrow') }));
buf.push('>\n      <div');
buf.push(attrs({ "class": ('inner') }));
buf.push('>\n      </div>\n    </div>\n  </td>\n</tr>');
}
return buf.join("");
};
if (typeof module != 'undefined') {
    module.exports = exports = template;
}