const { assert } = require('chai');

const Web3 = require("web3");
const RoleManagement = artifacts.require("RoleManagement");
const PolicyManagement = artifacts.require("PolicyManagement");
const PremiumCollection = artifacts.require("PremiumCollection");
const MockV3Aggregator = artifacts.require("MockV3Aggregator");

contract("PremiumCollection", (accounts) => {
  let premiumCollection;
  let roleManagement;
  let policyManagement;
  let priceFeed;
  let admin = accounts[0];
  let user = accounts[1];
  let initialPrice = Web3.utils.toWei("3000", "ether"); // Example price (3000 USD to ETH)
  let poolBalance = 0;

  beforeEach(async () => {
    // Deploy RoleManagement contract
    roleManagement = await RoleManagement.new([admin]);

    // Deploy MockV3Aggregator contract with an initial price of 3000 USD to 1 ETH
    priceFeed = await MockV3Aggregator.new(8, initialPrice);

    // Deploy PolicyManagement contract
    policyManagement = await PolicyManagement.new(roleManagement.address, initialPrice);

    // Deploy PremiumCollection contract
    premiumCollection = await PremiumCollection.new(roleManagement.address, policyManagement.address);
  });

  it("should allow users to pay premiums and update pool balance", async () => {
    // Assign user role
    await roleManagement.addUser(user);  // Make sure the user is added to the RoleManagement contract

    // Create a policy in PolicyManagement
    await policyManagement.createPolicy("Health Insurance", "100 USD", 500, 10000, 2000, ["Accident", "Theft"]);

    // User selects the policy to become a policy holder
    const policyID = 1;
    const premiumInUSD = 100;
    await policyManagement.selectPolicy(user, policyID, premiumInUSD, { from: user });

    // Simulate user paying for policy premium (100 USD)
    await premiumCollection.selectAndPayPolicy(policyID, premiumInUSD, { from: user, value: Web3.utils.toWei("0.03333", "ether") });

    // Check pool balance after payment
    const updatedPoolBalance = await premiumCollection.getPoolBalance();
    assert.equal(updatedPoolBalance.toString(), Web3.utils.toWei("0.03333", "ether"), "Pool balance should be updated");
});



it("should allow admins to withdraw funds", async () => {
  // Assign user role (admin is already assigned during deployment)
  await roleManagement.addUser(user);

  // User pays premium
  const policyID = 1;
  const premiumInUSD = 100;
  await premiumCollection.selectAndPayPolicy(policyID, premiumInUSD, { from: user, value: Web3.utils.toWei("0.03333", "ether") });

  // Admin withdraws funds
  await premiumCollection.withdrawFunds(Web3.utils.toWei("0.03333", "ether"), user, { from: admin });

  // Check pool balance after withdrawal
  const updatedPoolBalance = await premiumCollection.getPoolBalance();
  assert.equal(updatedPoolBalance.toString(), "0", "Pool balance should be zero after withdrawal");
});
});