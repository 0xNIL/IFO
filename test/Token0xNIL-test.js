// /* globals Promise */
//
// const Token0xNIL = artifacts.require('./Token0xNIL.sol')
//
// contract('Token0xNIL', function (accounts) {
//
//   it('should have 0 Token0xNIL in the beginning', () => {
//     return Token0xNIL.deployed().then(instance => {
//       return instance.totalSupply.call()
//     }).then(totalSupply => {
//       assert.equal(totalSupply.valueOf(), 0)
//     })
//   })
//
//   it('should mint 100 Token0xNILs', () => {
//     let token
//     return Token0xNIL.deployed().then(instance => {
//       token = instance
//       return token.mint(accounts[1], 100)
//     }).then(() => {
//
//       return Promise.all([
//           token.totalSupply.call(),
//           token.balanceOf(accounts[1])
//           ])
//     }).then(([totalSupply, balance]) => {
//       assert.equal(totalSupply.valueOf(), 100)
//       assert.equal(balance, 100)
//     })
//   })
//
//   it('should mint other 50 Token0xNILs', () => {
//     let token
//     return Token0xNIL.deployed().then(instance => {
//       token = instance
//       return token.mint(accounts[2], 50)
//     }).then(result => {
//       return Promise.all([
//         token.totalSupply.call(),
//         token.balanceOf(accounts[2])
//       ])
//     }).then(([totalSupply, balance]) => {
//       assert.equal(totalSupply.valueOf(), 150)
//       assert.equal(balance, 50)
//     })
//   })
//
//   it('should throw an error if minting amount is negative', () => {
//     let token
//     return Token0xNIL.deployed().then(instance => {
//       token = instance
//       return token.mint(-10)
//     }).catch(() => assert(true))
//   })
//
//   it('should mint stop minting', () => {
//     let token
//     return Token0xNIL.deployed().then(instance => {
//       token = instance
//       return token.finishMinting()
//     }).then(result => {
//       return token.mintingFinished.call()
//     }).then(result => {
//       assert.equal(result.valueOf(), true)
//     })
//   })
//
//   it('should throw an error if mining after the end', () => {
//     let token
//     return Token0xNIL.deployed().then(instance => {
//       token = instance
//       return token.mint(10)
//     }).catch(() => assert(true))
//   })
//
// })
