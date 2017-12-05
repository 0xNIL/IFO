pragma solidity ^0.4.15;


import '../../contracts/FreeDistribution.sol';


contract FreeDistributionMock is FreeDistribution {

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