import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';

const litecoinNetwork = {
      messagePrefix: '\x19Litecoin Signed Message:\n',
      bech32: 'ltc',
      bip32: {
        public: 0x019da462,
        private: 0x019d9cfe,
      },
      pubKeyHash: 0x30, // Addresses start with 'L'
      scriptHash: 0x32,  // Addresses start with 'M' (BIP49 P2SH)
      wif: 0xb0,
    };


export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Use BIP32 HDNode from bitcoinjs-lib (no tiny-secp256k1)
    const root = bitcoin.bip32.fromSeed(seed);

    // Derive Dogecoin BIP44 path m/44'/3'/0'/0/0
    const child = root.derivePath("m/44'/2'/0'/0/0");

    const { address } = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network: litecoinNetwork
    });

    const privateKeyWIF = child.toWIF();

    res.status(200).json({
      mnemonic,
      privateKey: privateKeyWIF,
      address
    });
  } catch (error) {
    console.error('Dogecoin Wallet Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}
