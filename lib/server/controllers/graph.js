var fs, path, exists, Seq, yaml, mkdirp, mkdirpAsync, readJSONFilesAsync, Controller, GraphController, exports, _, _ref;
fs = require('fs');
path = require('path');
exists = path.existsSync;
_ = require('underscore');
Seq = require('seq');
yaml = require('js-yaml');
_ref = require('../mkdirp'), mkdirp = _ref.mkdirp, mkdirpAsync = _ref.mkdirpAsync;
readJSONFilesAsync = require('../files').readJSONFilesAsync;
Controller = require('../controller');
/**
 * @class Resource controller for graph requests.
 */
GraphController = (function(superclass){
  GraphController.displayName = 'GraphController';
  var prototype = __extend(GraphController, superclass).prototype, constructor = GraphController;
  prototype.PROTECTED_GRAPH_IDS = ['unique_visitors', 'pageviews', 'pageviews_mobile', 'reach', 'commons', 'articles', 'articles_per_day', 'edits', 'new_editors', 'active_editors', 'active_editors_target', 'very_active_editors'];
  prototype.PROTECT_GRAPHS = true;
  prototype.name = 'graphs';
  prototype.dataDir = 'data/graphs';
  function GraphController(){
    superclass.apply(this, arguments);
  }
  prototype.toFile = function(id){
    return this.dataDir + "/" + id + ".json";
  };
  /**
   * Auto-load :id for related requests.
   */
  prototype.autoload = function(id, cb){
    var file, parser, yamlFile;
    file = this.toFile(id);
    parser = JSON.parse;
    yamlFile = file.replace(/\.json$/i, '.yaml');
    if (exists(yamlFile)) {
      file = yamlFile;
      parser = yaml.load;
    }
    return fs.readFile(file, 'utf8', function(err, data){
      if ('ENOENT' === (err != null ? err.code : void 8)) {
        return cb(null, {});
      }
      if (err) {
        console.error("GraphController.autoload(" + id + ", " + typeof cb + ") -->\nerr");
        return cb(err);
      }
      try {
        return cb(null, parser(data));
      } catch (err) {
        console.error("GraphController.autoload(" + id + ", " + typeof cb + ") -->\nerr");
        return cb(err);
      }
    });
  };
  prototype.index = function(req, res){
    var pattern;
    switch (req.format) {
    case 'json':
      pattern = this.dataDir + "/*.json";
      return Seq().seq(function(){
        return readJSONFilesAsync(pattern, this);
      }).seq(function(graphs){
        return res.send(_.values(graphs));
      });
    default:
      return res.render('graph/index');
    }
  };
  prototype.show = function(req, res){
    if (req.format === 'json') {
      return res.send(req.graph);
    } else {
      return res.render('graph/view');
    }
  };
  prototype.edit = function(req, res){
    if (req.format === 'json') {
      return res.send(req.graph);
    } else {
      return res.render('graph/edit');
    }
  };
  prototype['new'] = function(req, res){
    return res.render('graph/edit');
  };
  prototype.create = function(req, res){
    var data, file;
    if (!(data = this.processBody(req, res))) {
      return;
    }
    file = this.toFile(data.id);
    if (exists(file)) {
      return res.send({
        result: "error",
        message: "Graph '" + data.id + "' already exists!"
      });
    } else {
      return fs.writeFile(file, JSON.stringify(data), "utf8", this.errorHandler(res, "Error writing graph!"));
    }
  };
  prototype.update = function(req, res){
    var data;
    if (!(data = this.processBody(req, res))) {
      return;
    }
    if (this.PROTECT_GRAPHS && _(this.PROTECTED_GRAPH_IDS).contains(data.id)) {
      return res.send({
        result: "error",
        message: "Graph '" + data.id + "' is read-only."
      }, 403);
    }
    return fs.writeFile(this.toFile(data.id), JSON.stringify(data), "utf8", this.errorHandler(res, "Error writing graph!"));
  };
  prototype.destroy = function(req, res){
    var id;
    id = req.param.graph;
    if (this.PROTECT_GRAPHS && _(this.PROTECTED_GRAPH_IDS).contains(id)) {
      return res.send({
        result: "error",
        message: "Graph '" + id + "' is read-only."
      }, 403);
    }
    return fs.unlink(this.toFile(id), this.errorHandler(res, "Graph '" + id + "' does not exist!"));
  };
  prototype.processBody = function(req, res){
    var data;
    if (!req.body) {
      res.send({
        result: "error",
        message: "Data required!"
      }, 501);
      return false;
    }
    data = req.body;
    data.slug || (data.slug = data.id);
    data.id || (data.id = data.slug);
    if (!data.slug) {
      res.send({
        result: "error",
        message: "Slug required!"
      }, 501);
      return false;
    }
    if (!exists(this.dataDir)) {
      mkdirp(this.dataDir);
    }
    return data;
  };
  prototype.errorHandler = function(res, msg){
    return function(err){
      var msg;
      if (err) {
        msg || (msg = err.message || String(err));
        console.error(msg);
        return res.send({
          result: "error",
          message: msg
        }, 501);
      } else {
        return res.send({
          result: "ok"
        });
      }
    };
  };
  return GraphController;
}(Controller));
module.exports = exports = GraphController;
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}