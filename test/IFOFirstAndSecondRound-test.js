/* globals Promise */

const assertRevert = require('./helpers/assertRevert')
const log = require('./helpers/log')
const NILToken = artifacts.require('./NILToken.sol')
const IFOFirstRound = artifacts.require('./mocks/IFOFirstRoundMock.sol')
const IFOSecondRound = artifacts.require('./mocks/IFOSecondRoundMock.sol')
const Whitelist = artifacts.require('./Whitelist.sol')

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

function toInt(x) {
  return parseInt(x.valueOf(), 10)
}

contract('IFO First Round and Second', accounts => {

  let current

  let preStartBlock
  let preEndBlock
  let preDuration

  let project = accounts[5]
  let founders = accounts[1]

  let token
  let firstRound
  let secondRound
  let whitelist

  const hashAddress = address => {
    return web3.sha3(address + '9554a9d6fa')
  }


  let isCurrentState = async expectedState => {
    const currentState = (await firstRound.getCurrentState()).valueOf()
    return expectedState == currentState
  }

  before(async () => {
    token = await NILToken.new()
    firstRound = await IFOFirstRound.new()
    secondRound = await IFOSecondRound.new()
    whitelist = await Whitelist.new()
  })

  it('should revert trying to initiate the preDistribution without a deployed token address', async () => {
    current = web3.eth.blockNumber
    preStartBlock = current + 5
    preDuration = 20
    preEndBlock = preStartBlock + preDuration
    await assertRevert(firstRound.startPreDistribution(preStartBlock, preDuration, project, founders, accounts[10]))
  })

  it('should be inactive', async () => {
    assert.isTrue(await isCurrentState('Inactive'))
  })

  it('should throw reserving tokens for project and founders', async () => {
    await assertRevert(firstRound.reserveTokensProjectAndFounders())
  })

  it('should allow accounts[0] to change the ownership of the token making firstRound the owner', async () => {
    assert.equal(await token.owner(), accounts[0])
    await token.transferOwnership(firstRound.address)
    assert.equal(await token.owner(), firstRound.address)
  })

  it('should initiate the preDistribution', async () => {
    current = web3.eth.blockNumber
    preStartBlock = current + 5
    preDuration = 20
    preEndBlock = preStartBlock + preDuration
    await firstRound.startPreDistribution(preStartBlock, preDuration, project, founders, token.address)

    assert.isTrue(await isCurrentState('PreDistInitiated'))
    assert.equal(await firstRound.preEndBlock(), preEndBlock)
  })


  it('should throw sending ethers too early', async () => {

    await assertRevert(firstRound.sendTransaction({from: accounts[0], value: 0}))

  })

  it('should mine until reaching the preStartBlock and mint 5000 tokens', async () => {

    const iterate = async () => {
      // iterates until the transaction succeds, i.e. startBlock >= eth.blockNumber
      try {
        await firstRound.sendTransaction({from: accounts[0], value: 0})
        return await firstRound.acceptingRequests()
      } catch (err) {
        let state = (await firstRound.getCurrentState()).valueOf()
        if (state === 'PreDistInitiated') {
          return await iterate()
        } else {
          await firstRound.sendTransaction({from: accounts[0], value: 0})
          return await firstRound.acceptingRequests()
        }
      }
    }

    assert.isTrue(await iterate())
    assert.equal(await firstRound.getTokensAmount(), 5000)

    await firstRound.sendTransaction({from: accounts[2], value: 0})

    assert.equal(await firstRound.totalParticipants(), 2)
    assert.equal(await token.totalSupply(), toNanoNIL(10000))
    assert.equal(await token.balanceOf(accounts[2]), toNanoNIL(5000))
    assert.equal(await token.balanceOf(founders), 0)
  })

  it('should set a donation from account 2 during the request', async () => {

    await firstRound.sendTransaction({from: accounts[2], value: web3.toWei(3, 'ether')})
    assert.equal(await token.balanceOf(accounts[2]), toNanoNIL(10000))
  })

  it('should assign 15000 tokens to accounts 3 and verify that all the values are consistent', async () => {

    await firstRound.sendTransaction({from: accounts[3], value: 0})
    await firstRound.sendTransaction({from: accounts[3], value: 0})
    await firstRound.sendTransaction({from: accounts[3], value: 1})

    assert.equal(await token.balanceOf(founders), 0)
    assert.equal(await token.balanceOf(accounts[3]), toNanoNIL(15000))
    assert.equal(await firstRound.totalParticipants(), 3)
    assert.equal(await firstRound.totalSupply(), 30000)
  })

  it('should assign 20000 tokens to account 4 calling giveMeNILs and verify that the balance is consistent', async () => {

    await firstRound.sendTransaction({from: accounts[4], value: 0, data: '0x7a0c39'})
    await firstRound.sendTransaction({from: accounts[4], value: 0, data: '0x7a0c39'})
    await firstRound.sendTransaction({from: accounts[4], value: 0, data: '0x7a0c39'})
    await firstRound.sendTransaction({from: accounts[4], value: 0, data: '0x7a0c39'})
    assert.equal(await token.balanceOf(accounts[4]), toNanoNIL(20000))

  })

  it('should assign other 10000 tokens to account 4 reaching the max per wallet', async () => {

    await firstRound.sendTransaction({from: accounts[4], value: 0})
    await firstRound.sendTransaction({from: accounts[4], value: 0})

    assert.equal(await token.balanceOf(accounts[4]), toNanoNIL(30000))
    assert.equal(await firstRound.totalSupply(), 60000)
  })

  it('should throw if account 4 makes more requests', async () => {
    await assertRevert(firstRound.sendTransaction({from: accounts[4], value: 0}))
  })

  it('should assign < 10000 tokens each to accounts from 10 to 15 and revert the next attempt because of the end of the pre distribution', async () => {

    await firstRound.sendTransaction({from: accounts[10], value: 0})
    await firstRound.sendTransaction({from: accounts[10], value: 0})
    await firstRound.sendTransaction({from: accounts[10], value: 0})
    await firstRound.sendTransaction({from: accounts[11], value: 0})
    await firstRound.sendTransaction({from: accounts[11], value: 0})
    await firstRound.sendTransaction({from: accounts[11], value: 0})
    await firstRound.sendTransaction({from: accounts[12], value: 0})
    await firstRound.sendTransaction({from: accounts[12], value: 0})

    assert.equal(web3.eth.blockNumber, preEndBlock)
  })

  it('should throw if trying to make more requests after preEndBlock', async () => {
    await assertRevert(firstRound.sendTransaction({from: accounts[10], value: 0}))
  })

  it('should throw if state is InBetween is passed', async () => {
    await assertRevert(firstRound.sendTransaction({from: accounts[4], value: 0}))
  })

  it('should return 0 token ', async () => {
    assert.equal(await firstRound.getTokensAmount(), 0)
  })

  it('should have token paused', async () => {
    assert.isTrue(await token.paused())
  })

  it('should throw error if trying to transfer tokens to account 10', async () => {
    await assertRevert(token.transfer(accounts[10], 100))
  })

  it('should verify minting has not finished', async () => {
    assert.equal(await token.mintingFinished(), false)
  })

  it('should reserve the tokens to project and founders', async () => {

    const balanceBefore = (await web3.eth.getBalance(project)).valueOf()

    await firstRound.reserveTokensProjectAndFounders()
    const tokenSupply = await firstRound.tokenSupply()
    const projectReserve = (await firstRound.projectReserve()).valueOf()
    const foundersReserve = (await firstRound.foundersReserve()).valueOf()

    const b0 = toInt(await token.balanceOf(accounts[0]), 10)
    const b2 = toInt(await token.balanceOf(accounts[2]), 10)
    const b3 = toInt(await token.balanceOf(accounts[3]), 10)
    const b4 = toInt(await token.balanceOf(accounts[4]), 10)
    const b10 = toInt(await token.balanceOf(accounts[10]), 10)
    const b11 = toInt(await token.balanceOf(accounts[11]), 10)
    const b12 = toInt(await token.balanceOf(accounts[12]), 10)

    assert.equal(tokenSupply, 2 * (b0 + b2 + b3 + b4 + b10 + b11 + b12))
    assert.equal(tokenSupply, toNanoNIL(200000))
    assert.isTrue(await firstRound.projectFoundersReserved())
    assert.equal(await token.balanceOf(project), tokenSupply * projectReserve / 100)
    assert.equal(await token.balanceOf(founders), tokenSupply * foundersReserve / 100)

    const b1 = toInt(await token.balanceOf(founders), 10)
    const b5 = toInt(await token.balanceOf(project), 10)

    assert.equal(b1 + b5, b0 + b2 + b3 + b4 + b10 + b11 + b12)
    assert.equal(await firstRound.totalParticipants(), 7)

    const balanceAfter = (await web3.eth.getBalance(project)).valueOf()
    assert.isTrue(balanceAfter > balanceBefore + 3 * 1e18)


  })

  it('should throw an error trying to restart the distribution', async () => {
    current = web3.eth.blockNumber
    startBlock = current + 5
    duration = 200
    await assertRevert(firstRound.startPreDistribution(preStartBlock, preDuration, project, founders, token.address))
  })


  //////////////// SECOND ROUND


  it('should assign the ownership of the token to the second round', async () => {
    assert.equal(await token.owner(), firstRound.address)
    await firstRound.transferTokenOwnership(secondRound.address)
    assert.equal(await token.owner(), secondRound.address)
  })

  it('should revert if getValuesFromFirstRound is called with wrong addresses', async () => {
    await assertRevert(secondRound.getValuesFromFirstRound(accounts[19], token.address))
    await assertRevert(secondRound.getValuesFromFirstRound(firstRound.address, accounts[18]))
  })

  it('should revert if getValuesFromFirstRound is called before setting the whitelister', async () => {
    await assertRevert(secondRound.getValuesFromFirstRound(firstRound.address, token.address))
  })

  it('should set the whitelist contract and whitelist the accounts', async () => {

    isCurrentState = async expectedState => {
      const currentState = (await secondRound.getCurrentState()).valueOf()
      return expectedState == currentState
    }

    assert.isTrue(await isCurrentState('PreConfig'))
    await secondRound.setWhitelist(whitelist.address)
    assert.isTrue(await isCurrentState('Waiting'))

    await whitelist.whitelist(accounts[0])
    assert.isTrue(await whitelist.whitelisted(accounts[0]))

  })

  it('should initialize the second round', async () => {

    const initialTotalSupply = (await token.totalSupply()).valueOf()

    await secondRound.getValuesFromFirstRound(firstRound.address, token.address)

    assert.equal(await secondRound.project(), project)
    assert.equal(await secondRound.founders(), founders)
    assert.equal(await secondRound.baseAmount(), 1000)
    assert.equal(await secondRound.totalParticipants(), 7)

    token = NILToken.at(await secondRound.token())
    assert.equal(await token.balanceOf(accounts[0]), toNanoNIL(5000))

    assert.equal(await secondRound.initialTotalSupply(), initialTotalSupply)

  })

  //

  it('should add two collaborators: accounts[6] and accounts[7]', async () => {
    await secondRound.updateReserveCollaborator(accounts[6], 10)
    await secondRound.updateReserveCollaborator(accounts[7], 20)

    assert.equal(await secondRound.getCollaboratorAddressByIndex(0), accounts[6])
    assert.equal(await secondRound.getCollaboratorAddressByIndex(1), accounts[7])
    assert.equal(await secondRound.getReserveCollaborator(accounts[6]), 10)
    assert.equal(await secondRound.getReserveCollaborator(accounts[7]), 20)
    assert.equal(await secondRound.numberOfCollaborators(), 2)
  })

  it('should add a new collaborators accounts[8] and change accounts[7] permille', async () => {
    await secondRound.updateReserveCollaborator(accounts[7], 5)
    await secondRound.updateReserveCollaborator(accounts[8], 15)

    assert.equal(await secondRound.getCollaboratorAddressByIndex(1), accounts[7])
    assert.equal(await secondRound.getCollaboratorAddressByIndex(2), accounts[8])
    assert.equal(await secondRound.getReserveCollaborator(accounts[7]), 5)
    assert.equal(await secondRound.getReserveCollaborator(accounts[8]), 15)
  })


  it('should add a new collaborator: accounts[9]', async () => {
    await secondRound.updateReserveCollaborator(accounts[9], 5)

    assert.equal(await secondRound.getCollaboratorAddressByIndex(3), accounts[9])
    assert.equal(await secondRound.getReserveCollaborator(accounts[9]), 5)
    assert.equal(await secondRound.numberOfCollaborators(), 4)
  })


  it('should initiate the distribution', async () => {
    current = web3.eth.blockNumber
    startBlock = current + 5
    duration = 160
    endBlock = startBlock + duration
    await secondRound.startDistribution(startBlock, duration)

    assert.isTrue(await isCurrentState('DistInitiated'))
    assert.equal(await secondRound.endBlock(), endBlock)
  })


  it('should mine until reaching the startBlock and mint 5000 tokens', async () => {

    const iterate = async () => {
      // iterates until the transaction succeds, i.e. startBlock >= eth.blockNumber
      try {
        await secondRound.sendTransaction({from: accounts[0], value: 0})
        return await secondRound.acceptingRequests()
      } catch (err) {
        return await iterate()
      }
    }

    assert.isTrue(await iterate())
    assert.equal(await secondRound.getTokensAmount(), 1400)

  })

  it('should revert trying to request token not being whitelisted', async () => {

    assert.isFalse(await whitelist.whitelisted(accounts[2]))
    await assertRevert(secondRound.sendTransaction({from: accounts[2], value: 0}))
  })

  it('should accept requests after whitelisting the users', async () => {

    const addresses = [
      accounts[1], accounts[2], accounts[4], accounts[10], accounts[11], accounts[12], accounts[13], accounts[14], accounts[15], accounts[16]
    ]
    await whitelist.whitelist10Addresses(addresses)
    assert.isTrue(await whitelist.whitelisted(accounts[2]))

    await secondRound.sendTransaction({from: accounts[2], value: 0})

    assert.equal(await secondRound.totalParticipants(), 7)
    assert.equal(await token.totalSupply(), toNanoNIL(202800))
  })

  it('should assign tokens to accounts 10..16', async () => {

    const iterate = async (account, counter) => {
      for (let i = 0; i < counter; i++) {
        await secondRound.sendTransaction({from: account, value: 0})
      }
    }

    assert.equal(await secondRound.getTokensAmount(), 1400)

    await iterate(accounts[10], 10)
    await iterate(accounts[11], 10)
    await iterate(accounts[12], 10)
    await iterate(accounts[13], 10)
    await iterate(accounts[14], 10)
    await iterate(accounts[15], 10)
    await iterate(accounts[16], 9)
    await secondRound.sendTransaction({from: accounts[16], value: web3.toWei(2, 'ether')})

    await secondRound.sendTransaction({from: accounts[4], value: 0})

    assert.equal(await token.balanceOf(accounts[10]), toNanoNIL(29000))
    assert.equal(await token.balanceOf(accounts[11]), toNanoNIL(29000))
    assert.equal(await token.balanceOf(accounts[12]), toNanoNIL(24000))
    assert.equal(await token.balanceOf(accounts[13]), toNanoNIL(14000))

    assert.equal(await token.balanceOf(accounts[14]), toNanoNIL(13800))
    assert.equal(await token.balanceOf(accounts[15]), toNanoNIL(12000))
    assert.equal(await token.balanceOf(accounts[16]), toNanoNIL(12000))

    assert.equal(await secondRound.totalSupply(), 297800)

  })


  it('should revert if account 0 tries to transfer tokens to account 10', async () => {
    await assertRevert(token.transfer(accounts[10], toNanoNIL(100)))
  })

  it('should assign tokens to accounts 4 until reaches 99400 tokens', async () => {

    assert.equal(await secondRound.getTokensAmount(), 1200)

    // iterate to reach the maxPerWallet
    while (fromNanoNIL((await token.balanceOf(accounts[4])).valueOf()) < 99000) {
      await secondRound.sendTransaction({from: accounts[4], value: 0})
    }

    assert.equal(await token.balanceOf(accounts[4]), toNanoNIL(99200))

  })

  it('should assign last 800 tokens to accounts 4 reaching the maxPerWallet of 100000 tokens', async () => {

    await secondRound.sendTransaction({from: accounts[4], value: 0})
    assert.equal(await token.balanceOf(accounts[4]), toNanoNIL(100000))

  })


  it('should throw if account 4 requests more tokens after reaching maxPerWallet', async () => {
    await assertRevert(secondRound.sendTransaction({from: accounts[4], value: 0}))
  })

  it('should reach the end of the distribution', async () => {
    // basically we force eth to mine to reach the endBlock

    while (web3.eth.blockNumber <= endBlock + 1) {
      try {
        await secondRound.sendTransaction({from: accounts[0], value: 0})
      } catch (err) {
        assert.isTrue(web3.eth.blockNumber > endBlock)
      }
    }
  })

  it('should verify minting has not finished', async () => {
    assert.equal(await token.mintingFinished(), false)
  })

  it('should reserve the tokens to project and founders', async () => {

    const projectBalance = toInt(await token.balanceOf(project))
    const foundersBalance = toInt(await token.balanceOf(founders))
    const totalSupplyBeforeReservation = toInt(await token.totalSupply())
    const initialTotalSupply = toInt(await secondRound.initialTotalSupply())
    const projectReserve = toInt(await secondRound.projectReserve())
    const foundersReserve = toInt(await secondRound.foundersReserve())

    const balanceBefore = (await web3.eth.getBalance(project)).valueOf()

    await secondRound.reserveTokensProjectAndFounders()

    const tokenSupply = toInt(await secondRound.tokenSupply())

    assert.equal(tokenSupply, 2 * (totalSupplyBeforeReservation - initialTotalSupply))
    assert.isTrue(await secondRound.projectFoundersReserved())
    assert.equal(await token.balanceOf(project), projectBalance + tokenSupply * projectReserve / 100)
    assert.equal(await token.balanceOf(founders), foundersBalance + tokenSupply * foundersReserve / 100)

    const balanceAfter = (await web3.eth.getBalance(project)).valueOf()
    assert.isTrue(balanceAfter >= balanceBefore + 2 * 1e18)

  })

  it('should throw if trying to close the distribution', async () => {
    await assertRevert(secondRound.unpauseAndFinishMinting())
  })

  it('should reserve the tokens to collaborators', async () => {

    const tokenSupply = toInt(await secondRound.tokenSupply())
    const foundersBalance = toInt(await token.balanceOf(founders))

    await secondRound.reserveTokensCollaborators()

    assert.isTrue(await secondRound.collaboratorsReserved())
    assert.equal(await token.balanceOf(accounts[6]), tokenSupply * 10 / 1000)
    assert.equal(await token.balanceOf(accounts[7]), tokenSupply * 5 / 1000)
    assert.equal(await token.balanceOf(accounts[8]), tokenSupply * 15 / 1000)
    assert.equal(await token.balanceOf(accounts[9]), tokenSupply * 5 / 1000)
    assert.equal(await token.balanceOf(founders), foundersBalance + tokenSupply * 15 / 1000)
  })

  it('should throw if trying to reserve tokens again to collaborators', async () => {
    await assertRevert(secondRound.reserveTokensCollaborators())
  })

  it('should unpause the token and stop minting', async () => {
    assert.isTrue(await token.paused())
    assert.isFalse(await token.mintingFinished())
    assert.isTrue(await isCurrentState('Ended'))
    assert.equal(await token.owner(), secondRound.address)

    await secondRound.unpauseAndFinishMinting()
    assert.isFalse(await token.paused())
    assert.isTrue(await token.mintingFinished())
    assert.isTrue(await isCurrentState('Closed'))
    assert.equal(await token.owner(), (await secondRound.owner()).valueOf())
  })

  it('should throw an error trying to restart the distribution', async () => {
    current = web3.eth.blockNumber
    startBlock = current + 5
    duration = 200
    await assertRevert(secondRound.startDistribution(startBlock, duration))
  })

  it('should throw trying to pause the token', async () => {
    await assertRevert(secondRound.pauseToken())
  })

  it('should allow account 0 to transfer tokens to account 10', async () => {

    const balance0 = (await token.balanceOf(accounts[0])).valueOf()
    const balance10 = (await token.balanceOf(accounts[10])).valueOf()

    await token.transfer(accounts[10], toNanoNIL(100))

    const balance0b = (await token.balanceOf(accounts[0])).valueOf()
    const balance10b = (await token.balanceOf(accounts[10])).valueOf()

    assert.equal(balance0 - balance0b, toNanoNIL(100))
    assert.equal(balance10b - balance10, toNanoNIL(100))

  })

})
