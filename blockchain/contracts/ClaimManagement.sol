// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./RoleManagement.sol";
import "./PolicyManagement.sol";
import "./Payout.sol";

contract ClaimManagement {
    enum ClaimStatus { Pending, Approved, Rejected }

    struct Claim {
        uint id;
        address claimant;
        uint policyID;
        string claimType; // Type of claim (e.g., Theft, Accident, Fire, etc.)
        string incidentDate;
        string details;
        ClaimStatus status;
        uint timestamp;
        uint256 payoutAmountETH; // Store payout amount in ETH
    }

    mapping(uint => Claim) public claims;
    uint public claimCount;

    RoleManagement private roleManagement;
    PolicyManagement private policyManagement;
    Payout private payout;

    event ClaimSubmitted(uint claimId, address indexed claimant, uint policyID, string claimType);
    event ClaimReviewed(uint claimId, ClaimStatus status, uint256 payoutAmountETH);
    event ClaimRejected(uint claimId, string reason);
    event ClaimApproved(uint claimId, address claimant, uint256 payoutAmountETH);

    constructor(
        address _roleManagementAddress, 
        address _policyManagementAddress, 
        address _payoutSystemAddress
    ) {
        roleManagement = RoleManagement(_roleManagementAddress);
        policyManagement = PolicyManagement(_policyManagementAddress);
        payout = Payout(_payoutSystemAddress);
    }

    // Modifier for admin access control
    modifier onlyAdmin() {
        require(roleManagement.isAdmin(msg.sender), "Access denied: You are not Admin");
        _;
    }

   // Modifier for user access control
    modifier onlyUser() {
        require(roleManagement.isUser(msg.sender), "Access denied: You are not a Policy Holder");
        _;
    }

    /**
     * @dev Submit a claim. User must provide the claim type (e.g., "Theft", "Accident") and it is checked against the policy coverage.
     */
    function submitClaim(
        uint _policyID,
        string memory _claimType,
        string memory _incidentDate,
        string memory _details
    ) public onlyUser {
        (, , , , , , string[] memory cover) = policyManagement.viewPolicy(_policyID);

        // Check if the claim type is included in the policy's cover types
        bool isTypeCovered = false;
        for (uint i = 0; i < cover.length; i++) {
            if (keccak256(abi.encodePacked(cover[i])) == keccak256(abi.encodePacked(_claimType))) {
                isTypeCovered = true;
                break;
            }
        }

        if (!isTypeCovered) {
            claimCount++;
            claims[claimCount] = Claim({
                id: claimCount,
                claimant: msg.sender,
                policyID: _policyID,
                claimType: _claimType,
                incidentDate: _incidentDate,
                details: _details,
                status: ClaimStatus.Rejected,
                timestamp: block.timestamp,
                payoutAmountETH: 0
            });

            emit ClaimRejected(claimCount, "Claim type not covered in the policy");
            return;
        }

        claimCount++;
        claims[claimCount] = Claim({
            id: claimCount,
            claimant: msg.sender,
            policyID: _policyID,
            claimType: _claimType,
            incidentDate: _incidentDate,
            details: _details,
            status: ClaimStatus.Pending,
            timestamp: block.timestamp,
            payoutAmountETH: 0
        });

        emit ClaimSubmitted(claimCount, msg.sender, _policyID, _claimType);
    }

    /*
     * @dev Admin reviews a claim and either approves or rejects it.
     * @param _claimId The ID of the claim to review.
     * @param _approve True to approve the claim, false to reject it.
     * @param _payoutAmountUSD The payout amount in USD (this will be converted to ETH).
     */
    function reviewClaim(uint _claimId, bool _approve, uint256 _payoutAmountUSD) public onlyAdmin{
        Claim storage claim = claims[_claimId];
        require(claim.status == ClaimStatus.Pending, "Claim is not pending");

        if (_approve) {
            claim.status = ClaimStatus.Approved;

            // Convert USD to ETH
            uint256 payoutAmountETH = policyManagement.getUSDToETH(_payoutAmountUSD);
            claim.payoutAmountETH = payoutAmountETH;

            emit ClaimApproved(_claimId, claim.claimant, payoutAmountETH);
            payout.withdrawFundsFromPool(payoutAmountETH, claim.claimant);
        } else {
            claim.status = ClaimStatus.Rejected;
        }

        emit ClaimReviewed(_claimId, claim.status, claim.payoutAmountETH);
    }

    /*
     * @dev View details of a specific claim by claim ID.
     */
    function viewClaim(uint _claimId) public view returns (
        address claimant,
        uint policyID,
        string memory claimType,
        string memory incidentDate,
        string memory details,
        ClaimStatus status,
        uint timestamp,
        uint256 payoutAmountETH
    ) {
        Claim memory claim = claims[_claimId];
        return (
            claim.claimant,
            claim.policyID,
            claim.claimType,
            claim.incidentDate,
            claim.details,
            claim.status,
            claim.timestamp,
            claim.payoutAmountETH
        );
    }

    /*
     * @dev View all claims submitted by the calling user.
     */
    function viewUserClaims() public view returns (Claim[] memory) {
        uint totalClaims = claimCount;
        uint userClaimCount = 0;

        for (uint i = 1; i <= totalClaims; i++) {
            if (claims[i].claimant == msg.sender) {
                userClaimCount++;
            }
        }

        Claim[] memory userClaims = new Claim[](userClaimCount);
        uint index = 0;
        for (uint i = 1; i <= totalClaims; i++) {
            if (claims[i].claimant == msg.sender) {
                userClaims[index] = claims[i];
                index++;
            }
        }

        return userClaims;
    }

    /*
     * @dev Admin can view all claims.
     */
    function viewAllClaims() public view onlyAdmin returns (Claim[] memory) {
        Claim[] memory allClaims = new Claim[](claimCount);
        for (uint i = 1; i <= claimCount; i++) {
            allClaims[i - 1] = claims[i];
        }
        return allClaims;
    }
}
