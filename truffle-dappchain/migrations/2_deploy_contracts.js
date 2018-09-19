const { writeFileSync, readFileSync } = require('fs')

// DappChain assets
const CryptoCardsDappChain = artifacts.require('CryptoCardsDappChain')
const GameTokenDappChain = artifacts.require('GameTokenDappChain')
const FakeCryptoKittyDappChain = artifacts.require('FakeCryptoKittyDappChain');
const LoomFirstWeaponDappChain = artifacts.require('LoomFirstWeaponDappChain');

module.exports = (deployer, network, accounts) => {
    console.log("deploying to loom network", network);
    // this is the address of the Ethereum Gateway contract that was deployed on the eth network
    // and written out to a file.
    const gatewayAddress = readFileSync('../gateway_dappchain_address', 'utf-8')

    deployer.deploy(CryptoCardsDappChain, gatewayAddress).then(async () => {
        const cryptoCardsDAppChainInstance = await CryptoCardsDappChain.deployed()
        console.log(`CryptoCardsDAppChain deployed at address: ${cryptoCardsDAppChainInstance.address}`)
        writeFileSync('../crypto_cards_dappchain_address', cryptoCardsDAppChainInstance.address)
    })

    deployer.deploy(GameTokenDappChain, gatewayAddress).then(async () => {
        const GameTokenDappChainInstance = await GameTokenDappChain.deployed()
        console.log(`GameTokenDappChain deployed at address: ${GameTokenDappChainInstance.address}`)
        writeFileSync('../game_token_dappchain_address', GameTokenDappChainInstance.address)
    })

    deployer.deploy(FakeCryptoKittyDappChain, gatewayAddress).then(async () => {
        const FakeCryptoKittyDappChainInstance = await FakeCryptoKittyDappChain.deployed();
        console.log(`FakeCryptoKittyDappChain deployed at ${FakeCryptoKittyDappChainInstance.address}`);
        writeFileSync('../fake_kitty_loom_address', FakeCryptoKittyDappChainInstance.address);
    })

    deployer.deploy(LoomFirstWeaponDappChain, gatewayAddress).then(async () => {
        // necessary? doubtful but maybe. maybe this does need to be registered in the gatewayInstance
        // otherwise... so, hold the thought.
        // if we do have to do this -- there will probably need to be a fn like:
        // registerOnGateway, maybe in this very contract!
        //
        // const gatewayInstance = await Gateway.at(gatewayAddress)
        // console.log("In DappChain Migrations with (hopefully) gatewayInstance:", gatewayInstance);

        console.log("deploying LoomFirstWeaponDappChain");
        const LoomFirstWeaponDappChainInstance = await LoomFirstWeaponDappChain.deployed();
        console.log(`LoomFirstWeaponDappChain deployed at ${LoomFirstWeaponDappChainInstance.address}`);
        writeFileSync('../loom_first_weapon_loom_address', LoomFirstWeaponDappChainInstance.address);

        // TODO -- register assets to user  here I bet!
    })
}

