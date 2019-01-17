pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

// Mix of
// https://github.com/enjin/erc-1155/blob/master/contracts/ERC1155NonFungible.sol
// https://github.com/enjin/erc-1155/blob/master/contracts/ERC1155NonFungibleMintable.sol
// with naming adjusted in order to more clearly represent the concepts
contract ERC1155Spike is Ownable{
    using SafeMath for uint256;

    mapping (uint256 => address) public nfiOwners;
    mapping (uint256 => bool) public nfiEscrow;
    mapping (uint256 => bool) public nfiLock;

    // NFI Equipment mappings
    mapping (uint256 => uint256) public nfiEquipped;
    mapping (uint256 => mapping (uint256 => uint256)) public nfiEquipment;

    // Class Equipment Mappings
    mapping (uint256 => uint256) public classEquipmentSlots;
    mapping (uint256 => uint256) public classEquipmentSlotType;

    mapping (uint256 => AssetClass) public assets;
    mapping (uint256 => Children) public children;
    mapping (uint256 => uint256) public assetTypeList;
    // assetTypeIndex (0,1,2...n) to assetIndex (0,1,10000,10909)..

    struct Claim {
        address from;
        uint256[] ids;
        uint256[] values;
    }
    
    mapping (bytes32 => Claim) public unclaimed;

    event assetClassCreated(string _name, uint256 _typeCounter, uint256 _typeId, bool _isNFI);
    event NFTMinted(uint256 _typeId, uint256 _whichNfi, address _to);
    event NFTDeleted(uint256 _typeId, uint256 _whichNfi, address _to);
    event Transfer(address indexed _from, address indexed _to, uint256 indexed _id, uint256 _value);
    event LockAsset(address _owner, uint256 _assetId);
    event UnlockAsset(address _owner, uint256 _assetId);

    struct AssetClass{
        string name;
        uint256 totalSupply;
        uint256 currentIndex;
        mapping (address => uint256) balances; // owner => int
        mapping (address => uint256) escrowBalances; // owner => int
    }

    struct Children{
        // huh. struct needs some value that's not a [] or it gives the following:
        // TypeError: Internal or recursive type is not allowed for public state variables.
        // so uint256 id is a placeholder for now
        uint256 id;
        uint256[] ids;

        // NOTE: i'm implicitly using this as escrowBalances, so a balance refactor or be more explicit
        // an item can't have children that are NOT in escrow --
        uint256[] countEscrowed;
    }


    // Store the type in the upper 128 bits
    // results in:
    // 111111...11|000000...00
    // |...128....|...128....|
    uint256 constant TYPE_MASK = uint256(uint128(~0)) << 128;

    // ..and the non-fungible index in the lower 128 of a uint256
    // results in:
    // 0000000...00|111111...11
    // |...128.....|...128....|
    uint256 constant NF_INDEX_MASK = uint128(~0);

    // The top bit is a flag to tell if this is a NFI.
    // results in:
    // 10000..0000000000000000000
    // |...........256..........|
    uint256 constant TYPE_NF_BIT = 1 << 255;

    // I'm calling this typeCounter;
    // it starts at 0; and increments every time a new type is created
    // it could be called nonce to signal that it doesn't have to increment: it could be random
    uint256 public typeCounter;

    // abridged from
    // https://github.com/enjin/erc-1155/blob/master/contracts/ERC1155NonFungibleMintable.sol
    // TODO will be external but for the refactoring, is public
    function create(string _name, uint256 _totalSupply, bool _isNFI) 
        public onlyOwner returns (uint256 _typeId)
    {

        // _typeId is a uint256 so this is shifting the typeCounter (which is 1,2,3,... n) 128 bits to the right
        // to store the data about the _typeId in the upper 128 bits of type
        // result like:
        // |_typeId.. |remaining 0s|
        // 101000..000|00000000.00
        // |...128....|...128....|
        // OH OK... so since _typeId is 256 it is always left-padded with 0s like so:
        // 00000..000 | 101....000 |
        // | <= 128   | the shifted typeCounter >= 128 |
        _typeId = (++typeCounter << 128);


        if(_isNFI){
            // | is a bitwise OR, not a boolean OR
            // this results in always having the leftmost bit (most significant bit) set to 1
            // because TYPE_NF_BIT is 10000.....0, and OR-ing anything with 1, gives you 1
            // result is that this number is much "bigger" than the _typeId if not _isNFI
            // it is 255 places w/a 1 in its MSB
            // whereas the other is 255 places but left-padded w/zeros until you get to the number itself
            _typeId = _typeId | TYPE_NF_BIT;
        }

        emit assetClassCreated(_name, typeCounter, _typeId, _isNFI);

        assets[_typeId].name = _name;
        assets[_typeId].totalSupply = _totalSupply;
        assets[_typeId].currentIndex = _totalSupply;
        assetTypeList[typeCounter] = _typeId;
    }

    /** @dev This function determines, given an input _id, whether that _id represents
    an NFT base-type.
    Example: does this _id represent the NFT type "Sword" versus either a specific sword or a Fungible Token type?
    * @param _id an id to check
    * @return  bool: whether this id is or is not an NFT Type
    */
    function isNonFungibleBaseType(uint256 _id) public pure returns(bool) {
        return (_id & TYPE_NF_BIT == TYPE_NF_BIT) && (_id & NF_INDEX_MASK == 0);
    }


    /** @dev This function, given a specific NFT ID ("this sword"), returns the integer index (typeCounter) at which it was created.
    Example: 1,2,3..n
    * @param _whichNftId the id of a spefic NFT ("this sword")
    * @return _typeCounter: the typeCounter at which this particular NFT was minted
    */
    function getNonFungibleIndex(uint256 _whichNftId) public pure returns(uint256 _typeCounter) {
        _typeCounter = _whichNftId & NF_INDEX_MASK;
    }

    /** @dev This function, given a specific NFT ID ("this sword"), returns the type index (Sword)
    * @param _whichNftId the id of a spefic NFT ("this sword")
    * @return _typeId: the index representing the class of NFT that the specific id is an instance of ("Sword")
    */
    function getNonFungibleBaseType(uint256 _whichNftId) public pure returns(uint256 _typeId) {
        _typeId = _whichNftId & TYPE_MASK;
    }

    /** @dev This function, given an ID , will return whether or not the id represents a specific NFT or not.
    * @param _id  could be any id
    * @return bool whether the input _id represents a specific instance of an NFT
    */
    function isNonFungibleItem(uint256 _id) public pure returns(bool) {
        return (_id & TYPE_NF_BIT == TYPE_NF_BIT) && (_id & NF_INDEX_MASK != 0);
    }

    /** @dev This function, given an ID, will return whether or not the id represents an NFT (either a specific one or the type)
    * @param _id  could be any id
    * @return bool whether the input _id represents a specific instance of an NFT
    *
        * this works because for NFTs the MSB (most significant bit) is 1, and the TYPE_NF_BIT MSB is 1
    * so ANDING them will return the TYPE_NF_BIT if the MSB of _id is also 1, otherwise false.
            */
    function isNonFungible(uint256 _id) public pure returns(bool) {
        return _id & TYPE_NF_BIT == TYPE_NF_BIT;
    }

    /** @dev This function, given an ID, will return whether or not the id represents a Fungible Token Type
    * @param _id  could be any id
    * @return bool whether the input _id represents a Fungible token type (ex. "WOOD", "METAL")
    *
        *  this is the inverse of isNonFungible. Because if an item isNonFungible, its MSB is 1
    *  a fungible does NOT have a 1 in its MSB, so 1 (TYPE_NF_BIT) and 0 (the MSB of a fungible)
    *  equals 0
    */
    function isFungible(uint256 _id) public pure returns(bool) {
        return _id & TYPE_NF_BIT == 0;
    }

    function typeIdFor(uint256 _id) public pure returns(uint){
        return _id & TYPE_MASK;
    }
    //------------------------------------------------------// helper functions above
    function balanceOf(uint256 _typeId, address _owner) public view returns(uint256){
        return assets[typeIdFor(_typeId)].balances[_owner];
    }

    function totalSupply(uint256 _typeId) public view returns(uint256){
        return assets[_typeId].totalSupply;
    }

    // the reference implementation from:
    // https://github.com/enjin/erc-1155/blob/master/contracts/ERC1155NonFungible.sol
    // i think it assumes you're passing in a specific id instead of an asset class
    // interesting... would it be used that way?
    // this is saying: you have only one of these... but if the assetClass is CryptoKitties,
    // you could have two diff kitties in the same class
    //function balanceOf(uint256 _id, address _owner) external view returns (uint256) {
    //if (isNonFungibleItem(_id))
    //return ownerOf(_id) == _owner ? 1 : 0;
    //uint256 _type = _id & TYPE_MASK;
    //return items[_type].balances[_owner];
    //}

    // TODO unique URI for each one NFT: how would that change sig? What would that be used for?
    // TODO tests around onlyOwner (or implement onlyMinter)
    function mint(uint256 _typeId, address[] _to, uint256[] _values)
        public
        onlyOwner
    {
        if(isNonFungible(_typeId)){
            mintNonFungible(_typeId, _to, _values);
        } else if(isFungible(_typeId)){
            mintFungible(_typeId, _to, _values);
        }
    }

    function canEquip(uint256 _toId, uint256 _id) public view returns (bool) {
        return (classEquipmentSlots[typeIdFor(_toId)] & classEquipmentSlotType[typeIdFor(_id)]) > 0;
    }

    function isEquippable(uint256 _id) public view returns (bool) {
        return classEquipmentSlots[typeIdFor(_id)] > 0;
    }

    // NOTE this just does the top level children
    // to get further levels we need to build a parent relationship
    // and I got stuck on it today. Let's pause until the functionality
    // is needed for the game.
    function transferChildren(address _to, uint256 _id) internal{
        require(isNonFungible(_id)); // for now. in our world, FTs can't have children.

        uint childId;
        uint count;
        uint typeId;

        bool loop = hasChildren(_id);
        while(loop){
            uint[] storage childIds = children[_id].ids;
            uint[] storage counts = children[_id].countEscrowed;
            for(uint i=0; i< childIds.length; i++){
                childId = childIds[i];
                count = counts[i];
                typeId = typeIdFor(childId);

                if (isNonFungible(childId)) {
                    require(!isLocked(childId));
                    transferEquipment(_to, childId);
                }

                nfiOwners[childId] = _to;

                transferEscrowBalance(msg.sender, _to, typeId, count);
            }
            loop = false;
        }
    }

    function transferEscrowBalance(address _from, address _to, uint256 _typeId, uint256 _value) internal {
        assets[_typeId].escrowBalances[_from] = assets[_typeId].escrowBalances[_from].sub(_value);
        assets[_typeId].escrowBalances[_to]   = assets[_typeId].escrowBalances[_to].add(_value);
    }

    // NOTE: ASSUMES NFT EQUIPMENT
    function transferEquipment(address _to, uint256 _id) internal {
        if (isEquippable(_id)) {
            uint256 _equipId = nfiEquipment[_id][0];
            uint256 _equipTypeId = typeIdFor(_equipId);

            if (_equipId != 0) {
                nfiOwners[_equipId] = _to;
                transferEscrowBalance(msg.sender, _to, _equipTypeId, 1);
            }

            for (uint256 j = 0; (2**j) <= classEquipmentSlots[typeIdFor(_id)]; j++) {
                _equipId = nfiEquipment[_id][2**j];
                _equipTypeId = typeIdFor(_equipId);

                if (_equipId != 0) {
                    nfiOwners[_equipId] = _to;
                    transferEscrowBalance(msg.sender, _to, _equipTypeId, 1);
                }
            }
        }
    }

    function transfer(address _to,
                      uint256[] _ids,
                      uint256[] _values)
        public
        returns(bool)
    {
        uint _id;
        uint _value;

        // transfer escrow balances
        for (uint256 i = 0; i < _ids.length; ++i) {
            _id = _ids[i];
            _value  = _values[i];

            uint256 _typeId = typeIdFor(_id);

            if (isNonFungible(_id)) {
                require(_value == 1);
                requireAvailableNFTFromSender(_id);

                nfiOwners[_id] = _to;

                if (hasChildren(_id)) {
                    transferChildren(_to, _id);
                }

                transferEquipment(_to, _id);
            } else {
                require(assets[_typeId].balances[msg.sender] >= _value);
            }

            assets[_typeId].balances[msg.sender] = assets[_typeId].balances[msg.sender].sub(_value);
            assets[_typeId].balances[_to] = assets[_typeId].balances[_to].add(_value);

            emit Transfer(msg.sender, _to, _id, _value);
        }
    }

    function transferForClaim(bytes32 _key, uint256[] _ids, uint256[] _values) public {
        require(unclaimed[_key].ids.length == 0);
        transfer(owner, _ids, _values);
        unclaimed[_key] = Claim(msg.sender, _ids, _values);
    }

    function attemptClaim(bytes _attempt, address _to) public onlyOwner {
        bytes32 _key = keccak256(_attempt);

        Claim storage claim = unclaimed[_key];
        require(claim.ids.length > 0);

        transfer(_to, claim.ids, claim.values);
        delete unclaimed[_key];
    }

    /**
    Helper functions for minting
    */
    function incrementTypeSupply(uint256 _typeId, uint256 _value) internal {
        assets[_typeId].totalSupply = assets[_typeId].totalSupply.add(_value);
        assets[_typeId].currentIndex = assets[_typeId].currentIndex.add(_value);
    }

    function mintSingleNonFungible(uint256 _typeId, address _to, uint256 _incrementor)
        internal
        returns(uint256 _whichNfi)
    {
        uint256 _startIndex = assets[_typeId].currentIndex + 1;

        _whichNfi = _typeId | (_startIndex + _incrementor);

        nfiOwners[_whichNfi] = _to;

        assets[_typeId].balances[_to] = assets[_typeId].balances[_to].add(1);
        emit NFTMinted(_typeId, _whichNfi, _to);

        incrementTypeSupply(_typeId, 1);
    }

    function deleteSingleNonFungible(uint256 _whichNfi) internal returns(bool)
    {
        require(!isLocked(_whichNfi));

        address _to = nfiOwners[_whichNfi];
        delete nfiOwners[_whichNfi];

        uint256 _typeId = typeIdFor(_whichNfi);

        assets[_typeId].balances[_to] = assets[_typeId].balances[_to].sub(1);
        assets[_typeId].totalSupply = assets[_typeId].totalSupply.sub(1);

        emit NFTDeleted(_typeId, _whichNfi, _to);
        return true;
    }

    // Influenced by: https://github.com/enjin/erc-1155/blob/master/contracts/ERC1155NonFungibleMintable.sol
    //
    function mintNonFungible(uint256 _typeId, address[] _to, uint256[] _values) internal
    {
        require(isNonFungible(_typeId));

        // for each address
        for (uint256 i = 0; i < _to.length; ++i) {
            for (uint256 j = 0; j < _values[i]; j++){
               mintSingleNonFungible(_typeId, _to[i], i);
            }
        }
    }

    // signature
    /*
    mint(uint256 _typeId, address[] _to, uint256[] _values)
    // this would mint 1 0x1234 to 0x222 and 2 0x1234 to 0x888 (whether fungibles or not)
    // for nfts minting just one always has to be [1]
    mint(0x1234, [0x222.., 0x888], [1, 2])
   **/
    function mintFungible(uint256 _typeId, address[] _to, uint256[] _values)
        internal
    {
        require(isFungible(_typeId));

        uint256 totalValue;
        for (uint256 i = 0; i < _to.length; ++i) {
            uint256 _value = _values[i];
            address _dst = _to[i];

            totalValue = totalValue.add(_value);
            assets[_typeId].balances[_dst] = assets[_typeId].balances[_dst].add(_value);
        }

        incrementTypeSupply(_typeId, totalValue);
    }

    function lock(uint256[] _ids) external
    {
        for (uint256 i = 0; i < _ids.length; i++) {
            // Require this is a non-fungible, not locked, & owned by sender
            require(isNonFungible(_ids[i]));
            require(!isLocked(_ids[i]));
            require(compareOwner(_ids[i], msg.sender));

            // Put the non-fungible into escrow
            nfiLock[_ids[i]] = true;
            emit LockAsset(msg.sender, _ids[i]);
        }
    }

    function unlock(uint[] _ids) public onlyOwner
    {
        for (uint256 i = 0; i < _ids.length; i++) {
            // Require this is a non-fungible and in escrow
            require(isNonFungible(_ids[i]));
            require(isLocked(_ids[i]));

            // Remove the non-fungible from escrow
            delete nfiLock[_ids[i]];
            emit UnlockAsset(nfiOwners[_ids[i]], _ids[i]);
        }
    }

    /*
    function ownerOf(uint256 _whichId)
        public
        view
        returns(address)
    {
        return nfiOwners[_whichId];
    }
    */

    function compareOwner(uint256 _whichId, address _addr)
        public
        view
        returns(bool)
    {
        return nfiOwners[_whichId] == _addr;
    }

    function inEscrow(uint256 _id)
        public
        view
        returns(bool)
    {
        return nfiEscrow[_id];
    }

    function isLocked(uint256 _id)
        public
        view
        returns(bool)
    {
        return nfiLock[_id];
    }

    function isEquipment(uint256 _id)
        public
        view
        returns(bool)
    {
        return nfiLock[_id];
    }

    function hasChildren(uint256 _id)
        internal
        view
        returns (bool)
    {
        return children[_id].ids.length > 0;
    }

    function requireAvailableNFTFromSender(uint256 _id) internal view {
        // Require that the asset to equip from is an NFT & owned by sender
        require(isNonFungible(_id));
        require(compareOwner(_id, msg.sender));

        // Require that this asset is unlocked & not in escrow
        require(!inEscrow(_id));
        require(!isLocked(_id));
    }
}
