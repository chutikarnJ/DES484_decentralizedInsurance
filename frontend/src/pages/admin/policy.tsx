import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import PolicyManagementABI from '../../abis/PolicyManagement.json';

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
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Admin Policy Management</h1>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">{error}</div>}

      {/* Policy Creation Form */}
      <div className="p-6 bg-white rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4">Create New Policy</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold">Insurance Plan *</label>
            <input 
              name="insurancePlan" 
              placeholder="e.g. Comprehensive" 
              value={policyData.insurancePlan} 
              onChange={handleChange} 
              className="p-3 border rounded w-full" 
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Base Premium Rate *</label>
            <input 
              name="basePremiumRate" 
              placeholder="e.g. 200" 
              value={policyData.basePremiumRate} 
              onChange={handleChange} 
              className="p-3 border rounded w-full" 
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Deductible (in USD) *</label>
            <input 
              name="deductible" 
              placeholder="e.g. 500" 
              value={policyData.deductible} 
              type="number" 
              onChange={handleChange} 
              className="p-3 border rounded w-full" 
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Insurance Coverage (in USD) *</label>
            <input 
              name="insuranceCoverage" 
              placeholder="e.g. 100000" 
              value={policyData.insuranceCoverage} 
              type="number" 
              onChange={handleChange} 
              className="p-3 border rounded w-full" 
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Third Party Liability (in USD) *</label>
            <input 
              name="thirdPartyLiability" 
              placeholder="e.g. 100000" 
              value={policyData.thirdPartyLiability} 
              type="number" 
              onChange={handleChange} 
              className="p-3 border rounded w-full" 
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Cover (comma separated)</label>
            <input 
              name="cover" 
              placeholder="e.g. Fire, Theft, Natural Disasters" 
              value={policyData.cover} 
              onChange={handleChange} 
              className="p-3 border rounded w-full" 
            />
          </div>
        </div>

        <button 
          onClick={createPolicy} 
          className="w-full mt-4 p-3 bg-blue-600 text-white font-bold rounded"
        >
          {loading ? 'Creating Policy...' : 'Create Policy'}
        </button>
      </div>

      {/* View All Policies */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">All Created Policies</h2>
        <p className="font-semibold text-lg mb-4">
          Total Policies Created: <span className="text-blue-600">{policyCount}</span>
        </p>

         {loading ? (
          <p>Loading policies...</p>
        ) : allPolicies.length === 0 ? (
          <p>No policies created yet.</p>
        ) : (
          <table className="table-auto w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th>ID</th>
                <th>Insurance Plan</th>
                <th>Premium Rate</th>
                <th>Deductible</th>
                <th>Coverage</th>
                <th>Third Party Liability</th>
                <th>Cover</th>
              </tr>
            </thead>
            <tbody>
              {allPolicies.map((policy, index) => (
                <tr key={index} className="text-center border-t">
                  <td>{policy.policyID}</td>
                  <td>{policy.insurancePlan}</td>
                  <td>{policy.basePremiumRate}</td>
                  <td>{policy.deductible}</td>
                  <td>{policy.insuranceCoverage}</td>
                  <td>{policy.thirdPartyLiability}</td>
                  <td>{policy.cover ? policy.cover.join(', ') : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PolicyManagement;