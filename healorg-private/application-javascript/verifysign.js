/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const fabproto6 = require('fabric-protos');
const utils = require('./Utils');

const logger = utils.getLogger('BlockDecoder.js');
global.cfg = 'sdf';
global.certificate = null;
global.privateKey = null;
global.mspId = null;

class VerifySign {

    static verifysign(blockBuf, certificate, mspId) {
        logger.debug('decode - start');
        //-----------remove
        //global.cfg = cfg;
        global.certificate = certificate;
        //global.privateKey = privateKey;
        global.mspId = mspId;
        console.log(cfg);
        //-----------remove
        if (!blockBuf || !(blockBuf instanceof Buffer)) {
            throw new Error('Block input data is not a byte buffer');
        }
        const block = {};
        try {
            const blockProto = fabproto6.common.Block.decode(blockBuf);
            block.header = decodeBlockHeader(blockProto.header);
            block.data = decodeBlockData(blockProto.data);
            block.metadata = decodeBlockMetaData(blockProto.metadata);
        } catch (error) {
            logger.error('decode - ::' + (error.stack ? error.stack : error));
            throw error;
        }

        logger.debug('decode - end');

        return block;
    }

    /**
     * Constructs an object containing all decoded values from the
     * protobuf `common.Block` object
     *
     * @param {Object} blockProto- an object that represents the protobuf common.Block
     * @returns {Block} An object of the fully decoded protobuf common.Block
     */
    static decodeBlock(blockProto) {
        logger.debug('decodeBlock - start %j', blockProto);

        if (!blockProto) {
            throw new Error('Block input data is missing');
        }
        const block = {};
        try {
            block.header = {
                number: blockProto.header.number,
                previous_hash: blockProto.header.previous_hash,
                data_hash: blockProto.header.data_hash
            };
            block.data = decodeBlockData(blockProto.data);
            block.metadata = decodeBlockMetaData(blockProto.metadata);
        } catch (error) {
            logger.error('decode - ::' + (error.stack ? error.stack : error));
            throw new Error('Block decode has failed with ' + error.toString());
        }

        logger.debug('decodeBlock - end');
        return block;
    }

    /**
     * Constructs an object containing all decoded values from the
     * protobuf `common.Block` object
     *
     * @param {Object} filteredBlockProto- an object that represents the protobuf protos.FilteredBlock
     * @returns {FilteredBlock} An object of the fully decoded protobuf protos.FilteredBlock
     */
    static decodeFilteredBlock(filteredBlockProto) {
        logger.debug('decodeFilteredBlock - start %j', filteredBlockProto);

        if (!filteredBlockProto) {
            throw new Error('FilteredBlock input data is missing');
        }
        const filtered_block = {};
        try {
            filtered_block.channel_id = filteredBlockProto.channel_id;
            if (filteredBlockProto.number) {
                filtered_block.number = filteredBlockProto.number;
            }
            filtered_block.filtered_transactions = decodeFilteredTransactions(filteredBlockProto.filtered_transactions);
        } catch (error) {
            logger.error('decode - ::' + (error.stack ? error.stack : error));
            throw new Error('FilteredBlock decode has failed with ' + error.toString());
        }

        logger.debug('decodeFilteredBlock - end');
        return filtered_block;
    }

    /**
     * Constructs an object containing all decoded values from the
     * protobuf `BlockAndPrivateData` object
     *
     * @param {Object} blockAndPrivateDataProto - an object that represents the protobuf common.BlockAndPrivateData
     * @returns {Object} An object with the fully decoded protobuf common.Block and the private data map
     */
    static decodeBlockWithPrivateData(blockAndPrivateDataProto) {
        logger.debug('decodeBlockWithPrivateData - start');

        if (!blockAndPrivateDataProto) {
            throw new Error('Block with private data input data is missing');
        }
        const blockAndPrivateData = {};
        try {
            blockAndPrivateData.block = this.decodeBlock(blockAndPrivateDataProto.block);
            blockAndPrivateData.private_data_map = decodePrivateData(blockAndPrivateDataProto.private_data_map);
        } catch (error) {
            logger.error('decode - ::' + (error.stack ? error.stack : error));
            throw new Error('Block with private data decode has failed with ' + error.toString());
        }

        logger.debug('decodeBlockWithPrivateData - end');
        return blockAndPrivateData;
    }

    /**
     * @typedef {Object} ProcessedTransaction
     * @property {number} validationCode - See [this list]{@link https://github.com/hyperledger/fabric/blob/v1.0.0/protos/peer/transaction.proto#L125}
     * for all the defined validation codes
     * @property {Object} transactionEnvelope - Encapsulates the transaction and the signature over it.
     * It has the following structure:
    	<br><pre>
    	signature -- {byte[]}
    	payload -- {}
    	header -- {{@link Header}}
    	data -- {{@link Transaction}}
    	</pre>
     */

    /**
     * Constructs an object containing all decoded values from the
     * protobuf encoded "ProcessedTransaction" bytes
     *
     * @param {byte[]} processedTransactionBuf - The encode bytes of a protobuf
     *                                               message "ProcessedTransaction"
     * @returns {ProcessedTransaction} A fully decoded ProcessedTransaction object
     */
    static decodeTransaction(processedTransactionBuf) {
        logger.debug('decodeTransaction - start');


        if (!(processedTransactionBuf instanceof Buffer)) {
            throw new Error('Processed transaction data is not a byte buffer');
        }
        const processedTransactionProto = fabproto6.protos.ProcessedTransaction.decode(processedTransactionBuf);

        const transactionEnvelope = decodeBlockDataEnvelope(processedTransactionProto.transactionEnvelope);

        logger.debug('decodeTransaction - end');
        return {
            validationCode: processedTransactionProto.validationCode,
            transactionEnvelope
        };
    }
}

