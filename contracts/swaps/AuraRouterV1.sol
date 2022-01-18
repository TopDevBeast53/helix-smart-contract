// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import './AuraPair.sol';
import '../libraries/AuraLibrary.sol';
import '../interfaces/IAuraV2Router02.sol';
import '../interfaces/IAuraSwapFeeReward.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import "@rari-capital/solmate/src/utils/SafeTransferLib.sol";
import '@uniswap/v2-periphery/contracts/interfaces/IWETH.sol';
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";

contract AuraRouterV1 is IAuraV2Router02, Ownable {

    address public immutable _factory;
    address public immutable _WETH;
    address public swapFeeReward;

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'AuraRouterV1: EXPIRED');
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

    function setSwapFeeReward(address _swapFeeReward) public onlyOwner {
        swapFeeReward = _swapFeeReward;
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
        (uint reserveA, uint reserveB) = AuraLibrary.getReserves(_factory, tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = AuraLibrary.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, 'AuraRouterV1: INSUFFICIENT_B_AMOUNT');
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = AuraLibrary.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, 'AuraRouterV1: INSUFFICIENT_A_AMOUNT');
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
    ) external virtual override ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        // address pair = AuraLibrary.pairFor(_factory, tokenA, tokenB);
        // SafeTransferLib.safeTransferFrom(ERC20(tokenA), msg.sender, pair, amountA);
        // SafeTransferLib.safeTransferFrom(ERC20(tokenB), msg.sender, pair, amountB);
        // liquidity = AuraPair(pair).mint(to);
    }
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external virtual override payable ensure(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
        (amountToken, amountETH) = _addLiquidity(
            token,
            _WETH,
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountETHMin
        );
        address pair = AuraLibrary.pairFor(_factory, token, _WETH);
        SafeTransferLib.safeTransferFrom(ERC20(token), msg.sender, pair, amountToken);
        IWETH(_WETH).deposit{value: amountETH}();
        assert(IWETH(_WETH).transfer(pair, amountETH));
        liquidity = AuraPair(pair).mint(to);
        // refund dust eth, if any
        if (msg.value > amountETH) SafeTransferLib.safeTransferETH(msg.sender, msg.value - amountETH);
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
    ) public virtual override ensure(deadline) returns (uint amountA, uint amountB) {
        address pair = AuraLibrary.pairFor(_factory, tokenA, tokenB);
        AuraPair(pair).transferFrom(msg.sender, pair, liquidity); // send liquidity to pair
        (uint amount0, uint amount1) = AuraPair(pair).burn(to);
        (address token0,) = AuraLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, 'AuraRouterV1: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'AuraRouterV1: INSUFFICIENT_B_AMOUNT');
    }
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountToken, uint amountETH) {
        (amountToken, amountETH) = removeLiquidity(
            token,
            _WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        SafeTransferLib.safeTransfer(ERC20(token), to, amountToken);
        IWETH(_WETH).withdraw(amountETH);
        SafeTransferLib.safeTransferETH(to, amountETH);
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
        address pair = AuraLibrary.pairFor(_factory, tokenA, tokenB);
        uint value = approveMax ? type(uint).max : liquidity;
        AuraPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
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
        address pair = AuraLibrary.pairFor(_factory, token, _WETH);
        uint value = approveMax ? type(uint).max : liquidity;
        AuraPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
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
    ) public virtual override ensure(deadline) returns (uint amountETH) {
        (, amountETH) = removeLiquidity(
            token,
            _WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        SafeTransferLib.safeTransfer(ERC20(token), to, IERC20(token).balanceOf(address(this)));
        IWETH(_WETH).withdraw(amountETH);
        SafeTransferLib.safeTransferETH(to, amountETH);
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
        address pair = AuraLibrary.pairFor(_factory, token, _WETH);
        uint value = approveMax ? type(uint).max : liquidity;
        AuraPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        amountETH = removeLiquidityETHSupportingFeeOnTransferTokens(
            token, liquidity, amountTokenMin, amountETHMin, to, deadline
        );
    }

    // **** SWAP ****
    // requires the initial amount to have already been sent to the first pair
    function _swap(uint[] memory amounts, address[] memory path, address _to) internal virtual {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = AuraLibrary.sortTokens(input, output);
            uint amountOut = amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
            if (swapFeeReward != address(0)) {
                IAuraSwapFeeReward(swapFeeReward).swap(msg.sender, input, output, amountOut);
            }
            address to = i < path.length - 2 ? AuraLibrary.pairFor(_factory, output, path[i + 2]) : _to;
            AuraPair(AuraLibrary.pairFor(_factory, input, output)).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );
        }
    }
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint[] memory amounts) {
        amounts = AuraLibrary.getAmountsOut(_factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'AuraRouterV1: INSUFFICIENT_OUTPUT_AMOUNT');
        SafeTransferLib.safeTransferFrom(
            ERC20(path[0]), msg.sender, AuraLibrary.pairFor(_factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint[] memory amounts) {
        amounts = AuraLibrary.getAmountsIn(_factory, amountOut, path);
        require(amounts[0] <= amountInMax, 'AuraRouterV1: EXCESSIVE_INPUT_AMOUNT');
        SafeTransferLib.safeTransferFrom(
            ERC20(path[0]), msg.sender, AuraLibrary.pairFor(_factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        payable
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[0] == _WETH, 'AuraRouterV1: INVALID_PATH');
        amounts = AuraLibrary.getAmountsOut(_factory, msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'AuraRouterV1: INSUFFICIENT_OUTPUT_AMOUNT');
        IWETH(_WETH).deposit{value: amounts[0]}();
        assert(IWETH(_WETH).transfer(AuraLibrary.pairFor(_factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
    }
    function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[path.length - 1] == _WETH, 'AuraRouterV1: INVALID_PATH');
        amounts = AuraLibrary.getAmountsIn(_factory, amountOut, path);
        require(amounts[0] <= amountInMax, 'AuraRouterV1: EXCESSIVE_INPUT_AMOUNT');
        SafeTransferLib.safeTransferFrom(
            ERC20(path[0]), msg.sender, AuraLibrary.pairFor(_factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(_WETH).withdraw(amounts[amounts.length - 1]);
        SafeTransferLib.safeTransferETH(to, amounts[amounts.length - 1]);
    }
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[path.length - 1] == _WETH, 'AuraRouterV1: INVALID_PATH');
        amounts = AuraLibrary.getAmountsOut(_factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'AuraRouterV1: INSUFFICIENT_OUTPUT_AMOUNT');
        SafeTransferLib.safeTransferFrom(
            ERC20(path[0]), msg.sender, AuraLibrary.pairFor(_factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(_WETH).withdraw(amounts[amounts.length - 1]);
        SafeTransferLib.safeTransferETH(to, amounts[amounts.length - 1]);
    }
    function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        payable
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[0] == _WETH, 'AuraRouterV1: INVALID_PATH');
        amounts = AuraLibrary.getAmountsIn(_factory, amountOut, path);
        require(amounts[0] <= msg.value, 'AuraRouterV1: EXCESSIVE_INPUT_AMOUNT');
        IWETH(_WETH).deposit{value: amounts[0]}();
        assert(IWETH(_WETH).transfer(AuraLibrary.pairFor(_factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
        // refund dust eth, if any
        if (msg.value > amounts[0]) SafeTransferLib.safeTransferETH(msg.sender, msg.value - amounts[0]);
    }

    // **** SWAP (supporting fee-on-transfer tokens) ****
    // requires the initial amount to have already been sent to the first pair
    function _swapSupportingFeeOnTransferTokens(address[] memory path, address _to) internal virtual {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = AuraLibrary.sortTokens(input, output);
            AuraPair pair = AuraPair(AuraLibrary.pairFor(_factory, input, output));
            uint amountInput;
            uint amountOutput;
            { // scope to avoid stack too deep errors
            (uint reserve0, uint reserve1,) = pair.getReserves();
            (uint reserveInput, uint reserveOutput) = input == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
            amountInput = IERC20(input).balanceOf(address(pair)) - reserveInput;
            amountOutput = AuraLibrary.getAmountOut(amountInput, reserveInput, reserveOutput, pair.swapFee());
            }
            if (swapFeeReward != address(0)) {
                IAuraSwapFeeReward(swapFeeReward).swap(msg.sender, input, output, amountOutput);
            }
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOutput) : (amountOutput, uint(0));
            address to = i < path.length - 2 ? AuraLibrary.pairFor(_factory, output, path[i + 2]) : _to;
            pair.swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) {
        SafeTransferLib.safeTransferFrom(
            ERC20(path[0]), msg.sender, AuraLibrary.pairFor(_factory, path[0], path[1]), amountIn
        );
        uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        _swapSupportingFeeOnTransferTokens(path, to);
        require(
            IERC20(path[path.length - 1]).balanceOf(to) - balanceBefore >= amountOutMin,
            'AuraRouterV1: INSUFFICIENT_OUTPUT_AMOUNT'
        );
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
        ensure(deadline)
    {
        require(path[0] == _WETH, 'AuraRouterV1: INVALID_PATH');
        uint amountIn = msg.value;
        IWETH(_WETH).deposit{value: amountIn}();
        assert(IWETH(_WETH).transfer(AuraLibrary.pairFor(_factory, path[0], path[1]), amountIn));
        uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        _swapSupportingFeeOnTransferTokens(path, to);
        require(
            IERC20(path[path.length - 1]).balanceOf(to) - balanceBefore >= amountOutMin,
            'AuraRouterV1: INSUFFICIENT_OUTPUT_AMOUNT'
        );
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
        ensure(deadline)
    {
        require(path[path.length - 1] == _WETH, 'AuraRouterV1: INVALID_PATH');
        SafeTransferLib.safeTransferFrom(
            ERC20(path[0]), msg.sender, AuraLibrary.pairFor(_factory, path[0], path[1]), amountIn
        );
        _swapSupportingFeeOnTransferTokens(path, address(this));
        uint amountOut = IERC20(_WETH).balanceOf(address(this));
        require(amountOut >= amountOutMin, 'AuraRouterV1: INSUFFICIENT_OUTPUT_AMOUNT');
        IWETH(_WETH).withdraw(amountOut);
        SafeTransferLib.safeTransferETH(to, amountOut);
    }

    // **** LIBRARY FUNCTIONS ****
    function quote(uint amountA, uint reserveA, uint reserveB) public pure virtual override returns (uint amountB) {
        return AuraLibrary.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut, uint swapFee)
        public
        pure
        virtual
        returns (uint amountOut)
    {
        return AuraLibrary.getAmountOut(amountIn, reserveIn, reserveOut, swapFee);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut)
        external
        pure
        virtual
        override
        returns (uint amountOut)
    {
        return AuraLibrary.getAmountOut(amountIn, reserveIn, reserveOut, /*swapFee=*/0);
    }

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut, uint swapFee)
        public
        pure
        virtual
        returns (uint amountIn)
    {
        return AuraLibrary.getAmountIn(amountOut, reserveIn, reserveOut, swapFee);
    }

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut)
    public
    pure
    virtual
    override
    returns (uint amountIn)
    {
        return AuraLibrary.getAmountIn(amountOut, reserveIn, reserveOut, /*swapFee=*/0);
    }

    function getAmountsOut(uint amountIn, address[] memory path)
        public
        view
        virtual
        override
        returns (uint[] memory amounts)
    {
        return AuraLibrary.getAmountsOut(_factory, amountIn, path);
    }

    function getAmountsIn(uint amountOut, address[] memory path)
        external
        view
        virtual
        override
        returns (uint[] memory amounts)
    {
        return AuraLibrary.getAmountsIn(_factory, amountOut, path);
    }
}