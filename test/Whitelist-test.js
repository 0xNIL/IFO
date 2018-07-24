/* globals Promise */

const assertRevert = require('./helpers/assertRevert')
const assertError = require('./helpers/assertError')
const log = require('./helpers/log')

const Whitelist = artifacts.require('./Whitelist.sol')
const WhitelistHelper = artifacts.require('./helpers/WhitelistHelper.sol')

function randomAddress() {
  let address = '0x'
  let charSet = 'abcdef0123456789'
  for (var i = 0; i < 40; i++)
    address += charSet.charAt(Math.floor(Math.random() * charSet.length))
  return address
}


contract('Whitelist', accounts => {

  let whitelist
  let whitelistHelper

  const hashAddress = address => {
    return web3.sha3(address + '9554a9d6fa')
  }

  before(async () => {
    whitelist = await Whitelist.new()
    whitelistHelper = await WhitelistHelper.new()
  })


  it('should reverse trying to execute a command without being whitelisted', async () => {
    await assertRevert(whitelistHelper.doSomething())
  })

  it('should set the whitelist in the helper', async () => {
    assert.equal(await whitelistHelper.whitelistAddress(), 0)
    await whitelistHelper.setWhitelist(whitelist.address)
    assert.notEqual(await whitelistHelper.whitelistAddress(), 0)
  })

  it('should whitelist accounts 1, 2, 3, 4, 5', async () => {
    const addresses = [
      accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]
    ]
    await whitelist.whitelist(addresses)
    assert.isTrue(await whitelistHelper.amIWhitelisted({from: accounts[4]}))
    assert.equal(await whitelist.totalWhitelisted(), 5)
  })

  it('should allow account 2 to execute doSomething', async () => {
    await whitelistHelper.doSomething({from: accounts[2]})
    assert.equal(await whitelistHelper.sets(accounts[2]), true)
  })

  it('should reverse if account 6 tries to execute doSomething', async () => {
    await assertRevert(whitelistHelper.doSomething({from: accounts[6]}))
  })

  it('should whitelist one account', async () => {
    const address = randomAddress()
    await whitelist.whitelist([address])
    assert.isTrue(await whitelist.whitelisted(address))
    assert.equal(await whitelist.totalWhitelisted(), 6)
  })

  it('should whitelist 10 accounts', async () => {
    let address
    let addresses = []
    for (let i = 0; i < 10; i++) {
      address = randomAddress()
      addresses.push(address)
    }
    await whitelist.whitelist(addresses)
    assert.isTrue(await whitelist.whitelisted(address))
    assert.equal(await whitelist.totalWhitelisted(), 16)
  })

  it('should whitelist 2 new accounts and 3 already whitelisted', async () => {
    let address
    let addresses = [accounts[1], accounts[2], accounts[3]]
    for (let i = 0; i < 2; i++) {
      address = randomAddress()
      addresses.push(address)
    }
    await whitelist.whitelist(addresses)
    assert.equal(await whitelist.totalWhitelisted(), 18)
  })

  it('should whitelist 23 accounts', async () => {
    let address
    let addresses = []
    for (let i = 0; i < 23; i++) {
      address = randomAddress()
      addresses.push(address)
    }
    await whitelist.whitelist(addresses)
    assert.equal(await whitelist.totalWhitelisted(), 41)
  })

  it('should go out of gas trying to whitelist a huge amount of accounts', async () => {
    let address
    let addresses = []
    for (let i = 0; i < 300; i++) {
      address = randomAddress()
      addresses.push(address)
    }
    await assertError('out of gas', whitelist.whitelist(addresses))
  })

  it('should blacklist 3 accounts, 1 not already whitelisted', async () => {
    let addresses = [accounts[1], accounts[2], accounts[6]]
    await whitelist.blacklist(addresses)
    assert.equal(await whitelist.totalWhitelisted(), 39)
    assert.equal(await whitelist.totalBlacklisted(), 3)
  })

  it('should try to whitelist 5 accounts, but 2 are blacklisted', async () => {
    let addresses = [accounts[1], accounts[6], accounts[7], accounts[8], accounts[9]]
    await whitelist.whitelist(addresses)
    assert.equal(await whitelist.totalWhitelisted(), 42)
    // assert.equal(await whitelist.totalBlacklisted(), 3)
  })

  it('should reset the status of 3 accounts, of which 1 is blacklisted, and whitelist them all', async () => {
    let addresses = [accounts[1], accounts[7], accounts[8]]
    await whitelist.reset(addresses)
    assert.equal(await whitelist.totalWhitelisted(), 40)
    assert.equal(await whitelist.totalBlacklisted(), 2)
    await whitelist.whitelist(addresses)
    assert.equal(await whitelist.totalWhitelisted(), 43)
    assert.equal(await whitelist.totalBlacklisted(), 2)
  })

  it('should do nothing trying to whitelist, blacklist or reset accounts already in that state', async () => {
    const whitelisted = (await whitelist.totalWhitelisted()).valueOf()
    const blacklisted = (await whitelist.totalBlacklisted()).valueOf()
    let addresses = [accounts[1], accounts[7], accounts[8]]
    await whitelist.whitelist(addresses)
    assert.equal(await whitelist.totalWhitelisted(), whitelisted)
    assert.equal(await whitelist.totalBlacklisted(), blacklisted)
    addresses = []
    for (let i = 0; i < 3; i++) {
      addresses.push(randomAddress())
    }
    await whitelist.reset(addresses)
    assert.equal(await whitelist.totalWhitelisted(), whitelisted)
    assert.equal(await whitelist.totalBlacklisted(), blacklisted)
    addresses = [accounts[2], accounts[6]]
    await whitelist.blacklist(addresses)
    assert.equal(await whitelist.totalWhitelisted(), whitelisted)
    assert.equal(await whitelist.totalBlacklisted(), blacklisted)
  })

})
