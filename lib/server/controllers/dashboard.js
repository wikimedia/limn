var fs, path, exists, Seq, yaml, readJSONFilesAsync, FileBackedController, DashboardController, exports, _;
fs = require('fs');
path = require('path');
exists = path.existsSync;
_ = require('underscore');
Seq = require('seq');
yaml = require('js-yaml');
readJSONFilesAsync = require('../files').readJSONFilesAsync;
FileBackedController = require('../file-controller');
/**
 * @class Resource controller for dashboard requests.
 */
DashboardController = (function(superclass){
  DashboardController.displayName = 'DashboardController';
  var prototype = __extend(DashboardController, superclass).prototype, constructor = DashboardController;
  prototype.PROTECTED_IDS = ['main', 'reportcard'];
  prototype.PROTECT = true;
  prototype.name = 'dashboards';
  function DashboardController(){
    superclass.apply(this, arguments);
  }
  prototype.index = function(req, res){
    var pattern;
    switch (req.format) {
    case 'json':
      pattern = this.dataDir + "/*.json";
      return Seq().seq(function(){
        return readJSONFilesAsync(pattern, this);
      }).seq(function(files){
        return res.send(_.values(files));
      });
    default:
      return res.render(this.id + "/index");
    }
  };
  prototype.show = function(req, res){
    if (req.format === 'json') {
      return res.send(req.dashboard);
    } else {
      return res.render(this.id + "/view");
    }
  };
  prototype.edit = function(req, res){
    if (req.format === 'json') {
      return res.send(req.dashboard);
    } else {
      return res.render(this.id + "/edit");
    }
  };
  prototype['new'] = function(req, res){
    return res.render(this.id + "/edit");
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
        message: "Dashboard '" + data.id + "' already exists!"
      }, 409);
    } else {
      return fs.writeFile(file, JSON.stringify(data), "utf8", this.errorHandler(res, "Error writing Dashboard!"));
    }
  };
  prototype.update = function(req, res){
    var data;
    if (!(data = this.processBody(req, res))) {
      return;
    }
    if (this.PROTECT && _(this.PROTECTED_IDS).contains(data.id)) {
      return res.send({
        result: "error",
        message: "Dashboard '" + data.id + "' is read-only."
      }, 403);
    }
    return fs.writeFile(this.toFile(data.id), JSON.stringify(data), "utf8", this.errorHandler(res, "Error writing Dashboard!"));
  };
  prototype.destroy = function(req, res){
    var id;
    id = req.param.dashboard;
    if (this.PROTECT && _(this.PROTECTED_IDS).contains(id)) {
      return res.send({
        result: "error",
        message: "Dashboard '" + id + "' is read-only."
      }, 403);
    }
    return fs.unlink(this.toFile(id), this.errorHandler(res, "Dashboard '" + id + "' does not exist!", 410));
  };
  return DashboardController;
}(FileBackedController));
module.exports = exports = DashboardController;
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}