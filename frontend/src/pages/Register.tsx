import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Web3 from "web3";
import Navbar from "../components/Navbar";
import bgImage from "../picture/cardrive.jpg";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseconfig"
import RoleManagementABI from "../abis/RoleManagement.json"

const CONTRACT_ADDRESS = "0x9Dc0c9599c2407425CFda8310Fb57C12520Ba117";

const Register: React.FC = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({  
    firstName: "",
    lastName: "",
    email: "",
  });
  const navigate = useNavigate();

   // Initialize Web3 and Reconnect Wallet on Reload
   useEffect(() => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      // Check for previous connection
      const connectedAccount = localStorage.getItem("connectedAccount");
      if (connectedAccount) {
        setAccount(connectedAccount);
      }
    } else {
      setError("Please install Metamask to proceed.");
    }
  }, []);

  // Connect wallet
  const connectWallet = async () => {
    if (web3 && window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [
            {
              eth_accounts: {},
            },
          ],
        });
  
        // Request accounts from Metamask
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
  
        setAccount(accounts[0]);
        setError(null);
      } catch (err) {
        console.error("Metamask connection error:", err);
        setError("Failed to connect to Metamask.");
      }
    } else {
      setError("Web3 is not initialized.");
    }
  };
  

   // Disconnect Wallet
   const disconnectWallet = () => {
    setAccount(null);
    localStorage.removeItem("connectedAccount"); // Clear wallet from localStorage
    setError(null);
    alert("Wallet disconnected!");
  };


  // Handle Form Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle Form Submission
  const handleRegister = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }

    if (!formData.firstName || !formData.email || !formData.lastName) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      // Save user data to Firestore
      await setDoc(doc(db, "Users", account), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        walletAddress: account,
        role: "POLICY_HOLDER_ROLE",
      });

      // Interact with the smart contract
      if (web3) {
        const roleManagementContract = new web3.eth.Contract(
          RoleManagementABI.abi,
          CONTRACT_ADDRESS
        );

        await roleManagementContract.methods
          .addUser(account)
          .send({ from: account });

        alert("Registration successful! User added as POLICY_HOLDER.");
        localStorage.setItem("userRole", "POLICY_HOLDER_ROLE");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alert("Error during registration. Check console for details.");
    }
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
            Create Your Account
          </h1>
          <h1 className="text-3xl font-bold text-center text-red-600 mb-6">
            DRIVEGUARD
          </h1>

          {error && (
            <p className="text-red-500 text-center font-medium mb-4">
              {error}
            </p>
          )}

          {account ? (
            <>
              <p className="text-gray-600 text-center text-sm mb-4">
                Connected Wallet: <strong>{account}</strong>
              </p>
              <form className="space-y-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full mt-1 p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500 text-black bg-white"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full mt-1 p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500 text-black bg-white"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full mt-1 p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500 text-black bg-white"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRegister}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded w-full"
                >
                  Register
                </button>
              </form>
              <button
                type="button"
                onClick={disconnectWallet}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded w-full mt-4"
              >
                Disconnect Wallet
              </button>
            </>
          ) : (
            <button
              onClick={connectWallet}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded w-full mb-4"
            >
              Register with Metamask Wallet
            </button>
          )}

          <div className="flex justify-center items-center mt-4">
            <span className="text-gray-600 mr-2">Already have an account?</span>
            <button
              onClick={() => navigate("/login")}
              className="text-indigo-500 font-semibold hover:underline"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
