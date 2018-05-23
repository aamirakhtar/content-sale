var ChainList = artifacts.require("./ContentSale.sol");

// test suite
contract('ContentSale', function(accounts){
  var contentSaleInstance;
  var seller = accounts[1];
  var buyer = accounts[2];
  var contentName1 = "content 1";
  var contentDescription1 = "Description for content 1";
  var contentPrice1 = 10;
  var contentName2 = "content 2";
  var contentDescription2 = "Description for content 2";
  var contentPrice2 = 20;
  var sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
  var buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

  // All values must be empty in the start
  it("should be initialized with empty values", function() {
    return ChainList.deployed().then(function(instance) {
      contentSaleInstance = instance;
      return contentSaleInstance.GetNumberOfContents();
    }).then(function(data) {
      assert.equal(data.toNumber(), 0, "number of contents must be zero");
      return contentSaleInstance.GetContentIds();
    }).then(function(data){
      assert.equal(data.length, 0, "there shouldn't be any content for sale");
    });
  });

  // Add a first content
  it("should let us add a first content", function() {
    return ChainList.deployed().then(function(instance){
      contentSaleInstance = instance;
      return contentSaleInstance.AddContent(contentName1, contentDescription1, web3.toWei(contentPrice1, "ether"), {from: seller});
    }).then(function(receipt){
      // check event
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogAddContent", "event should be LogAddContent");
      assert.equal(receipt.logs[0].args._id.toNumber(), 1, "id must be 1");
      assert.equal(receipt.logs[0].args._name, contentName1, "event content name must be " + contentName1);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(contentPrice1, "ether"), "event content price must be " + web3.toWei(contentPrice1, "ether"));

      return contentSaleInstance.GetNumberOfContents();
    }).then(function(data) {
      assert.equal(data, 1, "number of contents must be one");

      return contentSaleInstance.GetContentIds();
    }).then(function(data) {
      assert.equal(data.length, 1, "there must be one content for sale");
      assert.equal(data[0].toNumber(), 1, "content id must be 1");

      return contentSaleInstance.GetContent(data[0]);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "content id must be 1");
      assert.equal(data[1], 0x0, "buyer must be empty");
      assert.equal(data[2], contentName1, "content name must be " + contentName1);
      assert.equal(data[3].toNumber(), web3.toWei(contentPrice1, "ether"), "content price must be " + web3.toWei(contentPrice1, "ether"));
    });
  });

  // Add a second content
  it("should let us add a second content", function() {
    return ChainList.deployed().then(function(instance){
      contentSaleInstance = instance;
      return contentSaleInstance.AddContent(contentName2, contentDescription2, web3.toWei(contentPrice2, "ether"), {from: seller});
    }).then(function(receipt){
      // check event
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogAddContent", "event should be LogAddContent");
      assert.equal(receipt.logs[0].args._id.toNumber(), 2, "id must be 2");
      assert.equal(receipt.logs[0].args._name, contentName2, "event content name must be " + contentName2);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(contentPrice2, "ether"), "event content price must be " + web3.toWei(contentPrice2, "ether"));

      return contentSaleInstance.GetNumberOfContents();
    }).then(function(data) {
      assert.equal(data, 2, "number of contents must be two");

      return contentSaleInstance.GetContentIds();
    }).then(function(data) {
      assert.equal(data.length, 2, "there must be two contents for sale");
      assert.equal(data[1].toNumber(), 2, "content id must be 2");

      return contentSaleInstance.GetContent(data[1]);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 2, "content id must be 2");
      assert.equal(data[1], 0x0, "buyer must be empty");
      assert.equal(data[2], contentName2, "content name must be " + contentName2);
      assert.equal(data[3].toNumber(), web3.toWei(contentPrice2, "ether"), "content price must be " + web3.toWei(contentPrice2, "ether"));
    });
  });

  // buy the first content
  it("should buy a content", function() {
    return ChainList.deployed().then(function(instance) {
      contentSaleInstance = instance;
      // record balances of seller and buyer before the buy
      sellerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(seller), "ether").toNumber();
      buyerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(buyer), "ether").toNumber();
      return contentSaleInstance.BuyContent(1, {from: buyer, value: web3.toWei(contentPrice1, "ether")});
    }).then(function(receipt){
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogBuyContent", "event should be LogBuyContent");
      assert.equal(receipt.logs[0].args._id.toNumber(), 1, "content id must be 1");
      assert.equal(receipt.logs[0].args._buyer, buyer, "event buyer must be " + buyer);
      assert.equal(receipt.logs[0].args._name, contentName1, "event content name must be " + contentName1);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(contentPrice1, "ether"), "event content price must be " + web3.toWei(contentPrice1, "ether"));

      // record balances of buyer and seller after the buy
      sellerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(seller), "ether").toNumber();
      buyerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(buyer), "ether").toNumber();

      // check the effect of buy on balances of buyer and seller, accounting for gas
      assert(sellerBalanceAfterBuy == sellerBalanceBeforeBuy + contentPrice1, "seller should have earned " + contentPrice1 + " ETH");
      assert(buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - contentPrice1, "buyer should have spent " + contentPrice1 + " ETH");

      return contentSaleInstance.GetNumberOfContents();
    }).then(function(data){
      assert.equal(data.toNumber(), 2, "there should still be 2 contents in total");
    });
  });

  // Buyer can access the content now
  it("should let us access the first content", function() {
    return ChainList.deployed().then(function(instance){
      contentSaleInstance = instance;
      return contentSaleInstance.GetContentInfoAll(1, {from: buyer});
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "content id must be 1");
      assert.equal(data[1], contentName1, "content name must be " + contentName1);
      assert.equal(data[3].toNumber(), web3.toWei(contentPrice1, "ether"), "content price must be " + web3.toWei(contentPrice1, "ether"));

      return contentSaleInstance.GetNumberOfContents();
    }).then(function(data) {
      assert.equal(data, 2, "number of contents must be two");
    });
  });
});
