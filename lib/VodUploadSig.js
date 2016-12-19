var crypto = require('crypto');
var urlencode = require('urlencode');
var Sig = function(){
}

Sig.prototype.genUrlPath = function(obj) {
    var url = "";
    for (var key in obj) {
	url += key;
	url += "=";
	url += obj[key];
	url += "&";
    }
    url = url.substring(0,url.length-1);
    return url;
};

Sig.prototype.genSig = function(obj, secretKey) {
    var path = this.genUrlPath(obj);
    path = "POSTvod2.qcloud.com/v2/index.php?" + path
    console.log(path);
    var hmac = crypto.createHmac('sha1', secretKey || '')
    var str = hmac.update(new Buffer(path, 'utf8')).digest('base64');
    var sigurl = urlencode(str);
    return sigurl;
};

module.exports = Sig;
