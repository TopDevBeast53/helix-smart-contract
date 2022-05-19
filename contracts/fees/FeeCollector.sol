// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../libraries/Percent.sol";
import "../interfaces/IFeeHandler.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract FeeCollector is Ownable {
    /// Handler that this collector transfers fees to
    IFeeHandler public feeHandler;

    /// Determines the fee percent taken by this collector
    uint256 public collectorPercent;

    // Emitted when a new _feeHandler address is set by the owner
    event SetFeeHandler(address _feeHandler);

    // Emitted when a new collector percent is set by the owner
    event SetCollectorPercent(uint256 _collectorPercent);

    /// Delegate feeHandler to transfer _fee amount of _token from _from
    function delegateTransfer(IERC20 _token, address _from, uint256 _fee) internal {
        require(_fee > 0, "FeeCollector: zero fee");
        require(address(feeHandler) != address(0), "FeeCollector: handler not set");
        _token.approve(address(feeHandler), _fee);
        feeHandler.transferFee(_token, _from, _fee);
    }

    /// Return true if the feeHandler address is set and false otherwise
    function isFeeHandlerSet() external view returns (bool) {
        return feeHandler != address(0);
    }
    
    /// Called by the owner to set a new _feeHandler address
    function setFeeHandler(IFeeHandler _feeHandler) external onlyOwner { 
        feeHandler = _feeHandler;
        emit SetFeeHandler(address(_feeHandler));
    }

    /// Called by the owner to set the _collectorPercent collected from transactions
    function setCollectorPercent(uint256 _collectorPercent) external onlyOwner {
        require(Percent.isValidPercent(_collectorPercent), "FeeCollector: percent exceeds max");
        collectorPercent = _collectorPercent;
        emit SetCollectorPercent(_collectorPercent);
    }

    /// Return the collector fee computed from the _amount and the collectorPercent
    function getCollectorFee(uint256 _amount) public view returns (uint256 collectorFee) {
        collectorFee = Percent.getPercentage(_amount, collectorPercent);
    }

    /// Split _amount based on collectorPercent and return the collectorFee and the remainder
    /// where remainder == _amount - collectorFee
    function getCollectorFeeSplit(uint256 _amount) 
        public 
        view 
        returns (uint256 collectorFee, uint256 remainder) 
    {
        (collectorFee, remainder) = Percent.splitByPercent(_amount, collectorFee);
    }
}
