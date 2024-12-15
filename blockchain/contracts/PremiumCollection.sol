// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./RoleManagement.sol";
import "./PolicyManagement.sol";

contract PremiumCollection {

    RoleManagement private roleManagement;
    PolicyManagement private policyManagement;

    uint256 private poolBalance;

    event PremiumPaid(address indexed user, uint256 policyID, uint256 amount);
    event PoolBalanceUpdated(uint256 newBalance);

    constructor(address _roleManagementAddress, address _policyManagementAddress) {
        roleManagement = RoleManagement(_roleManagementAddress);
        policyManagement = PolicyManagement(_policyManagementAddress);
    }

    modifier onlyUser() {
        require(roleManagement.isUser(msg.sender), "Access denied: You are not User");
        _;
    }

     modifier onlyAdmin() {
        require(roleManagement.isAdmin(msg.sender), "Access denied: You are not Admin");
        _;
    }

    function selectAndPayPolicy(uint256 _policyID, uint256 _premiumInUSD) external payable onlyUser {
        uint256 premiumInWei = policyManagement.getUSDToETH(_premiumInUSD);
        require(msg.value >= premiumInWei, "Insufficient ETH sent for the premium");

        // Call the PolicyManagement to store the user policy
        policyManagement.selectPolicy(msg.sender, _policyID, _premiumInUSD);
        
        poolBalance += msg.value;

        emit PremiumPaid(msg.sender, _policyID, msg.value);
        emit PoolBalanceUpdated(poolBalance);
    }

        function payPremium(uint256 _policyID) public payable onlyUser {
        (uint256[] memory policyIDs, uint256[] memory premiums, uint256[] memory dueDates) = 
            policyManagement.getUserSelectedPolicies(msg.sender);

        bool policyFound = false;

        for (uint256 i = 0; i < policyIDs.length; i++) {
            if (policyIDs[i] == _policyID) {
                require(block.timestamp >= dueDates[i], "Payment not due");
                require(msg.value >= premiums[i], "Insufficient ETH sent");

                policyManagement.selectPolicy(msg.sender, _policyID, msg.value);

                poolBalance += msg.value;
                emit PremiumPaid(msg.sender, _policyID, msg.value);
                emit PoolBalanceUpdated(poolBalance);

                policyFound = true;
                break;
            }
        }

        require(policyFound, "Policy not found for user");
    }

    function getPoolBalance() public view returns (uint256) {
        return poolBalance;
    }

    function decreasePoolBalance(uint256 amount) public onlyAdmin {
        require(poolBalance >= amount, "Insufficient pool balance");
        poolBalance -= amount;
        emit PoolBalanceUpdated(poolBalance);
    }

    function withdrawFunds(uint256 amount) external onlyAdmin {
        require(amount <= poolBalance, "Insufficient balance in the pool");
        poolBalance -= amount;
        payable(msg.sender).transfer(amount);
        emit PoolBalanceUpdated(poolBalance);
    }
}
