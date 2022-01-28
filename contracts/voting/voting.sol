// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import '@rari-capital/solmate/src/tokens/ERC20.sol';
import "@rari-capital/solmate/src/utils/ReentrancyGuard.sol";

contract Voting is ReentrancyGuard{
    
    // structure for a voter
    struct Voter {
        bool hasRight;  // if true, that person has a right so he/she can do voting
        bool voted;     // if true, that person already voted
        uint vote;      // index of the voted proposal
    }

    // structure for a single proposal.
    struct Proposal {
        bytes32 name;       // short name (up to 32 bytes)
        uint voteAmount;    // number of accumulated amount
    }

    // address of chair
    address public chairAddress;
    // map that stores a `Voter` struct for each user address.
    mapping(address => Voter) public voters;
    // dynamically-sized array of `Proposal` structs.
    Proposal[] public proposals;
    // count voteAmount with this token balanced of voter, e.g. AuraToken
    address public countToken;

    // constructor that create a new Voting to choose one of `proposalNames`.
    constructor(bytes32[] memory proposalNames, address _countToken) {
        chairAddress = msg.sender;

        // For each of the provided proposal names, create a new proposal object and add it to the end of the array.
        for (uint i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({
                name: proposalNames[i],
                voteAmount: 0
            }));
        }
        countToken = _countToken;
    }

    //External functions --------------------------------------------------------------------------------------------
    
    /**
     * @dev Give `voter` the right to vote, only by `chairAddress`.
     *
     * Requirements:
     * - Only chair person can give right to vote.
     * - The voter must be not voted.
     * - The voter must have no right.
     */
    function giveRightToVote(address voter) external {
        require(msg.sender == chairAddress, "Only chairAddress can give right to vote.");
        require(!voters[voter].voted, "The voter already voted.");
        require(!voters[voter].hasRight, "The voter already has a right.");
        voters[voter].hasRight = true;
    }

    /**
     * @dev Vote with proposal index by voter
     *
     * Requirements:
     * - The choosed proposal index must be valid.
     * - The voter must have a right.
     * - The voter must be not voted.
     * - The voter must have some balance of token to count.
     */
    function vote(uint proposal) external nonReentrant {
        require(proposal < proposals.length, "Wrong proposal index");
        Voter storage sender = voters[msg.sender];
        require(sender.hasRight, "Has no right to vote");
        require(!sender.voted, "Already voted.");
        uint256 _balance = ERC20(countToken).balanceOf(msg.sender);
        require(_balance > 0, "The voter has not any balance of token to count.");
        sender.voted = true;
        sender.vote = proposal;
        proposals[proposal].voteAmount += _balance;
    }

    /**
     * @dev returns the name of the winner
     */
    function winnerName() external view returns (bytes32 winnerName_)
    {
        winnerName_ = proposals[winningProposal()].name;
    }

    //Public functions --------------------------------------------------------------------------------------------

    /**
     * @dev returns winningProposal's Index
     */
    function winningProposal() public view returns (uint winningProposalIndex)
    {
        uint winningvoteAmount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteAmount > winningvoteAmount) {
                winningvoteAmount = proposals[p].voteAmount;
                winningProposalIndex = p;
            }
        }
    }
}