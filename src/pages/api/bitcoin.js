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

    // Get x-only public key
    const pubkey = getPublicKey(child.privateKey, true);
    const xOnlyPubkey = pubkey.slice(1); // 32 bytes

    // Compute tweak (SHA256 of xOnlyPubkey)
    const tweakHash = await utils.sha256(xOnlyPubkey);
    const tweakBN = BigInt('0x' + Buffer.from(tweakHash).toString('hex'));
    const privKeyBN = BigInt('0x' + child.privateKey.toString('hex'));

    const n = schnorr.CURVE.n;
    const tweakedPrivKey = (privKeyBN + tweakBN) % n;

    const tweakedPrivKeyBytes = tweakedPrivKey.toString(16).padStart(64, '0');
    const tweakedPubkey = getPublicKey(tweakedPrivKeyBytes, true).slice(1);

    // Encode Taproot address (bc1p...)
    const words = bech32m.toWords(Buffer.concat([Buffer.from([0x01]), Buffer.from(tweakedPubkey)]));
    const address = bech32m.encode('bc', words);

    res.status(200).json({
      mnemonic,
      path,
      address,
      privateKey: child.toWIF()
    });
  } catch (error) {
    console.error('Taproot BIP86 Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}
