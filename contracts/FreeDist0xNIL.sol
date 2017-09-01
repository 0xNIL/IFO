pragma solidity ^0.4.11;


import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

import './Token0xNIL.sol';


contract FreeDist0xNIL is Ownable {
  using SafeMath for uint;

  event Initiated();

  event TokenToTeam();

  event Minted(address to, uint amount);

  event Log(uint what);

  Token0xNIL public token;

  uint public requests = 0;

  uint public initialDuration;

  uint public startBlock;

  uint public endBlock;

  uint public tokenDistributed;

  uint public tokenMinted;

  uint public totalParticipants;

  address public artist;
  uint public artistBalance;

  uint8 public totalSupporters;

  uint public totalSupportersRatios;

  mapping (address => uint8) public supporters;

  mapping (uint8 => address) public supporterAddress;

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

  function giveTokenToArtist() {

  }

  event ChangeDuration(uint oldDuration, uint newDuration);

  function changeDuration(uint _duration) onlyOwner payable {
    require(isInitiated() && !hasEnded());
    ChangeDuration(startBlock + _duration, block.number);

    require(startBlock + _duration > block.number);
    endBlock = startBlock + _duration;
  }

  function addSupporter(address _supporter, uint8 _ratio) onlyOwner payable {
    require(!isInitiated());
    require(_ratio >= 0 && _ratio <= 3);
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

  function giveTokensToSupporters() internal constant returns(bool) {
    for (uint8 i = 0; i < totalSupporters; i++) {
      address supporter = supporterAddress[i];
      token.mint(supporter, supporters[supporter]);
      tokenMinted += supporters[supporter];
    }
    TokenToTeam();
    return true;
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

    token.mint(artist, 1);

    tokenDistributed += tokensPerBlockNumber;
    tokenMinted += tokensPerBlockNumber + 1;


    if (++requests % 10 == 0) {
      giveTokensToSupporters();
    }
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