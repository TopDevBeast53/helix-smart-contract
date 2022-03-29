// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract VipPresale {
    // The token being sold
    IERC20 public token;

    /*
     * Phase determines ticket purchases and sales by whitelisted users 
     * Phase 0: is the default on contract creation
     *          purchases are prohibited
     *          sales are prohibited
     * Phase 1: manually set by the owner, starts phase sequence
     *          purchases are limited by a user's `maxTickets` 
     *          sales are prohibited
     * Phase 2: is automatically set 24 hours after the start of Phase 1
     *          purchases are unlimited
     *          sales are limited by subPhase 
     */
    uint public MAX_PHASE;              // Highest phase attainable
    uint public START_PHASE;            // Phase which starts automatic sequence
    uint public phase;                  // Current phase
    uint public phaseEndTimestamp;      // End timestamp after which the current phase has ended
    uint public PHASE_DURATION;         // Length of time for a phase
    
    /* 
     * SubPhase determines ticket sales by whitelisted users during Phase 2
     * SubPhase 0: default on contract creation, nothing happens
     * SubPhase 1: started manually by the owner, starts subPhase sequence
     * SubPhase 2: users may sell up to 25% of their purchased tickets
     * SubPhase 3: users may sell up to 50% of their purchased tickets
     * SubPhase 4: users may sell up to 75% of their purchased tickets
     * SubPhase 5: users may sell up to 100% of their purchased tickets
     * 
     * After subPhase 1, subsequent subPhases automatically begin `SUB_PHASE_DURATION` 
     * after the start of the previous subPhase
     */
    uint public MAX_SUB_PHASE;          // Highest subPhase attainable
    uint public START_SUB_PHASE;        // SubPhase which starts automatic sequence
    uint public subPhase;               // Current subPhase
    uint public subPhaseEndTimestamp;   // End timestamp after which the current subPhase has ended
    uint public SUB_PHASE_DURATION;     // Lenght of time for a subPhase
  
    // Maximum number of tickets available for purchase at the start of the sale
    uint public MAX_TICKETS;

    // Unsold tickets available for purchase
    // ticketsAvailable = MAX_TICKETS - (sum(user.purchased) for user in whitelist)
    // where user.purchased is in range [0, user.maxTickets] for user in whitelist
    uint public ticketsAvailable;

    // Unsold tickets out of the maximum that have been reserved to users
    // Used to prevent promising more tickets to users than are available
    // ticketsReserved = (sum(user.maxTickets) for user in whitelist)
    // and ticketsReserved <= ticketsAvailable <= MAX_TICKETS
    uint public ticketsReserved;

    struct User {
        uint maxTickets;        // sets phase 1 upper limit on ticket purchases
        uint purchased;         // tickets purchased <= maxTickets
        uint balance;           // tickets purchased but not withdrawn
    }
    mapping(address => User) public users;
    
    // true if user can purchase tickets and false otherwise
    mapping(address => bool) public whitelist;

    // Owners who can whitelist
    address[] private owners;
    mapping(address => bool) public isOwner;


    event SetPhase(uint phase, uint startTimestamp, uint endTimestamp);
    event SetSubPhase(uint subPhase, uint startTimestamp, uint endTimestamp);

    modifier isValidPhase(uint _phase) {
        require(_phase <= MAX_PHASE, "VipPresale: PHASE CAN'T BE GREATER THAN MAX_PHASE");
        _;
    }

    modifier isValidSubPhase(uint _subPhase) {
        require(_subPhase <= MAX_SUB_PHASE, "VipPresale: SUB PHASE CAN'T BE GREATER THAN MAX_SUB_PHASE");
        _;
    }

    modifier isValidAddress(address _address) {
        require(_address != address(0), "VipPresale: INVALID ADDRESS");
        _;
    }

    modifier isValidMaxTickets(uint maxTickets) {
        require(maxTickets <= ticketsAvailable, "VipPresale: MAX TICKETS CAN'T BE GREATER THAN TICKETS AVAILABLE");
        _;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "VipPresale: CALLER IS NOT OWNER");
        _;
    }

    constructor(address _token) {
        token = IERC20(_token);

        isOwner[msg.sender] = true;
        owners.push(msg.sender);

        MAX_PHASE = 2;
        START_PHASE = 1;
        PHASE_DURATION = 1 days;

        MAX_SUB_PHASE = 5;
        START_SUB_PHASE = 1;
        SUB_PHASE_DURATION = 91 days;   // (91 days ~= 3 months) and (91 days * 4 ~= 1 year)

        MAX_TICKETS = 50000;
    }

    // called periodically and, if sufficient time has elapsed, update the phase
    function updatePhase() private {
        if (phase >= START_PHASE) {
            if (phase < MAX_PHASE && block.timestamp >= phaseEndTimestamp) {
                _setPhase(phase + 1);
            }
        }
    }

    // used externally to update from phase 0 to phase 1
    // should only ever be called to set phase == 1
    function setPhase(uint _phase) external onlyOwner isValidPhase(_phase) {
        _setPhase(_phase);
    }

    // used internally to update phases
    function _setPhase(uint _phase) private {
        phase = _phase;
        phaseEndTimestamp = block.timestamp + PHASE_DURATION;
        emit SetPhase(_phase, block.timestamp, phaseEndTimestamp);
    }

    // called periodically and, if sufficient time has elapsed, update the subPhase
    function updateSubPhase() private {
        if (subPhase >= START_SUB_PHASE) {
            if (subPhase < MAX_SUB_PHASE && block.timestamp >= subPhaseEndTimestamp) {
                _setSubPhase(subPhase + 1);
            }
        }
    }

    // used externally to update from subPhase 0 to subPhase 1
    // should only ever be called to set subPhase == 1
    function setSubPhase(uint _subPhase) external onlyOwner isValidSubPhase(_subPhase) {
        _setSubPhase(_subPhase);
    }

    // used internally to update subPhases
    function _setSubPhase(uint _subPhase) private {
        subPhase = _subPhase;
        subPhaseEndTimestamp = block.timestamp + SUB_PHASE_DURATION;
        emit SetSubPhase(_subPhase, block.timestamp, subPhaseEndTimestamp);
    }
    
    // TODO - waiting on discord response for uint vs uint[] maxTickets
    // function whitelistAdd(address[] users, uint[] maxTickets)

    // grant `user` permission to purchase up to `maxTickets`, phase dependent
    function whitelistAdd(address user, uint maxTickets) 
        external 
        onlyOwner 
        isValidAddress(user)
        isValidMaxTickets(maxTickets) 
    {
        require(!whitelist[user], "VipPresale: USER IS ALREADY WHITELISTED");
        whitelist[user] = true;
        users[user].maxTickets = maxTickets;
    }

    // revoke `user` permission to purchase tickets
    function whitelistRemove(address user) external onlyOwner {
        // prohibit a whitelisted user from buying tickets
        // but not from withdrawing those they've already purchased
        whitelist[user] = false; 
    }

    // add a new owner to the contract, only callable by an existing owner
    function addOwner(address owner) external isValidAddress(owner) onlyOwner {
        require(!isOwner[owner], "VipPresale: ALREADY AN OWNER");
        isOwner[owner] = true;
        owners.push(owner);
    }
}
