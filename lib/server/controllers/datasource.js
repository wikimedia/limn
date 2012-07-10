var fs, path, exists, yaml, findit, Seq, Controller, EXT_PAT, YAML_EXT_PAT, YAML_OR_JSON_PAT, DataSourceController, exports, _;
fs = require('fs');
path = require('path');
exists = path.existsSync;
_ = require('underscore');
yaml = require('js-yaml');
findit = require('findit');
Seq = require('seq');
Controller = require('../controller');
EXT_PAT = /\.[^\.]*$/i;
YAML_EXT_PAT = /\.ya?ml$/i;
YAML_OR_JSON_PAT = /\.(json|ya?ml)$/i;
/**
 * @class Resource controller for graph requests.
 */
DataSourceController = (function(superclass){
  DataSourceController.displayName = 'DataSourceController';
  var prototype = __extend(DataSourceController, superclass).prototype, constructor = DataSourceController;
  prototype.name = 'datasources';
  prototype.dataDir = 'data/datasources';
  prototype.mapping = {
    all: 'allData'
  };
  function DataSourceController(){
    superclass.apply(this, arguments);
  }
  prototype.toFile = function(id){
    return this.dataDir + "/" + id + ".json";
  };
  /**
   * Auto-load :id for related requests.
   */
  prototype.autoload = function(id, cb){
    var files, pattern, file, parser;
    files = findit.sync(this.dataDir);
    pattern = new RegExp(id + ".(json|ya?ml)$", "i");
    file = _.find(files, function(it){
      return pattern.test(it);
    });
    if (!file) {
      console.error("Unable to find DataSource for '" + id + "'!");
      return cb(new Error("Unable to find DataSource for '" + id + "'!"));
    }
    if (_.endsWith(file, id + ".json")) {
      parser = JSON.parse;
    }
    if (_.endsWith(file, id + ".yaml")) {
      parser = yaml.load;
    }
    return fs.readFile(file, 'utf8', function(err, data){
      if ('ENOENT' === (err != null ? err.code : void 8)) {
        console.error("Unable to find DataSource for '" + id + "'!");
        return cb(new Error("Unable to find DataSource for '" + id + "'!"));
      }
      if (err) {
        console.error("DataSourceController.autoload(" + id + ", " + typeof cb + ") -->\n", err);
        return cb(err);
      }
      try {
        return cb(null, parser(data));
      } catch (err) {
        console.error("DataSourceController.autoload(" + id + ", " + typeof cb + ") -->\n", err);
        return cb(err);
      }
    });
  };
  /**
   * GET /datasources
   * @returns {Object} JSON listing of the datasource metadata files.
   */
  prototype.index = function(req, res, next){
    var files;
    files = findit.sync(this.dataDir);
    return res.send(files.filter(function(it){
      return YAML_OR_JSON_PAT.test(it);
    }).map(function(it){
      return (it + "").replace(YAML_EXT_PAT, '.json');
    }));
  };
  /**
   * GET /datasources/:datasource
   */
  prototype.show = function(req, res){
    return res.send(req.datasource);
  };
  /**
   * Returns the aggregated JSON content of the datasource metadata files.
   */
  prototype.allData = function(req, res, next){
    var data, files, _this = this;
    data = {};
    files = [];
    return Seq(findit.sync(this.dataDir)).filter(function(it){
      return YAML_OR_JSON_PAT.test(it);
    }).seq(function(){
      files = this.stack.slice();
      return this.ok(files);
    }).flatten().parMap_(function(next, f){
      return fs.readFile(f, 'utf8', next);
    }).parMap(function(text, i){
      var f, k, v, that;
      f = files[i];
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
        console.error("[/datasources] catch! " + err);
        console.error(err);
        if (that = err.stack) {
          console.error(that);
        }
        return res.send({
          error: String(err),
          partial_data: data
        });
      }
    }).seq(function(){
      return res.send(data);
    })['catch'](function(err){
      var that;
      console.error('[/datasources] catch!');
      console.error(err);
      if (that = err.stack) {
        console.error(that);
      }
      return res.send({
        error: String(err),
        partial_data: data
      });
    });
  };
  return DataSourceController;
}(Controller));
module.exports = exports = DataSourceController;
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}