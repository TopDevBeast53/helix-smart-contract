// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10;

import "../interfaces/IHelixV2Router02.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol"; 
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
    event SwapExactTokensForTokens(
        uint256 indexed swapAmount,
        uint256 indexed fee,
        address[] path,
        uint256[] amounts
    );
    event SwapTokensForExactTokens(
        uint256 indexed swapAmount,
        uint256 indexed fee,
        address[] path,
        uint256[] amounts
    );
    event SwapExactETHForTokens(
        uint256 indexed swapAmount,
        uint256 indexed fee,
        address[] path,
        uint256[] amounts
    );
    event SwapTokensForExactETH(
        uint256 indexed swapAmount,
        uint256 indexed fee,
        address[] path,
        uint256[] amounts
    );
    event SwapExactTokensForETH(
        uint256 indexed swapAmount,
        uint256 indexed fee,
        address[] path,
        uint256[] amounts
    );
    event SwapETHForExactTokens(
        uint256 indexed swapAmount,
        uint256 indexed fee,
        address[] path,
        uint256[] amounts
    );
    event SwapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 indexed swapAmount,
        uint256 indexed fee,
        address[] path
    );
    event SwapExactETHForTokensSupportingFeeOnTransferTokens(
        uint256 indexed swapAmount,
        uint256 indexed fee,
        address[] path
    );
    event SwapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 indexed swapAmount,
        uint256 indexed fee,
        address[] path
    );

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

    constructor (address _router, address _partner) 
        onlyValidAddress(_router)
        onlyValidAddress(_partner)
    {
        router = _router;
        partner = _partner;
        partnerPercent = 500; // 0.050%
        percentDecimals = 1e5;  // Use 3 decimals of precision for percents, i.e. 000.000%
    }

    function setRouter(address _router) external onlyOwner onlyValidAddress(_router) {
        router = _router;
        emit SetRouter(_router);
    }

    function setPartner(address _partner) external onlyPartner onlyValidAddress(_partner) {
        partner = _partner;
        emit SetPartner(_partner);
    }

    function setPartnerPercent(uint256 _partnerPercent) 
        external 
        onlyPartner 
        onlyValidPartnerPercent(_partnerPercent) 
    {
        require(_partnerPercent <= percentDecimals, "Invalid partner percent");
        partnerPercent = _partnerPercent;
        emit SetPartnerPercent(_partnerPercent);
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
        uint256 fee = getFee(amountIn);
        amountIn -= fee;
        TransferHelper.safeApprove(path[0], router, amountIn);
        amounts = IHelixV2Router02(router).swapExactTokensForTokens(
            amountIn, 
            amountOutMin, 
            path, 
            to, 
            deadline
        );
        _withdrawErc20(path[0], fee);
        emit SwapExactTokensForTokens(
            amountIn,
            fee,
            path,
            amounts
        );
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    )
        external
        returns (uint256[] memory amounts)
    {
        amounts = IHelixV2Router02(router).getAmountsIn(amountOut, path);
        uint256 fee = getFee(amounts[0]);
        TransferHelper.safeTransferFrom(path[0], msg.sender, address(this), amounts[0] + fee);  
        TransferHelper.safeApprove(path[0], router, amounts[0]);
        amounts = IHelixV2Router02(router).swapTokensForExactTokens(
            amountOut,
            amountInMax,
            path,
            to,
            deadline
        );
        _withdrawErc20(path[0], fee);
        emit SwapTokensForExactTokens(
            amounts[0],
            fee,
            path,
            amounts
        );
    }

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) 
        external
        payable
        returns (uint256[] memory amounts) 
    {
        uint256 fee = getFee(msg.value);
        amounts = IHelixV2Router02(router).swapExactETHForTokens{ value: msg.value - fee }(
            amountOutMin,
            path,
            to,
            deadline
        );
        _withdrawEth(fee);
        emit SwapExactETHForTokens(
            msg.value - fee,
            fee,
            path,
            amounts
        );
    }

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    )
        external
        returns (uint256[] memory amounts)
    {
        amounts = IHelixV2Router02(router).getAmountsIn(amountOut, path);
        uint256 fee = getFee(amounts[0]);
        TransferHelper.safeTransferFrom(path[0], msg.sender, address(this), amounts[0] + fee);
        TransferHelper.safeApprove(path[0], router, amounts[0]);
        amounts = IHelixV2Router02(router).swapTokensForExactETH(
            amountOut,
            amountInMax,
            path,
            to,
            deadline
        );
        _withdrawErc20(path[0], fee);
        emit SwapTokensForExactETH(
            amounts[0],
            fee,
            path,
            amounts
        );
    }

    function swapExactTokensForETH(
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
        uint256 fee = getFee(amountIn);
        amountIn -= fee;
        TransferHelper.safeApprove(path[0], router, amountIn);
        amounts = IHelixV2Router02(router).swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );
        _withdrawErc20(path[0], fee);
        emit SwapExactTokensForETH(
            amountIn,
            fee,
            path,
            amounts
        );
    }

    function swapETHForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline
    )
        external
        payable
        returns (uint256[] memory amounts)
    {
        amounts = IHelixV2Router02(router).getAmountsIn(amountOut, path);
        uint256 fee = getFee(amounts[0]);
        amounts = IHelixV2Router02(router).swapETHForExactTokens{ value: amounts[0] }(
            amountOut,
            path,
            to,
            deadline
        );
        _withdrawEth(fee);
        if (msg.value > amounts[0] + fee) {
            TransferHelper.safeTransferETH(msg.sender, msg.value - (amounts[0] + fee));
        }
        emit SwapETHForExactTokens(
            amounts[0],
            fee,
            path,
            amounts
        );
    }

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    )
        external
    {
        TransferHelper.safeTransferFrom(path[0], msg.sender, address(this), amountIn);
        uint256 fee = getFee(amountIn);
        amountIn -= fee;
        TransferHelper.safeApprove(path[0], router, amountIn);
        IHelixV2Router02(router).swapExactTokensForTokensSupportingFeeOnTransferTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );
        _withdrawErc20(path[0], fee);
        emit SwapExactTokensForTokensSupportingFeeOnTransferTokens(
            amountIn,
            fee,
            path
        );
    }

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    )
        external
        payable
    {
        uint256 fee = getFee(msg.value);
        IHelixV2Router02(router).swapExactETHForTokensSupportingFeeOnTransferTokens{ value: msg.value - fee }(
            amountOutMin,
            path,
            to,
            deadline
        );
        _withdrawEth(fee);
        emit SwapExactETHForTokensSupportingFeeOnTransferTokens(
            msg.value - fee,
            fee,
            path
        );
    }

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    )   
        external
    {
        TransferHelper.safeTransferFrom(path[0], msg.sender, address(this), amountIn);
        uint256 fee = getFee(amountIn);
        amountIn -= fee;
        TransferHelper.safeApprove(path[0], router, amountIn);
        IHelixV2Router02(router).swapExactTokensForETHSupportingFeeOnTransferTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );
        _withdrawErc20(path[0], fee);
        emit SwapExactTokensForETHSupportingFeeOnTransferTokens(
            amountIn,
            fee,
            path
        );
    }

    function getFee(uint256 _amount) public view returns(uint256) {
        return _amount * partnerPercent / percentDecimals;
    }

    function _withdrawErc20(address _token, uint256 _amount) private {
        TransferHelper.safeTransfer(_token, partner, _amount);
    }

    function _withdrawEth(uint256 _amount) private {
        TransferHelper.safeTransferETH(partner, _amount);
    }
}
