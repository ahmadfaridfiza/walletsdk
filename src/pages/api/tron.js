import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { ec as EC } from 'elliptic';
import bs58check from 'bs58check';

export default async function handler(req, res) {
  try {
    const keccakModule = await import('keccak');
    const keccak256 = keccakModule.default;

    // Generate mnemonic & seed
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Use bitcoinjs-lib's BIP32
    const root = bitcoin.bip32.fromSeed(seed);

    // Derive Tron path m/44'/195'/0'/0/0
    const child = root.derivePath("m/44'/195'/0'/0/0");
    if (!child.privateKey) throw new Error('Failed to derive private key.');

    // Derive public key
    const ec = new EC('secp256k1');
    const keyPair = ec.keyFromPrivate(child.privateKey);
    const publicKey = keyPair.getPublic(false, 'hex').slice(2); // uncompressed

    // Keccak hash & Tron address
    const hash = keccak256('keccak256').update(Buffer.from(publicKey, 'hex')).digest();
    const tronAddressHex = Buffer.concat([Buffer.from('41', 'hex'), hash.slice(-20)]);
    const address = bs58check.encode(tronAddressHex);

    // Private key hex
    const privateKeyHex = child.privateKey.toString('hex');

    return res.status(200).json({
      mnemonic,
      privateKey: privateKeyHex,
      address
    });
  } catch (error) {
    console.error('TRON Wallet Generation Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
