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
//---for org2
//const { buildCCPOrg2, buildWallet2 } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'telemedicine';
const mspOrg1 = 'Org1MSP';
//const mspOrg2 = 'Org2MSP';
const walletPath = path.join(__dirname, 'wallet');
//const walletPath2 = path.join(__dirname, 'wallet2'); //---for org2
const org1UserId = 'appUser';

function prettyJSONString(inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function main() {
    try {
        // build an in memory object with the network configuration (also known as a connection profile)
        const ccp = buildCCPOrg1();
        //const ccp2 = buildCCPOrg2();//---for org2

        // build an instance of the fabric ca services client based on
        // the information in the network configuration
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
        //const caClient2 = buildCAClient(FabricCAServices, ccp2, 'ca.org2.example.com');//---for org2

        // setup the wallet to hold the credentials of the application user
        const wallet = await buildWallet(Wallets, walletPath);
        //const wallet2 = await buildWallet(Wallets, walletPath);//---for org2

        // in a real application this would be done on an administrative flow, and only once
        await enrollAdmin(caClient, wallet, mspOrg1);
        //await enrollAdmin(caClient2, wallet2, mspOrg2);//---for org2

        //creating app user
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

            // Get the contracts from the network.
            const contract = network.getContract(chaincodeName, 'Prescription');
            const patient = network.getContract(chaincodeName, 'Patient');
            const doctor = network.getContract(chaincodeName, 'Doctor');

            //server start
            const PORT = 5000;
            const express = require('express');
            const cookieParser = require('cookie-parser');
            let cors = require('cors');
            let app = express();

            app.use(cookieParser());
            app.use(cors({
                origin: "http://localhost:5000",
                credentials: true
            }));
            app.use(express.urlencoded({ extended: false }));
            app.use(express.json());

            app.get('/', function(req, res) {
                res.send('Hello World!*****\n');
            });

            app.post('/registerpatient', async function(req, res) {
                const { id, name, gender, email, phn} = req.body;
                try {
                    const userIdentity = await wallet.get(id);
                    if (userIdentity) {
                        res.send("user id exists")
                    } else {
                        await registerAndEnrollUser(caClient, wallet, mspOrg1, id, 'org1.department1');
                        let result = await patient.evaluateTransaction('CreatePatient', id, name, gender, email, phn);
                        await patient.submitTransaction('CreatePatient', id, name, gender, email, phn);
                        res.send(result.toString());
                    }
                } catch (error) {
                    res.status(400).send(error.toString());
                }

            });

            //login
            app.post('/login', async function(req, res) {
                const { userId, pKey } = req.body;

                try {
                    const FindUser = await wallet.get(userId);
                    let privatekey = FindUser.credentials['privateKey'];
                    privatekey = privatekey.replace(/-----BEGIN PRIVATE KEY-----/, '');
                    privatekey = privatekey.replace(/-----END PRIVATE KEY-----/, '');
                    privatekey = privatekey.replace(/[\r\n]/gm, '');

                    if (privatekey == pKey) {

                        let result = await patient.evaluateTransaction('FindPatient', userId);
                        res.cookie('user', result.toString(), { maxAge: 3500000, httpOnly: true });
                        res.send('Successfully logged in');
                    } else {
                        res.status(404).send('user not found');
                    }
                } catch (error) {
                    res.status(400).send(error.toString());
                }

            });



            //will be created by doctor
            app.post('/CreatePrescription', async function(req, res) {
                /*if (req.cookie.user == null) {
                    res.status(400).send("You are not logged in");
                }*/
                const { id, pid, name, age, date, disease, medicine } = req.body;
                try {
                    try {
                        let findUser = await patient.evaluateTransaction('FindPatient', pid);
                    } catch (error) {
                        res.status(404).send(error.toString());
                    }
                    let result = await contract.evaluateTransaction('CreatePrescription', id, pid, name, age, date, disease, medicine);
                    await contract.submitTransaction('CreatePrescription', id, pid, name, age, date, disease, medicine);
                    res.send(result.toString());
                } catch (error) {
                    res.status(400).send(error.toString());
                }

            });


            app.get('/logout', async function(req, res) {
                try {
                    res.cookie('user', '', { maxAge: -1, httpOnly: true });
                    res.send("Successfully logged out")

                } catch (error) {
                    res.status(400).send(error.toString());
                }

            });

            app.get('/profile', async function(req, res) {
                if (req.cookie.user == null) {
                    res.json({
                        isLoggedIn: false
                    });
                    return;
                }

                try {
                    let user = JSON.parse(req.cookies.user.toString());
                    const key = user.id;

                    let result = await patient.evaluateTransaction('FindPatient', pid);
                    user = JSON.parse(result.toString());
                    user.isLoggedIn = true;
                    res.json(user);
                } catch (error) {
                    res.status(400).send(error.toString());
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