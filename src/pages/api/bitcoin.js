
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { bech32m } from 'bech32';
import * as crypto from 'crypto';

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    const network = bitcoin.networks.bitcoin;
    const root = bitcoin.bip32.fromSeed(seed, network);

    // BIP86 path
    const path = "m/86'/0'/0'/0/0";
    const child = root.derivePath(path);

    if (!child.privateKey) {
      throw new Error('Failed to derive private key.');
    }

    // Get x-only public key
    const publicKey = child.publicKey;
    const xOnlyPubkey = publicKey.slice(1, 33);

    // Tweak = SHA256(xOnlyPubkey)
    const tweakHash = crypto.createHash('sha256').update(xOnlyPubkey).digest();

    // Tweak the xOnlyPubkey (simple add mod n)
    let tweakedPubkey = Buffer.from(xOnlyPubkey);
    for (let i = 0; i < 32; i++) {
      tweakedPubkey[i] = (tweakedPubkey[i] + tweakHash[i]) % 256;
    }

    // Encode Taproot Address (bc1p...)
    const words = bech32m.toWords(Buffer.concat([Buffer.from([0x01]), tweakedPubkey]));
    const address = bech32m.encode('bc', words);

    res.status(200).json({
      mnemonic,
      path,
      address,
      privateKey: child.toWIF()
    });
  } catch (error) {
    console.error('BIP86 Taproot Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}

