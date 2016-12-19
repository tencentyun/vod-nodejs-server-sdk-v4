# vod-nodejs-server-sdk-v4
## 功能说明
vod-nodejs-server-sdk是为了让Node.js开发者能够在自己的代码里更快捷方便地使用点播上传功能而开发的SDK工具包。
## 示例代码
```
var config = require('./config/config.js');
var VodUploadApi = require('./lib/VodUploadApi.js');

function begin_process() {
    if (process.argv.length < 3) {
        console.log("usage:");
        console.log("node " + process.argv[1] + " VodUploadApiGear.js filePath");
        return - 1;
    }
    var filePath = process.argv[2];
    var slicePage = 512*1024;

    var api = new VodUploadApi(config);
	// 重新设置SecretId, SecretKey
    api.SetSecretId('AKIDvzvn8Clc7Ck0L0uR8yIU3Csjlnfnrxjs');
    api.SetSecretKey('EHLKDE4LFcUAxxPEfHziTMwuwZZk3bKt');
    api.SetRegion("gz");
    api.UploadVideo(filePath, config['fileName'], config['fileType'],slicePage, config['notifyUrl'], function(err, data) {
        if (err) {
        	// deal error
        	console.log(err);
        	return;
        }
    });
}

begin_process();
```
## VodUploadApiGear.js使用说明
1.配置config目录中config.js文件，其中：
notifyUrl为回调地址，
fileType为文件类型，
fileName为文件名字
2.执行node VodUploadApiGear.js 可看到访问命令（用法）

## SDK下载
1.到[github](http://github.com/tencentyun/vod-nodejs-server-sdk-v4)下载

