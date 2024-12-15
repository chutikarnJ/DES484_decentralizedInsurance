
const ClaimManagement = artifacts.require("ClaimManagement");

module.exports = async function (deployer, network, accounts) {
  const roleManagementAddress = "0x9Dc0c9599c2407425CFda8310Fb57C12520Ba117"; // Replace with deployed RoleManagement address
  const policyManagementAddress = "0xE883AAB89149fC4c6E106644692626CF88875eeB"; // Replace with deployed PremiumCollection address
  const payoutaDDRESS = "0xEb5d876E8B9bE75a2202ea589e858396fB235E4B";

  await deployer.deploy(ClaimManagement, roleManagementAddress, policyManagementAddress, payoutaDDRESS);

  const claimInstance = await ClaimManagement.deployed();
  console.log(`✅ Payout Contract deployed at: ${claimInstance.address}`);
};

