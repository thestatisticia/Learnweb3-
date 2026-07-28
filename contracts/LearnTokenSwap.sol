// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title LearnTokenSwap
/// @notice Practice swap contract for exchanging test ETH into LEARN points on Base Sepolia.
contract LearnTokenSwap {
    string public constant name = "LearnToken";
    string public constant symbol = "LEARN";
    uint8 public constant decimals = 18;
    uint256 public constant RATE = 10000; // 0.0001 ETH -> 1 LEARN

    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public spentByUser;

    event Swapped(
        address indexed user,
        uint256 ethIn,
        uint256 learnOut
    );

    function swapExactInput() external payable returns (uint256 learnOut) {
        require(msg.value > 0, "no eth sent");

        learnOut = msg.value * RATE;
        balanceOf[msg.sender] += learnOut;
        spentByUser[msg.sender] += msg.value;

        emit Swapped(msg.sender, msg.value, learnOut);
    }
}
