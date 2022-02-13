// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

interface ILpToken {
    function factory() external view returns(address);
}

interface IFactory {
    function allPairsLength() external view returns(uint);
    function allPairs(uint) external view returns(address);
}

interface IPair {
    function token0() external view returns(address);
    function token1() external view returns(address);
}

interface IToken {
    function balanceOf(address) external view returns(uint);
    function symbol() external view returns(string memory);
}

/**
 * @dev Expose functionality for working with lpTokens and their associated token pairs.
 */
contract TokenTools {
    struct TokenPair {
        address tokenA;         // address of token A
        address tokenB;         // address of token B
        uint balanceA;          // msg.sender balance of token A
        uint balanceB;          // msg.sender balance of token B
        string symbolA;         // symbol of token A
        string symbolB;         // symbol of token B 
    }

    /**
     * @dev Get the addresses of all token pairs associated with this lpToken.
     */
    function getAllPairs(address lpToken) external view returns(address[] memory) {
        address factory = ILpToken(lpToken).factory(); 
        uint allPairsLength = IFactory(factory).allPairsLength();
        address[] memory allPairs = new address[](allPairsLength);
        for (uint i = 0; i < allPairsLength; i++) {
            allPairs[i] = IFactory(factory).allPairs(i);
        }
        return allPairs;
    }

    /**
     * @dev Get the token pairs wherein the caller has a nonzero balance, 
     *      i.e. tokenA.balance > 0 and tokenB.balance > 0
     */
    function getStakedTokenPairs(address lpToken) external view returns(TokenPair[] memory) {
        address factory = ILpToken(lpToken).factory(); 
        uint allPairsLength = IFactory(factory).allPairsLength();
        uint stakedPairsLength;
        TokenPair[] memory stakedPairs = new TokenPair[](allPairsLength);
        for (uint i = 0; i < allPairsLength; i++) {
            address pair = IFactory(factory).allPairs(i);
            address tokenA = IPair(pair).token0();
            address tokenB = IPair(pair).token1();
            uint balanceA = IToken(tokenA).balanceOf(msg.sender);
            uint balanceB = IToken(tokenB).balanceOf(msg.sender);
            if (balanceA > 0 && balanceB > 0) {
                string memory symbolA = IToken(tokenA).symbol();
                string memory symbolB = IToken(tokenB).symbol();
                stakedPairs[stakedPairsLength++] = TokenPair(
                    tokenA, 
                    tokenB, 
                    balanceA, 
                    balanceB, 
                    symbolA, 
                    symbolB
                );
            }
        }
        return stripEmpty(stakedPairs, stakedPairsLength);
    }

    /**
     * @dev Helper function that strips empty token pairs from the given array.
     */
    function stripEmpty(TokenPair[] memory arr, uint len) internal pure returns(TokenPair[] memory) {
        TokenPair[] memory result = new TokenPair[](len);
        uint j;
        for (uint i = 0; i < arr.length; i++) {
            // Only necessary to check a single field since 
            // any empty field indicates an empty pair.
            if (arr[i].tokenA != address(0)) {
                result[j++] = arr[i];
            }
        }
        return result;
    }
}
