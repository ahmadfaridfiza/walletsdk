// pages/api/generate-xpub.js
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    const network = bitcoin.networks.bitcoin;
    const root = bitcoin.bip32.fromSeed(seed, network);

    const getXpub = (path) => {
      const node = root.derivePath(path);
      return node.neutered().toBase58();
    };

    const bip44Path = "m/44'/0'/0'";
    const bip49Path = "m/49'/0'/0'";
    const bip84Path = "m/84'/0'/0'";
    const bip86Path = "m/86'/0'/0'";

    const xpub44 = getXpub(bip44Path);
    const xpub49 = getXpub(bip49Path);
    const xpub84 = getXpub(bip84Path);
    const xpub86 = getXpub(bip86Path);

    res.status(200).json({
      mnemonic,
      xpub44,
      xpub49,
      xpub84,
      xpub86
    });
  } catch (error) {
    console.error('Generate XPUB Error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Usage: Access endpoint directly to generate mnemonic + xpubs
