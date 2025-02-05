import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "hardhat-contract-sizer";
import "@nomiclabs/hardhat-etherscan";
import 'dotenv/config'
import "hardhat-gas-reporter"

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

export default {
  solidity: "0.8.4",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  networks: {
    rinkeby: {
      url: process.env.STAGING_ALCHEMY_KEY || '',
      accounts: [process.env.PRIVATE_KEY],
    },
    goerli: {
      url: process.env.GOERLI_KEY || '',
      accounts: [process.env.PRIVATE_KEY],
    },
    polygon: {
      chainId: 137,
      url: process.env.PROD_ALCHEMY_KEY || '',
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 70000000000
    },
    mainnet: {
      chaiId: 1,
      url: process.env.PROD_ALCHEMY_KEY_ETH || '',
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  gasReporter: {
    enable: true,
    currency: 'USD',
  },
  etherscan: {
    apiKey: {
      rinkeby: process.env.ETHERSCAN_API_KEY || '',
      goerli: process.env.ETHERSCAN_API_KEY || '',
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      polygon: process.env.POLYGONSCAN_API_KEY || '',
    }
  }
};
