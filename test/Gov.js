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

    return { token, gov, owner };
  }

  describe('Gov', function () {
    it('deploy', async function () {
      console.log('------------1');
      const { token, gov, owner } = await loadFixture(deployGovFixture);
      console.log('------------2');
    });
  });
});
