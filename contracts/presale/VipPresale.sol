// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';

contract VipPresale is Ownable {
    /*
     * Phase determines ticket purchases and sales by whitelisted users 
     * Phase 0: is the default on contract creation
     *          purchases are prohibited
     *          sales are prohibited
     * Phase 1: is set by the owner
     *          purchases are limited by a user's `maxTickets` 
     *          sales are prohibited
     * Phase 2: is automatically set 24 hours after the start of Phase 1
     *          purchases are unlimited
     *          sales are limited by subPhase 
     */
    uint public MAX_PHASE;
    uint public phase;
    uint public phaseStartTimestamp;
    uint public PHASE_DURATION;
    
    /* 
     * SubPhase determines ticket sales by whitelisted users during Phase 2
     * SubPhase 0: sales are prohibited
     * SubPhase 1: users may sell up to 25% of their purchased tickets
     * SubPhase 2: users may sell up to 50% of their purchased tickets
     * SubPhase 3: users may sell up to 75% of their purchased tickets
     * SubPhase 4: users may sell up to 100% of their purchased tickets
     * 
     * SubPhase 0 begins simultaneously with the start of Phase 2
     * Subsequent subPhases begin 3 months after the start of the previous subPhase
     */
    uint public MAX_SUB_PHASE;
    uint public subPhase;
    uint public subPhaseStartTimestamp;
    uint public SUB_PHASE_DURATION;
  
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

    event SetPhase(uint phase, uint timestamp);
    event SetSubPhase(uint subPhase, uint timestamp);

    modifier isValidPhase(uint _phase) {
        require(_phase <= MAX_PHASE, "VipPresale: PHASE CAN'T BE GREATER THAN MAX_PHASE");
        _;
    }

    modifier isValidSubPhase(uint _subPhase) {
        require(_subPhase <= MAX_SUB_PHASE, "VipPresale: SUB PHASE CAN'T BE GREATER THAN MAX_SUB_PHASE");
        _;
    }

    modifier isValidUser(address user) {
        require(user != address(0), "VipPresale: INVALID USER ADDRESS");
        _;
    }

    modifier isValidMaxTickets(uint maxTickets) {
        require(maxTickets <= ticketsAvailable, "VipPresale: MAX TICKETS CAN'T BE GREATER THAN TICKETS AVAILABLE");
        _;
    }

    constructor() {
        MAX_PHASE = 2;
        MAX_SUB_PHASE = 4;
        MAX_TICKETS = 50000;
        PHASE_DURATION = 1 days;
        SUB_PHASE_DURATION = 91 days;   // (91 days ~= 3 months) and (91 days * 4 ~= 1 year)
    }

    // called periodically and, if sufficient time has elapsed, update the phase
    function updatePhase() private {
        if (phase < MAX_PHASE && block.timestamp >= phaseStartTimestamp + PHASE_DURATION) {
            _setPhase(phase + 1);
        }
    }

    // used externally to update from phase 0 to phase 1
    // and should only ever be called to set phase == 1
    function setPhase(uint _phase) external onlyOwner isValidPhase(_phase) {
        _setPhase(_phase);
        _setSubPhase(0);    // extend functionality to more than 2 phases, each with their own subPhases
    }

    // used internally to update from phase 1 to phase 2
    function _setPhase(uint _phase) private {
        phase = _phase;
        phaseStartTimestamp = block.timestamp;
        emit SetPhase(_phase, phaseStartTimestamp);
    }

    // called periodically and, if sufficient time has elapsed, update the subPhase
    function updateSubPhase() private {
        if (phase > 1) {
            if (subPhase < MAX_SUB_PHASE && block.timestamp >= subPhaseStartTimestamp + SUB_PHASE_DURATION) {
                _setSubPhase(subPhase + 1);
            }
        }
    }

    // should never be needed but exists to provide functionality for
    // manually setting the subphase
    function setSubPhase(uint _subPhase) external onlyOwner isValidSubPhase(_subPhase) {
        _setSubPhase(_subPhase);
    }

    // used internally during phase 2 to update sub-phases
    function _setSubPhase(uint _subPhase) private {
        subPhase = _subPhase;
        subPhaseStartTimestamp = block.timestamp;
        emit SetSubPhase(_subPhase, subPhaseStartTimestamp);
    }

    // grant `user` permission to purchase up to `maxTickets`, phase dependent
    function whitelistAdd(address user, uint maxTickets) 
        external 
        onlyOwner 
        isValidUser(user)
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
}
