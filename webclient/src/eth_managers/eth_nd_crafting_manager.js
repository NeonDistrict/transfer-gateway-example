import Web3 from 'web3';
var BigNumber = require('bignumber.js');

import Items from '../example-nft-typeId';

export default class EthNDCraftingManager {
    static async createAsync(){
        const browserWeb3 = new Web3(window.web3.currentProvider);
        const networkId = await browserWeb3.eth.net.getId()
        const contract = new browserWeb3.eth.Contract(
            ND_CRAFTING_JSON.abi,
            ND_CRAFTING_JSON.networks[networkId].address
            // DC_ND_CRAFTING_JSON.networks[networkId].address
        )

        return new EthNDCraftingManager(contract);
    }

    constructor(contract){
        this._contract = contract;
    }

    async getAssetWithId(id) {
      const num = new BigNumber(Number.MAX_VALUE.toString(2), 2)
      // debugger;
      // console.log(this._contract);
      const asset = await this._contract.methods.getAssetType(num).call() //{from: address}
      console.log('asset: ', asset);
      return asset;
    }

    async getBalanceOfUserAsync(address, typeId) {
      return await this._contract.methods.balanceOf(address, typeId).call({from:address});
    }

    async getNDAssetsOfUserAsync(account) {
      // we have an id and address
      // we want to pass those info to a method that says randall has one methods, etc. 5 hilts
      var items = Items;
      return items;
    }
}
