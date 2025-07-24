import { Account, Aptos, AptosConfig, Network, SigningSchemeInput } from "@aptos-labs/ts-sdk";

export default async function handler(req, res) {
  try {
    // Setup Aptos Client (MAINNET)
    const config = new AptosConfig({ network: Network.MAINNET });
    const aptos = new Aptos(config);

    // Generate Account (Ed25519 Legacy, no mnemonic)
    const account = Account.generate({
      scheme: SigningSchemeInput.Ed25519,
      legacy: true
    });

    // You CANNOT fund MAINNET accounts via faucet
    // User must deposit manually from exchange or another wallet

    // Return JSON Response
    res.status(200).json({
      address: account.accountAddress.toString(),
      privateKey: account.privateKeyHex
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}