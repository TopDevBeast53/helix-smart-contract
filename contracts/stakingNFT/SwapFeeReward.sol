// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../libraries/AuraLibrary.sol";
import "./AddressWhitelist.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@rari-capital/solmate/src/utils/ReentrancyGuard.sol';

contract SwapFeeReward is Ownable, ReentrancyGuard {
    // Collection of whitelisted addresses. 
    AddressWhitelist whitelist;

    address factory;
    address router;
    address targetToken;
    address targetAuraToken;

    uint auraWagerOnSwap;

    struct PairsList {
        address pair;
        uint percentReward;
        bool enabled;
    }

    PairsList[] pairsList;

    mapping(address => uint) pairOfPid;

    constructor(
        address _factory,
        address _router, 
        address _targetToken,
        address _targetAuraToken
    ) {
        require(
            _factory != address(0)
            && _router != address(0)
            && _targetToken != address(0)
            && _targetAuraToken != address(0),
            "Address cannot be zero."
        );
        factory = _factory;
        router = _router;
        targetToken = _targetToken;
        targetAuraToken = _targetAuraToken;

        // Initialize a new whitelist for this contract.
        whitelist = new AddressWhitelist();
    }

    /**
     * @return _pairExists is true if the token pair of `a` and `b` exists and false otherwise.
     */
    function pairExists(address a, address b) public view returns(bool _pairExists) {
        address pair = AuraLibrary.pairFor(factory, a, b);
        PairsList memory pool = pairsList[pairOfPid[pair]];
        _pairExists = (pool.pair == pair);
    }
    
    /**
     * TODO
     */
    function getFees(address account, address input, address output, uint amount) 
        public
        view
        returns(
            uint feeInAURA,
            uint feeInUSD,
            uint pointsAccrued
        )
    {
        uint swapFee = AuraLibrary.getSwapFee(factory, input, output); 
        address pair = AuraLibrary.pairFor(factory, input, output);
        PairsList memory pool = pairsList[pairOfPid[pair]];

        if (pool.pair == pair && pool.enabled && whitelist.contains(input) && whitelist.contains(output)) {
            (uint feeAmount, uint pointAmount) = calcAmounts(amount, account);
            feeInAURA = getQuantity(output, feeAmount / swapFee, targetToken) * pool.percentReward / 100;
            feeInUSD = getQuantity(output, pointAmount / auraWagerOnSwap, targetAuraToken);
            pointsAccrued = getQuantity(targetToken, feeInAURA, targetAuraToken);
        }
    }

    /**
     * TODO
     */
    function calcAmounts(uint amount, address account) internal view returns(uint feeAmount, uint auraAmount) {
        // TODO - Implement
    }

    /**
     * TODO
     */
    function getQuantity(address outputToken, uint outputAmount, address anchorToken) public view returns(uint quantity) {
        // TODO - Implement
    }
}
