import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import ecc from '@bitcoinerlab/secp256k1';
import { addressFromExtPubKey, Purpose, initEccLib } from '@swan-bitcoin/xpub-lib';


export default async function handler(req, res) {
  try {
    initEccLib(ecc);
    
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    const network = bitcoin.networks.bitcoin;
    const root = bitcoin.bip32.fromSeed(seed, network);

    const child = root.derivePath("m/86'/0'/0'/0/0");

    const privateKeyWIF = child.toWIF();

    // 2. Derive XPUBs for BIP44, BIP49, BIP84, BIP86
    const getXpub = (path) => {
      const node = root.derivePath(path);
      return node.neutered().toBase58();
    };

    const xpub44 = getXpub("m/44'/0'/0'");
    const xpub49 = getXpub("m/49'/0'/0'");
    const xpub84 = getXpub("m/84'/0'/0'");
    const xpub86 = getXpub("m/86'/0'/0'");

    // Derive default (Bech32 native SegWit, BIP84)
    const bech32 = await addressFromExtPubKey({ extPubKey: xpub84, network: 'mainnet' });
    // Derive Legacy (P2PKH, BIP44)
    const p2pkh = await addressFromExtPubKey({ extPubKey: xpub44, network: 'mainnet', purpose: Purpose.P2PKH });
    // Derive P2SH-SegWit (BIP49)
    const p2sh = await addressFromExtPubKey({ extPubKey: xpub49, network: 'mainnet', purpose: Purpose.P2SH });
    // Derive Taproot (BIP86)
    
    const taproot = await addressFromExtPubKey({ extPubKey: xpub86, network: 'mainnet', purpose: Purpose.P2TR });

    res.status(200).json({ mnemonic, bech32, p2pkh, p2sh, taproot, privateKey: privateKeyWIF, });
  } catch (error) {
    console.error('Derivation error:', error);
    res.status(500).json({ error: error.message });
  }
}
