const {readFileSync} = require('fs');
const Web3 = require('web3');

const{
    NonceTxMiddleware, SignedTxMiddleware, Client,
    Address, Contracts, LocalAddress, CryptoUtils, 
    createJSONRPCClient, Web3Signer, soliditySha3
} = require('loom-js');


console.log("Hello! I'll be mapping the LoomFirstWeapons");

// NOTE for dev: the following functions are repeated
// in all the mapping_* files.  If you keep doing this,
// consider making a class / mixin to share the functionality
function readStoredData(filename){
    return readFileSync("../" + filename, 'utf-8')
}

function getKeyPair(){
    let privateKeyData = readStoredData('dappchain/private_key');
    let privateKey = CryptoUtils.B64ToUint8Array(privateKeyData);
    let publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey);

    return {'public':publicKey, 'private':privateKey};
}

function createLoomClient(chainId, writeUrl, readUrl){
    const writer = createJSONRPCClient({protocols: [{url: writeUrl}]});
    const reader = createJSONRPCClient({protocols: [{url: readUrl}]});
    return new Client(chainId, writer, reader);
}

function injectMiddleware(client, keypair){
    client.txMiddleware = [
        new NonceTxMiddleware(keypair['public'], client),
        new SignedTxMiddleware(keypair['private'])
    ]
}

// ADDRESSES
const loomFirstWeaponEthAddress = readStoredData('loom_first_weapon_eth_address');
const loomFirstWeaponLoomAddress = readStoredData('loom_first_weapon_loom_address')
const loomFirstWeaponEthTx = readStoredData('loom_first_weapon_tx_hash');

// NETWORK CONFIG
const chainId = 'default';
const writeUrl = 'http://127.0.0.1:46658/rpc';
const readUrl = 'http://127.0.0.1:46658/query';

// ACCOUNTS & Web3
const web3 = new Web3('http://localhost:8545');


// console.log("loomFirstWeaponEthAddress", loomFirstWeaponEthAddress);
// console.log("loomFirstWeaponLoomAddress", loomFirstWeaponLoomAddress);
// console.log("loomFirstWeaponEthTx", loomFirstWeaponEthTx);

// this might be more readable with thens & promises
(async () => {
   // set up keypair
    let keypair = getKeyPair();
    const publicKey = keypair['public'];
    const privateKey = keypair['private'];

    // initialize client that talks with loom (could be one call ex .setupClient)
    const client = createLoomClient(chainId, writeUrl, readUrl);
    injectMiddleware(client, keypair);

    // what is this exactly?? be able to describe it more
    // is it the local loom address? 
    let localAddress = new Address(client.chainId, LocalAddress.fromPublicKey(publicKey));
    console.log("localAddress");
        
    const transferGateway = await Contracts.TransferGateway.createAsync(client,localAddress);

    console.log('transferGateway', transferGateway);

    const foreignContract = new Address('eth', LocalAddress.fromHexString(loomFirstWeaponEthAddress));
    const localContract = new Address(client.chainId, LocalAddress.fromHexString(loomFirstWeaponLoomAddress))

    console.log("foreignContract", foreignContract);
    console.log("localContract", localContract);

    // 
    const accounts = await web3.eth.getAccounts()
    const owner = accounts[0]
    const web3Signer = new Web3Signer(web3, owner);

    // hashes
    // what's all this slice(2) doing for us?
    const contractsAddressHash = soliditySha3(
        {type: 'address', value: foreignContract.local.toString().slice(2)},
        {type: 'address', value: localContract.local.toString().slice(2)}
    )

    const foreignContractCreatorSig = await web3Signer.signAsync(contractsAddressHash);
    const foreignContractCreatorTxHash = Buffer.from(loomFirstWeaponEthTx.slice(2), 'hex')

    console.log("contractsAddressHash", contractsAddressHash);
    console.log("foreignContract.MarshalPB()", foreignContract.MarshalPB());
    console.log("localContract.MarshalPB()", localContract.MarshalPB());

    //// add the contract mapping, finally
    //// the rest is set-up. and its at so many different levels of abstraction
    /// this function apparently takes named params
    await transferGateway.addContractMappingAsync({
        foreignContract, 
        localContract, 
        foreignContractCreatorSig, 
        foreignContractCreatorTxHash
    })
    //console.log("done");
})()
