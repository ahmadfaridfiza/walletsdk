// pages/api/derive-from-xpub.js
import { addressFromExtPubKey, Purpose } from '@swan-bitcoin/xpub-lib';

export default async function handler(req, res) {
  try {
    const key = "xpub6EuV33a2DXxAhoJTRTnr8qnysu81AA4YHpLY6o8NiGkEJ8KADJ35T64eJsStWsmRf1xXkEANVjXFXnaUKbRtFwuSPCLfDdZwYNZToh4LBCd";

    // Derive default (Bech32 native SegWit, BIP84)
    const bech32 = await addressFromExtPubKey({ extPubKey: key, network: 'mainnet' });
    // Derive Legacy (P2PKH, BIP44)
    const p2pkh = await addressFromExtPubKey({ extPubKey: key, network: 'mainnet', purpose: Purpose.P2PKH });
    // Derive P2SH-SegWit (BIP49)
    const p2sh = await addressFromExtPubKey({ extPubKey: key, network: 'mainnet', purpose: Purpose.P2SH });
    // Derive Taproot (BIP86)
    const ecc = require('@noble/secp256k1')
    initEccLib(ecc)
    const taproot = await addressFromExtPubKey({ extPubKey: key, network: 'mainnet', purpose: Purpose.P2TR });

    res.status(200).json({ bech32, p2pkh, p2sh, taproot });
  } catch (error) {
    console.error('Derivation error:', error);
    res.status(500).json({ error: error.message });
  }
}
