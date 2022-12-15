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

    DoubleEndedQueue.Bytes32Deque private _governanceCall;

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

    // The following functions are overrides required by Solidity.

    // function quorum(uint256 blockNumber) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
    //     return super.quorum(blockNumber);
    // }

    function getCalldata(
        address target,
        uint256 value
    ) public payable returns (bytes memory) {
        return (abi.encodeWithSignature("transfer(address, uint256)", target, value));
    }


     function hashProposal(
        address target,
        uint256 value
    ) public pure virtual returns (uint256) {
        return uint256(keccak256(abi.encode(target, value)));
    }

    // function exhashProposal(
    //     address target,
    //     uint256 value
    //     ) public pure returns (uint256){
    //     return hashProposal(target, value);
    // }

    function getProposal_(
        uint256 proposalId
        ) public view returns (ProposalCore memory){
            return _proposals[proposalId];
    }

// 変更点
// calldataを削除する
function propose(
        address target,
        uint256 value
    ) public returns (uint256) {
        // require(
        //     getVotes(_msgSender(), block.number - 1) >= proposalThreshold(),
        //     "Governor: proposer votes below proposal threshold"
        // );
        uint256 proposalId = hashProposal(target, value);

        ProposalCore storage proposal = _proposals[proposalId];

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
        address target,
        uint256 value
    ) public payable returns (uint256) {
        uint256 proposalId = hashProposal(target, value);

        ProposalState status = state(proposalId);

        _proposals[proposalId].executed = true;

        emit ProposalExecuted(proposalId);

        address[] memory targets;
        uint256[] memory values;
        bytes[] memory calldatas;

        targets[0] = target;
        values[0] = value;
        calldatas[0] = getCalldata(target, value);

        _execute(proposalId,targets,values,calldatas,'');


        return proposalId;
    }

    receive() override external payable {}
}
