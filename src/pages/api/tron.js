import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import { ec as EC } from 'elliptic';
import bs58check from 'bs58check';

const ec = new EC('secp256k1');

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Derive BIP32 Root Key
    const root = bip32.fromSeed(seed);

    // Derive Tron Path m/44'/195'/0'/0/0
    const child = root.derivePath("m/44'/195'/0'/0/0");

    if (!child.privateKey) {
      throw new Error('Failed to derive private key.');
    }

    const keyPair = ec.keyFromPrivate(child.privateKey);

    // Get Public Key in Uncompressed Format
    const publicKey = keyPair.getPublic(false, 'hex').slice(2);

    // Tron Address = Keccak256(publicKey) → Take last 20 bytes → Add 0x41 prefix → Base58Check Encode
    const keccak256 = (await import('keccak')).default;
    const hash = keccak256('keccak256').update(Buffer.from(publicKey, 'hex')).digest();

    const tronAddressHex = Buffer.concat([Buffer.from('41', 'hex'), hash.slice(-20)]);
    const tronAddressBase58 = bs58check.encode(tronAddressHex);

    const privateKeyHex = child.privateKey.toString('hex');  // HEX format for TokenPocket Import

    res.status(200).json({
      mnemonic,
      privateKey: privateKeyHex,
      address: tronAddressBase58
    });
  } catch (error) {
    console.error('TRON Wallet Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}
