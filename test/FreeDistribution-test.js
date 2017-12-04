// /* globals Promise */
//
// const expectThrow = require('./helpers/expectThrow')
//
// const FreeDistribution = artifacts.require('./FreeDistribution.sol')
// const NILToken = artifacts.require('./NILToken.sol')
//
// function toNanoNIL(amount) {
//   return amount * 1e9
// }
//
// contract('FreeDistribution', accounts => {
//
//   let current
//   let startBlock
//   let endBlock
//   let duration
//   let architect = accounts[1]
//   let token
//   let dist
//
//   before(async () => {
//     dist = await FreeDistribution.new()
//   })
//
//   it('should be waiting to start', async () => {
//     assert.equal(await dist.isInitiated(), false)
//   })
//
//   it('should throw an error if call changeDuration before starting', async () => {
//     await expectThrow(dist.changeDuration(100))
//   })
//
//   it('should return 0 if call getTokensPerBlockNumber when not active', async () => {
//     assert.equal(await dist.getTokensPerBlockNumber(), 0)
//   })
//
//   it('should add two supporters: accounts[6] and accounts[7]', async () => {
//     await dist.addSupporter(accounts[6], 1)
//     await dist.addSupporter(accounts[7], 2)
//
//     assert.equal(await dist.supporterAddress(0), accounts[6])
//     assert.equal(await dist.supporterAddress(1), accounts[7])
//     assert.equal(await dist.supporters(accounts[6]), 1)
//     assert.equal(await dist.supporters(accounts[7]), 2)
//     assert.equal(await dist.totalSupporters(), 2)
//     assert.equal(await dist.totalSupportersRatios(), 3)
//   })
//
//   it('should initiate the distribution', async () => {
//     current = web3.eth.blockNumber
//     startBlock = current + 10
//     duration = 110
//     endBlock = startBlock + duration
//     await dist.startDistribution(startBlock, duration, architect)
//
//     token = NILToken.at(await dist.token())
//
//     assert.equal(await dist.isInitiated(), true)
//     assert.equal(await dist.endBlock(), endBlock)
//   })
//
//   it('should add a new supporters accounts[8] and change accounts[7] ratio', async () => {
//     await dist.addSupporter(accounts[7], 3)
//
//     await dist.addSupporter(accounts[8], 2)
//
//     assert.equal(await dist.supporterAddress(1), accounts[7])
//     assert.equal(await dist.supporterAddress(2), accounts[8])
//     assert.equal(await dist.supporters(accounts[7]), 3)
//     assert.equal(await dist.supporters(accounts[8]), 2)
//   })
//
//   it('should throw sending ethers too early', async () => {
//
//     await expectThrow(dist.sendTransaction({from: accounts[0], value: 1}))
//
//   })
//
//   it('should mint 10 tokens receiving 0 ether', async () => {
//
//     const iterate = async () => {
//       // iterates until the transaction succeds, i.e. startBlock >= eth.blockNumber
//       try {
//         await dist.sendTransaction({from: accounts[0], value: 0})
//         return await dist.isActive()
//       } catch (err) {
//         return await iterate()
//       }
//     }
//
//
//     assert.equal(await iterate(), true)
//     await dist.sendTransaction({from: accounts[2], value: 0})
//     assert.equal(await dist.tokenDistributed(), 2800)
//     assert.equal(await dist.totalParticipants(), 2)
//     assert.equal(await token.totalSupply(), toNanoNIL(2800))
//     assert.equal(await token.balanceOf(accounts[2]), toNanoNIL(1400))
//     assert.equal(await token.balanceOf(architect), 0)
//
//   })
//
//   it('should throw adding a new supporter accounts[9] when dist is active', async () => {
//     await expectThrow(dist.addSupporter(accounts[9], 1))
//   })
//
//   it('should assign tokens to accounts 2 and 3 and verify that all the values are consistent', async () => {
//
//     await dist.sendTransaction({from: accounts[2], value: 1})
//     await dist.sendTransaction({from: accounts[3], value: 0})
//     await dist.sendTransaction({from: accounts[3], value: 0})
//     await dist.sendTransaction({from: accounts[3], value: 1})
//
//     assert.equal(await token.balanceOf(architect), 0)
//     assert.equal(await token.balanceOf(accounts[2]), toNanoNIL(2800))
//     assert.equal(await token.balanceOf(accounts[3]), toNanoNIL(4200))
//     assert.equal(await dist.totalParticipants(), 3)
//     assert.equal(await dist.tokenDistributed(), 8400)
//
//   })
//
//
//   it('should assign tokens to account 4 using requireToken and verify that the balance is consistent', async () => {
//
//     await dist.sendTransaction({from: accounts[4], value: 0, data: '0x7a0c39'})
//     await dist.sendTransaction({from: accounts[4], value: 0, data: '0x7a0c39'})
//     await dist.sendTransaction({from: accounts[4], value: 0, data: '0x7a0c39'})
//     await dist.sendTransaction({from: accounts[4], value: 0, data: '0x7a0c39'})
//     assert.equal(await token.balanceOf(accounts[4]), toNanoNIL(5600))
//
//   })
//
//
//   it('should throw if sending more than 1 wei', async () => {
//     await expectThrow(dist.sendTransaction({from: accounts[2], value: 10}))
//   })
//
//   it('should assign < 10000 tokens each to accounts from 10 to 19', async () => {
//
//     const iterate = async (account, counter) => {
//       for (let i = 0; i < counter; i++) {
//         await dist.sendTransaction({from: account, value: 0})
//       }
//     }
//
//     assert.equal(await dist.getTokensPerBlockNumber(), 1400)
//
//     await iterate(accounts[10], 7)
//     await iterate(accounts[11], 7)
//     await iterate(accounts[12], 7)
//     await iterate(accounts[13], 7)
//
//     assert.equal(await dist.getTokensPerBlockNumber(), 1200)
//
//     await iterate(accounts[14], 8)
//     await iterate(accounts[15], 8)
//     await iterate(accounts[16], 8)
//     await iterate(accounts[17], 8)
//     await iterate(accounts[18], 9)
//     await iterate(accounts[19], 9)
//
//     assert.equal(await token.balanceOf(accounts[10]), toNanoNIL(9800))
//     assert.equal(await token.balanceOf(accounts[11]), toNanoNIL(9800))
//     assert.equal(await token.balanceOf(accounts[12]), toNanoNIL(9800))
//     assert.equal(await token.balanceOf(accounts[13]), toNanoNIL(9000))
//     assert.equal(await token.balanceOf(accounts[14]), toNanoNIL(9600))
//     assert.equal(await token.balanceOf(accounts[15]), toNanoNIL(9600))
//     assert.equal(await token.balanceOf(accounts[16]), toNanoNIL(9600))
//     assert.equal(await token.balanceOf(accounts[17]), toNanoNIL(9600))
//     assert.equal(await token.balanceOf(accounts[18]), toNanoNIL(9000))
//     assert.equal(await token.balanceOf(accounts[19]), toNanoNIL(9000))
//
//     assert.equal(await dist.getTokensPerBlockNumber(), 1000)
//
//     assert.equal(await dist.tokenDistributed(), 108800)
//
//   })
//
//   it('should limit the wallet to 10000 tokens', async () => {
//     const iterate = async account => {
//       try {
//         await  dist.sendTransaction({from: account, value: 0})
//         return await iterate(account)
//       } catch (err) {
//         return await null
//       }
//     }
//
//     await iterate(accounts[2])
//     assert.equal(await token.balanceOf(accounts[2]), toNanoNIL(10000))
//   })
//
//   it('should change the duration', async () => {
//     endBlock = web3.eth.blockNumber + 5
//     duration = endBlock - startBlock
//     await dist.changeDuration(duration)
//     assert.equal(await dist.endBlock(), startBlock + duration)
//   })
//
//   it('should end the distribution', async () => {
//     const iterate = async () => {
//       // iterates until the transaction fails
//       try {
//         await dist.sendTransaction({from: accounts[0], value: 0})
//         return await iterate()
//       } catch (err) {
//         return await null
//       }
//     }
//     await iterate()
//     assert.equal(await dist.hasEnded(), true)
//   })
//
//   it('should hasEnded return true', async () => {
//     assert.equal(await dist.hasEnded(), true)
//   })
//
//   it('should verify minting has not finished', async () => {
//     assert.equal(await dist.isMintingFinished(), false)
//   })
//
//   it('should tip architect and supporters', async () => {
//     await dist.tipTheTeam()
//
//     assert.equal(await dist.tokenDistributed(), 120000)
//     assert.equal(await token.balanceOf(architect), toNanoNIL(24000))
//     assert.equal(await token.balanceOf(accounts[6]), toNanoNIL(1200))
//     assert.equal(await token.balanceOf(accounts[7]), toNanoNIL(3600))
//     assert.equal(await token.balanceOf(accounts[8]), toNanoNIL(2400))
//   })
//
//   it('should verify minting has finished', async () => {
//     assert.equal(await dist.isMintingFinished(), true)
//   })
//
//   it('should throw if trying to tip again', async () => {
//     await expectThrow(dist.tipTheTeam())
//   })
//
//   it('should throw if distribution has ended', async () => {
//     await expectThrow(dist.sendTransaction({from: accounts[2], value: 0}))
//   })
//
//   it('should throw an error trying to change the duration after ended', async () => {
//     duration = 300
//     await expectThrow(dist.changeDuration(duration))
//   })
//
//   it('should throw an error trying to restart the distribution', async () => {
//     current = web3.eth.blockNumber
//     startBlock = current + 5
//     duration = 200
//     await expectThrow(dist.startDistribution(startBlock, duration, architect))
//   })
//
// })
