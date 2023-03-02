
const { network, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");


module.exports = async({getNamedAccounts, deployments})=>{
    const {log, deploy}=deployments;
    const {deployer}= await getNamedAccounts();
    let vrfCordinatorV2address;
    const chainId=network.config.chainId;
    if(developmentChains.includes(network.name)){
        const VRFCoordinatorV2Mock= await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCordinatorV2address=VRFCoordinatorV2Mock.address;
    }
    else{
        vrfCordinatorV2address=networkConfig[chainId]["VRFCoordinatorV2"]
    }
    const entranceFee=networkConfig[chainId]["entranceFee"];
    const interval= networkConfig[chainId]["interval"]
    const args=[entranceFee,interval]
    const lottery= await deploy("Lottery", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations,
    })
    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        console.log("VERIFYING.....")
        await verify(lottery.address, args)
    }{
        log("___________________")
    }
}
module.exports.tags=["all","lottery"]