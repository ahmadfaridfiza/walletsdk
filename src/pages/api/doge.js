const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const {BIP32Factory} = require('bip32');
const bip32 = BIP32Factory(ecc);
const strength = 128; // Strength in bits, 128 bits results in a 12-word phrase
const mnemonic = bip39.generateMnemonic(strength);


export default async function handler(req, res) {
  try {
    const seedPhrase = mnemonic;

const seedBuffer = bip39.mnemonicToSeedSync(seedPhrase);

const rootNode = bip32.fromSeed(seedBuffer, bitcoin.networks.dogecoin);

// Derive an address from the HD wallet
const addressNode = rootNode.derivePath("m/44'/3'/0'/0/0");
const publicKey = addressNode.publicKey;

const dogecoinNetwork = {
	messagePrefix: '\x19Dogecoin Signed Message:\n',
	bip32: {
		public: 0x02facafd, // This value corresponds to the public key prefix for Dogecoin
		private: 0x02fac398, // This value corresponds to the private key prefix for Dogecoin
	},
	pubKeyHash: 0x1e, // This value corresponds to the public key hash prefix for Dogecoin (30 in decimal)
	scriptHash: 0x16, // This value corresponds to the script hash prefix for Dogecoin (22 in decimal)
	wif: 0x9e, // This value corresponds to the WIF prefix for Dogecoin (158 in decimal)
};

const dogecoinAddress = bitcoin.payments.p2pkh({
	pubkey: publicKey,
	network: dogecoinNetwork,
});

    res.status(200).json({
      dogecoinAddress
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
