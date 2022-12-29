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
  async function DoExecute(token, toAddress, gov) {
    const grantAmount = 10;
    const transferCalldata = token.interface.encodeFunctionData('transfer', [
      toAddress,
      grantAmount,
    ]);

    const descriptionHash = ethers.utils.id('Proposal #1: Give grant to team');
    const targets = [token.address];
    const values = [0];
    try {
      const ret = await gov.execute(
        targets,
        values,
        [transferCalldata],
        descriptionHash
      );
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

  // async function DoQueue(token, toAddress, gov) {
  //   const grantAmount = 10;
  //   const transferCalldata = token.interface.encodeFunctionData('transfer', [
  //     toAddress,
  //     grantAmount,
  //   ]);

  //   const descriptionHash = ethers.utils.id('Proposal #1: Give grant to team');
  //   const targets = [token.address];
  //   const values = [0];
  //   try {
  //     const ret = await gov.queue(
  //       targets,
  //       values,
  //       [transferCalldata],
  //       descriptionHash
  //     );
  //     return ret;
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  async function propose(token, toAddress, gov) {
    // const grantAmount = '100';
    const grantAmount = 10; // ここを変えるとend,startの時刻が格納できたりできなくなったりする
    const transferCalldata = token.interface.encodeFunctionData('transfer', [
      toAddress,
      grantAmount,
    ]);

    // 100文字
    const description =
      'Proposal #1: Give grant to teamProposal #1: Give grant to teamProposal #1: Give grant to teamProposa';
    const targets = [token.address];
    const values = [0];
    try {
      const ret = await gov.propose(
        targets,
        values,
        [transferCalldata],
        description
      );
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

  async function hashProposal(token, toAddress, gov) {
    const grantAmount = 10;
    const transferCalldata = token.interface.encodeFunctionData('transfer', [
      toAddress,
      grantAmount,
    ]);
    const description = 'Proposal #1: Give grant to team';

    const targets = [token.address];
    const values = [0];
    try {
      const ret = await gov.exhashProposal(
        targets,
        values,
        [transferCalldata],
        description
      );
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

  describe('Gov', function () {
    it('deploy', async function () {
      console.log('');
      console.log('##################################');
      console.log('########### start ################');
      console.log('##################################');
      console.log('');
      const { token, gov, owner, otherAccount } = await loadFixture(
        deployGovFixture
      );

      // ***********************************************
      // ***************** propose *********************
      // ***********************************************
      const value_ = 1;
      let ret = await propose(token, owner.address, gov);
      console.log('propose ret---------------');
      console.log(ret);

      // ***********************************************
      // ************** propose ID *********************
      // ***********************************************

      const proposalId = await hashProposal(token, owner.address, gov);
      console.log('proposalId----------');
      console.log(proposalId);
      const id_ = proposalId.toString();

      // ***********************************************
      // ************** block number *********************
      // ***********************************************
      let blockNumber = await ethers.provider.getBlockNumber();
      console.log('blockNumber----');
      console.log(blockNumber);

      ret = await network.provider.send('hardhat_mine', ['0x10']);
      blockNumber = await ethers.provider.getBlockNumber();

      blockNumber = await ethers.provider.getBlockNumber();
      console.log('blockNumber----');
      console.log(blockNumber);

      // ***********************************************
      // ********** snapshot deadline ******************
      // ***********************************************

      ret = await getProposal(id_, gov);
      console.log('getProposal ret---------------');
      console.log(ret);

      ret = await getSnapshot(id_, gov);
      console.log('get snapshot ret---------------');
      console.log(ret);

      ret = await getDeadLine(id_, gov);
      console.log('get deadline ret id_ ---------------');
      console.log(ret);

      console.log('id = id_');
      console.log('###################################');
      console.log('id = 0');

      ret = await getProposal(0, gov);
      console.log('getProposal ret 0---------------');
      console.log(ret);

      ret = await getSnapshot(0, gov);
      console.log('get snapshot ret 0---------------');
      console.log(ret);

      ret = await getDeadLine(0, gov);
      console.log('get deadline ret 0 ---------------');
      console.log(ret);

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

      ret = await DoExecute(token, owner.address, gov);
      console.log('do execute ret---------------');
      console.log(ret);

      console.log('TEST ************************************');
    });
  });
});