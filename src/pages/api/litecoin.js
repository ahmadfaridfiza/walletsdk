import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import * as litecoinjs from 'litecoinjs-lib'; // Optional if using litecoinjs-lib
import ecc from '@bitcoinerlab/secp256k1';
import { addressFromExtPubKey, Purpose, initEccLib } from '@swan-bitcoin/xpub-lib';

export default async function handler(req, res) {
  try {
    initEccLib(ecc); // Initialize ECC early (needed for Taproot, optional here)

    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Litecoin Network Params
    const litecoinNetwork = {
      messagePrefix: '\x19Litecoin Signed Message:\n',
      bech32: 'ltc',
      bip32: {
        public: 0x019da462,
        private: 0x019d9cfe,
      },
      pubKeyHash: 0x30, // Addresses start with 'L'
      scriptHash: 0x32,  // Addresses start with 'M' (BIP49 P2SH)
      wif: 0xb0,
    };

    const root = bitcoin.bip32.fromSeed(seed, litecoinNetwork);

    const deriveXpub = (path) => root.derivePath(path).neutered().toBase58();

    const xpub44 = deriveXpub("m/44'/2'/0'");
    const xpub49 = deriveXpub("m/49'/2'/0'");
    const xpub84 = deriveXpub("m/84'/2'/0'");

    // Derive addresses using swan-bitcoin/xpub-lib (supports alt networks via 'litecoin')
    const p2pkh = await addressFromExtPubKey({ extPubKey: xpub44, network: 'litecoin', purpose: Purpose.P2PKH });
    const p2sh = await addressFromExtPubKey({ extPubKey: xpub49, network: 'litecoin', purpose: Purpose.P2SH });
    const bech32 = await addressFromExtPubKey({ extPubKey: xpub84, network: 'litecoin', purpose: Purpose.P2WPKH });

    // Derive Private Key WIF from m/84'/2'/0'/0/0 (bech32 address)
    const child = root.derivePath("m/84'/2'/0'/0/0");
    const privateKeyWIF = child.toWIF();

    res.status(200).json({
      mnemonic,
      p2pkh,   // Legacy L address
      p2sh,    // SegWit P2SH (M address)
      bech32,  // Native SegWit (ltc1q...)
      privateKey: privateKeyWIF
    });

  } catch (error) {
    console.error('Litecoin Derivation Error:', error);
    res.status(500).json({ error: error.message });
  }
}
