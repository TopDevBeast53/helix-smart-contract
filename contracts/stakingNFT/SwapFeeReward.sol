// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import '@rari-capital/solmate/src/utils/ReentrancyGuard.sol';
import '@rari-capital/solmate/src/tokens/ERC20.sol';

interface ISwapFactory {}
interface ISwapPair {}
interface IAuraToken {}
interface IAuraNFT {}

contract SwapFeeReward is Ownable, ReentrancyGuard {

}
