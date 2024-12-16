import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import PolicyManagementABI from '../../abis/PolicyManagement.json';
import NavbarAdmin from '../../components/NavbarAdmin';

const CONTRACT_ADDRESS = '0xE883AAB89149fC4c6E106644692626CF88875eeB';

const PolicyManagement: React.FC = () => {
  const [policyData, setPolicyData] = useState({
    insurancePlan: '',
    basePremiumRate: '',
    deductible: 0,
    insuranceCoverage: 0,
    thirdPartyLiability: 0,
    cover: '',
  });

  const [allPolicies, setAllPolicies] = useState<any[]>([]);
  const [policyCount, setPolicyCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newValue = name === 'deductible' || name === 'insuranceCoverage' || name === 'thirdPartyLiability'
      ? parseFloat(value) || 0
      : value;

    setPolicyData({ ...policyData, [name]: newValue });
  };

  // Create a new policy on the blockchain
  const createPolicy = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use this feature.');
      return;
    }

    if (!policyData.insurancePlan || !policyData.basePremiumRate || !policyData.cover) {
      setError('Please fill out all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      const contract = new web3.eth.Contract(PolicyManagementABI.abi, CONTRACT_ADDRESS);

      await contract.methods
        .createPolicy(
          policyData.insurancePlan,
          policyData.basePremiumRate,
          policyData.deductible,
          policyData.insuranceCoverage,
          policyData.thirdPartyLiability,
          policyData.cover.split(',').map(item => item.trim())
        )
        .send({ from: accounts[0] });

      alert('Policy Created Successfully!');
      await fetchAllPolicies();
      await fetchPolicyCount();
      resetForm();
    } catch (error: any) {
      console.error('Error creating policy:', error);
      setError('Failed to create policy. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all policies from the blockchain
  const fetchAllPolicies = async (): Promise<void> => {
    try {
      setLoading(true);
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(PolicyManagementABI.abi, CONTRACT_ADDRESS);
      const policies = await contract.methods.viewAllPolicies().call() as any[]; 

      // Convert numeric fields to proper numbers
      const formattedPolicies = policies.map((policy: any) => ({
        ...policy,
        policyID: Number(policy.policyID),
        deductible: Number(policy.deductible),
        insuranceCoverage: Number(policy.insuranceCoverage),
        thirdPartyLiability: Number(policy.thirdPartyLiability),
        cover: Array.isArray(policy.cover) ? policy.cover : [],
      }));

      setAllPolicies(formattedPolicies);
    } catch (error: any) {
      console.error('Error fetching policies:', error);
      setError('Failed to load policies. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

    // Fetch policy count from the blockchain
    const fetchPolicyCount = async (): Promise<void> => {
        try {
          const web3 = new Web3(window.ethereum);
          const contract = new web3.eth.Contract(PolicyManagementABI.abi, CONTRACT_ADDRESS);
          const count = await contract.methods.policyCount().call();
          if (count) {
            setPolicyCount(Number(count));
          } else {
            console.error('Failed to fetch policy count, count is undefined or null');
          }
        } catch (error: any) {
          console.error('Error fetching policy count:', error);
          setError('Failed to load policy count. Check console for details.');
        }
      };

  // Reset the policy form
  const resetForm = () => {
    setPolicyData({
      insurancePlan: '',
      basePremiumRate: '',
      deductible: 0,
      insuranceCoverage: 0,
      thirdPartyLiability: 0,
      cover: '',
    });
  };

  // Load all policies when the component mounts
  useEffect(() => {
    fetchAllPolicies();
    fetchPolicyCount();
  }, []);

  return (
    <div className="min-h-screen">
      <NavbarAdmin/>
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-center text-black-800 mb-10">Admin Policy Management</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6 text-center">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Create New Policy</h2>
          <div className="grid grid-cols-2 gap-6">
            {Object.keys(policyData).map((key) => (
              <div key={key}>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                <input 
                  name={key} 
                  value={(policyData as any)[key]} 
                  onChange={handleChange} 
                  className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            ))}
          </div>

          <button 
            onClick={createPolicy} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 mt-6 rounded-lg transition duration-300"
          >
            {loading ? 'Creating Policy...' : 'Create Policy'}
          </button>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All Created Policies</h2>
          <p className="font-semibold text-lg mb-6 text-blue-700">
            Total Policies Created: {policyCount}
          </p>

          {loading ? (
            <div className="text-center">
              <p>Loading policies...</p>
            </div>
          ) : allPolicies.length === 0 ? (
            <p className="text-center">No policies created yet.</p>
          ) : (
            <table className="table-auto w-full border-collapse">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="p-3 text-left">Policy ID</th>
                  <th className="p-3 text-left">Insurance Plan</th>
                  <th className="p-3 text-left">Premium Rate</th>
                  <th className="p-3 text-left">Deductible</th>
                  <th className="p-3 text-left">Coverage</th>
                  <th className="p-3 text-left">Third Party Liability</th>
                  <th className="p-3 text-left">Cover</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {allPolicies.map((policy, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="p-3">{policy.policyID}</td>
                    <td className="p-3">{policy.insurancePlan}</td>
                    <td className="p-3">{policy.basePremiumRate}</td>
                    <td className="p-3">{policy.deductible}</td>
                    <td className="p-3">{policy.insuranceCoverage}</td>
                    <td className="p-3">{policy.thirdPartyLiability}</td>
                    <td className="p-3">{policy.cover.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolicyManagement;