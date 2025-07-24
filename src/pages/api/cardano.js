import { Lucid } from 'lucid-cardano';
import * as bip39 from 'bip39';
import { Blockfrost } from 'lucid-cardano';

export default async function handler(req, res) {
  try {
    // Setup provider (Blockfrost dummy — kita tidak query ke chain)
    const lucid = await Lucid.new(
      new Blockfrost('https://cardano-mainnet.blockfrost.io/api/v0', '<YOUR_BLOCKFROST_KEY>'),
      'Mainnet'
    );

    // Generate 24-word mnemonic
    const mnemonic = bip39.generateMnemonic(256);

    // Derive private key and address
    const { payment } = lucid.utils.seedToKey(mnemonic);
    const address = await lucid.utils.deriveAddress(payment, 'Mainnet');

    res.status(200).json({
      mnemonic,
      privateKey: payment,
      address
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