function decodeFilteredTransactions(filteredTransactionsProto) {
    logger.debug('decodeFilteredTransactions - %j', filteredTransactionsProto);
    const filtered_transactions = [];
    if (filteredTransactionsProto && Array.isArray(filteredTransactionsProto)) {
        for (const filteredTransactionProto of filteredTransactionsProto) {
            const filtered_transaction = {};
            filtered_transaction.txid = filteredTransactionProto.txid;
            filtered_transaction.type = filteredTransactionProto.type;
            filtered_transaction.typeString = fabproto6.common.HeaderType[filteredTransactionProto.type];
            filtered_transaction.tx_validation_code = filteredTransactionProto.tx_validation_code;
            filtered_transaction.transaction_actions = decodeFilteredTransactionActions(filteredTransactionProto.transaction_actions);
            filtered_transactions.push(filtered_transaction);
        }
    }

    return filtered_transactions;
}

function decodeFilteredTransactionActions(transactionActionsProto) {
    const transaction_actions = {};
    if (transactionActionsProto && transactionActionsProto.chaincode_actions) {
        transaction_actions.chaincode_actions = [];
        if (Array.isArray(transactionActionsProto.chaincode_actions)) {
            for (const filteredChaincodeAction of transactionActionsProto.chaincode_actions) {
                const chaincode_action = decodeFilteredChaincodeAction(filteredChaincodeAction);
                transaction_actions.chaincode_actions.push(chaincode_action);
            }
        }
    }

    return transaction_actions;
}

function decodeFilteredChaincodeAction(filteredChaincodeActionProto) {
    const chaincode_action = {};
    if (filteredChaincodeActionProto && filteredChaincodeActionProto.chaincode_event) {
        chaincode_action.chaincode_event = {
            chaincode_id: filteredChaincodeActionProto.chaincode_event.chaincode_id,
            tx_id: filteredChaincodeActionProto.chaincode_event.tx_id,
            event_name: filteredChaincodeActionProto.chaincode_event.event_name
            // filtered events do not have a payload
        };
    }

    return chaincode_action;
}

function decodePrivateData(privateDataMapProto) {
    if (!privateDataMapProto) {
        logger.debug('decodePrivateData - private data is missing');
        return {};
    }
    const private_data_map = {};
    let found = false;
    // map key is the transaction index of the transaction for the private data
    for (const txIndex in privateDataMapProto) {
        const tx_pvt_read_write_set = {};
        const txPvtReadWriteSetProto = privateDataMapProto[txIndex];

        tx_pvt_read_write_set.data_model = txPvtReadWriteSetProto.data_model; // only KV=0
        tx_pvt_read_write_set.ns_pvt_rwset = [];
        for (const nsPvtRwsetProto of txPvtReadWriteSetProto.ns_pvt_rwset) {
            const ns_pvt_rwset = {};
            ns_pvt_rwset.namespace = nsPvtRwsetProto.namespace;
            ns_pvt_rwset.collection_pvt_rwset = [];
            for (const collectionPvtRwsetProto of nsPvtRwsetProto.collection_pvt_rwset) {
                const collection_pvt_rwset = {};
                collection_pvt_rwset.collection_name = collectionPvtRwsetProto.collection_name;
                collection_pvt_rwset.rwset = decodeKVRWSet(collectionPvtRwsetProto.rwset);
                ns_pvt_rwset.collection_pvt_rwset.push(collection_pvt_rwset);
            }
            tx_pvt_read_write_set.ns_pvt_rwset.push(ns_pvt_rwset);
        }
        const intIndex = fabproto6.uint64ToNumber(txIndex);
        private_data_map[intIndex] = tx_pvt_read_write_set;
        found = true;
    }

    if (!found) {
        logger.debug('decodePrivateData - no private data');
    }

    return private_data_map;
}

function decodeBlockHeader(blockHeaderProto) {
    const block_header = {};
    block_header.number = blockHeaderProto.number;
    block_header.previous_hash = blockHeaderProto.previous_hash;
    block_header.data_hash = blockHeaderProto.data_hash;

    return block_header;
}

function decodeBlockData(dataProto) {
    const data = {};
    data.data = [];
    for (const dataBuf of dataProto.data) {
        const envelopeProto = fabproto6.common.Envelope.decode(dataBuf);
        const envelope = decodeBlockDataEnvelope(envelopeProto);
        data.data.push(envelope);
    }

    return data;
}

function decodeBlockMetaData(metadataProto) {
    const metadata = {};
    metadata.metadata = [];
    // metadata is an array with fixed locations for metadata types
    if (metadataProto && metadataProto.metadata) {
        metadata.metadata[0] = decodeMetadataSignatures(metadataProto.metadata[0]);
        metadata.metadata[1] = {};
        metadata.metadata[2] = decodeTransactionFilter(metadataProto.metadata[2]);
        metadata.metadata[3] = {};
        metadata.metadata[4] = decodeCommitHash(metadataProto.metadata[4]);
    }

    return metadata;
}

function decodeCommitHash(metadataBuf) {
    return metadataBuf; // just return the buffer as is
}

function decodeTransactionFilter(metadataBuf) {
    const transaction_filter = [];
    if (!metadataBuf || !(metadataBuf instanceof Buffer)) {
        logger.debug('decodeTransactionFilter - no metadata');

        return transaction_filter;
    }

    logger.debug('decodeTransactionFilter - transactionFilters length:%s', metadataBuf.length);

    for (let i = 0; i < metadataBuf.length; i++) {
        const value = parseInt(metadataBuf[i]);
        logger.debug('decodeTransactionFilter - looking at index:%s with value:%s', i, value);
        transaction_filter.push(value);
    }

    return transaction_filter;
}

function decodeMetadataSignatures(metadataBuf) {
    const metadata = {};
    const metadataProto = fabproto6.common.Metadata.decode(metadataBuf);
    metadata.value = metadataProto.value;
    metadata.signatures = decodeMetadataValueSignatures(metadataProto.signatures);

    return metadata;
}

