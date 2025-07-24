import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';

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


export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    const root = bitcoin.bip32.fromSeed(seed, litecoinNetwork);

    const deriveAddress = (path, type) => {
      const child = root.derivePath(path);
    let payment;
      if (type === 'BIP44') {
        payment = bitcoin.payments.p2pkh({ pubkey: child.publicKey, network: litecoinNetwork });
      } else if (type === 'BIP49') {
        const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network: litecoinNetwork });
        payment = bitcoin.payments.p2sh({ redeem: p2wpkh, network: litecoinNetwork });
      } else if (type === 'BIP84') {
        payment = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network: litecoinNetwork });
      }

      return {
        path,
        address: payment.address,
        privateKey: child.toWIF()
      };
    };

    const bip44 = deriveAddress("m/44'/2'/0'/0/0", 'BIP44');
    const bip49 = deriveAddress("m/49'/2'/0'/0/0", 'BIP49');
    const bip84 = deriveAddress("m/84'/2'/0'/0/0", 'BIP84');

    const privateKeyWIF = child.toWIF();

    res.status(200).json({
      mnemonic,
      privateKey: privateKeyWIF,
      bip44,
      bip49,
      bip84
    });
  } catch (error) {
    console.error('Litecoin Wallet Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}
