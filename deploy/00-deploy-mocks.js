const hre=require("hardhat");

const { ethers, network } = require("hardhat")

const BASE_FEE = ethers.utils.parseEther("0.25");
const GAS_PRICE_LINK = 1e9

module.exports= async ({ getNamedAccounts, deployments }) => {
    console.log("begining .........................")
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId
    console.log(chainId)
    // const Lottery= await hre.ethers.getContractFactory("Lottery");

    const args = [BASE_FEE, GAS_PRICE_LINK]
    if (chainId == 31337) {
        log("Local network detected! Deploying mocks...")
        //deploy a mock vrfcordinator
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks Deployed")
        log("____________________________________")
    }
}
module.exports.tags=["all", "mocks"]