function decodeMetadataValueSignatures(signaturesProto) {
    const signatures = [];
    if (signaturesProto) {
        for (const metadataSignatureProto of signaturesProto) {
            const metadata_signature = {};
            metadata_signature.signature_header = decodeSignatureHeader(metadataSignatureProto.signature_header);
            metadata_signature.signature = metadataSignatureProto.signature;
            signatures.push(metadata_signature);
        }
    }

    return signatures;
}

function decodeBlockDataEnvelope(envelopeProto) {
    const envelope = {};
    envelope.signature = envelopeProto.signature;

    envelope.payload = {};
    const payloadProto = fabproto6.common.Payload.decode(envelopeProto.payload);
    envelope.payload.header = decodeHeader(payloadProto.header);

    console.log('-------------------Validation----------------')
    console.log('-------------------envelope----------------')

    //-------------test------------
    //-------------User.js, BlockDecoder.js file------------
    //const User = require('./User')
    //let user = new User(cfg);
    //let opts;
    //let valid = await user.signVerify(privateKey, certificate, mspId, envelopeProto.payload, envelope.signature, opts);
    //console.log(valid);


    const crypto = require('crypto');
    const verify = crypto.createVerify('SHA256');
    verify.update(envelopeProto.payload);
    verify.end();
    const veritifation = verify.verify(certificate, envelope.signature);
    console.log('-----------using cypto---------')
    console.log(veritifation)

    //-------------test------------

    switch (envelope.payload.header.channel_header.type) {
        case 1:
            envelope.payload.data = decodeConfigEnvelope(payloadProto.data);
            break;
        case 2:
            envelope.payload.data = decodeConfigUpdateEnvelope(payloadProto.data);
            break;
        case 3:
            envelope.payload.data = decodeEndorserTransaction(payloadProto.data);
            break;
        default:
            logger.debug(' ***** found an unknown header type of %s', envelope.payload.header.channel_header.type);
            // return empty data on types we do not know so that
            // event processing may continue on blocks we do not
            // care about
            envelope.payload.data = {};
    }
    // let's also have the type as the enum string value so it is easier to read
    envelope.payload.header.channel_header.typeString =
        fabproto6.common.HeaderType[envelope.payload.header.channel_header.type];

    return envelope;
}

function decodeEndorserTransaction(dataBuf) {
    const data = {};
    try {
        const transactionProto = fabproto6.protos.Transaction.decode(dataBuf);
        data.actions = [];
        if (transactionProto && transactionProto.actions) {
            for (const actionProto of transactionProto.actions) {
                const action = {};
                action.header = decodeSignatureHeader(actionProto.header);
                action.payload = decodeChaincodeActionPayload(actionProto.payload);
                data.actions.push(action);
            }
        }
    } catch (error) {
        logger.error(' Unable to decodeEndorserTransaction :: %s', error);
        logger.error(' Unable to decodeEndorserTransaction :: %s', error.stack);
    }

    return data;
}

function decodeConfigEnvelope(dataBuf) {
    const config_envelope = {};
    const configEnvelopeProto = fabproto6.common.ConfigEnvelope.decode(dataBuf);
    config_envelope.config = decodeConfig(configEnvelopeProto.config);
    logger.debug('decodeConfigEnvelope - decode complete for config envelope - start config update');
    config_envelope.last_update = {};
    const lastUpdateProto = configEnvelopeProto.last_update; // this is a common.Envelope
    if (lastUpdateProto) { // the orderer's genesis block may not have this field
        config_envelope.last_update.payload = {};
        const payloadProto = fabproto6.common.Payload.decode(lastUpdateProto.payload);
        config_envelope.last_update.payload.header = decodeHeader(payloadProto.header);
        config_envelope.last_update.payload.data = decodeConfigUpdateEnvelope(payloadProto.data);
        config_envelope.last_update.signature = lastUpdateProto.signature; // leave as bytes
    }

    return config_envelope;
}

function decodeConfig(configProto) {
    const config = {};
    config.sequence = configProto.sequence; // unit64
    config.channel_group = decodeConfigGroup(configProto.channel_group);

    return config;
}

function decodeConfigUpdateEnvelope(dataBuf) {
    const config_update_envelope = {};
    const configUpdateEnvelopeProto = fabproto6.common.ConfigUpdateEnvelope.decode(dataBuf);
    config_update_envelope.config_update = decodeConfigUpdate(configUpdateEnvelopeProto.config_update);
    const signatures = [];
    for (const configSignatureProto of configUpdateEnvelopeProto.signatures) {
        const config_signature = decodeConfigSignature(configSignatureProto);
        signatures.push(config_signature);
    }
    config_update_envelope.signatures = signatures;

    return config_update_envelope;
}

function decodeConfigUpdate(configUpdateBuf) {
    const config_update = {};
    const configUpdateProto = fabproto6.common.ConfigUpdate.decode(configUpdateBuf);
    config_update.channel_id = configUpdateProto.channel_id;
    config_update.read_set = decodeConfigGroup(configUpdateProto.read_set);
    config_update.write_set = decodeConfigGroup(configUpdateProto.write_set);

    return config_update;
}

function decodeConfigGroups(configGroupsProto) {
    const config_groups = {};
    const keys = Object.keys(configGroupsProto);
    for (const groupName of keys) {
        config_groups[groupName] = decodeConfigGroup(configGroupsProto[groupName]);
    }

    return config_groups;
}

function decodeConfigGroup(configGroupProto) {
    if (!configGroupProto) {
        return null;
    }
    const config_group = {};
    config_group.version = convertVersion(configGroupProto.version);
    config_group.groups = decodeConfigGroups(configGroupProto.groups);
    config_group.values = decodeConfigValues(configGroupProto.values);
    config_group.policies = decodeConfigPolicies(configGroupProto.policies);
    config_group.mod_policy = configGroupProto.mod_policy; // string
    return config_group;
}

