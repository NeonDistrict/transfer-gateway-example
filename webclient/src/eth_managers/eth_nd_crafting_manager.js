import Web3 from 'web3';

import items from '../example-nft-typeId';
import items2 from './../example-nft-typeId';
import items3 from './example-nft-typeId';
import items4 from '../../example-nft-typeId';

// var items = require('../example-nft-typeId');

export default class EthNDCraftingManager {
    static async createAsync(){
        const browserWeb3 = new Web3(window.web3.currentProvider);
        const networkId = await browserWeb3.eth.net.getId()
        const contract = new browserWeb3.eth.Contract(
            ND_CRAFTING_JSON.abi,
            // DC_ND_CRAFTING_JSON.networks[networkId].address
        )

        return new EthNDCraftingManager(contract);
    }

    constructor(contract){
        this._contract = contract;
    }

    async getAssetWithId(id){
        // await contract.
        // fetch asset here
    }

    async getBalanceOfUserAsync(address) {
        // var test = this._contract;
        // debugger;
        // return await this._contract.methods.balanceOf(address).call({from:address});
    }

    async getNDAssetsOfUserAsync(account) {
      // notes
      // use the big number library to convert
      // new Bignumber(id)
      // getAssetType

      debugger;

      // example-nft-typeId
      // fs.readFile('transfer-gateway-example/example-nft-typeId', 'utf-8', function(err, data) {
      //   debugger;
      //    console.log(data);
      // });
      // read from file here?
    }
}
