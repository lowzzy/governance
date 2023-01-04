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
  ethers,
} = require('hardhat');

// ------------------------------
const { solidity } = require('ethereum-waffle');
const { expect } = require('chai');
const { BigNumber } = require('ethers');
// 100文字
const description_origin = 'pppppppppppppppppppppppppppppppppppppppppppppppp';
// 'pppppProposal #1: Give grant to teamProposal #1: Give grant to teamProposal #1: Give grant to teamPr';
const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

let description = description_origin;
// let i = 0;
// while (i < 99) {
//   description += description_origin;
//   i += 1;
// }

describe('Gov', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployGovFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    console.log('');
    console.log('################################');
    console.log('owner.address');
    console.log(owner.address);
    console.log('otherAccount.address');
    console.log(otherAccount.address);
    console.log('owner.balance');
    const owner_balance = await ethers.provider.getBalance(owner.address);

    console.log(owner_balance);
    console.log('################################');

    console.log('');
    const Gov = await ethers.getContractFactory('Gov');
    const Token = await ethers.getContractFactory('Token');
    const TLC = await ethers.getContractFactory('TLC');
    const token = await Token.deploy(
      'wrapped eth',
      'weth',
      '10000000000000000000000'
    );
    console.log('***********************1');
    const minDelay = 1;
    // const proposers = [otherAccount.address, owner.address];
    // const executors = [otherAccount.address, owner.address];
    const proposers = [otherAccount.address];
    const executors = [otherAccount.address];
    const tlc = await TLC.deploy(minDelay, proposers, executors);
    const TokenAddress = token.address;
    const TlcAddress = tlc.address;
    console.log('TlcAddress*****************************************::');
    console.log(TlcAddress);
    const gov = await Gov.deploy(TokenAddress, TlcAddress);

    console.log('***********************2');

    await token.deployed();
    await gov.deployed();
    await tlc.deployed();
    console.log('***********************3');

    // ##########################################################
    // ############下記のコメントアウト外すとエラー出る################
    // ##########################################################
    //　ガバナンストークンを十分に持っていないことが原因
    // await token.transfer(otherAccount.address, '10000000000000000000000');
    let bl = await token.balanceOf(otherAccount.address);
    console.log('other account blance-------');
    console.log(bl);
    bl = await token.balanceOf(owner.address);
    console.log('owner blance-------');
    console.log(bl);
    console.log('gov.address--------------');
    console.log(gov.address);
    console.log('otherAccount.address--------------');
    console.log(otherAccount.address);
    console.log('tlc.address--------------');
    console.log(tlc.address);

    console.log('#############################');
    console.log('########## role ############');
    console.log('############################');
    const proposerRole = await tlc.PROPOSER_ROLE();
    const executorRole = await tlc.EXECUTOR_ROLE();
    const adminRole = await tlc.TIMELOCK_ADMIN_ROLE();

    const proposerTx = await tlc.grantRole(proposerRole, gov.address);
    console.log('proposerTx');
    console.log(proposerTx);
    const executorTx = await tlc.grantRole(executorRole, ADDRESS_ZERO);
    console.log('executorTx');
    console.log(executorTx);
    const revokeTx = await tlc.revokeRole(adminRole, owner.address);
    console.log('revokeTx');
    console.log(revokeTx);

    console.log('');

    console.log('################################');
    console.log('########### after ############');
    console.log('################################');
    await owner.sendTransaction({
      to: gov.address,
      value: ethers.utils.parseEther('10.0'), // Sends exactly 1.0 ether
    });
    console.log('owner.balance');
    let balance = await ethers.provider.getBalance(owner.address);
    console.log(balance);
    console.log('gov.balance');
    balance = await ethers.provider.getBalance(gov.address);
    console.log(balance);
    console.log('################################');

    let ret = await delegate(owner.address, token);
    // let ret = await delegate(otherAccount.address, token);
    console.log('################################');
    console.log('########## delegate ############');
    console.log('################################');

    console.log(ret);

    return { token, gov, owner, otherAccount, tlc };
  }

  // async function propose(token, toAddress, gov) {
  //   const value_ = 100;
  //   try {
  //     await gov.propose([toAddress], [value_], ['0x'], description);
  //     const ret = await gov.exhashProposal(
  //       [toAddress],
  //       [value_],
  //       ['0x'],
  //       description
  //     );
  //     return ret;
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  async function DoExecute(token, toAddress, gov) {
    const value_ = 100;

    try {
      const des = await generateHash(description);

      const ret = await gov.execute([toAddress], [value_], ['0x'], des);
      return ret;
    } catch (e) {
      console.log(e);
    }
  }
  async function generateHash(str) {
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
  }

  async function DoQueue(token, toAddress, gov) {
    const value_ = 100;
    try {
      const des = await generateHash(description);
      // ************************************
      // **********ここがうまくいってない********
      // ************************************
      let ret = await gov.queue([toAddress], [value_], ['0x'], des);
      console.log('----queue-----');
      console.log(ret);
      return ret;
    } catch (e) {
      console.log('errrrrrrrorrrrr-----------');
      console.log(e);
    }
  }

  async function propose(token, toAddress, gov) {
    const value_ = 100;
    try {
      let ret = await gov.name();
      console.log('----name-----');
      console.log(ret);

      ret = await gov.propose([toAddress], [value_], ['0x'], description);
      console.log('----propose-----');
      console.log(ret);
      const des = await generateHash(description);
      console.log('des-----------------');
      console.log(des);
      ret = await gov.hashProposal([toAddress], [value_], ['0x'], des);
      console.log('----hash-----');
      console.log(ret);
      return ret;
    } catch (e) {
      console.log('errrrrrrrorrrrr-----------');
      console.log(e);
    }
  }

  // async function hashProposal(token, toAddress, gov) {
  //   const grantAmount = 10;
  //   const transferCalldata = token.interface.encodeFunctionData('transfer', [
  //     toAddress,
  //     grantAmount,
  //   ]);

  //   const targets = [token.address];
  //   const values = [0];
  //   try {
  //     const ret = await gov.exhashProposal(
  //       targets,
  //       values,
  //       [transferCalldata],
  //       description
  //     );
  //     return ret;
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  async function proposalVotes(proposalId, gov) {
    try {
      const ret = await gov.proposalVotes(proposalId);
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

  async function hasVoted(proposalId, account, gov) {
    try {
      const ret = await gov.hasVoted(proposalId, account);
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

  async function castVote(proposalId, support, gov) {
    try {
      const ret = await gov.castVote(proposalId, support);
      console.log(ret);
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

  async function delegate(account, token) {
    try {
      const ret = await token.delegate(account);
      console.log(ret);
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

  describe('Gov', function () {
    it('deploy', async function () {
      const { token, gov, owner, otherAccount } = await loadFixture(
        deployGovFixture
      );
      console.log('#############################################');
      console.log('########## (propose)blockNumber ############');
      console.log('#############################################');
      let blockNumber = await ethers.provider.getBlockNumber();
      console.log(blockNumber);
      let ret_ = await propose(token, owner.address, gov);
      console.log('propose ret---------------');
      console.log(ret_);
      // let ret = await propose(token, otherAccount.address, gov);
      // console.log('propose ret---------------');
      // console.log(ret);

      console.log('########## Mining ##########');

      // const proposalId = await hashProposal(token, owner.address, gov);
      const proposalId = ret_;

      const id_ = proposalId.toString();
      console.log('proposalId ret---------------');
      console.log(id_);

      ret = await network.provider.send('hardhat_mine', ['0x10']);

      // console.log('getProposal ret---------------');
      // ret = await getProposal(id_, gov);
      // console.log(ret);
      console.log('#############################');
      console.log('########## state ############');
      console.log('#############################');
      ret = await getState(id_, gov);
      console.log(ret);

      blockNumber = await ethers.provider.getBlockNumber();
      console.log('blockNumber----');
      console.log(blockNumber);

      // ret = await getState(0, gov);
      // console.log('get state ret 0 ---------------');
      // console.log(ret);

      // ret = await getSnapshot(0, gov);
      // console.log('get snapshot ret 0 ---------------');
      // console.log(ret);

      ret = await network.provider.send('hardhat_mine', ['0x40']);
      blockNumber = await ethers.provider.getBlockNumber();
      console.log('blockNumber----');
      console.log(blockNumber);

      ret = await hasVoted(id_, owner.address, gov);
      console.log('************ hasVoted pre************');
      console.log(ret);

      // ret = await getDeadLine(0, gov);
      // console.log('get deadline ret 0 ---------------');
      // console.log(ret);

      // let blockNumber = await ethers.provider.getBlockNumber();
      // console.log('blockNumber----');
      // console.log(blockNumber);

      // const support = 0;

      // ret = await castVote(0, support, gov);
      // console.log('castVote ret 0 ---------------');
      // console.log(ret);

      console.log('-------proposal votes 1-----');
      ret = await proposalVotes(0, gov);
      console.log(ret);

      // ##########################################
      // ############## ここを変える ################
      // ##########################################
      const support = 1; // 賛成
      // const support = 0; // 反対

      // ##########################################
      // ##########################################

      console.log('#############################################');
      console.log('########## (castVote)blockNumber ############');
      console.log('#############################################');
      blockNumber = await ethers.provider.getBlockNumber();
      console.log(blockNumber);
      ret = await castVote(id_, support, gov);
      console.log('castVote ret---------------');
      console.log(ret);
      console.log('#############################');
      console.log('########## state ############');
      console.log('#############################');
      ret = await getState(id_, gov);
      console.log(ret);
      ret = await network.provider.send('hardhat_mine', ['0x50410']);
      ret = await getVotes(owner.address, blockNumber + 1, gov);
      console.log('get Votes ^^^^^^^^^^ owner');
      console.log(ret);
      ret = await getVotes(otherAccount.address, blockNumber + 1, gov);
      console.log('get Votes ^^^^^^^^^^ other');
      console.log(ret);
      ret = await hasVoted(id_, owner.address, gov);
      console.log('************ hasVoted ************');
      console.log(ret);

      console.log('###################################');
      console.log('########## blockNumber ############');
      console.log('###################################');
      blockNumber = await ethers.provider.getBlockNumber();
      console.log(blockNumber);
      console.log('get snapshot ret---------------');
      ret = await getSnapshot(id_, gov);
      console.log(ret);
      console.log('get deadline ret id_ ---------------');
      ret = await getDeadLine(id_, gov);
      console.log(ret);

      console.log('#############################');
      console.log('########## state ############');
      console.log('#############################');
      ret = await getState(id_, gov);

      console.log(ret);
      console.log('-------proposal votes 2-----');
      ret = await proposalVotes(id_, gov);
      console.log(ret);

      ret = await DoQueue(token, owner.address, gov);
      console.log('do queue ret---------------');
      console.log(ret);

      let bl = await ethers.provider.getBalance(gov.address);
      console.log('blance before-------');
      console.log(bl);

      ret = await network.provider.send('hardhat_mine', ['0x40']);

      blockNumber = await ethers.provider.getBlockNumber();
      console.log('blockNumber----');
      console.log(blockNumber);
      // #########################
      // #########イマココ#########
      // #########################
      ret = await DoExecute(token, owner.address, gov);
      console.log('do execute ret---------------');
      console.log(ret);

      bl = await ethers.provider.getBalance(gov.address);
      console.log('blance after-------');
      console.log(bl);
    });
  });
});
