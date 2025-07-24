
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { bech32m } from 'bech32';
import { getPublicKey, utils } from '@noble/secp256k1';

export default async function handler(req, res) {
  try {
    const { mnemonic } = req.body;
    if (!mnemonic || !bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }

    const seed = await bip39.mnemonicToSeed(mnemonic);
    const network = bitcoin.networks.bitcoin;
    const root = bitcoin.bip32.fromSeed(seed, network);

    const path = "m/86'/0'/0'/0/0";
    const child = root.derivePath(path);

    if (!child.privateKey) throw new Error('Failed to derive private key.');

    // Get x-only public key
    const pubkey = getPublicKey(child.privateKey, true);
    const xOnlyPubkey = pubkey.slice(1);

    // Compute tweak (SHA256 of xOnlyPubkey)
    const tweakHash = await utils.sha256(xOnlyPubkey);
    const tweakBN = BigInt('0x' + Buffer.from(tweakHash).toString('hex'));
    const privKeyBN = BigInt('0x' + child.privateKey.toString('hex'));

    // secp256k1 curve order n
    const n = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

    // Tweak private key
    const tweakedPrivKey = (privKeyBN + tweakBN) % n;
    const tweakedPrivKeyHex = tweakedPrivKey.toString(16).padStart(64, '0');

    // Get tweaked public key (x-only)
    const tweakedPubkey = getPublicKey(tweakedPrivKeyHex, true).slice(1);

    // Encode Taproot address (bc1p...)
    const words = bech32m.toWords(Buffer.concat([Buffer.from([0x01]), Buffer.from(tweakedPubkey)]));
    const address = bech32m.encode('bc', words);

    res.status(200).json({
      mnemonic,
      path,
      address,
      tweakedPrivateKey: tweakedPrivKeyHex
    });
  } catch (error) {
    console.error('BIP86 Restore Error:', error);
    res.status(500).json({ error: error.message });
  }
}
