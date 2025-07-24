import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { bech32m } from 'bech32';

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
      if (type === 'BIP44') {
        payment = bitcoin.payments.p2pkh({ pubkey: child.publicKey, network });
      } else if (type === 'BIP49') {
        const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network });
        payment = bitcoin.payments.p2sh({ redeem: p2wpkh, network });
      } else if (type === 'BIP84') {
        payment = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network });
      } else if (type === 'BIP86') {
        const xOnlyPubkey = child.publicKey.slice(1, 33); // remove 0x02/0x03
        const taprootScript = Buffer.concat([Buffer.from([0x01]), xOnlyPubkey]);
        const words = bech32m.toWords(taprootScript);
        const address = bech32m.encode('bc', words);
        return {
          path,
          address,
          privateKey: child.toWIF()
        };
      } else {
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
    const bip86 = deriveAddress("m/86'/0'/0'/0/0", 'BIP86');

    res.status(200).json({
      mnemonic,
      bip44,
      bip49,
      bip84,
      bip86
    });
  } catch (error) {
    console.error('Bitcoin Wallet Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}
