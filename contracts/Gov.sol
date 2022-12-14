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
        // require(
        //     getVotes(_msgSender(), block.number - 1) >= proposalThreshold(),
        //     "Governor: proposer votes below proposal threshold"
        // );

        // ここでハッシュ化している
        uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));

        require(targets.length == values.length, "Governor: invalid proposal length");
        require(targets.length == calldatas.length, "Governor: invalid proposal length");
        require(targets.length > 0, "Governor: empty proposal");

        // proposalsって配列が存在していて、ハッシュ化した数値をindexとして提案を取得している
        // proposalsに既存で存在していなかった場合どうなるんや？
        // proposalCoreって型はどんな型だろう？createdした時と同じ型かな？
        ProposalCore storage proposal = _proposals[proposalId];
        // ProposalCore storage proposal = _proposals[1];
        // statusが有効かどうか確認してる
        require(proposal.voteStart.isUnset(), "Governor: proposal already exists");


        // --------------期限の定義-----------------

        uint64 snapshot = block.number.toUint64() + votingDelay().toUint64();
        uint64 deadline = snapshot + votingPeriod().toUint64();

        proposal.voteStart.setDeadline(snapshot);
        proposal.voteEnd.setDeadline(deadline);
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
    receive() override external payable {}
}
