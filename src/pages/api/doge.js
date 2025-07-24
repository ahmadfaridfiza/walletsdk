export default async function handler(req, res) {
  try {
    const bip39 = (await import('bip39')).default;
    const bitcoin = await import('bitcoinjs-lib');
    const ecc = await import('tiny-secp256k1');
    const { BIP32Factory } = await import('bip32');

    const bip32 = BIP32Factory.default(ecc.default);

    const dogecoinNetwork = {
      messagePrefix: '\x19Dogecoin Signed Message:\n',
      bip32: {
        public: 0x02facafd,
        private: 0x02fac398,
      },
      pubKeyHash: 0x1e,
      scriptHash: 0x16,
      wif: 0x9e
    };

    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    const root = bip32.fromSeed(seed);
    const child = root.derivePath("m/44'/3'/0'/0/0");

    const { address } = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network: dogecoinNetwork
    });

    const privateKeyWIF = child.toWIF();

    res.status(200).json({
      mnemonic,
      privateKey: privateKeyWIF,
      address
    });
  } catch (error) {
    console.error('Dogecoin Wallet Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}
