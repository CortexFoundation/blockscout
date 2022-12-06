<template>
  <div class="call-form">
    <div class='front-screen slidepad'>
       <div class='container-fluid'>
          <h1 class='front-screen-title'>Inference</h1>
       </div>
    </div>
	<div class='modal' v-if='advanced_settings'>
		<div @click.prevent="dialog_show" id="modal-background" style="position: fixed; display: block; top: 0px; width: 100%; height: 100%" />
		<div class="container">
		    <div class='modal-content col-sm-10 col-sm-offset-1'>
		        <div class="row">
		            <button class="close" style="float: right;margin-right: 15px;outline: none" @click.prevent="dialog_show"> x </button>
		            <div class="col-sm-6">
		                <div class="row">
		                    <div class="col-sm-6">
		                        <label style="cursor: pointer">
		                            <input type="radio" v-model='CallType' value="0"> &nbsp Test Call (No Fee)
		                        </label>
		                    </div>
		                    <div class="col-sm-6">
		                        <label style="cursor: pointer">
		                            <input type="radio" v-model='CallType' value="1"> &nbsp Send Transaction
		                        </label>
		                    </div>
		                </div>
		            </div>
		            <div class="col-sm-12">
                        <h5 style="font-size: 16px;margin-top: 20px">Your Configuration</h5>
                        <p>Call Type : {{CallType}}</p>
                        <p>Sender Address</p>
                        <input type="text" class="form-control" v-model="form.sender" readonly style="background: transparent">
                        <br>
                        <p>CINC Contract Address</p>
                        <input type="text" class="form-control" v-model="form.contract" readonly style="background: transparent">
                        <br>
                        <p>Contract Code</p>
                        <div style="height: 520px;overflow: auto;border: 1px solid #ccc;border-radius: 3px">
                            <pre style="border: none">
pragma solidity ^0.4.18;
contract Owned {
    function owned() public { owner = msg.sender; }
    address owner;

    modifier onlyOwner {
        require(
                msg.sender == owner,
                "Only owner can call this function."
               );
        _;
    }
}

interface ImagenetLabel {
    function name(uint256 id) external returns (string);  
}

