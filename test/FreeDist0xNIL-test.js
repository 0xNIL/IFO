/* globals Promise */

const expectThrow = require('./helpers/expectThrow')

const FreeDist0xNIL = artifacts.require('./helpers/FreeDist0xNILMock.sol')
const Token0xNIL = artifacts.require('./Token0xNIL.sol')

function toNanoNIL(amount) {
  return amount * 1e9
}

function fromNanoNIL(amount) {
  return amount / 1e9
}

function logValue(x, convert) {
  x = x.valueOf()
  console.log(convert ? fromNanoNIL(x) : x)
}

contract('FreeDist0xNIL', accounts => {

  let current

  let preStartBlock
  let preEndBlock
  let preDuration

  let startBlock
  let endBlock
  let duration

  let project = accounts[5]
  let founders = accounts[1]

  let token
  let dist

  async function isCurrentState(expectedState) {
    let currentState = (await dist.getCurrentState()).valueOf()
    return expectedState == currentState
  }

  before(async () => {
    dist = await FreeDist0xNIL.new()
  })

  it('should be inactive', async () => {
    assert.isTrue(await isCurrentState('Inactive'))
  })

  it('should throw adding a collaborator when Inactive', async () => {
    await expectThrow(dist.updateReserveCollaborator(accounts[6], 15))
  })

  it('should throw starting the distribution', async () => {
    await expectThrow(dist.startDistribution(3000, 100))
  })

  it('should throw reserving tokens for project and founders', async () => {
    await expectThrow(dist.reserveTokensProjectAndFounders())
  })

  it('should throw finishing before starting', async () => {
    await expectThrow(dist.unpauseAndFinishMinting())
  })

  it('should initiate the preDistribution', async () => {
    current = web3.eth.blockNumber
    preStartBlock = current + 5
    preDuration = 20
    preEndBlock = preStartBlock + preDuration
    await dist.startPreDistribution(preStartBlock, preDuration, project, founders)

    token = Token0xNIL.at(await dist.token())

    assert.isTrue(await isCurrentState('PreDistInitiated'))
    assert.equal(await dist.preEndBlock(), preEndBlock)
  })

  it('should throw sending ethers too early', async () => {

    await expectThrow(dist.sendTransaction({from: accounts[0], value: 0}))

  })

  it('should add two collaborators: accounts[6] and accounts[7]', async () => {
    await dist.updateReserveCollaborator(accounts[6], 10)
    await dist.updateReserveCollaborator(accounts[7], 20)

    assert.equal(await dist.getCollaboratorAddressByIndex(0), accounts[6])
    assert.equal(await dist.getCollaboratorAddressByIndex(1), accounts[7])
    assert.equal(await dist.getReserveCollaborator(accounts[6]), 10)
    assert.equal(await dist.getReserveCollaborator(accounts[7]), 20)
    assert.equal(await dist.numberOfCollaborators(), 2)
  })

  it('should add a new collaborators accounts[8] and change accounts[7] permille', async () => {
    await dist.updateReserveCollaborator(accounts[7], 5)
    await dist.updateReserveCollaborator(accounts[8], 15)

    assert.equal(await dist.getCollaboratorAddressByIndex(1), accounts[7])
    assert.equal(await dist.getCollaboratorAddressByIndex(2), accounts[8])
    assert.equal(await dist.getReserveCollaborator(accounts[7]), 5)
    assert.equal(await dist.getReserveCollaborator(accounts[8]), 15)
  })

  it('should mine until reaching the preStartBlock and mint 5000 tokens', async () => {

    const iterate = async () => {
      // iterates until the transaction succeds, i.e. startBlock >= eth.blockNumber
      try {
        await dist.sendTransaction({from: accounts[0], value: 0})
        return await dist.acceptingRequests()
      } catch (err) {
        assert.isTrue(await isCurrentState('PreDistInitiated'))
        return await iterate()
      }
    }

    assert.isTrue(await iterate())
    assert.equal(await dist.getTokensAmount(), 5000)

    await dist.sendTransaction({from: accounts[2], value: 0})

    assert.equal(await dist.totalParticipants(), 2)
    assert.equal(await token.totalSupply(), toNanoNIL(10000))
    assert.equal(await token.balanceOf(accounts[2]), toNanoNIL(5000))
    assert.equal(await token.balanceOf(founders), 0)
  })

  it('should receive a donation from account 2 during the request', async () => {

    let balanceBefore = (await web3.eth.getBalance(project)).valueOf()
    await dist.sendTransaction({from: accounts[2], value: web3.toWei(1, 'ether')})
    let balanceAfter = (await web3.eth.getBalance(project)).valueOf()

    assert.equal(web3.fromWei(balanceAfter.valueOf() - balanceBefore.valueOf(), 'ether'), 1)
  })

  it('should assign 15000 tokens to accounts 3 and verify that all the values are consistent', async () => {

    await dist.sendTransaction({from: accounts[3], value: 0})
    await dist.sendTransaction({from: accounts[3], value: 0})
    await dist.sendTransaction({from: accounts[3], value: 1})

    assert.equal(await token.balanceOf(founders), 0)
    assert.equal(await token.balanceOf(accounts[2]), toNanoNIL(10000))
    assert.equal(await token.balanceOf(accounts[3]), toNanoNIL(15000))
    assert.equal(await dist.totalParticipants(), 3)
    assert.equal(await dist.totalSupply(), 30000)
  })

  it('should assign 20000 tokens to account 4 calling giveMeNILs and verify that the balance is consistent', async () => {

    await dist.sendTransaction({from: accounts[4], value: 0, data: '0x7a0c39'})
    await dist.sendTransaction({from: accounts[4], value: 0, data: '0x7a0c39'})
    await dist.sendTransaction({from: accounts[4], value: 0, data: '0x7a0c39'})
    await dist.sendTransaction({from: accounts[4], value: 0, data: '0x7a0c39'})
    assert.equal(await token.balanceOf(accounts[4]), toNanoNIL(20000))

  })

  it('should assign other 10000 tokens to account 4 reaching the max per wallet', async () => {

    await dist.sendTransaction({from: accounts[4], value: 0})
    await dist.sendTransaction({from: accounts[4], value: 0})

    assert.equal(await token.balanceOf(accounts[4]), toNanoNIL(30000))
    assert.equal(await dist.totalSupply(), 60000)
  })

  it('should throw if account 4 makes more requests', async () => {
    await expectThrow(dist.sendTransaction({from: accounts[4], value: 0}))
  })

  it('should assign < 10000 tokens each to accounts from 10 to 15 and revert the next attempt because of the end of the pre distribution', async () => {

    await dist.sendTransaction({from: accounts[10], value: 0})
    await dist.sendTransaction({from: accounts[10], value: 0})
    await dist.sendTransaction({from: accounts[10], value: 0})
    await dist.sendTransaction({from: accounts[11], value: 0})
    await dist.sendTransaction({from: accounts[11], value: 0})
    await dist.sendTransaction({from: accounts[11], value: 0})

    assert.equal(web3.eth.blockNumber, preEndBlock)
  })

  it('should throw if trying to make more requests after preEndBlock', async () => {
    await expectThrow(dist.sendTransaction({from: accounts[10], value: 0}))
  })

  it('should throw if state is InBetween is passed', async () => {
    await expectThrow(dist.sendTransaction({from: accounts[4], value: 0}))
  })

  it('should add a new collaborator: accounts[9]', async () => {
    await dist.updateReserveCollaborator(accounts[9], 5)

    assert.equal(await dist.getCollaboratorAddressByIndex(3), accounts[9])
    assert.equal(await dist.getReserveCollaborator(accounts[9]), 5)
    assert.equal(await dist.numberOfCollaborators(), 4)
  })

  it('should have token paused', async () => {
    assert.isTrue(await token.paused())
  })

  it('should throw error if trying to transfer tokens to account 10', async () => {
    await expectThrow(token.transfer(accounts[10], 100))
  })

  it('should initiate the distribution', async () => {
    current = web3.eth.blockNumber
    startBlock = current + 5
    duration = 140
    endBlock = startBlock + duration
    await dist.startDistribution(startBlock, duration)

    assert.isTrue(await isCurrentState('DistInitiated'))
    assert.equal(await dist.endBlock(), endBlock)
  })

  it('should mine until reaching the startBlock and mint 5000 tokens', async () => {

    const iterate = async () => {
      // iterates until the transaction succeds, i.e. startBlock >= eth.blockNumber
      try {
        await dist.sendTransaction({from: accounts[0], value: 0})
        return await dist.acceptingRequests()
      } catch (err) {
        return await iterate()
      }
    }

    assert.isTrue(await iterate())
    assert.equal(await dist.getTokensAmount(), 1400)

    await dist.sendTransaction({from: accounts[2], value: 0})

    assert.equal(await dist.totalParticipants(), 6)
    assert.equal(await token.totalSupply(), toNanoNIL(92800))
  })


  it('should assign tokens to accounts 10..16', async () => {

    const iterate = async (account, counter) => {
      for (let i = 0; i < counter; i++) {
        await dist.sendTransaction({from: account, value: 0})
      }
    }

    assert.equal(await dist.getTokensAmount(), 1400)

    await iterate(accounts[10], 10)
    await iterate(accounts[11], 10)
    await iterate(accounts[12], 10)
    await iterate(accounts[13], 10)
    await iterate(accounts[14], 10)
    await iterate(accounts[15], 10)
    await iterate(accounts[16], 10)

    assert.equal(await token.balanceOf(accounts[10]), toNanoNIL(29000))
    assert.equal(await token.balanceOf(accounts[11]), toNanoNIL(29000))
    assert.equal(await token.balanceOf(accounts[12]), toNanoNIL(14000))
    assert.equal(await token.balanceOf(accounts[13]), toNanoNIL(14000))
    assert.equal(await token.balanceOf(accounts[14]), toNanoNIL(12800))
    assert.equal(await token.balanceOf(accounts[15]), toNanoNIL(12000))
    assert.equal(await token.balanceOf(accounts[16]), toNanoNIL(12000))

    assert.equal(await dist.totalSupply(), 185600)

  })

  it('should assign tokens to accounts 4 until reaches the maxPerWallet of 100000 tokens', async () => {

    assert.equal(await dist.getTokensAmount(), 1200)

    // iterate to reach the maxPerWallet
    while (fromNanoNIL((await token.balanceOf(accounts[4])).valueOf()) < 100000) {
      await dist.sendTransaction({from: accounts[4], value: 0})
    }

    assert.equal(await dist.getTokensAmount(), 1000)
    assert.equal(await token.balanceOf(accounts[4]), toNanoNIL(100000))

  })

  it('should throw if account 4 requests more tokens after reaching maxPerWallet', async () => {
    await expectThrow(dist.sendTransaction({from: accounts[4], value: 0}))
  })

  it('should reach the end of the distribution', async () => {
    // basically we force eth to mine to reach the endBlock

    while (web3.eth.blockNumber <= endBlock + 1) {
      try {
        await dist.sendTransaction({from: accounts[0], value: 0})
      } catch (err) {
        assert.isTrue(web3.eth.blockNumber > endBlock)
      }
    }
  })

  it('should verify minting has not finished', async () => {
    assert.equal(await token.mintingFinished(), false)
  })

  it('should reserve the tokens to project and founders', async () => {

    await dist.reserveTokensProjectAndFounders()
    let tokenSupply = await dist.tokenSupply()

    assert.isTrue(await dist.projectFoundersReserved())
    assert.equal(await token.balanceOf(project), tokenSupply * 35 / 100)
    assert.equal(await token.balanceOf(founders), tokenSupply * 10 / 100)
  })

  it('should throw if trying to close the distribution', async () => {
    await expectThrow(dist.unpauseAndFinishMinting())
  })

  it('should reserve the tokens to collaborators', async () => {

    let tokenSupply = await dist.tokenSupply()
    await dist.reserveTokensCollaborators()

    assert.isTrue(await dist.collaboratorsReserved())
    assert.equal(await token.balanceOf(accounts[6]), tokenSupply * 10 / 1000)
    assert.equal(await token.balanceOf(accounts[7]), tokenSupply * 5 / 1000)
    assert.equal(await token.balanceOf(accounts[8]), tokenSupply * 15 / 1000)
    assert.equal(await token.balanceOf(accounts[9]), tokenSupply * 5 / 1000)
    assert.equal(await token.balanceOf(founders), tokenSupply * 115 / 1000)
  })

  it('should throw if trying to reserve tokens again to collaborators', async () => {
    await expectThrow(dist.reserveTokensCollaborators())
  })

  it('should unpause the token and stop minting', async () => {
    await dist.unpauseAndFinishMinting()
    assert.isFalse(await token.paused())
    assert.isTrue(await token.mintingFinished())
    assert.isTrue(await isCurrentState('Closed'))
  })

  it('should throw an error trying to restart the distribution', async () => {
    current = web3.eth.blockNumber
    startBlock = current + 5
    duration = 200
    await expectThrow(dist.startDistribution(startBlock, duration))
  })

  it('should throw trying to pause the token', async () => {
    await expectThrow(dist.pauseToken())
  })

  it('should allow account 0 to transfer tokens to account 10', async () => {

    let balance0 = (await token.balanceOf(accounts[0])).valueOf()
    let balance10 = (await token.balanceOf(accounts[10])).valueOf()

    await token.transfer(accounts[10], toNanoNIL(100))

    let balance0b = (await token.balanceOf(accounts[0])).valueOf()
    let balance10b = (await token.balanceOf(accounts[10])).valueOf()

    assert.equal(balance0 - balance0b, toNanoNIL(100))
    assert.equal(balance10b - balance10, toNanoNIL(100))

  })

})
