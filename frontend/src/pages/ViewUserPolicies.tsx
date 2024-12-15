import React, { useState, useEffect, useCallback } from "react";
import Web3 from "web3";
import Navbar from "../components/Navbar";
import PolicyManagementABI from "../abis/PolicyManagement.json";

const POLICY_MANAGEMENT_ADDRESS = "0xE883AAB89149fC4c6E106644692626CF88875eeB";

interface UserPolicy {
    policyID: string;
    premiumPriceETH: string;
    dueDate: string;
    insurancePlan: string;
    coverage: string;
    deductible: string;
    thirdPartyLiability: string;
    cover: string;
  }

const ViewUserPolicies: React.FC = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  
  useEffect(() => {
    loadUserAccount();
  }, []);

 // 🔥 Connect the user's wallet and set their address
  const loadUserAccount = useCallback(async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      setAccount(accounts[0]);
      await fetchUserPolicies(accounts[0]); // Fetch policies after wallet connection
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError("Please connect your MetaMask wallet to view your policies.");
    }
  }, []);


const fetchUserPolicies = async (userAddress: string): Promise<void> => {
  try {
    setLoading(true);
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(
      PolicyManagementABI.abi,
      POLICY_MANAGEMENT_ADDRESS
    );

    // 💡 Call the contract and type the result as UserPolicyData (a tuple of 3 arrays)
     const userPolicyData: any = await contract.methods.getUserSelectedPolicies(userAddress).call();

    console.log('Raw userPolicyData:', userPolicyData);

    if (!userPolicyData) {
      setError("No data returned from getUserSelectedPolicies");
      setLoading(false);
      return;
    }


    // 💡 Handle both array-style and property-style access
    const policyIDs: bigint[] = userPolicyData[0] || userPolicyData.policyIDs || [];
    const premiumPricesETH: bigint[] = userPolicyData[1] || userPolicyData.premiumPricesETH || [];
    const dueDates: bigint[] = userPolicyData[2] || userPolicyData.dueDates || [];

   // 💡 Get full policy details for each policyID
   // Get full policy details for each policyID
   const formattedPolicies: UserPolicy[] = await Promise.all(
    policyIDs.map(async (policyID, index) => {
      const policyDetails = await fetchPolicyDetails(policyID.toString());

      return {
        policyID: policyID.toString(),
        premiumPriceETH: Web3.utils.fromWei(premiumPricesETH[index].toString(), "ether"),
        dueDate: formatDate(Number(dueDates[index].toString())),
        insurancePlan: policyDetails.insurancePlan,
        coverage: policyDetails.insuranceCoverage.toString(),
        deductible: policyDetails.deductible.toString(),
        thirdPartyLiability: policyDetails.thirdPartyLiability.toString(),
        cover: policyDetails.cover.join(", ")
      };
    })
  );


    setPolicies(formattedPolicies);
  } catch (error: any) {
    console.error("Error fetching user policies:", error);
    setError("Failed to load policies. Please try again later.");
  } finally {
    setLoading(false);
  }
};
  
 // Define the structure of a PolicyDetails
interface PolicyDetails {
    policyID: string;
    insurancePlan: string;
    basePremiumRate: string;
    deductible: string;
    insuranceCoverage: string;
    thirdPartyLiability: string;
    cover: string[];
  }
  
  const fetchPolicyDetails = async (policyID: string): Promise<PolicyDetails> => {
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(PolicyManagementABI.abi, POLICY_MANAGEMENT_ADDRESS);
      
      // Cast the response to a known array tuple type
      const policyDetails = await contract.methods.viewPolicy(policyID).call() as [
        string,  // policyID
        string,  // insurancePlan
        string,  // basePremiumRate
        string,  // deductible
        string,  // insuranceCoverage
        string,  // thirdPartyLiability
        string[] // cover (an array of strings)
      ];
  
      console.log(`📜 Policy Details for PolicyID ${policyID}:`, policyDetails);
      
      // Return the structured PolicyDetails object
      return {
        policyID: policyDetails[0],
        insurancePlan: policyDetails[1],
        basePremiumRate: policyDetails[2],
        deductible: policyDetails[3],
        insuranceCoverage: policyDetails[4],
        thirdPartyLiability: policyDetails[5],
        cover: policyDetails[6],
      };
    } catch (error) {
      console.error(`🚨 Error fetching policy details for PolicyID ${policyID}:`, error);
      throw new Error("Failed to load policy details.");
    }
  };

  // 🔥 Utility function to format the due date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000); // Convert UNIX timestamp to JS Date
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // 🔥 Handle wallet connection
  const connectWallet = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      setAccount(accounts[0]);
      fetchUserPolicies(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError("Please connect your MetaMask wallet to view your policies.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-4xl mt-8 bg-white shadow-lg p-6 rounded-lg">
        <h1 className="text-3xl font-bold text-center mb-8">My Insurance Policies</h1>

        {account ? (
          <p className="text-gray-600 mb-4 text-center">Connected Wallet: {account}</p>
        ) : (
          <button
            onClick={connectWallet}
            className="bg-blue-500 text-white py-2 px-4 rounded"
          >
            Connect Wallet
          </button>
        )}

        {loading && <p>Loading your policies...</p>}

        {error && <p className="text-red-500">{error}</p>}

        {policies.length === 0 && !loading && (
          <p className="text-gray-600 text-center">You do not have any policies yet.</p>
        )}

        {policies.length > 0 && (
          <div className="overflow-x-auto mt-6">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
              <thead>
                <tr className="bg-blue-600 text-white uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Policy ID</th>
                  <th className="py-3 px-6 text-left">Insurance Plans</th>
                  <th className="py-3 px-6 text-left">Premium (ETH)</th>
                  <th className="py-3 px-6 text-left">Next Due Date</th>
                  <th className="py-3 px-6 text-left">Coverage (USD)</th>
                  <th className="py-3 px-6 text-left">Deductoble (USD)</th>
                  <th className="py-3 px-6 text-left">3rd Party Liability (USD)</th>
                  <th className="py-3 px-6 text-left">Cover</th>
                  
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm font-medium">
                {policies.map((policy) => (
                  <tr key={policy.policyID} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6">{policy.policyID}</td>
                    <td className="py-3 px-6">{policy.insurancePlan}</td>
                    <td className="py-3 px-6">{policy.premiumPriceETH} ETH</td>
                    <td className="py-3 px-6">{policy.dueDate}</td>
                    <td className="py-3 px-6">{policy.coverage}</td>
                    <td className="py-3 px-6">{policy.deductible}</td>
                    <td className="py-3 px-6">{policy.thirdPartyLiability}</td>
                    <td className="py-3 px-6">{policy.cover}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewUserPolicies;
