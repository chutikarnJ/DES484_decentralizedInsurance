import React, { useState, useEffect } from "react";
import Web3 from "web3";
import ClaimManagementABI from "../../abis/ClaimManagement.json";
import NavbarAdmin from "../../components/NavbarAdmin";

const CLAIM_MANAGEMENT_ADDRESS = "0xb4a360d65a0fA07B58CB81b79198890428B29F28";

interface Claim {
  id: number;
  claimant: string;
  policyID: number;
  claimType: string;
  incidentDate: string;
  details: string;
  status: string;
  timestamp: string;
  payoutAmountETH: string;
}

const AdminClaims: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string>("");
  const [payoutAmounts, setPayoutAmounts] = useState<{ [key: number]: string }>({}); // Tracks payout input for each claim

  // Connect to MetaMask and fetch all claims
  useEffect(() => {
    loadAdminAccount();
  }, []);

  // 🔥 Connect MetaMask and set the user's wallet
  const loadAdminAccount = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      setAccount(accounts[0]);
      await fetchAllClaims();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError("Please connect your MetaMask wallet to view and manage claims.");
    }
  };

  // 🔥 Fetch all claims from the contract
  const fetchAllClaims = async () => {
    try {
      setLoading(true);
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(
        ClaimManagementABI.abi,
        CLAIM_MANAGEMENT_ADDRESS
      );

      const claimsData: any = await contract.methods.viewAllClaims().call();
      console.log("All Claims: ", claimsData);

      const formattedClaims: Claim[] = claimsData.map((claim: any) => ({
        id: parseInt(claim.id),
        claimant: claim.claimant,
        policyID: parseInt(claim.policyID),
        claimType: claim.claimType,
        incidentDate: claim.incidentDate,
        details: claim.details,
        status: mapClaimStatus(claim.status),
        timestamp: new Date(parseInt(claim.timestamp) * 1000).toLocaleString(),
        payoutAmountETH: Web3.utils.fromWei(claim.payoutAmountETH, "ether"),
      }));

      setClaims(formattedClaims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      setError("Failed to load claims. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Map claim status from enum to readable text
  const mapClaimStatus = (status: string) => {
    if (status === "0") return "Pending";
    if (status === "1") return "Approved";
    if (status === "2") return "Rejected";
    return "Unknown";
  };

  // 🔥 Handle payout input change for each claim
  const handlePayoutInputChange = (claimId: number, value: string) => {
    setPayoutAmounts((prevAmounts) => ({
      ...prevAmounts,
      [claimId]: value,
    }));
  };

  // 🔥 Handle claim review (approve or reject)
  const reviewClaim = async (claimId: number, approve: boolean) => {
    try {
      const payoutAmountUSD = parseFloat(payoutAmounts[claimId]) || 0;

      if (approve && payoutAmountUSD <= 0) {
        alert("Please enter a valid payout amount before approving.");
        return;
      }

      setLoading(true);
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(
        ClaimManagementABI.abi,
        CLAIM_MANAGEMENT_ADDRESS
      );

      await contract.methods
        .reviewClaim(claimId, approve, payoutAmountUSD)
        .send({ from: account });

      alert(`Claim ${approve ? "approved" : "rejected"} successfully!`);
      fetchAllClaims(); // Refresh the claims list
    } catch (error) {
      console.error("Error reviewing claim:", error);
      alert("Failed to review the claim. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
         <NavbarAdmin/>
      <div className="container mx-auto mt-10">
        <h1 className="text-3xl font-bold text-center">Admin Claims Management</h1>

        {account ? (
          <p className="text-gray-600 mb-4 text-center">Connected Wallet: {account}</p>
        ) : (
          <button
            onClick={loadAdminAccount}
            className="bg-blue-500 text-white py-2 px-4 rounded"
          >
            Connect Wallet
          </button>
        )}

        {loading && <p>Loading claims...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {claims.length > 0 && (
          <div className="overflow-x-auto mt-6">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th>Claim ID</th>
                  <th>Policy ID</th>
                  <th>Claimant</th>
                  <th>Claim Type</th>
                  <th>Incident Date</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Submitted On</th>
                  <th>Payout (USD)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm font-medium">
                {claims.map((claim) => (
                  <tr key={claim.id} className="border-b border-gray-200">
                    <td>{claim.id}</td>
                    <td>{claim.policyID}</td>
                    <td>{claim.claimant}</td>
                    <td>{claim.claimType}</td>
                    <td>{claim.incidentDate}</td>
                    <td>{claim.details}</td>
                    <td>{claim.status}</td>
                    <td>{claim.timestamp}</td>
                    <td>
                      <input
                        type="number"
                        className="border rounded p-1"
                        value={payoutAmounts[claim.id] || ""}
                        onChange={(e) =>
                          handlePayoutInputChange(claim.id, e.target.value)
                        }
                        placeholder="Enter USD amount"
                      />
                    </td>
                    <td>
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                        onClick={() => reviewClaim(claim.id, true)}
                      >
                        Approve
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded"
                        onClick={() => reviewClaim(claim.id, false)}
                      >
                        Reject
                      </button>
                    </td>
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

export default AdminClaims;
