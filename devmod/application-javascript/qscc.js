const elliptic = require('elliptic');
const { KJUR, KEYUTIL } = require('jsrsasign');
var EC = require('elliptic').ec;

// Create and initialize EC context
// (better do it once and reuse it)
var ec = new EC('secp256k1');

// Generate keys
var key = ec.genKeyPair();

const privateKeyPEM = '-----BEGIN PRIVATE KEY-----\r\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgnq6704+e9STj5HHr\r\n2d98sotJogSMS7XR95NaqjM13OyhRANCAASHCuRttj0Wo4OLY/lfUsim4VwBbBCk\r\ndG3SK298YajAkeaLnAJu45GQbzuXSZLBojcEdfC7rqyveGKCrD16ybb/\r\n-----END PRIVATE KEY-----';
const { prvKeyHex } = KEYUTIL.getKey(privateKeyPEM);


const cer = "-----BEGIN CERTIFICATE-----\nMIIB8zCCAZmgAwIBAgIUG+76VbOkXK5Q/vx1GrPxjAN2Tx0wCgYIKoZIzj0EAwIw\ncDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMQ8wDQYDVQQH\nEwZEdXJoYW0xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\nLm9yZzEuZXhhbXBsZS5jb20wHhcNMjIxMjA5MTI0NjAwWhcNMjMxMjA5MTMwMDAw\nWjAhMQ8wDQYDVQQLEwZjbGllbnQxDjAMBgNVBAMTBWFkbWluMFkwEwYHKoZIzj0C\nAQYIKoZIzj0DAQcDQgAEhwrkbbY9FqODi2P5X1LIpuFcAWwQpHRt0itvfGGowJHm\ni5wCbuORkG87l0mSwaI3BHXwu66sr3higqw9esm2/6NgMF4wDgYDVR0PAQH/BAQD\nAgeAMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFDgbdVR1ruWU+FWTQErOi3siEsiT\nMB8GA1UdIwQYMBaAFLg4xu68i891LOd7fagWx7+pigIxMAoGCCqGSM49BAMCA0gA\nMEUCIQC5LW0RuAh8KfWQe2qO84+lMNX6xURO5ZaEV7JveAmCWwIgC4XDqx2jGzoL\nk0RGTlukn3DnXGnCZDkrWSLaCS2BPkc=\n-----END CERTIFICATE-----";
const {pubKeyHex} = KEYUTIL.getKey(cer);


const data = {"Email":"alice@gmail.com","Gender":"F","ID":"p1","Name":"Alice","Phoneno":"02156874652","Txid":"e1ec3833b48721017f4d23a82bcb8ecaedff2e74b8298bb4904ca5f8591e99c5"}

// initialize
//var sigValue = sig.sign()
//console.log(sigValue)


/*let signdata = require('./data/payload.txt').toBuffer();

var sig2 = new KJUR.crypto.Signature({ "alg": "SHA256withECDSA" });
sig2.init(cer);

sig2.updateString(data)
var isValid = sig2.verify(signdata)
console.log(isValid)*/

const crypto = require('crypto');

const sign = crypto.createSign('SHA256');
var usr ="aaa"
sign.update(usr);
sign.end();
const signature = sign.sign(privateKeyPEM);
console.log("signature");
console.log(signature.toString('hex'));

const verify = crypto.createVerify('SHA256');
verify.update(usr);
verify.end();
const veritifation = verify.verify(cer, signature);
console.log(veritifation)