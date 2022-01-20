const AuraFactory = artifacts.require("AuraFactory");
const AuraRouterV1 = artifacts.require("AuraRouterV1");
const TestToken = artifacts.require("TestToken");
const DeflatingERC20 = artifacts.require("DeflatingERC20");

const FACTORY_INIT_CODE_HASH = '0x3ff52216c5ab48f67e3988dc6cc7f380ccec8763f153153ce43e741c0dff8796';
const WBNB = {
    'test': '0xae13d989dac2f0debff460ac112a837c89baa7cd',
}
const FACTORY = {
    'test': '0x0f067e18784969ff5c206647035199a66f2bb758',
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
//   deployAuraFactory(deployer)
//   deployAuraRouter(deployer, 'test')
    await deployer.deploy(TestToken, 100500)
    // await deployer.deploy(DeflatingERC20, 100500)
    const tt = await TestToken.deployed();
    // const r = await tt.allowance('0x59201fb8cb2d61118b280c8542127331dd141654', '0xc8d11f48cf07ddb9ef48dab2bb85ebb35430b37a');
    // console.log(r.toString())
    await tt.approve('0xc8d11f48Cf07dDb9EF48DAb2bb85eBb35430b37a', 1000)
};