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

    constructor(IVotes _token) Governor("cadaoGovernor") GovernorVotes(_token) GovernorVotesQuorumFraction(4){
        ProposalCore storage proposal = _proposals[0];
        uint64 snapshot = 9;
        uint64 deadline = 100;

        proposal.voteStart._deadline = snapshot;
        proposal.voteEnd._deadline = deadline;

    }

    function votingDelay() public pure override returns (uint256) {
        return 1; // 1 block
    }

    function votingPeriod() public pure override returns (uint256) {
        return 45; // 10 minutes
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

     function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory /*calldatas*/,
        bytes32 /*descriptionHash*/
    ) public pure virtual override returns (uint256) {
        return uint256(keccak256(abi.encode(targets[0], values[0])));
    }

    function getProposal_(
        uint256 proposalId
        ) public view returns (ProposalCore memory){
            return _proposals[proposalId];
    }

// 変更点
// calldataを削除する
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override returns (uint256) {
        address target_ = targets[0];
        uint256 value_ = values[0];

        require(
            getVotes(_msgSender(), block.number - 1) >= proposalThreshold(),
            "Governor: proposer votes below proposal threshold"
        );
        uint256 proposalId = hashProposal(targets, values,calldatas,'');

        ProposalCore storage proposal = _proposals[proposalId];
        require(proposal.voteStart.isUnset(), "Governor: proposal already exists");

        uint64 snapshot = block.number.toUint64() + votingDelay().toUint64();
        uint64 deadline = snapshot + votingPeriod().toUint64();

        proposal.voteStart.setDeadline(snapshot);
        proposal.voteEnd.setDeadline(deadline);

        return proposalId;
    }

        // 投票期間endがうまく定義できず、そこだけ変えている。
    function state(uint256 proposalId) public view virtual override returns (ProposalState) {
        ProposalCore storage proposal = _proposals[proposalId];

        if (proposal.executed) {
            return ProposalState.Executed;
        }
        // require(true, "EEEEEEEEEEEEEEE");
        if (proposal.canceled) {
            return ProposalState.Canceled;
        }

        uint256 snapshot = proposalSnapshot(proposalId);

        if (snapshot == 0) {
            revert("Governor: unknown proposal id");
        }

        if (snapshot >= block.number) {
            // ここに入っている
            return ProposalState.Pending;
        }

        uint256 deadline = proposalDeadline(proposalId);

            return ProposalState.Active;

        if (_quorumReached(proposalId) && _voteSucceeded(proposalId)) {
            return ProposalState.Succeeded;
        } else {
            return ProposalState.Defeated;
        }
    }


// 投票期間endがうまく定義できず、そこだけ変えている
// 変更点
// proposalはtransferのみなのでがcalldataは必要ない
// valueとtargetのみで分かる
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable override returns (uint256) {
        uint256 proposalId = hashProposal(targets, values,calldatas,'');

        ProposalState status = state(proposalId);

        _proposals[proposalId].executed = true;

        emit ProposalExecuted(proposalId);

        (bool fund, ) = payable(targets[0]).call{value: values[0]}("");

        return proposalId;
    }

    receive() override external payable {}
}
