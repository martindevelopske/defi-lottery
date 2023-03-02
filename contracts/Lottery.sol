// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
import "@chainlink/contracts/src/v0.8/VRFV2WrapperConsumerBase.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
//enter lottery
//pick a random winner at an interval-automated
//use chainlink to get randomnesss

//errors
error Lottery__NotEnoughEthEntered();
error Lottery__TransferFailed();
error Lottery__NotOpen();
error Lottery__UpkeepNotNeeded(uint256 currentBalance, uint256 playerCount, uint256 lotteryState);
//THE CONTRACT

/**
 * @title A lottery contract
 * @author Martin Ndung'u
 * @notice This contract is for creating a decentralized lottery smart contract
 * @dev it utilizes the chainlink keepers and also chainlink get randomness.
 */
contract Lottery is VRFV2WrapperConsumerBase, AutomationCompatible {

    /* type declaration */
       enum lotteryState{
        OPEN, CALCULATING
    }

    uint32 internal callbackGasLimit=100000;
    uint32 internal numWords=2;
    uint16 public requestConfirmations =3;
    address linkAddress=0x326C977E6efc84E512bB9C30f76E30c160eD06FB;
    address wrapperAddress=	0x708701a1DfF4f478de54383E49a627eD4852C816;

    // state variables
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    //lottery variables
    address private s_recentWinner;
    lotteryState private s_lotteryState;
    uint256 private s_lastTimestamp;
    uint256 private s_currentTimestamp;
    uint256 private immutable i_interval;
        //events
    event LotteryEntered(address indexed player);
    event FulfilledRequest(uint random, uint256 requestId);
    event WinnerPicked(address winner);
    event RequestFulfilled(
        uint256 requestId,
        uint256[] randomWords,
        uint256 payment);
    event RequestSent(
        uint256 requestId,
         uint32 numWords);
   

    struct RequestStatus{
        uint256 paid;
        bool fulfilled;
        uint256[] randomWords;
    }
    mapping(uint256 => RequestStatus)
    public s_requests;

    uint256 [] public requestIds;
    uint256 public lastRequestId;
    //functions

    //constructor
    constructor(uint256 entranceFee, uint256 interval) VRFV2WrapperConsumerBase(linkAddress, wrapperAddress){
        s_lastTimestamp=block.timestamp;
        i_interval=interval;
        s_lotteryState= lotteryState.OPEN;
        i_entranceFee = entranceFee;
    }

    function enterLottery() public payable {
        if(s_lotteryState != lotteryState.OPEN){
            revert Lottery__NotOpen();
        }
        if (msg.value < i_entranceFee) revert Lottery__NotEnoughEthEntered();
        s_players.push(payable(msg.sender)); //cast in payable because the s_players array is a payable array
        emit LotteryEntered(msg.sender);
    }
    //get random number
    function requestRandomWords() external returns(uint256 requestId){
      requestId= requestRandomness(
        callbackGasLimit,
        requestConfirmations,
        numWords
      );
      s_requests[requestId]=RequestStatus({
        paid: VRF_V2_WRAPPER.calculateRequestPrice(callbackGasLimit),
        randomWords: new uint256[](0),
        fulfilled: false
      });
      requestIds.push(requestId);
      lastRequestId=requestId;
      emit RequestSent(requestId, numWords);
      return requestId;
    }
    /**
     * @dev This the function that the chainlink keeper automation nodes call.
     * check upkeep returns a boolean which triggers the perform upkeep
     */
    //check upkeep
    function checkUpkeep(bytes memory /*checkData*/) public view override returns(bool upkeepNeeded, bytes memory /*performData*/){
        bool isOpen= lotteryState.OPEN == s_lotteryState;
        bool timePassed =((block.timestamp - s_lastTimestamp) > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance= (address(this).balance > 0);
        upkeepNeeded=(timePassed && isOpen && hasBalance && hasPlayers);
    }

    //perform upKeep
  
    function performUpkeep(
         bytes calldata /*perfomData*/) 
         external override {
        (bool upKeepNeeded,)=checkUpkeep("");
        if(!upKeepNeeded){
            revert Lottery__UpkeepNotNeeded(address(this).balance, s_players.length, uint256(s_lotteryState));
        } 

        s_lotteryState=lotteryState.CALCULATING;
        
    }
    function fulfillRandomWords(
        uint256 requestId, 
        uint256[] memory randomWords) 
    internal 
    override{
        require(s_requests[requestId].paid > 0, "request not found");
        s_requests[requestId].fulfilled=true;
        s_requests[requestId].randomWords= randomWords;

        emit RequestFulfilled(
            requestId,
            randomWords,
            s_requests[requestId].paid);

        uint256 indexOfWinner = randomWords[0] % s_players.length; 
        address payable recentWinner=s_players[indexOfWinner];
        s_recentWinner=recentWinner;
        (bool success,)=recentWinner.call{value: address(this).balance}("");
        if(!success) revert Lottery__TransferFailed();
        emit WinnerPicked(recentWinner);
        s_players= new address payable[](0);
        s_lotteryState=lotteryState.OPEN;
        s_lastTimestamp=block.timestamp;
    }
    //withdraw link
    function withdrawLink() public {
        LinkTokenInterface link= LinkTokenInterface(linkAddress);
        require(
            link.transfer(msg.sender, link.balanceOf(address(this))),"unable to transfer"
        );
    }

    //getters view/pure functions
    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }
    function getPlayers(uint256 index) public view returns(address){
        return s_players[index];
    }
    function getRecentWinner()public view returns(address){
        return s_recentWinner;
    }
    function getLotteryState() public view returns(lotteryState){
        return s_lotteryState;
    }
    // function getNumberOfWords() public view returns(RequestStatus){
    //     return RequestStatus.randomWords.length;
    // }
    function getPlayerCount() public view returns(uint256){
        return s_players.length;
    }
    function getLastTimestamp() public view returns (uint256){
        return s_lastTimestamp;
    }
    function getInterval()public view returns(uint256){
        return i_interval;
    }
}
