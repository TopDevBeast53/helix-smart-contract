// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@rari-capital/solmate/src/utils/ReentrancyGuard.sol";
import "../tokens/AuraToken.sol";

contract Voting is ReentrancyGuard{
    
    AuraToken private auraToken;

    // structure for a single proposal.
    struct Proposal {
        bytes32 name;                           // proposal short name
        address creator;                        // creator's address
        uint blockNum;                          // when the proposal was created
        uint endTimestamp;                      // a timestamp for when the voting ends 
        mapping(address => uint8) decisions;    // decisions[voterAddr] == 1 -> YES, decisions[voterAddr] == 2 -> NO
        address[] voters;                       // array of voters
        mapping(address => uint) balance;       // balance of deposited aura token for each voter into the given proposal
        mapping(address => uint) withdrawAfterEnd;// withdraw amount for each voter after end of voting
    }
    
    // number of proposals
    uint public numProposals;
    // map for proposals by index
    mapping (uint => Proposal) public proposals;

    event CreateProposal(bytes32 proposalName);

    // constructor that create a new Voting to choose one of `proposalNames`.
    constructor(AuraToken _auraToken) {
        auraToken = _auraToken;
    }

    //External functions --------------------------------------------------------------------------------------------
    
    /**
     * @dev Create proposal
     *
     * Requirements:
     * - EndTimestamp should be later from now.
     */
    function createProposal(bytes32 proposalName, uint endTimestamp) external {
        require(endTimestamp > block.timestamp, "Input wrong timestamp");
        Proposal storage p = proposals[numProposals++];
        p.name = proposalName;
        p.creator = msg.sender;
        p.blockNum = block.number;

        emit CreateProposal(proposalName);
    }

    /**
     * @dev Voting
     *
     * Requirements:
     * - Check that add msg.sender twice for the same proposalId.
     * - Decision can be value of 1(Yes) or 2(No)
     */
    function vote(uint proposalId, uint withTokenAmount, uint8 decision) external nonReentrant {
        address voter = msg.sender;
        Proposal storage _proposal = proposals[proposalId];
        require(block.timestamp < _proposal.endTimestamp, "Voting is over");
        require(_proposal.decisions[voter] == 0, "Already voted");
        require(decision > 0 && decision < 3, "Wrong decision number");
        
        if (withTokenAmount > 0) { 
            auraToken.transferFrom(voter, address(this), withTokenAmount);
            _proposal.balance[voter] += withTokenAmount;
        }
        _proposal.voters.push(voter);
        _proposal.decisions[voter] = decision;
    }

    /**
     * @dev Calculating the result of voting
     */
    function resultProposal(uint proposalId) external view returns (uint, uint)
    {
        uint numVoters = proposals[proposalId].voters.length;
        uint yesVotes = 0;
        uint noVotes = 0;
        for (uint i = 0; i < numVoters; i++) {
            address voterAddr = proposals[proposalId].voters[i];
            uint votes = getNumberOfVotes(voterAddr, proposalId);
            uint decision = proposals[proposalId].decisions[voterAddr];
            if (decision == 1) {
                yesVotes += votes;
            } else {
                noVotes += votes;
            }
        }
        return (yesVotes, noVotes);
    }

    /**
     * @dev withdraw for each voter from the given proposal
     *
     * Requirements:
     * - Check if voter can withdraw with amount.
     *     The amount should be less than balance - withdrawAfterEnd which sums up when user withdraw after end of voting.
     *     So withdrawAfterEnd before end of voting is 0.
     */
    function withdraw(uint proposalId, uint amount) external {
        address voter = msg.sender;
        Proposal storage _proposal = proposals[proposalId];
        require(amount > 0 && _proposal.balance[voter] - _proposal.withdrawAfterEnd[voter] >= amount, "Wrong withdraw amount");
        auraToken.transferFrom(address(this), voter, amount);
        if (block.timestamp < _proposal.endTimestamp) {
            _proposal.balance[voter] -= amount;
        } else {
            _proposal.withdrawAfterEnd[voter] += amount;
        }
    }

    //Public functions --------------------------------------------------------------------------------------------

    /**
     * @dev Get the number of votes by `voter`
     *
     * NOTE: AuraToken's PriorVotes + deposited balance to proposal
     */
    function getNumberOfVotes(address voter, uint proposalId) public view returns (uint) {
        return auraToken.getPriorVotes(voter, proposals[proposalId].blockNum) + proposals[proposalId].balance[voter];
    }
}