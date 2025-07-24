import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';
import { Buffer } from 'buffer';

global.Buffer = Buffer;  // Polyfill Next.js

export default async function handler(req, res) {
  try {
    // Generate 24-word mnemonic (array of strings)
    const mnemonicArray = await mnemonicNew();

    // Convert mnemonic array to single string
    const mnemonic = mnemonicArray.join(' ');

    // Derive Key Pair
    const keyPair = await mnemonicToPrivateKey(mnemonicArray);

    // Create Wallet Contract V4
    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: keyPair.publicKey
    });

    // Get Address (non-bounceable)
    const address = wallet.address.toString({ bounceable: false });

    // Private Key Hex
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
