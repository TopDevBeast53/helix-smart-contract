const AuraFactory = artifacts.require("AuraFactory");
const AuraRouterV1 = artifacts.require("AuraRouterV1");
const TestToken = artifacts.require("TestToken");
const DeflatingERC20 = artifacts.require("DeflatingERC20");

const FACTORY_INIT_CODE_HASH = '0xd9b35256579ff1901f04559c5e15fd3b5c397d5f5a7900722d7512602a987fa8';

const WBNB = {
    'test': '0xae13d989dac2f0debff460ac112a837c89baa7cd',
}
const FACTORY = {
    'test': '0xe1cf8d44bb47b8915a70ea494254164f19b7080d',
}

async function deployAuraFactory(deployer) {
    await deployer.deploy(AuraFactory, '0x59201fb8cb2D61118B280c8542127331DD141654');
    let instance = await AuraFactory.deployed();
    await instance.setFeeTo("0x59201fb8cb2D61118B280c8542127331DD141654");
    let res = await instance.feeTo.call();
    console.log('fee - ', res)
  
    let INIT_CODE_HASH = await instance.INIT_CODE_HASH.call();
    console.log('INIT_CODE_HASH - ', INIT_CODE_HASH)  
}

async function deployAuraRouter(deployer, env) {
    await deployer.deploy(AuraRouterV1, FACTORY[env], WBNB[env])
}

module.exports = async function (deployer) {
  // deployAuraFactory(deployer)
   deployAuraRouter(deployer, 'test')
}
