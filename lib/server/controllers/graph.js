var fs, path, exists, Seq, glob, yaml, op, mkdirp, mkdirpAsync, readFilesAsync, readJSONFilesAsync, Controller, FileBackedController, GraphController, exports, _ref, _;
fs = require('fs');
path = require('path');
exists = fs.existsSync || path.existsSync;
Seq = require('seq');
glob = require('glob');
yaml = require('js-yaml');
_ref = require('../../util'), _ = _ref._, op = _ref.op;
_ref = require('../mkdirp'), mkdirp = _ref.mkdirp, mkdirpAsync = _ref.mkdirpAsync;
_ref = require('../files'), readFilesAsync = _ref.readFilesAsync, readJSONFilesAsync = _ref.readJSONFilesAsync;
Controller = require('../controller');
FileBackedController = require('../file-controller');
/**
 * @class Resource controller for graph requests.
 */
GraphController = (function(superclass){
  GraphController.displayName = 'GraphController';
  var prototype = __extend(GraphController, superclass).prototype, constructor = GraphController;
  prototype.PROTECTED_GRAPH_IDS = ['unique_visitors', 'pageviews', 'pageviews_mobile', 'reach', 'commons', 'articles', 'articles_per_day', 'edits', 'new_editors', 'active_editors', 'active_editors_target', 'very_active_editors'];
  prototype.PROTECT_GRAPHS = true;
  prototype.name = 'graphs';
  function GraphController(){
    superclass.apply(this, arguments);
  }
  prototype.toFileSimple = function(id){
    return this.dataDir + "/" + id + ".json";
  };
  prototype.index = function(req, res){
    switch (req.format) {
    case 'json':
      return Seq().seq(readJSONFilesAsync, this.dataDir + "/**", Seq).seq(function(it){
        return res.send(_.values(it));
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
    var data, _this = this;
    if (!(data = this.processBody(req, res))) {
      return;
    }
    return Seq().seq(this.findFile, data.id, Seq).seq(function(file){
      return res.send({
        result: "error",
        message: "Graph '" + data.id + "' already exists!"
      }, 409);
    })['catch'](function(err){
      return fs.writeFile(_this.toFileSimple(data.id), JSON.stringify(data), "utf8", _this.errorHandler(res, "Error writing graph!"));
    });
  };
  prototype.update = function(req, res){
    var data, _this = this;
    if (!(data = this.processBody(req, res))) {
      return;
    }
    if (this.PROTECT_GRAPHS && _(this.PROTECTED_GRAPH_IDS).contains(data.id)) {
      return res.send({
        result: "error",
        message: "Graph '" + data.id + "' is read-only."
      }, 403);
    }
    console.log(this + ".update(" + data.id + ")");
    return Seq().seq_(function(next){
      return _this.findFile(data.id, function(err, file){
        return next.ok(err ? _this.toFileSimple(data.id) : file);
      });
    }).seq(function(file){
      return fs.writeFile(file, JSON.stringify(data), "utf8", _this.errorHandler(res, "Error writing graph!"));
    });
  };
  prototype.destroy = function(req, res){
    var id, _this = this;
    id = req.param.graph;
    if (this.PROTECT_GRAPHS && _(this.PROTECTED_GRAPH_IDS).contains(id)) {
      return res.send({
        result: "error",
        message: "Graph '" + id + "' is read-only."
      }, 403);
    }
    return Seq().seq(this.findFile, data.id, Seq).seq(function(file){
      return fs.unlink(file, _this.errorHandler(res, "Error destroying Graph '" + id + "'!", 500));
    })['catch'](function(err){
      return res.send({
        result: "error",
        message: "Graph '" + id + "' does not exist!"
      }, 410);
    });
  };
  prototype.processBody = function(req, res){
    var data;
    if (!req.body) {
      res.send({
        result: "error",
        message: "Data required!"
      }, 400);
      return false;
    }
    data = req.body;
    data.slug || (data.slug = data.id);
    data.id || (data.id = data.slug);
    if (!data.slug) {
      res.send({
        result: "error",
        message: "Slug required!"
      }, 400);
      return false;
    }
    if (!exists(this.dataDir)) {
      mkdirp(this.dataDir);
    }
    return data;
  };
  return GraphController;
}(FileBackedController));
module.exports = exports = GraphController;
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}