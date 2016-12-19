var Sig = require('./VodUploadSig.js');
var http = require('http');
var util = require('util');
var fs = require('fs');
var crypto = require('crypto');
var maxSock = 10000;
var SliceNumPerGroup = 10 
var keepAliveAgent = new http.Agent({
    //keepAlive: true,
    maxSockets: maxSock,
    maxKeepAliveRequests:0,
    maxKeepAliveTime:240000,
});

var VodUploadApi = function(config) {
    this.secretId = config.secretId;
    this.secretKey = config.secretKey;
    this.defaultRegion = "gz";
    this.config = config;
    this.sig = new Sig();
};

var CrtSliceCount = 0;
var PacketNum = 0;
var TotalSliceCount = 0;

VodUploadApi.prototype.SetSecretId = function(secretId){
    this.secretId = secretId;
}

VodUploadApi.prototype.SetSecretKey = function(secretKey){
    this.secretKey = secretKey;
}

VodUploadApi.prototype.SetRegion = function(region){
    this.defaultRegion = region;
}

VodUploadApi.prototype.UploadVideo = function(filePath, fileName, fileType, sliceSize, notifyUrl, callback) {
    this.InitUpload(filePath, fileName, fileType, sliceSize, notifyUrl, callback)
}

VodUploadApi.prototype.InitUpload = function(filePath, fileName, fileType, sliceSize, notifyUrl, callback) {
	console.log("\n===InitUpload begin===\n");
	
	var fd = fs.openSync(filePath, "r");
	var stat = fs.statSync(filePath);
	var fileSize = stat.size;
	var buffer = new Buffer(fileSize);
	fs.readSync(fd, buffer, 0, fileSize, 0)
	// get sha
	var fsHash = crypto.createHash('sha1');
	fsHash.update(buffer);
	var fileSha = fsHash.digest('hex');
	
	var reqObj = {
		'Action' : "InitUpload",
		//Action' : "DescribeProject",
		'Nonce' : Math.round(Math.random() * (1000000-1) + 1),
		'Region' : this.defaultRegion,
		'RequestClient' : "SDK_NODEJS_1.1",
		'SecretId' : this.secretId,
		'Timestamp' : (new Date).getTime(),
		'contentLen' : 0,
		'dataSize' : sliceSize,
		'fileName' : fileName,
		'fileSha' : fileSha,
		'fileSize' : fileSize,
		'fileType' : fileType,
		'notifyUrl' : notifyUrl,
	};

	var sigature = this.sig.genSig(reqObj, this.secretKey);
	reqObj['Signature'] = sigature;
	urlPath = this.sig.genUrlPath(reqObj);
	var par = this
	this.request(urlPath, "", function(err, rspBody){
		if (err) {
			console.log(err);
			return;
		}

		if (rspBody['code'] == 0 || rspBody['code'] == 1) {	
    			console.log("\n===UploadPart begin===\n");
			par.UploadPart(filePath, fileName, fileType, fileSha, fileSize, sliceSize, 0, notifyUrl, callback);
		} else if (rspBody['code'] == 2) {
			console.log("file already existed!\n");
			par.FinishUpload(fileSha, notifyUrl, callback);
		} else {
			console.log(rspBody);
			callback();
		}
	});
}

