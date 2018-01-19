pragma solidity ^0.4.18;


import 'zeppelin/math/SafeMath.sol';
import 'zeppelin/ownership/Ownable.sol';

import './NILToken.sol';


// @dev Handles the pre-IFO

contract IFOFirstRound is Ownable {
  using SafeMath for uint;

  NILToken public token;

  uint public maxPerWallet = 30000;

  address public project;

  address public founders;

  uint public baseAmount = 1000;

  // pre dist

  uint public preDuration;

  uint public preStartBlock;

  uint public preEndBlock;

  // numbers

  uint public totalParticipants;

  uint public tokenSupply;

  bool public projectFoundersReserved;

  uint public projectReserve = 35;

  uint public foundersReserve = 15;

  function IFOFirstRound() public {
    token = new NILToken();
    token.pause();
  }

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
    else {
      return "InBetween";
    }
  }

  // distribution

  function _toNanoNIL(uint amount) internal constant returns (uint) {
    return amount.mul(10 ** uint(token.decimals()));
  }

  function _fromNanoNIL(uint amount) internal constant returns (uint) {
    return amount.div(10 ** uint(token.decimals()));
  }

  // requiring NIL

  function() external payable {
    _getTokens();
  }

  // 0x7a0c396d
  function giveMeNILs() public payable {
    _getTokens();
  }

  function _getTokens() internal {
    require(currentState() == "PreDist" || currentState() == "Dist");
    require(msg.sender != address(0));

    uint balance = token.balanceOf(msg.sender);
    if (balance == 0) {
      totalParticipants++;
    }

    uint limit = _toNanoNIL(maxPerWallet);

    require(balance < limit);

    uint tokensToBeMinted = _toNanoNIL(getTokensAmount());

    if (balance > 0 && balance + tokensToBeMinted > limit) {
      tokensToBeMinted = limit.sub(balance);
    }

    token.mint(msg.sender, tokensToBeMinted);

  }

  function getTokensAmount() public constant returns (uint) {
    if (currentState() == "PreDist") {
      return baseAmount.mul(5);
    } else {
      return 0;
    }
  }

  function startPreDistribution(uint _startBlock, uint _duration, address _project, address _founders) public onlyOwner onlyState("Inactive") {
    require(_startBlock > block.number);
    require(_duration > 0 && _duration < 30000);
    require(msg.sender != address(0));
    require(_project != address(0));
    require(_founders != address(0));

    project = _project;
    founders = _founders;
    preDuration = _duration;
    preStartBlock = _startBlock;
    preEndBlock = _startBlock + _duration;
  }

  function reserveTokensProjectAndFounders() public onlyOwner onlyState("InBetween") {
    require(!projectFoundersReserved);

    tokenSupply = 2 * token.totalSupply();

    uint amount = tokenSupply.mul(projectReserve).div(100);
    token.mint(project, amount);
    amount = tokenSupply.mul(foundersReserve).div(100);
    token.mint(founders, amount);
    projectFoundersReserved = true;

    if (this.balance > 0) {
      project.transfer(this.balance);
    }
  }

  function totalSupply() public constant returns (uint){
    require(currentState() != "Inactive");
    return _fromNanoNIL(token.totalSupply());
  }

  function transferTokenOwnership(address _newOwner) public onlyOwner {
    require(projectFoundersReserved);
    token.transferOwnership(_newOwner);
  }

}
