import { Account } from "@aptos-labs/ts-sdk";
import bip39 from 'bip39';

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);

    // Aptos derivation path
    const derivationPath = "m/44'/637'/0'/0'/0'";

    // Directly create Account from mnemonic + derivation path
    const account = Account.fromDerivePath(mnemonic, derivationPath);

    // Extract Private Key (first 64 chars of secretKey)
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
