// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title LearnWeb3Badge
/// @notice Simple ERC-721 style explorer badge — one free mint per wallet on testnet.
contract LearnWeb3Badge {
    string public constant name = "LearnWeb3 Explorer";
    string public constant symbol = "LW3E";

    uint256 private _nextTokenId = 1;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(address => bool) public hasMinted;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    function mint() external {
        require(!hasMinted[msg.sender], "already minted");
        hasMinted[msg.sender] = true;
        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = msg.sender;
        _balances[msg.sender]++;
        emit Transfer(address(0), msg.sender, tokenId);
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        require(_owners[tokenId] != address(0), "invalid token");
        return _owners[tokenId];
    }
}
