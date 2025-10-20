// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAgriYield {
    function getFarm(
        uint256 farmId
    )
        external
        view
        returns (
            address farmer,
            string memory name,
            string memory description,
            uint256 farmId_,
            uint256 fundingGoal,
            uint256 sharePrice,
            uint256 totalInvested,
            uint256 proceeds,
            uint256 deadline,
            bool verified,
            uint8 status,
            string memory metaCID,
            uint256 minROI,
            uint256 maxROI
        );
}

enum AgriYieldStatus {
    Active,
    Funded,
    PaidOut,
    Settled,
    Closed
}


contract Marketplace is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public AGT; // same AGT token used in AgriYield
    IAgriYield public agriYield;
    address public admin;

    enum OrderStatus {
        Created,
        Shipped,
        Received,
        Completed,
        Disputed,
        Resolved
    }

    struct Listing {
        uint256 farmId;
        address farmer;
        uint256 price; // per unit
        uint256 quantity;
        uint256 quantityRemaining;
        string metadataCID;
        bool isActive;
    }

    struct Order {
        uint256 listingId;
        address buyer;
        address seller;
        uint256 price; // total price
        uint256 quantity;
        string shippingCID;
        string proofCID;
        OrderStatus status;
        bool isDisputed;
        string disputeReasonCID;
        uint256 createdAt;
    }

    uint256 public nextListingId = 1;
    uint256 public nextOrderId = 1;
    uint256 public constant AUTO_RELEASE_PERIOD = 3 days;
    
    address public treasury;
    uint256 public platformFeeBps = 300; // default 3%
    uint256 public constant FEE_BASE = 10000;

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public userOrders; // history for users


    // Events
    event ListingCreated(
        uint256 indexed listingId,
        uint256 indexed farmId,
        address indexed farmer,
        uint256 price,
        uint256 quantity,
        string metadataCID
    );
    event ListingUpdated(
        uint256 indexed listingId,
        uint256 price,
        uint256 quantity
    );
    event ListingDeactivated(uint256 indexed listingId);

    event OrderCreated(
        uint256 indexed orderId,
        uint256 indexed listingId,
        address indexed buyer,
        address seller,
        uint256 price,
        uint256 quantity
    );
    event OrderShipped(uint256 indexed orderId, string shippingCID);
    event OrderReceived(uint256 indexed orderId, string proofCID);
    event FundsReleased(
        uint256 indexed orderId,
        address indexed seller,
        uint256 amount
    );
    event DisputeOpened(uint256 indexed orderId, string reasonCID);
    event DisputeResolved(uint256 indexed orderId, bool sellerFavor);
    event AdminChanged(address indexed newAdmin);
    event PlatformFeeCollected(address indexed payer, uint256 amount, string source, uint256 indexed id);


    constructor(address _AGT, address _agriYield, address _admin, address _treasury) {
        require(_AGT != address(0), "Marketplace: zero token");
        require(_agriYield != address(0), "Marketplace: zero agriYield");
        require(_admin != address(0), "Marketplace: zero admin");
        require(_treasury != address(0), "Marketplace: zero treasury");

        AGT = IERC20(_AGT);
        agriYield = IAgriYield(_agriYield);
        admin = _admin;
        treasury = _treasury;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Marketplace: only admin");
        _;
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Marketplace: zero admin");
        admin = newAdmin;
        emit AdminChanged(newAdmin);
    }

    // Listing Management

    function listItem(
        uint256 farmId,
        uint256 price,
        uint256 quantity,
        string calldata metadataCID
    ) external returns (uint256) {
        require(price > 0, "Marketplace: price>0");
        require(quantity > 0, "Marketplace: qty>0");

        // Verify the caller is the registered farmer for this farm
       (address farmer, , , , , , , , , bool verified, uint8 status, , , ) = agriYield.getFarm(farmId);
        AgriYieldStatus farmStatus = AgriYieldStatus(status);

        require(verified, "Marketplace: farm not verified");
        require(msg.sender == farmer, "Marketplace: only farm owner");
        require(farmStatus == AgriYieldStatus.PaidOut, "Marketplace: farm funding not completed");

        uint256 listingId = nextListingId++;
        listings[listingId] = Listing({
            farmId: farmId,
            farmer: msg.sender,
            price: price,
            quantity: quantity,
            quantityRemaining: quantity,
            metadataCID: metadataCID,
            isActive: true
        });

        emit ListingCreated(
            listingId,
            farmId,
            msg.sender,
            price,
            quantity,
            metadataCID
        );
        return listingId;
    }

    function updateListing(
        uint256 listingId,
        uint256 price,
        uint256 quantity
    ) external {
        Listing storage l = listings[listingId];
        require(l.isActive, "Marketplace: inactive");
        require(msg.sender == l.farmer, "Marketplace: only farmer");
        require(price > 0 && quantity > 0, "Marketplace: invalid args");

        l.price = price;
        l.quantity = quantity;
        l.quantityRemaining = quantity;
        emit ListingUpdated(listingId, price, quantity);
    }

    function deactivateListing(uint256 listingId) external {
        Listing storage l = listings[listingId];
        require(l.isActive, "Marketplace: already inactive");
        require(msg.sender == l.farmer, "Marketplace: only farmer");
        l.isActive = false;
        emit ListingDeactivated(listingId);
    }

    // Order Lifecycle

    function purchase(
        uint256 listingId,
        uint256 quantity
    ) external nonReentrant returns (uint256) {
        Listing storage l = listings[listingId];
        require(l.isActive, "Marketplace: inactive");
        require(
            quantity > 0 && quantity <= l.quantityRemaining,
            "Marketplace: invalid qty"
        );

        uint256 totalPrice = l.price * quantity;

        // transfer payment into escrow (this contract)
        AGT.safeTransferFrom(msg.sender, address(this), totalPrice);
     
        l.quantityRemaining -= quantity;

        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            listingId: listingId,
            buyer: msg.sender,
            seller: l.farmer,
            price: totalPrice,
            quantity: quantity,
            shippingCID: "",
            proofCID: "",
            status: OrderStatus.Created,
            isDisputed: false,
            disputeReasonCID: "",
            createdAt: block.timestamp

        });

        userOrders[msg.sender].push(orderId);
        userOrders[l.farmer].push(orderId);

        emit OrderCreated(
            orderId,
            listingId,
            msg.sender,
            l.farmer,
            totalPrice,
            quantity
        );
        return orderId;
    }

    function shipOrder(uint256 orderId, string calldata shippingCID) external {
        Order storage o = orders[orderId];
        require(msg.sender == o.seller, "Marketplace: only seller");
        require(o.status == OrderStatus.Created, "Marketplace: invalid status");
        require(!o.isDisputed, "Marketplace: disputed");

        o.status = OrderStatus.Shipped;
        o.shippingCID = shippingCID;
        emit OrderShipped(orderId, shippingCID);
    }

    function confirmReceived(
        uint256 orderId,
        string calldata proofCID
    ) external {
        Order storage o = orders[orderId];
        require(msg.sender == o.buyer, "Marketplace: only buyer");
        require(o.status == OrderStatus.Shipped, "Marketplace: invalid status");
        require(!o.isDisputed, "Marketplace: disputed");

        o.status = OrderStatus.Received;
        o.proofCID = proofCID;
        emit OrderReceived(orderId, proofCID);
    }

    function releaseFunds(uint256 orderId) external nonReentrant {
        Order storage o = orders[orderId];
        require(msg.sender == o.buyer, "Marketplace: only buyer");
        require(
            o.status == OrderStatus.Received,
            "Marketplace: invalid status"
        );
        require(!o.isDisputed, "Marketplace: disputed");

        o.status = OrderStatus.Completed;

        uint256 fee = (o.price * platformFeeBps) / FEE_BASE;
        uint256 sellerAmount = o.price - fee;

        if (fee > 0) {
            AGT.safeTransfer(treasury, fee);
            emit PlatformFeeCollected(address(this), fee, "marketplace", orderId);

        } 

        AGT.safeTransfer(o.seller, sellerAmount);
        emit FundsReleased(orderId, o.seller, sellerAmount);
    }

     /// auto-release to seller if buyer never confirms (seller-protection)
    function autoRelease(uint256 orderId) external nonReentrant {
        Order storage o = orders[orderId];
        require(o.status == OrderStatus.Shipped, "Marketplace: invalid status");
        require(block.timestamp > o.createdAt + AUTO_RELEASE_PERIOD, "Marketplace: not yet");
        require(!o.isDisputed, "Marketplace: disputed");

        o.status = OrderStatus.Completed;

        uint256 fee = (o.price * platformFeeBps) / FEE_BASE;
        uint256 sellerAmount = o.price - fee;

        if (fee > 0) {
            AGT.safeTransfer(treasury, fee);
            emit PlatformFeeCollected(address(this), fee, "marketplace", orderId);
        }

        AGT.safeTransfer(o.seller, sellerAmount);
        emit FundsReleased(orderId, o.seller, sellerAmount);
    }

    function openDispute(uint256 orderId, string calldata reasonCID) external {
        Order storage o = orders[orderId];
        require(msg.sender == o.buyer, "Marketplace: only buyer");
        require(
            o.status == OrderStatus.Shipped || o.status == OrderStatus.Received,
            "Marketplace: cannot dispute now"
        );
        require(!o.isDisputed, "Marketplace: already disputed");

        o.isDisputed = true;
        o.status = OrderStatus.Disputed;
        o.disputeReasonCID = reasonCID;
        emit DisputeOpened(orderId, reasonCID);
    }

   /// admin resolves disputes
    function resolveDispute(uint256 orderId, bool sellerFavor) external onlyAdmin {
        Order storage o = orders[orderId];
        require(o.isDisputed, "Marketplace: not disputed");
        require(
            o.status == OrderStatus.Disputed,
            "Marketplace: invalid status"
        );

        o.status = OrderStatus.Resolved;
        o.isDisputed = false;

        if (sellerFavor) {
            AGT.safeTransfer(o.seller, o.price);
        } else {
            AGT.safeTransfer(o.buyer, o.price);
        }

        emit DisputeResolved(orderId, sellerFavor);
    }

    // View Helpers
    function getListing(
        uint256 listingId
    ) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }
    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
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
