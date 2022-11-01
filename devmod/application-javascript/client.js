/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'prescription1';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';

function prettyJSONString(inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function main() {
    try {
        // build an in memory object with the network configuration (also known as a connection profile)
        const ccp = buildCCPOrg1();

        // build an instance of the fabric ca services client based on
        // the information in the network configuration
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

        // setup the wallet to hold the credentials of the application user
        const wallet = await buildWallet(Wallets, walletPath);

        // in a real application this would be done on an administrative flow, and only once
        await enrollAdmin(caClient, wallet, mspOrg1);

        // in a real application this would be done only when a new user was required to be added
        // and would be part of an administrative flow
        await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

        // Create a new gateway instance for interacting with the fabric network.
        // In a real application this would be done as the backend server session is setup for
        // a user that has been verified.
        const gateway = new Gateway();

        try {
            // setup the gateway instance
            // The user will now be able to create connections to the fabric network and be able to
            // submit transactions and query. All transactions submitted by this gateway will be
            // signed by this user using the credentials stored in the wallet.
            await gateway.connect(ccp, {
                wallet,
                identity: org1UserId,
                discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
            });

            // Build a network instance based on the channel where the smart contract is deployed
            const network = await gateway.getNetwork(channelName);

            // Get the contract from the network.
            const contract = network.getContract(chaincodeName);


            // Let's try a query type operation (function).
            // This will be sent to just one peer and the results will be shown.
            //  console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
            //  let result = await contract.evaluateTransaction('GetAllAssets');
            //  console.log(`*** Result: ${prettyJSONString(result.toString())}`);

            try {

                let result = await contract.evaluateTransaction('CreateUser', 'p1', 'Alice', 'F', '01982673265');

                console.log('\n--> Creating Prescription....');
                await contract.submitTransaction('CreateUser', 'p1', 'Alice', 'F', '01982673265');
                console.log(`******** Successfull ${result}`);
            } catch (error) {
                console.log(`*** Successfully caught the error: \n    ${error}`);
            }


            try {
                let result = await contract.evaluateTransaction('FindUser', 'p1');

                var today = new Date();
                var dd = String(today.getDate()).padStart(2, '0');
                var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                var yyyy = today.getFullYear();
                today = dd + '/' + mm + '/' + yyyy;

                result = await contract.evaluateTransaction('CreatePrescription', 'pre1', 'p1', 'Alice',
                    '20', today, 'fever, rash', 'smallpox', 'TEMBEXA');
                
                await contract.submitTransaction('CreatePrescription', 'pre1', 'p1', 'Alice',
                    '20', today, 'fever, rash', 'smallpox', 'TEMBEXA');
                console.log(`******** Successfully saved Prescription\n ${result}`);

            } catch (error) {
                console.log(`*** Successfully caught the error: \n    ${error}`);
            }
      
            try {
                let result = await contract.evaluateTransaction('QueryPrescriptionByPatient', 'p1');

                console.log(`Prescriptions of patient id p1 \n ${result}`);

            } catch (error) {
                console.log(`*** Successfully caught the error: \n    ${error}`);
            }

        } finally {
            // Disconnect from the gateway when the application is closing
            // This will close all connections to the network
            gateway.disconnect();
        }
    } catch (error) {
        console.error(`******** FAILED to run the application: ${error}`);
    }
}

main();