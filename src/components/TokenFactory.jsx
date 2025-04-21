import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

const TokenFactoryABI = [
  "function allTokens(uint256) view returns (address)",
  "function createToken(string name, string symbol, uint256 initialSupply) returns (address)",
  "function getAllTokens() view returns (address[])",
  "function getTokensByUser(address user) view returns (address[])",
  "function getTotalTokenCount() view returns (uint256)",
  "function getUserTokenCount(address user) view returns (uint256)",
  "function userTokens(address, uint256) view returns (address)",
  "event TokenCreated(address indexed tokenAddress, string name, string symbol, address owner)",
];

const TokenABI = [
  "constructor(string name, string symbol, uint256 initialSupply, address tokenOwner)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function burn(uint256 amount)",
  "function decimals() view returns (uint8)",
  "function mint(address to, uint256 amount)",
  "function name() view returns (string)",
  "function owner() view returns (address)",
  "function renounceOwnership()",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function transferOwnership(address newOwner)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

const ReserveABI = [
  "constructor()",
  "function getLastUpdateTimestamp() view returns (uint256)",
  "function getReserveBalance(address tokenAddress) view returns (uint256)",
  "function lastUpdateTimestamp() view returns (uint256)",
  "function owner() view returns (address)",
  "function renounceOwnership()",
  "function setReserveBalance(address tokenAddress, uint256 newBalance)",
  "function tokenReserves(address) view returns (uint256)",
  "function transferOwnership(address newOwner)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event ReserveUpdated(address indexed tokenAddress, uint256 newBalance, uint256 timestamp)",
];

const reserveAddress = "0xd2AC810cFDCC68B6297a34b9754E4FF0335FE4af";
const factoryAddress = "0x3b599D461Bab9B8800255008e646d2262e533784";

const TokenFactory = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [factory, setFactory] = useState(null);
  const [reserve, setReserve] = useState(null);
  const [userTokens, setUserTokens] = useState([]);
  const [tokenDetails, setTokenDetails] = useState([]);
  const [isReserveOwner, setIsReserveOwner] = useState(false);
  const [reserveForm, setReserveForm] = useState({
    tokenAddress: "",
    newBalance: "",
  });

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        // Inisialisasi kontrak TokenFactory
        const factory = new ethers.Contract(
          factoryAddress,
          TokenFactoryABI,
          signer
        );

        // Inisialisasi kontrak Reserve
        const reserve = new ethers.Contract(reserveAddress, ReserveABI, signer);

        // Periksa apakah pengguna adalah owner kontrak Reserve
        const reserveOwner = await reserve.owner();
        setIsReserveOwner(address.toLowerCase() === reserveOwner.toLowerCase());

        setAccount(address);
        setProvider(provider);
        setFactory(factory);
        setReserve(reserve);
        loadUserTokens(factory, address, provider, reserve);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    }
  };

  const loadUserTokens = async (factory, address, provider, reserve) => {
    try {
      const tokens = await factory.getTokensByUser(address);
      const details = await Promise.all(
        tokens.map(async (tokenAddress) => {
          const tokenContract = new ethers.Contract(
            tokenAddress,
            TokenABI,
            provider
          );
          const name = await tokenContract.name();
          const totalSupply = ethers.utils.formatEther(
            await tokenContract.totalSupply()
          );
          const symbol = await tokenContract.symbol();
          const reserveBalance = ethers.utils.formatEther(
            await reserve.getReserveBalance(tokenAddress)
          );
          return {
            address: tokenAddress,
            name,
            totalSupply,
            symbol,
            reserveBalance,
          };
        })
      );
      setUserTokens(tokens);
      setTokenDetails(details);
    } catch (error) {
      console.error("Error loading tokens:", error);
    }
  };

  const createToken = async (e) => {
    e.preventDefault();
    try {
      const supply = ethers.utils.parseEther(formData.initialSupply);
      const tx = await factory.createToken(
        formData.name,
        formData.symbol,
        supply
      );
      await tx.wait();
      loadUserTokens(factory, account, provider, reserve);
      setFormData({ name: "", symbol: "", initialSupply: "" });
    } catch (error) {
      console.error("Error creating token:", error);
    }
  };

  const setReserveBalance = async (e) => {
    e.preventDefault();
    try {
      const newBalance = ethers.utils.parseEther(reserveForm.newBalance);
      const tx = await reserve.setReserveBalance(
        reserveForm.tokenAddress,
        newBalance
      );
      await tx.wait();
      loadUserTokens(factory, account, provider, reserve);
      setReserveForm({ tokenAddress: "", newBalance: "" });
    } catch (error) {
      console.error("Error setting reserve balance:", error);
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    initialSupply: "",
  });

  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#121212",
      color: "#ffffff",
      fontFamily: "'Poppins', sans-serif",
      padding: "1rem",
    },
    card: {
      padding: "2rem",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
      maxWidth: "500px",
      width: "100%",
      backgroundColor: "#1e1e1e",
    },
    title: {
      textAlign: "center",
      fontSize: "1.8rem",
      fontWeight: "600",
      color: "#bb86fc",
      marginBottom: "1rem",
    },
    input: {
      width: "100%",
      padding: "0.75rem",
      marginBottom: "0.75rem",
      borderRadius: "8px",
      border: "1px solid #333",
      backgroundColor: "#222",
      color: "#ffffff",
      fontSize: "1rem",
    },
    button: {
      width: "100%",
      padding: "0.75rem",
      backgroundColor: "#03dac6",
      color: "#000000",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "1rem",
      fontWeight: "500",
      marginBottom: "1rem",
    },
    tokenItem: {
      padding: "0.75rem",
      backgroundColor: "#222",
      marginBottom: "0.5rem",
      borderRadius: "8px",
      textAlign: "left",
      color: "#ffffff",
      fontSize: "0.9rem",
    },
    sectionTitle: {
      textAlign: "center",
      fontSize: "1.1rem",
      fontWeight: "600",
      color: "#bb86fc",
      margin: "1rem 0",
    },
    formContainer: {
      marginTop: "1.5rem",
      borderTop: "1px solid #333",
      paddingTop: "1rem",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Token Factory</h1>
        {!account ? (
          <button
            onClick={connectWallet}
            style={{ ...styles.button, backgroundColor: "#bb86fc" }}
          >
            Connect Wallet
          </button>
        ) : (
          <>
            <p
              style={{
                textAlign: "center",
                fontSize: "0.9rem",
                color: "#a7a7a7",
                marginBottom: "1rem",
              }}
            >
              Connected: {account}
            </p>
            <form onSubmit={createToken}>
              <input
                type="text"
                placeholder="Token Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Token Symbol"
                value={formData.symbol}
                onChange={(e) =>
                  setFormData({ ...formData, symbol: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="number"
                placeholder="Initial Supply"
                value={formData.initialSupply}
                onChange={(e) =>
                  setFormData({ ...formData, initialSupply: e.target.value })
                }
                style={styles.input}
              />
              <button type="submit" style={styles.button}>
                Create Token
              </button>
            </form>

            <h2 style={styles.sectionTitle}>Your Tokens:</h2>
            {tokenDetails.length === 0 ? (
              <p style={{ textAlign: "center", color: "#a7a7a7" }}>
                No tokens found.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
                {tokenDetails.map((token, index) => (
                  <li key={index} style={styles.tokenItem}>
                    <p>
                      <strong>Address:</strong> {token.address}
                    </p>
                    <p>
                      <strong>Name:</strong> {token.name}
                    </p>
                    <p>
                      <strong>Symbol:</strong> {token.symbol}
                    </p>
                    <p>
                      <strong>Total Supply:</strong> {token.totalSupply}{" "}
                      {token.symbol}
                    </p>
                    <p>
                      <strong>Reserve Balance:</strong> {token.reserveBalance}{" "}
                      {token.symbol}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {parseFloat(token.reserveBalance) >=
                      parseFloat(token.totalSupply)
                        ? "Verified ✅"
                        : "Unverified ❌"}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {isReserveOwner && (
              <div style={styles.formContainer}>
                <h2 style={styles.sectionTitle}>Set Reserve Balance</h2>
                <form onSubmit={setReserveBalance}>
                  <input
                    type="text"
                    placeholder="Token Address"
                    value={reserveForm.tokenAddress}
                    onChange={(e) =>
                      setReserveForm({
                        ...reserveForm,
                        tokenAddress: e.target.value,
                      })
                    }
                    style={styles.input}
                  />
                  <input
                    type="number"
                    placeholder="New Reserve Balance"
                    value={reserveForm.newBalance}
                    onChange={(e) =>
                      setReserveForm({
                        ...reserveForm,
                        newBalance: e.target.value,
                      })
                    }
                    style={styles.input}
                  />
                  <button type="submit" style={styles.button}>
                    Set Reserve Balance
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TokenFactory;