contract AIContract is Owned {
    
    event Infer (
        address indexed caller,
        address indexed model,
        address indexed data,
        uint256 result
    );
    
    address label_;
    
    function setImageLabel(address label) public {
        label_ = label;
    }
    
    function makeInfer(address model, address input) public returns(uint256) {
	    uint256[] memory ret = new uint256[](1);
	    uint256 tmp;
	    infer(model, input, ret);
	    tmp = ret[0];
	    emit Infer(msg.sender, model, input, tmp);
	    return ret[0];
	}

    function resolveName(uint256 id) private view returns (string){
        return ImagenetLabel(label_).name(id);
    }
    
}
                            </pre>
                        </div>
                    </div>
		        </div>
            </div>
		</div>
	</div>
    <div class="slidepad content-box" style="position: relative">
    <div class='container-fluid'>
      <b-row class="row2">
        <h2 style="padding: 0 15px">
		Model
		<a @click='dialog_show' style='float:right;font-size: 14px;cursor: pointer;text-decoration: none'>Configuration</a>
		</h2>
        <b-col sm="6">
          <input type="text" id="modelInput" class="form-control" v-model="form.model_addr" placeholder="Enter model data address" autocomplete="off">
        </b-col>
        <b-col sm="6">
          <button class="btn shape-button">Shape: <span>{{model_shape}}</span></button>
          <button class="btn model-btn btn-all" style="margin-left: 30px" @click="model_next"> Next </button>
        </b-col>
        <b-col sm="12" class="model-data">
          <div class="table-responsive">
              <table class="table table-striped">
              <thead>
                <tr>
                    <th> Block # </th>
                    <th> File Size (bytes)</th>
                    <th> Address </th>
					<th> Upload Progress </th>
                    <th> Description </th>
                    <th> Shape </th>
                    <th> Action </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="model in models">
                  <td><a :href="`/block/${model.blockNumber}`"> {{model.blockNumber}} </a></td>
                  <td> {{model.size}} </td>
                  <td><a :href="`/address/${model.contractAddress}`"> {{model.contractAddress}} </a></td>
				  <td>
				    <b-progress :max="model.size" class="col-xs-4">
                        <b-progress-bar :value="model.size - model.upload"></b-progress-bar>
                    </b-progress>&nbsp;
                    {{((model.size - model.upload)/model.size*100).toFixed(1)+" %"}}
				  </td>
                  <td> {{model.description}} </td>
                  <td> {{model.shape}} </td>
                  <td> <button class="btn btn-all" @click="choose_model(model.contractAddress, model.shape)"> Choose </button></td>
                </tr>
              </tbody>
              </table>
              <div class="pages" style="" v-on="utils">
                    <span class="row">
                        <a class='btn btn-sm btn-default' @click="model_jump_first()"><span class="glyphicon glyphicon-fast-backward"></span></a>
                        <a class='btn btn-sm btn-default' @click="model_jump_previous()"><span class="glyphicon glyphicon-step-backward"></span></a>
                        <a class="btn btn-sm btn-default">
                           Page
                           <input class="pages-input" :value='currentModelPage +1' size="4" id='modeljumpPage' @keyup.enter="model_jump_spec" type='text'>
                           of &nbsp; {{ model_page_len }}
                        </a>
                        <a class="btn btn-sm btn-default" @click="model_jump_next()"><span class="glyphicon glyphicon-step-forward"></span></a>
                        <a class="btn btn-sm btn-default" @click="model_jump_last()"><span class="glyphicon glyphicon-fast-forward"></span></a>
                    </span>
              </div>
          </div>
        </b-col>
      </b-row>
      <b-row class="row2" v-if="show_inputs">
        <h2 style="padding: 0 15px">Data</h2>
        <b-col sm="6">
          <input type="text" id="dataInput" class="form-control" v-model="form.input_addr" placeholder="Enter input data address" autocomplete="off">
        </b-col>
        <b-col sm="6">
          <button class="btn shape-button">Shape: <span>{{input_shape}}</span></button>
          <button class="btn btn-all input-btn" style="margin-left: 30px" @click="input_next"> Next </button>
        </b-col>
        <b-col sm="12" class="input-data">
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
              <tr>
                  <th> Block # </th>
                  <th> File Size (bytes)</th>
                  <th> Address </th>
				  <th> Upload Progress </th>
                  <th> Description </th>
                  <th> Shape </th>
                  <th> Action </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="input in inputs">
                <td><a :href="`/block/${input.blockNumber}`"> {{input.blockNumber}} </a></td>
                <td> {{input.size}} </td>
                <td><a :href="`/address/${input.contractAddress}`"> {{input.contractAddress}} </a></td>
				<td>
				    <b-progress :max="input.size" class="col-xs-4">
                        <b-progress-bar :value="input.size - input.upload"></b-progress-bar>
                    </b-progress>&nbsp;
                    {{((input.size - input.upload)/input.size*100).toFixed(1)+" %"}}
				</td>
                <td> {{input.description}} </td>
                <td> {{input.shape}} </td>
                <td> <button class="btn btn-all" @click="choose_input(input.contractAddress, input.shape)"> Choose </button></td>
              </tr>
            </tbody>
            </table>
            <div class="pages" style="" v-on="utils">
                <span class="row">
                    <a class='btn btn-sm btn-default' @click="input_jump_first()"><span class="glyphicon glyphicon-fast-backward"></span></a>
                    <a class='btn btn-sm btn-default' @click="input_jump_previous()"><span class="glyphicon glyphicon-step-backward"></span></a>
                    <a class="btn btn-sm btn-default">
                       Page
                       <input class="pages-input" :value='currentInputPage +1' size="4" id='inputjumpPage' @keyup.enter="input_jump_spec" type='text'>
                       of &nbsp; {{ input_page_len }}
                    </a>
                    <a class="btn btn-sm btn-default" @click="input_jump_next()"><span class="glyphicon glyphicon-step-forward"></span></a>
                    <a class="btn btn-sm btn-default" @click="input_jump_last()"><span class="glyphicon glyphicon-fast-forward"></span></a>
                </span>
          </div>
          </div>
        </b-col>
      </b-row>
      <div style="margin-top: 40px;text-align: center" v-if="show_call">
        <b-button @click="onSubmit()" class="btn btn-all" style="margin-right: 30px">Call</b-button>
        <b-button @click="onReset()" class="btn btn-all btn-all-red">Reset</b-button>
      </div>
    <div>
        <h2>Results</h2>
        <div class="table-responsive">
            <b-table :items='output_data' :fields='fields' class="table-striped"></b-table>
        </div>
    </div>
  </div>
  <div v-if="showWallet">
      <div style="position: fixed;top: 0;bottom: 0;left: 0;right: 0;background: rgba(0,0,0,0.4)"></div>
          <div class="wallet">
              <h2 style="margin-top: 10px;margin-bottom: 30px">Tips</h2>
              <h4 style="font-size: 16px">Please make sure you have <a href="https://github.com/CortexFoundation/Cortex_Release">installed</a> and logged in to our CortexWallet!</h4>
          </div>
  </div>
