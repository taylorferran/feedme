// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FeedMeSplitter
 * @notice Splits incoming tokens to multiple recipients based on basis points
 * @dev Designed to be called by LI.FI after a swap/bridge operation
 */
contract FeedMeSplitter {
    using SafeERC20 for IERC20;

    /// @notice Basis points denominator (100% = 10000)
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Emitted when tokens are distributed
    event Distributed(
        address indexed token,
        address[] recipients,
        uint256[] amounts
    );

    /// @notice Emitted when ETH is distributed
    event DistributedETH(
        address[] recipients,
        uint256[] amounts
    );

    /**
     * @notice Distribute ERC20 tokens to multiple recipients
     * @param token The token to distribute
     * @param recipients Array of recipient addresses
     * @param bps Array of basis points for each recipient (must sum to 10000)
     */
    function distribute(
        address token,
        address[] calldata recipients,
        uint256[] calldata bps
    ) external {
        require(recipients.length == bps.length, "Length mismatch");
        require(recipients.length > 0, "No recipients");

        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No balance to distribute");

        uint256[] memory amounts = new uint256[](recipients.length);
        uint256 totalDistributed = 0;

        // Calculate and transfer amounts
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");

            if (i == recipients.length - 1) {
                // Last recipient gets remaining balance to avoid dust
                amounts[i] = balance - totalDistributed;
            } else {
                amounts[i] = (balance * bps[i]) / BPS_DENOMINATOR;
                totalDistributed += amounts[i];
            }

            if (amounts[i] > 0) {
                IERC20(token).safeTransfer(recipients[i], amounts[i]);
            }
        }

        emit Distributed(token, recipients, amounts);
    }

    /**
     * @notice Distribute native ETH to multiple recipients
     * @param recipients Array of recipient addresses
     * @param bps Array of basis points for each recipient (must sum to 10000)
     */
    function distributeETH(
        address[] calldata recipients,
        uint256[] calldata bps
    ) external payable {
        require(recipients.length == bps.length, "Length mismatch");
        require(recipients.length > 0, "No recipients");

        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to distribute");

        uint256[] memory amounts = new uint256[](recipients.length);
        uint256 totalDistributed = 0;

        // Calculate and transfer amounts
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");

            if (i == recipients.length - 1) {
                // Last recipient gets remaining balance to avoid dust
                amounts[i] = balance - totalDistributed;
            } else {
                amounts[i] = (balance * bps[i]) / BPS_DENOMINATOR;
                totalDistributed += amounts[i];
            }

            if (amounts[i] > 0) {
                (bool success, ) = recipients[i].call{value: amounts[i]}("");
                require(success, "ETH transfer failed");
            }
        }

        emit DistributedETH(recipients, amounts);
    }

    /**
     * @notice Receive ETH (needed for LI.FI to send ETH before distribute call)
     */
    receive() external payable {}
}
