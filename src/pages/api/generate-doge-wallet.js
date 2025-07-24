import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

// Define Dogecoin Network Parameters
const dogecoinNetwork = {
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bech32: null,
  bip32: {
    public: 0x02facafd,
    private: 0x02fac398
  },
  pubKeyHash: 0x1e,  // Address Prefix 'D'
  scriptHash: 0x16,
  wif: 0x9e
};

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const root = bip32.fromSeed(seed, dogecoinNetwork);

    const path = "m/44'/3'/0'/0/0";  // Dogecoin BIP44 path
    const child = root.derivePath(path);

    const { address } = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network: dogecoinNetwork
    });

    const wif = child.toWIF();

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
