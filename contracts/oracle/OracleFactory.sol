// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import '../interfaces/IOracleFactory.sol';
import '../interfaces/IOracle.sol';
import './Oracle.sol';

// Used for constructing, updating, and consulting Oracle contracts
contract OracleFactory is IOracleFactory {
    address public immutable factory;

    mapping(address => mapping(address => address)) public oracles;

    constructor(address _factory) {
        factory = _factory;
    }

    event Create(
        address indexed tokenIn, 
        address indexed tokenOut, 
        address oracle
    );
    event Update(
        address indexed tokenIn, 
        address indexed tokenOut, 
        uint32 blockTimestamp
    );

    /*
     * @dev Create a new oracle for `token0` and `token1`.
     */
    function create(address token0, address token1) external {
        require(oracles[token0][token1] == address(0), 'OracleFactory: ORACLE HAS ALREADY BEEN CREATED');
        require(msg.sender == factory, 'OracleFactory: CALLER IS NOT FACTORY');

        Oracle oracle = new Oracle(factory, token0, token1);
        oracles[token0][token1] = address(oracle);
        oracles[token1][token0] = address(oracle);

        emit Create(token0, token1, address(oracle));
    }

    /*
     * @dev Update current prices of `token0` and `token1`.
     */
    function update(address token0, address token1) public {
        require(oracles[token0][token1] != address(0), 'OracleFactory: ORACLE HAS NOT BEEN CREATED');

        IOracle oracle = IOracle(oracles[token0][token1]);
        if (canUpdate(oracle)) {
            oracle.update();
            emit Update(token0, token1, getBlockTimestamp());
        }
    }
   
    /*
     * @dev Consult to get the `amountOut` of `tokenOut` equivalent in value to `amountIn` of `tokenIn`.
     *      Note this will always return 0 before update has been called successfully for the first time.
     */
    function consult(address tokenIn, uint amountIn, address tokenOut) external view returns (uint amountOut) {
        if (oracles[tokenIn][tokenOut] != address(0)) {
            IOracle oracle = IOracle(oracles[tokenIn][tokenOut]);
            amountOut = oracle.consult(tokenIn, amountIn);
        } else {
            amountOut = amountIn;
        }
    } 

    // convenience function that returns the address of the oracle for `token0` and `token1`
    function getOracle(address token0, address token1) external view returns (address oracle) {
        oracle = oracles[token0][token1];
    }

    // helper function that returns the current block timestamp within the range of uint32, i.e. [0, 2**32 - 1]
    function getBlockTimestamp() internal view returns (uint32) {
        return uint32(block.timestamp % 2 ** 32);
    }

    // helper function that returns whether enough time has passed to update the oracle
    function canUpdate(IOracle oracle) internal view returns (bool) {
        uint32 blockTimestamp = getBlockTimestamp();
        uint32 timeElapsed = blockTimestamp - oracle.blockTimestampLast();
        return timeElapsed >= oracle.PERIOD();
    }
}
