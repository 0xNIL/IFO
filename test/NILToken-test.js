/* globals Promise */

const assertRevert = require('./helpers/assertRevert')
const NILToken = artifacts.require('./NILToken.sol')

contract('NILToken', accounts => {

  let token

  before(async () => {
    token = await NILToken.new()
  })

  it('should be able to mint', async () => {
    assert.equal(await token.mintingFinished(), false)
  })

  it('should be unpaused', async () => {
    assert.equal(await token.paused(), false)
  })

  it('should mint 10 for account 0', async () => {
    await token.mint(accounts[0], 10)
    assert.equal(await token.balanceOf(accounts[0]), 10)
  })

  it('should transfer 5 from account 0 to account 1', async () => {
    await token.transfer(accounts[1], 5)
    assert.equal(await token.balanceOf(accounts[1]), 5)
  })

  it('should pause the transfers', async () => {
    await token.pause()
    assert.equal(await token.paused(), true)
  })

  it('should throw an error trying to transfer 2 from account 0 to account 1', async () => {
    await assertRevert(token.transfer(accounts[1], 2))
  })

  it('should unpause the transfers', async () => {
    await token.unpause()
    assert.equal(await token.paused(), false)
  })

  it('should transfer 2 from account 0 to account 1', async () => {
    await token.transfer(accounts[1], 2)
    assert.equal(await token.balanceOf(accounts[1]), 7)
  })

  it('should finish minting', async () => {
    await token.finishMinting()
    assert.equal(await token.mintingFinished(), true)
  })

  it('should be unable to pause after minting finished', async () => {
    await assertRevert(token.pause())
  })

})
