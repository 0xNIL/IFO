const expectThrow = require('./helpers/expectThrow')

const Collaborators = artifacts.require('./Collaborators.sol')

contract('Collaborators', accounts => {

  let architect = accounts[1]
  let collab

  before(async () => {
    collab = await Collaborators.new()
  })

  it('should be waiting to start', async () => {
    assert.equal(await collab.activated(), false)
  })

  it('should throw an error if call update before initiating', async () => {
    await expectThrow(collab.updatePercentage(accounts[2], 1000))
  })

  it('should throw an error if call compensate before initiating', async () => {
    await expectThrow(collab.getAmount(100000, accounts[2]))
  })

  it('should activate as expected', async () => {
    await collab.activateCollabs(architect, 30000, 3000)
    assert.equal(await collab.activated(), true)
  })

  it('should add two supporters: accounts[2] and accounts[3]', async () => {
    await collab.updatePercentage(accounts[2], 1000)
    await collab.updatePercentage(accounts[3], 2000)

    assert.equal(await collab.getPercentage(accounts[2]), 1000)
    assert.equal(await collab.getPercentage(accounts[3]), 2000)
    assert.equal(await collab.getHowManyCollaborators(), 3)
  })

  it('should update percentage for accounts[2]', async () => {
    await collab.updatePercentage(accounts[2], 3000)
    assert.equal(await collab.getPercentage(accounts[2]), 3000)
  })

  it('should get amount for a collaborator', async () => {
    let length = await collab.getHowManyCollaborators()
    let collaborators = []
    for (let i = 0; i < length; i++) {
      collaborators.push(await collab.getCollaborator(i))
    }
    assert.equal(collaborators[0], architect)

    let amount = await collab.getAmount(200000, collaborators[0])
    console.log(amount)
    assert.equal(amount, 60000)


  })

  it('should throw an error if update after completed', async () => {
    await collab.setCompleted();
    await expectThrow(collab.updatePercentage(accounts[2], 2000))
  })

})
