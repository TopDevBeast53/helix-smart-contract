//SPDX-License-Identifier:MIT
pragma solidity >=0.8.0;

import './AuraPair.sol';
import '../interfaces/IOracleFactory.sol';
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";

contract AuraFactory is IUniswapV2Factory {
    address public feeTo;
    address public feeToSetter;
    address public oracleFactory; 
    bytes32 public INIT_CODE_HASH = keccak256(abi.encodePacked(type(AuraPair).creationCode));

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, 'Aura: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'Aura: ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'Aura: PAIR_EXISTS'); // single check is sufficient

        bytes memory bytecode = type(AuraPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        AuraPair(pair).initialize(token0, token1);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);

        IOracleFactory(oracleFactory).create(token0, token1);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, 'Aura: FORBIDDEN');
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, 'Aura: FORBIDDEN');
        feeToSetter = _feeToSetter;
    }

    function setDevFee(address _pair, uint8 _devFee) external {
        require(msg.sender == feeToSetter, 'Aura: FORBIDDEN');
        require(_devFee > 0, 'Aura: FORBIDDEN_FEE');
        AuraPair(_pair).setDevFee(_devFee);
    }
    
    function setSwapFee(address _pair, uint32 _swapFee) external {
        require(msg.sender == feeToSetter, 'Aura: FORBIDDEN');
        AuraPair(_pair).setSwapFee(_swapFee);
    }

    function setOracleFactory(address _oracleFactory) external {
        require(msg.sender == feeToSetter, 'Aura Factory: INVALID CALLER');
        oracleFactory = _oracleFactory;
    }

    function updateOracle(address token0, address token1) external {
        IOracleFactory(oracleFactory).update(token0, token1); 
    }
}
