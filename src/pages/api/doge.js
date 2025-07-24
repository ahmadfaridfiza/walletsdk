const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { BIP32Factory } = require('bip32');

const bip32 = BIP32Factory(ecc);

const dogecoinNetwork = {
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bip32: {
    public: 0x02facafd,
    private: 0x02fac398,
  },
  pubKeyHash: 0x1e,
  scriptHash: 0x16,
  wif: 0x9e
};

export default async function handler(req, res) {
  try {
    const strength = 128; // 12-word mnemonic
    const mnemonic = bip39.generateMnemonic(strength);

    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Important: bitcoinjs-lib bip32.fromSeed() ignores network here
    const root = bip32.fromSeed(seed);

    // Derive Dogecoin BIP44 path m/44'/3'/0'/0/0
    const child = root.derivePath("m/44'/3'/0'/0/0");

    // Generate Dogecoin address
    const { address } = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network: dogecoinNetwork
    });

    const privateKeyWIF = child.toWIF();

    res.status(200).json({
      mnemonic,
      privateKey: privateKeyWIF,
      address
    });
  } catch (error) {
    console.error('Dogecoin Wallet Error:', error);
    res.status(500).json({ error: error.message });
  }
}
