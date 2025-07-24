import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    const network = bitcoin.networks.bitcoin;
    const root = bitcoin.bip32.fromSeed(seed, network);

    const deriveAddress = (path, type) => {
      const child = root.derivePath(path);
      if (!child.privateKey) throw new Error(`Failed to derive private key for ${type}`);

      let payment;
      switch (type) {
        case 'BIP44':
          payment = bitcoin.payments.p2pkh({ pubkey: child.publicKey, network });
          break;
        case 'BIP49':
          const p2wpkh49 = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network });
          payment = bitcoin.payments.p2sh({ redeem: p2wpkh49, network });
          break;
        case 'BIP84':
          payment = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network });
          break;
        default:
          throw new Error('Unknown address type');
      }

      return {
        path,
        address: payment.address,
        privateKey: child.toWIF()
      };
    };

    const bip44 = deriveAddress("m/44'/0'/0'/0/0", 'BIP44');
    const bip49 = deriveAddress("m/49'/0'/0'/0/0", 'BIP49');
    const bip84 = deriveAddress("m/84'/0'/0'/0/0", 'BIP84');

    res.status(200).json({
      mnemonic,
      bip44,
      bip49,
      bip84
    });
  } catch (error) {
    console.error('Bitcoin Wallet Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}
