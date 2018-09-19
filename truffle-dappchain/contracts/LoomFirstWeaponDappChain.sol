pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";

// is this IERC721Receiver now? 
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Receiver.sol";

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
// huh what's this interface about. ok, mintToGateway
import "./ERC721DAppToken.sol";

contract LoomFirstWeaponDappChain is ERC721DAppToken, ERC721Token, ERC721Receiver, Ownable{
    address public gatewayContract;

    constructor(address _gatewayContract) ERC721Token("LoomFirstWeaponDappChain", "LFW") public {
        gatewayContract = _gatewayContract;
    }

    // this is the ERC721DAppToken interface, required
    // gets assets off of loom chain
    function mintToGateway(uint256 _uid) public {
        require(msg.sender == gatewayContract);
        _mint(gatewayContract, _uid);
    }

    // let me try to start with registering tokens on
    // dapp chain rather than main chain.

    function register(address user) onlyOwner external{
        for(uint8 i= 0; i < 1; i++){
            // give each user 1 loom-first-weapon 
            mintFor(user);
        }
    }

    function mintFor(address user) private {
        uint256 tokenId = allTokens.length + 1;
        _mint(user, tokenId);
    }

    // also may not need to impl this b/c it's ... in the online contract... from openzep?
    // https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC721/ERC721.sol#L322-L324

    function onERC721Received(
        address _from,
        uint256 _tokenId,
        bytes _data
    ) public returns(bytes4) {
        return ERC721_RECEIVED;
    }
}
