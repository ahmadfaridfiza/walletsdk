import * as bip39 from 'bip39';
import CardanoWasm from '@emurgo/cardano-serialization-lib-browser';

export default async function handler(req, res) {
  try {
    // Generate 24-word mnemonic
    const mnemonic = bip39.generateMnemonic(256);

    // Convert mnemonic to entropy/seed
    const entropy = await bip39.mnemonicToEntropy(mnemonic);

    // Derive Root Key
    const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
      Buffer.from(entropy, 'hex'),
      Buffer.from('')
    );

    // Derive Account Key (m/1852'/1815'/0')
    const accountKey = rootKey
      .derive(1852 | 0x80000000)
      .derive(1815 | 0x80000000)
      .derive(0 | 0x80000000);

    // Derive External Address Key (m/1852'/1815'/0'/0/0)
    const externalKey = accountKey.derive(0).derive(0);

    // Get Private Key Hex
    const privateKeyHex = Buffer.from(externalKey.to_raw_key().as_bytes()).toString('hex');

    // Get Public Key Raw Key Hash
    const publicKeyRaw = externalKey.to_public().to_raw_key();
    const keyHash = publicKeyRaw.hash();

    // Create StakeCredential from KeyHash
    const stakeCredential = CardanoWasm.StakeCredential.from_keyhash(keyHash);

    // Create Base Address (Mainnet)
    const baseAddr = CardanoWasm.BaseAddress.new(
      0, // Mainnet = 0
      stakeCredential,
      stakeCredential
    );

    const address = baseAddr.to_address().to_bech32();

    res.status(200).json({
      mnemonic,
      privateKey: privateKeyHex,
      address
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
