// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IAuraFactory {
    function allPairsLength() external view returns(uint);
    function createPair(address tokenA, address tokenB) external returns(address pair);
    function setFeeTo(address _feeTo) external;
    function setFeeToSetter(address _feeToSetter) external;
    function setDevFee(address _pair, uint8 _devFee) external;
    function setSwapFee(address _pair, uint32 _swapFee) external;
}
