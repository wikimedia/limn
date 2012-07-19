var models, base_views, display_views, edit_views, index_views;
models = require('./graph-model');
base_views = require('./graph-view');
display_views = require('./graph-display-view');
edit_views = require('./graph-edit-view');
index_views = require('./graph-list-view');
__import(__import(__import(__import(__import(exports, models), base_views), display_views), edit_views), index_views);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}