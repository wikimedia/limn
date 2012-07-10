var template = function (locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
 window.Markdown || (window.Markdown = new (require('showdown').Showdown).converter());
 (jade.filters || (jade.filters = {})).markdown = function (s, name){ return s && Markdown.makeHtml(s.replace(/\n/g, '\n\n')); };
}
return buf.join("");
};
if (typeof module != 'undefined') {
    module.exports = exports = template;
}