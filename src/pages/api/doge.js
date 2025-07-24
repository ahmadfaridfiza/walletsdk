import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import wif from 'wif';  // ADD THIS

const dogecoinNetwork = {
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bip32: {
    public: 0x02facafd,
    private: 0x02fac398,
  },
  pubKeyHash: 0x1e,
  scriptHash: 0x16,
  wif: 0x9e  // Important
};

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    const root = bitcoin.bip32.fromSeed(seed);
    const child = root.derivePath("m/44'/3'/0'/0/0");

    // Address generation (compressed publicKey)
    const { address } = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network: dogecoinNetwork
    });

    // MANUALLY ENCODE UNCOMPRESSED PRIVATE KEY (TokenPocket Compatible)
    const privateKeyBuffer = child.privateKey;
    const wifKey = wif.encode(dogecoinNetwork.wif, privateKeyBuffer, false);  // false = uncompressed

    res.status(200).json({
      mnemonic,
      privateKey: wifKey,
      address
    });
  } catch (error) {
    console.error('Dogecoin Wallet Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}
