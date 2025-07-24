import { KeyManagement, ChainHistory } from '@cardano-sdk/wallet';
import { initializeKeyAgent } from '@cardano-sdk/key-management';
import { InMemoryKeyAgent } from '@cardano-sdk/key-management';
import { KeyRole } from '@cardano-sdk/core';
import * as bip39 from 'bip39';

export default async function handler(req, res) {
  try {
    // 1. Generate mnemonic (24 kata)
    const mnemonic = bip39.generateMnemonic(256);

    // 2. Inisialisasi keyAgent in-memory
    const keyAgent = await initializeKeyAgent(InMemoryKeyAgent, {
      mnemonic,
      password: '', // kosong = tanpa passphrase
      accountIndex: 0
    });

    // 3. Ambil Address pertama (internal)
    const address = await keyAgent.buildAddress({
      index: 0,
      role: KeyRole.Internal
    });

    // 4. Ambil private key (raw hex)
    const privateKeyHex = Buffer.from(
      keyAgent.getRawKey(KeyRole.Internal, 0)
    ).toString('hex');

    res.status(200).json({ mnemonic, privateKey: privateKeyHex, address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
