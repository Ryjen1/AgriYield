// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FarmShares.sol";
import "./MockUSDT.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AgriYield is ReentrancyGuard {
    enum Status {
        Active,
        Funded,
        PaidOut,
        Settled,
        Closed
    }
    struct Farm {
        address farmer;
        string name;
        string description;
        uint256 farmId;
        uint256 fundingGoal;
        uint256 sharePrice;
        uint256 totalInvested;
        uint256 proceeds;
        uint256 deadline;
        bool verified;
        Status status;
        string metaCID;
        uint256 minROI;
        uint256 maxROI;
    }

    mapping(uint256 => Farm) public farms;
    mapping(uint256 => address[]) public farmInvestors;
    mapping(uint256 => mapping(address => uint256)) public investorShares;

    uint256 public farmCounter;
    FarmShares public farmShares;
    MockUSDT public AGT;
    address public admin;
    address public treasury;
    uint256 public platformFeeBps = 300; // default 3%
    uint256 public constant FEE_BASE = 10000;

    event FarmCreated(uint256 indexed farmId, address indexed farmer);
    event FarmVerified(uint256 indexed farmId);
    event InvestmentMade(
        uint256 indexed farmId,
        address indexed investor,
        uint256 amount,
        uint256 shares
    );
    event FundDisbursed(uint256 indexed farmId, uint256 amount);
    event InvestorClaimed(
        uint256 indexed farmId,
        address indexed investor,
        uint256 amount
    );
    event FarmClosed(uint256 indexed farmId);
    event InvestorRefunded(
        uint256 indexed farmId,
        address indexed investor,
        uint256 amount
    );
    event ProceedsDeposited(
        uint256 indexed farmId,
        uint256 amount,
        uint256 roiPercent
    );

    event PlatformFeeCollected(address indexed payer, uint256 amount, string source, uint256 indexed id);

    modifier onlyAdmin() {
        require(msg.sender == admin, "AgriYield: only admin");
        _;
    }

    constructor(address _farmShares, address _AGT, address _admin) {
        require(
            _farmShares != address(0) &&
                _AGT != address(0) &&
                _admin != address(0),
            "AgriYield: zero addr"
        );
        farmShares = FarmShares(_farmShares);
        AGT = MockUSDT(_AGT);
        admin = _admin;
    }

    // FARM CREATION & VERIFICATION
    function createFarm(
        string memory name,
        string memory description,
        uint256 fundingGoal,
        uint256 sharePrice,
        uint256 maxSupply,
        string memory metaCID,
        uint256 deadline,
        uint256 minROI,
        uint256 maxROI
    ) external {
        require(
            fundingGoal > 0 && maxSupply > 0 && sharePrice > 0,
            "AgriYield: invalid args"
        );
        require(
            fundingGoal == sharePrice * maxSupply,
            "AgriYield: inconsistent params"
        );

        require(deadline > block.timestamp, "AgriYield: invalid deadline");
        require(
            minROI < maxROI && maxROI <= 100,
            "AgriYield: invalid ROI range"
        );
        farmCounter++;
        uint256 newId = farmCounter;
        farms[newId] = Farm(
            msg.sender,
            name,
            description,
            newId,
            fundingGoal,
            sharePrice,
            0,
            0,
            deadline,
            false,
            Status.Active,
            metaCID,
            minROI,
            maxROI
        );
        _registerFarmShares(newId, maxSupply, metaCID);
        emit FarmCreated(newId, msg.sender);
    }

    function _registerFarmShares(
        uint256 farmId,
        uint256 maxSupply,
        string memory metaCID
    ) internal {
        farmShares.registerFarm(farmId, maxSupply, metaCID);
    }

    function verifyFarm(uint256 farmId) external onlyAdmin {
        Farm storage farm = farms[farmId];
        require(!farm.verified, "Already verified");
        farm.verified = true;
        emit FarmVerified(farmId);
    }

    function invest(uint256 farmId, uint256 amount) external nonReentrant {
        Farm storage farm = farms[farmId];
        require(farm.verified, "Farm not verified");
        require(farm.status == Status.Active, "Farm not active");
        require(block.timestamp < farm.deadline, "Farm expired");

        uint256 sharesToMint = amount / farm.sharePrice;
        require(sharesToMint > 0, "Investment too small");
        require(
            farm.totalInvested + amount <= farm.fundingGoal,
            "Goal exceeded"
        );

        AGT.transferFrom(msg.sender, address(this), amount);

        // mint shares for investor

        if (investorShares[farmId][msg.sender] == 0) {
            farmInvestors[farmId].push(msg.sender); // record unique investor
        }
        farmShares.mint(msg.sender, farmId, sharesToMint);
        investorShares[farmId][msg.sender] += sharesToMint;
        farm.totalInvested += amount;

        if (farm.totalInvested >= farm.fundingGoal) {
            farm.status = Status.Funded;
        }

        emit InvestmentMade(farmId, msg.sender, amount, sharesToMint);
    }

    // FARMER & INVESTOR FUND FLOWS
    /// @notice Farmer raised funds is disbursed to his address
    function disburseFunds(uint256 farmId) external nonReentrant onlyAdmin {
        Farm storage f = farms[farmId];
        require(f.status == Status.Funded, "AgriYield: not funded");
        require(f.totalInvested > 0, "No funds");

        uint256 gross = f.totalInvested;
        uint256 fee = _calcFee(gross);
        uint256 payout = gross - fee;

        f.totalInvested = 0; // prevent re-use
        f.status = Status.PaidOut;

        if (fee > 0) {
            AGT.transfer(treasury, fee);
            emit PlatformFeeCollected(address(this), fee, "disburse", farmId);
        }
        AGT.transfer(f.farmer, payout);

        
        emit FundDisbursed(farmId, payout);
    }

    function _calcFee(uint256 amount) internal view returns (uint256) {
        if (treasury == address(0) || platformFeeBps == 0) return 0;
        return (amount * platformFeeBps) / FEE_BASE;
    }

    function depositProceeds(
        uint256 farmId,
        uint256 amount
    ) external nonReentrant {
        Farm storage f = farms[farmId];
        require(msg.sender == f.farmer, "Not farmer");
        require(f.status == Status.PaidOut, "Farm not paid out yet");
        require(amount > 0, "Invalid amount");

        _validateProceedsRange(farmId, amount);

        AGT.transferFrom(msg.sender, address(this), amount);
        f.proceeds += amount;
        f.status = Status.Settled;

        uint256 actualROI = ((amount - f.fundingGoal) * 100) / f.fundingGoal;
        emit ProceedsDeposited(farmId, amount, actualROI);
    }

    function _validateProceedsRange(uint farmId, uint256 amount) internal view {
        Farm storage f = farms[farmId];
        uint256 minExpected = f.fundingGoal +
            ((f.fundingGoal * f.minROI) / 100);
        uint256 maxExpected = f.fundingGoal +
            ((f.fundingGoal * f.maxROI) / 100);

        require(
            amount >= minExpected && amount <= maxExpected,
            "AgriYield: ROI out of range"
        );
    }
    /// @notice Investors claim proportional payout after settlement
    function claimInvestorPayout(uint256 farmId) external nonReentrant {
        Farm storage f = farms[farmId];
        require(f.status == Status.Settled, "AgriYield: Not settled");

        uint256 shares = investorShares[farmId][msg.sender];
        require(shares > 0, "AgriYield: No shares to claim");

        // calling an internal function to compute the entitlement
        uint256 entitlement = _computeEntitlement(farmId, f.proceeds, shares);
        investorShares[farmId][msg.sender] = 0;

        // Burn ERC1155 shares
        farmShares.burnShares(msg.sender, farmId, shares);

        uint256 fee = _calcFee(entitlement);
        uint256 payout = entitlement - fee;

        if (fee > 0) {
            AGT.transfer(treasury, fee);
            emit PlatformFeeCollected(address(this), fee, "claim", farmId);
        }

        AGT.transfer(msg.sender, payout);
        emit InvestorClaimed(farmId, msg.sender, entitlement);
    }
    function _computeEntitlement(
        uint256 farmId,
        uint256 totalProceeds,
        uint256 shares
    ) internal view returns (uint256) {
        (uint256 maxSupply, , ) = getFarmInfo(farmId);
        return (totalProceeds * shares) / maxSupply;
    }

    function _refundInvestors(uint256 farmId) internal {
        Farm storage f = farms[farmId];
        require(f.status == Status.Active, "Not refundable");
        require(block.timestamp > f.deadline, "Deadline not reached");

        f.status = Status.Closed;

        uint256 len = farmInvestors[farmId].length;
        for (uint256 i = 0; i < len; i++) {
            address investor = farmInvestors[farmId][i];
            uint256 shares = investorShares[farmId][investor];
            if (shares == 0) continue;

            uint256 refundAmount = shares * f.sharePrice;

            investorShares[farmId][investor] = 0;
            farmShares.burnShares(investor, farmId, shares);
            AGT.transfer(investor, refundAmount);

            emit InvestorRefunded(farmId, investor, refundAmount);
        }
    }

    // DELIST OR CLOSE FARM (after payouts/refunds)
    function delistFarm(uint256 farmId) external onlyAdmin {
        Farm storage f = farms[farmId];
        require(
            f.status == Status.Settled || f.status == Status.Active,
            "Cannot delist"
        );

        // If campaign failed (not funded by deadline), refund investors
        if (f.status == Status.Active && block.timestamp > f.deadline) {
            _refundInvestors(farmId);
        }

        f.status = Status.Closed;
        emit FarmClosed(farmId);
    }

    function getFarm(uint256 farmId) external view returns (Farm memory) {
        return farms[farmId];
    }
    function getFarmInfo(
        uint256 farmId
    )
        public
        view
        returns (uint256 maxSupply, uint256 totalMinted, string memory uri)
    {
        (maxSupply, totalMinted, uri) = farmShares.farms(farmId);
    }

    /// @notice Returns expected ROI range in USDT terms for full funding goal
    function getExpectedReturns(
        uint256 farmId
    ) external view returns (uint256 minExpected, uint256 maxExpected) {
        Farm storage f = farms[farmId];
        minExpected = f.fundingGoal + ((f.fundingGoal * f.minROI) / 100);
        maxExpected = f.fundingGoal + ((f.fundingGoal * f.maxROI) / 100);
    }

    function setTreasury(address _treasury) external onlyAdmin {
        require(_treasury != address(0), "zero addr");
        treasury = _treasury;
    }

    function setPlatformFeeBps(uint256 _bps) external onlyAdmin {
        require(_bps <= 1000, "fee too high"); // e.g. cap 10%
        platformFeeBps = _bps;
    }
}
