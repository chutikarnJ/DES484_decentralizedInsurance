const PolicyManagement = artifacts.require("PolicyManagement");

module.exports = async function (deployer, network, accounts) {
  // Replace this address with the existing RoleManagement contract address
  const roleManagementAddress = "0x9Dc0c9599c2407425CFda8310Fb57C12520Ba117"; // Replace with deployed RoleManagement address

  if (!roleManagementAddress) {
    throw new Error("Please provide a valid RoleManagement contract address.");
  }

  const initialPrice = 200000000;

  console.log("Deploying PolicyManagement with RoleManagement at:", roleManagementAddress);

  // Deploy PolicyManagement with the existing RoleManagement address
  await deployer.deploy(PolicyManagement, roleManagementAddress, initialPrice);
  const policyManagementInstance = await PolicyManagement.deployed();

  console.log("PolicyManagement deployed at:", policyManagementInstance.address);
};