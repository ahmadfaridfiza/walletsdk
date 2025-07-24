import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';
import { Buffer } from 'buffer';

global.Buffer = Buffer;  // Polyfill untuk Browser/Next.js

export default async function handler(req, res) {
  try {
    // Generate 24-word mnemonic
    const mnemonic = await mnemonicNew();

    // Derive Private Key from mnemonic
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    // Create Wallet Contract V4 (standard Tonkeeper wallet)
    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: keyPair.publicKey
    });

    // Get Wallet Address (Non-bounceable format)
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
