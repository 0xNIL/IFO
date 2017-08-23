pragma solidity ^0.4.11;


import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

import './Token0xNIL.sol';


contract FreeDist0xNIL is Ownable {
  using SafeMath for uint;

  event Initiated();

  uint8 public TOKENS = 10;

  uint8 public TIP = 1;

  uint public MAX = 1000;

  Token0xNIL public token;

  uint public startBlock;

  uint public endBlock;

  uint public weiDonated;

  uint public tokenDistributed;

  uint public totalParticipants;

  address public artist;

  mapping (address => uint) public reservedBalances;

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

  function() payable {
    require(msg.sender != 0x0);

    if (isActive()) {
      require(reservedBalances[msg.sender] <= MAX);

      token.mint(TOKENS + TIP);
      tokenDistributed += TOKENS;

      if (reservedBalances[msg.sender] == 0) {
        totalParticipants++;
      }

      reservedBalances[msg.sender] = reservedBalances[msg.sender].add(TOKENS);
      reservedBalances[artist] = reservedBalances[artist].add(TIP);

      if (msg.value > 0) {
        weiDonated = weiDonated.add(msg.value);
        artist.transfer(msg.value);
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