function decodeConfigValues(configValuesProto) {
    const config_values = {};
    const keys = Object.keys(configValuesProto);
    for (const valueName of keys) {
        config_values[valueName] = decodeConfigValue(configValuesProto[valueName], valueName);
    }

    return config_values;
}

function decodeConfigValueAnchorPeers(valueBuf) {
    const value = {};
    value.anchor_peers = [];
    const anchorPeersProto = fabproto6.protos.AnchorPeers.decode(valueBuf);
    if (anchorPeersProto && anchorPeersProto.anchor_peers) {
        for (const anchorPeerProto of anchorPeersProto.anchor_peers) {
            const anchor_peer = {
                host: anchorPeerProto.host,
                port: anchorPeerProto.port
            };
            value.anchor_peers.push(anchor_peer);
        }
    }

    return value;
}

function decodeConfigValueMSP(valueBuf) {
    const value = {};
    const mspConfigProto = fabproto6.msp.MSPConfig.decode(valueBuf);
    value.type = mspConfigProto.type;
    if (mspConfigProto.type === 0) {
        value.config = decodeFabricMSPConfig(mspConfigProto.config);
    }

    return value;
}

function decodeConfigValueConsensusType(valueBuf) {
    const value = {};
    const consensusTypeProto = fabproto6.orderer.ConsensusType.decode(valueBuf);
    value.type = consensusTypeProto.type; // string

    return value;
}

function decodeConfigValueBatchSize(valueBuf) {
    const value = {};
    const batchSizeProto = fabproto6.orderer.BatchSize.decode(valueBuf);
    value.max_message_count = batchSizeProto.max_message_count; // uint32
    value.absolute_max_bytes = batchSizeProto.absolute_max_bytes; // uint32
    value.preferred_max_bytes = batchSizeProto.preferred_max_bytes; // uint32

    return value;
}

function decodeConfigValueBatchTimeout(valueBuf) {
    const value = {};
    const batchTimeoutProto = fabproto6.orderer.BatchTimeout.decode(valueBuf);
    value.timeout = batchTimeoutProto.timeout; // string

    return value;
}

function decodeConfigValueChannelRestrictions(valueBuf) {
    const value = {};
    const channelRestrictionsProto = fabproto6.orderer.ChannelRestrictions.decode(valueBuf);
    value.max_count = channelRestrictionsProto.max_count; // unit64

    return value;
}

function decodeConfigValueBlockDataConsortium(valueBuf) {
    const value = {};
    const consortiumName = fabproto6.common.Consortium.decode(valueBuf);
    value.name = consortiumName.name; // string

    return value;
}

function decodeConfigValueHashingAlgorithm(valueBuf) {
    const value = {};
    const hashingAlgorithmProto = fabproto6.common.HashingAlgorithm.decode(valueBuf);
    value.name = hashingAlgorithmProto.name; // string

    return value;
}

function decodeConfigValueBlockDataHashingStructure(valueBuf) {
    const value = {};
    const blockdataHashingStructureProto = fabproto6.common.BlockDataHashingStructure.decode(valueBuf);
    value.width = blockdataHashingStructureProto.width; // int

    return value;
}

function decodeConfigValueOrdererAddresses(valueBuf) {
    const value = {};
    const ordererAddressesProto = fabproto6.common.OrdererAddresses.decode(valueBuf);
    value.addresses = [];
    for (const address of ordererAddressesProto.addresses) {
        value.addresses.push(address); // string
    }

    return value;
}

function decodeConfigCapabilities(valueBuf) {
    const value = {};
    const capabilitiesProto = fabproto6.common.Capabilities.decode(valueBuf);
    value.capabilities = capabilitiesProto.capabilities;

    return value;
}

function decodeConfigACLs(valueBuf) {
    const value = {};
    const aclsProto = fabproto6.protos.ACLs.decode(valueBuf);
    value.acls = aclsProto.acls;

    return value;
}

function decodeConfigValue(configValueProto, valueName) {
    const config_value = {};
    logger.debug(' ======> Config item ::%s', valueName);
    config_value.mod_policy = configValueProto.mod_policy;
    config_value.version = convertVersion(configValueProto.version);
    switch (valueName) {
        case 'AnchorPeers':
            config_value.value = decodeConfigValueAnchorPeers(configValueProto.value);
            break;
        case 'MSP':
            config_value.value = decodeConfigValueMSP(configValueProto.value);
            break;
        case 'ConsensusType':
            config_value.value = decodeConfigValueConsensusType(configValueProto.value);
            break;
        case 'BatchSize':
            config_value.value = decodeConfigValueBatchSize(configValueProto.value);
            break;
        case 'BatchTimeout':
            config_value.value = decodeConfigValueBatchTimeout(configValueProto.value);
            break;
        case 'ChannelRestrictions':
            config_value.value = decodeConfigValueChannelRestrictions(configValueProto.value);
            break;
        case 'Consortium':
            config_value.value = decodeConfigValueBlockDataConsortium(configValueProto.value);
            break;
        case 'HashingAlgorithm':
            config_value.value = decodeConfigValueHashingAlgorithm(configValueProto.value);
            break;
        case 'BlockDataHashingStructure':
            config_value.value = decodeConfigValueBlockDataHashingStructure(configValueProto.value);
            break;
        case 'OrdererAddresses':
            config_value.value = decodeConfigValueOrdererAddresses(configValueProto.value);
            break;
        case 'Capabilities':
            config_value.value = decodeConfigCapabilities(configValueProto.value);
            break;
        case 'ACLs':
            config_value.value = decodeConfigACLs(configValueProto.value);
            break;
        default:
    }

    return config_value;
}

function decodeConfigPolicies(configPoliciesProto) {
    const config_policies = {};
    const keys = Object.keys(configPoliciesProto);
    for (const policyName of keys) {
        config_policies[policyName] = decodeConfigPolicy(configPoliciesProto[policyName]);
    }

    return config_policies;
}

