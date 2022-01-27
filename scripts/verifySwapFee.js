const hre = require('hardhat');

const swapFeeAddress = '0xAd34Cac48cAC8e8dD0b46134f796F983ACd10bb6';

async function main() {
    console.log('Verify swap fee rewards with AP contract');
    let res = await hre.run("verify:verify", { address: swapFeeAddress });
    console.log(res);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
