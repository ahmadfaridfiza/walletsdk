import { ethers } from "ethers";

const routerABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)"
];

export default async function handler(req, res) {
  try {
    const { tokenOut, amount } = req.query;
    const BSC_RPC = "https://data-seed-prebsc-2-s1.bnbchain.org:8545";
    const PRIVATE_KEY = "0cd0c989a51af92bbb2f0a9d751b95b174d7a13ee0877b0574fb5c7e918fce3f";

    const provider = new ethers.providers.JsonRpcProvider(BSC_RPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const router = new ethers.Contract(
      "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3",
      routerABI,
      wallet
    );

    const path = [
      "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", // WBNB
      tokenOut
    ];

    const tx = await router.swapExactETHForTokens(
      0,
      path,
      wallet.address,
      Math.floor(Date.now() / 1000) + 60,
      {
        value: ethers.utils.parseEther(amount)
      }
    );

    await tx.wait();

    res.json({ success: true, txHash: tx.hash });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
