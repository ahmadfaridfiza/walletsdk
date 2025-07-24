import * as bip39 from 'bip39';
import { generatePrivateKey, getAddressFromPrivateKey } from 'lucid-cardano';

export default async function handler(req, res) {
  try {
    // Generate 24-word mnemonic
    const mnemonic = bip39.generateMnemonic(256);

    // Generate Private Key from Mnemonic
    const privateKey = await generatePrivateKey(mnemonic);

    // Get Address from Private Key (Mainnet)
    const address = await getAddressFromPrivateKey(privateKey, 'Mainnet');

    res.status(200).json({
      mnemonic,
      privateKey,
      address
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
