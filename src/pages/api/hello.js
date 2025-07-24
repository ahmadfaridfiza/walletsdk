import { Account } from "@aptos-labs/ts-sdk";
import * as bip39 from "bip39";

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const derivationPath = "m/44'/637'/0'/0'/0'";

    const account = Account.fromDerivationPath({
      mnemonic,
      path: derivationPath,
    });

    const privateKeyHex = Buffer
      .from(account.signingKey.secretKey)
      .toString("hex")
      .slice(0, 64);

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
