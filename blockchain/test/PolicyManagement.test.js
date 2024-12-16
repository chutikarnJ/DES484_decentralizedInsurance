let assert;

before(async () => {
  const chai = await import('chai');
  assert = chai.assert;
});

const RoleManagement = artifacts.require("RoleManagement");
const PolicyManagement = artifacts.require("PolicyManagement");
const MockV3Aggregator = artifacts.require("MockV3Aggregator");
const PremiumCollection = artifacts.require("PremiumCollection");
const truffleAssert = require('truffle-assertions');

contract("PolicyManagement", (accounts) => {
  let roleManagement;
  let policyManagement;
  let priceFeed;
  let premiumCollection;

  const initialPrice = "200000000"; // $2000 USD/ETH (8 decimals)
  const admin = accounts[0];
  const user = accounts[1];

  beforeEach(async () => {
    // Deploy RoleManagement and initialize it
    roleManagement = await RoleManagement.new([admin]);
    console.log("✅ RoleManagement deployed at:", roleManagement.address);

    priceFeed = await MockV3Aggregator.new(8, initialPrice); 
    console.log("✅ Mock PriceFeed deployed at:", priceFeed.address);

    policyManagement = await PolicyManagement.new(roleManagement.address, priceFeed.address);
    console.log("✅ PolicyManagement deployed at:", policyManagement.address);

    premiumCollection = await PremiumCollection.new(roleManagement.address, policyManagement.address);
    console.log("✅ PremiumCollection deployed at:", premiumCollection.address);

    // User calls addUser for themselves
    await roleManagement.addUser({ from: user }); 
  });

  it("should allow admin to create a policy", async () => {
    const policyData = {
      insurancePlan: "Health Insurance",
      basePremiumRate: "0.001",
      deductible: 500,
      insuranceCoverage: 10000,
      thirdPartyLiability: 2000,
      cover: ["Accident", "Theft"]
    };

    const receipt = await policyManagement.createPolicy(
      policyData.insurancePlan,
      policyData.basePremiumRate,
      policyData.deductible,
      policyData.insuranceCoverage,
      policyData.thirdPartyLiability,
      policyData.cover,
      { from: admin }
    );

    truffleAssert.eventEmitted(receipt, 'PolicyCreated', (ev) => {
      return ev.policyID.toString() === "1";
    });

    const policy = await policyManagement.policies(1);
    assert.equal(policy.insurancePlan, policyData.insurancePlan, "Policy plan should be correctly set");
  });

  it("should allow a user to select a policy and calculate premium in ETH", async () => {
    // 1️⃣ **Admin creates the policy**
    const policyData = {
      insurancePlan: "Health Insurance",
      basePremiumRate: "0.001",
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

    const policyID = 1;
    const premiumInUSD = 100;

    // 2️⃣ **Convert the premium from USD to Wei**
    const premiumInWei = await policyManagement.getUSDToETH(premiumInUSD);
    console.log("Calculated Premium in Wei:", premiumInWei.toString());

    // 3️⃣ **User selects the policy and sends the premium**
    const receipt = await premiumCollection.selectAndPayPolicy(policyID, premiumInUSD, {
      from: user,
      value: premiumInWei 
    });

    // 4️⃣ **Check if the PremiumPaid event was emitted**
    truffleAssert.eventEmitted(receipt, 'PremiumPaid', (ev) => {
      return ev.user === user && ev.policyID.toString() === "1";
    });

    // 5️⃣ **Check if the user's policy was recorded**
    const [policyIDs, premiumPricesETH, dueDates] = await policyManagement.getUserSelectedPolicies(user);
    assert.equal(policyIDs[0].toNumber(), policyID, "Policy ID should match");
    assert.equal(premiumPricesETH[0].toString(), premiumInWei.toString(), "Premium in ETH should match");
    assert.isAbove(
      dueDates[0].toNumber(),
      Math.floor(Date.now() / 1000),
      "Next due date should be in the future"
    );
  });

  it("should allow user to register themselves as a POLICY_HOLDER", async () => {
    const newUser = accounts[2];
    await roleManagement.addUser({ from: newUser });

    const isUser = await roleManagement.isUser(newUser);
    assert.isTrue(isUser, "New user should be registered as a POLICY_HOLDER");
  });

  it("should fail to register the same user twice", async () => {
    await truffleAssert.reverts(
      roleManagement.addUser({ from: user }),
      "Address is already a policy holder"
    );
  });

  it("should pass a simple dummy test", async () => {
    assert.equal(1, 1, "Dummy test failed");
  });
});
