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


    // event ProposalCreated(uint256 proposalId, address proposer, address target, uint256 value, string signatures, uint256 startBlock, uint256 endBlock);

    // bytes[] public constant calldata_ = keccak256("transfer(address recipient, uint256 amount)");

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

    function exhashProposal(
        address target,
        uint256 value
        ) public pure returns (uint256){
        return hashProposal(target, value);
    }

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

        // ここでハッシュ化している
        uint256 proposalId = hashProposal(target, value);

        // proposalsって配列が存在していて、ハッシュ化した数値をindexとして提案を取得している
        // proposalsに既存で存在していなかった場合どうなるんや？
        // proposalCoreって型はどんな型だろう？createdした時と同じ型かな？
        ProposalCore storage proposal = _proposals[proposalId];
        // ProposalCore storage proposal = _proposals[1];
        // statusが有効かどうか確認してる
        // require(proposal.voteStart.isUnset(), "Governor: proposal already exists");


        // --------------期限の定義-----------------

        uint64 snapshot = block.number.toUint64() + votingDelay().toUint64();
        uint64 deadline = snapshot + votingPeriod().toUint64();
        proposal.voteStart.setDeadline(snapshot);
        proposal.voteEnd.setDeadline(deadline);


        // --------------期限の定義-----------------

        // 引数合わせてoverriteするのがだるいのでskip
        // emit ProposalCreated(
        //     proposalId,
        //     _msgSender(),
        //     target,
        //     value,
        //     new string[],
        //     snapshot,
        //     deadline
        // );

        return proposalId;
    }

    function proposalSnapshot(uint256 proposalId) public view virtual override returns (uint256) {
        return _proposals[proposalId].voteStart.getDeadline();
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

        // if (deadline >= block.number) {
            return ProposalState.Active;
        // }
        // require(false, "DDDDDDDDDDDDD");

        // 充分票を得られた or voteが終わった？
        if (_quorumReached(proposalId) && _voteSucceeded(proposalId)) {
            return ProposalState.Succeeded;
        } else {
            return ProposalState.Defeated;
        }
    }

// override~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // function _beforeExecute(
    //     uint256, /* proposalId */
    //     address target,
    //     uint256 value
    // ) internal virtual {
    //     if (_executor() != address(this)) {
    //             if (target == address(this)) {
    //                 // _governanceCall.pushBack(keccak256(calldatas[i]));
    //                 // calldata_はtransferなのであらかじめグローバルで定義しておく.
    //                 // calldata_ = ???
    //                 _governanceCall.pushBack(getCalldata(target, value));
    //             }

    //     }
    // }

    function _execute(
        uint256, /* proposalId */
        address target,
        uint256 value
    ) internal virtual {
        string memory errorMessage = "Governor: call reverted without message";
            (bool success, bytes memory returndata) = target.call{value: value}(getCalldata(target,value));
            Address.verifyCallResult(success, returndata, errorMessage);
    }

    // function _afterExecute(
    //     uint256, /* proposalId */
    //     address, /* target */
    //     uint256 /* value */
    // ) internal virtual {
    //     if (_executor() != address(this)) {
    //         if (!_governanceCall.empty()) {
    //             _governanceCall.clear();
    //         }
    //     }
    // }
// override~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


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
        // require(
        //     status == ProposalState.Succeeded || status == ProposalState.Queued,
        //     "Governor: proposal not successful"
        // );
        _proposals[proposalId].executed = true;

        emit ProposalExecuted(proposalId);

        // _beforeExecute(proposalId, [target], [value],calldata_,calldata_);
        _execute(proposalId, target, value);
        // _afterExecute(proposalId, [target], [value]);

        return proposalId;
    }

    receive() override external payable {}
}
