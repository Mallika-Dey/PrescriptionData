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
const chaincodeName = 'prescription';
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

            //server start
            const PORT = 5000;
            let express = require('express');
            let app = express();

            app.use(express.urlencoded({ extended: false }));
            app.use(express.json());

            app.get('/', function(req, res) {
                res.send('Hello World!*****\n');
            });

            app.post('/registerpatient', async function(req, res) {
                const {id, name, gender, phn } = req.body;
                try {

                    let result = await contract.evaluateTransaction('CreateUser', id, name, gender, phn);
                    await contract.submitTransaction('CreateUser', id, name, gender, phn);
                    res.send(result.toString());
                } catch (error) {
                    res.error(error.toString());
                }

            });

            app.post('/CreatePrescription', async function(req, res) {
                const {id, pid, name, age, date, disease, medicine} = req.body;
                try {

                    let result = await contract.evaluateTransaction('CreatePrescription', id, pid, name, age, date, disease, medicine);
                    await contract.submitTransaction('CreatePrescription', id, pid, name, age, date, disease, medicine);
                    res.send(result.toString());
                } catch (error) {
                    res.error(error.toString());
                }

            });

            var server = app.listen(PORT, function() {
                console.log(`server listening on port 5000`);
            });
            //end

        } finally {
            // Disconnect from the gateway when the application is closing
            // This will close all connections to the network
           // gateway.disconnect();
        }
    } catch (error) {
        console.error(`******** FAILED to run the application: ${error}`);
    }
}

main();