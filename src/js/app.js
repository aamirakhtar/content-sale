App = {
  web3Provider: null,
  owner: 0x0,
  contracts: {},
  account: 0x0,
  loading: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // initialize web3
    if(typeof web3 !== 'undefined') {
      //reuse the provider of the Web3 object injected by Metamask
      App.web3Provider = web3.currentProvider;
    } else {
      //create a new provider and plug it directly into our local node
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    App.displayAccountInfo();

    return App.initContract();
  },

  displayAccountInfo: function() {
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $('#account').text(account);
        web3.eth.getBalance(account, function(err, balance) {
          if(err === null) {
            $('#accountBalance').text(web3.fromWei(balance, "ether") + " ETH");
          }
        })
      }
    });
  },

  initContract: function() {
    $.getJSON('ContentSale.json', function(contentSaleArtifact) {
      // get the contract artifact file and use it to instantiate a truffle contract abstraction
      App.contracts.ContentSale = TruffleContract(contentSaleArtifact);
      // set the provider for our contracts
      App.contracts.ContentSale.setProvider(App.web3Provider);

      // listen to events
      App.listenToEvents();
      // retrieve the content from the contract
      return App.reloadContents();
    });
  },

  reloadContents: function() {
    // avoid reentry
    if(App.loading) {
      return;
    }
    App.loading = true;

    // refresh account information because the balance might have changed
    App.displayAccountInfo();

    var contentSaleInstance;

    App.contracts.ContentSale.deployed().then(function(instance) {
      contentSaleInstance = instance;
      return contentSaleInstance.GetOwner();
    }).then(function(owner) {
        App.owner = owner;

        if(App.account != owner) {
          $('.btn-add').hide();
        }
        else {
          $('.btn-add').show();
        }

        return contentSaleInstance.GetContentIds();
    }).then(function(contentIds) {
      // retrieve the content placeholder and clear it
      $('#contentsRow').empty();

      for(var i = 0; i < contentIds.length; i++) {
        var contentId = contentIds[i];
        contentSaleInstance.GetContent(contentId.toNumber()).then(function(content){
          App.displayContent(content[0], content[1], content[2], content[3], content[4], content[5]);
        });
      }
      App.loading = false;
    }).catch(function(err) {
      console.error(err.message);
      App.loading = false;
    });
  },

  displayContent: function(id, name, price, numberOfBuyers, status) {
    var contentsRow = $('#contentsRow');

    var etherPrice = web3.fromWei(price, "ether");

    var contentTemplate = $("#contentTemplate");
    contentTemplate.find('.panel-title').text(name);
    contentTemplate.find('.panel-title').text(name);
    contentTemplate.find('.content-name').text(name);
    contentTemplate.find('.content-price').text(etherPrice + " ETH");

    contentTemplate.find('.content-number-of-buyers').text(numberOfBuyers);

    contentTemplate.find('.btn-buy').attr('data-id', id);
    contentTemplate.find('.btn-buy').attr('data-value', etherPrice);

    // If content is not already bought
    if (status == 0) {
        contentTemplate.find('.btn-buy').show();
        contentTemplate.find('.content-already-bought').text('Available');
        contentTemplate.find('.panel-heading').html('<h3 class="panel-title">'+name+'</h3>');
    }
    else if (status == 1) {
        contentTemplate.find('.content-already-bought').text('Already Bought');
        contentTemplate.find('.btn-buy').hide();
        contentTemplate.find('.panel-heading').html('<a href="details.html?id=' + id + '" data-id="' + id + '"><h3 class="panel-title">'+name+'</h3></a>');
    }

    // if account is content owner
    if (App.account == App.owner) {
        contentTemplate.find('.btn-buy').hide();
        contentTemplate.find('.content-owner').text("You");
        contentTemplate.find('.panel-heading').html('<a href="details.html?id=' + id + '" data-id="' + id + '"><h3 class="panel-title">'+name+'</h3></a>');
    }
    else {
        contentTemplate.find('.content-owner').text(App.owner);
    }

    // add this new content
    contentsRow.append(contentTemplate.html());
  },

  /*displayDetails: function() {
    $('#detailsTemplate').show();

    if(App.loading) {
      return;
    }
    App.loading = true;

    event.preventDefault();

    var url = $(event.currentTarget).attr('href');

    // retrieve the details
    var _contentId = $(event.currentTarget).data('id');

    App.contracts.ContentSale.deployed().then(function(instance) {
        instance.GetContentInfoAll(_contentId).then(function(details) {
            var id = details[0];
            var name = details[1];
            var description = details[2];
            var price = details[3];
            var numberOfBuyers = details[4];

            var etherPrice = web3.fromWei(price, "ether");

            var detailsTemplate = $("#detailsTemplate");
            detailsTemplate.find('.panel-title-details').text(name);
            detailsTemplate.find('.content-name-details').text(name);
            detailsTemplate.find('.content-description-details').text(description);
            detailsTemplate.find('.content-price-details').text(etherPrice + " ETH");

            detailsTemplate.find('.content-number-of-buyers-details').text(numberOfBuyers);

            App.loading = false;

            window.location = url;
          }).catch(function(err) {
            console.error(err.message);
            alert(err.message);
            App.loading = false;
        });
    });
  },*/

  addContent: function() {
    // retrieve the detail of the content
    var _content_name = $('#content_name').val();
    var _description = $('#content_description').val();
    var _price = web3.toWei(parseFloat($('#content_price').val() || 0), "ether");

    if((_content_name.trim() == '') || (_price == 0)) {
      // nothing to sell
      return false;
    }

    App.contracts.ContentSale.deployed().then(function(instance) {
      return instance.AddContent(_content_name, _description, _price, {
        from: App.account
        //gas: 800000
      });
    }).then(function(result) {
    }).catch(function(err) {
      console.error(err);
    });
  },

  // listen to events triggered by the contract
  listenToEvents: function() {
    App.contracts.ContentSale.deployed().then(function(instance) {
      instance.LogAddContent({}, {}).watch(function(error, event) {
        if (!error) {
          $("#events").append('<li class="list-group-item">' + event.args._name + ' is now added</li>');
        } else {
          console.error(error);
        }
        App.reloadContents();
      });

      instance.LogBuyContent({}, {}).watch(function(error, event) {
        if (!error) {
          $("#events").append('<li class="list-group-item">' + event.args._buyer + ' bought ' + event.args._name + '</li>');
        } else {
          console.error(error);
        }
        App.reloadContents();
      });
    });
  },

  buyContent: function() {
    event.preventDefault();

    // retrieve the content
    var _contentId = $(event.target).data('id');
    var _price = parseFloat($(event.target).data('value'));

    App.contracts.ContentSale.deployed().then(function(instance){
      return instance.BuyContent(_contentId, {
        from: App.account,
        value: web3.toWei(_price, "ether"),
        gas: 500000
      });
    }).catch(function(error) {
      console.error(error);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
    if(window.location.toString().search('content.html') > -1) {
        contentSaleInstance.GetAllContentInfo(contentId.toNumber()).then(function(content){
        App.displayDetails(content[0], content[1], content[2], content[3], content[4], content[5]);
      });
    }
  });
});
