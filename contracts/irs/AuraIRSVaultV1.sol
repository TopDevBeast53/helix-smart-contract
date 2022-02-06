// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../staking/MasterChef.sol";
import "../tokens/AuraToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AuraIRSVaultV1 is Ownable {

    MasterChef masterChef;
    AuraToken  auraToken;

    struct DepositWithdrawCheckpoint {
        uint256 balance;
        uint256 auraRewards;
    }

    struct Offer {
        uint256 duration;
        address lpToken;
        uint256 annualPctRequested;
    }

    struct Deal {
        uint256 dealEndTimestamp;
        address rewardsGiver;
        address rewardsReceiver;
        address lpToken;
        uint256 lpTokenAmount;
    }

    Deal[] public deals;

    // User Address -> List of Active Deals where the user is a giver
    mapping(address => uint64[]) public activeDealsGiver;

    // User Address -> List of Active Deals where the user is a receiver
    mapping(address => uint64[]) public activeDealsReceiver;

    // LP Token Address -> Deposited Amount
    mapping(address => uint256) public balance;

    // LP Token Address -> List of All Checkpoints for a particular LP Token
    mapping(address => DepositWithdrawCheckpoint[]) public checkpoints;

    // User Address -> LP Token Address -> Deposited Amount
    mapping(address => mapping(address => uint256)) public userBalance;

    // User Address -> LP Token Address List
    mapping(address => address[]) public userTokens;

    function deposit(uint256 _pid, uint256 _amount) external {
        require(_pid < masterChef.poolLength(), "[]");
        
        // Load the LP token from the MasterChef
        (IERC20 lpToken,,,) = masterChef.poolInfo(_pid);
        // Transfer the LP token from the user's wallet into IRSVault
        TransferHelper.safeTransferFrom(address(lpToken), address(msg.sender), address(this), _amount);

        // Allow MasterChef to load the token from IRSVault
        lpToken.approve(address(masterChef), _amount);

        // IMPORTANT
        // Before deposit into MasterChef, we must measure how much Aura rewards we had
        // because if we have something already farming in MasterChef, it would spit out
        // some rewards.
        uint256 auraBalanceBeforeDeposit = auraToken.balanceOf(address(this));

        // Do the deposit into MasterChef
        masterChef.deposit(_pid, _amount);

        // Calculate how much rewards we have withdrawn on deposit
        uint256 auraRewardsOnDeposit = auraToken.balanceOf(address(this)) - auraBalanceBeforeDeposit;

        // We must now make a checkpoint
        checkpoints[address(lpToken)].push(DepositWithdrawCheckpoint({
            balance: balance[address(lpToken)],
            auraRewards: auraRewardsOnDeposit
        }));

        // Now, it's time to update the balance of how much of a particular LP we
        // are managing now
        balance[address(lpToken)] = balance[address(lpToken)] + _amount;

        // Record the user's deposited balance
        userBalance[msg.sender][address(lpToken)] = userBalance[msg.sender][address(lpToken)] + _amount;
        if (userBalance[msg.sender][address(lpToken)] == _amount) {
            userTokens[msg.sender].push(address(lpToken));
        }
    }

    function getLpTokenDollarValue(address lpToken, uint256 amount) public view returns (uint256) {
        
    }
}