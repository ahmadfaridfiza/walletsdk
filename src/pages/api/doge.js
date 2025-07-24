const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { BIP32Factory } = require('bip32');
const bip32 = BIP32Factory(ecc);

const dogecoinNetwork = {
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bech32: null, // Dogecoin does not use bech32
  bip32: {
    public: 0x02facafd,
    private: 0x02fac398,
  },
  pubKeyHash: 0x1e,  // Addresses start with 'D'
  scriptHash: 0x16,  // Addresses starting with '9'
  wif: 0x9e          // WIF starting with '6'
};

export default async function handler(req, res) {
  try {
    const strength = 128; // 12-word mnemonic
    const mnemonic = bip39.generateMnemonic(strength);

    // Convert mnemonic to seed buffer
    const seedBuffer = bip39.mnemonicToSeedSync(mnemonic);

    // Derive root node from seed (no need to pass network)
    const rootNode = bip32.fromSeed(seedBuffer);

    // Derive address path (Dogecoin BIP44 path: m/44'/3'/0'/0/0)
    const addressNode = rootNode.derivePath("m/44'/3'/0'/0/0");

    // Generate Dogecoin address (P2PKH)
    const { address } = bitcoin.payments.p2pkh({
      pubkey: addressNode.publicKey,
      network: dogecoinNetwork,
    });

    // Generate WIF Private Key
    const wif = addressNode.toWIF();

    res.status(200).json({
      mnemonic,
      privateKey: wif,
      address
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
