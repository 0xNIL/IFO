pragma solidity ^0.4.11;


import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

import './Token0xNIL.sol';


contract FreeDist0xNIL is Ownable {
  using SafeMath for uint;

  event Initiated();

  event TokenToTeam();

  event Minted(address to, uint amount);

  Token0xNIL public token;

  uint public RATIO = 100;

  uint public requests = 0;

  uint public initialDuration;

  uint public startBlock;

  uint public endBlock;

  uint public tipped;

  uint public tokenDistributed;

  uint public totalParticipants;

  address public artist;

  modifier canInitiate() {
    require(!isInitiated());
    _;
  }

  modifier canChange() {
    require(isInitiated() && !hasEnded());
    _;
  }

  modifier canPay() {
    require(isActive());
    _;
  }

  function startDistribution(uint _startBlock, uint _duration, address _artist) onlyOwner canInitiate payable {
    require(_startBlock >= block.number);
    require(_artist != 0x0);
    require(_duration > 0);

    token = createTokenContract();
    initialDuration = _duration;
    startBlock = _startBlock;
    endBlock = _startBlock + _duration;
    artist = _artist;
    Initiated();
  }

  function createTokenContract() internal returns (Token0xNIL) {
    return new Token0xNIL();
  }

  function getTokensPerBlockNumber() public constant returns (uint) {
    uint current = block.number;
    if (!isActive()) {
      return 0;
    }
    else {
      uint step = current - startBlock;
      uint ratio = initialDuration / 3;
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

  event ChangeDuration(uint oldDuration, uint newDuration);

  function changeDuration(uint _duration) onlyOwner canChange payable {
    require(startBlock + _duration > block.number);
    endBlock = startBlock + _duration;
    ChangeDuration(startBlock + _duration, block.number);
  }

  function toGwei(uint amount) internal constant returns (uint) {
    return amount * 1000000000;
  }

  function giveTipToArtist() onlyOwner payable {
    require(!token.isMintingFinished());

    uint amount = (tokenDistributed / 7) - tipped;
    if (amount > 0) {
      token.mint(artist, toGwei(amount));
      tipped += amount;
    }

    if (hasEnded()) {
      token.finishMinting();
    }
  }

  function() canPay payable {
    require(msg.sender != 0x0);
    require(msg.value <= 1);

    uint balance = tokenBalanceOf(msg.sender);
    if (balance == 0) {
      totalParticipants++;
    }

    uint limit = toGwei(1000);

    require(balance < limit);

    uint tokensPerBlockNumber = getTokensPerBlockNumber();

    if (balance > 0 && balance + tokensPerBlockNumber > limit) {
      tokensPerBlockNumber = limit - balance;
    }

    token.mint(msg.sender, toGwei(tokensPerBlockNumber));
    Minted(msg.sender, tokensPerBlockNumber);

    tokenDistributed += tokensPerBlockNumber;
  }

  function tokenBalanceOf(address who) public constant returns (uint){
    return token.balanceOf(who);
  }

  function totalSupply() public constant returns (uint){
    return token.getTotalSupply();
  }

  function hasEnded() public constant returns (bool) {
    return block.number > endBlock;
  }

  function isActive() public constant returns (bool) {
    return block.number >= startBlock && block.number <= endBlock;
  }

  function isInitiated() public constant returns (bool) {
    return startBlock > 0;
  }

  function isMintingFinished() public constant returns (bool) {
    return token.isMintingFinished();
  }

}