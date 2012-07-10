var models, base_views, display_views, edit_views, index_views;
models = require('kraken/graph/graph-model');
base_views = require('kraken/graph/graph-view');
display_views = require('kraken/graph/graph-display-view');
edit_views = require('kraken/graph/graph-edit-view');
index_views = require('kraken/graph/graph-list-view');
__import(__import(__import(__import(__import(exports, models), base_views), display_views), edit_views), index_views);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}