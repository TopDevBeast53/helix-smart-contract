//SPDX-License-Identifier:MIT
pragma solidity >=0.8.0;

import "./HelixPair.sol";
import "../interfaces/IOracleFactory.sol";

contract HelixFactory {
    address public feeTo;
    address public feeToSetter;
    address public oracleFactory; 
    bytes32 public INIT_CODE_HASH = keccak256(abi.encodePacked(type(HelixPair).creationCode));

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    // Emitted when the owner sets the "feeTo"
    event FeeToSet(address indexed feeTo);

    // Emitted when the owner sets the "feeToSetter"
    event FeeToSetterSet(address indexed feeToSetter);

    // Emitted when a pair's dev fee is set
    event DevFeeSet(address indexed pair, uint256 devFee);

    // Emitted when a pair's swap fee is set
    event SwapFeeSet(address indexed pair, uint256 swapFee);

    // Emitted when the owner sets the Oracle Factory contract
    event OracleFactorySet(address oracleFactory);

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "Helix: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "Helix: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "Helix: PAIR_EXISTS"); // single check is sufficient

        bytes memory bytecode = type(HelixPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        HelixPair(pair).initialize(token0, token1);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);

        IOracleFactory(oracleFactory).create(token0, token1);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, "Helix: FORBIDDEN");
        feeTo = _feeTo;
        emit FeeToSet(_feeTo);
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, "Helix: FORBIDDEN");
        feeToSetter = _feeToSetter;
        emit FeeToSetterSet(_feeToSetter);
    }

    function setDevFee(address _pair, uint8 _devFee) external {
        require(msg.sender == feeToSetter, "Helix: FORBIDDEN");
        require(_devFee > 0, "Helix: FORBIDDEN_FEE");
        HelixPair(_pair).setDevFee(_devFee);
        emit DevFeeSet(_pair, _devFee);
    }
    
    function setSwapFee(address _pair, uint32 _swapFee) external {
        require(msg.sender == feeToSetter, "Helix: FORBIDDEN");
        HelixPair(_pair).setSwapFee(_swapFee);
        emit SwapFeeSet(_pair, _swapFee);
    }

    function setOracleFactory(address _oracleFactory) external {
        require(msg.sender == feeToSetter, "Helix Factory: INVALID CALLER");
        oracleFactory = _oracleFactory;
        emit OracleFactorySet(_oracleFactory);
    }

    function updateOracle(address token0, address token1) external {
        IOracleFactory(oracleFactory).update(token0, token1); 
    }
}
