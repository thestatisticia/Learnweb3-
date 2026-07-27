// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title LearnWeb3Progress
/// @notice On-chain XP, badges, and leaderboard for the LearnWeb3 learning app.
contract LearnWeb3Progress {
    address public owner;

    uint256 public constant FUND_XP = 50;
    uint256 public constant SEND_XP = 100;
    uint256 public constant LESSON_XP = 75;
    uint256 public constant QUIZ_XP = 75;

    struct Profile {
        uint256 xp;
        uint256 actionsCompleted;
        string displayName;
        bool registered;
    }

    mapping(address => Profile) private _profiles;
    mapping(address => mapping(uint8 => bool)) public completedActions;
    mapping(address => mapping(uint256 => bool)) public badges;
    address[] public players;

    event Registered(address indexed user, string displayName);
    event ActionCompleted(
        address indexed user,
        uint8 actionId,
        uint256 xpEarned,
        uint256 totalXp
    );
    event BadgeUnlocked(address indexed user, uint256 badgeId);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero");
        owner = newOwner;
    }

    /// @notice Users can set a display name (needs gas). Relayer can also set via setDisplayName.
    function register(string calldata displayName) external {
        _ensureRegistered(msg.sender);
        _profiles[msg.sender].displayName = displayName;
        emit Registered(msg.sender, displayName);
    }

    function setDisplayName(
        address user,
        string calldata displayName
    ) external onlyOwner {
        _ensureRegistered(user);
        _profiles[user].displayName = displayName;
        emit Registered(user, displayName);
    }

    /// @notice Relayer awards XP after a verified learning action (fund, send, lesson, quiz).
    /// actionId: 1=fund, 2=send, 3=lesson, 4=quiz
    function awardAction(address user, uint8 actionId) external onlyOwner {
        require(user != address(0), "zero user");
        require(actionId >= 1 && actionId <= 4, "bad action");
        require(!completedActions[user][actionId], "already completed");

        _ensureRegistered(user);

        uint256 reward = _xpFor(actionId);
        completedActions[user][actionId] = true;
        _profiles[user].xp += reward;
        _profiles[user].actionsCompleted += 1;

        uint256 badgeId = uint256(actionId);
        if (!badges[user][badgeId]) {
            badges[user][badgeId] = true;
            emit BadgeUnlocked(user, badgeId);
        }

        emit ActionCompleted(user, actionId, reward, _profiles[user].xp);
    }

    function getProfile(
        address user
    )
        external
        view
        returns (
            uint256 xp,
            uint256 actionsCompleted,
            string memory displayName,
            bool registered,
            bool[4] memory actionStatus,
            bool[4] memory badgeStatus
        )
    {
        Profile storage p = _profiles[user];
        bool[4] memory actions;
        bool[4] memory badgeArr;
        for (uint8 i = 1; i <= 4; i++) {
            actions[i - 1] = completedActions[user][i];
            badgeArr[i - 1] = badges[user][i];
        }
        return (
            p.xp,
            p.actionsCompleted,
            p.displayName,
            p.registered,
            actions,
            badgeArr
        );
    }

    /// @notice Returns all players (unsorted). Sort by XP off-chain for the leaderboard.
    function getLeaderboard()
        external
        view
        returns (
            address[] memory addrs,
            uint256[] memory xps,
            string[] memory names
        )
    {
        uint256 n = players.length;
        addrs = new address[](n);
        xps = new uint256[](n);
        names = new string[](n);
        for (uint256 i = 0; i < n; i++) {
            address a = players[i];
            addrs[i] = a;
            xps[i] = _profiles[a].xp;
            names[i] = _profiles[a].displayName;
        }
    }

    function playerCount() external view returns (uint256) {
        return players.length;
    }

    function _ensureRegistered(address user) internal {
        if (!_profiles[user].registered) {
            _profiles[user].registered = true;
            players.push(user);
        }
    }

    function _xpFor(uint8 actionId) internal pure returns (uint256) {
        if (actionId == 1) return FUND_XP;
        if (actionId == 2) return SEND_XP;
        if (actionId == 3) return LESSON_XP;
        return QUIZ_XP;
    }
}
