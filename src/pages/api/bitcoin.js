// pages/api/derive-from-xpub.js
import { addressFromExtPubKey, Purpose } from '@swan-bitcoin/xpub-lib';

export default async function handler(req, res) {
  try {
    const { extPubKey } = req.query;
    if (!extPubKey) {
      return res.status(400).json({ error: 'extPubKey query parameter is required' });
    }

    // Derive default (Bech32 native SegWit, BIP84)
    const bech32 = await addressFromExtPubKey({ extPubKey, network: 'mainnet' });
    // Derive Legacy (P2PKH, BIP44)
    const p2pkh = await addressFromExtPubKey({ extPubKey, network: 'mainnet', purpose: Purpose.P2PKH });
    // Derive P2SH-SegWit (BIP49)
    const p2sh = await addressFromExtPubKey({ extPubKey, network: 'mainnet', purpose: Purpose.P2SH });
    // Derive Taproot (BIP86)
    const taproot = await addressFromExtPubKey({ extPubKey, network: 'mainnet', purpose: Purpose.P2TR });

    res.status(200).json({ bech32, p2pkh, p2sh, taproot });
  } catch (error) {
    console.error('Derivation error:', error);
    res.status(500).json({ error: error.message });
  }
}
