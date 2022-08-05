download helix balances
manually create list of all unique helix holders by merging vipPresale addresses with downloaded helix addresses
join(“,”, helixAddressColumn)
copy unique helix addresses to addresses.js and add quotes (“) around each address (:%s/\'/\"\,\"/g)
run getVipPresaleSnapshot.js to generate the vip address balances which are on bsc and so need to be generated separately
run getSnapshot.js to generate the subBalances 
expect the call to fail with a “ProviderError” every so often. Each row is saved to a file in cvs/subResults. When the script fails, update the for loop index “i” to the most recently console.log-ged index and run again.
when the snapshot is taken for each address, run the mergeCsv.js script to merge all the subResults into the results directory
upload the master.csv to google sheets (remember to uncheck the box for formatting numbers when uploading)
remove the rows for masterChef, vault, airdrop contract addresses
add column sums
add percent error against expected minted helix
