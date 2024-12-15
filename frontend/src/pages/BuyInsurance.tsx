import React, { useState, useEffect } from "react";
import Web3 from "web3";
import Navbar from "../components/Navbar";
import PolicyManagementABI from "../abis/PolicyManagement.json";
import PremiumCollectionABI from "../abis/PremiumCollection.json";
import { calculateRiskFactor } from "../data/calculatePremium";
import carData from "../data/carData"; // Mock data for car brands, models, and prices

const POLICY_MANAGEMENT_ADDRESS = "0xE883AAB89149fC4c6E106644692626CF88875eeB";
const PREMIUM_COLLECTION_ADDRESS = "0xF9baDbBD072d1989533578E3056CD70baA95F427";

const BuyInsurance: React.FC = () => {
  const [userData, setUserData] = useState({
    carBrand: "",
    carModel: "",
    manufacturedYear: "",
    carCamera: "",
    carUsageType: "",
    vehicleAge: "",
    claimHistory: "",
    location: "",
    carPrice: "",
  });

  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPolicies, setShowPolicies] = useState(false); // Controls whether to show policies

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (
      name === "carBrand" ||
      name === "carModel" ||
      name === "manufacturedYear"
    ) {
      const updatedData = {
        ...userData,
        [name]: value,
        carPrice: "", // Reset carPrice if any of these fields change
      };

      if (
        updatedData.carBrand &&
        updatedData.carModel &&
        updatedData.manufacturedYear
      ) {
        const selectedCar = carData.find(
          (car) => car.brand === updatedData.carBrand
        );
        const selectedModel = selectedCar?.models.find(
          (model) => model.name === updatedData.carModel
        );
        const selectedYear = selectedModel?.years.find(
          (year) => year.year.toString() === updatedData.manufacturedYear
        );

        updatedData.carPrice = selectedYear
          ? selectedYear.price.toString()
          : "N/A";
      }

      setUserData(updatedData);
    } else {
      setUserData({ ...userData, [name]: value });
    }
  };

  const calculatePremium = (
    basePremiumRate: number,
    carPrice: number,
    riskFactor: number
  ) => {
    return Math.round(basePremiumRate * carPrice * riskFactor);
  };

  const fetchAllPolicies = async (): Promise<void> => {
    try {
      setLoading(true);
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(
        PolicyManagementABI.abi,
        POLICY_MANAGEMENT_ADDRESS
      );
      const allPolicies = (await contract.methods
        .viewAllPolicies()
        .call()) as any[];

      const formattedPolicies = allPolicies.map((policy: any) => ({
        policyID: Number(policy.policyID),
        insurancePlan: policy.insurancePlan,
        basePremiumRate: parseFloat(policy.basePremiumRate),
        deductible: parseFloat(policy.deductible),
        insuranceCoverage: parseFloat(policy.insuranceCoverage),
        thirdPartyLiability: parseFloat(policy.thirdPartyLiability),
        cover: policy.cover ? policy.cover.join(", ") : "",
      }));

      setPolicies(formattedPolicies);
    } catch (error: any) {
      console.error("Error fetching policies:", error);
      setError("Failed to load policies. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const riskFactor = calculateRiskFactor(
      userData.vehicleAge,
      userData.claimHistory,
      userData.carUsageType,
      userData.carCamera,
      userData.location
    );
    console.log("Risk Factor:", riskFactor);
    fetchAllPolicies();
    setShowPolicies(true);
  };

  const selectAndPayPolicy = async (policyID: number, premium: number) => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask to use this feature.");
        return;
      }

      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      const policyContract = new web3.eth.Contract(
        PolicyManagementABI.abi,
        POLICY_MANAGEMENT_ADDRESS
      );
      const premiumCollectionContract = new web3.eth.Contract(
        PremiumCollectionABI.abi,
        PREMIUM_COLLECTION_ADDRESS
      );

      // 🛠️ Call the getUSDToETH and ensure it is a string
    const premiumInWei = await policyContract.methods.getUSDToETH(premium).call();
    if (!premiumInWei) {
      throw new Error("Failed to get the premium in Wei");
    }

    const weiValue = String(premiumInWei); // Convert to string

    console.log("🛠️ premiumInWei (as string): ", weiValue); // Check its value

    await premiumCollectionContract.methods
      .selectAndPayPolicy(policyID, premium)
      .send({
        from: accounts[0],
        value: weiValue, // This must be a string
      });

    alert("Policy Purchased Successfully!");
   
  } catch (error) {
    console.error("🚨 Error purchasing policy:", error);
    alert("Failed to purchase policy. Check console for details.");
  }
};

  useEffect(() => {
    fetchAllPolicies();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-2xl mt-8 bg-white shadow-lg p-6 rounded-lg">
        <h1 className="text-3xl font-bold text-center mb-8">Buy Insurance</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Fields (same as before) */}
          {/* Car Brand */}
          <div>
            <label
              htmlFor="carBrand"
              className="block text-gray-700 font-medium"
            >
              Your Car Brand
            </label>
            <select
              id="carBrand"
              name="carBrand"
              className="w-full mt-1 p-2 border rounded"
              value={userData.carBrand}
              onChange={handleChange}
            >
              <option value="">Select your car brand</option>
              {carData.map((car) => (
                <option key={car.brand} value={car.brand}>
                  {car.brand}
                </option>
              ))}
            </select>
          </div>

          {/* Car Model */}
          <div>
            <label
              htmlFor="carModel"
              className="block text-gray-700 font-medium"
            >
              Your Car Model
            </label>
            <select
              id="carModel"
              name="carModel"
              className="w-full mt-1 p-2 border rounded"
              value={userData.carModel}
              onChange={handleChange}
              disabled={!userData.carBrand}
            >
              <option value="">Select your car model</option>
              {userData.carBrand &&
                carData
                  .find((car) => car.brand === userData.carBrand)
                  ?.models.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name}
                    </option>
                  ))}
            </select>
          </div>

          {/* Manufactured Year */}
          <div>
            <label
              htmlFor="manufacturedYear"
              className="block text-gray-700 font-medium"
            >
              Manufactured Year
            </label>
            <select
              id="manufacturedYear"
              name="manufacturedYear"
              className="w-full mt-1 p-2 border rounded"
              value={userData.manufacturedYear}
              onChange={handleChange}
              disabled={!userData.carModel}
            >
              <option value="">Select year</option>
              {userData.carBrand &&
                userData.carModel &&
                carData
                  .find((car) => car.brand === userData.carBrand)
                  ?.models.find((model) => model.name === userData.carModel)
                  ?.years.map((year) => (
                    <option key={year.year} value={year.year}>
                      {year.year}
                    </option>
                  ))}
            </select>
          </div>

          {/* Car Camera */}
          <div>
            <label
              htmlFor="carCamera"
              className="block text-gray-700 font-medium"
            >
              Car Camera
            </label>
            <select
              id="carCamera"
              name="carCamera"
              className="w-full mt-1 p-2 border rounded"
              value={userData.carCamera}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Car Usage Type */}
          <div>
            <label
              htmlFor="carUsageType"
              className="block text-gray-700 font-medium"
            >
              Car Usage Type
            </label>
            <select
              id="carUsageType"
              name="carUsageType"
              className="w-full mt-1 p-2 border rounded"
              value={userData.carUsageType}
              onChange={handleChange}
            >
              <option value="">Select usage type</option>
              <option value="personal">Personal</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>

          {/* Vehicle Age */}
          <div>
            <label
              htmlFor="vehicleAge"
              className="block text-gray-700 font-medium"
            >
              Vehicle Age
            </label>
            <input
              type="number"
              id="vehicleAge"
              name="vehicleAge"
              className="w-full mt-1 p-2 border rounded"
              value={userData.vehicleAge}
              onChange={handleChange}
              placeholder="Enter vehicle age"
            />
          </div>

          {/* Claim History */}
          <div>
            <label
              htmlFor="claimHistory"
              className="block text-gray-700 font-medium"
            >
              How many times has this car been claimed before within 12 months?
            </label>
            <input
              type="number"
              id="claimHistory"
              name="claimHistory"
              className="w-full mt-1 p-2 border rounded"
              value={userData.claimHistory}
              onChange={handleChange}
              placeholder="Enter claim count"
            />
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-gray-700 font-medium"
            >
              Where do you currently reside?
            </label>
            <select
              id="location"
              name="location"
              className="w-full mt-1 p-2 border rounded"
              value={userData.location}
              onChange={handleChange}
            >
              <option value="">Select location</option>
              <option value="Bangkok">Bangkok</option>
              <option value="Perimeter">Perimeter</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Submit Button */}
          {/* Car Details and Other Inputs */}
          <button
            type="submit"
            className="bg-red-500 text-white font-bold py-2 px-6 rounded mt-4 hover:bg-red-600"
          >
            Check Policy
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl font-bold mb-4">Available Policies</h2>

        {/* Policies Table */}
        {showPolicies && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <h2 className="text-xl font-bold mb-4 text-gray-700">
              Available Policies
            </h2>

            {loading ? (
              <p>Loading policies...</p>
            ) : policies.length === 0 ? (
              <p>No policies available yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
                  <thead>
                    <tr className="bg-blue-600 text-white uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">Policy ID</th>
                      <th className="py-3 px-6 text-left">Insurance Plan</th>
                      <th className="py-3 px-6 text-left">Deductible (USD)</th>
                      <th className="py-3 px-6 text-left">Coverage (USD)</th>
                      <th className="py-3 px-6 text-left">
                        Third Party Liability
                      </th>
                      <th className="py-3 px-6 text-left">Cover</th>
                      <th className="py-3 px-6 text-left">
                        Calculated Premium (USD)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 text-sm font-medium">
                    {policies.map((policy) => {
                      const carPrice = parseFloat(userData.carPrice) || 0;
                      const riskFactor = calculateRiskFactor(
                        userData.vehicleAge,
                        userData.claimHistory,
                        userData.carUsageType,
                        userData.carCamera,
                        userData.location
                      );
                      const premium = calculatePremium(
                        policy.basePremiumRate,
                        carPrice,
                        riskFactor
                      );

                      return (
                        <tr
                          key={policy.policyID}
                          className="border-b border-gray-200 hover:bg-gray-100"
                        >
                          <td className="py-3 px-6 text-left">
                            {policy.policyID}
                          </td>
                          <td className="py-3 px-6 text-left">
                            {policy.insurancePlan}
                          </td>
                          <td className="py-3 px-6 text-left">
                            ${policy.deductible.toFixed(2)}
                          </td>
                          <td className="py-3 px-6 text-left">
                            ${policy.insuranceCoverage.toFixed(2)}
                          </td>
                          <td className="py-3 px-6 text-left">
                            ${policy.thirdPartyLiability.toFixed(2)}
                          </td>
                          <td className="py-3 px-6 text-left">
                            {policy.cover}
                          </td>
                          <td className="py-3 px-6 text-left">
                          {premium ? `$${premium}` : "N/A"}
                          </td>
                          <td className="py-3 px-6 text-left">
                          <button
                        onClick={() => selectAndPayPolicy(policy.policyID, premium)}
                        className="bg-green-500 text-white py-1 px-4 rounded"
                      >
                            Buy
                          </button>
                        </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyInsurance;
