import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const derivationPath = "m/44'/501'/0'/0'";

    const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
    const keypair = Keypair.fromSeed(derivedSeed);

    // Export 64-byte SecretKey in Base58 (Phantom import-compatible)
    const privateKeyBase58 = bs58.encode(keypair.secretKey);

    // Alternatively, JSON Array format
    const privateKeyJSON = Array.from(keypair.secretKey);

    const address = keypair.publicKey.toBase58();

    res.status(200).json({
      mnemonic,
      address,
      privateKeyBase58,
      privateKeyJSON
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
