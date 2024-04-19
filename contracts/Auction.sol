// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

contract AuctionContract {
  address public owner;
  uint constant FEE = 5;
  uint constant DURATION = 3 days;

  struct Auction {
    uint discountRate;
    uint endAt;
    uint finalPrice;
    bool isStopped;
    string item;
    address payable seller;
    uint startAt;
    uint startPrice;
  }

  Auction[] public auctions;

  constructor() {
    owner = msg.sender;
  }

  event AuctionCreated(uint index, string itemName, uint startingPrice, uint duration);
  event AuctionEnded(uint index, uint finalPrice, address winner);

  function createAuction(string memory _item, uint _startingPrice, uint _discountRate, uint _duration) external {
    uint duration = _duration == 0 ? DURATION : _duration;

    require(_startingPrice >= duration * _discountRate, "Incorrect starting price!");

    Auction memory newAuction = Auction({
      seller: payable(msg.sender),
      item: _item,
      discountRate: _discountRate,
      startPrice: _startingPrice,
      finalPrice: _startingPrice,
      startAt: block.timestamp,
      endAt: block.timestamp + duration,
      isStopped: false
    });

    auctions.push(newAuction);

    emit AuctionCreated(auctions.length -1, _item, _startingPrice, duration);
  }

  function getPriceFor(uint index) public view returns(uint) {
    Auction memory cAuction = auctions[index];

    require(!cAuction.isStopped, "Auction is stopped!");

    uint elapsed = block.timestamp - cAuction.startAt;
    uint discount = cAuction.discountRate * elapsed;
    
    return cAuction.startPrice - discount;
  }

  function buy(uint index) external payable {
    Auction storage cAuction = auctions[index];

    require(!cAuction.isStopped, "Auction is stopped!");
    require(block.timestamp < cAuction.endAt, "Auction is ended!");

    uint cPrice = getPriceFor(index);

    require(msg.value >= cPrice, "not enough funds!");

    cAuction.isStopped = true;
    cAuction.finalPrice = cPrice;

    uint refund = msg.value - cPrice;

    if(refund > 0) {
      payable(msg.sender).transfer(refund);
    }

    cAuction.seller.transfer(cPrice - ((cPrice * FEE) / 100));

    emit AuctionEnded(index, cPrice, msg.sender);
  }
}