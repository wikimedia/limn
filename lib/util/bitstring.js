var SEEK_ABSOLUTE, SEEK_RELATIVE, SEEK_FROM_EOF, bin, binlen, mask, chr, ord, BitString, exports;
SEEK_ABSOLUTE = 0;
SEEK_RELATIVE = 1;
SEEK_FROM_EOF = 2;
bin = function(n){
  var s;
  do {
    s = (n % 2 ? '1' : '0') + (s || '');
    n >>= 1;
  } while (n);
  return s;
};
binlen = function(n){
  return bin(Math.abs(n)).length;
};
mask = function(n){
  return (1 << n) - 1;
};
chr = function(it){
  return String.fromCharCode(it);
};
ord = function(it){
  return String(it).charCodeAt(0);
};
/**
 * File-like object for reading/writing bits.
 * @class
 */
BitString = (function(){
  BitString.displayName = 'BitString';
  var prototype = BitString.prototype, constructor = BitString;
  prototype.buf = null;
  prototype._pos = -1;
  prototype._spill = 0;
  prototype._spillen = 0;
  prototype._peek = 0;
  prototype._peeklen = 0;
  function BitString(source, buf){
    var i, _to;
    source == null && (source = '');
    buf == null && (buf = []);
    this.buf = buf.slice();
    for (i = 0, _to = source.length; i < _to; ++i) {
      this._bufwrite(source.charCodeAt(i));
    }
  }
  prototype.size = function(){
    return this.buf.length + (this._spillen ? 1 : 0);
  };
  prototype.bitsize = function(){
    return this.buf.length * 8 + this._spillen;
  };
  prototype._bufwrite = function(b){
    if (this._pos === -1) {
      this.buf.push(b);
    } else {
      this.buf[this._pos] = b;
      if (++this._pos >= this.buf.length) {
        this._pos = -1;
      }
    }
    return this;
  };
  prototype.writebits = function(n, size){
    var bits, b;
    size = size || binlen(n);
    bits = this._spill << size | n;
    size += this._spillen;
    while (size >= 8) {
      size -= 8;
      b = bits >> size;
      bits &= mask(size);
      this._bufwrite(b);
    }
    this._spill = bits;
    this._spillen = size;
    return this;
  };
  prototype.flush = function(){
    var b;
    b = this._spill;
    if (this._spillen) {
      b <<= 8 - this._spillen;
      this._bufwrite(b);
    }
    this._spill = 0;
    this._spillen = 0;
    return this;
  };
  prototype.truncate = function(){
    this.buf = [];
    this._pos = -1;
    this._spill = 0;
    this._spillen = 0;
    this._peek = 0;
    this._peeklen = 0;
    return this;
  };
  prototype._bufseek = function(n, mode){
    var pos;
    mode == null && (mode = SEEK_ABSOLUTE);
    switch (mode) {
    case 1:
      pos = this._pos + n;
      break;
    case 2:
      pos = this.buf.length + n;
      break;
    default:
      pos = n;
    }
    this._pos = pos >= this.buf.length
      ? -1
      : Math.max(0, pos);
    return this;
  };
  prototype.seek = function(n, mode){
    mode == null && (mode = SEEK_ABSOLUTE);
    this.flush();
    this._peek = 0;
    this._peeklen = 0;
    this._bufseek(n, mode);
    return this;
  };
  prototype.tell = function(){
    if (this._pos === -1) {
      return this.buf.length;
    } else {
      return this._pos;
    }
  };
  prototype._nextbyte = function(){
    var byte;
    if (this._pos === -1) {
      return null;
    }
    byte = this.buf[this._pos++];
    if (this._pos >= this.buf.length) {
      this._pos = -1;
    }
    return byte;
  };
  prototype.readbits = function(n){
    var size, bits, byte;
    if (n == 0) {
      return 0;
    }
    size = this._peeklen;
    bits = this._peek;
    while (size < n) {
      byte = this._nextbyte();
      if (byte == null) {
        break;
      }
      size += 8;
      bits = bits << 8 | byte;
    }
    if (size > n) {
      this._peeklen = size - n;
      this._peek = bits & mask(this._peeklen);
      bits >>= this._peeklen;
    } else {
      this._peeklen = 0;
      this._peek = 0;
    }
    return size ? bits : null;
  };
  prototype.peek = function(n){
    var offset, size, bits, byte;
    offset = 0;
    size = this._peeklen;
    bits = this._peek;
    while (size < n) {
      byte = this._nextbyte();
      if (byte == null) {
        break;
      }
      offset += 1;
      size += 8;
      bits = bits << 8 | byte;
    }
    if (size == 0) {
      return null;
    }
    if (size > n) {
      bits >>= size - n;
    }
    if (offset) {
      this._bufseek(-offset, SEEK_RELATIVE);
    }
    return bits;
  };
  prototype.hasMore = function(){
    return this.peek(1) != null;
  };
  prototype.each = function(fn, cxt){
    cxt == null && (cxt = this);
    return this.buf.forEach(fn, cxt);
  };
  prototype.map = function(fn, cxt){
    cxt == null && (cxt = this);
    return this.buf.map(fn, cxt);
  };
  prototype.reduce = function(fn, acc, cxt){
    cxt == null && (cxt = this);
    fn = fn.bind(this);
    return this.buf.reduce(fn, acc);
  };
  prototype.bytearray = function(){
    return this.flush().buf.slice();
  };
  prototype.bin = function(byte_sep){
    byte_sep == null && (byte_sep = '');
    return this.flush().buf.map(bin).join(byte_sep);
  };
  prototype.hex = function(){
    return this.flush().buf.map(hex).join('');
  };
  prototype.number = function(){
    this.flush();
    return this.reduce(function(n, byte){
      return n << 8 | byte;
    });
  };
  prototype.dump = function(){
    return this.buf.map(chr).join('') + (this._spillen ? chr(this._spill << 8 - this._spillen) : '');
  };
  prototype.repr = function(dump_buf){
    var s;
    dump_buf == null && (dump_buf = true);
    s = dump_buf
      ? "buf=" + this.dump()
      : "len(buf)=" + this.buf.length;
    return "BitString(" + s + ", spill[" + this._spillen + "]=" + bin(this._spill) + ", tell=" + this.tell() + ", peek[" + this._peeklen + "]=" + bin(this._peek) + ")";
  };
  prototype.toString = function(){
    return this.flush().dump();
  };
  return BitString;
}());
exports = module.exports = BitString;
exports.SEEK_ABSOLUTE = SEEK_ABSOLUTE;
exports.SEEK_RELATIVE = SEEK_RELATIVE;
exports.SEEK_FROM_EOF = SEEK_FROM_EOF;