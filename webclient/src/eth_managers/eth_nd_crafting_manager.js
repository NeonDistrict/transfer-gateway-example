import Web3 from 'web3';
const BN = require('bn.js');

import Items from '../example-nft-typeId';

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

    async getAssetWithId(id) {
      // we just want to get information about the asset here
      // use the big number library to convert
      // new Bignumber(id)
      // const assetId = id.toNumber();
      debugger;
      // const num = id.ToNumber() // / Math.pow(10, tokenDecimals)
      const asset = await this._contract.methods.getAssetType(id).call() //{from: address}
      debugger;

      return asset;
    }

    async getBalanceOfUserAsync(address, typeId) {
      return await this._contract.methods.balanceOf(address, typeId).call({from:address});
    }

    async getNDAssetsOfUserAsync(account) {
      // look through 1155 + tests
      // we have an id and address
      // we want to pass those info to a method that says randall has one methods, etc. 5 hilts
      var items = Items;
      return items;
    }
}
