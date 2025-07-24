import { Account } from "@aptos-labs/ts-sdk";
import * as bip39 from "bip39";

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const derivationPath = "m/44'/637'/0'/0'/0'";

    // Derive Account from Mnemonic & Path
    const account = Account.fromDerivationPath({
      mnemonic,
      path: derivationPath,
    });

    // Get Private Key (HEX)
    const privateKeyHex = account.privateKey.toString();

    // Get Public Address
    const address = account.accountAddress.toString();

    res.status(200).json({
      mnemonic,
      privateKey: privateKeyHex,
      address
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
