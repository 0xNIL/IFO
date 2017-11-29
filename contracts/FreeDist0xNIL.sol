pragma solidity ^0.4.11;


import 'zeppelin/math/SafeMath.sol';
import 'zeppelin/ownership/Ownable.sol';

import './Token0xNIL.sol';


contract FreeDist0xNIL is Ownable {
  using SafeMath for uint;

  event Started();

  event Initiated();

  Token0xNIL public token;

  uint RATIO = 1000;

  uint MAX = 10000;

  uint public preDuration;

  uint public preStartBlock;

  uint public preEndBlock;

  uint public duration;

  uint public startBlock;

  uint public endBlock;

  uint public tokenDistributed;

  uint public totalParticipants;

  address public architect;

  uint tipPercentage = 20;

  enum DistState {Inactive, Waiting, PreDist, InBetween, Dist, Closed}

  DistState currentState = DistState.Inactive;


  // supporters

  uint8 public totalSupporters;

  uint public totalSupportersRatios;

  event TokenToSupporters();

  mapping (address => uint8) public supporters;

  mapping (uint8 => address) public supporterAddress;

  // modifiers


  modifier catStart() {
    require(currentState == DistState.Waiting);
    _;
  }

  modifier canInitiate() {
    require(currentState == DistState.InBetween);
    _;
  }

  modifier canChange() {
    require(isInitiated() && !hasEnded());
    _;
  }

  modifier canTip() {
    require(hasEnded() && !isMintingFinished());
    _;
  }

  modifier canPay() {
    require(isActive());
    _;
  }

  function startPreDistribution(uint _startBlock, uint _duration, address _architect) onlyOwner canStart {
    require(_startBlock > block.number);
    require(_duration > 0);
    require(_architect != 0x0);

    token = createTokenContract();
    architect = _architect;
    preDuration = _duration;
    preStartBlock = _startBlock;
    preEndBlock = _startBlock + _duration;
    currentState = DistState.PreDist;
    Started();
  }

  function createTokenContract() internal returns (Token0xNIL) {
    return new Token0xNIL();
  }

  function startDistribution(uint _startBlock, uint _duration) onlyOwner canInitiate {
    require(_startBlock > block.number);
    require(_duration > 0);

    token = createTokenContract();
    duration = _duration;
    startBlock = _startBlock;
    endBlock = _startBlock + _duration;
    currentState = DistState.Dist;
    Initiated();
  }

  function getTokensPerBlockNumber() public constant returns (uint) {
    uint current = block.number;
    if (currentState == DistState.PreDist) {
      return MAX;
    }
    else {
      uint step = current - startBlock;
      uint ratio = duration / 3;
      uint tokens = RATIO;
      if (step < ratio) {
        tokens += RATIO * 40 / 100;
      }
      else if (step < 2 * ratio) {
        tokens += RATIO * 20 / 100;
      }
      return tokens;
    }
  }

  function addSupporter(address _supporter, uint8 _ratio) onlyOwner {
    require(!isActive());
    require(_ratio >= 0 && _ratio <= 5);
    require(_supporter != 0x0);

    uint8 id;
    uint8 previousRatio;
    bool supporterExists = false;
    for (uint8 i = 0; i < totalSupporters; i++) {
      address supporter = supporterAddress[i];
      if (supporter == _supporter) {
        supporterExists = true;
        id = i;
        previousRatio = supporters[supporter];
        break;
      }
    }
    if (!supporterExists) {
      id = totalSupporters++;
      supporterAddress[id] = _supporter;
    }
    supporters[_supporter] = _ratio;
    totalSupportersRatios += _ratio - previousRatio;
  }

//  event ChangeDuration(uint oldDuration, uint newDuration);
//
//  function changeDuration(uint _duration) onlyOwner canChange {
//    require(startBlock + _duration > block.number);
//    endBlock = startBlock + _duration;
//    ChangeDuration(startBlock + _duration, block.number);
//  }

  function toNanoNIL(uint amount) internal constant returns (uint) {
    return amount * 10 ** uint(token.decimals());
  }

  function tipTheTeam() onlyOwner canTip {

    uint amount = tokenDistributed * tipPercentage / 100;
    if (amount > 0) {
      token.mint(architect, toNanoNIL(amount));
      for (uint8 i = 0; i < totalSupporters; i++) {
        address supporter = supporterAddress[i];
        amount = tokenDistributed * supporters[supporter] / 100;
        token.mint(supporter, toNanoNIL(amount));
      }
      token.finishMinting();
    }
  }

  function() canPay payable {
    getTokens();
  }

  // 0x7a0c39
  function giveMeNILs() canPay payable {
    getTokens();
  }

  function getTokens() internal {
    require(isActive());
    require(msg.sender != 0x0);
    require(msg.value <= 1);

    uint balance = tokenBalanceOf(msg.sender);
    if (balance == 0) {
      totalParticipants++;
    }

    uint limit = toNanoNIL(MAX);

    require(balance < limit);

    uint tokensPerBlockNumber = getTokensPerBlockNumber();

    uint factor = 10 ** uint(token.decimals());
    if (balance > 0 && (balance / factor) + tokensPerBlockNumber > MAX) {
      tokensPerBlockNumber = MAX - (balance / factor);
    }

    token.mint(msg.sender, toNanoNIL(tokensPerBlockNumber));
    tokenDistributed += tokensPerBlockNumber;
  }

  function tokenBalanceOf(address who) public constant returns (uint){
    require(isInitiated());
    return token.balanceOf(who);
  }

  function totalSupply() public constant returns (uint){
    require(isInitiated());
    return token.totalSupply();
  }

  function hasEnded() public constant returns (bool) {
    return block.number > endBlock;
  }

  function isActive() public constant returns (bool) {
    if ((currentState == DistState.PreDist && block.number >= preStartBlock && block.number <= preEndBlock) || (currentState == DistState.Dist && block.number >= startBlock && block.number <= endBlock)) {
      return true;
    } else {
      if (currentState == DistState.Dist && block.number > endBlock) {
        currentState = DistState.Closed;
      } else if (currentState == DistState.PreDist && block.number > preEndBlock) {
        currentState = DistState.InBetween;
      }
      return false;
    }
  }

  function isInitiated() public constant returns (bool) {
    return startBlock > 0;
  }

  function isMintingFinished() public constant returns (bool) {
    require(isInitiated());
    return token.mintingFinished();
  }

}