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

  uint maxPerWallet;

  address project;

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

  uint public tokenDistributed;

  bool public projectFoundersReserved;

  uint public projectReserve = 80;

  uint public foundersReserve = 20;

  // states

  enum DistState {Inactive, PreDist, InBetween, Dist, Ended, Closed}

  DistState currentState = DistState.Inactive;

  modifier onlyState(DistState expectedState) {
    require(expectedState == currentState);
    _;
  }

  modifier canRequest() {
    require((currentState == DistState.PreDist && block.number >= preStartBlock && block.number <= preEndBlock) || (currentState == DistState.Dist && block.number >= startBlock && block.number <= endBlock));
    _;
  }

  function acceptingRequests() public constant returns (bool) {
    return (currentState == DistState.PreDist && block.number >= preStartBlock && block.number <= preEndBlock) || (currentState == DistState.Dist && block.number >= startBlock && block.number <= endBlock);
  }

  function getCurrentState() public constant returns (string) {
    if (currentState == DistState.Inactive) {
      return "Inactive";
    }
    else if (currentState == DistState.PreDist) {
      return "PreDist";
    }
    else if (currentState == DistState.InBetween) {
      return "InBetween";
    }
    else if (currentState == DistState.Dist) {
      return "Dist";
    }
    else if (currentState == DistState.Ended) {
      return "Ended";
    }
    else {
      return "Closed";
    }
  }

  function changeState(bytes32 newState) internal {
    if (newState == "PreDist" && currentState == DistState.Inactive) {
      currentState = DistState.PreDist;
    }
    else if (newState == "InBetween" && currentState == DistState.PreDist) {
      currentState = DistState.InBetween;
    }
    else if (newState == "Dist" && currentState == DistState.InBetween) {
      currentState = DistState.Dist;
    }
    else if (newState == "Ended" && currentState == DistState.Dist) {
      currentState = DistState.Ended;
    }
    else if (newState == "Closed" && currentState == DistState.Ended) {
      currentState = DistState.Closed;
    }
    else revert();
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

  function updateReserveCollaborator(address _collaborator, uint _permille) public onlyOwner {
    require(currentState != DistState.Inactive);
    require(!collaboratorsReserved);
    require(_collaborator != 0x0 && _collaborator != project && _collaborator != founders);
    require(_permille >= 0 && _permille <= maxPermille);

    if (permilles[_collaborator].active == false) {
      collaborators.push(_collaborator);
    }
    permilles[_collaborator] = Permille(_permille, true);
  }

  function reserveTokensCollaborators() public onlyOwner onlyState(DistState.Ended) {
    require(!collaboratorsReserved);

    if (collaborators.length > 0) {
      for (uint i = 0; i < collaborators.length; i++) {
        address collaborator = collaborators[i];
        uint permille = permilles[collaborator].permille;
        uint amount = tokenDistributed.mul(permille).div(1000);
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

  function() public payable {
    getTokens();
  }

  // 0x7a0c39
  function giveMeNILs() public payable {
    getTokens();
  }

  function getTokens() internal canRequest {
    require(msg.sender != 0x0);

    uint balance = token.balanceOf(msg.sender);
    if (balance == 0) {
      totalParticipants++;
    }

    uint limit = toNanoNIL(maxPerWallet);

    require(balance < limit);

    // any value is considered a donation to the project
    project.transfer(msg.value);

    uint tokensToBeMinted = toNanoNIL(getTokensAmount());

    if (balance > 0 && balance + tokensToBeMinted > limit) {
      tokensToBeMinted = limit.sub(balance);
    }

    token.mint(msg.sender, tokensToBeMinted);

  }

  function endDists() public onlyOwner {
    require((currentState == DistState.Dist && block.number > endBlock) || (currentState == DistState.PreDist && block.number > preEndBlock));
    if (currentState == DistState.Dist) {
      changeState("Ended");
      tokenDistributed = token.totalSupply();
      DistEnded();
    }
    else {
      changeState("InBetween");
      PreDistEnded();
    }
  }

  function getTokensAmount() public canRequest constant returns (uint) {
    uint amount = 1000;
    uint current = block.number;
    uint tokens;
    if (currentState == DistState.PreDist) {
      tokens = amount * 5;
    }
    else {
      uint step = current - startBlock;
      uint ratio = duration / 3;
      tokens = amount;
      if (step < ratio) {
        tokens += amount * 40 / 100;
      }
      else if (step < 2 * ratio) {
        tokens += amount * 20 / 100;
      }
    }
    return tokens;
  }


  // phases

  function startPreDistribution(uint _startBlock, uint _duration, address _project, address _founders) public onlyOwner onlyState(DistState.Inactive) {
    require(_startBlock > block.number);
    require(_duration > 0);
    require(msg.sender != 0x0);
    require(_project != 0x0);
    require(_founders != 0x0);
    changeState("PreDist");

    maxPerWallet = 30000;
    token = new NILToken();
    token.pause();
    project = _project;
    founders = _founders;
    preDuration = _duration;
    preStartBlock = _startBlock;
    preEndBlock = _startBlock + _duration;

    PreDistStarted();
  }

  function startDistribution(uint _startBlock, uint _duration) public onlyOwner onlyState(DistState.InBetween) {
    require(_startBlock > block.number);
    require(_duration > 0);
    changeState("Dist");

    maxPerWallet = 100000;
    duration = _duration;
    startBlock = _startBlock;
    endBlock = _startBlock + _duration;

    DistStarted();
  }

  function reserveTokensProjectAndFounders() public onlyOwner onlyState(DistState.Ended) {
    require(!projectFoundersReserved);

    uint amount = tokenDistributed.mul(projectReserve).div(100);
    token.mint(project, amount);
    amount = tokenDistributed.mul(foundersReserve).div(100);
    token.mint(founders, amount);
    projectFoundersReserved = true;
  }

  function unpauseAndFinishMinting() public onlyOwner onlyState(DistState.Ended) {
    require(!token.mintingFinished());
    require(projectFoundersReserved);
    require(collaboratorsReserved);

    token.unpause();
    token.finishMinting();

    changeState("Closed");
    TokenTradable();
  }

  function totalSupply() public constant returns (uint){
    require(currentState != DistState.Inactive);
    return fromNanoNIL(token.totalSupply());
  }

}