function decodeConfigPolicy(configPolicyProto) {
    const config_policy = {};
    config_policy.version = convertVersion(configPolicyProto.version);
    config_policy.mod_policy = configPolicyProto.mod_policy;
    config_policy.policy = {};
    if (configPolicyProto && configPolicyProto.policy) {
        config_policy.policy.type = configPolicyProto.policy.type;
        config_policy.policy.typeString = fabproto6.common.Policy.PolicyType[configPolicyProto.policy.type];
        logger.debug('decodeConfigPolicy ======> Policy ::%s', config_policy.policy.typeString);
        switch (configPolicyProto.policy.type) {
            case fabproto6.common.Policy.PolicyType.SIGNATURE:
                config_policy.policy.value = decodeSignaturePolicyEnvelope(configPolicyProto.policy.value);
                break;
            case fabproto6.common.Policy.PolicyType.MSP:
                // var proto_msp = fabproto6.common.Policy.decode(configPolicyProto.value.policy.value);
                logger.warn('decodeConfigPolicy - found a PolicyType of MSP. This policy type has not been implemented yet.');
                break;
            case fabproto6.common.Policy.PolicyType.IMPLICIT_META:
                config_policy.policy.value = decodeImplicitMetaPolicy(configPolicyProto.policy.value);
                break;
            default:
                throw new Error('Unknown Policy type');
        }
    }

    return config_policy;
}

function decodeImplicitMetaPolicy(implicitMetaPolicyBuf) {
    const implicit_meta_policy = {};
    const implicitMetaPolicyProto = fabproto6.common.ImplicitMetaPolicy.decode(implicitMetaPolicyBuf);
    implicit_meta_policy.sub_policy = implicitMetaPolicyProto.sub_policy;
    implicit_meta_policy.rule = implicitMetaPolicyProto.rule;
    implicit_meta_policy.ruleString = fabproto6.common.ImplicitMetaPolicy.Rule[implicitMetaPolicyProto.rule];

    return implicit_meta_policy;
}

function decodeSignaturePolicyEnvelope(signaturePolicyEnvelopeBuf) {
    const signature_policy_envelope = {};
    const signaturePolicyEnvelopeProto = fabproto6.common.SignaturePolicyEnvelope.decode(signaturePolicyEnvelopeBuf);
    signature_policy_envelope.version = convertVersion(signaturePolicyEnvelopeProto.version);
    signature_policy_envelope.rule = decodeSignaturePolicy(signaturePolicyEnvelopeProto.rule);
    signature_policy_envelope.identities = [];
    const identitiesProto = signaturePolicyEnvelopeProto.identities;
    if (identitiesProto) {
        for (const mSPPrincipalProto of identitiesProto) {
            const msp_principal = decodeMSPPrincipal(mSPPrincipalProto);
            signature_policy_envelope.identities.push(msp_principal);
        }
    }

    return signature_policy_envelope;
}

function decodeSignaturePolicy(signaturePolicyProto) {
    const signature_policy = {};
    if (signaturePolicyProto.n_out_of) {
        signature_policy.n_out_of = {};
        signature_policy.n_out_of.n = signaturePolicyProto.n_out_of.n;
        signature_policy.n_out_of.rules = [];
        for (const childSignaturePolicyProto of signaturePolicyProto.n_out_of.rules) {
            const child_signature_policy = decodeSignaturePolicy(childSignaturePolicyProto);
            signature_policy.n_out_of.rules.push(child_signature_policy);
        }
    } else {
        signature_policy.signed_by = signaturePolicyProto.signed_by; // int32
    }

    return signature_policy;
}

function decodeMSPPrincipal(mSPPrincipalProto) {
    let msp_principal = {};
    msp_principal.principal_classification = mSPPrincipalProto.principal_classification;
    let principalProto;
    switch (msp_principal.principal_classification) {
        case fabproto6.common.MSPPrincipal.Classification.ROLE:
            principalProto = fabproto6.common.MSPRole.decode(mSPPrincipalProto.principal);
            msp_principal.msp_identifier = principalProto.msp_identifier;
            msp_principal.role = principalProto.role;
            // add a string for the role type
            msp_principal.roleString = fabproto6.common.MSPRole.MSPRoleType[principalProto.role];
            break;
        case fabproto6.common.MSPPrincipal.Classification.ORGANIZATION_UNIT:
            principalProto = fabproto6.common.OrganizationUnit.decode(mSPPrincipalProto.principal);
            msp_principal.msp_identifier = principalProto.msp_identifier; // string
            msp_principal.organizational_unit_identifier = principalProto.organizational_unit_identifier; // string
            msp_principal.certifiers_identifier = principalProto.certifiers_identifier; // bytes
            break;
        case fabproto6.common.MSPPrincipal.Classification.IDENTITY:
            msp_principal = decodeIdentity(mSPPrincipalProto.principal);
            break;
    }

    return msp_principal;
}

function decodeConfigSignature(configSignatureProto) {
    const config_signature = {};
    config_signature.signature_header = decodeSignatureHeader(configSignatureProto.signature_header);
    config_signature.sigature = configSignatureProto.signature;
    return config_signature;
}

function decodeSignatureHeader(signatureHeaderBuf) {
    const signature_header = {};
    const signatureHeaderProto = fabproto6.common.SignatureHeader.decode(signatureHeaderBuf);
    signature_header.creator = decodeIdentity(signatureHeaderProto.creator);
    signature_header.nonce = signatureHeaderProto.nonce;

    return signature_header;
}

function decodeIdentity(identityBuf) {
    const identity = {};
    try {
        const identityProto = fabproto6.msp.SerializedIdentity.decode(identityBuf);
        identity.mspid = identityProto.mspid;
        identity.id_bytes = identityProto.id_bytes;
    } catch (err) {
        logger.error('Failed to decode the identity: %s', (err.stack ? err.stack : err));
    }

    return identity;
}

