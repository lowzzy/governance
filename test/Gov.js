// import Web3 from 'web3';
const Web3 = require('web3');
const InputDataDecoder = require('ethereum-input-data-decoder');

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

const { govAbi } = require('./govData.js');

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
    const Gov = await ethers.getContractFactory('Gov');
    const Token = await ethers.getContractFactory('Token');
    const TLC = await ethers.getContractFactory('TLC');
    const token = await Token.deploy(
      'wrapped eth',
      'weth',
      '10000000000000000000000'
    );

    const minDelay = 1;
    const proposers = [otherAccount.address];
    const executors = [otherAccount.address];

    const tlc = await TLC.deploy(minDelay, proposers, executors);
    const TokenAddress = token.address;
    const TlcAddress = tlc.address;

    const gov = await Gov.deploy(TokenAddress, TlcAddress);
    await token.deployed();
    await gov.deployed();
    await tlc.deployed();

    return { token, gov, owner, otherAccount, tlc };
  }

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
      let ret = await gov.queue([toAddress], [value_], ['0x'], des);
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

  async function propose(token, toAddress, gov) {
    const value_ = 100;
    try {
      await gov.propose([toAddress], [value_], ['0x'], description);
      const des = await generateHash(description);
      ret = await gov.hashProposal([toAddress], [value_], ['0x'], des);
      return ret;
    } catch (e) {
      console.log(e);
    }
  }

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
      await propose(token, owner.address, gov);
    });
  });
});