VodUploadApi.prototype.UploadOneSlice = function(filePath, fileName, fileType, fileSha, fileSize, sliceSize, offset, groupBorder, notifyUrl, callback) {
	var pageSize = sliceSize;
	if (sliceSize > fileSize) {
		pageSize = fileSize;
	} else if (offset + sliceSize > fileSize) {
		pageSize = fileSize - offset;
	}
	var buffer = new Buffer(pageSize);
    	var fd = fs.openSync(filePath, "r");
	fs.readSync(fd, buffer, 0, pageSize, offset);

	var hasher=crypto.createHash("md5");
            hasher.update(buffer);	
	var dataMd5 = hasher.digest('hex');

	var reqObj = {
		'Action' : "UploadPart",
		'Nonce' : Math.round(Math.random() * (1000000-1) + 1),
		'Region' : this.defaultRegion,
		'RequestClient' : "SDK_NODEJS_1.1",
		'SecretId' : this.secretId,
		'Timestamp' : (new Date).getTime(),
		'contentLen' : pageSize,
		'dataMd5' : dataMd5,
		'dataSize' : pageSize,
		'fileName' : fileName,
		'fileSha' : fileSha,
		'fileSize' : fileSize,
		'fileType' : fileType,
		'notifyUrl' : notifyUrl,
		'offset' : offset,
	}
	var sigature = this.sig.genSig(reqObj, this.secretKey);
	reqObj['Signature'] = sigature;
	urlPath = this.sig.genUrlPath(reqObj);
	par = this;
        this.request(urlPath, buffer, function(err, rspBody){
            CrtSliceCount++;
            PacketNum++;
	    console.log("CrtSliceCount is : ")
	    console.log(CrtSliceCount);
	    console.log("PacketNum is : ");
	    console.log(PacketNum);
            if (CrtSliceCount == TotalSliceCount) {
                par.FinishUpload(fileSha, notifyUrl, callback)
            	CrtSliceCount = 0;
    		return
            }

            if (PacketNum == GroupSliceNum) {
		PacketNum = 0
                par.UploadPart(filePath, fileName, fileType, fileSha, fileSize, sliceSize, groupBorder, notifyUrl, callback);
            }
        }); 
}

VodUploadApi.prototype.UploadPart = function(filePath, fileName, fileType, fileSha, fileSize, sliceSize, offset, notifyUrl, callback) {
    groupBorder = offset + SliceNumPerGroup * sliceSize;
    if (groupBorder > fileSize) {
        groupBorder = fileSize;
    }
    
    GroupSliceNum = parseInt((groupBorder - offset) / sliceSize);
    if ((groupBorder - offset) % sliceSize != 0) {
        GroupSliceNum++;
    }

    TotalSliceCount = parseInt(fileSize / sliceSize);
    if (fileSize % sliceSize != 0) {
        TotalSliceCount++;
    }
    console.log("********* GroupSliceNum is %d\n, Border is %d\n, offset is %d\n", GroupSliceNum, groupBorder, offset);
    var packetNum = 0;
    for (; offset < groupBorder; offset += sliceSize) {
        this.UploadOneSlice(filePath, fileName, fileType, fileSha, fileSize, sliceSize, offset, groupBorder, notifyUrl, callback);
    }
}

VodUploadApi.prototype.FinishUpload = function(fileSha, notifyUrl, callback) {
	console.log("\n===FinishUpload begin===\n");
	
	var reqObj = {
		'Action' : "FinishUpload",
		'Nonce' : Math.round(Math.random() * (1000000-1) + 1),
		'Region' : this.defaultRegion,
		'RequestClient' : "SDK_NODEJS_1.1",
		'SecretId' : this.secretId,
		'Timestamp' : (new Date).getTime(),
		'contentLen' : 0,
		'fileSha': fileSha,
		'notifyUrl' : notifyUrl,
	}
	var sigature = this.sig.genSig(reqObj, this.secretKey);
	reqObj['Signature'] = sigature;
	urlPath = this.sig.genUrlPath(reqObj);
	
	this.request(urlPath, "", callback);
}

VodUploadApi.prototype.request = function(urlPath, reqData, callback) {
    var self = this;
    var requestArg = {
        //agent: keepAliveAgent,
	agent:false,
        host: "vod2.qcloud.com",
        method: 'POST',
	path: "/v2/index.php?"+urlPath,
	timeout: 2,
	headers: {
		"Content-type":"application/octet-stream",
		"Accept":"*/*",
		"User-Agent":"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36",
	}
    }
    var chunkList = [];
    var req = http.request(requestArg,
    function(rsp) {
	rsp.setTimeout(6000);
        rsp.setEncoding('utf8');
        rsp.on('data',
        function(chunk) {
            chunkList.push(chunk);
        });
        rsp.on('error',
        function(err) {
	    console.log(err);
            if (callback) {
                callback(err);
            }
        });
        rsp.on('end',
        function() {
	    console.log("in end");
            rspBody = chunkList.join('');
	    console.log(rspBody);
            try {
                var rspJsonBody = JSON.parse(rspBody);
            } catch(err) {
                if (callback) {
                    callback(err);
                }
            }
            if (callback) {
                callback(null, rspJsonBody);
            }
        });
    });
    //req.write(JSON.stringify(reqData));
    req.write(reqData);
    req.end();
}

module.exports = VodUploadApi;
