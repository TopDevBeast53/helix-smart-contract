//SPDX-License-Identifier:MIT
pragma solidity >=0.8.0;

import "./HelixPair.sol";
import "../interfaces/IOracleFactory.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract HelixFactory is Initializable {
    address public feeTo;
    address public feeToSetter;
    address public oracleFactory; 
    bytes32 public INIT_CODE_HASH;

    /// Default value used when creating a pair without a defined swapFee
    uint32 public defaultSwapFee;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    // Emitted when a new pair is created
    event CreatePair(address indexed token0, address indexed token1, address pair, uint);

    // Emitted when the owner sets the "feeTo"
    event SetFeeTo(address indexed feeTo);

    // Emitted when the owner sets the "feeToSetter"
    event SetFeeToSetter(address indexed feeToSetter);

    // Emitted when a pair's dev fee is set
    event SetDevFee(address indexed pair, uint256 devFee);

    // Emitted when a pair's swap fee is set
    event SetSwapFee(address indexed pair, uint256 swapFee);

    // Emitted when the owner sets the Oracle Factory contract
    event SetOracleFactory(address oracleFactory);

    // Emitted when the defaultSwapFee is set
    event SetDefaultSwapFee(address indexed setter, uint32 defaultSwapFee);

    /// Thrown when caller is not fee to sender
    error NotFeeToSetter(address caller);

    /// Thrown when trying to create a pair with identical token addresses
    error IdenticalTokens();

    /// Thrown when address(0) is encountered
    error ZeroAddress();

    /// Thrown when pair (token0, token1) has already been created
    error PairAlreadyExists(address token0, address token1);

    modifier onlyFeeToSetter() {
        if (msg.sender != feeToSetter) revert NotFeeToSetter(msg.sender);
        _;
    }

    function initialize(address _feeToSetter) external initializer {
        feeToSetter = _feeToSetter;
        INIT_CODE_HASH = keccak256(abi.encodePacked(type(HelixPair).creationCode));
        defaultSwapFee = 1;
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address) {
        return createPair(tokenA, tokenB, defaultSwapFee);
    }

    function createPair(address tokenA, address tokenB, uint32 swapFee) 
        public 
        returns (address pair) 
    {
        if (tokenA == tokenB) revert IdenticalTokens();
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        if (token0 == address(0)) revert ZeroAddress();
        if (getPair[token0][token1] != address(0)) revert PairAlreadyExists(token0, token1);

        bytes memory bytecode = type(HelixPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1, swapFee));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        HelixPair(pair).initialize(token0, token1, swapFee);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);

        IOracleFactory(oracleFactory).create(token0, token1);

        emit CreatePair(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external onlyFeeToSetter {
        feeTo = _feeTo;
        emit SetFeeTo(_feeTo);
    }

    function setFeeToSetter(address _feeToSetter) external onlyFeeToSetter {
        feeToSetter = _feeToSetter;
        emit SetFeeToSetter(_feeToSetter);
    }

    function setDevFee(address _pair, uint8 _devFee) external onlyFeeToSetter {
        HelixPair(_pair).setDevFee(_devFee);
        emit SetDevFee(_pair, _devFee);
    }
    
    function setSwapFee(address _pair, uint32 _swapFee) external onlyFeeToSetter {
        HelixPair(_pair).setSwapFee(_swapFee);
        emit SetSwapFee(_pair, _swapFee);
    }

    function setOracleFactory(address _oracleFactory) external onlyFeeToSetter {
        oracleFactory = _oracleFactory;
        emit SetOracleFactory(_oracleFactory);
    }

    function updateOracle(address token0, address token1) external {
        IOracleFactory(oracleFactory).update(token0, token1); 
    }

    function setDefaultSwapFee(uint32 _defaultSwapFee) external onlyFeeToSetter {
        defaultSwapFee = _defaultSwapFee;
        emit SetDefaultSwapFee(msg.sender, _defaultSwapFee);
    }
}
