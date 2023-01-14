// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat');
const { ethers } = require('hardhat');

async function main() {
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

  // const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  // const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  // const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  // const lockedAmount = hre.ethers.utils.parseEther('1');

  // const Gacha = await hre.ethers.getContractFactory('Gacha');
  // const lock = await Gacha.deploy();

  // await lock.deployed();

  // console.log(
  //   `Gacha with 1 ETH and unlock timestamp ${unlockTime} deployed to ${lock.address}`
  // );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
