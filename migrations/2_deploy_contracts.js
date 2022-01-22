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

const FACTORY = {
    'test': '0xe1cf8d44bb47b8915a70ea494254164f19b7080d',
};

const ROUTER = {
    'test': '0x38433227c7a606ebb9ccb0acfcd7504224659b74',
};

const TARGET_AP_TOKEN = {
    'test': '0x9903Ee9e2a67D82A2Ba37D087CC8663F9592716E',
};

const AURA_NFT = {
    'test': '0x746eD187F197f6a562ffFc0285251420E55A8060',
};

const AURA_TOKEN = {
    'test': '0xdf2b1082eE98b48B5933378c8F58cE2f5AaFF135',
};

const SWAP_FEE = {
    'test': '0x3427F78a570605003531547fC444ce4f521ac5B3',
};

// NOTE: This is a mock address and doesn't point at a deployed contract.
const ORACLE = {
    'test': '0xd099dF8fD5eEdBe00d88a41503FDcD89FD10E1f4',
};

async function deployAuraNFT(deployer) {
    await deployer.deploy(AuraNFT, 
        "",         // string memory baseURI
        10000,      // uint initialAuraPoints
        10,         // uint8 levelUpPercent
    )
}

async function deployAuraToken(deployer) {
    await deployer.deploy(AuraToken);
}

async function deployTargetAPToken(deployer) {
    await deployer.deploy(AuraLP); 
}

async function deploySwapFeeRewardsWithAP(deployer, env) {
    await deployer.deploy(SwapFeeRewardsWithAP, 
        FACTORY[env],
        ROUTER[env],
        AURA_TOKEN[env],        // targetToken == auraToken.address
        TARGET_AP_TOKEN[env],
        ORACLE[env],
        AURA_NFT[env],
        AURA_TOKEN[env]
    );
};

module.exports = async function (deployer) {
    //deployAuraNFT(deployer);
    //deployAuraToken(deployer);
    //deployTargetAPToken(deployer);
    //deploySwapFeeRewardsWithAP(deployer, 'test');
};
