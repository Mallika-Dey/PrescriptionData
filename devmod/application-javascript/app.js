/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const fs = require('fs');
const { Gateway, Wallets, DefaultEventHandlerStrategies } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildCCPOrg2, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'healthorg';
const chaincodeName = 'telemedicine';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'docOrg1';
let identity = 'admin';

//const { blockListener, contractListener } = require('./Listeners');
const { BlockDecoder } = require('fabric-common');

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


        // Create a new gateway instance for interacting with the fabric network.
        // In a real application this would be done as the backend server session is setup for
        // a user that has been verified.
        const gateway = new Gateway();
        //server start

        try {
            // setup the gateway instance
            // The user will now be able to create connections to the fabric network and be able to
            // submit transactions and query. All transactions submitted by this gateway will be
            // signed by this user using the credentials stored in the wallet.
            await gateway.connect(ccp, {
                wallet,
                identity: 'admin',
                discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
            });

            //console.log(gateway.identityContext.user._signingIdentity._signer);
            //const adminIdentity = gateway.getCurrentIdentity();

            // Build a network instance based on the channel where the smart contract is deployed
            const network = await gateway.getNetwork(channelName);


            // Get the contracts from the network.
            const blockContract = network.getContract("qscc");
            const contract = network.getContract(chaincodeName, 'Prescription');
            const patient = network.getContract(chaincodeName, 'Patient');
            const doctor = network.getContract(chaincodeName, 'Doctor');

            //----------block---------

            //let res = await blockContract.evaluateTransaction("GetBlockByNumber", channelName, '20');
            let txId = '037aebd1bba9bb5de640cf525106db7238e1386e61e4887f1d83803c04ae50ce';
            let getBlockByTX = await blockContract.evaluateTransaction("GetBlockByTxID", channelName, txId);
            const resultJson = BlockDecoder.decode(getBlockByTX);
            let rr =resultJson.data.data[0].signature;
            //console.log(JSON.stringify(resultJson));
            console.log(rr.toString('hex'));

            // const adminIdentity = gateway.getClient().getCertificateAuthority();
            // const id = adminIdentity.getIdentity();
            // console.log(id.getPublicKey());
            //--------endblock------------



            const PORT = 5000;
            const express = require('express');
            const cookieParser = require('cookie-parser');
            let cors = require('cors');
            let app = express();
            app.use(cookieParser());
            app.use(cors({
                origin: "http://localhost:3000",
                credentials: true
            }));
            app.use(express.urlencoded({ extended: false }));
            app.use(express.json());


            app.get('/', function(req, res) {
                res.send('Hello World!*****\n');
            });

            app.post('/registerpatient', async function(req, res) {
                const { id, name, gender, email, phn } = req.body;
                try {
                    const userIdentity = await wallet.get(id);
                    if (userIdentity) {
                        res.send("user id exists");
                        return;
                    } else {
                        let result = await patient.evaluateTransaction('CreatePatient', id, name, gender, email, phn);
                        await patient.submitTransaction('CreatePatient', id, name, gender, email, phn);
                        await registerAndEnrollUser(caClient, wallet, mspOrg1, id, 'org1.department1');
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
                        //identity = userId;
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
                        return;
                    }
                    let result = await contract.evaluateTransaction('CreatePrescription', id, pid, name, age, date, disease, medicine);
                    await contract.submitTransaction('CreatePrescription', id, pid, name, age, date, disease, medicine);
                    res.send(result.toString());
                } catch (error) {
                    res.status(400).send(error.toString());
                }

            });

            //validate prescription
            app.post('/validatePrescription', async function(req, res) {
                /*if (req.cookie.user == null) {
                    res.status(400).send("You are not logged in");
                }*/
                const { id, did, tx_id } = req.body;
                try {
                    try {
                        let findID = await patient.evaluateTransaction('FindPatient', id);
                    } catch (error) {
                        res.status(404).send(error.toString());
                        return;
                    }

                    let getBlockByTX = await blockContract.evaluateTransaction("GetBlockByTxID", channelName, tx_id);
                    const resultJson = BlockDecoder.decode(getBlockByTX);
                    let docCer = resultJson.data.data[0].payload.header.signature_header.creator.id_bytes.toString('utf8');
                    /*console.log('-----------signature in block----------');
                    console.log(resultJson.data.data[0].payload.header.signature_header.creator.id_bytes);
                    console.log('end');
                    console.log(docCer);*/
                    const userIdentity = await wallet.get(did);
                    if (!userIdentity) {
                        res.send("Invalid Prescription");
                        return;
                    }

                    let certificate = userIdentity.credentials['certificate'];

                    if (certificate == docCer) {
                        res.send('valid');
                    } else {
                        res.status(404).send('Invalid Prescription');
                    }
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
            //gateway.disconnect();
        }
    } catch (error) {
        console.error(`******** FAILED to run the application: ${error}`);
    }
}

main();