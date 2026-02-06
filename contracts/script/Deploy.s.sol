// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {FeedMeSplitter} from "../src/FeedMeSplitter.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_KEY");

        vm.startBroadcast(deployerPrivateKey);

        FeedMeSplitter splitter = new FeedMeSplitter();

        console.log("FeedMeSplitter deployed to:", address(splitter));

        vm.stopBroadcast();
    }
}
