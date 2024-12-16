// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./PremiumCollection.sol";
import "./RoleManagement.sol";

contract Payout {
    PremiumCollection private premiumCollection;
    RoleManagement private roleManagement;

    event PayoutIssued(uint claimId, address indexed claimant, uint256 amount);
    event AdminWithdrawal(address indexed admin, uint256 amount, address indexed recipient);

    constructor(address _roleManagementAddress, address _premiumCollectionAddress) {
        roleManagement = RoleManagement(_roleManagementAddress);
        premiumCollection = PremiumCollection(_premiumCollectionAddress);
    }

    // Modifier for admin access control
    modifier onlyAdmin() {
        require(roleManagement.isAdmin(msg.sender), "Access denied: You are not Admin");
        _;
    }

    /*
     * @dev Allows the admin to withdraw funds from the PremiumCollection pool.
     * @param amount The amount of funds to withdraw from the pool.
     * @param recipient The address where the withdrawn funds will be sent.
     */
    function withdrawFundsFromPool (
        uint256 amount, 
        address recipient
    ) external onlyAdmin {
        require(amount > 0, "Amount must be greater than zero");
        
        // Call the PremiumCollection contract to withdraw funds
        //premiumCollection.withdrawFunds(amount, recipient);
        
        emit AdminWithdrawal(msg.sender, amount, recipient);
    }

    /*
     * @dev Helper function to check if a user is an admin.
     * @param user The address to check.
     * @return bool True if the user is an admin, false otherwise.
     */
    function checkAdmin(address user) public view returns (bool) {
        return roleManagement.isAdmin(user);
    }
}
