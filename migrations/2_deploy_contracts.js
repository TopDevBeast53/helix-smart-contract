const AuraFactory = artifacts.require('AuraFactory');
const AuraRouterV1 = artifacts.require('AuraRouterV1');
const AuraToken = artifacts.require('AuraToken');
const AuraLP = artifacts.require('AuraLP');
const AuraNFT = artifacts.require('AuraNFT');
const SwapFeeRewardsWithAP = artifacts.require('SwapFeeRewardsWithAP');

/*
 * NOTE: This file should be merged into the other deployment file: 1_initial_migration.
 *       Or, that file should be merged with this one. Regardless, this file is currently
 *       isolated for initial development and not intended to be used for production.
 */

/*
 * NOTE: The following constants are intended to be used only for initial SwapFeeRewardsWithAP
 *       deployment. They're not addresses pointing to deployed contracts so, SwapFeeRewardWithAP 
 *       functions that rely on these contracts are not expected to work. 
 */
const FACTORY = {
    'test': '0x859f1D503E588f33ed69858B53b4C25647D2e5dE',
};

const ROUTER = {
    'test': '0xB8FB1967B73b0D05D73095a6c0CFbaB715a1268f',
};

const TARGET_TOKEN = {
    'test': '0x38d628e5898E8420b807E8653d6CB0dBc0Cd1294',
};

const TARGET_AP_TOKEN = {
    'test': '0x92e92FC751ca101f8309DdB753230aEa921F5cb2',
};

const ORACLE = {
    'test': '0xd099dF8fD5eEdBe00d88a41503FDcD89FD10E1f4',
};

const AURA_NFT = {
    'test': '0x2A3c379E6922b464187200AaEB8853caac63fF13',
};

const AURA_TOKEN = {
    'test': '0x9dC08b715eaE6F9E416FF21067D3D9e21490e3DF',
};

async function deploySwapFeeRewardsWithAP(deployer, env) {
    await deployer.deploy(SwapFeeRewardsWithAP, 
        FACTORY[env],
        ROUTER[env],
        TARGET_TOKEN[env],
        TARGET_AP_TOKEN[env],
        ORACLE[env],
        AURA_NFT[env],
        AURA_TOKEN[env]
    );
};

module.exports = async function (deployer) {
    deploySwapFeeRewardsWithAP(deployer, 'test');
};
