import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';

export default async function handler(req, res) {
  try {
    // Generate 12-word mnemonic
    const mnemonic = bip39.generateMnemonic(128);

    // Derive seed from mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Solana Derivation Path (m/44'/501'/0'/0')
    const derivationPath = "m/44'/501'/0'/0'";

    // Derive keypair from seed + path
    const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
    const keypair = Keypair.fromSeed(derivedSeed);

    // Private Key (Base58) - This can be imported into Phantom/TrustWallet
    const privateKeyBase58 = Buffer.from(keypair.secretKey.slice(0, 32)).toString('hex');

    // Public Address
    const address = keypair.publicKey.toBase58();

    res.status(200).json({
      mnemonic,
      privateKey: privateKeyBase58,
      address
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
