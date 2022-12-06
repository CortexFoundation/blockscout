import * as RLP from "rlp";
import { Buffer } from "safe-buffer";
import create_torrentCallback from "create-torrent";
import bencode from "bencode";
import axios from "axios";
import Web3 from "web3"
import * as shajs from "sha.js";
import { promisify } from "es6-promisify";
import config from "../../app.conf";
import { saveAs } from "file-saver/FileSaver";
import * as Tx from "ethereumjs-tx";

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function checkAndExit(error, web3) {
	if(error && !web3.isConnected()) {
		console.log('Exit: The program quits due to that Web3 not connected')
		console.log(error)
		process.exit(-1)
	}
}

class CortexUtils {
    constructor() {
        $.DEFAULT_MODEL_GAS = 10000
        this._create_torrent = promisify(create_torrentCallback);
        this.current_id = ~(Math.random() * 65536);
        this._input_shape = [1, 28, 28];
        this._output_shape = [1];
        this._author = '0xc0d86d03f451e38c2ee0fa0daf5c8d6e2d1243d2';
        this._sender = '0xc0d86d03f451e38c2ee0fa0daf5c8d6e2d1243d2';
        this._nonce = -1;
        this.axios = axios;
		// this._debug_url_prefix = 'http://192.168.50.4:8000';
		this._debug_url_prefix = 'https://cerebro.cortexlabs.ai';
		// this._debug_url_prefix = 'http://192.168.50.136:8000';
        this._save_torrent_enabled = true;
        this._metamask_enabled = true;
        this._private_key = new Buffer('2986e1324effda14d9864f4fd0a07b4d81baf3c9d2e422ea2571af484026c6e9', 'hex'); // For test only
        this._trackers = ['http://torrent.cortexlabs.ai:5008/announce'];
        this._gas = $.DEFAULT_MODEL_GAS;
    }
	async init(obj) {
		if (typeof ctxWeb3 == 'undefined') {
		    obj.showWallet = true;
            $('.loading').fadeOut(500);
		}
		while (typeof ctxWeb3 == 'undefined') {
			await sleep(50);
		}

		if (!ctxWeb3.eth.defaultAccount) {
            obj.showWallet = true;
            $('.loading').fadeOut(500);
			// alert("[ERROR]: Invalid CortexWallet State.\n" +
			// 	  "         CortexWallet's default account is not set correctly\n" +
			// 	  "         Maybe login into wallet")
		}
		while (!ctxWeb3.eth.defaultAccount) {
			await sleep(50);
		}

		obj.showWallet = false;
		this.web3 = new Web3(ctxWeb3.currentProvider);
		this.web3.eth.defaultAccount = this._author = this._sender = ctxWeb3.eth.defaultAccount;

		console.log("Init web3 successfully.")
	}
    metamask_enabled(_) {
        return _ != undefined ? (this._metamask_enabled = _, this) : this._metamask_enabled;
    }
    private_key(_) {
        return _ ? (this._private_key = _, this) : this._private_key;
    }
    async send_transaction(tx) {
        if (this.metamask_enabled()) {
			let ret = null;
			const receipt = await this.web3.eth.sendTransaction(tx,
                async (err, hash) => {
                    checkAndExit(err, this.web3)
                    try {
						for (let counter2 = 0; counter2 < 100; counter2 += 1) {
							if (ret) return;
							this.web3.eth.getTransactionReceipt(hash, async (err, receiptRet) => {
								console.log("trasnaction with receipt", receiptRet)
								ret = receiptRet
							});
							await sleep(1500);
						}
					} catch(err) {
                        checkAndExit(err, this.web3)
                    }
                }
            );
			for (let counter = 0; counter < 100; counter += 1) {
				if (ret) return ret;
				await sleep(1500);
			}
            return ret;
        } else {
            for (let key of Object.keys(tx)) {
                if (tx[key] == null) {
                    // tx[key] = "0x00";
                } else if (!isNaN(tx[key]) && !(tx[key] && tx[key].startsWith && tx[key].startsWith('0x'))) {
                    tx[key] = '0x0' + tx[key].toString(16);
                }
            }
            if (this._nonce == -1) {
                try {
                    this._nonce = await this.web3.eth.getTransactionCount(tx.from);
                } catch(err) {
                    checkAndExit(err, this.web3)
                }
            }
            tx.nonce = '0x0' + this._nonce.toString(16);
            this._nonce += 1;
            const signedTx = new Tx(tx);
            signedTx.sign(this.private_key());
            const serializedTx = signedTx.serialize();
            const receipt = await this.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')
					/*,
                async (err, hash) => {
                    checkAndExit(err, this.web3)

                    try {
                        tx = await this.web3.eth.getTransactionReceipt(hash);
                    } catch(err) {
                        checkAndExit(err, this.web3)
                    }
                }*/
            );
            return receipt;
        }
    }
	
	async wait_receipt(hash) {
		let ret = null
		for (let counter = 0; counter < 100; counter += 1) {
			if (ret) return ret;
			this.web3.eth.getTransactionReceipt(hash, async (err, receiptRet) => {
				console.log("trasnaction with receipt", receiptRet)
				ret = receiptRet
			});
			await sleep(1500);
		}
		return ret
	}
    async call_async(tx) {
        let ret = null
		this.web3.eth.call(tx, (err, result) => {
			if (err) ret = err.toString()
			else ret = result
		}) 

		while (ret == null) {
			await sleep(1000)
		}
		console.log(ret)
		return ret
		try {
			ret = await this.web3.eth.call(tx) 
		} catch(err){ 
		    ret = err.toString()  
        }
		console.log('call_async', ret)
		return ret
				/* async (err, hash) => {
                  try {
				    ret = hash
				  } catch(err) {
                    console.log(err)
					ret = err
				  } 
			 })*/
		for (let count = 0; count < 5; count++) {
             if (res) return res
		     await sleep(1000)
		}
		return ret 
	} 
    async send_transaction_async(tx) {
        if (this.metamask_enabled()) {
			let ret = null;
			const receipt = await this.web3.eth.sendTransaction(tx, 
                async (err, hash) => {
                    checkAndExit(err, this.web3)
                    try {
					   ret = hash	
					} catch(err) {
                        checkAndExit(err, this.web3)
                    }
                }
            );
			for (let counter = 0; counter < 100; counter += 1) {
				if (ret) return ret;
				await sleep(1500);
			}
            return ret;
        } else {
            for (let key of Object.keys(tx)) {
                if (tx[key] == null) {
                    // tx[key] = "0x00";
                } else if (!isNaN(tx[key]) && !(tx[key] && tx[key].startsWith && tx[key].startsWith('0x'))) {
                    tx[key] = '0x0' + tx[key].toString(16);
                }
            }
            if (this._nonce == -1) {
                try {
                    this._nonce = await this.web3.eth.getTransactionCount(tx.from);
                } catch(err) {
                    checkAndExit(err, this.web3)
                }
            }
            tx.nonce = '0x0' + this._nonce.toString(16);
            this._nonce += 1;
            const signedTx = new Tx(tx);
            signedTx.sign(this.private_key());
            const serializedTx = signedTx.serialize();
            const receipt = await this.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')
					/*,
                async (err, hash) => {
                    checkAndExit(err, this.web3)

                    try {
                        tx = await this.web3.eth.getTransactionReceipt(hash);
                    } catch(err) {
                        checkAndExit(err, this.web3)
                    }
                }*/
            );
            return receipt;
        }
    }
    save_torrent_enabled(_) {
        return _ != undefined ? (this._save_torrent_enabled = _, this) : this._save_torrent_enabled;
    }

    input_shape(_) {
        return _ ? (this._input_shape = _, this) : this._input_shape;
    }
    output_shape(_) {
        return _ ? (this._output_shape = _, this) : this._output_shape;
    }
    sender(_) {
        if (_) {
            this._sender = _;
            this._nonce = -1;
            return this;
        } else {
            return this._sender;
        }
    }
    receiver(_) {
        return _ ? (this._receiver = _, this) : this._receiver;
    }
    nonce(_) {
        return _ ? (this._nonce = -1, this) : this._nonce;
    }
    author(_) {
        return _ ? (this._author = _, this) : this._author;
    }
    trackers(_) {
        return _ ? (this._trackers = _, this) : this._trackers;
    }
    gas(_) {
        return _ ? (this._gas = _, this) : this._gas;
    }
    addtracker(_) {
        if (!Array.isArray(this._trackers)) {
            this._trackers = [];
        }
        if (Array.isArray(_)) {
            this._trackers.concat(_);
        } else {
            this._trackers.push(_);
        }
        return this;
    }
    hex2buffer(str) {
        str = str.toLowerCase();
        if (str.startsWith('0x')) str = str.substring(2);
        const result = [];
        for (var i = 0; i < str.length; i += 2) {
            result.push(parseInt(str.substring(i, i + 2), 16));
        }
        return Buffer.from(result);
    }
    buffer2hex(arr) {
        const str = "0123456789abcdef";
        return "".concat(...Array.from(arr).map(d => "" + str[d >> 4] + str[d & 15]));
    }
    serialize(data) {
        let ret = "";
        try {
            ret = this.buffer2hex(RLP.encode(data));
        } catch (e) {
            console.log(e);
        }
        return ret;
    }
    deserialize(data) {
        let ret = "";
        try {
            ret = RLP.decode(data);
        } catch (e) {
            console.log(e);
        }
        return ret;
    }
    deserialize_payload(payload) {
        return this.deserialize('0x' + payload.slice(6));
    }
    magnet_uri(torrent) {
        return `magnet:?xt=urn:btih:${torrent.infohash}` + "".concat(...this.trackers().map(tracker => `&tr=${tracker}`));
    }
    create_infohash(data) {
        const torrent = bencode.decode(data);
        console.log(bencode.encode(torrent.info));
        const infohash = shajs('sha1').update(bencode.encode(torrent.info)).digest('hex');
        return { torrent, infohash };
    }
    async create_torrent(files, comment = "") {
        let data = await this._create_torrent(files, { name: "data", comment: comment, announceList: [ this.trackers() ]});
        const info = bencode.decode(data).info;
        const infohash = shajs('sha1').update(bencode.encode(info)).digest('hex');
        if (this.save_torrent_enabled()) {
            saveAs(new Blob([data]), infohash + ".torrent");
        }
        return { torrent: data, infohash, info };
    }
    async create_input(torrent) {
        const uri = this.magnet_uri(torrent);
        const hash = this.hex2buffer(torrent.infohash);
        const size = torrent.info.length;
        const input_shape = this.input_shape();
        const addr = this.hex2buffer(this.author());
        const blockNum = 0;
        return '0x0002' + this.serialize([uri, hash, size, input_shape, blockNum]);
    }
    async create_model(torrent) {
        const uri = this.magnet_uri(torrent);
        const hash = this.hex2buffer(torrent.infohash);
        const size = torrent.info.files.map(file => file.length).reduce((a, b) => a + b);
        const input_shape = this.input_shape();
        const output_shape = this.output_shape();
        const gas = this.gas();
        const addr = this.hex2buffer(this.author());
        const blockNum = 0;
        return '0x0001' + this.serialize([uri, hash, size, input_shape, output_shape, gas, addr, blockNum]);
    }

    async encoder(file) {
        console.log(file)
		let author = this.author();
        let shape = this.input_shape();
        var formdata = new FormData();
        formdata.append("file", file);
        var parma = {
            type: 'input_data_base64',
            author: author,
            shape: shape,
        }; 	
		console.log('PPP '+JSON.stringify(parma))
		formdata.append("json", new Blob([JSON.stringify(parma)], { type: "application/json" }));
 	    for (var pair of formdata.entries()){
		    console.log(pair[0] + ',' +pair[1])	
		}
		
		let response = await axios.post(this._debug_url_prefix + '/txion', formdata, { emulateJSON: true });
		console.log('res:'+response)
		console.log(response.data)
		const convertedData = atob(response.data.data);
        console.log('atob:'+convertedData)
		let bytes = new Array(convertedData.length);
        for (var i = 0; i < convertedData.length; ++i) {
          var code = convertedData.charCodeAt(i);
          bytes[i] = code;
        }
		let buf = Buffer.from(bytes)
		buf.name = 'data'
		console.log(buf, buf.length)
		return buf
    }
    async upload_model(files, data, infohash) {
        if (window && !window.enable_model_upload) return null;
		console.log("Upload Model");
        const author = this.author();
        const formdata = new FormData();
        formdata.append("params_file", files[0]);
        formdata.append("json_file", files[1]);
		formdata.append("torrent_file", new Blob([data]));
        const parma = {
            type: 'model_data',
            author: author,
            infohash: infohash
        };
        formdata.append("json", new Blob([JSON.stringify(parma)], { type: "application/json" }));
	console.log("start txion");
		const response = await axios.post(this._debug_url_prefix + '/txion', formdata, { emulateJSON: true });
	console.log("stop txion");
        return response;
    }
    async upload(torrent) {
        const author = this.author();
        const formdata = new FormData();
        const parma = {
            type: 'input_data_step2',
            author: author,
            infohash: torrent.infohash,
        };
        formdata.append("json", new Blob([JSON.stringify(parma)], { type: "application/json" }));
        formdata.append("torrent", new Blob([torrent.torrent]));
		const response = await axios.post(this._debug_url_prefix + '/txion', formdata, { emulateJSON: true });
        return response;
    }
    async encode_upload(file, comment = "") {
		console.log(file)
        let buf = await this.encoder(file)
		console.log(buf)
        let torrent = await this.create_torrent(buf, { comment: comment, announceList: [ this.trackers() ]});
        let res = await this.upload(torrent);
        return [torrent,res];
    }

	async getBlockNumber() {
		var result = await axios.get(this._debug_url_prefix + '/mysql?type=blockNumber');
		return result.data.blockNumber;
	}

	parseInferLabel(label) {
		if (label == undefined) return 'Not Avaiable'

		let decimal = parseInt(label)
		if (!isNaN(decimal)) return decimal

		var hex = label //force conversion
		var str = ''
		for (var i = 0; i < hex.length; i += 2)
			str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
		str = str.replace(/[^\x20-\x7E]/g, '')

		if (str != '') return str

		return 'Non Avaiable'
	}

	sync_record_input(object) {
		let items = object.inputs;
		let start = object.currentInputPage * 20;

		let params = {
			params: {
				type: "inputs",
				begin: start,
				end: start + 20,
			}
		}

		axios.get(this._debug_url_prefix + '/mysql', params)
			.then(function(response){
			let inputs = response.data.result;
			items.splice(0, items.length);
			for (let input of inputs) {
				items.push({
					size: input.meta.rawSize,
					timestamp: input.timestamp,
					blockNumber: input.blockNumber,
					from: input.meta.address,
					shape: input.meta.shape,
					description: input.tag || "None",
					contractAddress: input.id,
					upload: parseInt(input.meta.upload),
					infoHash: input.meta.hash,
					uploadTxs: [],
					uri: input.meta.uri,
					_showDetails: false,
				})
			}

			object.input_len = response.data.length
			object.input_page_len = Math.floor(object.input_len / 20) + 1
		})
	}

    sync_record_model(object) {
		let items = object.models;
		let start = object.currentModelPage * 20;

		var params =  {
			params: {
				type: "modules",
				begin: start,
				end: start + 20,
			}
		};

		axios.get(this._debug_url_prefix + '/mysql', params)
			.then(function(response){
			let models = response.data.result;
			items.splice(0, items.length);
			for (let model of models) {
				items.push({
					size: model.meta.rawSize,
					timestamp: model.timestamp,
					blockNumber: model.blockNumber,
					from: model.meta.address,
					shape: model.meta.inputShape,
					description: model.tag || "None",
					contractAddress: model.id,
					upload: parseInt(model.meta.upload),
					infoHash: model.meta.hash,
					uploadTxs: [],
					uri: model.meta.uri,
					_showDetails: false,
				});
			}
			object.model_len = response.data.length;
			object.model_page_len = Math.floor(object.model_len / 20) + 1;
		});
    }

    async push_data(payload, price) {
        price = price || 0;
        let tx = {
            to: null,
            from: this.author(),
            gasPrice: 18,
            gas: 210000,
            value: price,
            data: payload
        };
        // tx.gasPrice = await this.web3.eth.getGasPrice();
        tx.gasPrice = '0x' + parseInt(tx.gasPrice).toString(16);
        console.log(tx);
        try {
            tx.gas = await this.web3.eth.estimateGas({ data: payload });
        } catch(err) {
			checkAndExit(err, this.web3)
		}
        const receipt = await this.send_transaction(tx);
        console.log(typeof  receipt,receipt);
        return receipt;
    }
	async updateTag(infoHash, tag) {
		console.log("Update Tag: " + infoHash + tag);
		let payload = {
			params: {
				type: 'updateTag',
				infoHash: '0x' + infoHash,
				tag: tag
			}
		};

		return await axios.get(this._debug_url_prefix + '/mysql', payload)
	}

	async gasPrice(_) {
        try {
            return await this.web3.eth.getGasPrice();
        } catch(err) {
			checkAndExit(err, this.web3)
		}
	}

	async upload_progress(gasPrice) {
		const tx = {
			from: this.sender(),
			to: this.receiver(),
			gas: 270000,
			gasPrice: gasPrice,
			value: 0,
		}
		this.send_transaction(tx);
	}

    async transfer(value) {
        const tx = {
            from: this.sender(),
            to: this.receiver(),
            gas: "0x76c00",
            gasPrice: "0x9184e72a000",
            value: value,
        };
        tx.gasPrice = await this.web3.eth.gasPrice;
        try {
            tx.gas = await this.web3.eth.estimateGas({ data: "" });
        } catch(err) {
			checkAndExit(err, this.web3)
		}
        const receipt = await this.send_transaction(tx);
        return receipt;
    }
}

export default CortexUtils;
