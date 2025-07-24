import { mnemonicNew, mnemonicToPrivateKey, WalletContractV4 } from '@ton/ton';
import * as bip39 from 'bip39';

export default async function handler(req, res) {
  try {
    // Generate 24-word mnemonic
    const mnemonic = await mnemonicNew(24);

    // Derive key pair from mnemonic
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    // Generate Wallet V4 (standard Tonkeeper wallet)
    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: keyPair.publicKey
    });

    // Get address string (bounceable = false for external wallets)
    const address = wallet.address.toString({ bounceable: false });

    // Private Key (Hex)
    const privateKeyHex = Buffer.from(keyPair.secretKey).toString('hex');

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
