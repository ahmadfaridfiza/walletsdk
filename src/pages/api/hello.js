import { Account, derivePath } from "@aptos-labs/ts-sdk";
const bip39 = require('bip39');

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);

    // Derive seed from mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Aptos derivation path
    const derivationPath = "m/44'/637'/0'/0'/0'";
    const { key } = derivePath(derivationPath, seed.toString('hex'));

    // Create Account
    const account = Account.fromDerivePath(mnemonic, derivationPath);

    // Extract PrivateKey (first 64 chars of secretKey)
    const privateKeyHex = Buffer.from(account.signingKey.secretKey).toString('hex').slice(0, 64);

    // Return JSON Response
    res.status(200).json({
      mnemonic,
      address: account.accountAddress.toString(),
      privateKey: privateKeyHex
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
