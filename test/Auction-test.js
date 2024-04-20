const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AuctionContract', function () {
  let auction, buyer, owner, seller;
  const duration = 60;

  beforeEach(async function () {
    [buyer, owner, seller] = await ethers.getSigners();

    const Auction = await ethers.getContractFactory('AuctionContract', owner);

    auction = await Auction.deploy();
  });

  it('Sets owner', async function () {
    const currentOwner = await auction.owner();

    expect(currentOwner).to.eq(owner.address);
  });

  const getBlock = async (bh) => await ethers.provider.getBlock(bh);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  describe('createAuction', function () {
    it('Creates the auction correctly', async function () {
      const tx = await auction.createAuction('some item', 1000000000000000, 3, duration);
      const cAuction = await auction.auctions(0);
      const block = await getBlock(tx.blockHash);

      expect(cAuction.item).to.eq('some item');
      expect(cAuction.endAt).to.eq(block.timestamp + duration);
    });
  });

  describe('buy', function () {
    it('Allows to buy', async function () {
      await auction.connect(seller).createAuction('some item', 1000000000000000, 3, duration);

      this.timeout(5000);
      await delay(1000);

      const buyTx = await auction.connect(buyer).buy(0, { value: 1000000000000000 });

      const cAuction = await auction.auctions(0);
      const finalPrice = Number(cAuction.finalPrice);

      await expect(() => buyTx).to.changeEtherBalance(
        seller,
        finalPrice - Math.floor((finalPrice * 5) / 100),
      );

      await expect(buyTx).to.emit(auction, 'AuctionEnded').withArgs(0, finalPrice, buyer);

      await expect(auction.connect(buyer).buy(0, { value: 1000000000000000 })).to.revertedWith(
        'Auction is stopped!',
      );
    });
  });
});
