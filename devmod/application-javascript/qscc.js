const elliptic = require('elliptic');
const { KEYUTIL } = require('jsrsasign');
var EC = require('elliptic').ec;

// Create and initialize EC context
// (better do it once and reuse it)
var ec = new EC('secp256k1');

// Generate keys
var key = ec.genKeyPair();

const privateKeyPEM = '-----BEGIN PRIVATE KEY-----\r\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgNcHL2g3b5Hls16g9\r\nzYej6teRBX7Inyj/8PP7vRdlRsqhRANCAASiRTsmswq2noGVHCL1E9+ULzdfOD4J\r\nCZHHZ42NkdSnxFAzDRRG2Kc00z9IqWV1hGTbNctbZ6TDHry4kN+hPmeh\r\n-----END PRIVATE KEY-----';
const { prvKeyHex } = KEYUTIL.getKey(privateKeyPEM);
const pubkey = '04a2453b26b30ab69e81951c22f513df942f375f383e090991c7678d8d91d4a7c450330d1446d8a734d33f48a965758464db35cb5b67a4c31ebcb890dfa13e67a1' 

console.log(prvKeyHex);
var sig = "3045022100b7df4888094fc53f55c222c6081e5e1eeb2b6e4bd9e28abfc9ee56792799187a0220174cef8ce6c25cc9eb25f03e417cc86dbb897c97f1d2577e5afe86927497ddf8"

console.log(key.verify(sig, pubkey));