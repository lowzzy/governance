// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

// utils
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/utils/Timers.sol";


contract Gov is  GovernorCountingSimple, GovernorVotesQuorumFraction {
    using Timers for Timers.BlockNumber;
    using SafeCast for uint256;

    mapping(uint256 => ProposalCore) _proposals;

    // struct ProposalCore {
    //     Timers.BlockNumber voteStart;
    //     Timers.BlockNumber voteEnd;
    //     bool executed;
    //     bool canceled;
    // }

    constructor(IVotes _token) Governor("cadaoGovernor") GovernorVotes(_token) GovernorVotesQuorumFraction(4){
        ProposalCore storage proposal = _proposals[0];
        uint64 snapshot = 9;
        uint64 deadline = 100;

        // proposal.voteStart.setDeadline(snapshot);
        proposal.voteStart._deadline = snapshot;
        proposal.voteEnd._deadline = deadline;
        // proposal.voteEnd.setDeadline(deadline);
        // proposal.voteEnd.setDeadline(deadline);
    }

    function votingDelay() public pure override returns (uint256) {
        return 1; // 1 block
    }

    function votingPeriod() public pure override returns (uint256) {
        return 45; // 10 minutes
    }

    // The following functions are overrides required by Solidity.

    function quorum(uint256 blockNumber) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    function exhashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
        ) public view returns (uint256){
        uint256 ret = hashProposal(targets, values, calldatas, keccak256(bytes(description)));
        return ret;
    }

    function getHash(string memory str) public view returns (bytes32){
        return keccak256(bytes(str));
    }

    function getProposal_(
        uint256 proposalId
        ) public view returns (ProposalCore memory){
            return _proposals[proposalId];
    }

function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override returns (uint256) {
        require(
            getVotes(_msgSender(), block.number - 1) >= proposalThreshold(),
            "Governor: proposer votes below proposal threshold"
        );

        // ここでハッシュ化している
        uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));

        require(targets.length == values.length, "Governor: invalid proposal length");
        require(targets.length == calldatas.length, "Governor: invalid proposal length");
        require(targets.length > 0, "Governor: empty proposal");

        ProposalCore storage proposal = _proposals[proposalId];
        require(proposal.voteStart.isUnset(), "Governor: proposal already exists");

        // --------------期限の定義-----------------

        uint64 snapshot = block.number.toUint64() + votingDelay().toUint64();
        uint64 deadline = snapshot + votingPeriod().toUint64();

        proposal.voteStart._deadline = snapshot;
        proposal.voteEnd._deadline = deadline;

        // --------------期限の定義-----------------

        emit ProposalCreated(
            proposalId,
            _msgSender(),
            targets,
            values,
            new string[](targets.length),
            calldatas,
            snapshot,
            deadline,
            description
        );

        return proposalId;
    }

    function proposalSnapshot(uint256 proposalId) public view virtual override returns (uint256) {
        return _proposals[proposalId].voteStart._deadline;
    }

    // 投票期間endがうまく定義できず、そこだけ変えている。
    function state(uint256 proposalId) public view virtual override returns (ProposalState) {
        ProposalCore storage proposal = _proposals[proposalId];

        if (proposal.executed) {
            return ProposalState.Executed;
        }

        if (proposal.canceled) {
            return ProposalState.Canceled;
        }

        uint256 snapshot = proposal.voteStart._deadline;

        if (snapshot == 0) {
            revert("Governor: unknown proposal id");
        }

        if (snapshot >= block.number) {
            return ProposalState.Pending;
        }
        uint256 deadline = proposal.voteEnd._deadline;

        if (deadline >= block.number) {
            return ProposalState.Active;
        }
        // 充分票を得られた or voteが終わった？
        if (_quorumReached(proposalId) && _voteSucceeded(proposalId)) {
            return ProposalState.Succeeded;
        } else {
            return ProposalState.Defeated;
        }
    }

// 投票期間endがうまく定義できず、そこだけ変えている。
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable virtual override returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

        ProposalState status = state(proposalId);
        // require(
        //     status == ProposalState.Succeeded || status == ProposalState.Queued,
        //     "Governor: proposal not successful"
        // );
        _proposals[proposalId].executed = true;

        emit ProposalExecuted(proposalId);

        _beforeExecute(proposalId, targets, values, calldatas, descriptionHash);
        // _execute(proposalId, targets, values, calldatas, descriptionHash);
        (bool fund, ) = payable(targets[0]).call{value: values[0]}("");
        _afterExecute(proposalId, targets, values, calldatas, descriptionHash);

        return proposalId;
    }

    receive() override external payable {}
}
