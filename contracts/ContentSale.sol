//*********************** Content Sale Contract ***********************//
// version of compiler
pragma solidity ^0.4.18;

import "./Ownable.sol";

contract ContentSale is Ownable {
    //********* Custom Types *********//
    struct Content {
      uint id;
      string name;
      string description;
      uint256 price;
      uint numberOfBuyers;
      address[] buyers;
    }

    struct ContentBuyer {
      uint contentId;
      address buyer;
    }

    enum Status {
      AVAILABLE,
      ALREADY_BOUGHT,
      OWNER
    }
    /*struct ContentView {
    uint id;
    string name;
    uint256 price;
    }*/

    //********* State variables *********//
    mapping (uint => Content) private contents;
    uint contentCounter;

    //mapping (uint => ContentView) public contentViews;

    //mapping (uint => address) public buyers;
    //uint buyerCounter;

    //********* Constructor *********//
    function ContentSale() public {
        owner = msg.sender;
    }

    //********* Modifiers *********//
    modifier CanAccesContent(uint contentId) {
        // check whether there is a content for sale
        require(contentCounter > 0);

        // check that the content exists, by looking into the range of content ids of the mapping
        require(contentId > 0 && contentId <= contentCounter);

        Content storage content = contents[contentId];

        // check if the content exists
        require(content.id > 0);

        // if the account is in the buyers list or account is owner then can access the content
        bool isBuyer = IsContentBuyer(contentId);
        require(isBuyer == true || msg.sender == owner);

        _;
    }

    modifier CanBuyContent(uint contentId) {
        // check whether there is a content for sale
        require(contentCounter > 0);

        // check that the content exists, by looking into the range of content ids of the mapping
        require(contentId > 0 && contentId <= contentCounter);

        // don't allow the owner to buy his own content
        require(msg.sender != owner);

        Content storage content = contents[contentId];

        // check if the content exists
        require(content.id > 0);

        // check that the value sent is equal to the price of the content
        require(msg.value == content.price);

        // check whether the buyer has already bought the content by looking into buyers list of the content
        bool isBuyer = IsContentBuyer(contentId);
        require(isBuyer == false);
        _;
    }

    modifier CanAddContent() {
        // Content can only be added by a specific owner
        require(msg.sender == owner);
        _;
    }

    //********* Events *********//
    event LogBuyContent (
        uint indexed _id,
        address _buyer,
        string _name,
        uint256 _price
    );

    event LogAddContent (
        uint indexed _id,
        string _name,
        uint256 _price
    );

    //********* Functions *********//
    function IsContentBuyer(uint contentId) private returns(bool) {
      bool isBuyer = false;
      Content content = contents[contentId];
      for(uint i=0; i<content.buyers.length; i++)
      {
          if(content.buyers[i] == msg.sender){
              isBuyer = true;
          }
      }
      return isBuyer;
    }

    function AddContent(string name, string description, uint price) public CanAddContent {
        contentCounter++;
        // store this article
        contents[contentCounter] = Content(
          contentCounter,
          name,
          description,
          price,
          0,
          new address[](0)
        );

        LogAddContent(contentCounter, name, price);
    }

    function BuyContent(uint contentId) payable public CanBuyContent(contentId) {
        // retrieve the content
        Content storage content = contents[contentId];

        // keep buyer's information
        content.buyers.push(msg.sender);

        // the buyer can pay the owner now
        owner.transfer(msg.value);

        // trigger the event
        LogBuyContent(contentId, msg.sender, content.name, content.price);
    }

    // fetch and return all content IDs for contents
    function GetContentIds() public view returns (uint[]) {

        uint[] memory contentIds = new uint[](contentCounter);

        uint numberOfContents = 0;
        // iterate over articles
        for(uint i = 1; i <= contentCounter;  i++) {
            contentIds[numberOfContents] = contents[i].id;
            numberOfContents++;
        }

        return contentIds;
    }

    // fetch the buyers in the contract
    function GetBuyers(uint contentId) public view returns (address[]) {
      Content content = contents[contentId];
      return content.buyers;
    }

    // fetch the number of contents in the contract
    function GetNumberOfContents() public view returns (uint) {
        return contentCounter;
    }

    // fetch the number of buyers in the contract
    function GetNumberOfBuyers(uint contentId) public view returns (uint) {
        return contents[contentId].buyers.length;
    }

    //********* Deactivate the Contract *********//
    function kill() public onlyOwner {
      selfdestruct(owner);
    }

    function GetContent(uint contentId) public view returns(uint _id, string _name, uint _price, uint _numberOfBuyers, Status _status)
    {
        // check there is contents in list
        // require(contentId > 0);

        // check that the id coming is in b/w the range of content ids which are added in the list
        // require(contentId > 0 && contentId <= contentCounter);

        Content content = contents[contentId];

        // check if the content exists
        // require(content.id > 0);
        bool isBuyer = IsContentBuyer(contentId);

        Status status = isBuyer ? Status.ALREADY_BOUGHT : Status.AVAILABLE;

        return (content.id, content.name, content.price, content.buyers.length, status);
    }

    //This function as a bug, it does not return array of user defined type
    /*function GetContents() public view returns(ContentView[])
    {
        require(contentCounter > 0);

        ContentView[] memory contentViews = new ContentView[](contentCounter);

        uint numberOfContents = 0;
        // iterate over articles
        for(uint i = 1; i <= contentCounter;  i++) {
            contentViews[numberOfContents].id = contents[i].id;
            contentViews[numberOfContents].name = contents[i].name;
            contentViews[numberOfContents].price = contents[i].price;
            numberOfContents++;
        }

        return contentViews;
    }*/

    function GetContentInfoAll(uint contentId) public view CanAccesContent(contentId) returns(uint _id, string _name, string _description, uint _price, uint _numberOfBuyers)
    {
        Content content = contents[contentId];
        return (content.id, content.name, content.description, content.price, content.buyers.length);
    }

    function GetOwner() public view returns(address) {
      return owner;
    }

    // In orde to recieve ethers
    /*function() public payable
    {

    }*/
}
