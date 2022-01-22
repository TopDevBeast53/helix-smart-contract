/* 
 * TODO
 */

const Web3 = require('web3');

async function main() {
    console.log("WEB3", Web3);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
