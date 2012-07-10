var url, exports, ReqInfoMiddleware, _;
_ = require('underscore');
url = require('url');
module.exports = exports = function(options){
  var mw;
  mw = new ReqInfoMiddleware(options);
  return mw.respond;
};
exports.ReqInfoMiddleware = ReqInfoMiddleware = (function(){
  ReqInfoMiddleware.displayName = 'ReqInfoMiddleware';
  var prototype = ReqInfoMiddleware.prototype, constructor = ReqInfoMiddleware;
  function ReqInfoMiddleware(options){
    this.options = options != null
      ? options
      : {};
    _.bindAll(this, 'respond');
  }
  prototype.parse = url.parse;
  prototype.respond = (function(){
    function reqinfo(req, res, next){
      req.info = this.parse(req.url);
      return next();
    }
    return reqinfo;
  }());
  return ReqInfoMiddleware;
}());