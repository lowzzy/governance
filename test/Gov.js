const {
  time,
  loadFixture,
} = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
// ------------------------------
// https://github.com/DavitTorchyan/Proposal/blob/6d9eb76a50d453f4efcab00e27bdc6c1fcd25d4e/test/Proposal.test.js
const {
  ethers: {
    utils: { Interface, keccak256 },
  },
  network,
  waffle,
} = require('hardhat');

// ------------------------------
const { solidity } = require('ethereum-waffle');
const { expect } = require('chai');
const { BigNumber } = require('ethers');

describe('Gov', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployGovFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Gov = await ethers.getContractFactory('Gov');
    const Token = await ethers.getContractFactory('Token');
    const token = await Token.deploy(
      'wrapped eth',
      'weth',
      '10000000000000000000000'
    );
    const TokenAddress = token.address;
    const gov = await Gov.deploy(TokenAddress);

    await token.deployed();
    await gov.deployed();

    await token.transfer(gov.address, '5000000000000000000000');
    // let bl = await token.balanceOf(gov.address);
    // console.log('blance-------');
    // console.log(bl);

    return { token, gov, owner, otherAccount };
  }

  async function deployGovFixtureSendNative() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Gov = await ethers.getContractFactory('Gov');
    const Token = await ethers.getContractFactory('Token');

    const token = await Token.deploy(
      'gov token',
      'gov',
      '10000000000000000000000'
    );

    const TokenAddress = token.address;
    const gov = await Gov.deploy(TokenAddress);

    await token.deployed();
    await gov.deployed();

    console.log('gov.address------');
    console.log(gov.address);
    // let bl;
    // const provider = waffle.provider;
    // bl = await provider.getBalance(owner.address);

    // console.log('*************bl*************bfr');
    // console.log(bl);
    // const transactionHash = await owner.sendTransaction({
    //   to: gov.address,
    //   value: ethers.utils.parseEther('100.0'), // Sends exactly 1.0 ether
    // });
    // bl = await provider.getBalance(owner.address);

    // console.log('*************bl************* af');
    // console.log(bl);

    // console.log('************* transactionHash *************');
    // console.log(transactionHash);

    return { token, gov, owner, otherAccount };
  }

  async function DoExecute(target_, value_, gov) {
    try {
      const ret = await gov.execute(target_, value_);
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

  async function propose(target_, value_, gov) {
    try {
      const ret = await gov.propose([target_], [value_], ['0x'], '');
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

  async function hashProposal(target_, value_, gov) {
    try {
      const ret = await gov.hashProposal(target_, value_);
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

  async function getVotes(account, blockNumber, gov) {
    try {
      const ret = await gov.getVotes(account, blockNumber);
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

  async function getDeadLine(proposalId, gov) {
    try {
      const ret = await gov.proposalDeadline(proposalId);
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

  async function getSnapshot(proposalId, gov) {
    try {
      const ret = await gov.proposalSnapshot(proposalId);
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

  async function getState(proposalId, gov) {
    try {
      const ret = await gov.state(proposalId);
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

  async function getProposal(proposalId, gov) {
    try {
      const ret = await gov.getProposal_(proposalId);
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

  async function castVote(proposalId, support, gov) {
    try {
      const ret = await gov.castVote(proposalId, support);
      console.log(ret);
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

  // describe('Gov', function () {
  //   it('deploy', async function () {
  //     const { token, gov, owner, otherAccount } = await loadFixture(
  //       deployGovFixture
  //     );
  //     let ret = await propose(token, owner.address, gov);
  //     console.log('propose ret---------------');
  //     console.log(ret);

  //     console.log('########## Mining ##########');

  //     const proposalId = await hashProposal(token, owner.address, gov);

  //     const id_ = proposalId.toString();
  //     console.log('proposalId ret---------------');
  //     console.log(ret);

  //     // ret = await getProposal(0, gov);
  //     // console.log('getProposal ret 0 ---------------');
  //     // console.log(ret);

  //     ret = await getProposal(id_, gov);
  //     console.log('getProposal ret---------------');
  //     console.log(ret);

  //     // mine 256 blocks
  //     // 7 -> state = 0
  //     // 8 -> state = undefined
  //     ret = await network.provider.send('hardhat_mine', ['0x8']);
  //     ret = await getState(id_, gov);
  //     console.log('get state ret id_ ---------------');
  //     console.log(ret);

  //     // blockNumber = await ethers.provider.getBlockNumber();
  //     // console.log('blockNumber----');
  //     // console.log(blockNumber);

  //     // ret = await getState(0, gov);
  //     // console.log('get state ret 0 ---------------');
  //     // console.log(ret);

  //     ret = await getSnapshot(id_, gov);
  //     console.log('get snapshot ret---------------');
  //     console.log(ret);
  //     // ret = await getSnapshot(0, gov);
  //     // console.log('get snapshot ret 0 ---------------');
  //     // console.log(ret);

  //     // ret = await network.provider.send('hardhat_mine', ['0x1']);
  //     // blockNumber = await ethers.provider.getBlockNumber();
  //     // console.log('blockNumber----');
  //     // console.log(blockNumber);

  //     ret = await getDeadLine(id_, gov);
  //     console.log('get deadline ret id_ ---------------');
  //     console.log(ret);
  //     // ret = await getDeadLine(0, gov);
  //     // console.log('get deadline ret 0 ---------------');
  //     // console.log(ret);

  //     // let blockNumber = await ethers.provider.getBlockNumber();
  //     // console.log('blockNumber----');
  //     // console.log(blockNumber);

  //     // const support = 0;

  //     // ret = await castVote(0, support, gov);
  //     // console.log('castVote ret 0 ---------------');
  //     // console.log(ret);

  //     const support = 0;
  //     ret = await castVote(id_, support, gov);
  //     console.log('castVote ret---------------');
  //     console.log(ret);

  //     // ret = await DoQueue(token, owner.address, gov);
  //     // console.log('do queue ret---------------');
  //     // console.log(ret);
  //     let bl = await token.balanceOf(gov.address);
  //     console.log('blance before-------');
  //     console.log(bl);

  //     ret = await DoExecute(token, owner.address, gov);
  //     console.log('do execute ret---------------');
  //     console.log(ret);

  //     bl = await token.balanceOf(gov.address);
  //     console.log('blance after-------');
  //     console.log(bl);
  //   });
  // });

  describe('Gov testtttt', function () {
    it('deploy', async function () {
      console.log('TEST ************************************');

      const { token, gov, owner, otherAccount } = await loadFixture(
        deployGovFixtureSendNative
      );

      // ***********************************************
      // ***************** propose *********************
      // ***********************************************
      const value_ = 1;
      let ret = await propose(otherAccount.address, value_, gov);
      console.log('propose ret---------------');
      console.log(ret);

      // ***********************************************
      // ************** propose ID *********************
      // ***********************************************

      const proposalId = await hashProposal(otherAccount.address, value_, gov);
      const id_ = proposalId.toString();

      // ***********************************************
      // ************** castVote *********************
      // ***********************************************

      const support = 0;
      ret = await castVote(id_, support, gov);
      console.log('castVote ret---------------');
      console.log(ret);

      // ***********************************************
      // **************   execute  *********************
      // ***********************************************

      ret = await DoExecute(otherAccount.address, value_, gov);
      console.log('do execute ret---------------');
      console.log(ret);

      console.log('TEST ************************************');
    });
  });
});
