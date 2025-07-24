import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';

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
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Use BIP32 HDNode from bitcoinjs-lib (no tiny-secp256k1)
    const root = bitcoin.bip32.fromSeed(seed);

    // Derive Dogecoin BIP44 path m/44'/3'/0'/0/0
    const child = root.derivePath("m/44'/3'/0'/0/0");

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
    console.error('Dogecoin Wallet Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}
