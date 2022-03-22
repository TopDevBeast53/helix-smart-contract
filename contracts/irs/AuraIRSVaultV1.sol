// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '../interfaces/IMasterChef.sol';

contract AuraVault is Ownable, Pausable {
    struct UserInfo {
        uint256 shares;                     // number of shares for a user
        uint256 lastDepositedTime;          // keeps track of deposited time for potential penalty
        uint256 auraAtLastUserAction;       // keeps track of aura deposited at the last user action
        uint256 lastUserActionTime;         // keeps track of the last user action time
    }

    IERC20 public immutable token;          // Aura token
    IERC20 public immutable receiptToken;   // TODO: check, is this auraLP?

    IMasterChef public immutable masterchef;

    mapping(address => UserInfo) public userInfo;

    uint256 public totalShares;
    uint256 public lastHarvestedTime;
    address public admin;
    address public treasury;

    uint256 public constant MAX_PERFORMANCE_FEE = 500;          // 5%
    uint256 public constant MAX_CALL_FEE = 100;                 // 1%
    uint256 public constant MAX_WITHDRAW_FEE = 100;             // 1%
    uint256 public constant MAX_WITHDRAW_FEE_PERIOD = 72 hours; // 3 days

    uint256 public performanceFee = 200;            // 2%
    uint256 public callFee = 25;                    // 0.25%
    uint256 public withdrawFee = 10;                // 0.1%
    uint256 public withdrawFeePeriod = 72 hours;    // 3 days

    event Deposit(address indexed sender, uint256 amount, uint256 shares, uint256 lastDepositedTime);
    event Withdraw(address indexed sender, uint256 amount, uint256 shares);
    event Harvest(address indexed sender, uint256 performanceFee, uint256 callFee);
    event Pause();
    event Unpause();

    /**
     * @notice Constructor
     * @param _token: Aura token contract
     * @param _receiptToken: Syrup token contract
     * @param _masterchef: MasterChef contract
     * @param _admin: address of the admin
     * @param _treasury: address of the treasury (collects fees)
     */
    constructor(
        IERC20 _token,
        IERC20 _receiptToken,
        IMasterChef _masterchef,
        address _admin,
        address _treasury
    ) {
        token = _token;
        receiptToken = _receiptToken;
        masterchef = _masterchef;
        admin = _admin;
        treasury = _treasury;

        // Infinite approve
        uint maxUint = 2 ** 256 - 1;
        IERC20(_token).approve(address(_masterchef), maxUint);
    }

    /**
     * @notice Checks if the msg.sender is the admin address
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, 'AuraVault: CALLER IS NOT ADMIN');
        _;
    }

    /**
     * @notice Checks if the msg.sender is a contract or a proxy
     */
    modifier notContract() {
        require(!_isContract(msg.sender), 'AuraVault: CALLER IS CONTRACT IS NOT ALLOWED');
        require(msg.sender == tx.origin, 'AuraVault: PROXY CONTRACT CALLER NOT ALLOWED');
        _;
    }

    /**
     * @notice Deposits funds into the Aura Vault
     * @dev Only possible when contract not paused.
     * @param _amount: number of tokens to deposit (in aura)
     */
    function deposit(uint256 _amount) external whenNotPaused notContract {
        require(_amount > 0, 'AuraVault: NOTHING TO DEPOSIT');

        uint256 pool = balanceOf();
        token.transferFrom(msg.sender, address(this), _amount);
        uint256 currentShares = 0;
        if (totalShares != 0) {
            currentShares = _amount * totalShares / pool;
        } else {
            currentShares = _amount;
        }
        UserInfo storage user = userInfo[msg.sender];

        user.shares += currentShares;
        user.lastDepositedTime = block.timestamp;

        totalShares += currentShares;

        user.auraAtLastUserAction = user.shares * balanceOf() / totalShares;
        user.lastUserActionTime = block.timestamp;

        _earn();

        emit Deposit(msg.sender, _amount, currentShares, block.timestamp);
    }

    /**
     * @notice Withdraws all funds for a user
     */
    function withdrawAll() external notContract {
        withdraw(userInfo[msg.sender].shares);
    }

    /**
     * @notice Reinvests aura tokens into MasterChef
     * @dev Only possible when contract not paused.
     */
    function harvest() external notContract whenNotPaused {
        IMasterChef(masterchef).leaveStaking(0);

        uint256 bal = available();
        uint256 currentPerformanceFee = bal * performanceFee / 10000;
        token.transfer(treasury, currentPerformanceFee);

        uint256 currentCallFee = bal * callFee / 10000;
        token.transfer(msg.sender, currentCallFee);

        _earn();

        lastHarvestedTime = block.timestamp;

        emit Harvest(msg.sender, currentPerformanceFee, currentCallFee);
    }

    /**
     * @notice Sets admin address
     * @dev Only callable by the contract owner.
     */
    function setAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), 'AuraVault: INVALID ADMIN ADDRESS');
        admin = _admin;
    }

    /**
     * @notice Sets treasury address
     * @dev Only callable by the contract owner.
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), 'AuraVault: INVALID TREASURY ADDRESS');
        treasury = _treasury;
    }

    /**
     * @notice Sets performance fee
     * @dev Only callable by the contract admin.
     */
    function setPerformanceFee(uint256 _performanceFee) external onlyAdmin {
        require(_performanceFee <= MAX_PERFORMANCE_FEE, 'AuraVault: performanceFee CANNOT BE GREATER THAN MAX_PERFORMANCE_FEE');
        performanceFee = _performanceFee;
    }

    /**
     * @notice Sets call fee
     * @dev Only callable by the contract admin.
     */
    function setCallFee(uint256 _callFee) external onlyAdmin {
        require(_callFee <= MAX_CALL_FEE, 'AuraVault: callFee CANNOT BE GREATER THAN MAX_CALL_FEE');
        callFee = _callFee;
    }

    /**
     * @notice Sets withdraw fee
     * @dev Only callable by the contract admin.
     */
    function setWithdrawFee(uint256 _withdrawFee) external onlyAdmin {
        require(_withdrawFee <= MAX_WITHDRAW_FEE, 'AuraVault: withdrawFee CANNOT BE GREATER THAN MAX_WITHDRAW_FEE');
        withdrawFee = _withdrawFee;
    }

    /**
     * @notice Sets withdraw fee period
     * @dev Only callable by the contract admin.
     */
    function setWithdrawFeePeriod(uint256 _withdrawFeePeriod) external onlyAdmin {
        require(
            _withdrawFeePeriod <= MAX_WITHDRAW_FEE_PERIOD,
            'AuraVault: withdrawFeePeriod CANNOT BE GREATER THAN MAX_WITHDRAW_FEE_PERIOD'
        );
        withdrawFeePeriod = _withdrawFeePeriod;
    }

    /**
     * @notice Withdraws from MasterChef to Vault without caring about rewards.
     * @dev EMERGENCY ONLY. Only callable by the contract admin.
     */
    function emergencyWithdraw() external onlyAdmin {
        IMasterChef(masterchef).emergencyWithdraw(0);
    }

    /**
     * @notice Withdraw unexpected tokens sent to the Aura Vault
     */
    function inCaseTokensGetStuck(address _token) external onlyAdmin {
        require(_token != address(token), 'AuraVault: TOKEN CANNOT BE SAME AS DEPOSIT TOKEN');
        require(_token != address(receiptToken), 'AuraVault: TOKEN CANNOT BE SAME AS RECEIPT TOKEN');

        uint256 amount = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(msg.sender, amount);
    }

    /**
     * @notice Triggers stopped state
     * @dev Only possible when contract not paused.
     */
    function pause() external onlyAdmin whenNotPaused {
        _pause();
        emit Pause();
    }

    /**
     * @notice Returns to normal state
     * @dev Only possible when contract is paused.
     */
    function unpause() external onlyAdmin whenPaused {
        _unpause();
        emit Unpause();
    }

    /**
     * @notice Calculates the expected harvest reward from third party
     * @return Expected reward to collect in aura
     */
    function calculateHarvestAuraRewards() external view returns (uint256) {
        uint256 amount = IMasterChef(masterchef).pendingAuraToken(0, address(this));
        amount += available();
        uint256 currentCallFee = amount * callFee / 10000;

        return currentCallFee;
    }

    /**
     * @notice Calculates the total pending rewards that can be restaked
     * @return Returns total pending aura rewards
     */
    function calculateTotalPendingAuraRewards() external view returns (uint256) {
        uint256 amount = IMasterChef(masterchef).pendingAuraToken(0, address(this));
        amount += available();

        return amount;
    }

    /**
     * @notice Calculates the price per share
     */
    function getPricePerFullShare() external view returns (uint256) {
        return totalShares == 0 ? 1e18 : balanceOf() * 1e18 / totalShares;
    }

    /**
     * @notice Withdraws from funds from the Aura Vault
     * @param _shares: Number of shares to withdraw
     */
    function withdraw(uint256 _shares) public notContract {
        UserInfo storage user = userInfo[msg.sender];
        require(_shares > 0, 'AuraVault: NOTHING TO WITHDRAW');
        require(_shares <= user.shares, 'AuraVault: WITHDRAW AMOUNT EXCEEDS BALANCE');

        uint256 currentAmount = balanceOf() * _shares / totalShares;
        user.shares -= _shares;
        totalShares -= _shares;

        uint256 bal = available();
        if (bal < currentAmount) {
            uint256 balWithdraw = currentAmount - bal;
            IMasterChef(masterchef).leaveStaking(balWithdraw);
            uint256 balAfter = available();
            uint256 diff = balAfter - bal;
            if (diff < balWithdraw) {
                currentAmount = bal + diff;
            }
        }

        if (block.timestamp < user.lastDepositedTime + withdrawFeePeriod) {
            uint256 currentWithdrawFee = currentAmount * withdrawFee / 10000;
            token.transfer(treasury, currentWithdrawFee);
            currentAmount -= currentWithdrawFee;
        }

        if (user.shares > 0) {
            user.auraAtLastUserAction = user.shares * balanceOf() / totalShares;
        } else {
            user.auraAtLastUserAction = 0;
        }

        user.lastUserActionTime = block.timestamp;

        token.transfer(msg.sender, currentAmount);

        emit Withdraw(msg.sender, currentAmount, _shares);
    }

    /**
     * @notice Custom logic for how much the vault allows to be borrowed
     * @dev The contract puts 100% of the tokens to work.
     */
    function available() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @notice Calculates the total underlying tokens
     * @dev It includes tokens held by the contract and held in MasterChef
     */
    function balanceOf() public view returns (uint256) {
        (uint256 amount, ) = IMasterChef(masterchef).userInfo(0, address(this));
        return token.balanceOf(address(this)) + amount;
    }

    /**
     * @notice Deposits tokens into MasterChef to earn staking rewards
     */
    function _earn() internal {
        uint256 bal = available();
        if (bal > 0) {
            IMasterChef(masterchef).enterStaking(bal);
        }
    }

    /**
     * @notice Checks if address is a contract
     * @dev It prevents contract from being targetted
     */
    function _isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
}
