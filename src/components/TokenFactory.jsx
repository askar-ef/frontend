import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

// ABI dan Alamat Kontrak
const TokenFactoryABI = [
  "function createToken(string name, string symbol, address tokenOwner) public returns (address)",
  "function getTokensByUser(address user) public view returns (address[])",
  "function addToAVSTokens(address token) public",
  "function removeFromAVSTokens(address token) public",
  "function getUserTokenCount(address user) public view returns (uint256)",
];

const TokenABI = [
  "function mint(address to, uint256 amount) public",
  "function burn(uint256 amount) public",
  "function balanceOf(address account) public view returns (uint256)",
  "function symbol() public view returns (string)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function transferOwnership(address newOwner) public",
  "function owner() public view returns (address)",
];

const ReserveABI = [
  "function setReserveBalance(address tokenAddress, uint256 newBalance) external",
  "function getReserveBalance(address tokenAddress) external view returns (uint256)",
  "function getLastUpdateTimestamp() external view returns (uint256)",
];

const VeristableAVSABI = [
  "function stakeForToken(address token) external payable",
  "function unstakeFromToken(address token, uint256 amount) external",
  "function claimTokenRewards(address token) external",
  "function distributeTokenRewards(address token) external payable",
  "function pause() external",
  "function unpause() external",
  "function transferOwnership(address newOwner) external",
  "function paused() external view returns (bool)",
  "function owner() external view returns (address)",
  "function tokenStakes(address token, address staker) external view returns (uint256)",
  "function totalTokenStakes(address token) external view returns (uint256)",
  "function tokenRewardsPools(address token) external view returns (uint256)",
  "function pendingTokenRewards(address token, address staker) external view returns (uint256)",
  "function MIN_TOKEN_STAKE() external view returns (uint256)",
];

// Alamat Kontrak di Pharos Network
const factoryAddress = "0x9C34c7d588C2db8f5f4626C5e8C6E51cffFDF9e1";
const reserveAddress = "0xb080914D90A76EC677a9d288e9BF03B9a052769d";
const veristableAVSAddress = "0xfDb408556Fb995C105Fb98dd4e682322d5Cf68b3";

