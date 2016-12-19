var config = require('./config/config.js');
var VodUploadApi = require('./lib/VodUploadApi.js');

function begin_process() {
    if (process.argv.length < 3) {
        console.log("usage:");
        console.log("node " + process.argv[1] + " VodUploadApiGear.js filePath");
        return - 1;
    }
    var filePath = process.argv[2];
    var slicePage = 512*1024;//process.argv[3];

    var api = new VodUploadApi(config);
	// 安全凭证
    api.SetSecretId('AKID********************');
    api.SetSecretKey('EHL*********************');
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

