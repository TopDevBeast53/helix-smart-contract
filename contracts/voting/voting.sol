// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../tokens/HelixToken.sol";
import "@rari-capital/solmate/src/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Voting is ReentrancyGuard, Ownable {
    
    HelixToken private helixToken;

    EnumerableSet.AddressSet private _CoreMembers;

    // structure of a single proposal.
    struct Proposal {
        bool isCore;
        string name;                            // IPFS CID pointing to proposal title and body text
        address creator;                        // creator's address
        uint256 blockNum;                          // when the proposal was created
        uint256 startTimestamp;                    // a timestamp of when the voting starts 
        uint256 endTimestamp;                      // a timestamp of when the voting ends 
        mapping(address => uint8) decisions;    // decisions[voterAddr] == 1 -> YES, decisions[voterAddr] == 2 -> NO
        address[] voters;                       // array of voters
        mapping(address => uint) balance;       // balance of deposited helix token for each voter into the given proposal
        mapping(address => uint) withdrawAfterEnd;// withdraw amount for each voter after end of voting
    }
    
    // number of proposals
    uint256 public numProposals;

    // Used for accessing proposals by their index, i.e. creation order
    mapping (uint256 => Proposal) public proposalsByIndex;

    // Used for accessing Proposals by their name, i.e. hash
    // via string name -> uint256 index -> Proposal
    mapping (string => uint) public proposalIndexById;

    event CreateProposal(string proposalName);

    // constructor that create a new Voting to choose one of `proposalNames`.
    constructor(HelixToken _helixToken) {
        helixToken = _helixToken;
    }

    //External functions --------------------------------------------------------------------------------------------

    /**
     * @dev Create proposal
     *
     * Requirements:
     * - EndTimestamp should be later from now.
     */
    function createProposal(string calldata proposalName, uint256 endTimestamp) external {
        require(endTimestamp > block.timestamp, "endTimestamp must be a time in the future");
        proposalIndexById[proposalName] = numProposals;
        Proposal storage p = proposalsByIndex[numProposals++];
        p.isCore = isCoreMember(msg.sender);
        p.name = proposalName;
        p.creator = msg.sender;
        p.blockNum = block.number;
        p.startTimestamp = block.timestamp;
        p.endTimestamp = endTimestamp;

        emit CreateProposal(proposalName);
    }

    /**
     * @dev Voting
     *
     * Requirements:
     * - Check that add msg.sender twice for the same proposalId.
     * - Decision can be value of 1(Yes) or 2(No)
     */
    function vote(uint256 proposalId, uint256 withTokenAmount, uint8 decision) external nonReentrant {
        address voter = msg.sender;
        Proposal storage _proposal = proposalsByIndex[proposalId];
        require(isActive(proposalId), "Voting is over");
        require(_proposal.decisions[voter] == 0, "Already voted");
        require(decision > 0 && decision < 3, "Wrong decision number");
        
        if (withTokenAmount > 0) { 
            helixToken.transferFrom(voter, address(this), withTokenAmount);
            _proposal.balance[voter] += withTokenAmount;
        }
        _proposal.voters.push(voter);
        _proposal.decisions[voter] = decision;
    }

    /**
     * @dev Calculating the result of voting
     */
    function resultProposal(uint256 proposalId) external view returns (uint, uint)
    {
        uint256 numVoters = proposalsByIndex[proposalId].voters.length;
        uint256 yesVotes = 0;
        uint256 noVotes = 0;
        for (uint256 i = 0; i < numVoters; i++) {
            address voterAddr = proposalsByIndex[proposalId].voters[i];
            uint256 votes = getNumberOfVotes(voterAddr, proposalId);
            uint256 decision = proposalsByIndex[proposalId].decisions[voterAddr];
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
    function withdraw(uint256 proposalId, uint256 amount) external nonReentrant {
        address voter = msg.sender;
        Proposal storage _proposal = proposalsByIndex[proposalId];
        require(amount > 0 && _proposal.balance[voter] >= _proposal.withdrawAfterEnd[voter] + amount, "Wrong withdraw amount");
        helixToken.transfer(voter, amount);
        if (isActive(proposalId)) {
            _proposal.balance[voter] -= amount;
        } else {
            _proposal.withdrawAfterEnd[voter] += amount;
        }
    }

    /**
     * @dev See decision by `proposalId` & `voter`
     * NOTE: return value is 0 => `not voted yet1, 1 => `YES`, 2 => `NO`
     */
    function getDecision(uint256 proposalId, address voter) external view returns (uint8) {
        return proposalsByIndex[proposalId].decisions[voter];
    }

    /**
     * @dev See voters by `proposalId`
     */
    function voters(uint256 proposalId) external view returns (address[] memory) {
        return proposalsByIndex[proposalId].voters;
    }
    
    //Public functions --------------------------------------------------------------------------------------------

    /**
     * @dev Returns true if this proposal can still be voted on and false otherwise.
     */
    function isActive(uint256 proposalIndex) public view returns(bool) {
        return block.timestamp < proposalsByIndex[proposalIndex].endTimestamp;
    }

    /**
     * @dev Get the number of votes by `voter`
     *
     * NOTE: HelixToken's PriorVotes + deposited balance to proposal
     */
    function getNumberOfVotes(address voter, uint256 proposalId) public view returns (uint) {
        return helixToken.getPriorVotes(voter, proposalsByIndex[proposalId].blockNum) + proposalsByIndex[proposalId].balance[voter];
    }

     /**
     * @dev used by owner to add a CoreMembers
     * @param _CoreMember address of CoreMember to be added.
     * @return true if successful.
     */
    function addCoreMember(address _CoreMember) public onlyOwner returns (bool) {
        require(
            _CoreMember != address(0),
            "HelixVoting: _CoreMember is the zero address"
        );
        return EnumerableSet.add(_CoreMembers, _CoreMember);
    }

    /**
     * @dev used by owner to delete CoreMember
     * @param _CoreMember address of CoreMember to be deleted.
     * @return true if successful.
     */
    function delCoreMember(address _CoreMember) external onlyOwner returns (bool) {
        require(
            _CoreMember != address(0),
            "HelixVoting: _CoreMember is the zero address"
        );
        return EnumerableSet.remove(_CoreMembers, _CoreMember);
    }


    /**
     * @dev See the number of CoreMembers
     * @return number of members.
     */
    function getCoreMembersLength() public view returns (uint256) {
        return EnumerableSet.length(_CoreMembers);
    }

    /**
     * @dev Check if an address is a CoreMember
     * @return true or false based on CoreMember status.
     */
    function isCoreMember(address account) public view returns (bool) {
        return EnumerableSet.contains(_CoreMembers, account);
    }

    /**
     * @dev Get the core member at n location
     * @param _index index of address set
     * @return address of member at index.
     */
    function getCoreMember(uint256 _index)
        external
        view
        onlyOwner
        returns (address)
    {
        require(_index <= getCoreMembersLength() - 1, "HelixVoting: index out of bounds");
        return EnumerableSet.at(_CoreMembers, _index);
    }
}
