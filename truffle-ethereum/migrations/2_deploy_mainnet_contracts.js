const { writeFileSync } = require('fs')

const CryptoCards = artifacts.require('CryptoCards')
const GameToken = artifacts.require('GameToken')
const Gateway = artifacts.require('Gateway') // where is this from? OK, the .sol
const FakeCryptoKitty = artifacts.require('FakeCryptoKitty'); // not .sol?
const LoomFirstWeapon = artifacts.require('LoomFirstWeapon');

module.exports = (deployer, _network, accounts) => {

    console.log("truffle eth deploying in _network", _network);
    const [_, user] = accounts
    const validator = accounts[9]  // random

    console.log("user on eth chain is...", user);

    // what are the 3 and 4 again? Right. Arguments to Gateway 
    // which go to ValidatorManagerContract and indicate validator threshold & denom. 
    // not important for this deploy process.
    deployer.deploy(Gateway, [validator], 3, 4).then(async () => {
        const gatewayInstance = await Gateway.deployed()

        console.log(`Gateway deployed at address: ${gatewayInstance.address}`)

        const cryptoCardsContract = await deployer.deploy(CryptoCards, gatewayInstance.address)
        const cryptoCardsInstance = await CryptoCards.deployed()

        const gameTokenContract = await deployer.deploy(GameToken, gatewayInstance.address)
        const gameTokenInstance = await GameToken.deployed()

        const fakeCrytoKittyContract = await deployer.deploy(FakeCryptoKitty, gatewayInstance.address);
        const fakeCrytoKittyInstance = await FakeCryptoKitty.deployed()

        const loomFirstWeaponContract = await deployer.deploy(LoomFirstWeapon, gatewayInstance.address);
        const loomFirstWeaponInstance = await LoomFirstWeapon.deployed();


        console.log(`CryptoCards deployed at address: ${cryptoCardsInstance.address}`)
        console.log(`CryptoCards transaction at hash: ${cryptoCardsContract.transactionHash}`)

        console.log(`GameToken deployed at address: ${gameTokenInstance.address}`)
        console.log(`GameToken transaction at hash: ${gameTokenContract.transactionHash}`)

        console.log(`FakeCryptoKitty deployed at address: ${fakeCrytoKittyInstance.address}`)
        console.log(`FakeCryptoKitty transaction at hash: ${fakeCrytoKittyContract.transactionHash}`)

        console.log(`LoomFirstWeapon deployed at address: ${loomFirstWeaponInstance.address}`)
        console.log(`LoomFirstWeapon transaction at hash: ${loomFirstWeaponContract.transactionHash}`)


        // toggleToken defined in ValidatorManagerContract. Maps contract addresss to bools
        // https://github.com/NeonDistrict/transfer-gateway-example/blob/master/truffle-ethereum/contracts/ValidatorManagerContract.sol#L10
        // This is the code:
        // function toggleToken(address _token) public onlyValidator {
        //  allowedTokens[_token] = !allowedTokens[_token];
        // }
        // I would rename _token to _tokenAddress. 
        // Whatever allowedTokens[_token] is set to, true or false, this sets it to the opposite.
        // Since booleans initialize as false, being called here will set it to true
        // the result of each of these calls is that allowedTokens[_token] is now true
        // Gateway.sol inherits from ValidatorManagerContract and
        // when it receives ERC* tokens it throws an error if they are NOT allowed
        // https://github.com/NeonDistrict/transfer-gateway-example/blob/master/truffle-ethereum/contracts/Gateway.sol#L102-L112
        // Setting this here means that these tokens are allowed to be transferred to the gateway. 
        // I would have a function to allow(_tokenAddress), which would be more clear, but that's what's happening.
        // QUESTION: does allowedTokens come into play when transferring FROM loom?

        // this is where we mint the things to the person
        await gatewayInstance.toggleToken(cryptoCardsInstance.address, { from: validator })
        await cryptoCardsInstance.register(user)
        console.log("the user getting stuff", user);

        await gatewayInstance.toggleToken(gameTokenInstance.address, { from: validator })
        await gameTokenInstance.transfer(user, 100)

        await gatewayInstance.toggleToken(fakeCrytoKittyInstance.address, {from: validator}); 
        await fakeCrytoKittyInstance.register(user); 

        // In this case, not going to mint tokens to user on eth. 
        // But still makes sense to allow the gatewayInstance to receive them, so
        // that you can transfer them back from eth -> loom, once you've transferred them to eth. (Right?)
        await gatewayInstance.toggleToken(loomFirstWeaponInstance.address, {from: validator});

        writeFileSync('../gateway_address', gatewayInstance.address)
        writeFileSync('../crypto_cards_address', cryptoCardsInstance.address)
        writeFileSync('../crypto_cards_tx_hash', cryptoCardsContract.transactionHash)
        writeFileSync('../game_token_address', gameTokenInstance.address)
        writeFileSync('../game_token_tx_hash', gameTokenContract.transactionHash)
        writeFileSync('../fake_kitty_eth_address', fakeCrytoKittyInstance.address)
        writeFileSync('../fake_kitty_tx_hash', fakeCrytoKittyContract.transactionHash)
        writeFileSync('../loom_first_weapon_eth_address', loomFirstWeaponInstance.address)
        writeFileSync('../loom_first_weapon_tx_hash', loomFirstWeaponContract.transactionHash)
    })
}