function decodeFabricMSPConfig(fabricMSPConfigBuf) {
    const config = {};
    const mspConfigProto = fabproto6.msp.FabricMSPConfig.decode(fabricMSPConfigBuf);

    config.name = mspConfigProto.name;
    config.root_certs = toPEMcerts(mspConfigProto.root_certs);
    config.intermediate_certs = toPEMcerts(mspConfigProto.intermediate_certs);
    config.admins = toPEMcerts(mspConfigProto.admins);
    config.revocation_list = toPEMcerts(mspConfigProto.revocation_list);
    config.signing_identity = decodeSigningIdentityInfo(mspConfigProto.signing_identity);
    config.organizational_unit_identifiers = decodeFabricOUIdentifier(mspConfigProto.organizational_unit_identifiers);
    config.tls_root_certs = toPEMcerts(mspConfigProto.tls_root_certs);
    config.tls_intermediate_certs = toPEMcerts(mspConfigProto.tls_intermediate_certs);

    return config;
}

function decodeFabricOUIdentifier(organizationalUnitIdentitfiersProto) {
    const organizational_unit_identitfiers = [];
    if (organizationalUnitIdentitfiersProto) {
        for (let i = 0; i < organizationalUnitIdentitfiersProto.length; i++) {
            const organizationalUnitIdentitfierProto = organizationalUnitIdentitfiersProto[i];
            const organizational_unit_identitfier = {};
            organizational_unit_identitfier.certificate =
                organizationalUnitIdentitfierProto.certificate;
            organizational_unit_identitfier.organizational_unit_identifier =
                organizationalUnitIdentitfierProto.organizational_unit_identifier;

            organizational_unit_identitfiers.push(organizational_unit_identitfier);
        }
    }

    return organizational_unit_identitfiers;
}

function toPEMcerts(buffer_array_in) {
    const buffer_array_out = [];
    for (const i in buffer_array_in) {
        buffer_array_out.push(buffer_array_in[i]);
    }

    return buffer_array_out;
}

function decodeSigningIdentityInfo(signingIdentityInfoBuf) {
    const signing_identity_info = {};
    if (signingIdentityInfoBuf) {
        const signingIdentityInfoProto = fabproto6.msp.SigningIdentityInfo.decode(signingIdentityInfoBuf);
        signing_identity_info.public_signer = signingIdentityInfoProto.public_signer;
        signing_identity_info.private_signer = decodeKeyInfo(signingIdentityInfoProto.private_signer);
    }

    return signing_identity_info;
}

function decodeKeyInfo(keyInfoBuf) {
    const key_info = {};
    if (keyInfoBuf) {
        const keyInfoProto = fabproto6.msp.KeyInfo.decode(keyInfoBuf);
        key_info.key_identifier = keyInfoProto.key_identifier;
        key_info.key_material = 'private'; // should not show this
    }

    return key_info;
}

function decodeHeader(headerProto) {
    const header = {};
    header.channel_header = decodeChannelHeader(headerProto.channel_header);
    header.signature_header = decodeSignatureHeader(headerProto.signature_header);

    return header;
}

function decodeChannelHeader(channelHeaderBuf) {
    const channel_header = {};
    const channelHeaderProto = fabproto6.common.ChannelHeader.decode(channelHeaderBuf);
    channel_header.type = channelHeaderProto.type;
    logger.debug('decodeChannelHeader - looking at type:%s', channel_header.type);
    channel_header.version = convertVersion(channelHeaderProto.version);
    channel_header.timestamp = timeStampToDate(channelHeaderProto.timestamp);
    channel_header.channel_id = channelHeaderProto.channel_id;
    channel_header.tx_id = channelHeaderProto.tx_id;
    channel_header.epoch = channelHeaderProto.epoch; // unit64
    // TODO need to decode this
    channel_header.extension = channelHeaderProto.extension;

    return channel_header;
}

function decodeChaincodeActionPayload(chaincodeActionPayloadBuf) {
    const payload = {};
    const chaincodeActionPayloadProto = fabproto6.protos.ChaincodeActionPayload.decode(chaincodeActionPayloadBuf);
    payload.chaincode_proposal_payload = decodeChaincodeProposalPayload(chaincodeActionPayloadProto.chaincode_proposal_payload);
    payload.action = decodeChaincodeEndorsedAction(chaincodeActionPayloadProto.action);

    return payload;
}

function decodeChaincodeProposalPayload(chaincodeProposalPayloadBuf) {
    const chaincode_proposal_payload = {};
    const chaincodeProposalPayloadProto = fabproto6.protos.ChaincodeProposalPayload.decode(chaincodeProposalPayloadBuf);
    chaincode_proposal_payload.input = decodeChaincodeProposalPayloadInput(chaincodeProposalPayloadProto.input);
    // TransientMap is not allowed to be included on ledger

    return chaincode_proposal_payload;
}

function decodeChaincodeProposalPayloadInput(chaincodePoposalPayloadInputBuf) {
    const chaincode_proposal_payload_input = {};

    // For a normal transaction, input is ChaincodeInvocationSpec.
    const chaincodeInvocationSpecProto = fabproto6.protos.ChaincodeInvocationSpec.decode(chaincodePoposalPayloadInputBuf);
    chaincode_proposal_payload_input.chaincode_spec = decodeChaincodeSpec(chaincodeInvocationSpecProto.chaincode_spec);

    return chaincode_proposal_payload_input;
}

function decodeChaincodeSpec(chaincodeSpecProto) {
    const chaincode_spec = {};
    chaincode_spec.type = chaincodeSpecProto.type;
    // Add a string for the chaincode type (GOLANG, NODE, etc.)
    chaincode_spec.typeString = fabproto6.protos.ChaincodeSpec.Type[chaincode_spec.type];
    chaincode_spec.input = decodeChaincodeInput(chaincodeSpecProto.input);
    chaincode_spec.chaincode_id = chaincodeSpecProto.chaincode_id;
    chaincode_spec.timeout = chaincodeSpecProto.timeout;

    return chaincode_spec;
}

