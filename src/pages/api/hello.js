export const config = {
  runtime: 'nodejs'
};

import { Account, deriveAccount } from "@aptos-labs/ts-sdk";
import bip39 from "bip39";

export default async function handler(req, res) {
  const mnemonic = bip39.generateMnemonic();

  // Derive Account using Aptos official SDK derivation path m/44'/637'/0'/0'/0'
  const account = await deriveAccount({
    mnemonic,
    derivationPath: "m/44'/637'/0'/0'/0'"
  });

  res.status(200).json({
    mnemonic,
    privateKey: account.privateKeyHex,
    address: account.accountAddress.toString()
  });
}
