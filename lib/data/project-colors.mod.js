require.define('/node_modules/limn/data/project-colors.js', function(require, module, exports, __dirname, __filename, undefined){

/**
 * @fileOverview Applies consistent coloring to language/project Metrics with a null `color` field.
 */
var PROJECT_COLORS, project, color, PROJECT_TESTS, lookupColor, _res;
PROJECT_COLORS = exports.PROJECT_COLORS = {
  'target': '#cccccc',
  'total': '#182B53',
  'all projects': '#182B53',
  'world': '#182B53',
  'commons': '#d73027',
  'north america': '#4596FF',
  'english': '#4596FF',
  'asia pacific': '#83BB32',
  'japanese': '#83BB32',
  'china': '#AD3238',
  'chinese': '#AD3238',
  'europe': '#FF0097',
  'german': '#FF0097',
  'dutch': '#EF8158',
  'french': '#1A9380',
  'italian': '#FF87FF',
  'portuguese': '#B64926',
  'swedish': '#5DD2A4',
  'russian': '#FA0000',
  'latin america': '#FFB719',
  'spanish': '#FFB719',
  'middle east': '#00675B',
  'india': '#553DC9'
};
_res = [];
for (project in PROJECT_COLORS) {
  color = PROJECT_COLORS[project];
  _res.push({
    pat: RegExp('\\b' + project.replace(/ /g, '[ _-]') + '\\b', 'i'),
    project: project,
    color: color
  });
}
PROJECT_TESTS = _res;
lookupColor = exports.lookup = function(label){
  var project, pat, color, _ref, _ref2;
  for (project in _ref = PROJECT_TESTS) {
    _ref2 = _ref[project], pat = _ref2.pat, color = _ref2.color;
    if (pat.test(label)) {
      return color;
    }
  }
};

});
