pragma solidity ^0.4.24;

// File: openzeppelin-solidity/contracts/ownership/Ownable.sol

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public owner;


  event OwnershipRenounced(address indexed previousOwner);
  event OwnershipTransferred(
    address indexed previousOwner,
    address indexed newOwner
  );


  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  constructor() public {
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
   * @dev Allows the current owner to relinquish control of the contract.
   * @notice Renouncing to ownership will leave the contract without an owner.
   * It will not be possible to call the functions with the `onlyOwner`
   * modifier anymore.
   */
  function renounceOwnership() public onlyOwner {
    emit OwnershipRenounced(owner);
    owner = address(0);
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function transferOwnership(address _newOwner) public onlyOwner {
    _transferOwnership(_newOwner);
  }

  /**
   * @dev Transfers control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function _transferOwnership(address _newOwner) internal {
    require(_newOwner != address(0));
    emit OwnershipTransferred(owner, _newOwner);
    owner = _newOwner;
  }
}

// File: openzeppelin-solidity/contracts/ownership/HasNoEther.sol

/**
 * @title Contracts that should not own Ether
 * @author Remco Bloemen <remco@2π.com>
 * @dev This tries to block incoming ether to prevent accidental loss of Ether. Should Ether end up
 * in the contract, it will allow the owner to reclaim this ether.
 * @notice Ether can still be sent to this contract by:
 * calling functions labeled `payable`
 * `selfdestruct(contract_address)`
 * mining directly to the contract address
 */
contract HasNoEther is Ownable {

  /**
  * @dev Constructor that rejects incoming Ether
  * The `payable` flag is added so we can access `msg.value` without compiler warning. If we
  * leave out payable, then Solidity will allow inheriting contracts to implement a payable
  * constructor. By doing it this way we prevent a payable constructor from working. Alternatively
  * we could use assembly to access msg.value.
  */
  constructor() public payable {
    require(msg.value == 0);
  }

  /**
   * @dev Disallows direct send by settings a default function without the `payable` flag.
   */
  function() external {
  }

  /**
   * @dev Transfer all Ether held by the contract to the owner.
   */
  function reclaimEther() external onlyOwner {
    owner.transfer(address(this).balance);
  }
}

// File: contracts/Whitelist.sol

contract Whitelist is HasNoEther {

  bool public open = true;

  mapping(address => bool) public whitelisted;
  uint public totalWhitelisted;
  mapping(address => bool) public blacklisted;
  uint public totalBlacklisted;

  modifier whenOpen() {
    require(open);
    _;
  }

  function close()
  external
  onlyOwner
  {
      open = false;
  }

  function whitelist(
    address[] addrs
  )
  external
  onlyOwner
  whenOpen
  {
    for (uint a = 0; a < addrs.length; a++) {
      if (addrs[a] != address(0) && !whitelisted[addrs[a]] && !blacklisted[addrs[a]]) {
        whitelisted[addrs[a]] = true;
        totalWhitelisted++;
      }
    }
  }

  function blacklist(
    address[] addrs
  )
  external
  onlyOwner
  {
    for (uint a = 0; a < addrs.length; a++) {
      if (!blacklisted[addrs[a]]) {
        if (whitelisted[addrs[a]]) {
          whitelisted[addrs[a]] = false;
          totalWhitelisted--;
        }
        blacklisted[addrs[a]] = true;
        totalBlacklisted++;
      }
    }
  }

  function reset(
    address[] addrs
  )
  external
  onlyOwner
  whenOpen
  {
    for (uint a = 0; a < addrs.length; a++) {
      if (whitelisted[addrs[a]]) {
        whitelisted[addrs[a]] = false;
        totalWhitelisted--;
      } else if (blacklisted[addrs[a]]) {
        blacklisted[addrs[a]] = false;
        totalBlacklisted--;
      }
    }
  }

}

// File: openzeppelin-solidity/contracts/math/SafeMath.sol

/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256 c) {
    // Gas optimization: this is cheaper than asserting 'a' not being zero, but the
    // benefit is lost if 'b' is also tested.
    // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
    if (a == 0) {
      return 0;
    }

    c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    // uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return a / b;
  }

  /**
  * @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256 c) {
    c = a + b;
    assert(c >= a);
    return c;
  }
}

// File: contracts/IFOSecondRound.sol

contract IFOFirstRoundInterface is Ownable {
  address public project;
  address public founders;
  uint public totalParticipants;
  uint public tokenSupply;
  uint public baseAmount;
}

contract NILTokenInterface is Ownable {
  uint8 public decimals;
  bool public paused;
  bool public mintingFinished;
  uint256 public totalSupply;

  function balanceOf(address who) public constant returns (uint256);

  function mint(address _to, uint256 _amount) public returns (bool);

  function unpause() public;
  function pause() public;

  function finishMinting() public returns (bool);
}

contract IFOSecondRound is Ownable {
  using SafeMath for uint;

  NILTokenInterface public token;

  uint public maxPerWallet = 100000;
  uint public cap;

  Whitelist public whitelist;

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

  function setWhitelist(address addr) public onlyOwner onlyState("PreConfig"){
    whitelist = Whitelist(addr);
  }

  function getValuesFromFirstRound(address _firstRound, address _token) public onlyOwner onlyState("Waiting") {

    IFOFirstRoundInterface firstRound = IFOFirstRoundInterface(_firstRound);
    project = firstRound.project();
    founders = firstRound.founders();
    require(project != address(0));
    require(founders != address(0));

    baseAmount = firstRound.baseAmount();
    totalParticipants = firstRound.totalParticipants();
    token = NILTokenInterface(_token);
    initialTotalSupply = token.totalSupply();
    require(initialTotalSupply > 0);
  }


  // states

  modifier onlyState(bytes32 expectedState) {
    require(expectedState == currentState());
    _;
  }

  function currentState() public constant returns (bytes32) {
    uint bn = block.number;

    if (address(whitelist) == address(0)) {
      return "PreConfig";
    }
    else if (baseAmount == 0) {
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

  modifier isWhitelisted() {
    require(whitelist.whitelisted(msg.sender));
    _;
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

  function _getTokens() internal isWhitelisted onlyState("Dist"){
    require(msg.sender != 0x0);

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
    require(_duration > 0 && _duration < 30000);

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

    if (address(this).balance > 0) {
      project.transfer(address(this).balance);
    }
  }

  function unpauseAndFinishMinting() public onlyOwner onlyState("Ended") {
    require(projectFoundersReserved);
    require(collaboratorsReserved);

    token.unpause();
    token.finishMinting();
    token.transferOwnership(owner);
  }

  function totalSupply() public constant returns (uint){
    require(currentState() != "Inactive");
    return _fromNanoNIL(token.totalSupply());
  }

}