<div v-if="showModal" class="messageModal">
            <div style="position: fixed;top: 0;bottom: 0;left: 0;right: 0;background: rgba(0,0,0,0.4);z-index: 1000;"></div>
            <div class="wallet"  style="top: 30%;z-index: 1100;">
                <h2 style="margin-top: 10px;margin-bottom: 30px">Tips</h2>
                <h4 style="font-size: 16px" >{{modalMessage}}</h4>
                <b-button v-bind:disabled="!canbeclose" @click="showModal = false" class="btn btn-all" style="margin-right: 30px">Close</b-button>
            </div>
</div>
</div>
<div class="modal fade in" v-if="showCanvas" style="font-family: Times New Roman;"> 
  <div class="modal-dialog" style="width:900px;">
  <div class="modal-content" style="background-color: rgba(255,255,255,.9);">
            <div class="modal-header" style="border-bottom: 0px solid #e5e5e5;padding: 0px;">
                <button type="button" class="close"  @click="showCanvas = false"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
            </div>
  <div class="modal-body" style="text-align: center">
    <svg id="neuron-network" style="height: 304px;">
        <g id="canvas">
            <g id="input">
                <g class="content" transform="scale(0.1)">
                    <g>
                        <path style="fill:#78B9EB;" d="M211.991,380l52,52h80v-56l-64-64L211.991,380z" />
                        <path style="fill:#78B9EB;" d="M263.991,432l-52-52l-28-28l-64,64v16h40H263.991z" />
                        <circle style="fill:#78B9EB;" cx="207.991" cy="304" r="16" />
                    </g>
                    <g>
                        <path style="fill:#1E81CE;" d="M396.791,139.784C381.287,70.867,312.85,27.567,243.933,43.071
                                c-34.888,7.849-64.896,29.944-82.75,60.928h-1.192c-50.189,0.125-93.158,36.006-102.232,85.368
                                c-45.636,16.715-69.082,67.26-52.367,112.897C18.089,336.93,51.073,359.986,87.991,360h8v-16h-8
                                c-39.765-0.004-71.997-32.242-71.993-72.007c0.003-31.748,20.8-59.746,51.193-68.921c3.003-0.915,5.193-3.503,5.6-6.616
                                c5.841-43.714,43.097-76.38,87.2-76.456c1.256,0,2.488,0.088,3.72,0.168l1.6,0.104c3.145,0.223,6.118-1.456,7.552-4.264
                                c28.665-54.758,96.293-75.911,151.051-47.246c30.533,15.983,51.998,45.143,58.189,79.046c0.575,3.189,3.017,5.716,6.184,6.4
                                c51.8,11.305,84.627,62.462,73.322,114.262c-9.609,44.03-48.552,75.448-93.618,75.53v16
                                c61.856-0.037,111.97-50.211,111.933-112.067C479.894,197.219,445.791,152.854,396.791,139.784z" />
                        <path style="fill:#1E81CE;" d="M343.991,248h-224c-4.418,0-8,3.582-8,8v176c0,4.418,3.582,8,8,8h224c4.418,0,8-3.582,8-8V256
                                C351.991,251.581,348.41,248,343.991,248z M335.991,264v92.688l-50.344-50.344c-3.124-3.123-8.188-3.123-11.312,0l-62.344,62.344
                                l-22.344-22.344c-3.124-3.123-8.188-3.123-11.312,0l-50.344,50.344V264H335.991z M159.991,424h-32v-4.688l56-56L244.679,424
                                H159.991z M335.991,424h-68.688l-44-44l56.688-56.688l56,56V424z" />
                        <path style="fill:#1E81CE;" d="M207.991,328c13.255,0,24-10.745,24-24s-10.745-24-24-24s-24,10.745-24,24S194.736,328,207.991,328z
                                    M207.991,296c4.418,0,8,3.582,8,8s-3.582,8-8,8s-8-3.582-8-8S203.573,296,207.991,296z" />
                    </g>
                </g>
            </g>
            <g class="network">
                <g id="loading" opacity="0">
                    <rect height="10" fill="#fcb711" x="15" width="10">
                        <animate attributeName="opacity" calcMode="spline" values="1;0.2;1" keyTimes="0;0.5;1" dur="1"
                            keySplines="0.5 0 0.5 1;0.5 0 0.5 1" begin="-0.6s" repeatCount="indefinite">
                        </animate>
                    </rect>
                    <rect height="10" fill="#f37021" x="35" width="10">
                        <animate attributeName="opacity" calcMode="spline" values="1;0.2;1" keyTimes="0;0.5;1" dur="1"
                            keySplines="0.5 0 0.5 1;0.5 0 0.5 1" begin="-0.4s" repeatCount="indefinite">
                        </animate>
                    </rect>
                    <rect height="10" fill="#cc004c" x="55" width="10">
                        <animate attributeName="opacity" calcMode="spline" values="1;0.2;1" keyTimes="0;0.5;1" dur="1"
                            keySplines="0.5 0 0.5 1;0.5 0 0.5 1" begin="-0.2s" repeatCount="indefinite">
                        </animate>
                    </rect>
                    <rect height="10" fill="#6460aa" x="75" width="10">
                        <animate attributeName="opacity" calcMode="spline" values="1;0.2;1" keyTimes="0;0.5;1" dur="1"
                            keySplines="0.5 0 0.5 1;0.5 0 0.5 1" begin="0s" repeatCount="indefinite">
                        </animate>
                    </rect>
                </g>
            </g>
        </g>
    </svg>
  </div>
  </div>
  </div>
