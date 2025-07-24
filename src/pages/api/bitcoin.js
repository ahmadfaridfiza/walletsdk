
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { bech32m } from 'bech32';
import * as crypto from 'crypto';

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    const network = bitcoin.networks.bitcoin;
    const root = bitcoin.bip32.fromSeed(seed, network);

    const deriveLegacyAddress = (path) => {
      const child = root.derivePath(path);
      const payment = bitcoin.payments.p2pkh({ pubkey: child.publicKey, network });
      return {
        path,
        address: payment.address,
        privateKey: child.toWIF()
      };
    };

    const deriveSegwitP2SH = (path) => {
      const child = root.derivePath(path);
      const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network });
      const payment = bitcoin.payments.p2sh({ redeem: p2wpkh, network });
      return {
        path,
        address: payment.address,
        privateKey: child.toWIF()
      };
    };

    const deriveNativeSegwit = (path) => {
      const child = root.derivePath(path);
      const payment = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network });
      return {
        path,
        address: payment.address,
        privateKey: child.toWIF()
      };
    };

    const deriveTaproot = (path) => {
      const child = root.derivePath(path);
      const xOnlyPubkey = child.publicKey.slice(1, 33);
      const tweakHash = crypto.createHash('sha256').update(xOnlyPubkey).digest();

      let tweakedPubkey = Buffer.from(xOnlyPubkey);
      for (let i = 0; i < 32; i++) {
        tweakedPubkey[i] = (tweakedPubkey[i] + tweakHash[i]) % 256;
      }

      const words = bech32m.toWords(Buffer.concat([Buffer.from([0x01]), tweakedPubkey]));
      const address = bech32m.encode('bc', words);

      return {
        path,
        address,
        privateKey: child.toWIF()
      };
    };

    const bip44 = deriveLegacyAddress("m/44'/0'/0'/0/0");
    const bip49 = deriveSegwitP2SH("m/49'/0'/0'/0/0");
    const bip84 = deriveNativeSegwit("m/84'/0'/0'/0/0");
    const bip86 = deriveTaproot("m/86'/0'/0'/0/0");

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

