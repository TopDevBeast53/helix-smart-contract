// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import '@rari-capital/solmate/src/tokens/ERC20.sol';
import "@rari-capital/solmate/src/utils/ReentrancyGuard.sol";
import "../interfaces/IAuraToken.sol";

contract Voting is ReentrancyGuard{
    
    IAuraToken private auraToken;

    // structure for a single proposal.
    struct Proposal {
        bytes32 name;                           // proposal short name
        address creator;                        // creator's address
        uint blockNum;                          // when the proposal was created
        mapping(address => uint8) decisions;   // decisions[voterAddr] == 1 -> YES, decisions[voterAddr] == 2 -> NO
        address[] voters;                       // array of voters
        mapping(address => uint) balance;       // balance of deposited aura token for each voter into the given proposal
    }
    
    // number of proposals
    uint public numProposals;
    // map for proposals by index
    mapping (uint => Proposal) public proposals;

    event CreateProposal(bytes32 proposalName);

    // constructor that create a new Voting to choose one of `proposalNames`.
    constructor(IAuraToken _auraToken) {
        auraToken = _auraToken;
    }

    //External functions --------------------------------------------------------------------------------------------
    
    /**
     * @dev Create proposal
     */
    function createProposal(bytes32 proposalName) external {
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
        require(_proposal.decisions[voter] > 0, "Already voted");
        require(decision < 3, "Wrong decision number");
        
        if (withTokenAmount > 0) { 
            ERC20(address(auraToken)).transferFrom(voter, address(this), withTokenAmount);
        }
        _proposal.voters.push(voter);
        _proposal.balance[voter] += withTokenAmount;
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