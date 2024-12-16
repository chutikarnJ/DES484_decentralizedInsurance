import React, { useState, useEffect } from "react";
import Web3 from "web3";
import ClaimManagementABI from "../../abis/ClaimManagement.json";
import NavbarAdmin from "../../components/NavbarAdmin";

const CLAIM_MANAGEMENT_ADDRESS = "0x46e011653866841aFeaBa33C6eb9eE18E5817f96";

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
  const [totalClaims, setTotalClaims] = useState<number>(0); // 🔥 Store the total claims count
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string>("");
  const [payoutAmounts, setPayoutAmounts] = useState<{ [key: number]: string }>({});

  const loadAdminAccount = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      console.log("Connected Account:", accounts[0]); // 🟢 Only log once
      setAccount(accounts[0]);
      await fetchAllClaims(accounts[0]); // Pass the account as an argument
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError("Please connect your MetaMask wallet to view and manage claims.");
    }
  };


  // 🔥 Fetch all claims from the contract
  const fetchAllClaims = async (account: string) => {
    try {
      setLoading(true);
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(
        ClaimManagementABI.abi,
        CLAIM_MANAGEMENT_ADDRESS
      );


      const claimsData: any = await contract.methods.viewAllClaims().call({ from: account });
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

      // 🔥 Update total claim count
      setTotalClaims(formattedClaims.length); // Count the total number of claims
      
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
      fetchAllClaims(account); // Refresh the claims list
    } catch (error) {
      console.error("Error reviewing claim:", error);
      alert("Failed to review the claim. Please try again.");
    } finally {
      setLoading(false);
    }
  };
 

   // 🔥 useEffect - Load wallet once and fetch claims
   useEffect(() => {
    loadAdminAccount(); // Call loadAdminAccount only once
  }, []);

  return (
    <div className="min-h-screen">
      <NavbarAdmin />
      <div className="container mx-auto mt-10">
        <h1 className="text-4xl font-bold text-center text-black-800">Admin Claims Management</h1>

        {loading && (
          <div className="flex justify-center items-center mt-10">
            <div className="spinner-border animate-spin inline-block w-12 h-12 border-4 border-blue-500 rounded-full"></div>
            <p className="ml-4 text-blue-700 text-xl">Loading claims...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-6 text-center">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="bg-white p-6 mt-10 text-center rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-700">Total Claims</h2>
          <p className="text-5xl font-extrabold text-blue-700 mt-2">{totalClaims}</p>
        </div>

        {claims.length > 0 && (
          <div className="overflow-x-auto mt-10">
            <table className="min-w-full table-auto bg-white border-collapse border border-gray-200 rounded-lg shadow-lg">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Claim ID</th>
                  <th className="px-6 py-4 text-left">Policy ID</th>
                  <th className="px-6 py-4 text-left">Claimant</th>
                  <th className="px-6 py-4 text-left">Claim Type</th>
                  <th className="px-6 py-4 text-left">Incident Date</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Payout (ETH)</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-blue-50">
                    <td className="px-6 py-4 border-t">{claim.id}</td>
                    <td className="px-6 py-4 border-t">{claim.policyID}</td>
                    <td className="px-6 py-4 border-t">{claim.claimant}</td>
                    <td className="px-6 py-4 border-t">{claim.claimType}</td>
                    <td className="px-6 py-4 border-t">{claim.incidentDate}</td>
                    <td className="px-6 py-4 border-t">
                      <span className={`px-2 py-1 text-sm font-bold rounded-full ${
                        claim.status === 'Pending' ? 'bg-yellow-200 text-yellow-800' :
                        claim.status === 'Approved' ? 'bg-green-200 text-green-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-t">{claim.payoutAmountETH} ETH</td>
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
