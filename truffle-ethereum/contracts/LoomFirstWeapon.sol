pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract LoomFirstWeapon is ERC721Token("LoomFirstWeapon", "LFW"), Ownable {
    address public gatewayContract;
    constructor (address _gatewayContract) public{
        gatewayContract = _gatewayContract;
    }

    function depositToGateway(uint tokenId) public {
        safeTransferFrom(msg.sender, gatewayContract, tokenId);
    }
}
