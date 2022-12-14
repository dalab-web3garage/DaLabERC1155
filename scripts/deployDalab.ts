import { ethers } from 'hardhat';
import 'dotenv/config'

const main = async () => {
  const DaLabfactoryErc1155 = await ethers.getContractFactory('DALabERC1155');
  const factoryErc1155 = await DaLabfactoryErc1155.deploy();
  await factoryErc1155.deployed()
  console.log('badge contract', factoryErc1155.address)

  const badgeArgs = {
    mintable: true,
    transferable: true,
    maxSupply: 30,
    tokenURI: process.env.URL,
    maxMintPerWallet: 1,
  };

  await factoryErc1155.createBadge(badgeArgs);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
