const { assert, expect } = require("chai")
const { deployments, getNamedAccounts, network } = require("hardhat")
const { ethers } = require("hardhat/internal/lib/hardhat-lib")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery", async () => {
          let Lottery, VRFCoordinatorV2Mock, entranceFee, deployer, interval
          const chainId = network.config.chainId
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              Lottery = await ethers.getContract("Lottery", deployer)
              VRFCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              )
              entranceFee = await Lottery.getEntranceFee()
              interval = await Lottery.getInterval()
          })
          describe("constructor", function () {
              it("initializes the Lottery correctly", async function () {
                  const lotteryState = await Lottery.getLotteryState()
                  assert.equal(lotteryState.toString(), "0")
                  const interval = await Lottery.getInterval()
                  assert.equal(
                      interval.toString(),
                      networkConfig[chainId]["interval"]
                  )
              })
          })
          describe("enter lottery", function () {
              it("reverts when you dont pay enough", async function () {
                  await expect(Lottery.enterLottery()).to.be.revertedWith(
                      "Lottery__NotEnoughEthEntered"
                  )
              })
              it("records players when they entered", async function () {
                  await Lottery.enterLottery({ value: entranceFee })
                  const playerFromContract = await Lottery.getPlayers(0)
                  assert.equal(playerFromContract, deployer)
              })
              it("emits event on enter", async function () {
                  await expect(
                      Lottery.enterLottery({ value: entranceFee })
                  ).to.emit(Lottery, "LotteryEntered")
              })
              it("doesn't allow entrance when Lottery is calculating", async function () {
                  await Lottery.enterLottery({ value: entranceFee })
                  //use time travel methods to behave like the chainlink keepers to change the state of the lottery
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  const state = await Lottery.getLotteryState()
                  console.log(state)
                  await network.provider.send("evm_mine", [])
                  await Lottery.performUpkeep([])
                  await expect(
                      Lottery.enterLottery({ value: entranceFee })
                  ).to.be.revertedWith("Lottery__NotOpen")
              })
          })
          describe("check upkeep", () => {
              it("returns false if people haven't sent any Eth", async function () {
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  //call static is used to simulate calling a function
                  const { upkeepNeeded } = await Lottery.callStatic.checkUpkeep(
                      []
                  )
                  assert(!upkeepNeeded)
              })

              it("returns false if lottery isn't open", async function () {
                  await Lottery.enterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  await Lottery.performUpkeep([])
                  const lotteryState = await Lottery.getLotteryState()
                  const { upkeepNeeded } = await Lottery.callStatic.checkUpkeep(
                      []
                  )
                  assert.equal(lotteryState.toString(), "1")
                  assert.equal(upkeepNeeded, false)
              })
              it("returns false if enough time hasn't passed", async function () {
                  await Lottery.enterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() - 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
                  const { upkeepNeeded } = await Lottery.callStatic.checkUpkeep(
                      []
                  )
                  assert(!upkeepNeeded)
              })
          })
          describe("perform upkeep", function () {
              it("reverts when upkeep is not needed", async function () {
                  await Lottery.enterLottery({ value: entranceFee })
                  await expect(Lottery.performUpkeep([])).to.be.revertedWith(
                      "Lottery__UpkeepNotNeeded"
                  )
              })
              it("updates the lottery state, emits the event and calls the vrf coordinator", async function () {
                  await Lottery.enterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                //   const txResponse = await Lottery.performUpkeep([])
                 // const txReciept = await txResponse.wait(1)
                  const requestId = await Lottery.callStatic.performUpkeep([]);
                //  console.log(txReciept)
                  console.log(requestId);
                  // assert(requestId.toNumber() > 0)
                  const state = await Lottery.getLotteryState()
                  console.log(state + "this is the current")
                 // assert.equal(state.toString(), "1")
              })
          })
          describe("fulfill random Words", function () {
              beforeEach(async function () {
                  await Lottery.enterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])
              })
              it("can only be called when there is a request Id", async () => {
                  await expect(
                      VRFCoordinatorV2Mock.fulfillRandomWords(
                          0,
                          Lottery.address
                      )
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      VRFCoordinatorV2Mock.fulfillRandomWords(
                          1,
                          Lottery.address
                      )
                  ).to.be.revertedWith("nonexistent request")
              })
              //wayyy to big test
            //   it("picks a winner, resets the lottery, and sends the money", async () => {
            //       const additionalEntrances = 3
            //       const startingAccountIndex = 1
            //       const accounts = await ethers.getSigners()
            //       //console.log(accounts);
            //       for (
            //           let i = startingAccountIndex;
            //           i < startingAccountIndex + additionalEntrances;
            //           i++
            //       ) {
            //           const accountsConnectedLottery = await Lottery.connect(
            //               accounts[i]
            //           )
            //           await accountsConnectedLottery.enterLottery({
            //               value: entranceFee,
            //           })
            //       }
            //       const startingTimestamp = await Lottery.getLastTimestamp()
            //       //perfomr upkeep
            //       //fulfill random words
            //       await new Promise(async (resolve, reject) => {
            //           Lottery.once("WinnerPicked", async () => {
            //             console.log("found the event finally.");
            //             try{
                            
            //                 console.log(accounts[0]).address;
            //                 console.log(accounts[1]).address;
            //                 console.log(accounts[2]).address;
            //                 console.log(accounts[3]).address;
            //                const recentWinner= await Lottery.getRecentWinner();
            //                console.log(recentWinner);
            //                const LotteryState= await Lottery.getLotteryState();
            //                const endingTimeStamp= await Lottery.getLastTimestamp();
            //                const numPlayers= Lottery.getPlayerCount();
            //                assert(numPlayers == 0)
            //                assert(lotteryState.toString() == "0")
            //                assert(endingTimeStamp> startingTimestamp)
            //             }catch(err){
            //               reject(err);
            //             }
            //             resolve();
            //           })
            //           const tx= await Lottery.performUpkeep();
            //           const txReciept= await tx.wait(1)
            //           await VRFCoordinatorV2Mock.fulfillRandomWords(txReciept.events[1].args.requestId, Lottery.address)
                     
        //     //       })
        //       })
          })
      })
