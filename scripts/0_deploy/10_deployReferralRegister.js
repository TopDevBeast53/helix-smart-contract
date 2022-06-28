/**
 * deploy Referral Register
 *
 * run from root: 
 *      npx hardhat run scripts/0_deploy/10_deployReferralRegister.js --network ropsten
 */

const { ethers } = require(`hardhat`)
const { deployReferralRegister } = require("../shared/deploy/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${ deployer.address}`)
    await deployReferralRegister(deployer)
    console.log('done')
}

 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error)
         process.exit(1)
     }) 
