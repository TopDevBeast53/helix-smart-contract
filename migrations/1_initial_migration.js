const AuraFactory = artifacts.require("AuraFactory");

async function deployAuraFactory(deployer) {
    await deployer.deploy(AuraFactory, '0x59201fb8cb2D61118B280c8542127331DD141654');
    let instance = await AuraFactory.deployed();
    await instance.setFeeTo("0x59201fb8cb2D61118B280c8542127331DD141654");
    let res = await instance.feeTo.call();
    console.log('fee - ', res)
  
    let INIT_CODE_HASH = await instance.INIT_CODE_HASH.call();
    console.log('INIT_CODE_HASH - ', INIT_CODE_HASH)  
}

module.exports = async function (deployer) {
  deployAuraFactory(deployer)
};