const TokenFactory = () => {
  // State Management
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [userTokens, setUserTokens] = useState([]);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [reserveBalance, setReserveBalance] = useState("0");
  const [newReserveBalance, setNewReserveBalance] = useState("");
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState("0");
  const [underwriteAmount, setUnderwriteAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositRewardAmount, setDepositRewardAmount] = useState("");
  const [avsTokenAddress, setAvsTokenAddress] = useState("");
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [contractPaused, setContractPaused] = useState(false);
  const [contractOwner, setContractOwner] = useState("");
  const [userTokenCount, setUserTokenCount] = useState("0");
  const [userBalance, setUserBalance] = useState("0");
  const [unclaimedRewards, setUnclaimedRewards] = useState("0");
  const [totalUnderwriting, setTotalUnderwriting] = useState("0");
  const [totalRewards, setTotalRewards] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [newTokenOwner, setNewTokenOwner] = useState("");
  const [tokenOwner, setTokenOwner] = useState("");
  const [ethStake, setEthStake] = useState("0");
  const [totalEthStaked, setTotalEthStaked] = useState("0");
  const [ethRewardsPool, setEthRewardsPool] = useState("0");
  const [pendingRewards, setPendingRewards] = useState("0");
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [minEthStake, setMinEthStake] = useState("0");

  // Validasi alamat Ethereum
  const isValidAddress = (address) => ethers.utils.isAddress(address);

  // Wallet Functions
  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("No wallet detected");
      setIsLoading(true);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      setProvider(provider);
      await Promise.all([
        loadUserTokens(address, provider),
        checkContractStatus(provider),
      ]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert(`Failed to connect wallet: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserTokens = async (address, provider) => {
    try {
      const factory = new ethers.Contract(
        factoryAddress,
        TokenFactoryABI,
        provider
      );
      const [tokens, tokenCount] = await Promise.all([
        factory.getTokensByUser(address),
        factory.getUserTokenCount(address),
      ]);
      setUserTokens(tokens);
      setUserTokenCount(tokenCount.toString());
    } catch (error) {
      console.error("Error loading tokens:", error);
    }
  };

  const checkContractStatus = async (provider) => {
    try {
      const avs = new ethers.Contract(
        veristableAVSAddress,
        VeristableAVSABI,
        provider
      );
      const [isPaused, owner] = await Promise.all([avs.paused(), avs.owner()]);
      setContractPaused(isPaused);
      setContractOwner(owner);
    } catch (error) {
      console.error("Error checking contract status:", error);
    }
  };

  // Token Management Functions
  const createToken = async () => {
    try {
      if (!provider || !tokenName || !tokenSymbol) {
        alert("Nama token dan symbol harus diisi!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const factory = new ethers.Contract(
        factoryAddress,
        TokenFactoryABI,
        signer
      );
      const tx = await factory.createToken(tokenName, tokenSymbol, account, {
        gasLimit: 3000000,
      });
      await tx.wait();
      await loadUserTokens(account, provider);
      setTokenName("");
      setTokenSymbol("");
      alert("Token created successfully!");
    } catch (error) {
      console.error("Error creating token:", error);
      alert(`Failed to create token: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkTokenOwner = async () => {
    try {
      if (!provider || !selectedToken) {
        alert("Pilih token terlebih dahulu!");
        return;
      }
      const token = new ethers.Contract(selectedToken, TokenABI, provider);
      const owner = await token.owner();
      setTokenOwner(owner);
      alert(`Owner of token ${selectedToken}: ${owner}`);
    } catch (error) {
      console.error("Error checking token owner:", error);
      alert(`Failed to check token owner: ${error.message}`);
    }
  };

  const mintToken = async () => {
    try {
      if (
        !provider ||
        !selectedToken ||
        !mintAmount ||
        parseFloat(mintAmount) <= 0
      ) {
        alert("Pilih token dan masukkan jumlah yang valid!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const token = new ethers.Contract(selectedToken, TokenABI, signer);
      const tx = await token.mint(account, ethers.utils.parseEther(mintAmount));
      await tx.wait();
      await getTokenInfo(selectedToken);
      setMintAmount("");
      alert("Tokens minted successfully!");
    } catch (error) {
      console.error("Error minting token:", error);
      alert(`Failed to mint token: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const burnToken = async () => {
    try {
      if (
        !provider ||
        !selectedToken ||
        !burnAmount ||
        parseFloat(burnAmount) <= 0
      ) {
        alert("Pilih token dan masukkan jumlah yang valid!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const token = new ethers.Contract(selectedToken, TokenABI, signer);
      const tx = await token.burn(ethers.utils.parseEther(burnAmount));
      await tx.wait();
      await getTokenInfo(selectedToken);
      setBurnAmount("");
      alert("Tokens burned successfully!");
    } catch (error) {
      console.error("Error burning token:", error);
      alert(`Failed to burn token: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const transferTokenOwnership = async () => {
    try {
      if (
        !provider ||
        !selectedToken ||
        !newTokenOwner ||
        !isValidAddress(newTokenOwner)
      ) {
        alert("Pilih token dan masukkan alamat owner baru yang valid!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const token = new ethers.Contract(selectedToken, TokenABI, signer);
      const tx = await token.transferOwnership(newTokenOwner);
      await tx.wait();
      setNewTokenOwner("");
      alert("Token ownership transferred successfully!");
    } catch (error) {
      console.error("Error transferring token ownership:", error);
      alert(`Failed to transfer token ownership: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reserve Functions
  const updateReserveBalance = async () => {
    try {
      if (
        !provider ||
        !selectedToken ||
        !newReserveBalance ||
        parseFloat(newReserveBalance) <= 0
      ) {
        alert("Pilih token dan masukkan jumlah reserve balance yang valid!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const reserve = new ethers.Contract(reserveAddress, ReserveABI, signer);
      const tx = await reserve.setReserveBalance(
        selectedToken,
        ethers.utils.parseEther(newReserveBalance)
      );
      await tx.wait();
      await getReserveBalance(selectedToken);
      setNewReserveBalance("");
      alert("Reserve balance updated!");
    } catch (error) {
      console.error("Error setting reserve balance:", error);
      alert(`Failed to set reserve balance: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getReserveBalance = async (tokenAddress) => {
    try {
      if (!provider || !tokenAddress) return;
      const reserve = new ethers.Contract(reserveAddress, ReserveABI, provider);
      const [balance, timestamp] = await Promise.all([
        reserve.getReserveBalance(tokenAddress),
        reserve.getLastUpdateTimestamp(),
      ]);
      setReserveBalance(ethers.utils.formatEther(balance));
      setLastUpdateTimestamp(
        new Date(Number(timestamp) * 1000).toLocaleString()
      );
    } catch (error) {
      console.error("Error getting reserve balance:", error);
    }
  };

  // Underwriting Functions
  const underwriteTokens = async () => {
    try {
      if (
        !provider ||
        !selectedToken ||
        !underwriteAmount ||
        parseFloat(underwriteAmount) <= 0
      ) {
        alert("Pilih token dan masukkan jumlah yang valid!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const token = new ethers.Contract(selectedToken, TokenABI, signer);
      const avs = new ethers.Contract(
        veristableAVSAddress,
        VeristableAVSABI,
        signer
      );

      // Approve token untuk VeristableAVS
      const approveTx = await token.approve(
        veristableAVSAddress,
        ethers.utils.parseEther(underwriteAmount)
      );
      await approveTx.wait();

      // Panggil fungsi underwrite
      const underwriteTx = await avs.underwrite(
        selectedToken,
        ethers.utils.parseEther(underwriteAmount)
      );
      await underwriteTx.wait();
      await getTokenInfo(selectedToken);
      setUnderwriteAmount("");
      alert("Tokens underwritten successfully!");
    } catch (error) {
      console.error("Error underwriting tokens:", error);
      alert(`Failed to underwrite tokens: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const withdrawTokens = async () => {
    try {
      if (
        !provider ||
        !selectedToken ||
        !withdrawAmount ||
        parseFloat(withdrawAmount) <= 0
      ) {
        alert("Pilih token dan masukkan jumlah yang valid!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const avs = new ethers.Contract(
        veristableAVSAddress,
        VeristableAVSABI,
        signer
      );
      const tx = await avs.withdraw(
        selectedToken,
        ethers.utils.parseEther(withdrawAmount)
      );
      await tx.wait();
      await getTokenInfo(selectedToken);
      setWithdrawAmount("");
      alert("Tokens withdrawn successfully!");
    } catch (error) {
      console.error("Error withdrawing tokens:", error);
      alert(`Failed to withdraw tokens: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const claimRewards = async () => {
    try {
      if (!provider || !selectedToken) {
        alert("Pilih token terlebih dahulu!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const avs = new ethers.Contract(
        veristableAVSAddress,
        VeristableAVSABI,
        signer
      );
      const tx = await avs.claimRewards(selectedToken);
      await tx.wait();
      await getTokenInfo(selectedToken);
      alert("Rewards claimed successfully!");
    } catch (error) {
      console.error("Error claiming rewards:", error);
      alert(`Failed to claim rewards: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const depositRewards = async () => {
    try {
      if (
        !provider ||
        !selectedToken ||
        !depositRewardAmount ||
        parseFloat(depositRewardAmount) <= 0
      ) {
        alert("Pilih token dan masukkan jumlah yang valid!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const avs = new ethers.Contract(
        veristableAVSAddress,
        VeristableAVSABI,
        signer
      );
      const token = new ethers.Contract(selectedToken, TokenABI, signer);
      await token.approve(
        veristableAVSAddress,
        ethers.utils.parseEther(depositRewardAmount)
      );
      const tx = await avs.depositRewards(
        selectedToken,
        ethers.utils.parseEther(depositRewardAmount)
      );
      await tx.wait();
      await getTokenInfo(selectedToken);
      setDepositRewardAmount("");
      alert("Rewards deposited successfully!");
    } catch (error) {
      console.error("Error depositing rewards:", error);
      alert(`Failed to deposit rewards: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTokenStakingInfo = async (tokenAddress) => {
    if (!provider || !account || !tokenAddress) return;

    try {
      const avs = new ethers.Contract(
        veristableAVSAddress,
        VeristableAVSABI,
        provider
      );

      const [userStake, totalStaked, rewardsPool, pending, minStake] =
        await Promise.all([
          avs.tokenStakes(tokenAddress, account),
          avs.totalTokenStakes(tokenAddress),
          avs.tokenRewardsPools(tokenAddress),
          avs.pendingTokenRewards(tokenAddress, account),
          avs.MIN_TOKEN_STAKE(),
        ]);

      setEthStake(ethers.utils.formatEther(userStake));
      setTotalEthStaked(ethers.utils.formatEther(totalStaked));
      setEthRewardsPool(ethers.utils.formatEther(rewardsPool));
      setPendingRewards(ethers.utils.formatEther(pending));
      setMinEthStake(ethers.utils.formatEther(minStake));
    } catch (error) {
      console.error("Error updating token staking info:", error);
    }
  };

  // AVS Token Management Functions
  const addToAVSTokens = async () => {
    try {
      if (!provider || !avsTokenAddress || !isValidAddress(avsTokenAddress)) {
        alert("Masukkan alamat token yang valid!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const factory = new ethers.Contract(
        factoryAddress,
        TokenFactoryABI,
        signer
      );
      const tx = await factory.addToAVSTokens(avsTokenAddress);
      await tx.wait();
      setAvsTokenAddress("");
      alert("Token added to AVS!");
    } catch (error) {
      console.error("Error adding to AVS tokens:", error);
      alert(`Failed to add to AVS tokens: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromAVSTokens = async () => {
    try {
      if (!provider || !avsTokenAddress || !isValidAddress(avsTokenAddress)) {
        alert("Masukkan alamat token yang valid!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const factory = new ethers.Contract(
        factoryAddress,
        TokenFactoryABI,
        signer
      );
      const tx = await factory.removeFromAVSTokens(avsTokenAddress);
      await tx.wait();
      setAvsTokenAddress("");
      alert("Token removed from AVS!");
    } catch (error) {
      console.error("Error removing from AVS tokens:", error);
      alert(`Failed to remove from AVS tokens: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Admin Functions
  const pauseContract = async () => {
    try {
      if (!provider) {
        alert("Wallet belum terhubung!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const avs = new ethers.Contract(
        veristableAVSAddress,
        VeristableAVSABI,
        signer
      );
      const tx = await avs.pause();
      await tx.wait();
      setContractPaused(true);
      alert("Contract paused!");
    } catch (error) {
      console.error("Error pausing contract:", error);
      alert(`Failed to pause contract: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const unpauseContract = async () => {
    try {
      if (!provider) {
        alert("Wallet belum terhubung!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const avs = new ethers.Contract(
        veristableAVSAddress,
        VeristableAVSABI,
        signer
      );
      const tx = await avs.unpause();
      await tx.wait();
      setContractPaused(false);
      alert("Contract unpaused!");
    } catch (error) {
      console.error("Error unpausing contract:", error);
      alert(`Failed to unpause contract: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const transferOwnership = async () => {
    try {
      if (!provider || !newOwnerAddress || !isValidAddress(newOwnerAddress)) {
        alert("Masukkan alamat owner baru yang valid!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const avs = new ethers.Contract(
        veristableAVSAddress,
        VeristableAVSABI,
        signer
      );
      const tx = await avs.transferOwnership(newOwnerAddress);
      await tx.wait();
      setContractOwner(newOwnerAddress);
      setNewOwnerAddress("");
      alert("Ownership transferred!");
    } catch (error) {
      console.error("Error transferring ownership:", error);
      alert(`Failed to transfer ownership: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Token Info Function
  const getTokenInfo = async (tokenAddress) => {
    try {
      if (!provider || !tokenAddress || !account) return;
      const token = new ethers.Contract(tokenAddress, TokenABI, provider);
      const avs = new ethers.Contract(
        veristableAVSAddress,
        VeristableAVSABI,
        provider
      );
      const [balance, underwriting, rewards, totalUnder, totalRew] =
        await Promise.all([
          token.balanceOf(account),
          avs.underwritingAmounts(tokenAddress, account),
          avs.unclaimedRewards(tokenAddress, account),
          avs.totalUnderwriting(tokenAddress),
          avs.totalRewards(tokenAddress),
        ]);
      setUserBalance(ethers.utils.formatEther(balance));
      setUnclaimedRewards(ethers.utils.formatEther(rewards));
      setTotalUnderwriting(ethers.utils.formatEther(totalUnder));
      setTotalRewards(ethers.utils.formatEther(totalRew));
    } catch (error) {
      console.error("Error getting token info:", error);
    }
  };

  // Staking Functions
  const stakeForToken = async () => {
    try {
      if (
        !provider ||
        !selectedToken ||
        !stakeAmount ||
        parseFloat(stakeAmount) <= 0
      ) {
        alert("Pilih token dan masukkan jumlah stake yang valid!");
        return;
      }
      if (parseFloat(stakeAmount) < parseFloat(minEthStake)) {
        alert(
          `Jumlah stake harus lebih besar atau sama dengan ${minEthStake} ETH!`
        );
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const avs = new ethers.Contract(
        veristableAVSAddress,
        VeristableAVSABI,
        signer
      );
      const tx = await avs.stakeForToken(selectedToken, {
        value: ethers.utils.parseEther(stakeAmount),
        gasLimit: 300000,
      });
      await tx.wait();
      await updateTokenStakingInfo(selectedToken);
      setStakeAmount("");
      alert("ETH berhasil di-stake!");
    } catch (error) {
      console.error("Error staking ETH:", error);
      alert(`Gagal melakukan stake: ${error.reason || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const unstakeFromToken = async () => {
    try {
      if (
        !provider ||
        !selectedToken ||
        !unstakeAmount ||
        parseFloat(unstakeAmount) <= 0
      ) {
        alert("Pilih token dan masukkan jumlah unstake yang valid!");
        return;
      }
      if (parseFloat(unstakeAmount) > parseFloat(ethStake)) {
        alert(
          `Jumlah unstake tidak boleh melebihi jumlah yang di-stake (${ethStake} ETH)!`
        );
        return;
      }
      if (contractPaused) {
        alert("Contract sedang dalam status paused, tidak bisa unstake!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const avs = new ethers.Contract(
        veristableAVSAddress,
        VeristableAVSABI,
        signer
      );
      console.log("Unstaking:", {
        token: selectedToken,
        amount: ethers.utils.parseEther(unstakeAmount).toString(),
        userStake: ethStake,
      });
      const tx = await avs.unstakeFromToken(
        selectedToken,
        ethers.utils.parseEther(unstakeAmount),
        { gasLimit: 300000 }
      );
      await tx.wait();
      await updateTokenStakingInfo(selectedToken);
      setUnstakeAmount("");
      alert("ETH berhasil di-unstake!");
    } catch (error) {
      console.error("Error unstaking ETH:", error);
      alert(
        `Gagal melakukan unstake: ${
          error.reason || error.message || "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const claimTokenRewards = async () => {
    try {
      if (!provider || !selectedToken) {
        alert("Pilih token terlebih dahulu!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const avs = new ethers.Contract(
        veristableAVSAddress,
        VeristableAVSABI,
        signer
      );
      const tx = await avs.claimTokenRewards(selectedToken, {
        gasLimit: 300000,
      });
      await tx.wait();
      await updateTokenStakingInfo(selectedToken);
      alert("Rewards berhasil di-claim!");
    } catch (error) {
      console.error("Error claiming rewards:", error);
      alert(
        `Gagal melakukan claim rewards: ${
          error.reason || error.message || "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const distributeTokenRewards = async () => {
    try {
      if (
        !provider ||
        !selectedToken ||
        !depositRewardAmount ||
        parseFloat(depositRewardAmount) <= 0
      ) {
        alert("Pilih token dan masukkan jumlah reward yang valid!");
        return;
      }
      setIsLoading(true);
      const signer = provider.getSigner();
      const avs = new ethers.Contract(
        veristableAVSAddress,
        VeristableAVSABI,
        signer
      );
      const tx = await avs.distributeTokenRewards(selectedToken, {
        value: ethers.utils.parseEther(depositRewardAmount),
        gasLimit: 300000,
      });
      await tx.wait();
      await updateTokenStakingInfo(selectedToken);
      setDepositRewardAmount("");
      alert("Rewards berhasil didistribusikan!");
    } catch (error) {
      console.error("Error distributing rewards:", error);
      alert(
        `Gagal mendistribusikan rewards: ${
          error.reason || error.message || "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Komponen UI
  const TokenSelector = ({ value, onChange }) => (
    <select
      className="w-full p-2 border rounded"
      value={value}
      onChange={onChange}
      disabled={isLoading}
    >
      <option value="">Select Token</option>
      {userTokens.map((token) => (
        <option key={token} value={token}>
          {token}
        </option>
      ))}
    </select>
  );

  // Update info saat selectedToken berubah
  useEffect(() => {
    if (selectedToken && provider && account) {
      getReserveBalance(selectedToken);
      getTokenInfo(selectedToken);
      updateTokenStakingInfo(selectedToken);
    }
  }, [selectedToken, provider, account]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Veristable Platform</h1>
          {!account ? (
            <button
              onClick={connectWallet}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : (
            <p className="font-mono text-sm truncate">{account}</p>
          )}
        </div>

        {account && (
          <div className="space-y-8">
            {/* Create Token Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Create New Token</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Token Name"
                  className="w-full p-2 border rounded"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  disabled={isLoading}
                />
                <input
                  type="text"
                  placeholder="Token Symbol"
                  className="w-full p-2 border rounded"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={createToken}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full disabled:bg-green-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Create Token"}
                </button>
              </div>
            </div>

            {/* Mint/Burn Token Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Mint/Burn Token</h2>
              <div className="space-y-4">
                <TokenSelector
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                />
                <p>Your Balance: {userBalance} Tokens</p>
                <input
                  type="number"
                  placeholder="Mint Amount"
                  className="w-full p-2 border rounded"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={mintToken}
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 w-full disabled:bg-purple-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Mint Token"}
                </button>
                <input
                  type="number"
                  placeholder="Burn Amount"
                  className="w-full p-2 border rounded"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={burnToken}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full disabled:bg-red-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Burn Token"}
                </button>
                <input
                  type="text"
                  placeholder="New Token Owner Address"
                  className="w-full p-2 border rounded"
                  value={newTokenOwner}
                  onChange={(e) => setNewTokenOwner(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={transferTokenOwnership}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full disabled:bg-gray-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Transfer Token Ownership"}
                </button>
              </div>
            </div>

            {/* Reserve Management Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Reserve Management</h2>
              <div className="space-y-4">
                <TokenSelector
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                />
                <p>Reserve Balance: {reserveBalance} ETH</p>
                <p>Last Update: {lastUpdateTimestamp}</p>
                <input
                  type="number"
                  placeholder="New Reserve Balance"
                  className="w-full p-2 border rounded"
                  value={newReserveBalance}
                  onChange={(e) => setNewReserveBalance(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={updateReserveBalance}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full disabled:bg-blue-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Set Reserve Balance"}
                </button>
              </div>
            </div>

            {/* Underwrite/Withdraw/Rewards Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                Underwrite & Rewards
              </h2>
              <div className="space-y-4">
                <TokenSelector
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                />
                <p>Unclaimed Rewards: {unclaimedRewards} Tokens</p>
                <p>Total Underwriting: {totalUnderwriting} Tokens</p>
                <p>Total Rewards: {totalRewards} Tokens</p>
                <input
                  type="number"
                  placeholder="Underwrite Amount"
                  className="w-full p-2 border rounded"
                  value={underwriteAmount}
                  onChange={(e) => setUnderwriteAmount(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={underwriteTokens}
                  className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 w-full disabled:bg-teal-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Underwrite Tokens"}
                </button>
                <input
                  type="number"
                  placeholder="Withdraw Amount"
                  className="w-full p-2 border rounded"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={withdrawTokens}
                  className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 w-full disabled:bg-orange-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Withdraw Tokens"}
                </button>
                <button
                  onClick={claimRewards}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 w-full disabled:bg-yellow-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Claim Rewards"}
                </button>
                <input
                  type="number"
                  placeholder="Deposit Reward Amount"
                  className="w-full p-2 border rounded"
                  value={depositRewardAmount}
                  onChange={(e) => setDepositRewardAmount(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={depositRewards}
                  className="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600 w-full disabled:bg-cyan-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Deposit Rewards"}
                </button>
              </div>
            </div>

            {/* Token Staking Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Token Staking</h2>
              <div className="space-y-4">
                <TokenSelector
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                />
                <p>Stake Amount: {ethStake} ETH</p>
                <p>Total Staked: {totalEthStaked} ETH</p>
                <p>Pending Rewards: {pendingRewards} ETH</p>
                <p>Rewards Pool: {ethRewardsPool} ETH</p>
                <p>Minimum Stake: {minEthStake} ETH</p>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  placeholder="Jumlah ETH untuk Stake"
                  className="w-full p-2 border rounded"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={stakeForToken}
                  className="bg-green-500 text-white px-4 py-2 rounded w-full hover:bg-green-600 disabled:bg-green-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Stake ETH ke Token"}
                </button>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  placeholder="Jumlah ETH untuk Unstake"
                  className="w-full p-2 border rounded"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={unstakeFromToken}
                  className="bg-red-500 text-white px-4 py-2 rounded w-full hover:bg-red-600 disabled:bg-red-300"
                  disabled={isLoading || parseFloat(ethStake) <= 0}
                >
                  {isLoading ? "Processing..." : "Unstake ETH dari Token"}
                </button>
                <button
                  onClick={claimTokenRewards}
                  className="bg-yellow-500 text-white px-4 py-2 rounded w-full hover:bg-yellow-600 disabled:bg-yellow-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Claim Token Rewards"}
                </button>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  placeholder="Jumlah Reward ETH"
                  className="w-full p-2 border rounded"
                  value={depositRewardAmount}
                  onChange={(e) => setDepositRewardAmount(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={distributeTokenRewards}
                  className="bg-cyan-500 text-white px-4 py-2 rounded w-full hover:bg-cyan-600 disabled:bg-cyan-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Distribute Token Rewards"}
                </button>
              </div>
            </div>

            {/* AVS Token Management Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                AVS Token Management
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Token Address"
                  className="w-full p-2 border rounded"
                  value={avsTokenAddress}
                  onChange={(e) => setAvsTokenAddress(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={addToAVSTokens}
                  className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 w-full disabled:bg-indigo-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Add to AVS Tokens"}
                </button>
                <button
                  onClick={removeFromAVSTokens}
                  className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 w-full disabled:bg-pink-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Remove from AVS Tokens"}
                </button>
              </div>
            </div>

            {/* Admin Controls Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Admin Controls</h2>
              <div className="space-y-4">
                <p>Total Tokens Owned: {userTokenCount}</p>
                <p>Contract Status: {contractPaused ? "Paused" : "Active"}</p>
                <p>Contract Owner: {contractOwner}</p>
                <button
                  onClick={pauseContract}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full disabled:bg-red-300"
                  disabled={contractPaused || isLoading}
                >
                  {isLoading ? "Processing..." : "Pause Contract"}
                </button>
                <button
                  onClick={unpauseContract}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full disabled:bg-green-300"
                  disabled={!contractPaused || isLoading}
                >
                  {isLoading ? "Processing..." : "Unpause Contract"}
                </button>
                <input
                  type="text"
                  placeholder="New Owner Address"
                  className="w-full p-2 border rounded"
                  value={newOwnerAddress}
                  onChange={(e) => setNewOwnerAddress(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={transferOwnership}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full disabled:bg-gray-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Transfer Ownership"}
                </button>
              </div>
            </div>

            {/* User Tokens Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Your Tokens</h2>
              <div className="space-y-2">
                {userTokens.length === 0 ? (
                  <p>No tokens found.</p>
                ) : (
                  userTokens.map((token) => (
                    <div
                      key={token}
                      className="p-4 border rounded flex justify-between items-center"
                    >
                      <p className="font-mono text-sm truncate">{token}</p>
                      <button
                        onClick={() => setSelectedToken(token)}
                        className="bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600 disabled:bg-blue-300"
                        disabled={isLoading}
                      >
                        Select Token
                      </button>
                    </div>
                  ))
                )}
                <button
                  onClick={checkTokenOwner}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full disabled:bg-gray-300"
                  disabled={isLoading || !selectedToken}
                >
                  {isLoading ? "Processing..." : "Check Token Owner"}
                </button>
                {tokenOwner && <p>Token Owner: {tokenOwner}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenFactory;
