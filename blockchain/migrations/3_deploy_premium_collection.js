const PremiumCollection = artifacts.require("PremiumCollection");

module.exports = async function (deployer, network, accounts) {
  // Replace these addresses with the actual deployed contract addresses
  const roleManagementAddress = "0x9Dc0c9599c2407425CFda8310Fb57C12520Ba117";
  const policyManagementAddress = "0xE883AAB89149fC4c6E106644692626CF88875eeB";

  if (!roleManagementAddress || !policyManagementAddress) {
    console.error("🚨 Please provide valid addresses for RoleManagement and PolicyManagement contracts.");
    return;
  }

  console.log("🚀 Starting deployment of PremiumCollection...");
  await deployer.deploy(PremiumCollection, roleManagementAddress, policyManagementAddress);
  const premiumCollection = await PremiumCollection.deployed();
  console.log(`✅ PremiumCollection deployed at address: ${premiumCollection.address}`);
};
