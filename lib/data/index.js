var metric_model, metric_edit_view, datasource_model, datasource_view, datasource_ui_view, dataset_model, dataset_view, data_view;
metric_model = require('./metric-model');
metric_edit_view = require('./metric-edit-view');
datasource_model = require('./datasource-model');
datasource_view = require('./datasource-view');
datasource_ui_view = require('./datasource-ui-view');
dataset_model = require('./dataset-model');
dataset_view = require('./dataset-view');
data_view = require('./data-view');
__import(__import(__import(__import(__import(__import(__import(__import(exports, datasource_model), datasource_view), datasource_ui_view), dataset_model), dataset_view), metric_model), metric_edit_view), data_view);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}