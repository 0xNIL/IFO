pragma solidity ^0.4.18;


import 'zeppelin/math/SafeMath.sol';
import 'zeppelin/ownership/Ownable.sol';

import './NILToken.sol';

contract IFOFirstRoundAbstract is Ownable{
  NILToken public token;
  uint public me;
  address public project;
  address public founders;
  uint public totalParticipants;
  uint public tokenSupply;
  uint public baseAmount;
}


contract IFOSecondRound is Ownable {
  using SafeMath for uint;

  event TokenTradable();

  event Log(uint _amount);

  NILToken public token;
//  IFOFirstRound internal firstRound;

  uint maxPerWallet = 100000;

  address public project;

  address public founders;

  uint public baseAmount;

  // dist

  uint public duration;

  uint public startBlock;

  uint public endBlock;

  // numbers

  uint public totalParticipants;

  uint public tokenSupply;

  uint public initialTotalSupply;

  bool public projectFoundersReserved;

  uint public projectReserve = 35;

  uint public foundersReserve = 10;

  function getValuesFromFirstRound(address _firstRound, address _token) public onlyOwner  onlyState("Waiting"){

    IFOFirstRoundAbstract firstRound = IFOFirstRoundAbstract(_firstRound);
    token = NILToken(_token);

    require(firstRound.me() == 231);
    require(token.me() == 167);

    project = firstRound.project();
    founders = firstRound.founders();
    baseAmount = firstRound.baseAmount();
    totalParticipants = firstRound.totalParticipants();
    initialTotalSupply = token.totalSupply();
  }


  // states

  modifier onlyState(bytes32 expectedState) {
    require(expectedState == currentState());
    _;
  }

  function currentState() public constant returns (bytes32) {
    uint bn = block.number;

    if (baseAmount == 0) {
      return "Waiting";
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

  mapping(address => Permille) public permilles;

  address[] public collaborators;

  uint public maxPermillePerCollaborator = 20;

  uint public maxPermille = 50;

  uint public totalPermilles;

  bool public collaboratorsReserved;

  function updateReserveCollaborator(address _collaborator, uint _permille) public onlyOwner {
    require(currentState() != "Ended" && currentState() != "Closed");
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

  function _toNanoNIL(uint amount) internal constant returns (uint) {
    return amount.mul(10 ** uint(token.decimals()));
  }

  function _fromNanoNIL(uint amount) internal constant returns (uint) {
    return amount.div(10 ** uint(token.decimals()));
  }

  function() public payable {
    _getTokens();
  }

  // 0x7a0c396d
  function giveMeNILs() public payable {
    _getTokens();
  }

  function _getTokens() internal {
    require(currentState() == "PreDist" || currentState() == "Dist");
    require(msg.sender != 0x0);

    uint balance = token.balanceOf(msg.sender);
    if (balance == 0) {
      totalParticipants++;
    }

    uint limit = _toNanoNIL(maxPerWallet);

    require(balance < limit);

    // any value is considered a donation to the project
    project.transfer(msg.value);

    uint tokensToBeMinted = _toNanoNIL(getTokensAmount());

    if (balance > 0 && balance + tokensToBeMinted > limit) {
      tokensToBeMinted = limit.sub(balance);
    }

    token.mint(msg.sender, tokensToBeMinted);

  }

  function getTokensAmount() public constant returns (uint) {
    uint amount = baseAmount;
    uint current = block.number;
    uint tokens;
    if (currentState() == "Dist") {
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

    tokenSupply = 2 * (token.totalSupply() - initialTotalSupply);

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
    return _fromNanoNIL(token.totalSupply());
  }

}
