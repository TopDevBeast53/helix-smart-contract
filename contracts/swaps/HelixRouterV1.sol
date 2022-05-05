// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import './HelixPair.sol';
import '../libraries/HelixLibrary.sol';
import '../interfaces/IHelixV2Router02.sol';
import '../interfaces/ISwapRewards.sol';
import '@uniswap/lib/contracts/libraries/TransferHelper.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IWETH.sol';
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";

contract HelixRouterV1 is IHelixV2Router02, Ownable {

    address public immutable _factory;
    address public immutable _WETH;
    address public swapRewards;

    modifier onlyValidDeadline(uint deadline) {
        require(deadline >= block.timestamp, 'Router: invalid deadline');
        _;
    }

    constructor(address factory_, address WETH_) Ownable() {
        _factory = factory_;
        _WETH = WETH_;
    }

    receive() external payable {
        assert(msg.sender == _WETH); // only accept ETH via fallback from the WETH contract
    }

    function factory() external view override returns (address) {
        return _factory;
    }

    function WETH() external view returns (address) {
        return _WETH;
    }

    function setSwapRewards(address _swapRewards) public onlyOwner {
        swapRewards = _swapRewards;
    }

    // **** ADD LIQUIDITY ****
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal virtual returns (uint amountA, uint amountB) {
        // create the pair if it doesn't exist yet
        if (IUniswapV2Factory(_factory).getPair(tokenA, tokenB) == address(0)) {
            IUniswapV2Factory(_factory).createPair(tokenA, tokenB);
        }
        (uint reserveA, uint reserveB) = HelixLibrary.getReserves(_factory, tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = HelixLibrary.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                _requireGEQ(amountBOptimal, amountBMin);
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = HelixLibrary.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                _requireGEQ(amountAOptimal, amountAMin);
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external virtual override onlyValidDeadline(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = HelixLibrary.pairFor(_factory, tokenA, tokenB);
        TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = HelixPair(pair).mint(to);
    }
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external virtual override payable onlyValidDeadline(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
        (amountToken, amountETH) = _addLiquidity(
            token,
            _WETH,
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountETHMin
        );
        address pair = HelixLibrary.pairFor(_factory, token, _WETH);
        TransferHelper.safeTransferFrom(token, msg.sender, pair, amountToken);
        IWETH(_WETH).deposit{value: amountETH}();
        assert(IWETH(_WETH).transfer(pair, amountETH));
        liquidity = HelixPair(pair).mint(to);
        // refund dust eth, if any
        if (msg.value > amountETH) TransferHelper.safeTransferETH(msg.sender, msg.value - amountETH);
    }

    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) public virtual override onlyValidDeadline(deadline) returns (uint amountA, uint amountB) {
        address pair = HelixLibrary.pairFor(_factory, tokenA, tokenB);
        HelixPair(pair).transferFrom(msg.sender, pair, liquidity); // send liquidity to pair
        (uint amount0, uint amount1) = HelixPair(pair).burn(to);
        (address token0,) = HelixLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        _requireGEQ(amountA, amountAMin);
        _requireGEQ(amountB, amountBMin);
    }
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) public virtual override onlyValidDeadline(deadline) returns (uint amountToken, uint amountETH) {
        (amountToken, amountETH) = removeLiquidity(
            token,
            _WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(token, to, amountToken);
        IWETH(_WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
    }
    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountA, uint amountB) {
        address pair = HelixLibrary.pairFor(_factory, tokenA, tokenB);
        uint value = approveMax ? type(uint).max : liquidity;
        HelixPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountA, amountB) = removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline);
    }
    function removeLiquidityETHWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountToken, uint amountETH) {
        address pair = HelixLibrary.pairFor(_factory, token, _WETH);
        uint value = approveMax ? type(uint).max : liquidity;
        HelixPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountToken, amountETH) = removeLiquidityETH(token, liquidity, amountTokenMin, amountETHMin, to, deadline);
    }

    // **** REMOVE LIQUIDITY (supporting fee-on-transfer tokens) ****
    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) public virtual override onlyValidDeadline(deadline) returns (uint amountETH) {
        (, amountETH) = removeLiquidity(
            token,
            _WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(token, to, IERC20(token).balanceOf(address(this)));
        IWETH(_WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
    }
    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountETH) {
        address pair = HelixLibrary.pairFor(_factory, token, _WETH);
        uint value = approveMax ? type(uint).max : liquidity;
        HelixPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        amountETH = removeLiquidityETHSupportingFeeOnTransferTokens(
            token, liquidity, amountTokenMin, amountETHMin, to, deadline
        );
    }

    // **** SWAP ****
    // requires the initial amount to have already been sent to the first pair
    function _swap(uint[] memory amounts, address[] memory path, address _to) internal virtual {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = HelixLibrary.sortTokens(input, output);
            uint amountOut = amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
    
            address to = i < path.length - 2 ? HelixLibrary.pairFor(_factory, output, path[i + 2]) : _to;
            HelixPair(HelixLibrary.pairFor(_factory, input, output)).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );

            if (swapRewards != address(0)) {
                ISwapRewards(swapRewards).swap(msg.sender, input, output, amountOut);
            }
        }
    }
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override onlyValidDeadline(deadline) returns (uint[] memory amounts) {
        amounts = HelixLibrary.getAmountsOut(_factory, amountIn, path);
        _requireGEQ(amounts[amounts.length - 1], amountOutMin);
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, HelixLibrary.pairFor(_factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override onlyValidDeadline(deadline) returns (uint[] memory amounts) {
        amounts = HelixLibrary.getAmountsIn(_factory, amountOut, path);
        _requireLEQ(amounts[0], amountInMax);
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, HelixLibrary.pairFor(_factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        payable
        onlyValidDeadline(deadline)
        returns (uint[] memory amounts)
    {
        _requireValidPath(path[0]);
        amounts = HelixLibrary.getAmountsOut(_factory, msg.value, path);
        _requireGEQ(amounts[amounts.length - 1], amountOutMin);
        IWETH(_WETH).deposit{value: amounts[0]}();
        assert(IWETH(_WETH).transfer(HelixLibrary.pairFor(_factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
    }
    function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        onlyValidDeadline(deadline)
        returns (uint[] memory amounts)
    {
        _requireValidPath(path[path.length - 1]);
        amounts = HelixLibrary.getAmountsIn(_factory, amountOut, path);
        _requireLEQ(amounts[0], amountInMax);
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, HelixLibrary.pairFor(_factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(_WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
    }
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        onlyValidDeadline(deadline)
        returns (uint[] memory amounts)
    {
        _requireValidPath(path[path.length - 1]); 
        amounts = HelixLibrary.getAmountsOut(_factory, amountIn, path);
        _requireGEQ(amounts[amounts.length - 1], amountOutMin);
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, HelixLibrary.pairFor(_factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(_WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
    }
    function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        payable
        onlyValidDeadline(deadline)
        returns (uint[] memory amounts)
    {
        _requireValidPath(path[0]);
        amounts = HelixLibrary.getAmountsIn(_factory, amountOut, path);
        _requireLEQ(amounts[0], msg.value);
        IWETH(_WETH).deposit{value: amounts[0]}();
        assert(IWETH(_WETH).transfer(HelixLibrary.pairFor(_factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
        // refund dust eth, if any
        if (msg.value > amounts[0]) TransferHelper.safeTransferETH(msg.sender, msg.value - amounts[0]);
    }

    // **** SWAP (supporting fee-on-transfer tokens) ****
    // requires the initial amount to have already been sent to the first pair
    function _swapSupportingFeeOnTransferTokens(address[] memory path, address _to) internal virtual {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = HelixLibrary.sortTokens(input, output);
            HelixPair pair = HelixPair(HelixLibrary.pairFor(_factory, input, output));
            uint amountInput;
            uint amountOutput;
            { // scope to avoid stack too deep errors
            (uint reserve0, uint reserve1,) = pair.getReserves();
            (uint reserveInput, uint reserveOutput) = input == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
            amountInput = IERC20(input).balanceOf(address(pair)) - reserveInput;
            amountOutput = HelixLibrary.getAmountOut(amountInput, reserveInput, reserveOutput, pair.swapFee());
            }
            
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOutput) : (amountOutput, uint(0));
            address to = i < path.length - 2 ? HelixLibrary.pairFor(_factory, output, path[i + 2]) : _to;
            pair.swap(amount0Out, amount1Out, to, new bytes(0));

            if (swapRewards != address(0)) {
                ISwapRewards(swapRewards).swap(msg.sender, input, output, amountOutput);
            }
        }
    }
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override onlyValidDeadline(deadline) {
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, HelixLibrary.pairFor(_factory, path[0], path[1]), amountIn
        );
        uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        _swapSupportingFeeOnTransferTokens(path, to);
        _requireGEQ(IERC20(path[path.length - 1]).balanceOf(to) - balanceBefore, amountOutMin);
    }
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    )
        external
        virtual
        override
        payable
        onlyValidDeadline(deadline)
    {
        _requireValidPath(path[0]);
        uint amountIn = msg.value;
        IWETH(_WETH).deposit{value: amountIn}();
        assert(IWETH(_WETH).transfer(HelixLibrary.pairFor(_factory, path[0], path[1]), amountIn));
        uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        _swapSupportingFeeOnTransferTokens(path, to);
        _requireGEQ(IERC20(path[path.length - 1]).balanceOf(to) - balanceBefore, amountOutMin);
    }
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    )
        external
        virtual
        override
        onlyValidDeadline(deadline)
    {
        _requireValidPath(path[path.length - 1]);
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, HelixLibrary.pairFor(_factory, path[0], path[1]), amountIn
        );
        _swapSupportingFeeOnTransferTokens(path, address(this));
        uint amountOut = IERC20(_WETH).balanceOf(address(this));
        _requireGEQ(amountOut, amountOutMin);
        IWETH(_WETH).withdraw(amountOut);
        TransferHelper.safeTransferETH(to, amountOut);
    }

    // **** LIBRARY FUNCTIONS ****
    function quote(uint amountA, uint reserveA, uint reserveB) public pure virtual override returns (uint amountB) {
        return HelixLibrary.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut, uint swapFee)
        public
        pure
        virtual
        returns (uint amountOut)
    {
        return HelixLibrary.getAmountOut(amountIn, reserveIn, reserveOut, swapFee);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut)
        external
        pure
        virtual
        override
        returns (uint amountOut)
    {
        return HelixLibrary.getAmountOut(amountIn, reserveIn, reserveOut, /*swapFee=*/0);
    }

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut, uint swapFee)
        public
        pure
        virtual
        returns (uint amountIn)
    {
        return HelixLibrary.getAmountIn(amountOut, reserveIn, reserveOut, swapFee);
    }

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut)
    public
    pure
    virtual
    override
    returns (uint amountIn)
    {
        return HelixLibrary.getAmountIn(amountOut, reserveIn, reserveOut, /*swapFee=*/0);
    }

    function getAmountsOut(uint amountIn, address[] memory path)
        public
        view
        virtual
        override
        returns (uint[] memory amounts)
    {
        return HelixLibrary.getAmountsOut(_factory, amountIn, path);
    }

    function getAmountsIn(uint amountOut, address[] memory path)
        external
        view
        virtual
        override
        returns (uint[] memory amounts)
    {
        return HelixLibrary.getAmountsIn(_factory, amountOut, path);
    }

    // require amount to be greater than or equal to min
    function _requireGEQ(uint256 amount, uint256 min) private pure {
        require(amount >= min, 'Router: insufficient amount');
    }

    function _requireLEQ(uint256 amount, uint256 max) private pure {
        require(amount <= max, 'Router: excessive amount');
    }

    function _requireValidPath(address path) private view {
        require(path == _WETH, 'Router: invalid path');
    }
}
