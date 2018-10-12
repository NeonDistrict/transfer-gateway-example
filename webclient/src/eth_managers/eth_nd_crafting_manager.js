import Web3 from 'web3';

export default class EthNDCraftingManager {
    static async createAsync(){
        const browserWeb3 = new Web3(window.web3.currentProvider);
        const networkId = await browserWeb3.eth.net.getId()
        const contract = new browserWeb3.eth.Contract(
            ND_CRAFTING_JSON.abi,
            // DC_ND_CRAFTING_JSON.networks[networkId].address // sarah randall
        )
        // console.log("contract", contract);
        // console.log("NeonDistrictCrafting", NeonDistrictCrafting);

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
      // ../../example-nft-typeId
      // var path = require('path')
      // var test = path.join(__dirname, '../test')
      debugger;

      // fs.readFile('../../example-nft-typeId', 'foo')
      // .then(function(){
      //   debugger;
      //   return fs.readdir('foo');
      // })
      // .then(function(files){
      //   files // -> [ {some-file.txt} ]
      // });

      // example-nft-typeId
      // fs.readFile('transfer-gateway-example/example-nft-typeId', 'utf-8', function(err, data) {
      //   debugger;
      //    console.log(data);
      // });
      // read from file here?
    }
}
