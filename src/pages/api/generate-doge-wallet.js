import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import ecc from 'tiny-secp256k1';
import { payments } from '@dogiwallet/dogecoinjs-lib';

const bip32 = BIP32Factory(ecc);

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);       // 12 kata
    const seed = await bip39.mnemonicToSeed(mnemonic);  // seed BIP39

    const root = bip32.fromSeed(seed, bitcoin.networks.dogecoin);  // DNS network Doge

    // Standard derivation m/44'/3'/0'/0/0 untuk Dogecoin :contentReference[oaicite:5]{index=5}
    const path = "m/44'/3'/0'/0/0";
    const child = root.derivePath(path);

    // Private key WIF
    const wif = child.toWIF();

    // Dogecoin P2PKH address
    const { address } = payments.p2pkh({
      pubkey: child.publicKey,
      network: bitcoin.networks.dogecoin
    });

    res.status(200).json({
      mnemonic,
      derivationPath: path,
      address,
      wif
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
