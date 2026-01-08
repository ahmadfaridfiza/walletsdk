import { ethers } from "ethers";

const ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory)",
  "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function decimals() view returns (uint8)"
];

export default async function handler(req, res) {
  try {
    const {
      tokenIn,
      tokenOut,
      amount,
      privatekey,
      rpc,
      routerContract
    } = req.query;

    if (!tokenIn || !tokenOut || !amount || !privatekey || !rpc || !routerContract) {
      return res.status(400).json({ error: "parameter tidak lengkap" });
    }

    const provider = new ethers.providers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(privatekey, provider);
    const router = new ethers.Contract(routerContract, ROUTER_ABI, wallet);
	
	const gasPrice = await provider.getGasPrice();


    const deadline = Math.floor(Date.now() / 1000) + 120;
    const isPOL =
      tokenIn.toLowerCase() === "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

    // =========================
    // POL -> TOKEN
    // =========================
    if (isPOL) {
      const amountIn = ethers.utils.parseEther(amount);
      const path = [tokenIn, tokenOut];

      const amounts = await router.getAmountsOut(amountIn, path);
      const amountOutMin = amounts[1].mul(95).div(100); // 5% slippage

      const tx = await router.swapExactETHForTokens(
        amountOutMin,
        path,
        wallet.address,
        deadline,
        {
          value: amountIn,
          gasLimit: 300000,
		  maxFeePerGas,
    maxPriorityFeePerGas
        }
      );

      await tx.wait();

      return res.json({
        success: true,
        type: "POL_TO_TOKEN",
        txHash: tx.hash
      });
    }

    // =========================
    // TOKEN -> TOKEN
    // =========================
  
    const token = new ethers.Contract(tokenIn, ERC20_ABI, wallet);
    const decimals = await token.decimals();
    const amountIn = ethers.utils.parseUnits(amount, decimals);

    await token.approve(routerContract, amountIn);// approve with correct gas fees
await token.approve(routerContract, amountIn, {
  maxFeePerGas,
  maxPriorityFeePerGas,
  gasLimit: 120000
});

    const path = [tokenIn, tokenOut];
    const amounts = await router.getAmountsOut(amountIn, path);
    const amountOutMin = amounts[1].mul(95).div(100);

    const tx = await router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      wallet.address,
      deadline,
      {
    gasLimit: 400000,
    maxFeePerGas,
    maxPriorityFeePerGas
  }
    );

    await tx.wait();

    return res.json({
      success: true,
      type: "TOKEN_TO_TOKEN",
      txHash: tx.hash
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e.message,
	  gasPriceWei: gasPrice.toString(),
  gasPriceGwei: ethers.utils.formatUnits(gasPrice, "gwei")
    });
  }
}
