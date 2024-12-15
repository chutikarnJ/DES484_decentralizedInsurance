const Payout = artifacts.require("Payout");

module.exports = async function (deployer, network, accounts) {
  const roleManagementAddress = "0x9Dc0c9599c2407425CFda8310Fb57C12520Ba117"; // Replace with deployed RoleManagement address
  const premiumCollectionAddress = "0xAaFa8313acE9A3D1e0d13f71228826bd507c706d"; // Replace with deployed PremiumCollection address

  await deployer.deploy(Payout, roleManagementAddress, premiumCollectionAddress);

  const payoutInstance = await Payout.deployed();
  console.log(`✅ Payout Contract deployed at: ${payoutInstance.address}`);
};
