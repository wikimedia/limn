var fs, path, exists, Seq, glob, yaml, op, readFilesAsync, Controller, FileBackedController, EXT_PAT, YAML_EXT_PAT, YAML_OR_JSON_PAT, DataSourceController, exports, _ref, _;
fs = require('fs');
path = require('path');
exists = fs.existsSync || path.existsSync;
Seq = require('seq');
glob = require('glob');
yaml = require('js-yaml');
_ref = require('../../util'), _ = _ref._, op = _ref.op;
readFilesAsync = require('../files').readFilesAsync;
Controller = require('../controller');
FileBackedController = require('../file-controller');
EXT_PAT = /\.[^\.]*$/i;
YAML_EXT_PAT = /\.ya?ml$/i;
YAML_OR_JSON_PAT = /\.(json|ya?ml)$/i;
/**
 * @class Resource controller for datasource requests.
 */
DataSourceController = (function(superclass){
  DataSourceController.displayName = 'DataSourceController';
  var prototype = __extend(DataSourceController, superclass).prototype, constructor = DataSourceController;
  prototype.name = 'datasources';
  prototype.mapping = {
    all: 'allData'
  };
  function DataSourceController(){
    superclass.apply(this, arguments);
  }
  /**
   * GET /datasources/:datasource
   */
  prototype.show = function(req, res){
    return res.send(req.datasource);
  };
  /**
   * GET /datasources
   * @returns {Object} JSON listing of the datasource metadata files.
   */
  prototype.index = function(req, res, next){
    return Seq().seq(glob, this.dataDir + "/**/*.@(yaml|json)", {
      nocase: true,
      nosort: true
    }, Seq).map(function(it){
      return (it + "").replace(YAML_EXT_PAT, '.json');
    }).seq(function(it){
      return res.send(it);
    });
  };
  /**
   * Returns the aggregated JSON content of the datasource metadata files.
   */
  prototype.allData = function(req, res, next){
    var data;
    data = {};
    return Seq().seq(glob, this.dataDir + "/**/*.@(yaml|json)", {
      nocase: true,
      nosort: true
    }, Seq).seq(function(paths){
      return readFilesAsync(paths, this);
    }).seq(function(txts){
      return this.ok(_.items(txts));
    }).flatten(false).parMap(function(_arg){
      var f, text, k, v, that;
      f = _arg[0], text = _arg[1];
      k = f.replace(YAML_EXT_PAT, '.json');
      v = data[k] = {};
      try {
        if (YAML_EXT_PAT.test(f)) {
          v = data[k] = yaml.load(text);
        } else {
          v = data[k] = JSON.parse(text);
        }
        return this.ok(v);
      } catch (err) {
        console.error("[/datasources] Error parsing data!");
        console.error(err);
        if (that = err.stack) {
          console.error(that);
        }
        return res.send({
          error: String(err),
          partial_data: data
        }, 500);
      }
    }).seq(function(){
      return res.send(data);
    })['catch'](function(err){
      var that;
      console.error('[/datasources] Error!');
      console.error(err);
      if (that = err.stack) {
        console.error(that);
      }
      return res.send({
        error: String(err),
        partial_data: data
      }, 500);
    });
  };
  return DataSourceController;
}(FileBackedController));
module.exports = exports = DataSourceController;
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}