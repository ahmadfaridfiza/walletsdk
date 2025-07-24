import * as bip39 from 'bip39';
import hdkey from 'ethereumjs-wallet/hdkey';
import { ethers } from 'ethers';

export default async function handler(req, res) {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // EVM Path (BIP44 for Ethereum): m/44'/60'/0'/0/0
    const hdWallet = hdkey.fromMasterSeed(seed);
    const key = hdWallet.derivePath("m/44'/60'/0'/0/0");

    const wallet = key.getWallet();
    const privateKey = wallet.getPrivateKeyString(); // 0x...
    const address = wallet.getAddressString();       // 0x...

    res.status(200).json({
      mnemonic,
      privateKey,
      address
    });
  } catch (error) {
    console.error('EVM Wallet Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}
