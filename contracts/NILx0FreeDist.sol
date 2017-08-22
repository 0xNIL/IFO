pragma solidity ^0.4.11;


import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

import './NILx0Token.sol';


contract NILx0FreeDist is Ownable {
  using SafeMath for uint256;

  NILx0Token public token;

  uint256 public startBlock;

  uint256 public endBlock;

  uint8 public tokensPerTransaction = 10;

  uint8 public tipPerTransaction = 1;

  uint256 public maxTokensPerWallet = 1000;

  uint256 public weiDonated;

  address public artist;

  bool public isStarted = false;

  event Started();

  mapping (address => uint256) public tokenBalances;

  function start(uint256 _startBlock, uint256 _endBlock, address _artist) payable onlyOwner {
    require(isStarted == false);
    require(_startBlock >= block.number);
    require(_endBlock >= _startBlock);
    require(_artist != 0x0);

    token = createTokenContract();
    startBlock = _startBlock;
    endBlock = _endBlock;
    artist = _artist;
    isStarted = true;
    Started();
  }

  function createTokenContract() internal returns (NILx0Token) {
    return new NILx0Token();
  }

  function changeEndBlock(uint256 _endBlock) payable onlyOwner {
    require(isStarted == true);
    uint256 current = block.number;
    require(_endBlock >= current);
    endBlock = _endBlock;
  }

  function() payable {
    require(msg.sender != 0x0);

    uint256 current = block.number;
    if ((current >= startBlock && current <= endBlock)) {
      require(current >= startBlock && current <= endBlock);
      require(tokenBalances[msg.sender] <= maxTokensPerWallet);

      token.mint(tokensPerTransaction + tipPerTransaction);

      tokenBalances[msg.sender].add(tokensPerTransaction);
      tokenBalances[artist].add(tipPerTransaction);

      if (msg.value > 0) {
        weiDonated = weiDonated.add(msg.value);
        artist.transfer(msg.value);
      }
    } else if (current > endBlock) {
      require(msg.sender != 0x0);
      require(block.number > endBlock);
      require(tokenBalances[msg.sender] > 0);

      var amount = tokenBalances[msg.sender];
      tokenBalances[msg.sender] = 0;
      token.finalTransfer(msg.sender, amount);
    } else {
      revert();
    }

  }

  function getTokenBalanceOf(address who) public constant returns (uint256){
    return tokenBalances[who];
  }

  function hasEnded() public constant returns (bool) {
    return block.number > endBlock;
  }

}