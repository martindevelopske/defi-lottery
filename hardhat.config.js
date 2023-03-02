/** @type import('hardhat/config').HardhatUserConfig */
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const GOERLI_RPC_URL= process.env.GOERLI_RPC_URL;
const PRIVATE_KEY= process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY=process.env.ETHERSCAN_API_KEY;
const COINMARKETCAP_API_KEY=process.env.COINMARKETCAP_API_KEY;

module.exports = {
    defaultNetwork: "hardhat",
    solidity: "0.8.7",
    networks:{
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        localhost:{
            chainId: 31337,
        },
        goerli:{
            chainId: 5,
            blockConfirmations: 6,
            url: GOERLI_RPC_URL,
            accounts:[PRIVATE_KEY],
            saveDeployments: true,
        },
    },
    etherscan: {
        apiKey: {
            goerli: ETHERSCAN_API_KEY,
        }
    },
    gasReporter:{
        enabled: false,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        }
    },
    contractSizer: {
        runOnCompile: false,
        only:["Lottery"],
    },
    mocha: {
        timeout: 5000000, //200 seconds max
    }
}
