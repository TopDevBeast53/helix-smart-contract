const hre = require('hardhat');

const swapFeeAddress = '0xC06a683871fe5B8Bcd098416Cfa5915835440107';

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
