// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10;

import "../interfaces/IHelixV2Router02.sol";

import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RouterProxy is Ownable {
    address public router;
    address public partner;

    uint256 public partnerPercent;
    uint256 public immutable percentDecimals;

    event SetRouter(address router);
    event SetPartner(address partner);
    event SetPartnerPercent(uint256 partnerPercent);
    event CollectFee(address token, address from, uint256 amount);
    event Withdraw(address token, address to, uint256 amount);

    modifier onlyPartner() {
        require(msg.sender == partner, "Caller is not partner");
        _;
    }

    modifier onlyValidAddress(address _address) {
        require(_address != address(0), "Zero address");
        _;
    }

    modifier onlyValidPartnerPercent(uint256 _partnerPercent) {
        require(_partnerPercent <= percentDecimals, "Invalid partner percent");
        _;
    }

    constructor (address _router, address _partner) {
        router = _router;
        partner = _partner;
        percentDecimals = 100000;  // partnerFee = amount * partnerPercent / percentDecimals
    }

    function setRouter(address _router) external onlyOwner onlyValidAddress(_router) {
        router = _router;
        emit SetRouter(_router);
    }

    function setPartner(address _partner) external onlyPartner {
        partner = _partner;
        emit SetPartner(_partner);
    }

    function setPartnerPercent(uint256 _partnerPercent) 
        external 
        onlyPartner 
        onlyValidPartnerPercent(_partnerPercent) 
    {
        partnerPercent = _partnerPercent;
        emit SetPartnerPercent(_partnerPercent);
    }

    function withdraw(address _token, address _to, uint256 _amount) external onlyPartner {
        TransferHelper.safeTransfer(_token, _to, _amount);
        emit Withdraw(_token, _to, _amount);
    }

    function swapExactTokensForTokens(
        uint256 amountIn, 
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) 
        external
        returns (uint256[] memory amounts)
    {
        TransferHelper.safeTransferFrom(path[0], msg.sender, address(this), amountIn);

        amountIn -= getFee(amountIn);
        TransferHelper.safeApprove(path[0], router, amountIn);
        amounts = IHelixV2Router02(router).swapExactTokensForTokens(
            amountIn, 
            amountOutMin, 
            path, 
            to, 
            deadline
        );
    }

    function getFee(uint256 _amount) public view returns(uint256) {
        return _amount * partnerPercent / percentDecimals;
    }
}
