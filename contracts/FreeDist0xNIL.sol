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

  uint public requests = 0;

  uint public initialDuration;

  uint public startBlock;

  uint public endBlock;

  uint public tokenDistributed;

  uint public totalParticipants;

  address public artist;

  function startDistribution(uint _startBlock, uint _duration, address _artist) onlyOwner payable {
    require(!isInitiated());
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

  function getUint(uint a, uint b) constant returns (uint){
    uint r = a / b;
    return r;
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
      uint ratio = initialDuration / 5;
      if (step < ratio) {
        return 10;
      }
      else if (step < 2 * ratio) {
        return 9;
      }
      else if (step < 3 * ratio) {
        return 8;
      }
      else if (step < 4 * ratio) {
        return 7;
      }
      else {
        return 8;
      }
    }
  }

  event ChangeDuration(uint oldDuration, uint newDuration);

  function changeDuration(uint _duration) onlyOwner payable {
    require(isInitiated() && !hasEnded());
    ChangeDuration(startBlock + _duration, block.number);

    require(startBlock + _duration > block.number);
    endBlock = startBlock + _duration;
  }

  function giveTipToArtist() onlyOwner payable {
    require(hasEnded());
    require(!token.isMintingFinished());

    uint total = token.getTotalSupply();
    uint artistBalance = tokenDistributed / 7;
    token.mint(artist, artistBalance);
    total += artistBalance;

    if (token.balanceOf(artist) == artistBalance) {
      token.finishMinting();
    }
  }

  function() payable {
    require(isActive());
    require(msg.sender != 0x0);
    require(msg.value <= 1);

    uint balance = tokenBalanceOf(msg.sender);
    if (balance == 0) {
      totalParticipants++;
    }

    require(balance < 100);

    uint tokensPerBlockNumber = getTokensPerBlockNumber();

    if (balance > 0 && balance + tokensPerBlockNumber > 100) {
      tokensPerBlockNumber = 100 - balance;
    }

    token.mint(msg.sender, tokensPerBlockNumber);
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

}