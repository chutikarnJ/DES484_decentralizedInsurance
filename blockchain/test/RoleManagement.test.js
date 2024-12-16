const { expectRevert } = require('@openzeppelin/test-helpers');
const RoleManagement = artifacts.require("RoleManagement");

contract("RoleManagement", (accounts) => {
  const [deployer, admin1, admin2, user1, user2, nonAdmin] = accounts;

  let roleManagement;

  beforeEach(async () => {
    // Deploy RoleManagement contract with initial admins
    roleManagement = await RoleManagement.new([admin1, admin2]);
  });

  it("should set deployer as DEFAULT_ADMIN_ROLE and ADMIN_ROLE", async () => {
    const isDeployerAdmin = await roleManagement.isAdmin(deployer);
    assert.equal(isDeployerAdmin, true, "Deployer should be admin");
  });

  it("should allow admin to add another admin", async () => {
    await roleManagement.addAdmin(user1, { from: admin1 });
    const isUser1Admin = await roleManagement.isAdmin(user1);
    assert.equal(isUser1Admin, true, "User1 should now be an admin");
  });

  it("should not allow non-admin to add another admin", async () => {
    await expectRevert(
      roleManagement.addAdmin(user1, { from: nonAdmin }),
      "AccessControl: account "
    );
  });

  it("should allow admin to revoke admin role", async () => {
    await roleManagement.revokeAdmin(admin2, { from: admin1 });
    const isAdmin2StillAdmin = await roleManagement.isAdmin(admin2);
    assert.equal(isAdmin2StillAdmin, false, "Admin2 should no longer be an admin");
  });

  it("should not allow non-admin to revoke admin role", async () => {
    await expectRevert(
      roleManagement.revokeAdmin(admin2, { from: nonAdmin }),
      "AccessControl: account "
    );
  });

  it("should allow a user to be added as a user", async () => {
    await roleManagement.addUser(user2, { from: admin1 });
    const isUser2User = await roleManagement.isUser(user2);
    assert.equal(isUser2User, true, "User2 should now be a user");
  });

  it("should allow admin to revoke user role", async () => {
    await expectRevert(
      roleManagement.revokeUser(user2, { from: nonAdmin }),
      "AccessControl: account "
    );
  });

  it("should not allow non-admin to revoke user role", async () => {
    await expectRevert(
      roleManagement.revokeUser(user2, { from: nonAdmin }),
      "AccessControl: account "
    );
  });
});
