// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {FeedMeSplitter} from "../src/FeedMeSplitter.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Mock ERC20 token for testing
contract MockToken is ERC20 {
    constructor() ERC20("Mock", "MCK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract FeedMeSplitterTest is Test {
    FeedMeSplitter public splitter;
    MockToken public token;

    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    function setUp() public {
        splitter = new FeedMeSplitter();
        token = new MockToken();
    }

    // ============ ERC20 Distribution Tests ============

    function test_distribute_twoRecipients_5050() public {
        // Setup: mint 1000 tokens to splitter
        token.mint(address(splitter), 1000);

        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        uint256[] memory bps = new uint256[](2);
        bps[0] = 5000; // 50%
        bps[1] = 5000; // 50%

        splitter.distribute(address(token), recipients, bps);

        assertEq(token.balanceOf(alice), 500);
        assertEq(token.balanceOf(bob), 500);
        assertEq(token.balanceOf(address(splitter)), 0);
    }

    function test_distribute_threeRecipients_unevenSplit() public {
        // Setup: mint 1000 tokens to splitter
        token.mint(address(splitter), 1000);

        address[] memory recipients = new address[](3);
        recipients[0] = alice;
        recipients[1] = bob;
        recipients[2] = charlie;

        uint256[] memory bps = new uint256[](3);
        bps[0] = 5000; // 50%
        bps[1] = 3000; // 30%
        bps[2] = 2000; // 20%

        splitter.distribute(address(token), recipients, bps);

        assertEq(token.balanceOf(alice), 500);
        assertEq(token.balanceOf(bob), 300);
        assertEq(token.balanceOf(charlie), 200);
        assertEq(token.balanceOf(address(splitter)), 0);
    }

    function test_distribute_dustGoesToLastRecipient() public {
        // Setup: mint 1001 tokens (odd number to create dust)
        token.mint(address(splitter), 1001);

        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        uint256[] memory bps = new uint256[](2);
        bps[0] = 5000; // 50%
        bps[1] = 5000; // 50%

        splitter.distribute(address(token), recipients, bps);

        // Alice gets 500 (floor of 50% of 1001)
        assertEq(token.balanceOf(alice), 500);
        // Bob gets remainder (501)
        assertEq(token.balanceOf(bob), 501);
        assertEq(token.balanceOf(address(splitter)), 0);
    }

    function test_distribute_singleRecipient() public {
        token.mint(address(splitter), 1000);

        address[] memory recipients = new address[](1);
        recipients[0] = alice;

        uint256[] memory bps = new uint256[](1);
        bps[0] = 10000; // 100%

        splitter.distribute(address(token), recipients, bps);

        assertEq(token.balanceOf(alice), 1000);
        assertEq(token.balanceOf(address(splitter)), 0);
    }

    function test_distribute_revertsOnLengthMismatch() public {
        token.mint(address(splitter), 1000);

        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        uint256[] memory bps = new uint256[](1);
        bps[0] = 10000;

        vm.expectRevert("Length mismatch");
        splitter.distribute(address(token), recipients, bps);
    }

    function test_distribute_revertsOnNoRecipients() public {
        token.mint(address(splitter), 1000);

        address[] memory recipients = new address[](0);
        uint256[] memory bps = new uint256[](0);

        vm.expectRevert("No recipients");
        splitter.distribute(address(token), recipients, bps);
    }

    function test_distribute_revertsOnZeroBalance() public {
        address[] memory recipients = new address[](1);
        recipients[0] = alice;

        uint256[] memory bps = new uint256[](1);
        bps[0] = 10000;

        vm.expectRevert("No balance to distribute");
        splitter.distribute(address(token), recipients, bps);
    }

    function test_distribute_revertsOnZeroAddress() public {
        token.mint(address(splitter), 1000);

        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = address(0);

        uint256[] memory bps = new uint256[](2);
        bps[0] = 5000;
        bps[1] = 5000;

        vm.expectRevert("Invalid recipient");
        splitter.distribute(address(token), recipients, bps);
    }

    // ============ ETH Distribution Tests ============

    function test_distributeETH_twoRecipients_5050() public {
        // Fund the splitter with 1 ETH
        vm.deal(address(splitter), 1 ether);

        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        uint256[] memory bps = new uint256[](2);
        bps[0] = 5000; // 50%
        bps[1] = 5000; // 50%

        splitter.distributeETH(recipients, bps);

        assertEq(alice.balance, 0.5 ether);
        assertEq(bob.balance, 0.5 ether);
        assertEq(address(splitter).balance, 0);
    }

    function test_distributeETH_threeRecipients_unevenSplit() public {
        vm.deal(address(splitter), 1 ether);

        address[] memory recipients = new address[](3);
        recipients[0] = alice;
        recipients[1] = bob;
        recipients[2] = charlie;

        uint256[] memory bps = new uint256[](3);
        bps[0] = 5000; // 50%
        bps[1] = 3000; // 30%
        bps[2] = 2000; // 20%

        splitter.distributeETH(recipients, bps);

        assertEq(alice.balance, 0.5 ether);
        assertEq(bob.balance, 0.3 ether);
        assertEq(charlie.balance, 0.2 ether);
        assertEq(address(splitter).balance, 0);
    }

    function test_distributeETH_dustGoesToLastRecipient() public {
        // Fund with odd wei amount
        vm.deal(address(splitter), 1001 wei);

        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        uint256[] memory bps = new uint256[](2);
        bps[0] = 5000;
        bps[1] = 5000;

        splitter.distributeETH(recipients, bps);

        assertEq(alice.balance, 500 wei);
        assertEq(bob.balance, 501 wei);
        assertEq(address(splitter).balance, 0);
    }

    function test_distributeETH_withPayableValue() public {
        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        uint256[] memory bps = new uint256[](2);
        bps[0] = 5000;
        bps[1] = 5000;

        // Send ETH with the call
        splitter.distributeETH{value: 1 ether}(recipients, bps);

        assertEq(alice.balance, 0.5 ether);
        assertEq(bob.balance, 0.5 ether);
    }

    function test_distributeETH_revertsOnNoETH() public {
        address[] memory recipients = new address[](1);
        recipients[0] = alice;

        uint256[] memory bps = new uint256[](1);
        bps[0] = 10000;

        vm.expectRevert("No ETH to distribute");
        splitter.distributeETH(recipients, bps);
    }

    function test_receive_acceptsETH() public {
        // Test that the contract can receive ETH
        vm.deal(address(this), 1 ether);
        (bool success, ) = address(splitter).call{value: 1 ether}("");
        assertTrue(success);
        assertEq(address(splitter).balance, 1 ether);
    }

    // ============ Fuzz Tests ============

    function testFuzz_distribute_anyAmount(uint256 amount) public {
        vm.assume(amount > 0 && amount < type(uint128).max);

        token.mint(address(splitter), amount);

        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        uint256[] memory bps = new uint256[](2);
        bps[0] = 5000;
        bps[1] = 5000;

        splitter.distribute(address(token), recipients, bps);

        // Total distributed should equal original amount
        assertEq(token.balanceOf(alice) + token.balanceOf(bob), amount);
        assertEq(token.balanceOf(address(splitter)), 0);
    }
}
