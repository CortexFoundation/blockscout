<template>
  <div id="app">
    <footer class="g--12 no-margin-vertical">
      <div class="g--10 m--2">
        <h2> CTXC Test Tools </h2>
      </div>
    </footer>
    <div class="collapsible-wrap card no-pad">
      <input type="checkbox" id="collapsible-1">
      <label for="collapsible-1">1. Transfer</label>
      <div class="collapsible-1-area">
        <div style="display: flex;  align-items: flex-start;">
          <input type="text" class="m--1" style="width: 20em" required placeholder="Transfer to" v-model="transferTo"/>
          <input type="text" class="m--1" style="width: 20em" required placeholder="Value" v-model="transferValue"/>
          <button class="btn--primary m--1" @click="transfer(transferFrom, transferTo, transferValue)"> Transfer </button>
        </div>
      </div>
    </div>
    <div class="collapsible-wrap card no-pad">
      <input type="checkbox" id="collapsible-2">
      <label for="collapsible-2">2. Upload</label>
      <div class="collapsible-2-area">
        <div style="display: flex;  align-items: flex-start;">
          <button class="btn--flat" disabled>
            Type:
          </button>
          <button class="btn-flat btn-secondary margin-2" @click="isInputdata = !isInputdata">
            {{ isInputdata ? 'INPUT' : 'MODEL' }}
          </button>

          <button class="btn--flat margin-4" disabled>
            File1:
          </button>
          <input type="file" @change="file1 = $refs && $refs.fileinput1 && $refs.fileinput1.files[0]" ref="fileinput1" class="m--1" style="display: none" required/>
          <button @click="$refs.fileinput1.click()" class="btn--green margin-2">
            {{file1 ? file1.name : (isInputdata ? 'input file' : 'params file')}}
          </button>

          <button v-if="!isInputdata" class="btn--flat margin-4" disabled>
            File2:
          </button>
          <input v-if="!isInputdata" @change="file2 = $refs && $refs.fileinput2 && $refs.fileinput2.files[0]" type="file" ref="fileinput2" class="m--1" style="display: none"/>
          <button v-if="!isInputdata" @click="$refs.fileinput2.click()" class="btn--green margin-2">
            {{ file2 ? file2.name : 'json file' }}
          </button>
          <button class="btn--primary margin-8" @click="uploadFile()"> Save </button>
        </div>
        <div style="display: flex;  align-items: flex-start;">
          <button class="btn--flat" disabled>
            Shape:
          </button>
          <input type="text" class="" :value="shape" required placeholder="shape">
          <button class="btn--flat margin-2" disabled>
            Trackers:
          </button>
          <input type="text" class="" :value="trackers" readonly required placeholder="trackers">
          <button class="btn--primary margin-8" @click="sendFile()"> Send </button>
        </div>
        <div class="card">
          sdafdsaf
        </div>
      </div>
    </div>
    <div class="collapsible-wrap card no-pad">
      <input type="checkbox" id="collapsible-3">
      <label for="collapsible-3">3. Infohash</label>
      <div class="collapsible-3-area">
        <div style="display: flex;  align-items: flex-start;">
          <input multiple="multiple" type="file" ref="fileinput3" class="m--1" style="display: none" required/>
          <button @click="$refs.fileinput3.click()" class="btn--green m--1">
            SELECT IMAGES
          </button>
          <button class="btn--primary m--1" @click="getInfohash()"> RUN! </button>
        </div>
        <table class="g--8 card">
          <tr class="table-header">
            <td>Name</td>
            <td>Size</td>
            <td>Infohash</td>
          </tr>
          <tr v-for="file in files" :key="file.name">
            <td>{{ file.name }}</td>
            <td>{{ file.size }}</td>
            <td>{{ file.infohash }}</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="collapsible-wrap card no-pad">
      <input type="checkbox" id="collapsible-4">
      <label for="collapsible-4">4. Batch Upload</label>
      <div class="collapsible-4-area">
        <div style="display: flex;  align-items: flex-start;">
          <input multiple="multiple" type="file" ref="fileinput4" class="m--1" style="display: none" required/>
          <button @click="$refs.fileinput4.click()" class="btn--green m--1">
            SELECT IMAGES
          </button>
          <button class="btn--flat" disabled>
            Interval:
          </button>
          <input type="text" class="m--1" v-model="batchUoloadInterval" required/>
          <button class="btn--primary m--1" @click="batchUpload()"> RUN! </button>
        </div>
        <table class="g--8 card">
          <tr class="table-header">
            <td>Name</td>
            <td>Size</td>
            <td>Infohash</td>
          </tr>
          <tr v-for="(file, index) in files" :key="index">
            <td>{{ file.name }}</td>
            <td>{{ file.size }}</td>
            <td>{{ file.infohash }}</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="collapsible-wrap card no-pad">
      <input type="checkbox" id="collapsible-5">
      <label for="collapsible-5">5. Torrent Info</label>
      <div class="collapsible-5-area">
        <div style="display: flex;  align-items: flex-start;">
          <input type="file" ref="fileinput5" class="m--1" style="display: none" required/>
          <button @click="$refs.fileinput5.click()" class="btn--green m--1">
            SELECT TORRENT
          </button>
          <button class="btn--primary m--1" @click="parseTorrent()"> RUN! </button>
        </div>
        <div class="card" v-if="torrentInfo">
          {{ torrentInfo }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { saveAs } from "file-saver/FileSaver";
import { promisify } from "es6-promisify";
import { Buffer } from "safe-buffer";
import CortexUtils from "./utils.js";
import bencode from "bencode";

const utils = new CortexUtils();

export default {
  name: "App",
  components: {},
  data() {
    return {
      transferFrom: "0xc0d86d03f451e38c2ee0fa0daf5c8d6e2d1243d2",
      transferTo: "0x35f52e0a7a50608fc19c43ae31ca1846df8a8ef4",
      transferValue: "0x10000000000000",
      isInputdata: true, file1: null, file2: null,
      torrent: {
      },
      files: [],
      shape: '1,28,28',
      trackers: 'http://torrent.cortexlabs.ai:5008/announce',
      batchUoloadInterval: 10,
      torrentInfo: null,
    }
  },
  computed: {
    shapeVec() {
      return this.shape.split(',').map(s => parseInt(s, 10));
    },
    trackerVec() {
      return this.trackers.split(',');
    },
  },
  mounted() {
    utils.author(this.transferFrom)
        .input_shape([1, 28, 28])
        // .encoder_uri('http://192.168.5.11:5005/txion')
        .trackers(['http://torrent.cortexlabs.ai:5008/announce']);
  },
  methods: {
    parseTorrent() {
      if (!this.$refs.fileinput5) return null;
      const file = this.$refs.fileinput5.files[0];
      const fr = new FileReader();
      fr.readAsArrayBuffer(file);
      fr.onload = (ret) => {
        const buffer = ret.target.result;
        console.log(utils.create_infohash(buffer));
        // console.log(String.fromCharCode(...torrent.announce));
      }
      // bencode.decode($refs.fileinput5.files[0])
    },
    async transfer(from, to, value) {
      utils.sender(from).receiver(to).metamask_enabled(false);
      await utils.transfer(value);
    },
    async uploadFile() {
      utils.author(utils.web3.eth.defaultAccount);
      if (this.isInputdata) {
        const torrent = await utils.encode_upload(this.file1);
        const payload = await utils.create_input(torrent);
        const receipt = await utils.push_data(payload);
      } else {
        const torrent = await utils.create_torrent([this.file1, this.file2]);
        const payload = await utils.create_model(torrent);
        const receipt = await utils.push_data(payload);
      }
    },
    async batchUpload() {
      utils.metamask_enabled(false).save_torrent_enabled(false);
      const files = this.$refs.fileinput4.files;
      for (var i = 0; i < files.length; ++i) {
        await setTimeout(() => {}, this.batchUoloadInterval * 1000);
        const file = files[i];
        console.log('start upload', i);
        const torrent = await utils.encode_upload(file);
        console.log(torrent);
        const payload = await utils.create_input(torrent);
        console.log(payload);
        this.files.push({
          name: String.fromCharCode(...torrent.info.name),
          size: torrent.info.length,
          infohash: torrent.infohash
        });
        const receipt = await utils.push_data(payload);
        console.log(receipt);
      }
    },
    async getInfohash() {
      for (var i = 0; i < this.$refs.fileinput3.files.length; ++i) {
        const file = this.$refs.fileinput3.files[i];
        const torrent = await utils.create_torrent([file]);
        this.files.push({
          name: torrent.torrent.name,
          size: torrent.torrent.size,
          infohash: torrent.infohash
        });
      }
    }
  }
};
</script>

<style>
#app {
  width: 100%;
}

.margin-2 {
  margin-left: 2em;
}

.margin-4 {
  margin-left: 4em;
}

.margin-8 {
  margin-left: 8em;
}

.margin-40 {
  margin-left: 40em;
}

footer h1,
h2,
h3,
h4,
h5,
h6 {
  color: white;
}
</style>
