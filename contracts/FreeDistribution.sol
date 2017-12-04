pragma solidity ^0.4.15;


import 'zeppelin/math/SafeMath.sol';
import 'zeppelin/ownership/Ownable.sol';

import './NILToken.sol';


contract FreeDistribution is Ownable {
  using SafeMath for uint;

  event PreDistStarted();

  event DistStarted();

  event PreDistEnded();

  event DistEnded();

  event TokenTradable();

  NILToken public token;

  uint ratio = 1000;

  uint maxPerWallet;

  address founders;

  // pre dist

  uint public preDuration;

  uint public preStartBlock;

  uint public preEndBlock;

  // dist

  uint public duration;

  uint public startBlock;

  uint public endBlock;

  // numbers

  uint public totalParticipants;

  bool public projectFoundersReserved;

  uint projectReserve = 80;

  uint foundersReserve = 20;

  // states

  enum DistState {Inactive, PreDist, InBetween, Dist, Ended, Closed}

  DistState currentState = DistState.Inactive;

  modifier onlyState(DistState expectedState) {
    require(expectedState == currentState);
    _;
  }

  modifier canRequest() {
    if (currentState == DistState.Dist && block.number > endBlock) {
      changeState("Ended");
      DistEnded();
    }
    else if (currentState == DistState.PreDist && block.number > preEndBlock) {
      changeState("InBetween");
      PreDistEnded();
    }
    require((currentState == DistState.PreDist && block.number >= preStartBlock && block.number <= preEndBlock) || (currentState == DistState.Dist && block.number >= startBlock && block.number <= endBlock));
    _;
  }

  function changeState(bytes32 newState) internal returns (bool) {
    if (newState == "PreDist" && currentState == DistState.Inactive) {
      currentState = DistState.PreDist;
      return true;
    }
    else if (newState == "InBetween" && currentState == DistState.PreDist) {
      currentState = DistState.InBetween;
      return true;
    }
    else if (newState == "Dist" && currentState == DistState.InBetween) {
      currentState = DistState.Dist;
      return true;
    }
    else if (newState == "Ended" && currentState == DistState.Dist) {
      currentState = DistState.Ended;
      return true;
    }
    else if (newState == "Closed" && currentState == DistState.Ended) {
      currentState = DistState.Closed;
      return true;
    }
    return false;
  }

  // collaborators

  struct Permille {
  uint permille;
  bool active;
  }

  mapping (address => Permille) public permilles;

  address[] public collaborators;

  uint public maxPermille = 30;

  bool public collaboratorsReserved;

  function updateReserveCollaborator(address _address, uint _permille) public onlyOwner {
    require(founders != 0x0);
    require(!collaboratorsReserved);
    require(_collaborator != 0x0 && _collaborator != owner && _collaborator != founders);
    require(_permille >= 0 && _permille <= maxPermille);

    if (permilles[_address].active == false) {
      collaborators.push(_address);
    }
    permilles[_address] = Permille(_permille, true);
  }

  function reserveTokensCollaborators() public onlyOwner onlyState(DistState.Ended) {
    require(!collaboratorsReserved);

    if (collaborators.length > 0) {
      uint totalSupply = token.totalSupply();
      for (uint i = 0; i < collaborators.length; i++) {
        address collaborator = collaborators[i];
        uint permille = permilles[collaborator].permille;
        uint amount = totalSupply.mul(permille).div(1000);
        token.mint(collaborator, amount);
      }
    }
    collaboratorsReserved = true;
  }

  // distribution

  function toNanoNIL(uint amount) internal constant returns (uint) {
    return amount.mul(10 ** uint(token.decimals()));
  }

  function fromNanoNIL(uint amount) internal constant returns (uint) {
    return amount.div(10 ** uint(token.decimals()));
  }

  // requiring NIL

  function() payable {
    getTokens();
  }

  // 0x7a0c39
  function giveMeNILs() payable {
    getTokens();
  }

  function getTokens() internal canRequest {
    require(isActive());
    require(msg.sender != 0x0);

    uint balance = token.balanceOf(msg.sender);
    if (balance == 0) {
      totalParticipants++;
    }

    uint limit = toNanoNIL(maxPerWallet);

    require(balance < limit);

    // any value is considered a donation to the project
    owner.transfer(msg.value);

    uint tokensToBeMinted = toNanoNIL(getTokensToBeMinted());

    if (balance > 0 && balance + tokensToBeMinted > limit) {
      tokensToBeMinted = limit.sub(balance);
    }

    token.mint(msg.sender, tokensToBeMinted);
  }

  function getTokensToBeMinted() internal canRequest constant returns (uint) {

    uint current = block.number;
    uint tokens;
    if (currentState == DistState.PreDist) {
      tokens = ratio * 5;
    }
    else {
      uint step = current - startBlock;
      uint ratio = duration / 3;
      tokens = ratio;
      if (step < ratio) {
        tokens += ratio * 40 / 100;
      }
      else if (step < 2 * ratio) {
        tokens += ratio * 20 / 100;
      }
    }
    return tokens;
  }


  // phases

  function startPreDistribution(uint _startBlock, uint _duration, address _founders) onlyOwner onlyState(DistState.Inactive) {
    require(_startBlock > block.number);
    require(_duration > 0);
    require(msg.sender != 0x0);
    require(_founders != 0x0);
    require(changeState("PreDist"));

    maxPerWallet = 30000;
    token = new NILToken();
    token.pause();
    founders = _founders;
    preDuration = _duration;
    preStartBlock = _startBlock;
    preEndBlock = _startBlock + _duration;

    PreDistStarted();
  }

  function startDistribution(uint _startBlock, uint _duration) onlyOwner onlyState(DistState.InBetween) {
    require(_startBlock > block.number);
    require(_duration > 0);
    require(changeState("Dist"));

    maxPerWallet = 100000;
    duration = _duration;
    startBlock = _startBlock;
    endBlock = _startBlock + _duration;

    DistStarted();
  }

  function reserveTokensProjectAndFounders() public onlyOwner onlyState(DistState.Ended) {
    require(!projectFoundersReserved);

    uint totalSupply = token.totalSupply();
    uint amount = totalSupply.mul(projectReserve).div(100);
    token.mint(owner, amount);
    amount = tokenSupply.mul(foundersReserve).div(100);
    token.mint(founders, amount);
    projectFoundersReserved = true;
  }

  function unpauseAndFinishMinting() public onlyOwner onlyState(DistState.Ended) {
    require(!token.mintingFinished());
    require(projectFoundersReserved);
    require(collaboratorsReserved);

    token.unpause();
    token.finishMinting();

    changeState(DistState.Closed);
    TokenTradable();
  }

  function totalSupply() public exceptState(DistState.Inactive) constant returns (uint){
    return fromNanoNIL(token.totalSupply());
  }

}