</div>
</div>
</template>
<script>
import * as RLP from "rlp";
import { Buffer } from "safe-buffer";
import { promisify } from "es6-promisify";
import bus from "@/components/bus";
import CortexUtils from "../../../testutils/src/utils.js"
import CINC from "../../../testutils/src/CInC.js"
import chainConf from "../../../blockchain.settings.js"

let defaultAccount, defaultModelAddr
let defaultContract = chainConf.CINCAddress;

export default {
  name: "CallContractView",
  data() {
    return {
      result: null,
	  /*
	   * CallType: 
	   *	0: Test call without send transaction
	   *	1: Send Transaction
	   */
	  CallType: 1,
	  advanced_settings: false,
	  showWallet: false,
      showModal: false,
      canbeclose: false,
      modalMessage:'',
      showCanvas:false,
      ifconfirmed: false,
      showsuccess: false,
	  utils: new CortexUtils(),
      input_data: [],
      model_data: [],
      output_data: [],
	  fields: [
		{
			label: "Model Address / Input Address",
			key: "result"
		},
		{
			label: "Parsed Result",
			key: "parse"
		},
		{
            label: "Status",
            key: "status"
        }
	  ],
      form: {
        sender: null,
        contract: null,
        model_addr: null,
        input_addr: null,
      },
      show: true,

      models: [],
      model_shape: [],
	  model_len: 0,
	  model_page_len: 0,
      currentModelPage: 0,

      show_inputs: false,
      inputs: [],
      input_shape: [],
	  input_len: 0,
	  input_page_len: 0,
      currentInputPage: 0,

      show_call: false,
    };
  },
  async mounted() {
    $('.loading').css('display', 'block');

    this.models = [];
    this.inputs = [];
    this.utils.sync_record_model(this);
    this.utils.sync_record_input(this);
    await this.utils.init(this);

	defaultAccount = this.utils.web3.eth.defaultAccount;
	defaultModelAddr = '';

	this.form.contract = defaultContract;
	this.form.sender = defaultAccount;
	this.form.model_addr = defaultModelAddr;

    $('.loading').fadeOut(500);
  },
  methods: {
	async dialog_show() {
		this.advanced_settings = !this.advanced_settings;
	},

	model_jump_spec($event) {
		this.utils.sync_record_model(this);
	},
	model_jump_first() {
		this.currentModelPage = 0;
		this.utils.sync_record_model(this);
	},
	model_jump_last() {
		this.currentModelPage = this.model_page_len - 1;
		this.utils.sync_record_model(this);
	},
	model_jump_previous() {
		if (this.currentModelPage > 0) this.currentModelPage --;
		this.utils.sync_record_model(this);
	},
	model_jump_next() {
		if (this.currentModelPage + 1 < this.model_page_len) this.currentModelPage ++;
		this.utils.sync_record_model(this);
	},

	input_jump_spec($event) {
		this.utils.sync_record_input(this);
	},
	input_jump_first() {
		this.currentInputPage = 0;
		this.utils.sync_record_input(this);
	},
	input_jump_last() {
		this.currentInputPage = this.input_page_len - 1;
		this.utils.sync_record_input(this);
	},
	input_jump_previous() {
		if (this.currentInputPage > 0) this.currentInputPage --;
		this.utils.sync_record_input(this);
	},
	input_jump_next() {
		if (this.currentInputPage + 1 < this.input_page_len) this.currentInputPage ++;
		this.utils.sync_record_input(this);
	},

	async testCall() {
		const payload = this.utils.web3.sha3('makeInfer(address,address)').slice(0, 10) + 
			'000000000000000000000000' + this.form.model_addr.slice(2) + 
			'000000000000000000000000' + this.form.input_addr.slice(2);


		let result = await this.utils.call_async({
			from: this.utils.web3.eth.defaultAccount,
			to: this.form.contract,
			data: payload
		});
		let res = this.utils.parseInferLabel(result);
		if(this.form.model_addr == "0xb768befa445ff688f55440a2dbc93fbe14a6e1a0"){
		    if(res == 0){
		        res = "cat";
		    }else if(res == 1){
		        res = "dog";
		    }
		}
		this.output_data.splice(0, 0, {result:  this.form.model_addr + ' / ' + this.form.input_addr, parse: result.slice(0,10), status: 'success'})
	},

	async makeInfer() {
	    this.showModal = true;
	    this.canbeclose = false;
		this.ifconfirmed = false;
		this.showsuccess = false;
	    this.modalMessage = "Creating Payload.";
		const payload = this.utils.web3.sha3('makeInfer(address,address)').slice(0, 10) +
			'000000000000000000000000' + this.form.model_addr.slice(2) +
			'000000000000000000000000' + this.form.input_addr.slice(2);
	    this.modalMessage = "Creating Transaction.";
		let transaction = {
			to: this.form.contract,
			from: this.utils.web3.eth.defaultAccount,
			gasPrice: 1000000000,
			gas: 7800000,
			value: 0,
			data: payload
		};
//		transaction.gasPrice = parseInt(await this.utils.web3.eth.getGasPrice());
		try {
		    this.modalMessage = "Estimating Endorphin.";
//			transaction.gas = await this.utils.web3.eth.estimateGas({ data: payload, to: this.form.contract});
		}
		catch (err) {
		    this.modalMessage = "Error While Estimate Endorphin .\n" + err;
		    this.canbeclose = true;
			return
		}
        let showres = {result: 'Please wait for the result, till the transaction is packed by the miner.', parse: 'None', status: 'waiting'};
        this.output_data.splice(0, 0, {result: 'Please wait for the result, till the transaction is packed by the miner.', parse: 'None', status: 'waiting'});
		let error, hash, receipt;
		let adds = {};
		try {
		    this.modalMessage = "Please Send Transaction.";
			hash = await this.utils.send_transaction_async(transaction)
			adds[hash] = {
				model_addr: this.form.model_addr,
				input_addr: this.form.input_addr
			};
			this.modalMessage = "Confirming."
			let tx = await this.utils.web3.eth.getTransaction(hash, (e, g)=>{
                    console.log(e, g)
					})
			receipt = await this.utils.wait_receipt(hash);
			setTimeout(() =>{
							this.showModal = false;
							this.showCanvas = true;
							setTimeout(() =>{
								createNeuronNetwork("neuron-network");
					setTimeout(() =>{
						if(this.ifconfirmed){
							for (var i = 0; i < this.output_data.length; ++i) {
								if (this.output_data[i].status && this.output_data[i].status == 'waiting')
								{
									this.output_data.splice(i, 1)
									break;
								}
							}
							this.output_data.splice(0, 0, showres);
							this.showCanvas = false;
						}
					   this.showsuccess = true;
					},1000 * 12 )
							},100)
				},2000);
		} catch (err) {
			error = err
		}
//		this.showCanvas = false;

		if (error != undefined) {
			this.modalMessage = "Error While Send Transaction.\n" + error;
			this.canbeclose = true;
			this.showCanvas = false;
	    		this.showModal = true;
			return
		}

		if (receipt == undefined) {
		    this.modalMessage = 'Result is refreshed, may you query infer result by transaction hash: \n' + hash;
			this.canbeclose = true;
			this.showCanvas = false;
			this.showModal = true;
			return
		}
        
		let logParse = {parse: [], left: []}
		await CINC.parseCInCLogs(receipt.logs, 
				logParse, 
				function(err, res){
		});
	//	console.log(receipt)
     // let result = logParse.parse[0].label;
	// 	let res = this.utils.parseInferLabel(result);
	    let res 
		if(	receipt.logs[0] === undefined )
			res = 'model/data not exist'
		else {
            res = receipt.logs[0].data
		}
    // 	console.log('res', res)
		showres.result = adds[receipt.transactionHash] ? adds[receipt.transactionHash].model_addr + ' / ' + adds[receipt.transactionHash].input_addr : "Unknow / Unknow";
		showres.parse = res 
		showres.status = "success";
		this.ifconfirmed = true;
        if(this.showsuccess){
                        		for (var i = 0; i < this.output_data.length; ++i) {
                        			if (this.output_data[i].status && this.output_data[i].status == 'waiting')
                        			{
                        				this.output_data.splice(i, 1)
                        				break;
                        			}
                        		}
            this.output_data.splice(0, 0, showres);
            this.showCanvas = false;
        }
		this.showModal = false;

	},

    async onSubmit() {
//        alert('Your request has been sent, please wait.');
		if (this.CallType == 0) await this.testCall()
		else await this.makeInfer()
    },
    onReset () {
	  this.show_inputs = false
	  this.show_call = false
	  this.form.contract = defaultContract;
	  this.form.model_addr = defaultModelAddr;
	  this.model_shape = [];
	  $('.model-btn').fadeIn('fast')
	  $('.model-data').css('display', 'block');
	  this.form.input_addr = '';
	  this.input_shape = [];
	  $('.input-btn').fadeIn('fast')
	  $('.input-data').css('display', 'block');
      this.show = false;
      this.show_inputs = false;
      this.show_call = false;
      this.$nextTick(() => { this.show = true });
    },
    pageReload() {
      window.location.reload();
    },
    choose_model(addr, shape) {
        this.form.model_addr = addr;
        this.model_shape = shape
    },
    choose_input(addr, shape) {
        this.form.input_addr = addr;
        this.input_shape = shape
    },
    model_next() {
        let n = 0;
        for (let i in this.models){
            if(this.form.model_addr == this.models[i].contractAddress){
                n++;
            }
        }
        if(n == 0){
            alert('Model not available!');
        }else{
            this.show_inputs = true;
            $(".model-data").slideUp('slow');
            $('.model-btn').fadeOut('slow')
        }
    },
    input_next() {
        let n = 0;
        for (let i in this.inputs){
            if(this.form.input_addr == this.inputs[i].contractAddress){
                n++;
            }
        }
        if(n == 0){
            alert('Data not available!');
        }else{
            if(this.model_shape.join('') == this.input_shape.join('')){
                this.show_call = true;
                $(".input-data").slideUp('slow');
                $('.input-btn').fadeOut('slow')
            }else{
                alert('Shape Not Matching!')
            }
        }
    },
  }
};
function createNeuronNetwork(id, display_width, display_height) {
        display_height = display_height || 400;
//        display_width = display_width || 600;
        const width = 808;
        const colors = [
            d3.schemePaired[1], d3.schemePaired[3], d3.schemePaired[5], d3.schemePaired[7], d3.schemePaired[9], d3.schemePaired[11],
            d3.schemePaired[0], d3.schemePaired[2], d3.schemePaired[4], d3.schemePaired[6], d3.schemePaired[8], d3.schemePaired[10],
        ];
        const height = 800;
        const padding = 100;
        const input_padding = 100;
        const animation_duration = 500;
        const animation_delay = 200;
        const calc_cycle = 20;
        const margin_horizontal = 100;
        const margin_vertical = 40;
        const circle_radius = 10;
        const layer_info = [6, 6, 8, 0, 6, 6, 2];
        const svg = d3.select("#" + id);
        const dom = document.getElementById(id);
        svg.attr("width", width)
            .attr("height", height);
//        dom.style.height = display_height;
//        dom.style.width = display_width;

        const layers = generateLayers(layer_info);
        let nodes = [].concat(...layers);
        nodes.forEach((d, i) => {
            d.rank = i;
        });

        let calc_padding = null;

        for (let i = 0, j = 0; i < nodes.length; ++i, ++j) {
            if (i > 0 && nodes[i].layer > nodes[i - 1].layer + 1) {
                calc_padding = {
                    rank: nodes[i - 1].rank + 1,
                    layer: nodes[i - 1].layer + 1,
                    index: 0,
                    index_offset: (nodes[i - 1].index_offset + nodes[i - 1].index) / 2 + 1,
                };
                j += calc_cycle;
            }
            nodes[i].rank = j;
        }

        const links = [];
        for (let i = 0; i < layers.length - 1; ++i) {
            for (let x of layers[i]) {
                for (let y of layers[i + 1]) {
                    links.push({
                        from: x,
                        to: y,
                    });
                }
            }
        }

        const neuron_g = svg.select("g#canvas")
            .attr("transform", `translate(50,12)`);

        const neuron_input = neuron_g.select("#input")
            .attr("transform", `translate(${-50},${120})`);

        for (let node of layers[0]) {
            neuron_g.append("path")
                .attr("d", lineFunction(0, 145, input_padding - circle_radius / 2, (node.index + node.index_offset) * margin_vertical))
                .attr("stroke", "#78B9EB")
                .attr("stroke-width", 0.5)
                .attr("fill", "none")
                .attr("opacity", 0.8);
        }

        const neuronnetwork_g = neuron_g.select("g.network")
            .attr("transform", `translate(${input_padding},${0})`);

        const neuron_link = neuronnetwork_g.selectAll(".link")
            .data(links).enter()
            .append("g")
            .attr("class", "link");

        const neuron = neuronnetwork_g.selectAll(".node")
            .data(nodes).enter()
            .append("g")
            .attr("class", "node")
            .attr("opacity", 0.9)
            .attr("transform", d => `translate(${d.layer * margin_horizontal},${(d.index + d.index_offset) * margin_vertical})`);

        const neuron_line = neuron_link.append("line")
            .attr("x1", d => d.from.layer * margin_horizontal)
            .attr("y1", d => (d.from.index + d.from.index_offset) * margin_vertical)
            .attr("x2", d => d.to.layer * margin_horizontal)
            .attr("y2", d => (d.to.index + d.to.index_offset) * margin_vertical)
            .attr("opacity", d => 0.05)
            .attr("stroke", d => colors[d.from.layer]);

        const neuron_circle = neuron.append("circle")
            .attr("r", circle_radius)
            .attr("fill", d => "white")
            .attr("stroke", d => colors[d.layer])
            .attr("stroke-width", 2)
            .attr("opacity", 0.3);

        const neuron_text = neuron.append("text")
            .text(d => "0")
            .attr("dx", -circle_radius * 0.5 + 1)
            .attr("dy", circle_radius * 0.5)
            .attr("font-size", "16px")
            .attr("fill", d => "white");

        let neuron_calc;

        let result_node;

        for (let i = nodes.length - 1; i >= 0; --i) {
            if (nodes[i].value > 0.5) {
                result_node = nodes[i];
                break;
            }
        }

        const neuron_result = neuronnetwork_g.append("g")
            .attr("transform", `translate(${result_node.layer * margin_horizontal},${(result_node.index + result_node.index_offset) * margin_vertical})`)
            .attr("opacity", 0);

        neuron_result.append("circle")
            .attr("x", -circle_radius * 0.3)
            .attr("y", -circle_radius * 0.3)
            .attr("r", circle_radius * 1.3)
            .attr("stroke", "gray")
            .attr("stroke-width", 2)
            .attr("fill", "none");

        neuron_result.append("text")
            .attr("dx", circle_radius * 2)
            .attr("dy", circle_radius * 0.5)
            .text("result")
            .attr("font-size", "16px")
            .attr("fill", d => "gray");

        if (calc_padding) {
            let loading_g = svg.select("#loading");
            loading_g.selectAll("rect")
                .attr("fill", colors[calc_padding.layer]);

            neuron_calc = loading_g
                .attr("transform", `translate(
                    ${(calc_padding.layer - 0.5) * margin_horizontal},
                    ${(calc_padding.index_offset - 1) * margin_vertical}
                )`)
                .transition()
                .delay(calc_padding.rank * animation_delay)
                .duration(animation_duration)
                .attr("opacity", 1);
        }

        neuron_line
            .transition()
            .delay(d => d.to.rank * animation_delay)
            .duration(animation_duration)
            .attr("opacity", d => d.from.value * d.to.value * 0.9 + 0.05);

        neuron_circle
            .transition()
            .delay(d => d.rank * animation_delay)
            .duration(animation_duration)
            .attr("fill", d => d.value > 0.5 ? colors[d.layer] : "white")
            .attr("opacity", 1);

        neuron_text
            .transition()
            .delay(d => d.rank * animation_delay)
            .duration(animation_duration)
            .text(d => d.value > 0.5 ? "1" : "0")
            .attr("fill", d => d.value > 0.5 ? "white" : colors[d.layer]);

        neuron_result
            .transition()
            .delay(d => (result_node.rank + 1) * animation_delay)
            .duration(animation_duration)
            .attr("opacity", 1);
    }

    function generateLayers(layer_info) {
        const max_node_num = Math.max(...layer_info);
        return layer_info.map((node_num, i) => {
            const nodes = [];
            const is_last_layer = layer_info.length == i + 1;
            let has_one = 0;
            for (let j = 0; j < node_num; ++j) {
                let item = {
                    value: Math.random(),
                    layer: i,
                    index: j,
                    index_offset: (max_node_num - node_num) / 2,
                };
                if (is_last_layer) {
                    if (has_one && item.value > 0.5) {
                        item.value *= 0.5;
                    } else if (!has_one && j == node_num - 1 && item.value <= 0.5) {
                        item.value += 0.5;
                    }
                    if (item.value > 0.5) has_one = 1;
                }
                nodes.push(item);
            }
            return nodes;
        });
    }

    
    function lineFunction(x1, y1, x2, y2) {
        return `M ${x1} ${y1}
            C${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2} ${y2}`;
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.transaction_table_item {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 300px;
}

.transaction_table.none {
  text-align: center;
  padding: 2em;
  color: #a0a0a0;
}
.round-card {
  padding: 10px;
  padding-left: 30px;
  padding-right: 30px;
  border-radius: 3px;
  background-color: #dbdbdb;
}
.bottom-round-card {
  border-radius: 0 0 30px 20px;
  box-shadow: 3px 3px 2px #f0f0f0;
  padding: 20px;
  border: 1px solid #8f8f8f;
  margin: -5px;
}
.round-card, .bottom-round-card {
  margin-bottom: 10px;
  padding-left: 20px;
  padding-right: 20px;
}
.round-file-input, .custom-file-input {
  padding: 10px;
  border-radius: 3px;
  border: 0;
}
.b-table-details {
  background-color: #f00;
}
tr.b-table-details:hover {
    background-color: inherit !important;
}
tr.b-table-details > td {
  padding: 0 !important;
}
.upload-button {
  background-color: grey;
  color: white;
  border-radius: 3px;
  position: absolute;
  top: 0;
  right: 0;
}
.title-header {
  background-color: #112235;
  color: #fff;
}
.page-head {
  padding-top: 20px;
  min-height: 200px;
}
.row2 {
  margin-bottom: 20px;
}
.btn-grey {
  border-radius: 3px !important;
  background-color: #3469a3;
  color: #fff;
}
.btn{
  border-radius: 3px;
  outline: none !important;
}
.table-responsive{
  min-height: .01%;
  overflow-x: auto;

}
.model-data, .input-data{
  margin-top: 30px;
}
.model-data .table-responsive, .input-data .table-responsive{
  padding-top: 20px;
}
.shape-button {
  background-color: #6c757d;
  color: white;
  min-width: 7em;
  border-radius: 3px;
  cursor: default;
}
@media (min-width: 768px) {
    .eth-display {
      margin-top: 35px;
    }
    .front-screen-cells {
      margin-top: 40px;
    }
  .front-screen-desc {
    margin-top: 10px;
  }
  .big-screen-right {
    text-align: right;
  }
}
@media (max-width: 768px) {
  .front-screen-title {
    text-align: center;
  }
    .front-screen-cells {
      margin-top: 20px;
    }
    .page-group {
      margin-top: 20px;
    }
}

/* The Modal (background) */
.modal {
    display: block; /* Hidden by default */
    position: fixed; /* Stay in place */
    z-index: 1000; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: auto; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

/* Modal Content/Box */
.modal-content {
    color: #000;
    background-color: #fefefe;
	margin-top: 15%;
    padding: 30px;
}
.progress{
    padding: 0;
    margin-bottom: 0;
    width: 120px;
    border: 1px solid #ddd;
    box-shadow: none;
}
.progress-bar{
    background: #1a9cb5;
}
.form-control{
    box-shadow: none;
}
.wallet{
    position: fixed;
    max-width: 375px;
    width: 100%;
    top: 100px;
    left: 50%;
    margin-left: -187px;
    padding: 15px;
    color: #000;
    background: #fff;
    border-radius: 4px;
}
</style>