function decodeChaincodeInput(chaincodeInputProto) {
    const chaincode_input = {};

    chaincode_input.args = [];
    for (const arg of chaincodeInputProto.args) {
        chaincode_input.args.push(arg);
    }
    const keys = Object.keys(chaincodeInputProto.decorations);
    chaincode_input.decorations = {};
    for (const key of keys) {
        chaincode_input.decorations[key] = chaincodeInputProto.decorations[key];
    }
    chaincode_input.is_init = chaincodeInputProto.is_init;

    return chaincode_input;
}

function decodeChaincodeEndorsedAction(chaincodeEndorsedActionProto) {
    const chaincode_endorsed_action = {};
    chaincode_endorsed_action.proposal_response_payload = decodeProposalResponsePayload(chaincodeEndorsedActionProto.proposal_response_payload);
    chaincode_endorsed_action.endorsements = [];
    for (const endorsementProto of chaincodeEndorsedActionProto.endorsements) {
        const endorsement = decodeEndorsement(endorsementProto);
        chaincode_endorsed_action.endorsements.push(endorsement);
    }

    return chaincode_endorsed_action;
}

function decodeEndorsement(endorsementProto) {
    const endorsement = {};
    endorsement.endorser = decodeIdentity(endorsementProto.endorser);
    endorsement.signature = endorsementProto.signature;

    return endorsement;
}

function decodeProposalResponsePayload(proposalResponsePayloadBuf) {
    const proposal_response_payload = {};
    const proposalResponsePayloadProto = fabproto6.protos.ProposalResponsePayload.decode(proposalResponsePayloadBuf);
    proposal_response_payload.proposal_hash = proposalResponsePayloadProto.proposal_hash;
    proposal_response_payload.extension = decodeChaincodeAction(proposalResponsePayloadProto.extension);

    return proposal_response_payload;
}

function decodeChaincodeAction(chaincodeActionBuf) {
    logger.debug('decodeChaincodeAction - start');
    const chaincode_action = {};
    const chaincodeActionProto = fabproto6.protos.ChaincodeAction.decode(chaincodeActionBuf);
    chaincode_action.results = decodeReadWriteSets(chaincodeActionProto.results);
    // it may be called events, however it is only one event at this time
    chaincode_action.events = decodeChaincodeEvent(chaincodeActionProto.events);
    chaincode_action.response = decodeResponse(chaincodeActionProto.response);
    chaincode_action.chaincode_id = decodeChaincodeID(chaincodeActionProto.chaincode_id);

    return chaincode_action;
}

function decodeChaincodeEvent(chaincodeEventBuf) {
    const event = {};
    const chaincodeEventProto = fabproto6.protos.ChaincodeEvent.decode(chaincodeEventBuf);
    event.chaincode_id = chaincodeEventProto.chaincode_id;
    event.tx_id = chaincodeEventProto.tx_id;
    event.event_name = chaincodeEventProto.event_name;
    event.payload = chaincodeEventProto.payload;

    return event;
}

function decodeResponse(responseProto) {
    if (responseProto) {
        const response = {};
        response.status = responseProto.status;
        response.message = responseProto.message;
        response.payload = responseProto.payload;

        return response;
    }
    return undefined;
}

function decodeChaincodeID(chaincodeIDProto) {
    const chaincode_id = {};
    if (!chaincodeIDProto) {
        logger.debug('decodeChaincodeID - no chaincodeIDProto found');
        return chaincode_id;
    }
    logger.debug('decodeChaincodeID - start');
    chaincode_id.path = chaincodeIDProto.path;
    chaincode_id.name = chaincodeIDProto.name;
    chaincode_id.version = chaincodeIDProto.version;

    return chaincode_id;
}

function decodeReadWriteSets(rwsetBuf) {
    const txReadWriteSetProto = fabproto6.rwset.TxReadWriteSet.decode(rwsetBuf);
    const tx_read_write_set = {};
    tx_read_write_set.data_model = txReadWriteSetProto.data_model;
    if (txReadWriteSetProto.data_model === fabproto6.rwset.TxReadWriteSet.DataModel.KV) {
        tx_read_write_set.ns_rwset = [];
        for (const nsReadWriteSet of txReadWriteSetProto.ns_rwset) {
            const kv_rw_set = {};
            kv_rw_set.namespace = nsReadWriteSet.namespace;
            kv_rw_set.rwset = decodeKVRWSet(nsReadWriteSet.rwset);
            kv_rw_set.collection_hashed_rwset = decodeCollectionHashedRWSet(nsReadWriteSet.collection_hashed_rwset);
            tx_read_write_set.ns_rwset.push(kv_rw_set);
        }
    } else {
        // not able to decode this type of rw set, return as is
        tx_read_write_set.ns_rwset = txReadWriteSetProto.ns_rwset;
    }

    return tx_read_write_set;
}

function decodeKVRWSet(kvBuf) {
    const kVRWSetProto = fabproto6.kvrwset.KVRWSet.decode(kvBuf);
    const kv_rw_set = {};

    // build reads
    kv_rw_set.reads = [];
    for (const kvReadProto of kVRWSetProto.reads) {
        kv_rw_set.reads.push(decodeKVRead(kvReadProto));
    }

    // build range_queries_info
    kv_rw_set.range_queries_info = [];
    for (const rangeQueryInfoProto of kVRWSetProto.range_queries_info) {
        kv_rw_set.range_queries_info.push(decodeRangeQueryInfo(rangeQueryInfoProto));
    }

    // build writes
    kv_rw_set.writes = [];
    for (const kVWriteProto of kVRWSetProto.writes) {
        kv_rw_set.writes.push(decodeKVWrite(kVWriteProto));
    }

    // build metadata writes
    kv_rw_set.metadata_writes = [];
    for (const kVMetadataWriteProto of kVRWSetProto.metadata_writes) {
        kv_rw_set.metadata_writes.push(decodeKVMetadataWrite(kVMetadataWriteProto));
    }

    return kv_rw_set;
}

