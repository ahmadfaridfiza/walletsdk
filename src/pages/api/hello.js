
import { Account, Aptos, AptosConfig, Network, SigningSchemeInput } from "@aptos-labs/ts-sdk";

export default async function handler(req, res) {
  try {
    // Setup Aptos Client (Devnet)
    const config = new AptosConfig({ network: Network.DEVNET });
    const aptos = new Aptos(config);

    // Generate Account (Ed25519 Legacy, no mnemonic)
    const account = Account.generate({
      scheme: SigningSchemeInput.Ed25519,
      legacy: true
    });

    // Fund Account via Faucet
    await aptos.fundAccount({
      accountAddress: account.accountAddress,
      amount: 100_000_000 // 100 APT
    });

    // Return JSON Response
    res.status(200).json({
      address: account.accountAddress.toString(),
      privateKey: account.privateKeyHex
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
