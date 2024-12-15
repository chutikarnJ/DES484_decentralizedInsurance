import React, { useState, useEffect } from "react";
import Web3 from "web3";
import Navbar from "../components/Navbar";
import ClaimManagementABI from "../abis/ClaimManagement.json";
import PolicyManagementABI from "../abis/PolicyManagement.json";

const CLAIM_MANAGEMENT_ADDRESS = "0xb4a360d65a0fA07B58CB81b79198890428B29F28";
const POLICY_MANAGEMENT_ADDRESS = "0xE883AAB89149fC4c6E106644692626CF88875eeB";

interface Policy {
  policyID: string;
  insurancePlan: string;
  cover: string[];
}

interface Claim {
  id: string;
  policyID: string;
  claimType: string;
  status: string;
  payoutAmountETH: string;
}

interface PolicyDetails {
  insurancePlan: string;
  cover: string[];
}

const ClaimPage: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<string>("");
  const [claimType, setClaimType] = useState<string>("");
  const [incidentDate, setIncidentDate] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [account, setAccount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [coverOptions, setCoverOptions] = useState<string[]>([]);

  useEffect(() => {
    loadUserAccount();
  }, []);

  // 🔥 Load User Account
  const loadUserAccount = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      setAccount(accounts[0]);
      await fetchUserPolicies(accounts[0]);
      await fetchUserClaims(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  // 🔥 Fetch User Policies
  const fetchUserPolicies = async (userAddress: string) => {
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(PolicyManagementABI.abi, POLICY_MANAGEMENT_ADDRESS);
      const userPolicyData: any = await contract.methods.getUserSelectedPolicies(userAddress).call();

      if (userPolicyData && Array.isArray(userPolicyData[0])) {
        const formattedPolicies = await Promise.all(
          userPolicyData[0].map(async (policyID: bigint | string) => {
            try {
              const policyIDStr = policyID.toString();
              const policyDetails = await contract.methods.viewPolicy(policyIDStr).call() as PolicyDetails;
              if (!policyDetails) {
                console.error(`Policy details not found for PolicyID: ${policyIDStr}`);
                return null;
              }
              return {
                policyID: policyIDStr,
                insurancePlan: policyDetails.insurancePlan,
                cover: policyDetails.cover,
              };
            } catch (error) {
              console.error(`Error fetching policy details for PolicyID: ${policyID}`, error);
              return null;
            }
          })
        );

        setPolicies(formattedPolicies.filter(Boolean) as Policy[]);
      }
    } catch (error) {
      console.error("Error fetching user policies:", error);
    }
  };

  // 🔥 Handle Policy Selection and Load Available Covers
  const handlePolicySelect = (policyID: string) => {
    console.log("select policy with ID:", policyID);
    
    const selectedPolicy = policies.find((policy) => policy.policyID === policyID);
    if (selectedPolicy) {
      console.log("Selected Policy:", selectedPolicy);
      setSelectedPolicy(policyID);
      setCoverOptions(selectedPolicy.cover);
      
      if (selectedPolicy.cover.length > 0) {
        setClaimType(selectedPolicy.cover[0]); // Set the first cover as default
      }
    } else {
      console.warn(`No policy found with ID: ${policyID}. Available policies:`, policies);
    }
  };

  // 🔥 Handle Claim Submission
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(ClaimManagementABI.abi, CLAIM_MANAGEMENT_ADDRESS);

      await contract.methods
        .submitClaim(selectedPolicy, claimType, incidentDate, details)
        .send({ from: account ?? undefined });

      alert("Claim submitted successfully!");
      await fetchUserClaims(account[0]);
    } catch (error) {
      console.error("Error submitting claim:", error);
      alert("Failed to submit claim. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserClaims = async (userAddress: string) => {
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(ClaimManagementABI.abi, CLAIM_MANAGEMENT_ADDRESS);
      const userClaims: any[] = await contract.methods.viewUserClaims().call({ from: userAddress });
      const formattedClaims = userClaims.map((claim: any) => ({
        id: claim.id.toString(),
        policyID: claim.policyID.toString(),
        claimType: claim.claimType,
        incidentDate: claim.incidentDate,
        details: claim.details,
        status: claim.status === "0" ? "Pending" : claim.status === "1" ? "Approved" : "Rejected",
        payoutAmountETH: Web3.utils.fromWei(claim.payoutAmountETH.toString(), "ether"),
      }));
      setClaims(formattedClaims);
    } catch (error) {
      console.error("Error fetching claims:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <h1 className="text-3xl font-bold text-center mt-6">Submit a Claim</h1>

      <form onSubmit={handleSubmitClaim} className="bg-white p-6 mt-6 rounded-lg shadow-md space-y-4">
        
      <select 
  value={selectedPolicy} 
  onChange={(e) => handlePolicySelect(e.target.value)} 
  className="form-select"
>
  <option value="">Select Policy</option>
  {policies.map((policy) => (
    <option key={policy.policyID} value={policy.policyID}>
      {`Policy ID: ${policy.policyID} - ${policy.insurancePlan}`}
    </option>
  ))}
</select>

        <select value={claimType} onChange={(e) => setClaimType(e.target.value)} required className="w-full p-2 border rounded">
          <option value="">Select Claim Type</option>
          {coverOptions.map((type, index) => (
            <option key={index} value={type}>
              {type}
            </option>
          ))}
        </select>

        <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} required className="w-full p-2 border rounded" />

        <textarea 
          placeholder="Details of the incident" 
          value={details} 
          onChange={(e) => setDetails(e.target.value)} 
          required 
          className="w-full p-2 border rounded"
        />

<button 
          type="submit" 
          className="bg-blue-500 text-white mt-4 p-2 rounded-lg"
        >
          Submit Claim
        </button>
      </form>

      <h2 className="text-2xl font-bold mt-10">My Claims</h2>

      <div className="overflow-x-auto mt-4">
        <table className="w-full border-collapse bg-white rounded-lg shadow-lg">
          <thead className="bg-blue-500 text-white">
            <tr>
              <th className="py-3 px-6 text-left">Claim ID</th>
              <th className="py-3 px-6 text-left">Policy</th>
              <th className="py-3 px-6 text-left">Type</th>
              <th className="py-3 px-6 text-left">Status</th>
              <th className="py-3 px-6 text-left">Payout</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {claims.map((claim) => (
              <tr key={claim.id} className="border-b">
                <td className="py-3 px-6">{claim.id}</td>
                <td className="py-3 px-6">{claim.policyID}</td>
                <td className="py-3 px-6">{claim.claimType}</td>
                <td className="py-3 px-6">{claim.status}</td>
                <td className="py-3 px-6">{claim.payoutAmountETH} ETH</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


export default ClaimPage;