function decodeVersion(versionProto) {
    if (versionProto) {
        const version = {};
        version.block_num = versionProto.block_num;
        version.tx_num = versionProto.tx_num;
        return version;
    }

    return;
}

function decodeKVRead(kVReadProto) {
    const kv_read = {};
    kv_read.key = kVReadProto.key;
    kv_read.version = decodeVersion(kVReadProto.version);

    return kv_read;
}

function decodeRangeQueryInfo(rangeQueryInfoProto) {
    const range_query_info = {};
    range_query_info.start_key = rangeQueryInfoProto.start_key;
    range_query_info.end_key = rangeQueryInfoProto.end_key;
    range_query_info.itr_exhausted = rangeQueryInfoProto.itr_exhausted;

    // reads_info is one of QueryReads or QueryReadsMerkleSummary
    if (rangeQueryInfoProto.raw_reads) {
        range_query_info.raw_reads = {};
        range_query_info.raw_reads.kv_reads = [];
        for (const kVReadProto of rangeQueryInfoProto.raw_reads.kv_reads) {
            range_query_info.raw_reads.kv_reads.push(decodeKVRead(kVReadProto));
        }
    } else if (rangeQueryInfoProto.reads_merkle_hashes) {
        range_query_info.reads_merkle_hashes = {};
        range_query_info.reads_merkle_hashes.max_degree = rangeQueryInfoProto.reads_merkle_hashes.max_degree;
        range_query_info.reads_merkle_hashes.max_level = rangeQueryInfoProto.reads_merkle_hashes.max_level;
        range_query_info.reads_merkle_hashes.max_level_hashes = rangeQueryInfoProto.reads_merkle_hashes.max_level_hashes;
    }

    return range_query_info;
}

function decodeKVWrite(kVWriteProto) {
    const kv_write = {};
    kv_write.key = kVWriteProto.key;
    kv_write.is_delete = kVWriteProto.is_delete;
    kv_write.value = kVWriteProto.value;

    return kv_write;
}

function decodeKVMetadataWrite(kVMetadataWriteProto) {
    const kv_metadata_write = {};
    kv_metadata_write.key = kVMetadataWriteProto.key;
    kv_metadata_write.entries = [];
    for (const kVMetadataEntryProto of kVMetadataWriteProto.entries) {
        kv_metadata_write.entries.push(decodeKVMetadataEntry(kVMetadataEntryProto));
    }

    return kv_metadata_write;
}

function decodeKVMetadataEntry(kVMetadataEntryProto) {
    const kv_metadata_entry = {};
    kv_metadata_entry.name = kVMetadataEntryProto.name;
    kv_metadata_entry.value = kVMetadataEntryProto.value;

    return kv_metadata_entry;
}

// This decodes an array of CollectionHashedReadWriteSet
function decodeCollectionHashedRWSet(collectionHashedRwsetArray) {
    const collection_hashed_rwset = [];
    for (const collectionHashedRwset of collectionHashedRwsetArray) {
        const collection = {};
        collection.collection_name = collectionHashedRwset.collection_name;
        collection.hashed_rwset = decodeHashedRwset(collectionHashedRwset.hashed_rwset);
        collection.pvt_rwset_hash = collectionHashedRwset.pvt_rwset_hash;
        collection_hashed_rwset.push(collection);
    }

    return collection_hashed_rwset;
}

function decodeHashedRwset(hashedRWSetBuf) {
    const hashedRWSetProto = fabproto6.kvrwset.HashedRWSet.decode(hashedRWSetBuf);
    const hashed_rwset = {};
    hashed_rwset.hashed_reads = [];
    for (const kVReadHashProto of hashedRWSetProto.hashed_reads) {
        hashed_rwset.hashed_reads.push(decodeKVReadHash(kVReadHashProto));
    }
    hashed_rwset.hashed_writes = [];
    for (const kVWriteHashProto of hashedRWSetProto.hashed_writes) {
        hashed_rwset.hashed_writes.push(decodeKVWriteHash(kVWriteHashProto));
    }
    hashed_rwset.metadata_writes = [];
    for (const kVMetadataWriteHashProto of hashedRWSetProto.metadata_writes) {
        hashed_rwset.metadata_writes.push(decodeKVMetadataWriteHash(kVMetadataWriteHashProto));
    }

    return hashed_rwset;
}

function decodeKVReadHash(kVReadHashProto) {
    const kv_read_hash = {};
    kv_read_hash.key_hash = kVReadHashProto.key_hash;
    kv_read_hash.version = decodeVersion(kVReadHashProto.version);

    return kv_read_hash;
}

function decodeKVWriteHash(kVWriteHashProto) {
    const kv_write_hash = {};
    kv_write_hash.key_hash = kVWriteHashProto.key_hash;
    kv_write_hash.is_delete = kVWriteHashProto.is_delete;
    kv_write_hash.value_hash = kVWriteHashProto.value_hash;

    return kv_write_hash;
}

function decodeKVMetadataWriteHash(kVMetadataWriteHashProto) {
    const kv_metadata_write_hash = {};
    kv_metadata_write_hash.key_hash = kVMetadataWriteHashProto.key_hash;
    kv_metadata_write_hash.entries = [];
    for (const kVMetadataEntryProto of kVMetadataWriteHashProto.entries) {
        kv_metadata_write_hash.entries.push(decodeKVMetadataEntry(kVMetadataEntryProto));
    }

    return kv_metadata_write_hash;
}

// version numbers should not get that big
// so lets just return an Integer (32bits)
function convertVersion(versionLong) {
    const versionString = versionLong.toString();
    const version = Number.parseInt(versionString);

    return version;
}

function timeStampToDate(timestamp) {
    if (!timestamp) {
        return 'null';
    }
    const millis = timestamp.seconds * 1000 + timestamp.nanos / 1000000;
    const date = new Date(millis);

    return date.toISOString();
}

module.exports = BlockDecoder;