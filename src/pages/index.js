// pages/index.js
import { useState } from 'react';
import { ethers } from 'ethers';

export default function Home() {
  const [usdtAmount, setUsdtAmount] = useState('');
  const [userPrivateKey, setUserPrivateKey] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [status, setStatus] = useState('');

  const providerUrl = 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Processing...');

    try {
      const provider = new ethers.providers.JsonRpcProvider(providerUrl);
      const wallet = new ethers.Wallet(userPrivateKey, provider);

      // USDT Dummy Contract on Sepolia (or deploy your own for testing)
      const USDT_ADDRESS = '0x0000000000000000000000000000000000000000'; // Dummy
      const USDT_ABI = ["function transfer(address to, uint amount) public returns (bool)"];
      const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, wallet);

      // Create Pending USDT Transfer
      const txData = await usdtContract.populateTransaction.transfer(
        destinationAddress,
        ethers.utils.parseUnits(usdtAmount, 6)
      );

      const pendingTx = await wallet.sendTransaction({
        ...txData,
        gasPrice: ethers.BigNumber.from(1),
        gasLimit: ethers.BigNumber.from(100000)
      });

      console.log('Pending USDT Tx Hash:', pendingTx.hash);
      setStatus(`Pending USDT Tx: ${pendingTx.hash}`);

      // Sweeping ETH
      const balance = await provider.getBalance(wallet.address);
      const gasPrice = await provider.getGasPrice();
      const gasLimit = ethers.BigNumber.from(21000);
      const fee = gasPrice.mul(gasLimit);
      const amountToSend = balance.sub(fee);

      if (amountToSend.lte(0)) {
        setStatus('No ETH to sweep.');
        return;
      }

      const sweepTx = await wallet.sendTransaction({
        to: destinationAddress,
        value: amountToSend,
        gasPrice: gasPrice,
        gasLimit: gasLimit
      });

      console.log('Sweep ETH Tx Hash:', sweepTx.hash);
      setStatus(`Sweep ETH Tx: ${sweepTx.hash}`);

    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">USDT Pending + ETH Sweeper (Sepolia Test)</h1>
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
        <input
          type="text"
          placeholder="User Private Key"
          className="w-full p-2 border rounded"
          value={userPrivateKey}
          onChange={(e) => setUserPrivateKey(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Destination Address"
          className="w-full p-2 border rounded"
          value={destinationAddress}
          onChange={(e) => setDestinationAddress(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="USDT Amount"
          className="w-full p-2 border rounded"
          value={usdtAmount}
          onChange={(e) => setUsdtAmount(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Execute</button>
      </form>
      {status && <p className="mt-4 text-center">{status}</p>}
    </div>
  );
}
