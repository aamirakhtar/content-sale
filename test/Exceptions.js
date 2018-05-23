// contract to be tested
var SaleContent = artifacts.require("./ContentSale.sol");

// test suite
contract("ContentSale", function(accounts){
  var saleContentInstance;
  var seller = accounts[1];
  var buyer = accounts[2];
  var wrongSeller = accounts[2];
  var wrongBuyer = accounts[3];
  var contentName = "content 1";
  var contentDescription = "Description for content 1";
  var contentPrice = 10;

  // no content for sale yet
  it("should throw an exception if you try to buy a content when there is no content yet", function() {
    return SaleContent.deployed().then(function(instance) {
      saleContentInstance = instance;
      return saleContentInstance.BuyContent(1, { from: buyer, value: web3.toWei(contentPrice, "ether") });
    }).then(assert.fail)
    .catch(function(error){
      assert(true);
    }).then(function() {
      return saleContentInstance.GetNumberOfContents();
    }).then(function(data) {
      assert.equal(data.toNumber(), 0, "number of contents must be 0");
    });
  });

  // ****************** Can Buy content ****************** //

  // buy a content that does not exist
  it("should throw an exception if you try to buy a content which does not exist", function() {
    return SaleContent.deployed().then(function(instance){
      saleContentInstance = instance;
      return saleContentInstance.AddContent(contentName, contentDescription, web3.toWei(contentPrice, "ether"), { from: seller });
    }).then(function(receipt){
      return saleContentInstance.BuyContent(2, {from: seller, value: web3.toWei(contentPrice, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      assert(true);
    }).then(function() {
      return saleContentInstance.GetContent(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "content id must be 1");
      assert.equal(data[1], 0x0, "buyer must be empty");
      assert.equal(data[2], contentName, "content name must be " + contentName);
      assert.equal(data[3].toNumber(), web3.toWei(contentPrice, "ether"), "content price must be " + web3.toWei(contentPrice, "ether"));
    });
  });

  // buying your own content you have added
  it("should throw an exception if you try to buy your own content", function() {
    return SaleContent.deployed().then(function(instance){
      saleContentInstance = instance;
      return saleContentInstance.BuyContent(1, {from: seller, value: web3.toWei(contentPrice, "ether")});
    }).then(assert.fail)
    .catch(function(error){
      assert(true);
    }).then(function() {
      return saleContentInstance.GetContent(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "content id must be 1");
      assert.equal(data[1], 0x0, "buyer must be empty");
      assert.equal(data[2], contentName, "content name must be " + contentName);
      assert.equal(data[3].toNumber(), web3.toWei(contentPrice, "ether"), "content price must be " + web3.toWei(contentPrice, "ether"));
    });
  });

  // Buying a content again which you already bought
  // incorrect price
  it("should throw an exception if you try to buy a content with wrong price", function() {
    return SaleContent.deployed().then(function(instance){
      saleContentInstance = instance;
      return saleContentInstance.BuyContent(1, {from: buyer, value: web3.toWei(contentPrice + 1, "ether")});
    }).then(assert.fail)
    .catch(function(error){
      assert(true);
    }).then(function() {
      return saleContentInstance.GetContent(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "content id must be 1");
      assert.equal(data[1], 0x0, "buyer must be empty");
      assert.equal(data[2], contentName, "content name must be " + contentName);
      assert.equal(data[3].toNumber(), web3.toWei(contentPrice, "ether"), "content price must be " + web3.toWei(contentPrice, "ether"));
    });
  });

  it("should throw an exception if you try to buy a content, which you already bought", function() {
    return SaleContent.deployed().then(function(instance){
      saleContentInstance = instance;
      return saleContentInstance.BuyContent(1, {from: buyer, value: web3.toWei(contentPrice, "ether")});
    }).then(function(){
      return saleContentInstance.BuyContent(1, {from: buyer, value: web3.toWei(contentPrice, "ether")});
    }).then(assert.fail)
    .catch(function(error){
      assert(true);
    }).then(function() {
      return saleContentInstance.GetContent(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "content id must be 1");
      assert.equal(data[1], buyer, "buyer must be " + buyer);
      assert.equal(data[2], contentName, "content name must be " + contentName);
      assert.equal(data[3].toNumber(), web3.toWei(contentPrice, "ether"), "content price must be " + web3.toWei(contentPrice, "ether"));
    });
  });

  // ****************** Can Add content ****************** //
  // Adding a content with the wrong seller
  it("should throw an exception if you try to add content with the wrong seller", function() {
    return SaleContent.deployed().then(function(instance){
      saleContentInstance = instance;
      return saleContentInstance.AddContent(contentName, contentDescription, web3.toWei(contentPrice, "ether"), { from: wrongSeller });
    }).then(assert.fail)
    .catch(function(error){
      assert(true);
    }).then(function() {
      return saleContentInstance.GetNumberOfContents();
    }).then(function(data) {
      assert.equal(data.toNumber(), 1, "number of contents must be 1");
    });
  });

  // ****************** Can Access content ****************** //
  // User accessing a content which you haven't bought yet
  it("should throw an exception if you try to access a content which you havent bought", function() {
    return SaleContent.deployed().then(function(instance){
      saleContentInstance = instance;
      return saleContentInstance.GetContentInfoAll(1, {from: wrongBuyer});
    }).then(assert.fail)
    .catch(function(error){
      assert(true);
    }).then(function() {
      return saleContentInstance.GetContent(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "content id must be 1");
      assert.equal(data[1], buyer, "buyer must be " + buyer);
      assert.equal(data[2], contentName, "content name must be " + contentName);
      assert.equal(data[3].toNumber(), web3.toWei(contentPrice, "ether"), "content price must be " + web3.toWei(contentPrice, "ether"));
    });
  });
});
