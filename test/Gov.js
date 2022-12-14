const {
  time,
  loadFixture,
} = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
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
    const token = await Token.deploy('wrapped eth', 'weth', 100000000000000);
    const TokenAddress = token.address;
    const gov = await Gov.deploy(TokenAddress);

    await token.deployed();
    await gov.deployed();

    return { token, gov, owner, otherAccount };
  }
  async function propose(token, toAddress, gov) {
    const grantAmount = 10;
    const transferCalldata = token.interface.encodeFunctionData('transfer', [
      toAddress,
      grantAmount,
    ]);
    console.log('----------transferCalldata-------');
    console.log(transferCalldata);
    const description = 'Proposal #1: Give grant to team';
    // await governor.propose(
    //   [tokenAddress],
    //   [0],
    //   [transferCalldata],
    //   “Proposal #1: Give grant to team”,
    // );
    console.log('token.address----');
    console.log(token.address);
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
      console.log('error------------');
      console.log(e);
    }
  }

  async function getVotes(account, blockNumber, gov) {
    console.log('num--------------');
    const num = await gov.getVotes(account, blockNumber);

    console.log(num);
  }

  describe('Gov', function () {
    it('deploy', async function () {
      console.log('------------1');
      const { token, gov, owner, otherAccount } = await loadFixture(
        deployGovFixture
      );

      // console.log('----otherAccount.address');
      // console.log(otherAccount.address);
      let ret = await propose(token, owner.address, gov);
      console.log('ret---------------');
      console.log(ret);

      // let a = await gov.hasVoted(0, owner.address);
      // console.log('a-----------');
      // console.log(a);
      // a = await gov.hasVoted(1, owner.address);
      // console.log('a-----------');
      // console.log(a);
      // console.log('------------3');
    });
  });
});
