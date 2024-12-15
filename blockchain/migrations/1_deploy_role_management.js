const RoleManagement = artifacts.require("RoleManagement");

module.exports = async function (deployer, network, accounts) {
  console.log('Deploying RoleManagement to the ${network} network...');
  // Define initial admins
  let initialAdmins;

  initialAdmins = [accounts[0]];

  console.log('Initial Admins:', initialAdmins);

  try {
    // Deploy RoleManagement contract
    await deployer.deploy(RoleManagement, initialAdmins);
    const roleManagementInstance = await RoleManagement.deployed();
    console.log(`RoleManagement deployed at address: ${roleManagementInstance.address}`);
  } catch (error) {
    console.error("Deployment failed:", error);
  }
};