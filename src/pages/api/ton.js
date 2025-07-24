import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV3 } from '@ton/ton';
import { Buffer } from 'buffer';

global.Buffer = Buffer;  // Polyfill

export default async function handler(req, res) {
  try {
    const mnemonicArray = await mnemonicNew();
    const mnemonic = mnemonicArray.join(' ');

    const keyPair = await mnemonicToPrivateKey(mnemonicArray);

    // Generate WalletContractV3 (Default Wallet Type)
    const wallet = WalletContractV3.create({
      workchain: 0,
      publicKey: keyPair.publicKey
    });

    const address = wallet.address.toString({ bounceable: false });
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
