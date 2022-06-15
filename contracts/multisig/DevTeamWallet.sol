// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./MultiSigWallet.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// Receives and distributes developer payments and 
/// protects against unauthorized access with multisig
contract DevTeamWallet is MultiSigWallet {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error AlreadyADeveloper(address _developer);
    error ZeroBalance();

    address[] public developers;

    IERC20 public token;

    uint256 public numRequiredConfirmations;

    mapping(address => bool) public isDeveloper;
    mapping(address => uint256) public balances;

    event DeveloperWithdraw(address indexed _developer, uint256 indexed balance);

    constructor(
        address[] memory _owners, 
        address[] memory _developers, 
        address _token,
        uint256 _numConfirmationsRequired
    ) 
        MultiSigWallet(_owners, _numConfirmationsRequired)
    {
        if (_token == address(0)) revert ZeroAddress();

        for (uint256 i = 0; i < _developers.length; i++) {
            address developer = _developers[i];

            if (developer == address(0)) revert ZeroAddress();
            if (isDeveloper[developer]) revert AlreadyADeveloper(developer);

            isDeveloper[developer] = true;
            developers.push(developer);
        }

        token = IERC20(_token);
    }

    /// Called by a developer to withdraw their balance
    function developerWithdraw() external {
        uint256 balance = balances[msg.sender];
        if (balance == 0) revert ZeroBalance();

        balances[msg.sender] = 0;
        token.safeTransfer(msg.sender, balance);
       
        emit DeveloperWithdraw(msg.sender, balance);
    }

    /// Deposit _amount of _token to this contract
    function deposit(address _token, uint256 _amount) external {
        // TODO
    }

    /// Set the _percent of every deposit distributed to each _developer
    /// Requires multisig approval
    function setDeveloperPercents(
        address[] calldata _developers, 
        uint256[] calldata _percents
    ) external {
        // TODO
    }

    // Distribute deposit _amount to each developer based on that developer's percent
    function _distributeDeposit(uint256 _amount) private {
        // TODO
    }
}
