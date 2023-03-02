const { assert, expect } = require("chai")
const { ethers, getNamedAccounts, network } = require("hardhat")

const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")

//runs only on mainent of testnet
developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery staging test", () => {
          console.log("running test on mainnet......")
          let Lottery, entranceFee, deployer, interval
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              Lottery = await ethers.getContract("Lottery", deployer)

              entranceFee = await Lottery.getEntranceFee()
              interval = await Lottery.getInterval()
              console.log("finished before each hookk....")
          })
          describe("fulfillRandomWords", async () => {
            it("works with live chainlink keepers and vrf", async function(){
                console.log("testing fulfill random words....");
              //enter the lottery
              const startingTimestamp = await Lottery.getLastTimestamp()
              console.log(startingTimestamp.toString());
              console.log("getting accounts...");
              const accounts= await ethers.getSigners();
              
              //setup listener before we enter
              await new Promise(async (resolve, reject) => {
                  Lottery.once("WinnerPicked", async () => {
                      console.log("winner picked and the event is now fired")
                  })
                  try {
                      const recentWinner = await Lottery.getRecentWinner()
                      console.log(recentWinner);
                      const state = await Lottery.getLotteryState()
                      console.log(state + "state");
                      const endingTimeStamp = await Lottery.getLastTimestamp()
                      console.log(endingTimeStamp + "end");
                      await expect(Lottery.getPlayers(0)).to.be.reverted
                      assert.equal(state, 0)
                      resolve()
                  } catch (err) {
                      console.log(err)
                      reject(err)
                  }
              })
              //then enter the lottery
              //this code wont be reached untill listener finishes
              await Lottery.enterLottery({ value: entranceFee })
          })
            }

            )
            
      })
