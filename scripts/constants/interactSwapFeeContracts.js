// This file is used by the interactSwapFee script for loading the addresses of it's
// dependencies. Although the previously deployed contracts didn't work for the
// swapFee interaction script that doesn't mean they must be replaced. Hence, a
// separate file for the interactSwapFee script.
module.exports = {
    helixToken: {
        56: '',
        97: '0xE75cca98b0274b7A6c1C6728870497eE1b3170e7',       // use Test Token D instead since transferring BEP20 to HelixPair fails
    },
    helixNFT: {
        56: '',
        97: '0x8b2b085339D11DcF0FA0aaD985C30f82eb49a880',
    },
    helixLP: {
        56: '',
        97: '0x0B8c4BBC3C63Cc96AF95e250e1B83E9Da7c9830F',       // using Test Token C instead since transfer to HelixPair fails
    },
    helixNFTImpl: {
        56: '',
        97: '0x1a90de3849072ff46eca70cf714eac45e7a27304',
    },
    helixNFTChef: {
        56: '',
        97: '0x6C57410c639c6A10208185853b8990d32dcF6d14',
    },
    voting: {
        56: '',
        97: '0x96eD842d0B95aa2Cd749f4042F565F153Fd4C8C0',
    },
    router: {
        56: '',
        97: '0xA12933bf8816fc65448A369f33f78F3f0a7Df24D',       // Redeployed because previous deployment was failing
    },
    WBNB: {
        56: '',
        97: '0xae13d989dac2f0debff460ac112a837c89baa7cd',
    },
    factory: {
        56: '',
        97: '0x361376063722277DbD75Cb73aFe2652589AbDDd8',       // Replaces previous factory which didn't have dev team wallet address as feeToSetter
    },
    oracle: {
        56: '',
        97: '0x1322Ea12fd00325181675DfdC68159991AA798A4',       // Uses window=400 and granularity=2 for successful (and faster) interaction. 
    },
    swapFee: {
        56: '',
        97: '0x4835Cc23Fe71d50d3753F48CaCeeC74369585230',       // Redeployed because previous deployment was failing
    },
    testTokenA: {
        56: '',
        97: '0x360f6135472195caabEA67c7C6b83E3767F96762',
    },
    testTokenB: {
        56: '',
        97: '0xd239560c0d8Ae7EB66c5f691F32a7D7857cEDc58',
    },
    testTokenC: {
        56: '',
        97: '0x0B8c4BBC3C63Cc96AF95e250e1B83E9Da7c9830F',
    },
    testTokenD: {
        56: '',
        97: '0xE75cca98b0274b7A6c1C6728870497eE1b3170e7',
    },
    refReg: {
        56: '',
        97: '0xEA21873f722d211F25C9378A2ECfe2B5C8B47507',
    }
}
  
