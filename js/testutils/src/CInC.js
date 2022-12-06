var chainConf = require('../../blockchain.settings.js');

var CInCEventHash = Object.freeze({
	// Infer(address, address, address, uint256)
	e_Infer  : '0x696f8cab66a6aebfa834e604238109944fd1547ed11271527e3b259aa18b96f6',
});

module.exports.parseCInCLogs = function(logs, result, callback) {
	parseLogIterative(logs, 0, result, callback);
}

function parseLogIterative(logs, idx, result, callback) {
	if (idx >= logs.length) {
		callback(null, result);
		return ;
	}

	var func = {
		isInfer: false,
		name: null,
		sender: null,
		model: null,
		data: null,
		label: null,
		result: null
	}

	var log = logs[idx];
	switch(log.topics[0]) {
	case CInCEventHash.e_Infer:
		if (log.topics.length != 4) {
			result.left.push(log);
			break;
		}

		func.isInfer = true;
		func.name = "Infer(address sender, address model, address data, uint256 result)";
		func.sender = "0x" + log.topics[1].slice(-40);
		func.model = "0x" + log.topics[2].slice(-40);
		func.data = "0x" + log.topics[3].slice(-40);
		func.label = log.data;
		func.result = parseInt(log.data);
		result.parse.push(func);
		break;
	default:
		result.left.push(log);
	}

	parseLogIterative(logs, ++idx, result, callback);
}

