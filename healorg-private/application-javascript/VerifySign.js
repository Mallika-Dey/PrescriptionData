'use strict';

const fabproto6 = require('fabric-protos');
const utils = require('./node_modules/fabric-common/lib/Utils');

const logger = utils.getLogger('BlockDecoder.js');

class VerifySign {

    static verifysign(blockBuf) {
        logger.debug('decode - start');

        if (!blockBuf || !(blockBuf instanceof Buffer)) {
            throw new Error('Block input data is not a byte buffer');
        }
        const block = {};
        try {
            const blockProto = fabproto6.common.Block.decode(blockBuf);
            block.data = decodeBlockData(blockProto.data);
        } catch (error) {
            logger.error('decode - ::' + (error.stack ? error.stack : error));
            throw error;
        }

        logger.debug('decode - end');
        return block;
    }
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


function decodeBlockDataEnvelope(envelopeProto) {
    const envelope = {};
    envelope.signature = envelopeProto.signature;
    envelope.payload = envelopeProto.payload;
    return envelope;
}

module.exports=VerifySign;