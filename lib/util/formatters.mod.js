require.define('/node_modules/kraken/util/formatters.js.js', function(require, module, exports, __dirname, __filename, undefined){

var moment, op, exports, _ref, _, _fmt;
moment = require('moment');
_ref = require('kraken/util'), _ = _ref._, op = _ref.op;
_fmt = {
  /**
   * Formats a date for display on an axis: `MM/YYYY`
   * @param {Date} d Date to format.
   * @returns {String}
   */
  axisDateFormatter: function(d){
    return moment(d).format('MM/YYYY');
  }
  /**
   * Formats a date for display in the legend: `DD MMM YYYY`
   * @param {Date} d Date to format.
   * @returns {String}
   */,
  dateFormatter: function(d){
    return moment(d).format('DD MMM YYYY');
  }
  /**
   * Formats a number for display, first dividing by the greatest suffix
   *  of {B = Billions, M = Millions, K = Thousands} that results in a
   *  absolute value greater than 0, and then rounding to `digits` using
   *  `result.toFixed(digits)`.
   * 
   * @param {Number} n Number to format.
   * @param {Number} [digits=2] Number of digits after the decimal to always display.
   * @param {Boolean} [abbrev=true] Expand number suffixes if false.
   * @returns {Object} Formatted number parts.
   */,
  numberFormatter: function(n, digits, abbrev){
    var suffixes, suffix, d, s, parts, whole, fraction, _i, _len, _ref;
    digits == null && (digits = 2);
    abbrev == null && (abbrev = true);
    suffixes = abbrev
      ? [['B', 1000000000], ['M', 1000000], ['K', 1000], ['', NaN]]
      : [['Billion', 1000000000], ['Million', 1000000], ['', NaN]];
    for (_i = 0, _len = suffixes.length; _i < _len; ++_i) {
      _ref = suffixes[_i], suffix = _ref[0], d = _ref[1];
      if (isNaN(d)) {
        break;
      }
      if (n >= d) {
        n = n / d;
        break;
      }
    }
    s = n.toFixed(digits);
    parts = s.split('.');
    whole = _.rchop(parts[0], 3).join(',');
    fraction = '.' + parts.slice(1).join('.');
    return {
      n: n,
      digits: digits,
      whole: whole,
      fraction: fraction,
      suffix: suffix,
      toString: function(){
        return this.whole + "" + this.fraction + (abbrev ? '' : ' ') + this.suffix;
      }
    };
  },
  numberFormatterHTML: function(n, digits){
    var whole, fraction, suffix, _ref;
    digits == null && (digits = 2);
    _ref = _fmt._numberFormatter(n, digits), whole = _ref.whole, fraction = _ref.fraction, suffix = _ref.suffix;
    return "<span class='value'><span class='whole'>" + whole + "</span><span class='fraction'>" + fraction + "</span><span class='suffix'>" + suffix + "</span></span>";
  }
};
module.exports = exports = _fmt;

});
