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
const { buildCCPOrg1, buildCCPOrg2, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const myChannel = 'healthorg';
const myChaincodeName = 'telemedicine';

const memberAssetCollectionName = 'presCollection';
const org1PrivateCollectionName = 'Org1MSPPrivateCollection';
const org2PrivateCollectionName = 'Org2MSPPrivateCollection';
const mspOrg1 = 'Org1MSP';
const mspOrg2 = 'Org2MSP';
const Org1UserId = 'appUser1';
const Org2UserId = 'appUser2';
const departmentOrg1 = 'org1.department1';
const departmentOrg2 = 'org2.department1';


const RED = '\x1b[31m\n';
const RESET = '\x1b[0m';

function prettyJSONString(inputString) {
    if (inputString) {
        return JSON.stringify(JSON.parse(inputString), null, 2);
    } else {
        return inputString;
    }
}

function doFail(msgString) {
    console.error(`${RED}\t${msgString}${RESET}`);
    process.exit(1);
}

function verifyAssetData(org, resultBuffer, expectedId, pid, name, docId, doctorname, age,
    date, symtomp, disease, available) {

    let asset;
    if (resultBuffer) {
        asset = JSON.parse(resultBuffer.toString('utf8'));
    } else {
        doFail('Failed to read asset');
    }
    console.log(`*** verify asset data for: ${expectedId}`);
    if (!asset) {
        doFail('Received empty asset');
    }
    if (expectedId !== asset.id) {
        doFail(`recieved asset ${asset.id} , but expected ${expectedId}`);
    }
    if (asset.PID !== pid) {
        doFail(`asset ${asset.id} has color of ${asset.PID}, expected value ${pid}`);
    }
    if (asset.name !== name) {
        doFail(`Failed size check - asset ${asset.id} has size of ${asset.name}, expected value ${name}`);
    }

    if (asset.DocID.includes(docId)) {
        console.log(`\tasset ${asset.id} owner: ${asset.DocID}`);
    } else {
        doFail(`Failed owner check from ${org} - asset ${asset.id} owned by ${asset.DocID}, expected userId ${docId}`);
    }
    if (available) {
        if (asset.available !== available) {
            doFail(`Failed appraised value check from ${org} - asset ${asset.id} has appraised value of ${asset.available}, expected value ${available}`);
        }
    }
}

function verifyAssetPrivateDetails(resultBuffer, expectedId, available) {
    let assetPD;
    if (resultBuffer) {
        assetPD = JSON.parse(resultBuffer.toString('utf8'));
    } else {
        doFail('Failed to read asset private details');
    }
    console.log(`*** verify private details: ${expectedId}`);
    if (!assetPD) {
        doFail('Received empty data');
    }
    if (expectedId !== assetPD.id) {
        doFail(`recieved ${assetPD.ID} , but expected ${expectedId}`);
    }

    if (available) {
        if (assetPD.available !== available) {
            doFail(`Failed available days check - asset ${assetPD.id} has available days of ${assetPD.available}, expected value ${available}`);
        }
    }
}

async function gatewayConnect(ccpOrg, walletOrg, OrgUserId, gateway) {
    await gateway.connect(ccpOrg, { wallet: walletOrg, identity: OrgUserId, discovery: { enabled: true, asLocalhost: true } });
    return gateway;
}

async function registerUser(caOrgClient, walletOrg, mspOrg, OrgUserId, department) {
    await registerAndEnrollUser(caOrgClient, walletOrg, mspOrg, OrgUserId, department);
}

async function initContractFromOrg1Identity(ccpOrg1, caOrg1Client, walletOrg1) {
    console.log('\n--> Fabric client user & Gateway init: Using Org1 identity to Org1 Peer');

    await enrollAdmin(caOrg1Client, walletOrg1, mspOrg1);

    try {
        const gatewayOrg1 = new Gateway();
        return gatewayConnect(ccpOrg1, walletOrg1, 'admin', gatewayOrg1);
    } catch (error) {
        console.error(`Error in connecting to gateway: ${error}`);
        process.exit(1);
    }
}

async function initContractFromOrg2Identity(ccpOrg2, caOrg2Client, walletOrg2) {
    console.log('\n--> Fabric client user & Gateway init: Using Org2 identity to Org2 Peer');

    await enrollAdmin(caOrg2Client, walletOrg2, mspOrg2);

    try {
        // Create a new gateway for connecting to Org's peer node.
        const gatewayOrg2 = new Gateway();
        return gatewayConnect(ccpOrg2, walletOrg2, 'admin', gatewayOrg2);
    } catch (error) {
        console.error(`Error in connecting to gateway: ${error}`);
        process.exit(1);
    }
}

async function main() {
    try {

        const ccpOrg1 = buildCCPOrg1();
        const caOrg1Client = buildCAClient(FabricCAServices, ccpOrg1, 'ca.org1.example.com');
        const walletPathOrg1 = path.join(__dirname, 'wallet/org1');
        const walletOrg1 = await buildWallet(Wallets, walletPathOrg1);

        const ccpOrg2 = buildCCPOrg2();
        const caOrg2Client = buildCAClient(FabricCAServices, ccpOrg2, 'ca.org2.example.com');
        const walletPathOrg2 = path.join(__dirname, 'wallet/org2');
        const walletOrg2 = await buildWallet(Wallets, walletPathOrg2);

        const gatewayOrg1 = await initContractFromOrg1Identity(ccpOrg1, caOrg1Client, walletOrg1);
        const networkOrg1 = await gatewayOrg1.getNetwork(myChannel);
        const contractOrg1 = networkOrg1.getContract(myChaincodeName);
        // Since this sample chaincode uses, Private Data Collection level endorsement policy, addDiscoveryInterest
        // scopes the discovery service further to use the endorsement policies of collections, if any
        contractOrg1.addDiscoveryInterest({ name: myChaincodeName, collectionNames: [memberAssetCollectionName, org1PrivateCollectionName] });

        /** ~~~~~~~ Fabric client init: Using Org2 identity to Org2 Peer ~~~~~~~ */
        const gatewayOrg2 = await initContractFromOrg2Identity(ccpOrg2, caOrg2Client, walletOrg2);
        const networkOrg2 = await gatewayOrg2.getNetwork(myChannel);
        const contractOrg2 = networkOrg2.getContract(myChaincodeName);
        contractOrg2.addDiscoveryInterest({ name: myChaincodeName, collectionNames: [memberAssetCollectionName, org2PrivateCollectionName] });


        try {

            const PORT = 5000;
            const express = require('express');
            //const cookieParser = require('cookie-parser');
            let cors = require('cors');
            let crypto = require('crypto');
            let app = express();
            //app.use(cookieParser());
            app.use(cors({
                origin: "http://localhost:3000",
                credentials: true
            }));
            app.use(express.urlencoded({ extended: false }));
            app.use(express.json());

            app.get('/', function(req, res) {
                res.send('Hello World!*****\n');
            });

            const assetType = 'ValuableAsset';

            app.post('/registeruser', async function(req, res) {
                const { id, name, gender, email, password, phn, usertype, org } = req.body;

                try {
                    let userIdentity;
                    let result;
                    if (org == mspOrg1) {
                        userIdentity = await walletOrg1.get(id);
                    } else {
                        userIdentity = await walletOrg2.get(id);
                    }
                    if (userIdentity) {
                        res.send(`user id exists in ${org}`);
                        return;
                    } else {
                        const salt = crypto.randomBytes(128).toString('base64');
                        const hash = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('base64');
                        console.log(hash);
                        console.log(salt);
                        const user = {
                            objectType: assetType,
                            ID: id,
                            Name: name,
                            Gender: gender,
                            Email: email,
                            Password: hash,
                            Salt: salt,
                            PhoneNo: phn,
                            UserType: usertype
                        }
                        let tmapData = Buffer.from(JSON.stringify(user));
                        if (org == mspOrg1) {
                            console.log("**********hoy nai");
                            let statefulTxn = contractOrg1.createTransaction('CreateUser');
                            statefulTxn.setTransient({
                                asset_properties: tmapData
                            });
                            result = await statefulTxn.submit();
                            console.log("---------hocche");
                            await registerUser(caOrg1Client, walletOrg1, mspOrg1, id, departmentOrg1);
                        } else {
                            let statefulTxn = contractOrg2.createTransaction('CreateUser');
                            statefulTxn.setTransient({
                                asset_properties: tmapData
                            });
                            result = await statefulTxn.submit();
                            await registerUser(caOrg2Client, walletOrg2, mspOrg2, id, departmentOrg2);
                        }
                        res.send(result.toString());
                    }
                } catch (error) {
                    res.status(400).send(error.toString());
                }

            });

            app.post('/login', async function(req, res) {
                const { organization, password, remember, userid } = req.body;

                try {
                    let result, ress;
                    const user = { userID: userid };
                    let tmapData = Buffer.from(JSON.stringify(user));
                    if (organization == mspOrg1) {
                        console.log("**********hoy nai");
                        let statefulTxn = contractOrg1.createTransaction('FindUser');
                        statefulTxn.setTransient({
                            user_find: tmapData
                        });
                        result = await statefulTxn.submit();
                        ress = JSON.parse(result.toString());
                    } else {
                        let statefulTxn = contractOrg2.createTransaction('FindUser');
                        statefulTxn.setTransient({
                            user_find: tmapData
                        });
                        result = await statefulTxn.submit();
                        ress = JSON.parse(result.toString());
                    }

                    if (ress) {
                        //let 
                        //console.log(ress);
                        let hash = ress.password;
                        let salt = ress.salt;

                        const newHash = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('base64');
                        
                        if (hash === newHash) {
                            res.send('Successfully logged in');
                            // res.cookie('user', result.toString(), { maxAge: 3500000, httpOnly: true });
                        } else {
                            res.status(404).send('Wrong password')
                        }

                    } else {
                        res.status(404).send('user not exists in')
                    }
                } catch (error) {
                    res.status(400).send(error.toString());
                }

            });

            var server = app.listen(PORT, function() {
                console.log(`server listening on port 5000`);
            });

            let assetID1 = "pres1";
            let assetID2 = `pres2`;
            // let result;
            /*let asset1Data = {
                objectType: assetType,
                ID: assetID1,
                PID: "p1",
                Name: "Mallika Dey",
                DoctorName: "Dr. Robert",
                Age: "22",
                Date: "23.12.2022",
                Symtomp: "high temparature",
                Disease: "fever",
                Medicine: "napa",
                Available: 5
            };
            console.log('\n**************** As Org1 Client ****************');
            console.log('Adding Assets to work with:\n--> Submit Transaction: CreatePrescription ' + assetID1);
            let statefulTxn = contractOrg1.createTransaction('CreatePrescription');
            //if you need to customize endorsement to specific set of Orgs, use setEndorsingOrganizations
            //statefulTxn.setEndorsingOrganizations(mspOrg1);
            let tmapData = Buffer.from(JSON.stringify(asset1Data));
            statefulTxn.setTransient({
                asset_properties: tmapData
            });
            result = await statefulTxn.submit();

            //Add asset2
            console.log('\n--> Submit Transaction: CreatePrescription ' + assetID2);
            statefulTxn = contractOrg2.createTransaction('CreatePrescription');
            tmapData = Buffer.from(JSON.stringify(asset2Data));
            statefulTxn.setTransient({
                asset_properties: tmapData
            });
            result = await statefulTxn.submit();


            console.log('\n--> Evaluate Transaction: GetAssetByRange pres0-pres9');
            // GetAssetByRange returns assets on the ledger with ID in the range of startKey (inclusive) and endKey (exclusive)
            result = await contractOrg1.evaluateTransaction('GetAssetByRange', 'pres0', 'pres9');
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            if (!result || result.length === 0) {
                doFail('recieved empty query list for GetAssetByRange');
            }
            console.log('\n--> Evaluate Transaction: ReadAssetPrivateDetails from ' + org1PrivateCollectionName);
            // ReadAssetPrivateDetails reads data from Org's private collection. Args: collectionName, assetID
            result = await contractOrg1.evaluateTransaction('ReadAssetPrivateDetails', org1PrivateCollectionName, assetID1);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            verifyAssetPrivateDetails(result, assetID1, 5);

            // Attempt Transfer the asset to Org2 , without Org2 adding AgreeToTransfer //
            // Transaction should return an error: "failed transfer verification ..."
            //let buyerDetails = { assetID: assetID1, buyerMSP: mspOrg2 };
            let buyerDetails = { ID: assetID1, RequestedDocID: mspOrg2 };
            try {
                console.log('\n--> Attempt Submit Transaction: TransferAsset ' + assetID1);
                statefulTxn = contractOrg1.createTransaction('TransferAsset');
                tmapData = Buffer.from(JSON.stringify(buyerDetails));
                statefulTxn.setTransient({
                    asset_owner: tmapData
                });
                result = await statefulTxn.submit();
                console.log('******** FAILED: above operation expected to return an error');
            } catch (error) {
                console.log(`   Successfully caught the error: \n    ${error}`);
            }
            console.log('\n~~~~~~~~~~~~~~~~ As Org2 Client ~~~~~~~~~~~~~~~~');
            console.log('\n--> Evaluate Transaction: ReadPrescription ' + assetID1);
            result = await contractOrg2.evaluateTransaction('ReadPrescription', assetID1);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            verifyAssetData(mspOrg2, result, assetID1,  "p1", "Mallika Dey", Org1UserId, "Dr. Robert", "high temparature", "fever");
                

            // Org2 cannot ReadAssetPrivateDetails from Org1's private collection due to Collection policy
            //    Will fail: await contractOrg2.evaluateTransaction('ReadAssetPrivateDetails', org1PrivateCollectionName, assetID1);

            // Buyer from Org2 agrees to buy the asset assetID1 //
            // To purchase the asset, the buyer needs to agree to the same value as the asset owner
            let dataForAgreement = {
                ID: assetID1,
                Medicine: "napa",
                TxId: "fd3f4f8eff47434e3c50bfa986674570d9994da44437a1be335a9a0038d76afb",
                Available: 5
            };
            console.log('\n--> Submit Transaction: AgreeToTransfer payload ' + JSON.stringify(dataForAgreement));
             statefulTxn = contractOrg2.createTransaction('AgreeToTransfer');
             tmapData = Buffer.from(JSON.stringify(dataForAgreement));
            statefulTxn.setTransient({
                asset_value: tmapData
            });
            result = await statefulTxn.submit();

            //Buyer can withdraw the Agreement, using DeleteTranferAgreement
            statefulTxn = contractOrg2.createTransaction('DeleteTranferAgreement');
            statefulTxn.setEndorsingOrganizations(mspOrg2);
            let dataForDeleteAgreement = { prescriptionID: assetID1 };
            tmapData = Buffer.from(JSON.stringify(dataForDeleteAgreement));
            statefulTxn.setTransient({
                agreement_delete: tmapData
            });
            result = await statefulTxn.submit();

            console.log('\n**************** As Org1 Client ****************');
            // All members can send txn ReadTransferAgreement, set by Org2 above
            console.log('\n--> Evaluate Transaction: ReadTransferAgreement ' + assetID1);
            result = await contractOrg1.evaluateTransaction('ReadTransferAgreement', assetID1);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);

            // Transfer the asset to Org2 //
            // To transfer the asset, the owner needs to pass the MSP ID of new asset owner, and initiate the transfer
            console.log('\n--> Submit Transaction: TransferAsset ' + assetID1);
            let buyerDetails = { assetID: assetID1, buyerMSP: mspOrg2 };
            let statefulTxn = contractOrg1.createTransaction('TransferAsset');
            let tmapData = Buffer.from(JSON.stringify(buyerDetails));
            statefulTxn.setTransient({
                asset_owner: tmapData
            });
            result = await statefulTxn.submit();*/

            //Again ReadAsset : results will show that the buyer identity now owns the asset:
            /*console.log('\n--> Evaluate Transaction: ReadAsset ' + assetID1);
            result = await contractOrg1.evaluateTransaction('ReadAsset', assetID1);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            verifyAssetData(mspOrg1, result, assetID1, 'green', 20, Org2UserId);

            //Confirm that transfer removed the private details from the Org1 collection:
            console.log('\n--> Evaluate Transaction: ReadAssetPrivateDetails');
            // ReadAssetPrivateDetails reads data from Org's private collection: Should return empty
            result = await contractOrg1.evaluateTransaction('ReadAssetPrivateDetails', org1PrivateCollectionName, assetID1);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            if (result && result.length > 0) {
                doFail('Expected empty data from ReadAssetPrivateDetails');
            }
            console.log('\n--> Evaluate Transaction: ReadAsset ' + assetID2);
            result = await contractOrg1.evaluateTransaction('ReadAsset', assetID2);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            verifyAssetData(mspOrg1, result, assetID2, 'blue', 35, Org1UserId);

            console.log('\n********* Demo deleting asset **************');
            let dataForDelete = { assetID: assetID2 };
            try {
                //Non-owner Org2 should not be able to DeleteAsset. Expect an error from DeleteAsset
                console.log('--> Attempt Transaction: as Org2 DeleteAsset ' + assetID2);
                statefulTxn = contractOrg2.createTransaction('DeleteAsset');
                tmapData = Buffer.from(JSON.stringify(dataForDelete));
                statefulTxn.setTransient({
                    asset_delete: tmapData
                });
                result = await statefulTxn.submit();
                console.log('******** FAILED : expected to return an error');
            } catch (error) {
                console.log(`  Successfully caught the error: \n    ${error}`);
            }
            // Delete Asset2 as Org1
            console.log('--> Submit Transaction: as Org1 DeleteAsset ' + assetID2);
            statefulTxn = contractOrg1.createTransaction('DeleteAsset');
            tmapData = Buffer.from(JSON.stringify(dataForDelete));
            statefulTxn.setTransient({
                asset_delete: tmapData
            });
            result = await statefulTxn.submit();

            console.log('\n--> Evaluate Transaction: ReadAsset ' + assetID2);
            result = await contractOrg1.evaluateTransaction('ReadAsset', assetID2);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            if (result && result.length > 0) {
                doFail('Expected empty read, after asset is deleted');
            }

            console.log('\n~~~~~~~~~~~~~~~~ As Org2 Client ~~~~~~~~~~~~~~~~');
            // Org2 can ReadAssetPrivateDetails: Org2 is owner, and private details exist in new owner's Collection
            console.log('\n--> Evaluate Transaction as Org2: ReadAssetPrivateDetails ' + assetID1 + ' from ' + org2PrivateCollectionName);
            result = await contractOrg2.evaluateTransaction('ReadAssetPrivateDetails', org2PrivateCollectionName, assetID1);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            verifyAssetPrivateDetails(result, assetID1, 100);*/

        } finally {
            // Disconnect from the gateway peer when all work for this client identity is complete
            //gatewayOrg1.disconnect();
            //gatewayOrg2.disconnect();
        }
    } catch (error) {
        console.error(`Error in transaction: ${error}`);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main();