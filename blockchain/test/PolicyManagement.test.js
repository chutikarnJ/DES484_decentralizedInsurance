const { assert } = require('chai');
const Web3 = require("web3");
const RoleManagement = artifacts.require("RoleManagement");
const PolicyManagement = artifacts.require("PolicyManagement");
const MockV3Aggregator = artifacts.require("MockV3Aggregator");
const PremiumCollection = artifacts.require("PremiumCollection");
const truffleAssert = require('truffle-assertions');


contract("PolicyManagement", (accounts) => {
  let policyManagement;
  let roleManagement;
  let priceFeed;
  let initialPrice = Web3.utils.toWei("200000000", "ether");

  const admin = accounts[0];
  const user = accounts[1];
  
  let premiumCollection;

  beforeEach(async () => {
    // Deploy RoleManagement
    roleManagement = await RoleManagement.new([admin]);

    // Deploy MockV3Aggregator with 8 decimals (standard for USD/ETH price feed)
    priceFeed = await MockV3Aggregator.new(8, initialPrice); // Price is mocked as 3000 USD/ETH

    // Deploy PolicyManagement
    policyManagement = await PolicyManagement.new(roleManagement.address, priceFeed.address);

    // Deploy PremiumCollection if needed
    premiumCollection = await PremiumCollection.new(roleManagement.address, policyManagement.address);
  });

  it("should allow an admin to create a policy", async () => {
    const policyData = {
      insurancePlan: "Health Insurance",
      basePremiumRate: "100 USD",
      deductible: 500,
      insuranceCoverage: 10000,
      thirdPartyLiability: 2000,
      cover: ["Accident", "Theft"]
    };

    // Create a policy
    await policyManagement.createPolicy(
      policyData.insurancePlan,
      policyData.basePremiumRate,
      policyData.deductible,
      policyData.insuranceCoverage,
      policyData.thirdPartyLiability,
      policyData.cover,
      { from: admin }
    );

    const policy = await policyManagement.policies(1);

    assert.equal(policy.insurancePlan, policyData.insurancePlan, "Policy plan should be correctly set");
    assert.equal(policy.basePremiumRate, policyData.basePremiumRate, "Premium rate should be correct");
  });

  it("should allow a user to select a policy", async () => {
    // Ensure the user is added
    await roleManagement.addUser(user);
    assert.isTrue(await roleManagement.isUser(user), "User should be registered");

    // Mock ETH price to 3000 USD/ETH
    await priceFeed.updateAnswer(Web3.utils.toWei("3000", "ether"));

    // Create the policy
    const policyData = {
        insurancePlan: "Health Insurance",
        basePremiumRate: "100 USD",
        deductible: 500,
        insuranceCoverage: 10000,
        thirdPartyLiability: 2000,
        cover: ["Accident", "Theft"]
    };
    await policyManagement.createPolicy(
        policyData.insurancePlan,
        policyData.basePremiumRate,
        policyData.deductible,
        policyData.insuranceCoverage,
        policyData.thirdPartyLiability,
        policyData.cover,
        { from: admin }
    );

    // Select the policy
    const policyID = 1;
    const premiumInUSD = 100;
    const expectedPremiumInETH = Web3.utils.toWei("0.03333", "ether");

    const receipt = await policyManagement.selectPolicy(user, policyID, premiumInUSD, { from: user });

    // Assert the PolicySelected event
    await truffleAssert.eventEmitted(
      result,
      'PolicySelected',
      (ev) => {
          return ev.user === user && ev.policyID.toString() === "1";
      },
      "PolicySelected event should be emitted with correct parameters"
  );

    // Check the user's selected policies
    const selectedPolicies = await policyManagement.getUserSelectedPolicies(user);
    assert.equal(selectedPolicies[0][0].toNumber(), policyID, "Policy ID should match");
    assert.equal(selectedPolicies[1][0].toString(), expectedPremiumInETH, "Premium in ETH should match");
    assert.isAbove(
        selectedPolicies[2][0].toNumber(),
        Math.floor(Date.now() / 1000),
        "Next due date should be in the future"
    );
});
});