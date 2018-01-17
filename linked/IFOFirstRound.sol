pragma solidity ^0.4.18;


/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {
  function mul(uint256 a, uint256 b) internal constant returns (uint256) {
    uint256 c = a * b;
    assert(a == 0 || c / a == b);
    return c;
  }

  function div(uint256 a, uint256 b) internal constant returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  function sub(uint256 a, uint256 b) internal constant returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  function add(uint256 a, uint256 b) internal constant returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public owner;


  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);


  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  function Ownable() {
    owner = msg.sender;
  }


  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }


  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) onlyOwner public {
    require(newOwner != address(0));
    OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

}

/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 */
contract Pausable is Ownable {
  event Pause();
  event Unpause();

  bool public paused = false;


  /**
   * @dev Modifier to make a function callable only when the contract is not paused.
   */
  modifier whenNotPaused() {
    require(!paused);
    _;
  }

  /**
   * @dev Modifier to make a function callable only when the contract is paused.
   */
  modifier whenPaused() {
    require(paused);
    _;
  }

  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  function pause() onlyOwner whenNotPaused public {
    paused = true;
    Pause();
  }

  /**
   * @dev called by the owner to unpause, returns to normal state
   */
  function unpause() onlyOwner whenPaused public {
    paused = false;
    Unpause();
  }
}


/**
 * @title ERC20Basic
 * @dev Simpler version of ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/179
 */
contract ERC20Basic {
  uint256 public totalSupply;
  function balanceOf(address who) public constant returns (uint256);
  function transfer(address to, uint256 value) public returns (bool);
  event Transfer(address indexed from, address indexed to, uint256 value);
}


/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 is ERC20Basic {
  function allowance(address owner, address spender) public constant returns (uint256);
  function transferFrom(address from, address to, uint256 value) public returns (bool);
  function approve(address spender, uint256 value) public returns (bool);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}


/**
 * @title Basic token
 * @dev Basic version of StandardToken, with no allowances.
 */
contract BasicToken is ERC20Basic {
  using SafeMath for uint256;

  mapping(address => uint256) balances;

  /**
  * @dev transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));

    // SafeMath.sub will throw if there is not enough balance.
    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    Transfer(msg.sender, _to, _value);
    return true;
  }

  /**
  * @dev Gets the balance of the specified address.
  * @param _owner The address to query the the balance of.
  * @return An uint256 representing the amount owned by the passed address.
  */
  function balanceOf(address _owner) public constant returns (uint256 balance) {
    return balances[_owner];
  }

}






contract NILToken is MintableToken, PausableToken {

  string public name = "NIL Token";

  string public symbol = "NIL";

  uint8 public decimals = 9;

  uint8 public me = 167;

  function pause() onlyOwner whenNotPaused canMint public {
    super.pause();
  }

}


// @dev Handles the pre-IFO

contract IFOFirstRound is Ownable {
  using SafeMath for uint;

  uint8 public me = 231;

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

  function() public payable {
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

    // any value is considered a donation to the project
    project.transfer(msg.value);

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
    require(_duration > 0);
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
