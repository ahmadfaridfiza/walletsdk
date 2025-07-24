import { AptosAccount, Ed25519PrivateKey } from "aptos";
import bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";

export async function getServerSideProps() {
  const mnemonic = bip39.generateMnemonic();
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  const path = "m/44'/637'/0'/0'/0'";
  const { key } = derivePath(path, seed.toString('hex'));

  const privateKey = new Ed25519PrivateKey(Buffer.from(key, 'hex'));
  const account = AptosAccount.fromPrivateKey(privateKey);

  return {
    props: {
      mnemonic,
      privateKey: account.signingKey.secretKey.toString('hex').slice(0, 64),
      address: account.address().toString()
    }
  };
}

export default function AptosWallet({ mnemonic, privateKey, address }) {
  return (
    <>
      <pre>{JSON.stringify({ mnemonic, privateKey, address }, null, 2)}</pre>
    </>
  );
}
