// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

contract Gov is  GovernorCountingSimple, GovernorVotesQuorumFraction {

    mapping(uint256 => ProposalCore) private _proposals;


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

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override returns (uint256) {
        // uint256 voted_num = getVotes(_msgSender(),3);//ここに問題ありそう
        // require(false,"eeeeeeeeeeeeeeeeeeee");
//         uint256 pT = proposalThreshold(); //これは問題なさそう
//         require(false,"2222EEEEEEEEEEEEE");
// // ----------------これより下-----------------------
//         require(
//             voted_num >= pT,
//             "Governor: proposer votes below proposal threshold"
//         );
// ----------------これより上-----------------------

        // ここでハッシュ化している
        uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));
        require(targets.length == values.length, "Governor: invalid proposal length");
        require(targets.length == calldatas.length, "Governor: invalid proposal length");
        require(targets.length > 0, "Governor: empty proposal");

        // proposalsって配列が存在していて、ハッシュ化した数値をindexとして提案を取得している
        // proposalsに既存で存在していなかった場合どうなるんや？
        // proposalCoreって型はどんな型だろう？createdした時と同じ型かな？
        ProposalCore storage proposal = _proposals[proposalId];
        // statusが有効かどうか確認してる
        // require(proposal.voteStart.isUnset(), "Governor: proposal already exists");


        // --------------期限の定義-----------------
        uint256 snapshot = votingDelay();
        uint256 deadline = 0;

        // proposal.voteStart.setDeadline(snapshot);
        // proposal.voteEnd.setDeadline(deadline);
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
            "aaaaaa"
        );

        return proposalId;

    }
}
