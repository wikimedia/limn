var url, minimatch, request, matchesList, ProxyMiddleware, exports, _;
_ = require('underscore');
url = require('url');
minimatch = require('minimatch');
request = require('request');
matchesList = function(list, value){
  var pat, _i, _len;
  for (_i = 0, _len = list.length; _i < _len; ++_i) {
    pat = list[_i];
    if (pat(value)) {
      return true;
    }
  }
  return false;
};
ProxyMiddleware = function(options){
  var whitelist, blacklist, _ref;
  options == null && (options = {});
  _ref = options = (__import({
    whitelist: [],
    blacklist: []
  }, options)), whitelist = _ref.whitelist, blacklist = _ref.blacklist;
  whitelist = whitelist.map(function(it){
    return minimatch.filter(it, {
      nocase: true
    });
  });
  blacklist = blacklist.map(function(it){
    return minimatch.filter(it, {
      nocase: true
    });
  });
  return function(req, res){
    var targetUrl, target;
    targetUrl = (req.params.url || url.parse(req.url).pathname.slice(3)).trim();
    if (!targetUrl) {
      return res.send({
        error: 'URL required'
      }, 400);
    }
    if (!/^https?:\/\//.test(targetUrl)) {
      targetUrl = "http://" + targetUrl;
    }
    target = url.parse(targetUrl, true, true);
    if (matchesList(blacklist, target.hostname)) {
      return res.send({
        error: 'Domain is blacklisted'
      }, 403);
    }
    if (!matchesList(whitelist, target.hostname)) {
      return res.send({
        error: 'Domain is not whitelisted'
      }, 403);
    }
    res.header('X-Accel-Buffering', 'no');
    console.log("[Proxy] " + targetUrl);
    return request.get(targetUrl).pipe(res);
  };
};
module.exports = exports = ProxyMiddleware;
exports.ProxyMiddleware = ProxyMiddleware;
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}