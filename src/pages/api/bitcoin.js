import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { bech32m } from 'bech32';
import { utils, getPublicKey, schnorr } from '@noble/secp256k1';

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    const network = bitcoin.networks.bitcoin;
    const root = bitcoin.bip32.fromSeed(seed, network);

    const path = "m/86'/0'/0'/0/0";
    const child = root.derivePath(path);

    if (!child.privateKey) throw new Error('Failed to derive private key.');

    // Get x-only public key (32 bytes)
    const xOnlyPubkey = getPublicKey(child.privateKey, true).slice(1);

    // Tweak the xOnlyPubkey: tweakedKey = xOnlyPubkey + H(P)
    const tweakedKey = schnorr.tapTweakPrivateKey(child.privateKey);

    // Derive tweaked public key
    const tweakedPubkey = getPublicKey(tweakedKey, true).slice(1);

    // Encode bc1p address
    const words = bech32m.toWords(Buffer.concat([Buffer.from([0x01]), Buffer.from(tweakedPubkey)]));
    const address = bech32m.encode('bc', words);

    res.status(200).json({
      mnemonic,
      path,
      address, // <-- This will be bc1p...
      privateKey: child.toWIF()
    });
  } catch (error) {
    console.error('Taproot BIP86 Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}
