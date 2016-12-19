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
    api.SetSecretId('AKIDvzvn8C************');
    api.SetSecretKey('EHLKDE4LFc*************');
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
1.在第一次使用云API之前，用户首先需要在[腾讯云网站](https://www.qcloud.com/document/product/266/1969#1.-.E7.94.B3.E8.AF.B7.E5.AE.89.E5.85.A8.E5.87.AD.E8.AF.81)申请安全凭证，安全凭证包括 SecretId 和 SecretKey, SecretId 是用于标识 API 调用者的身份，SecretKey是用于加密签名字符串和服务器端验证签名字符串的密钥。SecretKey 必须严格保管，避免泄露。

2.配置config目录中config.js文件，其中：
secretId, secretKey 为安全凭证，
notifyUrl为回调地址，
fileType为文件类型，
fileName为文件名字。

3.执行node VodUploadApiGear.js 可看到访问命令（用法）

