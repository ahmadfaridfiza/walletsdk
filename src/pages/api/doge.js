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
  wif: 0x9e  // WIF prefix for Dogecoin
};

export default async function handler(req, res) {
  try {
    const wifModule = await import('wif');
    const wif = wifModule.default || wifModule;

    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    const root = bitcoin.bip32.fromSeed(seed);
    const child = root.derivePath("m/44'/3'/0'/0/0");

    if (!child.privateKey) {
      throw new Error('Failed to derive private key.');
    }

    // Generate Dogecoin address (compressed true — but TokenPocket only wants uncompressed WIF)
    const { address } = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network: dogecoinNetwork
    });

    // MANUAL ENCODE Uncompressed WIF
    const privateKeyBuffer = child.privateKey;

    // Encode with compressed flag = false
    const wifKey = wif.encode(dogecoinNetwork.wif, privateKeyBuffer, false);

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
