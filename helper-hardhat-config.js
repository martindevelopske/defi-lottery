const { ethers } = require("hardhat")

const networkConfig= {
    5: {
        name: "goerli",
        VRFfCoordinatorV2: "	0x2bce784e69d2Ff36c71edcB9F88358dB0DfB55b4",
        entranceFee: ethers.utils.parseEther("0.01"),
        interval:"30",
        subscriptionId: "10225"
    },
    31337:{
        name: "hardhat",
        entranceFee: ethers.utils.parseEther("0.01"),
        interval:"30",
        subscriptionId: "10225"
    }
}
const developmentChains = ["hardhat", "localhost"]
module.exports= {
    networkConfig,
    developmentChains
}