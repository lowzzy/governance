const {
  time,
  loadFixture,
} = require('@nomicfoundation/hardhat-network-helpers');

const { ethers } = require('hardhat');

const description = '';
// const cid = 'QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH';

describe('Gov', function () {
  async function deployGovFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const Gov = await ethers.getContractFactory('Gov');
    const Token = await ethers.getContractFactory('Token');
    const TLC = await ethers.getContractFactory('TLC');
    const token = await Token.deploy(
      'Gov Token',
      'GT',
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

  async function generateHash(str) {
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
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

  describe('Gov', function () {
    it('deploy', async function () {
      const { token, gov, owner, otherAccount } = await loadFixture(
        deployGovFixture
      );
      await propose(token, owner.address, gov);
    });
  });
});
