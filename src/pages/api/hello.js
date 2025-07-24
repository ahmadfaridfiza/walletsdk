import { Account, Aptos, AptosConfig, Network, SigningSchemeInput } from "@aptos-labs/ts-sdk";

export default async function handler(req, res) {
  try {
    const privateKey = new Ed25519PrivateKey("myEd25519privatekeystring");

const aptos = new Aptos();
const account = await aptos.deriveAccountFromPrivateKey({ privateKey });

    // Return JSON Response
    res.status(200).json({
      address: account.toString(),
      privateKey: privateKey
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}