const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Insurance System", function () {
  let roleManagement, policyManagement, premiumCollection, carInsuranceClaimSystem, payout;
  let owner, admin, user1, user2;

  before(async function () {
    [owner, admin, user1, user2] = await ethers.getSigners();

    // Deploy RoleManagement
    const RoleManagementFactory = await ethers.getContractFactory("RoleManagement");
    roleManagement = await RoleManagementFactory.deploy([admin.address]);

    // Deploy PolicyManagement
    const PolicyManagementFactory = await ethers.getContractFactory("PolicyManagement");
    policyManagement = await PolicyManagementFactory.deploy(roleManagement.address, 2000);

    // Deploy PremiumCollection
    const PremiumCollectionFactory = await ethers.getContractFactory("PremiumCollection");
    premiumCollection = await PremiumCollectionFactory.deploy(roleManagement.address, policyManagement.address);

    // Deploy CarInsuranceClaimSystem
    const CarInsuranceClaimSystemFactory = await ethers.getContractFactory("CarInsuranceClaimSystem");
    carInsuranceClaimSystem = await CarInsuranceClaimSystemFactory.deploy(roleManagement.address, policyManagement.address);

    // Deploy Payout
    const PayoutFactory = await ethers.getContractFactory("Payout");
    payout = await PayoutFactory.deploy(
      premiumCollection.address,
      carInsuranceClaimSystem.address,
      roleManagement.address,
      policyManagement.address
    );
  });

  describe("RoleManagement", function () {
    it("Should add an admin role", async function () {
      await roleManagement.connect(owner).addAdmin(user1.address);
      expect(await roleManagement.isAdmin(user1.address)).to.equal(true);
    });

    it("Should add a user role", async function () {
      await roleManagement.connect(user1).addUser();
      expect(await roleManagement.isUser(user1.address)).to.equal(true);
    });
  });

  describe("PolicyManagement", function () {
    it("Should create a policy", async function () {
      const cover = ["Accident", "Theft", "Fire"];
      await policyManagement
        .connect(admin)
        .createPolicy("Basic Plan", "5%", 1000, 10000, 5000, cover);
      const policy = await policyManagement.viewPolicy(1);
      expect(policy.insurancePlan).to.equal("Basic Plan");
    });

    it("Should select a policy", async function () {
      await policyManagement.connect(user1).selectPolicy(user1.address, 1, 100);
      const userPolicies = await policyManagement.getUserSelectedPolicies(user1.address);
      expect(userPolicies.policyIDs[0]).to.equal(1);
    });
  });

  describe("PremiumCollection", function () {
    it("Should pay a premium and update pool balance", async function () {
      const premiumAmount = ethers.utils.parseEther("0.1");
      await premiumCollection
        .connect(user1)
        .selectAndPayPolicy(1, 100, { value: premiumAmount });

      const balance = await premiumCollection.getPoolBalance();
      expect(balance).to.equal(premiumAmount);
    });

    it("Should withdraw funds from the pool", async function () {
      const withdrawAmount = ethers.utils.parseEther("0.05");
      await premiumCollection.connect(admin).withdrawFromPool(withdrawAmount, admin.address);
      const balance = await premiumCollection.getPoolBalance();
      expect(balance).to.equal(ethers.utils.parseEther("0.05"));
    });
  });

  describe("CarInsuranceClaimSystem", function () {
    it("Should submit a claim", async function () {
      const claimCover = ["Accident"];
      const ipfsHashes = ["QmTestHash123"];
      await carInsuranceClaimSystem
        .connect(user1)
        .submitClaim("John Doe", "Basic Plan", "2024-12-15", "Accident on highway", claimCover, ipfsHashes);
      
      const claim = await carInsuranceClaimSystem.viewClaimStatus(1);
      expect(claim.name).to.equal("John Doe");
    });

    it("Should review and approve a claim", async function () {
      await carInsuranceClaimSystem.connect(admin).reviewClaim(1, true);
      const claim = await carInsuranceClaimSystem.viewClaimStatus(1);
      expect(claim.status).to.equal(1); // Approved status
    });
  });

  describe("Payout", function () {
    beforeEach(async function () {
      const isUser = await roleManagement.isUser(user1.address);
      if (!isUser) {
        await roleManagement.connect(user1).addUser();
      }
    });

    it("Should trigger a payout to a user", async function () {
      const claimAmount = ethers.utils.parseUnits("1000", 18);
      await carInsuranceClaimSystem.connect(user1).submitClaim(
        "John Doe", 
        "Basic Plan", 
        "2024-12-15", 
        "Accident on highway", 
        ["Accident"], 
        ["QmTestHash123"]
      );
  
      await carInsuranceClaimSystem.connect(admin).reviewClaim(1, true); 
      await payout.connect(admin).triggerPayout(1, user1.address);
      const balance = await ethers.provider.getBalance(user1.address);
      expect(balance).to.be.gt(0);
    });

    it("Should not trigger payout if user is not an admin", async function () {
      await expect(
        payout.connect(user2).triggerPayout(1, user1.address)
      ).to.be.revertedWith("Access denied: Unauthorized source");
    });

    it("Should fail if the payout amount exceeds the pool balance", async function () {
      await policyManagement.connect(admin).createPolicy("Comprehensive", "0.05", 500, 10000, 5000, ["Own Damage"]);

      const premiumAmount = ethers.utils.parseEther("1");
      await premiumCollection.connect(user1).selectAndPayPolicy(1, 100, { value: premiumAmount });

      const poolBalance = await premiumCollection.getPoolBalance();
      await expect(
        premiumCollection.connect(admin).decreasePoolBalance(poolBalance.add(ethers.utils.parseEther("1")))
      ).to.be.revertedWith("Insufficient pool balance");
    });
  });
});
