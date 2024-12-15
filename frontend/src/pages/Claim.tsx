import React, { useState, useEffect } from "react";
import Web3 from "web3";
import Navbar from "../components/Navbar";
//import CarInsuranceClaimSystemABI from "../abis/CarInsuranceClaimSystem.json";
import PolicyManagementABI from "../abis/PolicyManagement.json";

const CLAIM_SYSTEM_ADDRESS = "YOUR_CLAIM_SYSTEM_CONTRACT_ADDRESS_HERE";
const POLICY_MANAGEMENT_ADDRESS = "0xE883AAB89149fC4c6E106644692626CF88875eeB";

interface Claim {
  id: string;
  policy: string;
  incidentDate: string;
  details: string;
  status: string;
  timestamp: string;
}

interface UserPolicy {
  policyID: string;
  insurancePlan: string;
  coverage: string;
  deductible: string;
  thirdPartyLiability: string;
}

const ClaimPage: React.FC = () => {
  const [policyID, setPolicyID] = useState<string>("");
  const [userPolicies, setUserPolicies] = useState<UserPolicy[]>([]);
  const [incidentDate, setIncidentDate] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [coverType, setCoverType] = useState<string>("Own Damage");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 🔥 Connect to MetaMask on page load
  useEffect(() => {
    loadUserAccount();
  }, []);

  const loadUserAccount = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      setAccount(accounts[0]);
      fetchUserPolicies(accounts[0]);
      fetchClaims(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError("Please connect your MetaMask wallet to view and submit claims.");
    }
  };

  const fetchUserPolicies = async (userAddress: string) => {
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(
        PolicyManagementABI.abi,
        POLICY_MANAGEMENT_ADDRESS
      );

      const userPolicyData = await contract.methods.getUserSelectedPolicies(userAddress).call();
      const policyIDs: bigint[] = userPolicyData[0] || [];
      const formattedPolicies: UserPolicy[] = await Promise.all(
        policyIDs.map(async (policyID) => {
          const policyDetails = await contract.methods.viewPolicy(policyID).call();
          return {
            policyID: policyDetails[0],
            insurancePlan: policyDetails[1],
            coverage: policyDetails[4].toString(),
            deductible: policyDetails[3].toString(),
            thirdPartyLiability: policyDetails[5].toString(),
          };
        })
      );
      setUserPolicies(formattedPolicies);
    } catch (error) {
      console.error("Error fetching user policies:", error);
      setError("Failed to load user policies. Please try again later.");
    }
  };

  const uploadFilesToIPFS = async (files: File[]): Promise<string[]> => {
    const hashes: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
          method: "POST",
          body: formData,
          headers: {
            "pinata_api_key": "YOUR_PINATA_API_KEY",
            "pinata_secret_api_key": "YOUR_PINATA_SECRET_API_KEY",
          },
        });
        const data = await response.json();
        hashes.push(data.IpfsHash);
      } catch (error) {
        console.error(`Error uploading file: ${file.name}`, error);
      }
    }
    return hashes;
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyID || !incidentDate || !details || evidenceFiles.length === 0) {
      alert("Please fill in all fields and upload at least one evidence file.");
      return;
    }

    try {
      setLoading(true);
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      const contract = new web3.eth.Contract(
        CarInsuranceClaimSystemABI.abi,
        CLAIM_SYSTEM_ADDRESS
      );

      const ipfsHashes = await uploadFilesToIPFS(evidenceFiles);
      if (ipfsHashes.length === 0) {
        throw new Error("Failed to upload evidence files.");
      }

      await contract.methods
        .submitClaim(
          policyID,
          incidentDate,
          details,
          [coverType],
          ipfsHashes
        )
        .send({ from: accounts[0] });

      alert("Claim submitted successfully!");
      fetchClaims(accounts[0]);
    } catch (error) {
      console.error("Error submitting claim:", error);
      alert("Failed to submit claim. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setEvidenceFiles(files);
  };

  const fetchClaims = async (userAddress: string) => {
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(
        CarInsuranceClaimSystemABI.abi,
        CLAIM_SYSTEM_ADDRESS
      );

      const totalClaims = await contract.methods.claimCount().call();
      const userClaims: Claim[] = [];

      for (let i = 1; i <= totalClaims; i++) {
        const claim = await contract.methods.viewClaimStatus(i).call();
        if (claim.claimant.toLowerCase() === userAddress.toLowerCase()) {
          userClaims.push({
            id: claim.id,
            policy: claim.policy,
            incidentDate: claim.incidentDate,
            details: claim.details,
            status: claim.status,
            timestamp: new Date(claim.timestamp * 1000).toLocaleString(),
          });
        }
      }
      setClaims(userClaims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      setError("Failed to load claims. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto mt-10">
        <h1 className="text-3xl font-bold text-center">Submit a Claim</h1>

        <form onSubmit={handleSubmitClaim} className="bg-white p-6 mt-6 rounded-lg shadow-md space-y-6">
          <select
            className="w-full p-2 border rounded"
            value={policyID}
            onChange={(e) => setPolicyID(e.target.value)}
            required
          >
            <option value="">Select a Policy</option>
            {userPolicies.map((policy) => (
              <option key={policy.policyID} value={policy.policyID}>
                {policy.insurancePlan} - {policy.coverage} USD
              </option>
            ))}
          </select>

          <input className="w-full p-2 border rounded" type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} required />
          <textarea className="w-full p-2 border rounded" placeholder="Details of the incident" value={details} onChange={(e) => setDetails(e.target.value)} required />
          <input type="file" multiple onChange={handleFileUpload} className="w-full p-2 border rounded" />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded-lg w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Claim"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClaimPage;
