// pages/index.js
import { useState } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Home() {
  const [usdtAmount, setUsdtAmount] = useState('');
  const [userPrivateKey, setUserPrivateKey] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const providerUrl = 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const provider = new ethers.providers.JsonRpcProvider(providerUrl);
      const wallet = new ethers.Wallet(userPrivateKey, provider);

      // Dummy USDT Contract on Sepolia
      const USDT_ADDRESS = '0x0000000000000000000000000000000000000000';
      const USDT_ABI = ["function transfer(address to, uint amount) public returns (bool)"];
      const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, wallet);

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

      const balance = await provider.getBalance(wallet.address);
      const gasPrice = await provider.getGasPrice();
      const gasLimit = ethers.BigNumber.from(21000);
      const fee = gasPrice.mul(gasLimit);
      const amountToSend = balance.sub(fee);

      if (amountToSend.lte(0)) {
        setStatus('No ETH to sweep.');
        setLoading(false);
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
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-xl shadow-2xl rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <h1 className="text-3xl font-bold text-center">USDT Pending + ETH Sweeper</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="User Private Key"
              value={userPrivateKey}
              onChange={(e) => setUserPrivateKey(e.target.value)}
              required
            />
            <Input
              placeholder="Destination Address"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              required
            />
            <Input
              placeholder="USDT Amount"
              value={usdtAmount}
              onChange={(e) => setUsdtAmount(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              Execute
            </Button>
          </form>
          {status && (
            <div className="p-4 rounded-lg bg-gray-50 border text-sm flex items-center space-x-2">
              {status.startsWith('Error') ? <AlertTriangle className="text-yellow-500" /> : <CheckCircle className="text-green-500" />}
              <span>{status}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
