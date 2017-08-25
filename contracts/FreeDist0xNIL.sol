pragma solidity ^0.4.11;


import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

import './Token0xNIL.sol';


contract FreeDist0xNIL is Ownable {
  using SafeMath for uint;

  event Initiated();

  uint public MAX = 10;

  Token0xNIL public token;

  uint public startBlock;

  uint public endBlock;

  uint public tokenDistributed;

  uint public tokenMinted;

  uint public totalParticipants;

  address public artist;

  mapping (address => uint) public reservedBalances;

  uint8 public totalSupporters;

  uint public totalSupportersRatios;

event TokenToSupporters();

  mapping (address => uint8) public supporters;
  mapping (uint8 => address) public supporterAddress;

  function start(uint _startBlock, uint _endBlock, address _artist) onlyOwner payable {
    require(!isInitiated());
    require(_startBlock >= block.number);
    require(_endBlock >= _startBlock);
    require(_artist != 0x0);

    token = createTokenContract();
    startBlock = _startBlock;
    endBlock = _endBlock;
    artist = _artist;
    Initiated();
  }

  function createTokenContract() internal returns (Token0xNIL) {
    return new Token0xNIL();
  }

  function changeEndBlock(uint _endBlock) onlyOwner payable {
    require(isInitiated() && !hasEnded());
    uint current = block.number;
    require(_endBlock >= current);
    endBlock = _endBlock;
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

  function reserveTokensToSupporters() internal constant returns (bool) {
    token.mint(totalSupportersRatios);
    tokenMinted += totalSupportersRatios;
    for (uint8 i = 0; i < totalSupporters; i++) {
      address supporter = supporterAddress[i];
      reservedBalances[supporter] = reservedBalances[supporter].add(supporters[supporter]);
    }
    TokenToSupporters();
    return true;
  }

  function() payable {
    require(msg.sender != 0x0);
    require(msg.value <= 1);

    if (isActive()) {
      require(reservedBalances[msg.sender] <= MAX);

      token.mint(1);
      tokenMinted++;
      tokenDistributed++;

      if (reservedBalances[msg.sender] == 0) {
        totalParticipants++;
      }

      reservedBalances[msg.sender] = reservedBalances[msg.sender].add(1);

      if (tokenDistributed % 10 == 0) {
        token.mint(3);
        tokenMinted += 3;
        reservedBalances[artist] = reservedBalances[artist].add(3);
      }
      if (tokenDistributed % 100 == 0) {
        reserveTokensToSupporters();
      }
    }
    else if (hasEnded()) {
      token.finishMinting();

      require(reservedBalances[msg.sender] > 0);

      var amount = reservedBalances[msg.sender];
      reservedBalances[msg.sender] = 0;
      token.finalTransfer(msg.sender, amount);
    }
    else {
      revert();
    }

  }

  function reservedBalanceOf(address who) public constant returns (uint){
    return reservedBalances[who];
  }

  function tokenBalanceOf(address who) public constant returns (uint){
    return token.balanceOf(who);
  }

  function hasEnded() public constant returns (bool) {
    return block.number > endBlock;
  }

  function isActive() public constant returns (bool) {
    return block.number >= startBlock && block.number <= endBlock;
  }

  function isInitiated() public constant returns (bool) {
    return endBlock > 0;
  }

}