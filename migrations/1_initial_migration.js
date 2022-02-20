const AuraFactory = artifacts.require("AuraFactory");
const AuraRouterV1 = artifacts.require("AuraRouterV1");
const TestToken = artifacts.require("TestToken");
const DeflatingERC20 = artifacts.require("DeflatingERC20");

const FACTORY_INIT_CODE_HASH = '0xd9b35256579ff1901f04559c5e15fd3b5c397d5f5a7900722d7512602a987fa8';

const WBNB = {
    'test': '0xae13d989dac2f0debff460ac112a837c89baa7cd',
}
const FACTORY = {
    // 'test': '0xe1cf8d44bb47b8915a70ea494254164f19b7080d',
    'test': '0xf15a0717bB14bB82d838AA1EE1e494c3489C35E3',
    // Add production deployed factory address here
}

const ADDRESS_OF_WHO_CAN_SET_FEES_ON_PAIR_SWAPS = '0x38606aEE8c5E713f91688D41ad6a7ab3B923F34b';
const ADDRESS_OF_WHO_WILL_RECEIVE_TRADING_FEES = '0x7167a81a3a158Fc0383124Bd7e4d4e43f2b728b8';

async function deployAuraFactory(deployer) {
    await deployer.deploy(AuraFactory, ADDRESS_OF_WHO_CAN_SET_FEES_ON_PAIR_SWAPS);
    let instance = await AuraFactory.deployed();
    await instance.setFeeTo(ADDRESS_OF_WHO_WILL_RECEIVE_TRADING_FEES);
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
