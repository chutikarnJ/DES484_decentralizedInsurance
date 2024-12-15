const RoleManagement = artifacts.require("RoleManagement");

contract("RoleManagement", (accounts) => {
  let roleManagement;
  const [deployer, admin1, admin2, user1] = accounts;

  before(async () => {
    roleManagement = await RoleManagement.new([admin1, admin2]);
  });

  it("should deploy the contract and set the deployer as an admin", async () => {
    const adminRole = await roleManagement.ADMIN_ROLE();
    const isAdmin = await roleManagement.hasRole(adminRole, deployer);
    assert.isTrue(isAdmin, "Deployer should be an admin");
  });

  it("should add initial admins", async () => {
    const adminRole = await roleManagement.ADMIN_ROLE();
    const isAdmin1 = await roleManagement.hasRole(adminRole, admin1);
    const isAdmin2 = await roleManagement.hasRole(adminRole, admin2);
    assert.isTrue(isAdmin1, "Admin1 should be an admin");
    assert.isTrue(isAdmin2, "Admin2 should be an admin");
  });

  it("should add a new user", async () => {
    const policyHolderRole = await roleManagement.POLICY_HOLDER_ROLE();
    await roleManagement.addUser(user1, { from: deployer });
    const isUser = await roleManagement.hasRole(policyHolderRole, user1);
    assert.isTrue(isUser, "User1 should be a policy holder");
  });
});