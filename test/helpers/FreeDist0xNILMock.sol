pragma solidity ^0.4.15;


import '../../contracts/FreeDist0xNIL.sol';


contract FreeDist0xNILMock is FreeDist0xNIL {

  function getReserveCollaborator(address _collaborator) public constant returns (uint) {
    return permilles[_collaborator].permille;
  }

  function getCollaboratorAddressByIndex(uint _index) public constant returns (address) {
    return collaborators[_index];
  }

  function numberOfCollaborators() public constant returns (uint) {
    return collaborators.length;
  }

  function pauseToken() public onlyOwner {
    return token.pause();
  }

}