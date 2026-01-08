import { ethers } from "ethers";
import axios from "axios";

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
      routerContract,
      network = "mainnet"
    } = req.query;

    if (!tokenIn || !tokenOut || !amount || !privatekey || !rpc || !routerContract) {
      return res.status(400).json({ error: "parameter tidak lengkap" });
    }

    const provider = new ethers.providers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(privatekey, provider);
    const router = new ethers.Contract(routerContract, ROUTER_ABI, wallet);

    // -------- GAS CONFIG ----------
    const gasStationURL =
      network === "mainnet"
        ? "https://gasstation.polygon.technology/v2"
        : "https://gasstation-testnet.polygon.technology/v2";

    // fallback 40 gwei
    let maxFeePerGas = ethers.utils.parseUnits("40", "gwei");
    let maxPriorityFeePerGas = ethers.utils.parseUnits("40", "gwei");

    async function setOptimalGas() {
      try {
        const resp = await axios.get(gasStationURL);

        maxFeePerGas = ethers.utils.parseUnits(
          Math.ceil(resp.data.fast.maxFee).toString(),
          "gwei"
        );

        maxPriorityFeePerGas = ethers.utils.parseUnits(
          Math.ceil(resp.data.fast.maxPriorityFee).toString(),
          "gwei"
        );
      } catch (e) {
        // ignore fallback
      }
    }

    const deadline = Math.floor(Date.now() / 1000) + 120;

    // WMATIC native wrapper
    const WMATIC = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270".toLowerCase();
    const isPOL = tokenIn.toLowerCase() === WMATIC;

    // =========================
    // POL -> TOKEN
    // =========================
    if (isPOL) {
      const amountIn = ethers.utils.parseEther(amount);
      const path = [tokenIn, tokenOut];

      const amounts = await router.getAmountsOut(amountIn, path);
      const amountOutMin = amounts[1].mul(95).div(100); // 5% slippage

      await setOptimalGas();

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

    const approveTx = await token.approve(routerContract, amountIn);
    await approveTx.wait();

    const path = [tokenIn, tokenOut];

    const amounts = await router.getAmountsOut(amountIn, path);
    const amountOutMin = amounts[1].mul(95).div(100);

    await setOptimalGas();

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
      error: e.message
    });
  }
}
