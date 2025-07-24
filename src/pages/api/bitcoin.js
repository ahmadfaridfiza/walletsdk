import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';

export default async function handler(req, res) {
  try {
    // Generate Mnemonic and Seed
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Derive BIP32 Root Key
    const root = bitcoin.bip32.fromSeed(seed, bitcoin.networks.bitcoin);

    // Derive Path m/44'/0'/0'/0/0
    const child = root.derivePath("m/44'/0'/0'/0/0");

    if (!child.privateKey) {
      throw new Error('Failed to derive private key.');
    }

    // Generate P2PKH Address (starts with 1...)
    const { address } = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network: bitcoin.networks.bitcoin
    });

    // Get Private Key in WIF format
    const privateKeyWIF = child.toWIF();  // starts with K or L

    res.status(200).json({
      mnemonic,
      privateKey: privateKeyWIF,
      address
    });
  } catch (error) {
    console.error('Bitcoin Wallet Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}
