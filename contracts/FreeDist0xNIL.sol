pragma solidity ^0.4.15;


import 'zeppelin/math/SafeMath.sol';
import 'zeppelin/ownership/Ownable.sol';

import './Token0xNIL.sol';


contract FreeDist0xNIL is Ownable {
  using SafeMath for uint;

  event TokenTradable();

  event Log(uint _amount);

  Token0xNIL public token;

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

  uint public tokenSupply;

  bool public projectFoundersReserved;

  uint public projectReserve = 35;

  uint public foundersReserve = 10;

  // states

  modifier onlyState(bytes32 expectedState) {
    require(expectedState == currentState());
    _;
  }

  function currentState() public constant returns (bytes32) {
    uint bn = block.number;

    if (preStartBlock == 0) {
      return "Inactive";
    }
    else if (bn < preStartBlock) {
      return "PreDistInitiated";
    }
    else if (bn <= preEndBlock) {
      return "PreDist";
    }
    else if (startBlock == 0) {
      return "InBetween";
    }
    else if (bn < startBlock) {
      return "DistInitiated";
    }
    else if (bn <= endBlock) {
      return "Dist";
    }
    else if (!token.mintingFinished()) {
      return "Ended";
    }
    else {
      return "Closed";
    }
  }

  // collaborators

  struct Permille {
  uint permille;
  bool active;
  }

  mapping (address => Permille) public permilles;

  address[] public collaborators;

  uint public maxPermillePerCollaborator = 20;

  uint public maxPermille = 50;

  uint public totalPermilles;

  bool public collaboratorsReserved;

  function updateReserveCollaborator(address _collaborator, uint _permille) public onlyOwner {
    require(currentState() != "Inactive");
    require(!collaboratorsReserved);
    require(_collaborator != 0x0 && _collaborator != project && _collaborator != founders);
    require(_permille >= 0 && _permille <= maxPermillePerCollaborator);

    if (permilles[_collaborator].active == false) {
      collaborators.push(_collaborator);
    }
    else {
      uint previousPermille = permilles[_collaborator].permille;
      totalPermilles = totalPermilles.sub(previousPermille);
    }
    totalPermilles = totalPermilles.add(_permille);
    require(totalPermilles <= maxPermille);

    permilles[_collaborator] = Permille(_permille, true);
  }

  function reserveTokensCollaborators() public onlyOwner onlyState("Ended") {
    require(projectFoundersReserved);
    require(!collaboratorsReserved);

    uint totalToCollaborators;
    if (totalPermilles > 0) {
      for (uint i = 0; i < collaborators.length; i++) {
        address collaborator = collaborators[i];
        uint permille = permilles[collaborator].permille;
        totalToCollaborators = totalToCollaborators.add(permille);
        uint amount = tokenSupply.mul(permille).div(1000);
        token.mint(collaborator, amount);
      }
    }
    if (maxPermille > totalToCollaborators) {
      // any unused token goes to founders
      uint rest = maxPermille.sub(totalToCollaborators);
      token.mint(founders, tokenSupply.mul(rest).div(1000));
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

  // 0x7a0c396d
  function giveMeNILs() public payable {
    getTokens();
  }

  function getTokens() internal {
    require(currentState() == "PreDist" || currentState() == "Dist");
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

  function getTokensAmount() public constant returns (uint) {
    uint amount = 1000;
    uint current = block.number;
    uint tokens;
    if (currentState() == "PreDist") {
      tokens = amount * 5;
    }
    else if (currentState() == "Dist"){
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

  function startPreDistribution(uint _startBlock, uint _duration, address _project, address _founders) public onlyOwner onlyState("Inactive") {
    require(_startBlock > block.number);
    require(_duration > 0);
    require(msg.sender != 0x0);
    require(_project != 0x0);
    require(_founders != 0x0);

    maxPerWallet = 30000;
    token = new Token0xNIL();
    token.pause();
    project = _project;
    founders = _founders;
    preDuration = _duration;
    preStartBlock = _startBlock;
    preEndBlock = _startBlock + _duration;
  }

  function startDistribution(uint _startBlock, uint _duration) public onlyOwner onlyState("InBetween") {
    require(_startBlock > block.number);
    require(_duration > 0);

    maxPerWallet = 100000;
    duration = _duration;
    startBlock = _startBlock;
    endBlock = _startBlock + _duration;
  }

  function reserveTokensProjectAndFounders() public onlyOwner onlyState("Ended") {
    require(!projectFoundersReserved);

    tokenSupply = 2 * token.totalSupply();

    uint amount = tokenSupply.mul(projectReserve).div(100);
    token.mint(project, amount);
    amount = tokenSupply.mul(foundersReserve).div(100);
    token.mint(founders, amount);
    projectFoundersReserved = true;
  }

  function unpauseAndFinishMinting() public onlyOwner onlyState("Ended") {
    require(projectFoundersReserved);
    require(collaboratorsReserved);

    token.unpause();
    token.finishMinting();
  }

  function totalSupply() public constant returns (uint){
    require(currentState() != "Inactive");
    return fromNanoNIL(token.totalSupply());
  }

}