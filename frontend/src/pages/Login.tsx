import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Web3 from "web3";
import Navbar from "../components/Navbar";
import bgImage from "../picture/cardrive.jpg"
import RoleManagementABI from "../abis/RoleManagement.json";

const CONTRACT_ADDRESS = "0x9Dc0c9599c2407425CFda8310Fb57C12520Ba117"; // Replace with your actual contract address

const Login: React.FC = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

    // Initialize Web3 and Reconnect Wallet on Reload
    useEffect(() => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
  
        /* // Check for previously connected account
        const connectedAccount = localStorage.getItem("connectedAccount");
        if (connectedAccount) {
          setAccount(connectedAccount);
        } */
      } else {
        setError("Please install Metamask to proceed.");
      }
    }, []);

  // Disconnect Wallet
  const disconnectWallet = () => {
    setAccount(null);
    localStorage.removeItem("connectedAccount"); // Clear account from localStorage
    setError(null);
    //alert("Wallet disconnected!");
  };


 // Connect Wallet with Account Selection Modal
 const connectWallet = async () => {
  if (!web3 || !window.ethereum) {
    setError("Web3 is not initialized.");
    return;
  }
    try {
      //localStorage.removeItem("connectedAccount"); // Clear previous connections
      // Request account access from Metamask
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const userAccount = accounts[0]; // Get the first account from Metamask
      setAccount(userAccount);
      localStorage.setItem("connectedAccount", userAccount); // Save account to localStorage
      setError(null);

      // Create a contract instance to check the role of the user
      const roleManagementContract = new web3.eth.Contract(
        RoleManagementABI.abi,
        CONTRACT_ADDRESS
      );

      // Call the `isAdmin` method to check if the user is an Admin
      const isAdmin = await roleManagementContract.methods
        .isAdmin(userAccount)
        .call({ from: userAccount });

      if (isAdmin) {
        localStorage.setItem("userRole", "ADMIN_ROLE");
        console.log("Login successful! You are an Admin.");
        alert("Login successful! You are an Admin.");
        navigate("/admin-policy"); // Navigate to the admin dashboard
        return;
      }/* else {
        console.log("check access denied")
        alert("Access Denied: You are not a Admin.");
        disconnectWallet(); // Disconnect if the user does not have the role
      } */

      // Call the `isUser` method to check if the user has the POLICY_HOLDER_ROLE
      const isPolicyHolder = await roleManagementContract.methods
        .isUser(userAccount)
        .call({ from: userAccount });

      if (isPolicyHolder) {
        localStorage.setItem("userRole", "POLICY_HOLDER_ROLE");
        console.log("Login successful! You are a Policy Holder.");
        alert("Login successful! You are a Policy Holder.");
        navigate("/"); // Navigate to the home page
      } /* else {
        console.log("check access denied")
        alert("Access Denied: You are not a User.");
        disconnectWallet(); // Disconnect if the user does not have the role
      } */
    } catch (error: any) {
      if (error.code === 4001) {
        setError("Metamask connection was denied.");
      } else {
        console.error("Metamask connection error:", error);
        setError("Failed to connect to Metamask.");
      }
    }
  };

  // Navigate to Register Page
  const goToRegister = () => {
    navigate("/register");
  };

  return (
    <div
      className="relative w-full h-screen bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <Navbar />
      <div className="flex flex-col justify-center items-center h-full text-center text-white bg-black bg-opacity-50">
      <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Welcome to
        </h1>
        <h1 className="text-3xl font-bold text-center text-red-600 mb-6">DRIVEGUARD</h1>

        {error && (
          <p className="text-red-500 text-center font-medium mb-4">
            {error}
          </p>
        )}

          <button
            onClick={connectWallet}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded w-full mb-4"
          >
            Login with Metamask Wallet
          </button>

        <div className="flex justify-center items-center mt-4">
          <span className="text-gray-600 mr-2">Don't have an account?</span>
          <button
            onClick={goToRegister}
            className="text-indigo-500 font-semibold hover:underline"
          >
            Register
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
export default Login;