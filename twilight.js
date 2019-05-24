var saito = require('../../lib/saito/saito');
var Game = require('../../lib/templates/game');
var util = require('util');


//////////////////
// CONSTRUCTOR  //
//////////////////
function Twilight(app) {

  if (!(this instanceof Twilight)) { return new Twilight(app); }

  Twilight.super_.call(this);

  this.app             = app;

  this.name            = "Twilight";
  this.browser_active  = 0;
  this.handlesEmail    = 1;
  this.emailAppName    = "Twilight Struggle";
  this.useHUD          = 1;
  this.addHUDMenu      = ['Deck','Lang'];
  this.lang            = "en";

  //
  // this sets the ratio used for determining
  // the size of the original pieces
  //
  this.boardgameWidth  = 5100;

  this.moves           = [];

  //
  // FOR TESTING
  //
  // this adds all cards to the deck right away, and
  // hardcodes the hands for each player (editable) during
  // placement for easier interactive card testing.
  //
  this.is_testing = 1;

  return this;

}
module.exports = Twilight;
util.inherits(Twilight, Game);






Twilight.prototype.triggerHUDMenu = function triggerHUDMenu(menuitem) {

  let twilight_self = this;

  if (menuitem === "deck") {

    let user_message = "View which deck: <p></p><ul>";
        user_message += '<li class="card" id="discards">discard pile</li>';
        user_message += '<li class="card" id="removed">removed cards</li>';
        user_message += '</ul>';

    $('.hud_menu_overlay').html(user_message);

    // leave action enabled on other panels
    //$('.card').off();
    $('.card').on('click', function() {

      let action2 = $(this).attr("id");

      if (action2 === "discards") {

        let user_message = "List of cards in discard pile: <p></p><ul>";
	let cards_in_discard_pile = 0;
	for (var z in twilight_self.game.deck[0].discards) {
	  cards_in_discard_pile++;
            user_message += '<li class="card showcard" id="'+z+'">'+twilight_self.game.deck[0].discards[z].name+'</li>';
	}
        user_message += '</ul>';
	if (cards_in_discard_pile == 0) {
          user_message = "There are no cards in the discard pile.";
	}
        $('.hud_menu_overlay').html(user_message);

      }
      if (action2 === "removed") {

        let user_message = "List of cards removed from game: <p></p><ul>";
	let cards_in_discard_pile = 0;
	for (var z in twilight_self.game.deck[0].removed) {
	  cards_in_discard_pile++;
          user_message += '<li class="card showcard" id="'+z+'">'+twilight_self.game.deck[0].removed[z].name+'</li>';
	}
	if (cards_in_discard_pile == 0) {
          user_message = "There are no cards removed from the game.";
	}
        user_message += '</ul>';
        $('.hud_menu_overlay').html(user_message);

      }

    });
  }

  if (menuitem === "lang") {

    let user_message = "Select Language: <p></p><ul>";
        user_message += '<li class="card" id="english">English</li>';
        user_message += '<li class="card" id="chinese">简体中文</li>';
        user_message += '</ul>';

    $('.hud_menu_overlay').html(user_message);

    // leave action enabled on other panels
    //$('.card').off();
    $('.card').on('click', function() {

      let action2 = $(this).attr("id");

      if (action2 === "english") {
	alert("Card settings changed to English");
	twilight_self.lang = "en";
      }
      if (action2 === "chinese") {
	alert("卡牌语言改成简体中文");
	twilight_self.lang = "zh";
      }

    });
  }


  //
  // we explicitly add this in the mobile version
  //
  if (menuitem == "log") {
    $('.hud_menu_overlay').html($('.log').html());
    $('.logcard').mouseover(function() {
      let card = $(this).attr("id");
      twilight_self.showCard(card);
    }).mouseout(function() {
      let card = $(this).attr("id");
      twilight_self.hideCard(card);
    });
  }

}






////////////////
// initialize //
////////////////
Twilight.prototype.initializeGame = function initializeGame(game_id) {

  //
  // enable chat
  //
  if (this.browser_active == 1) {
    const chat = this.app.modules.returnModule("Chat");
    chat.addPopUpChat();
  }


  this.updateStatus("loading game...");
  this.loadGame(game_id);

  if (this.game.status != "") { this.updateStatus(this.game.status); }


  //
  // initialize
  //
  if (this.game.countries == undefined) {
    this.game.countries = this.returnCountries();
  }
  if (this.game.state == undefined) {
    this.game.state = this.returnState();
  }
  if (this.game.deck.length == 0) {

    this.updateStatus("Generating the Game");

    this.game.queue.push("round");
    if (this.game.options.usbonus != undefined) {
      if (this.game.options.usbonus > 0) {
        this.game.queue.push("placement_bonus\t2\t"+this.game.options.usbonus);
      }
    }
    this.game.queue.push("placement\t2");
    this.game.queue.push("placement\t1");
    this.game.queue.push("EMAIL\tready");
    this.game.queue.push("DEAL\t1\t2\t8");
    this.game.queue.push("DEAL\t1\t1\t8");
    this.game.queue.push("DECKENCRYPT\t1\t2");
    this.game.queue.push("DECKENCRYPT\t1\t1");
    this.game.queue.push("DECKXOR\t1\t2");
    this.game.queue.push("DECKXOR\t1\t1");

    //
    // TESTING
    //
    if (this.is_testing == 1) {
      let a = this.returnEarlyWarCards();
      let b = this.returnMidWarCards();
      let c = this.returnLateWarCards();
      let d = Object.assign({}, a, b);
      let e = Object.assign({}, d, c);
      console.log("CARDS: " + JSON.stringify(e));
      this.game.queue.push("DECK\t1\t"+JSON.stringify(e));
    } else {
      this.game.queue.push("DECK\t1\t"+JSON.stringify(this.returnEarlyWarCards()));
    }
    this.game.queue.push("init");

    if (this.game.dice === "") {
      this.initializeDice();
    }

  }

  this.countries = this.game.countries;

  //
  // adjust screen ratio
  //
  $('.country').css('width', this.scale(202)+"px");
  $('.us').css('width', this.scale(100)+"px");
  $('.ussr').css('width', this.scale(100)+"px");
  $('.us').css('height', this.scale(100)+"px");
  $('.ussr').css('height', this.scale(100)+"px");

  //
  // update defcon and milops and stuff
  //
  this.updateDefcon();
  this.updateActionRound();
  this.updateSpaceRace();
  this.updateVictoryPoints();
  this.updateMilitaryOperations();
  this.updateRound();

  //
  // move cardbox left if conflicts with HUD
  //
  if (this.app.BROWSER == 1) {
    if (window != undefined) {
      if (window.innerHeight <= 975 && $(window).width() > 700) {
        $('.cardbox').css('left','188px');
      }
    }
  }



  //
  // initialize interface
  //
  for (var i in this.countries) {

    let divname      = '#'+i;
    let divname_us   = divname + " > .us > img";
    let divname_ussr = divname + " > .ussr > img";

    let us_i   = 0;
    let ussr_i = 0;

    //
    // position divs
    //
    $(divname).css('top', this.scale(this.countries[i].top)+"px");
    $(divname).css('left', this.scale(this.countries[i].left)+"px");
    $(divname_us).css('height', this.scale(100)+"px");
    $(divname_ussr).css('height', this.scale(100)+"px");

    //
    // restore influence
    //
    if (this.countries[i].us > 0) { this.showInfluence(i, "us"); }
    if (this.countries[i].ussr > 0) { this.showInfluence(i, "ussr"); }
  } 


  //
  // 
  //
  if (this.app.browser.isMobileBrowser(navigator.userAgent)) {
    $('.cardbox').css('z-index','90000');
  }

/****** OLD ZOOM BUTTONS 
  //
  // pinch-to-zoom
  //
  let scale = 1;

  if (this.app.browser.isMobileBrowser(navigator.userAgent) == 1) {

    $('.menu-dropdown').html('<div style="float:left;" class="zoom_button zoomout"><span style="margin-top:7px" class="fa fa-plus-circle"> </span></div><div style="float:left;margin-left:20px;" class="zoom_button zoomin"><span style="margin-top:7px" class="fa fa-minus-circle"> </span></div>');
    $('.menu-dropdown').css('display','block');
    $('.menu-dropdown').css('width','140px');
    $('.menu-dropdown').css('flex-direction','');
    $('.status').css('background-color','black');
    $('.status').css('width','100%');

    $('.zoomin').on('click',function() {
      scale -= 0.2;
      if (scale < 0.2) { scale = 0.2; }
      $('.gameboard').css('transform','scale('+scale+')');
      $('.gameboard').css('transform-origin','0% 0% 0px');
    });
    $('.zoomout').on('click',function() {
      scale += 0.2;
      if (scale > 2) { scale = 2; }
      $('.gameboard').css('transform','scale('+scale+')');
      $('.gameboard').css('transform-origin','0% 0% 0px');
    });

  }
********/


  var element = document.getElementById('gameboard');

  if (element !== null) {
    var hammertime = new Hammer(element, {});

    hammertime.get('pinch').set({ enable: true });
    hammertime.get('pan').set({ threshold: 0 });

    var fixHammerjsDeltaIssue = undefined;
    var pinchStart = { x: undefined, y: undefined }
    var lastEvent = undefined;

    var originalSize = {
      width: 2550,
      height: 1650
    }

    var current = {
      x: 0,
      y: 0,
      z: 1,
      zooming: false,
      width: originalSize.width * 1,
      height: originalSize.height * 1,
    }

    var last = {
      x: current.x,
      y: current.y,
      z: current.z
    }

    function getRelativePosition(element, point, originalSize, scale) {
      var domCoords = getCoords(element);

      var elementX = point.x - domCoords.x;
      var elementY = point.y - domCoords.y;

      var relativeX = elementX / (originalSize.width * scale / 2) - 1;
      var relativeY = elementY / (originalSize.height * scale / 2) - 1;
      return { x: relativeX, y: relativeY }
    }

    function getCoords(elem) { // crossbrowser version
      var box = elem.getBoundingClientRect();

      var body = document.body;
      var docEl = document.documentElement;

      var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
      var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

      var clientTop = docEl.clientTop || body.clientTop || 0;
      var clientLeft = docEl.clientLeft || body.clientLeft || 0;

      var top  = box.top +  scrollTop - clientTop;
      var left = box.left + scrollLeft - clientLeft;

      return { x: Math.round(left), y: Math.round(top) };
    }

    function scaleFrom(zoomOrigin, currentScale, newScale) {
      var currentShift = getCoordinateShiftDueToScale(originalSize, currentScale);
      var newShift = getCoordinateShiftDueToScale(originalSize, newScale)

      var zoomDistance = newScale - currentScale

      var shift = {
              x: currentShift.x - newShift.x,
              y: currentShift.y - newShift.y,
      }

      var output = {
          x: zoomOrigin.x * shift.x,
          y: zoomOrigin.y * shift.y,
          z: zoomDistance
      }
      return output
    }


    function getCoordinateShiftDueToScale(size, scale){
      var newWidth = scale * size.width;
      var newHeight = scale * size.height;
      var dx = (newWidth - size.width) / 2
      var dy = (newHeight - size.height) / 2
      return {
        x: dx,
        y: dy
      }
    }

    hammertime.on('pan', function(e) {
      if (lastEvent !== 'pan') {
        fixHammerjsDeltaIssue = {
          x: e.deltaX,
          y: e.deltaY
        }
      }

      current.x = last.x + e.deltaX - fixHammerjsDeltaIssue.x;
      current.y = last.y + e.deltaY - fixHammerjsDeltaIssue.y;
      lastEvent = 'pan';
      update();
    });

    hammertime.on('pinch', function(e) {
      var d = scaleFrom(pinchZoomOrigin, last.z, last.z * e.scale)
      current.x = d.x + last.x + e.deltaX;
      current.y = d.y + last.y + e.deltaY;
      current.z = d.z + last.z;
      lastEvent = 'pinch';
      update();
    })

    var pinchZoomOrigin = undefined;
    hammertime.on('pinchstart', function(e) {
      pinchStart.x = e.center.x;
      pinchStart.y = e.center.y;
      pinchZoomOrigin = getRelativePosition(element, { x: pinchStart.x, y: pinchStart.y }, originalSize, current.z);
      lastEvent = 'pinchstart';
    })

    hammertime.on('panend', function(e) {
      last.x = current.x;
      last.y = current.y;
      lastEvent = 'panend';
    })

    hammertime.on('pinchend', function(e) {
      last.x = current.x;
      last.y = current.y;
      last.z = current.z;
      lastEvent = 'pinchend';
    })

    function update() {
      current.height = originalSize.height * current.z;
      current.width = originalSize.width * current.z;
      element.style.transform = "translate3d(" + current.x + "px, " + current.y + "px, 0) scale(" + current.z + ")";
    }
  }

}





//
// Core Game Logic
//
Twilight.prototype.handleGame = function handleGame(msg=null) {

  let twilight_self = this;
  let player = "ussr"; if (this.game.player == 2) { player = "us"; }

  if (this.game.over == 1) {
    let winner = "ussr";
    if (this.game.winner == 2) { winner = "us"; }
    let gid = $('#sage_game_id').attr("class");
    if (gid === this.game.id) {
      this.updateStatus("Game Over: "+winner.toUpperCase() + " wins");
    }
    return 0;
  }

  if (msg != null) {
    if (msg.extra != null) {

      //
      // if my turn, update
      //
      if (msg.extra.target == this.game.player) {
        this.game.state.opponent_cards_in_hand = msg.extra.cards_in_hand;
      }
    }
  }



  ///////////
  // QUEUE //
  ///////////
  if (this.game.queue.length > 0) {

console.log("QUEUE: " + JSON.stringify(this.game.queue));

      let qe = this.game.queue.length-1;
      let mv = this.game.queue[qe].split("\t");
      let shd_continue = 1;

      //
      // cambridge region
      // chernobyl region
      // grainsales sender card
      // missileenvy sender card
      // latinamericandebtcrisis (if USSR can double)
      // che ussr country_of_target1
      //
      // start round
      // flush [discards] // empty discards pile if exists
      // placement (initial placement)
      // ops [us/ussr] card num
      // round
      // move [us/ussr]
      // turn [us/ussr]
      // event [us/ussr] card
      // remove [us/ussr] [us/ussr] countryname influence     // player moving, then player whose ops to remove
      // place [us/ussr] [us/ussr] countryname influence      // player moving, then player whose ops to remove
      // resolve card
      // space [us/ussr] card
      // defcon [lower/raise]
      // notify [msg]
      // coup [us/ussr] countryname influence
      // realign [us/ussr] countryname
      // card [us/ussr] card  --> hand card to play
      // vp [us/ussr] points [delay_settlement_until_end_of_turn=1]
      // discard [us/ussr] card --> discard from hand
      // discard [ussr/us] card
      // deal [1/2]  --- player decides how many cards they need, adds DEAL and clears when ready
      // init
      //
      if (mv[0] == "init") {

        //
        // OPTIONAL - players pick sides
        //
        let tmpar = this.game.id.split("&");
        if (this.game.options.player1 != undefined) {

	  //
	  // random pick
	  //
	  if (this.game.options.player1 == "random") {
	    let roll = this.rollDice(6);
	    if (roll <= 3) {
	      this.game.options.player1 = "us";
	    } else {
	      this.game.options.player1 = "ussr";
	    }
	  }


          if (tmpar[0] === this.app.wallet.returnPublicKey()) {
            if (this.game.options.player1 == "us") {
              this.game.player = 2;
            } else {
              this.game.player = 1;
            }
          } else {
            if (this.game.options.player1 == "us") {
              this.game.player = 1;
            } else {
              this.game.player = 2;
            }
	  }
        }

        this.game.queue.splice(qe, 1);

      }
      if (mv[0] === "turn") {

  	this.game.state.turn_in_round++;
        this.game.state.events.china_card_eligible = 0;
        this.game.queue.splice(qe, 1);
	this.updateActionRound();

      }
      if (mv[0] === "discard") {
        if (mv[2] === "china") { 
	  //
	  // china card switches hands
	  //
	  if (mv[1] == "ussr") {
	    this.updateLog("China Card passes to US face down");
	    this.game.state.events.china_card = 2; 
	  }
	  if (mv[1] == "us") {
	    this.updateLog("China Card passes to USSR face down");
	    this.game.state.events.china_card = 1; 
	  }
        } else {
          for (var i in this.game.deck[0].cards) {
            if (mv[2] == i) {
	      if (this.game.deck[0].cards[mv[2]] != undefined) {
                //
                // move to discard pile
                //
                this.updateLog(mv[1].toUpperCase() + " discards <span class=\"logcard\" id=\""+mv[2]+"\">" + this.game.deck[0].cards[mv[2]].name + "</span>");
	        //
	        // discard pile is parallel to normal
	        //
                this.game.deck[0].discards[i] = this.game.deck[0].cards[i];
	      }
	    }
          }
        }
        this.game.queue.splice(qe, 1);
      }
      //
      // wargames
      //
      if (mv[0] == "wargames") {

        let player = mv[1];
        let activate = parseInt(mv[2]);

	if (activate == 0) {

	  //
	  // card is discarded, nothing happens
	  //
	
	} else {

          if (player == "us") {
            this.game.state.vp -= 6;
            this.updateVictoryPoints();
            if (this.game.state.vp > 0) {
    	      this.endGame("ussr","Wargames");
            }
            if (this.game.state.vp < 0) {
  	      this.endGame("ussr","Wargames");
            }
            if (this.game.state.vp == 0) {
	      this.endGame("ussr","Wargames");
            }
          } else {
            this.game.state.vp += 6;
            this.updateVictoryPoints();
            if (this.game.state.vp > 0) {
  	      this.endGame("ussr","Wargames");
            }
            if (this.game.state.vp < 0) {
	      this.endGame("ussr","Wargames");
            }
            if (this.game.state.vp == 0) {
	      this.endGame("us","Wargames");
            }
          }

	}

        this.game.queue.splice(qe, 1);
      }
     


      //
      // grainsales
      //
      if (mv[0] === "grainsales") {

	//
	// this is the ussr telling the 
        // us what card they can choose
	//
        if (mv[1] == "ussr") {

	  // remove the command triggering this
          this.game.queue.splice(qe, 1);

	  if (this.game.player == 2) {

            let html  = "Grain Sales pulls <span class=\"showcard\" id=\""+mv[2]+"\">" + this.game.deck[0].cards[mv[2]].name + "</span> from USSR. Do you want to play this card?";
	    if (mv[2] == "unintervention" && this.game.state.headline == 1) {} else {
                html += '<li class="card" id="play">play card</li>';
	    }
                html += '<li class="card" id="nope">return card</li>';
                html += '</ul>';
            this.updateStatus(html);

	    let twilight_self = this;

	    $('.card').off();
      $('.showcard').off();

  	    $('.showcard').mouseover(function() {
	      let card = $(this).attr("id");
	      twilight_self.showCard(card);
	    }).mouseout(function() {
	      let card = $(this).attr("id");
	      twilight_self.hideCard(card);
      });

	    $('.card').on('click', function() {
        let action2 = $(this).attr("id");

        if (action2 == "play") {
          // trigger play of selected card
          twilight_self.addMove("resolve\tgrainsales");
          twilight_self.playerTurn(mv[2]);
        }
        if (action2 == "nope") {
          twilight_self.addMove("resolve\tgrainsales");
          twilight_self.addMove("ops\tus\tgrainsales\t2");
          twilight_self.addMove("grainsales\tus\t"+mv[2]);
          twilight_self.endTurn();
        }
	    });
	  }
	  shd_continue = 0;
	}

	//
	// this is the us telling the
	// ussr they are returning a
	// card
	//
	if (mv[1] == "us") {

	  if (this.game.player == 1) {
	    this.game.deck[0].hand.push(mv[2]);
	  }

          this.game.queue.splice(qe, 1);
          shd_continue = 1;
	}
      }
      //
      // Che
      //
      if (mv[0] == "checoup") {

	let target1 = mv[2];
	let original_us = this.countries[mv[2]].us;
	let twilight_self = this;
	let couppower = mv[3];

	//
	// this is the first coup, which runs on both 
	// computers, so they can collectively see the
	// results.
	//
	twilight_self.playCoup("ussr", mv[2], couppower, function() {
	  if (twilight_self.countries[mv[2]].us < original_us) {
	    let valid_targets = 0;
	    for (var i in twilight_self.countries) {
	      let countryname = i;
	      if ( twilight_self.countries[countryname].bg == 0 && (twilight_self.countries[countryname].region == "africa" || twilight_self.countries[countryname].region == "camerica" || twilight_self.countries[countryname].region == "samerica") && twilight_self.countries[countryname].us > 0 ) {
	        if (countryname !== target1) {
	          valid_targets++;
		}
	      }
	    }

	    if (valid_targets == 0) {
      	      twilight_self.updateLog("No valid targets for Che");
              twilight_self.game.queue.splice(qe, 1);
	      shd_continue = 1;
    	    } else {

	      if (twilight_self.game.player == 1) {

	        twilight_self.addMove("resolve\tchecoup");
	        twilight_self.updateStatus("Pick second target for coup:");
                twilight_self.playerFinishedPlacingInfluence();

	        let user_message = "Che takes effect. Pick first target for coup:<p></p><ul>";
        	    user_message += '<li class="card" id="skipche">or skip coup</li>';
       	  	    user_message += '</ul>';
      	        twilight_self.updateStatus(user_message);

	        $('.card').off();
	        $('.card').on('click', function() {
	          let action2 = $(this).attr("id");
	          if (action2 == "skipche") {
	            twilight_self.updateStatus("Skipping Che coups...");
	            twilight_self.addMove("resolve\tchecoup");
	            twilight_self.endTurn();
	          }
	        });


      	        for (var i in twilight_self.countries) {
	          let countryname  = i;
	          let divname      = '#'+i;
	          if ( twilight_self.countries[countryname].bg == 0 && (twilight_self.countries[countryname].region == "africa" || twilight_self.countries[countryname].region == "camerica" || twilight_self.countries[countryname].region == "samerica") && countryname !== target1) {
	            $(divname).off();
	            $(divname).on('click', function() {
		      let c = $(this).attr('id');
		      twilight_self.addMove("coup\tussr\t"+c+"\t"+couppower);
		      twilight_self.endTurn();
		    });
		  } else {
	            $(divname).off();
	            $(divname).on('click', function() {
		      alert("Invalid Target");
		    });
		  }
	        }
	      }

	      //
	      // ussr will tell us who to coup next
	      //
              twilight_self.game.queue.splice(qe, 1);
	      shd_continue = 0;

	    }


	  } else {
	    //
	    // done
	    //
            twilight_self.game.queue.splice(qe, 1);
	    shd_continue = 1;
	  }

	});

      }
      //
      // missileenvy \t sender \t card
      //
      if (mv[0] === "missileenvy") {

        let sender = mv[1];
        let card = mv[2];
	let receiver = "us";
        let discarder = "ussr";
        if (sender == 2) { receiver = "ussr"; discarder = "us"; }

        this.game.state.events.missile_envy = sender;

        let opponent_card = 0;
        if (this.game.deck[0].cards[card].player == "us" && sender == 2) { opponent_card = 1; }
        if (this.game.deck[0].cards[card].player == "ussr" && sender == 1) { opponent_card = 1; }

        // remove missileenvy from queue
        this.game.queue.splice(qe, 1);

	//
	// play for ops
	//
	if (opponent_card == 1) {
	  this.game.queue.push("discard\t"+discarder+"\t"+card);
	  this.game.queue.push("ops\t"+receiver+"\t"+card+"\t"+this.game.deck[0].cards[card].ops);
	  this.game.queue.push("notify\t"+discarder.toUpperCase() + " offers card " + this.game.deck[0].cards[card].name + ": play for OPS");
        }

	//
	// or play for event
	//
        if (opponent_card == 0) {
	  this.game.queue.push("discard\t"+discarder+"\t"+card);
	  this.game.queue.push("event\t"+receiver+"\t"+card);
	  this.game.queue.push("notify\t"+discarder.toUpperCase() + " offers card " + this.game.deck[0].cards[card].name + ": event triggers");
	}

        //
        // remove card from hand
        //
        if (this.game.player == sender) {
	  this.removeCardFromHand(card);
        }

	shd_continue = 1;

      }
      //
      // quagmire ussr/us card
      //
      if (mv[0] === "quagmire") {

        let roll = this.rollDice(6);

	//this.updateLog(mv[1].toUpperCase() + " discards <span class=\"logcard\" id=\""+mv[2]+"\">" + this.game.deck[0].cards[mv[2]].name + "</span>");
	this.updateLog(mv[1].toUpperCase() + " rolls a " + roll);

        if (roll < 5) {

	  if (mv[1] == "ussr") {
	    this.game.state.events.beartrap = 0;
  	    this.updateLog("Bear Trap ends");
	  }
	  if (mv[1] == "us") {
	    this.game.state.events.quagmire = 0;
  	    this.updateLog("Quagmire ends");
	  }

        } else {
          if (mv[1] == "ussr") {
  	    this.updateLog("Bear Trap continues...");
	  }
          if (mv[1] == "us") {
  	    this.updateLog("Quagmire continues...");
	  }
        }

        this.game.queue.splice(qe, 1);
        shd_continue = 1;

      }
      //
      // tehran
      //
      if (mv[0] == "tehran") {

        let twilight_self = this;
	let sender  = mv[1];
	let keysnum = mv[2];
        this.game.queue.splice(qe, 1);

	if (sender == "ussr") {

	  //
	  // ussr has sent keys to decrypt
	  //
	  if (this.game.player == 1) {

	    for (let i = 0; i < keysnum; i++) { this.game.queue.splice(this.game.queue.length-1, 1); }	  
	    shd_continue = 0;

	  } else {

	    //
	    // us decrypts and decides what to toss
	    //
	    var cardoptions = [];
	    var pos_to_discard = [];

	    for (let i = 0; i < keysnum; i++) { 
	      cardoptions[i] = this.game.deck[0].crypt[i];
	      cardoptions[i] = this.app.crypto.decodeXOR(cardoptions[i], this.game.deck[0].keys[i]);
	    }
	    for (let i = 0; i < keysnum; i++) { 
	      cardoptions[i] = this.app.crypto.decodeXOR(cardoptions[i], this.game.queue[this.game.queue.length-keysnum+i]);
	      cardoptions[i] = this.app.crypto.hexToString(cardoptions[i]);
	    }
            for (let i = 0; i < keysnum; i++) {
 	      this.game.queue.splice(this.game.queue.length-1, 1);
	    }

            let user_message = "Select cards to discard:<p></p><ul>";
            for (let i = 0; i < cardoptions.length; i++) {
              user_message += '<li class="card" id="'+this.game.deck[0].crypt[i]+'_'+cardoptions[i]+'">'+this.game.deck[0].cards[cardoptions[i]].name+'</li>';
	    }
            user_message += '</ul><p></p>When you are done discarding <span class="card dashed" id="finished">click here</span>.';
            twilight_self.updateStatus(user_message);

	    //
	    // cardoptions is in proper order
	    //
            let cards_discarded = 0;

            $('.card').off();
            $('.card').on('click', function() {

              let action2 = $(this).attr("id");

              if (action2 == "finished") {
	
		for (let i = 0; i < pos_to_discard.length; i++) { twilight_self.addMove(pos_to_discard[i]); }
		twilight_self.addMove("tehran\tus\t"+cards_discarded);
                twilight_self.endTurn();

              } else {

		let tmpar = action2.split("_");

                $(this).hide();
		pos_to_discard.push(tmpar[0]);
	        cards_discarded++;
                twilight_self.addMove("discard\tus\t"+tmpar[1]);
                twilight_self.addMove("notify\tUS discards <span class=\"logcard\" id=\""+tmpar[1]+"\">"+twilight_self.game.deck[0].cards[tmpar[1]].name +"</span>");

              }
            });
          }

	  shd_continue = 0;

	} else {

	  //
	  // us has sent keys to discard back
	  //
	  let removedcard = [];
	  for (let i = 0; i < keysnum; i++) {
	    removedcard[i] = this.game.queue[this.game.queue.length-1];
 	    this.game.queue.splice(this.game.queue.length-1, 1);
          }

	  for (let i = 0; i < 5; i++) {
	    if (removedcard.includes(this.game.deck[0].crypt[i])) {
	      //
	      // set cards to zero
	      //
	      this.game.deck[0].crypt[i] = "";
	      this.game.deck[0].keys[i] = "";
	    }
	  }

          //
	  // remove empty elements
	  //
	  var newcards = [];
	  var newkeys  = [];
	  for (let i = 0; i < this.game.deck[0].crypt.length; i++) {
	    if (this.game.deck[0].crypt[i] != "") {
	      newcards.push(this.game.deck[0].crypt[i]);
	      newkeys.push(this.game.deck[0].keys[i]);
	    }
	  }

	  //
	  // keys and cards refreshed
	  //
	  this.game.deck[0].crypt = newcards;
	  this.game.deck[0].keys = newkeys;

	}
      }
      //
      // limit [restriction] [region]
      //
      if (mv[0] == "limit") {
        if (mv[1] == "china") { this.game.state.events.china_card_in_play = 1; }
        if (mv[1] == "coups") { this.game.state.limit_coups = 1; }
        if (mv[1] == "spacerace") { this.game.state.limit_spacerace = 1; }
        if (mv[1] == "realignments") { this.game.state.limit_realignments = 1; }
        if (mv[1] == "placement") { this.game.state.limit_placement = 1; }
        if (mv[1] == "milops") { this.game.state.limit_milops = 1; }
        if (mv[1] == "ignoredefcon") { this.game.state.limit_ignoredefcon = 1; }
        if (mv[1] == "region") { this.game.state.limit_region += mv[2]; }
        this.game.queue.splice(qe, 1);
      }
      if (mv[0] == "flush") {

	if (mv[1] == "discards") {
	  this.game.deck[0].discards = {};
	}
        this.game.queue.splice(qe, 1);

      }
      //
      // latinamericandebtcrisis
      //
      if (mv[0] == "latinamericandebtcrisis") {

        let twilight_self = this;


        if (this.game.player == 2) {
          this.game.queue.splice(qe, 1);
          return 0;
        }

        if (this.game.player == 1) {

          this.game.queue.splice(qe, 1);

	  let countries_to_double = 0;
          for (var i in this.countries) {
	    if (this.countries[i].region == "samerica") {
	      if (this.countries[i].ussr > 0) { countries_to_double++; }
	    }
	  }
          if (countries_to_double > 2) { countries_to_double = 2; }
          if (countries_to_double == 0) {
	    this.addMove("notify\tUSSR has no countries with influence to double");
	    this.endTurn();
	    return 0;
	  }


	  this.updateStatus("Select "+countries_to_double+" countries in South America to double USSR influence");

	  //
	  // double influence in two countries
	  //
          for (var i in this.countries) {

            let countryname  = i;
            let divname      = '#'+i;

            if (this.countries[i].region == "samerica") {

              if (this.countries[i].ussr > 0 ) {
                twilight_self.countries[countryname].place = 1;
              }

              $(divname).off();
              $(divname).on('click', function() {

	        let countryname = $(this).attr('id');

                if (twilight_self.countries[countryname].place == 1) {
		  let ops_to_place = twilight_self.countries[countryname].ussr;
                  twilight_self.placeInfluence(countryname, ops_to_place, "ussr", function() {
                    twilight_self.addMove("place\tussr\tussr\t"+countryname+"\t" + ops_to_place);
	  	    twilight_self.countries[countryname].place = 0;
                    countries_to_double--;
                    if (countries_to_double == 0) {
                      twilight_self.playerFinishedPlacingInfluence();
                      twilight_self.endTurn();
                    }
	          });
                } else {
                  alert("Invalid Target");
                }
              });
            }
          }
        }
        return 0;
      }
      //
      // north sea oil bonus turn
      //
      if (mv[0] == "northsea") {
        if (this.game.player == 1) {
          let html  = "US determining whether to take extra turn";
          this.updateStatus(html);
        }
        if (this.game.player == 2) {
          let html  = "Do you wish to take an extra turn:<p></p><ul>";
          html += '<li class="card" id="play">play turn</li>';
          html += '<li class="card" id="nope">no turn</li>';
          html += '</ul>';
          this.updateStatus(html);

	  let twilight_self = this;

	  $('.card').off();
	  $('.card').on('click', function() {

	    let action2 = $(this).attr("id");

	    if (action2 == "play") {
		twilight_self.addMove("resolve\tnorthsea");
		twilight_self.addMove("play\t2");
		twilight_self.endTurn();
	    }
	    if (action2 == "nope") {
		twilight_self.addMove("resolve\tnorthsea");
		twilight_self.addMove("play\t2");
		twilight_self.endTurn();
	    }

	  });
	}
	shd_continue = 0;
      }
      //
      // space race  us/ussr card
      //
      if (mv[0] == "space") {
        this.playerSpaceCard(mv[2], mv[1]);
	//
	// and move to discard pile
	//
        this.game.deck[0].discards[i] = this.game.deck[0].cards[i];
        this.game.queue.splice(qe, 1);
      }
      //
      // unlimit
      //
      if (mv[0] == "unlimit") {
        if (mv[1] == "china") { this.game.state.events_china_card_in_play = 0; }
        if (mv[1] == "cmc") { this.game.state.events.cubanmissilecrisis = 0; }
        if (mv[1] == "coups") { this.game.state.limit_coups = 0; }
        if (mv[1] == "spacerace") { this.game.state.limit_spacerace = 0; }
        if (mv[1] == "realignments") { this.game.state.limit_realignments = 0; }
        if (mv[1] == "placement") { this.game.state.limit_placement = 0; }
        if (mv[1] == "milops") { this.game.state.limit_milops = 0; }
        if (mv[1] == "ignoredefcon") { this.game.state.limit_ignoredefcon = 0; }
        if (mv[1] == "region") { this.game.state.limit_region = ""; }
        this.game.queue.splice(qe, 1);
      }
      //
      // chernobyl
      //
      if (mv[0] == "chernobyl") {
        this.game.state.events.chernobyl = mv[1];
        this.game.queue.splice(qe, 1);
      }
      //
      // burn die roll
      //
      if (mv[0] == "dice") {
        if (mv[1] == "burn") { 
          if (this.game.player == 1 && mv[2] == "ussr") {
	    roll = this.rollDice(6);
          }
          if (this.game.player == 2 && mv[2] == "us")   { 
	    roll = this.rollDice(6); 
	  }
        }
        this.game.queue.splice(qe, 1);
      }
      //
      // aldrich ames
      //
      if (mv[0] == "aldrichreveal") {

        if (this.game.player == 2) {

          let cards_to_reveal = this.game.deck[0].hand.length;
	  let revealed = "";
          for (let i = 0; i < this.game.deck[0].hand.length; i++) {
	    if (i > 0) { revealed += ", "; }
            revealed += this.game.deck[0].hand[i];
          }
          this.addMove("notify\tUS hand contains: "+revealed);
	  this.endTurn();
	}

        this.game.queue.splice(qe, 1);
	return 0;

      }
      if (mv[0] == "aldrich") {

	//
	// us telling ussr their hand
	//
        if (mv[1] == "us") { 

	  let num = mv[2];
	  let html = "Aldrich Ames triggered. USSR discard card from US hand:<p></p><ul>";
          this.game.queue.splice(qe, 1);

          for (let i = 0; i < num; i++) {
	    let uscard = this.game.queue[this.game.queue.length-1]; 
            html += '<li class="card showcard" id="'+uscard+'">'+this.game.deck[0].cards[uscard].name+'</li>';
            this.game.queue.splice(this.game.queue.length-1, 1);
          }   
          html += '</ul>';
	
	  if (this.game.player == 2) {
	    this.updateStatus("USSR is playing Aldrich Ames");
	  }

          if (this.game.player == 1) {

            this.updateStatus(html);

            let twilight_self = this;

            $('.card').off();
            $('.showcard').off();
            $('.showcard').mouseover(function() {
              let card = $(this).attr("id");
              twilight_self.showCard(card);
            }).mouseout(function() {
              let card = $(this).attr("id");
              twilight_self.hideCard(card);
            });
            $('.card').on('click', function() {

              let action2 = $(this).attr("id");
              twilight_self.addMove("aldrich\tussr\t"+action2);
	      twilight_self.endTurn();	

	    });
          }

	  shd_continue = 0;
        }


	if (mv[1] == "ussr") {

	  if (this.game.player == 2) {
	    this.removeCardFromHand(mv[2]);
	  }

          this.game.queue.splice(qe, 1);
	  this.updateLog("USSR discards <span class=\"logcard\" id=\""+mv[2]+"\">"+this.game.deck[0].cards[mv[2]].name + "</span>");
	  shd_continue = 1;
	}

      }
      //
      // cambridge five
      //
      if (mv[0] === "cambridge") {
	if (this.game.player == 1) {
	  let placetxt = player.toUpperCase() + " place 1 OP in";
	  for (let b = 1; b < mv.length; b++) {
	    placetxt += " ";
	    placetxt += mv[b];
	  }
	  twilight_self.updateStatus(placetxt);
	  for (let i = 1; i < mv.length; i++) {
	    for (var k in this.countries) {

	      //
	      // names of cards differ for these two. update so region matches
	      //
	      if (mv[i] == "centralamerica") { mv[i] = "camerica"; }
	      if (mv[i] == "southamerica") { mv[i] = "samerica"; }

	      if (this.countries[k].region.indexOf(mv[i]) > -1) {
	        let divname = "#"+k;
	        $(divname).off();
	        $(divname).on('click',function() {
		  let countryname = $(this).attr('id');
                  twilight_self.playerFinishedPlacingInfluence();
		  twilight_self.countries[countryname].ussr += 1;
		  twilight_self.showInfluence(countryname, "ussr");
		  twilight_self.addMove("place\tussr\tussr\t"+countryname+"\t1");
                  twilight_self.endTurn();
		});
              }
	    }
	  }
	}
        this.game.queue.splice(qe, 1);
        shd_continue = 0;
      }
      //
      // tear down this wall
      //
      if (mv[0] === "teardownthiswall") {

	if (this.game.player == 1) {
          this.updateStatus("US playing Tear Down This Wall");
	  return 0;
	}

        let user_message = "Tear Down this Wall is played -- US may make 3 OP free Coup Attempt or Realignments in Europe.<p></p><ul>";
            user_message += '<li class="card" id="taketear">take coup or realign</li>';
            user_message += '<li class="card" id="skiptear">skip coup</li>';
            user_message += '</ul>';
        twilight_self.updateStatus(user_message);


        $('.card').off();
        $('.card').on('click', function() {

          let action2 = $(this).attr("id");

  	  if (action2 == "skiptear") {
	    twilight_self.updateStatus("Skipping Tear Down this Wall...");
	    twilight_self.addMove("resolve\tteardownthiswall");
	    twilight_self.endTurn();
	  }

  	  if (action2 == "taketear") {
	    twilight_self.addMove("resolve\tteardownthiswall");
	    twilight_self.addMove("unlimit\tignoredefcon");
	    twilight_self.addMove("unlimit\tregion");
	    twilight_self.addMove("unlimit\tplacement");
	    twilight_self.addMove("unlimit\tmilops");
	    twilight_self.addMove("ops\tus\tteardown\t3");
	    twilight_self.addMove("limit\tmilops");
	    twilight_self.addMove("limit\tplacement");
	    twilight_self.addMove("limit\tregion\tasia");
	    twilight_self.addMove("limit\tregion\tmideast");
	    twilight_self.addMove("limit\tregion\tsamerica");
	    twilight_self.addMove("limit\tregion\tcamerica");
	    twilight_self.addMove("limit\tregion\tafrica");
	    twilight_self.addMove("limit\tignoredefcon");
	    twilight_self.endTurn();
	  }

        });

        shd_continue = 0;

      }
      if (mv[0] === "deal") {
	if (this.game.player == mv[1]) {

          let cards_needed_per_player = 8;
          if (this.game.state.round >= 4) { cards_needed_per_player = 9; }

          let ussr_cards = this.game.deck[0].hand.length;
          for (let z = 0; z < this.game.deck[0].hand.length; z++) {
            if (this.game.deck[0].hand[z] == "china") {
              ussr_cards--;
            }
          }
          let us_cards   = this.game.state.opponent_cards_in_hand;

          if (this.game.player == 2) {
            let x = ussr_cards;
            ussr_cards = us_cards;
            us_cards = x;
          }

          let us_cards_needed = cards_needed_per_player - us_cards;
          let ussr_cards_needed = cards_needed_per_player - ussr_cards;
          reshuffle_limit = us_cards_needed + ussr_cards_needed;

	  if (mv[1] == 1) {
	    this.addMove("RESOLVE");
	    this.addMove("DEAL\t1\t"+mv[1]+"\t"+ussr_cards_needed);
	  } else {
	    this.addMove("RESOLVE");
	    this.addMove("DEAL\t1\t"+mv[1]+"\t"+us_cards_needed);
	  }
          this.endTurn();
	} else {
	  this.updateStatus("Opponent is being dealt new cards.");
	}
	this.updateStatus(player.toUpperCase() + " is fetching new cards");
	return 0;
      }
      if (mv[0] === "ops") {
        if (this.game.deck[0].cards[mv[2]] != undefined) { this.game.state.event_name = this.game.deck[0].cards[mv[2]].name; }
        this.updateLog(mv[1].toUpperCase() + " plays <span class=\"logcard\" id=\""+mv[2]+"\">" + this.game.state.event_name + "</span> for " + mv[3] + " OPS"); 
	//
	// unset formosan if China card played by US
	//
        if (mv[1] == "us" && mv[2] == "china") { this.game.state.events.formosan = 0; }
        this.playOps(mv[1], mv[3], mv[2]);
        this.game.queue.splice(qe, 1);
        shd_continue = 0;
      }
      if (mv[0] === "milops") {
        this.updateLog(mv[1].toUpperCase() + " receives " + mv[2] + " milops");
        if (mv[1] === "us") {
          this.game.state.milops_us += parseInt(mv[2]);
        } else {
          this.game.state.milops_ussr += parseInt(mv[2]);
        }
        this.updateMilitaryOperations();
        this.game.queue.splice(qe, 1);
      }
      if (mv[0] === "vp") {
	if (mv.length > 3) {
	  if (parseInt(mv[3]) == 1) {
            this.updateLog(mv[1].toUpperCase() + " receives " + mv[2] + " VP");
            if (mv[1] === "us") {
	      this.game.state.vp_outstanding += parseInt(mv[2]);
	    } else {
	      this.game.state.vp_outstanding -= parseInt(mv[2]);
	    }
	  }
	} else {
          this.updateLog(mv[1].toUpperCase() + " receives " + mv[2] + " VP");
          if (mv[1] === "us") {
            this.game.state.vp += parseInt(mv[2]);
          } else {
            this.game.state.vp -= parseInt(mv[2]);
          }
          this.updateVictoryPoints();
	}
        this.game.queue.splice(qe, 1);
      }
      if (mv[0] === "coup") {
	this.updateLog(mv[1].toUpperCase() + " coups " + this.countries[mv[2]].name + " with " + mv[3] + " OPS"); 
	if (this.game.state.limit_milops != 1) {
          if (mv[1] == "us") { this.game.state.milops_us += parseInt(mv[3]); }
          if (mv[1] == "ussr") { this.game.state.milops_ussr += parseInt(mv[3]); }
	  this.updateMilitaryOperations();
 	}
	this.playCoup(mv[1], mv[2], mv[3]);
        this.game.queue.splice(qe, 1);
      }
      if (mv[0] === "realign") {
	this.updateLog(mv[1].toUpperCase() + " realigns " + this.countries[mv[2]].name + " with 1 OPS"); 
	if (mv[1] != player) { this.playRealign(mv[2]); }
        this.game.queue.splice(qe, 1);
      }
      if (mv[0] === "defcon") {
        if (mv[1] == "lower") {
  	  this.lowerDefcon();
	  if (this.game.state.defcon <= 0) {
            if (this.game.state.turn == 0) {
              this.endGame("ussr", "defcon");
            } else {
              this.endGame("us", "defcon");
            }
          }
        }
        if (mv[1] == "raise") {
   	  this.game.state.defcon++;
	  if (this.game.state.defcon > 5) { this.game.state.defcon = 5; }
	  this.updateDefcon();
        }
        this.game.queue.splice(qe, 1);
      }
      if (mv[0] === "notify") {
	this.updateLog(mv[1]);
        this.game.queue.splice(qe, 1);
      }
      if (mv[0] === "move") {
        if (mv[1] == "ussr") { this.game.state.move = 0; }
        if (mv[1] == "us") { this.game.state.move = 1; }
        this.game.queue.splice(qe, 1);
      }
      if (mv[0] === "event") {

        if (this.game.deck[0].cards[mv[2]] != undefined) { this.game.state.event_name = this.game.deck[0].cards[mv[2]].name; }
        this.updateLog(mv[1].toUpperCase() + " triggers <span class=\"logcard\" id=\""+mv[2]+"\">" + this.game.state.event_name + "</span> event"); 

        shd_continue = this.playEvent(mv[1], mv[2]);

	//
	// show active events
	//
	this.updateEventTiles();

        if (shd_continue == 0) {

	  //
	  // game will stop
	  //
	  //this.game.saveGame(this.game.id);

        } else {

	  //
	  // only continue if we do not stop
	  //
          if (mv[1] == "china") {
          } else {

            //
            // remove non-recurring events from game
            //
            for (var i in this.game.deck[0].cards) {
              if (mv[2] == i) {
	        if (this.game.deck[0].cards[i].recurring != 1) {

		  let event_removal = 1;

		  //
		  // Wargames not removed if DEFCON > 2
		  // 
		  if (this.game.state.defcon > 2 && mv[2] == "wargames") {
		    event_removal = 0;
		  }

		  //
		  // NATO not removed if prerequisitcs not met
		  // 
		  if (this.game.state.events.nato == 0 && mv[2] == "nato") {
		    event_removal = 0;
		  }

		  //
		  // Star Wars not removed if not triggered
		  //
		  if (this.game.state.events.starwars == 0 && mv[2] == "starwars") {
		    event_removal = 0;
		  }


		  //
		  // Our Man in Tehran not removed if not triggered
		  //
		  if (this.game.state.events.ourmanintehran == 0 && mv[2] == "ourmanintehran") {
		    event_removal = 0;
		  }


		  //
		  // Kitchen Debates not removed if not triggered
		  //
		  if (this.game.state.events.kitchendebates == 0 && mv[2] == "kitchendebates") {
		    event_removal = 0;
		  }


	          if (event_removal == 1) {

	            this.updateLog(this.game.deck[0].cards[i].name + " removed from game");
	            this.game.deck[0].removed[i] = this.game.deck[0].cards[i];
	            delete this.game.deck[0].cards[i];

		  } else {

		    // just discard -- NATO catch mostly
	            this.updateLog(this.game.deck[0].cards[i].name + " discarded");
	  	    this.game.deck[0].discards[i] = this.game.deck[0].cards[i];

		  }
	        } else {
	          this.updateLog(this.game.deck[0].cards[i].name + " discarded");
	  	  this.game.deck[0].discards[i] = this.game.deck[0].cards[i];
	        }
  	      }
            }
          }

	  // delete event if not deleted already
          this.game.queue.splice(qe, 1);
        }
      }
      if (mv[0] === "place") {
        if (player != mv[1]) { this.placeInfluence(mv[3], parseInt(mv[4]), mv[2]); }
        this.game.queue.splice(qe, 1);
      }
      if (mv[0] === "remove") {
        if (player != mv[1]) { this.removeInfluence(mv[3], parseInt(mv[4]), mv[2]); }
        this.showInfluence(mv[3], "us");
        this.showInfluence(mv[3], "ussr");
        this.game.queue.splice(qe, 1);
      }
      if (mv[0] === "resolve") {

	//
	// eliminate junta
	//
	if (mv[1] === "junta") { this.game.state.events.junta = 0; }

	if (qe == 0) {
  	  this.game.queue = [];
	} else {

          let le = qe-1;

          //
          // resolving UN intervention means disabling the effect
          //
          if (mv[1] == "unintervention") {

	    //
	    // UNIntervention causing issues with USSR when US plays
	    // force the event to reset in ALL circumstances
	    // 
            this.game.state.events.unintervention = 0;

            let lmv = this.game.queue[le].split("\t");
            if (lmv[0] == "event" && lmv[2] == mv[1]) {
              this.game.state.events.unintervention = 0;
  	    }

          }
          //
          // we can remove the event if it is immediately above us in the queue
          //
          if (le <= 0) { 
            this.game.queue = [];
          } else {

            let lmv = this.game.queue[le].split("\t");
	    let rmvd = 0;

            if (lmv[0] == "play" && mv[1] == "play") {
  	      this.game.queue.splice(le, 2);
	      rmvd = 1;
	    }
            if (lmv[0] == "event" && lmv[2] == mv[1]) {
  	      this.game.queue.splice(le, 2);
	      rmvd = 1;
	    }
            if (lmv[0] == "discard" && lmv[2] == mv[1]) {
  	      this.game.queue.splice(qe, 1);
	      rmvd = 1;
	    }
            if (lmv[0] === mv[1]) {	// "discard teardownthiswall"
  	      this.game.queue.splice(le, 2);
	      rmvd = 1;
	    }
	    if (rmvd == 0) {
  	      this.game.queue.splice(qe, 1);
	    }
          }
        }

        //
        // remove non-recurring events from game
        //
        for (var i in this.game.deck[0].cards) {
          if (mv[1] == i) {
            if (this.game.deck[0].cards[i].recurring != 1) {
              this.updateLog(this.game.deck[0].cards[i].name + " removed from game");
              this.game.deck[0].removed[i] = this.game.deck[0].cards[i];
              delete this.game.deck[0].cards[i];
            } else {
              this.updateLog(this.game.deck[0].cards[i].name + " discarded");
              this.game.deck[0].discards[i] = this.game.deck[0].cards[i];
            }
          }
        }


      }
      if (mv[0] === "placement") {

	//
	// TESTING
	//
	// if you want to hardcode the hands of the players, you can set
	// them manually here. Be sure that all of the cards have been
	// dealt into the DECK during the setup phase though.
	//

	if (this.is_testing == 1) {
	  if (this.game.player == 1) {
	    this.game.deck[0].hand = ["decolonization","cubanmissile", "asknot", "junta", "che","degaulle","nato","naziscientist","missileenvy"];
	  } else {
	    this.game.deck[0].hand = ["wargames","aldrichames","reagan","wwby","southamerica","europe","asia","seasia","centralamerica"];
	  }
	}


        //
        // add china card
        //
        this.game.deck[0].cards["china"] = this.returnChinaCard();
        if (this.game.player == 1) {
          let hand_contains_china = 0;
          for (let x = 0; x < this.game.deck[0].hand.length; x++) {
            if (this.game.deck[0].hand[x] == "china") { hand_contains_china = 1; }
          }
          if (hand_contains_china == 0) {
	    if (! this.game.deck[0].hand.includes("china")) {
              this.game.deck[0].hand.push("china");
	    }
          }
        }

	if (mv[1] == 1) {
          if (this.game.player == mv[1]) {
            this.playerPlaceInitialInfluence("ussr");
          } else {
	    let x = "USSR is making its initial placement of influence:<p></p>[cards: ";
    	    for (let i = 0; i < this.game.deck[0].hand.length; i++) {
      	      if (i > 0) { x += ", "; }
      	      x += '<div class="showcard inline" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name.toLowerCase()+'</div>';
    	    }
    	    x += ']';
            this.updateStatus(x);
          }
        } else {
          if (this.game.player == mv[1]) {
            this.playerPlaceInitialInfluence("us");
          } else {
	    let x = "US is making its initial placement of influence:<p></p>[cards: ";
    	    for (let i = 0; i < this.game.deck[0].hand.length; i++) {
      	      if (i > 0) { x += ", "; }
      	      x += '<div class="showcard inline" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name.toLowerCase()+'</div>';
    	    }
    	    x += ']';
            this.updateStatus(x);
          }
        }

	//
	// do not remove from queue -- handle RESOLVE on endTurn submission
	//
	return 0;

      }
      if (mv[0] === "placement_bonus") {
	if (mv[1] == 1) {
          if (this.game.player == mv[1]) {
            this.playerPlaceBonusInfluence("ussr", mv[2]);
          } else {
	    let x = "USSR is making its bonus placement of "+mv[2]+" influence:<p></p>[cards: ";
    	    for (let i = 0; i < this.game.deck[0].hand.length; i++) {
      	      if (i > 0) { x += ", "; }
      	      x += '<div class="showcard inline" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name.toLowerCase()+'</div>';
    	    }
    	    x += ']';
            this.updateStatus(x);
          }
        } else {
          if (this.game.player == mv[1]) {
            this.playerPlaceBonusInfluence("us", mv[2]);
          } else {
	    let x = "US is making its bonus placement of "+mv[2]+" influence:<p></p>[cards: ";
    	    for (let i = 0; i < this.game.deck[0].hand.length; i++) {
      	      if (i > 0) { x += ", "; }
      	      x += '<div class="showcard inline" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name.toLowerCase()+'</div>';
    	    }
    	    x += ']';
            this.updateStatus(x);
          }
        }

	//
	// do not remove from queue -- handle RESOLVE on endTurn submission
	//
	return 0;

      }

      if (mv[0] === "headline") {

	// set to player1
	if (msg == null) { msg = {}; }
	if (msg.extra == undefined) { 
	  msg = {};
	  msg.extra = {};
	  msg.extra.target = 1;
	} else {
	  if (!(msg.extra.target > 0)) { msg.extra.target = 1; }
	}

	let x = this.playHeadline(msg);
        if (x == 1) { 
          this.game.queue.splice(qe, 1); 
        }
        else { return 0; }

      }
      if (mv[0] === "round") {


        //
        // NORAD
        //
        if (this.game.state.us_defcon_bonus == 1) {
          if (this.isControlled("us", "canada") == 1) {

            let twilight_self = this;
            this.game.state.us_defcon_bonus = 0;

            if (this.game.player == 1) {
              this.updateStatus("NORAD triggers: US places 1 influence in country with US influence");
              this.updateLog("NORAD triggers: US places 1 influence in country with US influence");
              return 0;
            }
            if (this.game.player == 2) {
            this.updateLog("NORAD triggers: US places 1 influence in country with US influence");
              for (var i in this.countries) {

                let countryname  = i;
                let divname      = '#'+i;

                if (this.countries[countryname].us > 0) {

                    this.updateStatus("Place your NORAD bonus: (1 OP)");

                    $(divname).off();
                    $(divname).on('click', function() {

		    // no need for this end-of-round
                    // twilight_self.addMove("resolve\tturn");

                    let countryname = $(this).attr('id');
                    twilight_self.addMove("place\tus\tus\t"+countryname+"\t1");
                    twilight_self.placeInfluence(countryname, 1, "us", function() {
                      twilight_self.playerFinishedPlacingInfluence();
                      twilight_self.endTurn();
                    });
                  });
                }
              }
            }
            return 0;
          } else {
            this.game.state.us_defcon_bonus = 0;
          }
        }
  
	//
	// prevent DEFCON bonus from carrying over to next round
	//
        this.game.state.us_defcon_bonus = 0;


	//
	// settle outstanding VP issue
	//
	this.settleVPOutstanding();


	//
	// show active events
	//
	this.updateEventTiles();

        if (this.game.state.events.northseaoil_bonus == 1) {

          this.game.state.events.northseaoil_bonus = 0;
          if (this.game.player == 1) {
            this.updateStatus("US is deciding whether to take extra turn");
            return 0;
          } 
          
          //
          // US gets extra move
          // 
          let html  = "Do you want to take an extra turn: (North Sea Oil)<p></p><ul>";
              html += '<li class="card" id="play">play extra turn</li>';
              html += '<li class="card" id="nope">do not play</li>';
              html += '</ul>';
          this.updateStatus(html);
          
          let twilight_self = this;
          
          $('.card').off();
          $('.card').on('click', function() {
          
            let action2 = $(this).attr("id");
            
            if (action2 == "play") {
              twilight_self.addMove("play\t2");
              twilight_self.endTurn(1);
            } 
            if (action2 == "nope") {
              twilight_self.addMove("notify\tUS does not play extra turn");
              twilight_self.endTurn(1);
            } 
            
          });
          
          return 0;
          
	}





	//
	// Eagle Has Landed
	//
        if (this.game.state.eagle_has_landed != "" && this.game.state.eagle_has_landed_bonus_taken == 0 && this.game.state.round > 0) {

          this.game.state.eagle_has_landed_bonus_taken = 1;

	  let bonus_player = 1;
	  if (this.game.state.eagle_has_landed == "us") { bonus_player = 2; }

          if (this.game.player != bonus_player) {
            this.updateStatus(this.game.state.eagle_has_landed.toUpperCase() + " is deciding whether to discard a card");
	    this.saveGame(this.game.id);
            return 0;
          } 
          
          //
          // DISCARD CARD
          // 
          let html  = "US may discard a card: (Eagle Has Landed)<p></p><ul>";
          if (bonus_player == 1) { html  = "USSR may discard a card: (Bear Has Landed)<p></p><ul>"; }
              html += '<li class="card" id="discard">discard card</li>';
              html += '<li class="card" id="nope">do not discard</li>';
              html += '</ul>';
          this.updateStatus(html);
          
          let twilight_self = this;
          
          $('.card').off();
          $('.card').on('click', function() {
          
            let action2 = $(this).attr("id");
            
            if (action2 == "nope") {
              twilight_self.addMove("notify\t"+twilight_self.game.state.eagle_has_landed.toUpperCase()+" does not discard a card");
              twilight_self.endTurn(1);
            }
 
            if (action2 == "discard") {

	      let cards_discarded = 0;

	      let cards_to_discard = 0;
	      let user_message = "Select card to discard:<p></p><ul>";
	      for (let i = 0; i < twilight_self.game.deck[0].hand.length; i++) {
	        if (twilight_self.game.deck[0].hand[i] != "china") {
	          user_message += '<li class="card showcard" id="'+twilight_self.game.deck[0].hand[i]+'">'+twilight_self.game.deck[0].cards[twilight_self.game.deck[0].hand[i]].name+'</li>';
	          cards_to_discard++;
	        }
	      }

	      if (cards_to_discard == 0) {
	        twilight_self.updateStatus("No cards available to discard! Please wait for next turn...");
	        twilight_self.addMove("notify\tUS has no cards available to discard");
	        twilight_self.endTurn(1);
	 	twilight_self.saveGame(twilight_self.game.id);
	        return;
	      }

	      user_message += '</ul><p></p>If you wish to cancel your discard, <span class="card dashed" id="finished">click here</span>.';
	      twilight_self.updateStatus(user_message);

	      $('.card').off();
	      $('.showcard').off();
	      $('.showcard').mouseover(function() {
	        let card = $(this).attr("id");
	        twilight_self.showCard(card);
	      }).mouseout(function() {
	        let card = $(this).attr("id");
	        twilight_self.hideCard(card);
	      });
	      $('.card').on('click', function() {

	        let action2 = $(this).attr("id");

	        if (action2 == "finished") {
	          twilight_self.endTurn(1);
	        } else {
	          $(this).hide();
		  twilight_self.hideCard();
		  twilight_self.updateStatus("Discarding...");
	          cards_discarded++;
	          twilight_self.removeCardFromHand(action2);
	          twilight_self.addMove("discard\t"+twilight_self.game.state.eagle_has_landed+"\t"+action2);
	          twilight_self.addMove("notify\t"+twilight_self.game.state.eagle_has_landed.toUpperCase()+" discards <span class=\"logcard\" id=\""+action2+"\">"+twilight_self.game.deck[0].cards[action2].name + "</span>");
	          twilight_self.endTurn(1);
		  return 0;
	        }
	      });
	    }

	    return 0;

          });
          
          return 0;
          
	}




	//
	// Space Shuttle
	//
        if (this.game.state.space_shuttle != "" && this.game.state.space_shuttle_bonus_taken == 0 && this.game.state.round > 0) {

          this.game.state.space_shuttle_bonus_taken = 1;

	  let bonus_player = 1;
	  if (this.game.state.space_shuttle == "us") { bonus_player = 2; }

          if (this.game.player != bonus_player) {
            this.updateStatus(this.game.state.space_shuttle.toUpperCase() + " is deciding whether to take extra turn");
            return 0;
          } 
          
          //
          // player gets extra move
          // 
          let html  = "Do you want to take an extra turn: (Space Shuttle)<p></p><ul>";
              html += '<li class="card" id="play">play extra turn</li>';
              html += '<li class="card" id="nope">do not play</li>';
              html += '</ul>';
          this.updateStatus(html);
          
          let twilight_self = this;
          
          $('.card').off();
          $('.card').on('click', function() {
          
            let action2 = $(this).attr("id");
            
            if (action2 == "play") {
              twilight_self.addMove("play\t"+bonus_player);
              twilight_self.endTurn(1);
            } 
            if (action2 == "nope") {
              twilight_self.addMove("notify\t"+twilight_self.game.state.space_shuttle.toUpperCase()+" does not play extra turn");
              twilight_self.endTurn(1);
            } 
            
          });
          
          return 0;
          
	}



	//
	// if we have come this far, move to the next turn
	//
	if (this.game.state.round > 0) {
	  this.updateLog("End of Round");
	}
	this.endRound();

	this.updateStatus("Preparing for round " + this.game.state.round);

	let rounds_in_turn = 6;
	if (this.game.state.round > 3) { rounds_in_turn = 7; }

	for (let i = 0; i < rounds_in_turn; i++) {
	  this.game.queue.push("turn");
	  this.game.queue.push("play\t2");
	  this.game.queue.push("play\t1");
	}
	this.game.queue.push("headline");

	// reset headline
	this.game.state.headline1 = 0;
	this.game.state.headline2 = 0;
	this.game.state.headline3 = 0;
	this.game.state.headline4 = 0;
	this.game.state.headline5 = 0;


	//
	// END GAME IF WE MAKE IT !
	//
	if (this.game.state.round == 11) {
	  this.finalScoring();
	}


	//
	// DEAL MISSING CARDS
	//
	if (this.game.state.round > 1) {

	  this.updateLog(this.game.deck[0].crypt.length + " cards remaining in deck...");

	  this.game.queue.push("deal\t2");
	  this.game.queue.push("deal\t1");


	  let reshuffle_limit = 14;

          let cards_needed_per_player = 8;
          if (this.game.state.round >= 4) { cards_needed_per_player = 9; }

          let ussr_cards = this.game.deck[0].hand.length;
	  for (let z = 0; z < this.game.deck[0].hand.length; z++) {
	    if (this.game.deck[0].hand[z] == "china") {
	      ussr_cards--;
	    }
	  }
          let us_cards   = this.game.state.opponent_cards_in_hand;

          if (this.game.player == 2) {
            let x = ussr_cards;
            ussr_cards = us_cards;
            us_cards = x;
          }

	  let us_cards_needed = cards_needed_per_player - us_cards;
	  let ussr_cards_needed = cards_needed_per_player - ussr_cards;
	  reshuffle_limit = us_cards_needed + ussr_cards_needed;

	  if (this.game.deck[0].crypt.length < reshuffle_limit) { 

	    //
	    // no need to reshuffle in turn 4 or 8 as we have new cards inbound
	    //
	    if (this.game.state.round != 4 && this.game.state.round != 8) {

	      //
	      // this resets discards = {} so that DECKBACKUP will not retain
	      //
	      let discarded_cards = this.returnDiscardedCards();
	      if (Object.keys(discarded_cards).length > 0) {

	        //
	        // shuffle in discarded cards
	        //
	        this.game.queue.push("SHUFFLE\t1");
	        this.game.queue.push("DECKRESTORE\t1");
                this.game.queue.push("DECKENCRYPT\t1\t2");
                this.game.queue.push("DECKENCRYPT\t1\t1");
                this.game.queue.push("DECKXOR\t1\t2");
                this.game.queue.push("DECKXOR\t1\t1");
                this.game.queue.push("DECK\t1\t"+JSON.stringify(discarded_cards));
	        this.game.queue.push("DECKBACKUP\t1");
	        this.updateLog("Shuffling discarded cards back into the deck...");

	      }

              //
              // deal existing cards before
              // we shuffle the discards into the
              // deck
              //
              let cards_available = this.game.deck[0].crypt.length;
              let player2_cards = Math.floor(cards_available / 2);
              let player1_cards = cards_available - player2_cards;;

	      //
	      // adjust distribution of cards
	      //
	      if (player2_cards > us_cards_needed) {
		let surplus_cards = player2_cards - us_cards_needed;
	 	player2_cards = us_cards_needed;
		player1_cards += surplus_cards;
	      }
	      if (player1_cards > ussr_cards_needed) {
		let surplus_cards = player1_cards - ussr_cards_needed;
	 	player1_cards = ussr_cards_needed;
		player2_cards += surplus_cards;
	      }

              if (player1_cards > 0) {
                this.game.queue.push("DEAL\t1\t2\t"+player2_cards);
                this.game.queue.push("DEAL\t1\t1\t"+player1_cards);
              }
              this.updateStatus("Dealing remaining cards from draw deck before reshuffling...");
              this.updateLog("Dealing remaining cards from draw deck before reshuffling...");

	    }

	  }



	  if (this.game.state.round == 4) {

	    this.game.queue.push("SHUFFLE\t1");
	    this.game.queue.push("DECKRESTORE\t1");
            this.game.queue.push("DECKENCRYPT\t1\t2");
            this.game.queue.push("DECKENCRYPT\t1\t1");
            this.game.queue.push("DECKXOR\t1\t2");
            this.game.queue.push("DECKXOR\t1\t1");
            this.game.queue.push("DECK\t1\t"+JSON.stringify(this.returnMidWarCards()));
	    this.game.queue.push("DECKBACKUP\t1");
	    this.updateLog("Adding Mid War cards to the deck...");

	  }


	  if (this.game.state.round == 8) {

	    this.game.queue.push("SHUFFLE\t1");
	    this.game.queue.push("DECKRESTORE\t1");
            this.game.queue.push("DECKENCRYPT\t1\t2");
            this.game.queue.push("DECKENCRYPT\t1\t1");
            this.game.queue.push("DECKXOR\t1\t2");
            this.game.queue.push("DECKXOR\t1\t1");
            this.game.queue.push("DECK\t1\t"+JSON.stringify(this.returnLateWarCards()));
	    this.game.queue.push("DECKBACKUP\t1");
	    this.updateLog("Adding Late War cards to the deck...");

	  }
        }

	return 1;
      }
      if (mv[0] === "play") {

	//
	// it is no longer the headline
	//
	this.game.state.headline = 0;

	//
	// resolve outstanding VP
	//
	this.settleVPOutstanding();

	//
	// show active events
	//
	this.updateEventTiles();


	if (mv[1] == 1) { 
          this.game.state.turn = 0; 
 	}
	if (mv[1] == 2) { this.game.state.turn = 1; }

	//
        // deactivate cards
	//
  	this.game.state.events.china_card_eligible = 0;


        //
        // NORAD
        //
        if (this.game.state.us_defcon_bonus == 1) {
          if (this.isControlled("us", "canada") == 1) {

            let twilight_self = this;
            this.game.state.us_defcon_bonus = 0;
	
            if (this.game.player == 1) { 
              this.updateStatus("NORAD triggers: US places 1 influence in country with US influence");
              this.updateLog("NORAD triggers: US places 1 influence in country with US influence");
	      return 0;
	    }
            if (this.game.player == 2) {
            this.updateLog("NORAD triggers: US places 1 influence in country with US influence");
              for (var i in this.countries) {

                let countryname  = i;
                let divname      = '#'+i;
 
                if (this.countries[countryname].us > 0) {

                    this.updateStatus("US place NORAD bonus: (1 OP)");

                    $(divname).off();
                    $(divname).on('click', function() {

                    twilight_self.addMove("resolve\tturn");

                    let countryname = $(this).attr('id');
                    twilight_self.addMove("place\tus\tus\t"+countryname+"\t1");
                    twilight_self.placeInfluence(countryname, 1, "us", function() {
                      twilight_self.playerFinishedPlacingInfluence();
                      twilight_self.endTurn();
                    });
                  });
                }
              }
            }
            return 0;
          } else {
	    this.game.state.us_defcon_bonus = 0;
	  }
	}


        this.updateDefcon();
        this.updateActionRound();
        this.updateSpaceRace();
        this.updateVictoryPoints();
        this.updateMilitaryOperations();
        this.updateRound();

	this.playMove(msg);
	return 0;
      }


      //
      // avoid infinite loops
      //
      if (shd_continue == 0) { 
        console.log("NOT CONTINUING");
        return 0; 
      }


  } // if cards in queue
  return 1;

}



Twilight.prototype.playHeadline = function playHeadline(msg) {

  if (	this.game.state.headline1 == 1 &&
	this.game.state.headline2 == 1 &&
	this.game.state.headline3 == 1 &&
	this.game.state.headline4 == 1 &&
	this.game.state.headline5 == 1) { return 1; }

  if (this.game.state.man_in_earth_orbit == "") {
    if (this.game.state.headline1 == 0) {

      //
      // remember we are in the headline
      //
      this.game.state.headline = 1;

      //
      // player one picks headline card
      //
      if (msg.extra.target == 1) {
        this.updateLog("USSR selecting headline card");
        if (this.game.player == 1) {

          //
          // then make my own turn
          //
          this.playerPickHeadlineCard();

        } else {
	  let x = "Waiting for USSR to pick headline card:<p></p>[cards: ";
    	  for (let i = 0; i < this.game.deck[0].hand.length; i++) {
      	    if (i > 0) { x += ", "; }
      	    x += '<div class="showcard inline" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name.toLowerCase()+'</div>';
    	  }
      	  x += ']';
          this.updateStatus(x);
        }
        return 0;
      }

      if (msg.extra.target == 2) {

        this.updateLog("US selecting headline card");
        if (this.game.player == 2) {

          //
          // accept headline card submission
          //
  	  if (this.game.state.headline_opponent_hash === "") {
            this.game.state.headline_opponent_hash = msg.extra.headline_hash;
          }

          //
          // then make my own turn
          //
          this.playerPickHeadlineCard();

        } else {
	  if (this.game.player == 1) { 
	    this.game.state.headline1 = 1;
	  }
	  let x = "Waiting for US to pick headline card:<p></p>[cards: ";
    	  for (let i = 0; i < this.game.deck[0].hand.length; i++) {
      	    if (i > 0) { x += ", "; }
      	    x += '<div class="showcard inline" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name.toLowerCase()+'</div>';
    	  }
      	  x += ']';
          this.updateStatus(x);
        }
        return 0;
      }
      return 0;
    }

    if (this.game.state.headline2 == 0) {

      this.updateLog("Encrypted headline card selection");

      //
      // player one sends XOR
      //
      if (msg.extra.target == 1) {
        this.updateLog("Initiating blind headline card swap");
        if (this.game.player == 1) {

	  if (this.game.state.headline_opponent_hash === "") {
            this.game.state.headline_opponent_hash = msg.extra.headline_hash;
  	  }

          this.game.turn = [];

          let extra      = {};
              extra.headline_card = this.game.state.headline_card;
              extra.headline_xor  = this.game.state.headline_xor;
              extra.target   = this.returnNextPlayer(this.game.player);

          this.sendMessage("game", extra);

          return 0;

        } else {

          this.updateStatus("Waiting for USSR to send confirming information");

	  //
	  // try saving here to avoid headline issues
	  //
	  //this.saveGame(this.game.id);

        }
        return 0;
      }


      //
      // player two sends XOR
      //
      if (msg.extra.target == 2) {
        this.updateLog("Continuing blind headline card swap");
        if (this.game.player == 2) {

	  if (this.game.state.headline_opponent_card === "") {
            this.game.state.headline_opponent_card = msg.extra.headline_card;
            this.game.state.headline_opponent_xor = msg.extra.headline_xor;
	  }

          this.updateStatus("Exchanging encrypted and shuffled cards...");
          this.updateLog("Secure card exchange...");

          this.game.turn = [];

          if (this.game.state.headline_opponent_hash != this.app.crypto.encodeXOR(this.app.crypto.stringToHex(this.game.state.headline_opponent_card), this.game.state.headline_opponent_xor)) {
alert("PLAYER 1 HASH WRONG: -- this is a development error message that can be triggered if the opponent attempts to cheat by changing their selected card after sharing the encrypted hash. It can also be rarely caused if one or both players reload or have unreliable connections during the headline exchange process. The solution in this case is for both players to reload until the game hits the first turn. " + this.game.state.headline_opponent_hash + " -- " + this.game.state.headline_opponent_card + " -- " + this.game.state.headline_opponent_xor + " -- " + this.app.crypto.encodeXOR(this.app.crypto.stringToHex(this.game.state.headline_opponent_card), this.game.state.headline_opponent_xor));
          }

          this.game.state.headline2 = 1;

          let extra      = {};
	      extra.headline_card = this.game.state.headline_card;
	      extra.headline_xor  = this.game.state.headline_xor;
              extra.target   = this.returnNextPlayer(this.game.player);
          this.sendMessage("game", extra);

          return 0;

        } else {

          this.updateStatus("Waiting for US to decrypt USSR headline card...");
          this.game.state.headline2 = 1;

        }
        return 0;
      }
      return 0;
    }


    if (this.game.state.headline3 == 0) {

      //
      // player one receives confirming info
      //
      if (msg.extra.target == 1) {
        this.updateLog("Confirming USSR headline card");
        if (this.game.player == 1) {

	  //
	  // could be triggered by reload
	  //
          if (msg.extra.headline_card == undefined || msg.extra.headline_card == "") { return; }
          if (msg.extra.headline_xor == undefined || msg.extra.headline_xor == "") { return; }

  	  if (this.game.state.headline_opponent_card === "") {
            this.game.state.headline_opponent_card = msg.extra.headline_card;
            this.game.state.headline_opponent_xor = msg.extra.headline_xor;
          }

          if (this.game.state.headline_opponent_hash != this.app.crypto.encodeXOR(this.app.crypto.stringToHex(this.game.state.headline_opponent_card), this.game.state.headline_opponent_xor)) {
alert("PLAYER 2 HASH WRONG: -- this is a development error message that can be triggered if the opponent attempts to cheat by changing their selected card after sharing the encrypted hash. It can also be rarely caused if one or both players reload or have unreliable connections during the headline exchange process. The solution in this case is for both players to reload until the game hits the first turn. " + this.game.state.headline_opponent_hash + " -- " + this.game.state.headline_opponent_card + " -- " + this.game.state.headline_opponent_xor + " -- " + this.app.crypto.encodeXOR(this.app.crypto.stringToHex(this.game.state.headline_opponent_card), this.game.state.headline_opponent_xor));
          }

  	  this.game.turn = [];
          this.removeCardFromHand(this.game.state.headline_card);
          let extra      = {};
              extra.target   = this.returnNextPlayer(this.game.player);
          this.sendMessage("game", extra);
          return 0;

        } else {

          this.updateStatus("Waiting for US to decrypt USSR headline card 2...");

	  //
	  // try saving here to avoid headline issues
	  //
	  // we sometimes have issues with player 2 dropping
	  // in the case of unreliable reloads, so we are 
	  // saving the game here.
	  //
	  //this.saveGame(this.game.id);

        }
        return 0;
      }


      if (msg.extra.target == 2) {
        this.updateLog("Confirming US headline card");
        if (this.game.player == 2) {

          //
          // we now have both headline cards, just tell players what they are
          //
          this.game.state.headline3 = 1;

          this.game.turn = [];
          this.removeCardFromHand(this.game.state.headline_card);
          let extra      = {};
              extra.skipqueue = 1;
              extra.target   = this.returnNextPlayer(this.game.player);
          this.sendMessage("game", extra);

        } else {

          //
          // we now have both headline cards, just tell players what they are
          //
          this.game.state.headline3 = 1;

        }
        return 0;
      }
      return 0;
    }
  } // no man in earth orbit








  //
  // man in earth orbit
  //
  else {

    //
    // first remember we are in the headline phase
    //
    this.game.state.headline = 1;

    let first_picker = 2;
    let second_picker = 1;
    let player = "US";

    if (this.game.state.man_in_earth_orbit === "us") { first_picker = 1; second_picker = 2; player = "USSR"; }

    //
    // first player picks
    //
    if (this.game.state.headline1 == 0) {

      this.game.state.headline1 = 1;

      if (this.game.player == first_picker) {

        let x = player.toUpperCase() + " picks headline card first: <p></p><ul>";
        for (i = 0; i < this.game.deck[0].hand.length; i++) {
          x += '<li class="card showcard" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name+'</li>';
        }
        x += '</ul>';

        this.updateStatus(x);

        let twilight_self = this;

        $('.card').off();
        $('.showcard').off();
        $('.showcard').mouseover(function() {
          let card = $(this).attr("id");
          twilight_self.showCard(card);
        }).mouseout(function() {
          let card = $(this).attr("id");
          twilight_self.hideCard(card);
        });
        $('.card').on('click', function() {

          let card = $(this).attr("id");

          // cannot pick china card or UN intervention
          if (card == "china") { alert("You cannot headline China"); return; }
          if (card == "unintervention") { alert("You cannot headline UN Intervention"); return; }

          twilight_self.game.state.headline_card = card;
          twilight_self.game.state.headline_xor = "MAN_IN_EARTH_ORBIT";
          twilight_self.game.state.headline_hash = "MAN_IN_EARTH_ORBIT";
	  twilight_self.updateStatus("Headline card selected, please wait...");

          twilight_self.game.turn = [];

          let extra       = {};
          extra.headline_card = twilight_self.game.state.headline_card;
          extra.target    = twilight_self.returnNextPlayer(twilight_self.game.player);

          $('.card').off();
          $('.showcard').off();
          twilight_self.hideCard();

          twilight_self.sendMessage("game", extra);

        });
      } else {

	if (first_picker == 1) {
	  this.updateStatus(player + " is selecting headline card first");
	} else {
	  this.updateStatus(player + " is selecting headline card first");
	}	
      }
      return 0;
    }

    //
    // second player picks
    //
    if (this.game.state.headline2 == 0) {

      this.game.state.headline2 = 1;

      if (this.game.player == second_picker) {

	if (this.game.state.headline_opponent_card === "") {
          this.game.state.headline_opponent_card = msg.extra.headline_card;
	}

        let x = player.toUpperCase() + ' selected <span id="'+this.game.state.headline_opponent_card+'" class="showcard">' + this.game.deck[0].cards[this.game.state.headline_opponent_card].name + '</span>. ' + this.game.state.man_in_earth_orbit.toUpperCase() + ' pick your headline card second: <p></p><ul>';
        for (i = 0; i < this.game.deck[0].hand.length; i++) {
          x += '<li class="card showcard" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name+'</li>';
        }
        x += '</ul>';

        this.updateStatus(x);

        let twilight_self = this;

        $('.card').off();
        $('.showcard').off();
        $('.showcard').mouseover(function() {
          let card = $(this).attr("id");
          twilight_self.showCard(card);
        }).mouseout(function() {
          let card = $(this).attr("id");
          twilight_self.hideCard(card);
        });
        $('.card').on('click', function() {

          let card = $(this).attr("id");

          // cannot pick china card or UN intervention
          if (card == "china") { alert("You cannot headline China"); return; }
          if (card == "unintervention") { alert("You cannot headline UN Intervention"); return; }

	  twilight_self.updateStatus("Headline card selected, waiting for opponent response....");
          twilight_self.game.state.headline_card = card;
          twilight_self.game.state.headline_xor = "MAN_IN_EARTH_ORBIT";
          twilight_self.game.state.headline_hash = "MAN_IN_EARTH_ORBIT";

          twilight_self.game.turn = [];

          let extra       = {};
          extra.headline_card = twilight_self.game.state.headline_card;
          extra.headline_opponent_card = twilight_self.game.state.headline_opponent_card;
          extra.target    = twilight_self.returnNextPlayer(twilight_self.game.player);

          $('.card').off();
          $('.showcard').off();
          twilight_self.hideCard();

          twilight_self.sendMessage("game", extra);

        });
      } else {

	if (this.game.state.headline_card === "") {
          this.game.state.headline_card = msg.extra.headline_card;
	}

	if (first_picker == 1) {
	  this.updateStatus("US is selecting headline card second");
	} else {
	  this.updateStatus("USSR is selecting headline card second");
	}

      }

      return 0;
    }


    //
    // second player picks
    //
    if (this.game.state.headline3 == 0) {
      this.game.state.headline3 = 1;
      if (this.game.player == first_picker) {
        this.game.state.headline_opponent_card = msg.extra.headline_card;
        this.game.state.headline_card = msg.extra.headline_opponent_card;
        this.removeCardFromHand(this.game.state.headline_card);
      } else {
        this.game.state.headline_card = msg.extra.headline_card;
        this.removeCardFromHand(this.game.state.headline_card);
      }
    }

    //
    // fall through to headline execution
    //

  }


  //
  // default to USSR
  //
  let player_to_go = 1;




  //
  // headline execution starts here
  //
  if (this.game.state.headline4 == 0) {

    this.updateLog("Moving into first headline card event");

    let my_card = this.game.state.headline_card;
    let opponent_card = this.game.state.headline_opponent_card;

    if (this.game.player == 1) {
      if (this.game.deck[0].cards[my_card].ops > this.game.deck[0].cards[opponent_card].ops) {
        player_to_go = 1;
      } else {
        player_to_go = 2;
      }
    }
    if (this.game.player == 2) {
      if (this.game.deck[0].cards[my_card].ops >= this.game.deck[0].cards[opponent_card].ops) {
        player_to_go = 2;
      } else {
        player_to_go = 1;
      }
    }


    let player = "ussr";
    let opponent = "us";
    if (this.game.player == 2) { player = "us"; opponent = "ussr"; }
    let card_player = player;

    //
    // headline4 is our FIRST headline card
    // headline5 is our SECOND headline card
    //
    let shd_continue = 1;

    //
    // check to see if defectors is live
    //
    let us_plays_defectors = 0;
    let ussr_plays_defectors = 0;

    if (my_card == "defectors") {
      if (opponent == "ussr") {
	us_plays_defectors = 1;
      }
      if (opponent == "us") {
	ussr_plays_defectors = 1;
      }
    } else {
      if (opponent_card == "defectors") {
        if (opponent == "ussr") {
  	  ussr_plays_defectors = 1;
        }
        if (opponent == "us") {
  	  us_plays_defectors = 1;
        }
      }
    }


    if (us_plays_defectors == 1) {

      this.updateLog("US headlines <span class=\"logcard\" id=\"defectors\">Defectors</span>");

      this.game.turn = [];
      this.game.queue.push("discard\tus\tdefectors");
      if (my_card != "defectors") {
        this.updateLog("USSR headlines <span class=\"logcard\" id=\""+my_card+"\">"+this.game.deck[0].cards[my_card].name+"</span>");
        this.game.queue.push("discard\tussr\t"+my_card);
      } else {
        this.updateLog("USSR headlines <span class=\"logcard\" id=\""+opponent_card+"\">"+this.game.deck[0].cards[opponent_card].name+"</span>");
        this.game.queue.push("discard\tussr\t"+opponent_card);
      }

      this.game.state.headline4 = 1;
      this.game.state.headline5 = 1;
      this.game.state.headline  = 0;
      // debugging test
      //this.saveGame(this.game.id);

      this.updateLog("Defectors cancels USSR headline.");
      this.updateStatus("Defectors cancels USSR headline. Moving into first turn...");

      //
      // only one player should trigger next round
      //
      if (this.game.player == 1) {
        let extra         = {};
          extra.skipqueue = 0;
	  extra.target    = 1;
        this.sendMessage("game", extra);
      }

    } else {

      // show headline card information to both players
      if (this.game.player == 1) {
        this.updateStatus("US headlines <span class=\"showcard\" id=\""+opponent_card+"\">"+this.game.deck[0].cards[opponent_card].name+"</span>. USSR headlines <span class=\"showcard\" id=\""+my_card+"\">"+this.game.deck[0].cards[my_card].name+"</span>");
        this.updateLog("US headlines <span class=\"logcard\" id=\""+opponent_card+"\">"+this.game.deck[0].cards[opponent_card].name+"</span>. USSR headlines <span class=\"logcard\" id=\""+my_card+"\">"+this.game.deck[0].cards[my_card].name+"</span>");
      } else {
        this.updateStatus("USSR headlines <span class=\"showcard\" id=\""+opponent_card+"\">"+this.game.deck[0].cards[opponent_card].name+"</span>. US headlines <span class=\"showcard\" id=\""+my_card+"\">"+this.game.deck[0].cards[my_card].name+"</span>");
        this.updateLog("USSR headlines <span class=\"logcard\" id=\""+opponent_card+"\">"+this.game.deck[0].cards[opponent_card].name+"</span>. US headlines <span class=\"logcard\" id=\""+my_card+"\">"+this.game.deck[0].cards[my_card].name+"</span>");
      }

      this.game.state.headline4 = 1;

console.log("HERE: " + player_to_go + " --- " + this.game.player);

      if (player_to_go == this.game.player) {
        this.addMove("discard\t"+card_player+"\t"+my_card);
        this.addMove("event\t"+card_player+"\t"+my_card);
        this.removeCardFromHand(my_card);
        this.endTurn();
      } else {
      }

      // debugging
      //this.saveGame(this.game.id);

      //
      // only one player should trigger next round
      //
    }

    return 0;
  }



  if (this.game.state.headline5 == 0) {

    let my_card = this.game.state.headline_card;
    let opponent_card = this.game.state.headline_opponent_card;

    //
    // we switch to the other player now
    //
    if (this.game.player == 1) {
      if (this.game.deck[0].cards[my_card] == undefined) { player_to_go = 2; } else {
        if (this.game.deck[0].cards[opponent_card] == undefined) { player_to_go = 1; } else {
          if (this.game.deck[0].cards[my_card].ops > this.game.deck[0].cards[opponent_card].ops) {
            player_to_go = 2;
          } else {
            player_to_go = 1;
          }
	}
      }
    }

    if (this.game.player == 2) {
      if (this.game.deck[0].cards[my_card] == undefined) { player_to_go = 1; } else {
        if (this.game.deck[0].cards[opponent_card] == undefined) { player_to_go = 2; } else {
          if (this.game.deck[0].cards[my_card].ops >= this.game.deck[0].cards[opponent_card].ops) {
            player_to_go = 1;
          } else {
            player_to_go = 2;
          }
  	}
      }
    }


    let player = "ussr";
    let opponent = "us";
    if (this.game.player == 2) { player = "us"; opponent = "ussr"; }
    let card_player = player;
 
    //
    // headline4 is our FIRST headline card
    // headline5 is our SECOND headline card
    //

    let shd_continue = 1;

    this.game.state.headline5 = 1;

    if (player_to_go == this.game.player) {
      this.addMove("discard\t"+card_player+"\t"+my_card);
      this.addMove("event\t"+card_player+"\t"+my_card);
      this.removeCardFromHand(my_card);
      this.endTurn();
    } else {
    }

    // debugging
    // this.saveGame(this.game.id);

    return 0;

  }

  return 1;
}





Twilight.prototype.playMove = function playMove(msg) {

  //
  // no longer in headline phase
  //
  this.game.state.headline  = 0;
  this.game.state.headline1 = 0;
  this.game.state.headline2 = 0;
  this.game.state.headline3 = 0;
  this.game.state.headline4 = 0;
  this.game.state.headline5 = 0;
  this.game.state.headline_hash = "";
  this.game.state.headline_card = "";
  this.game.state.headline_xor = "";
  this.game.state.headline_opponent_hash = "";
  this.game.state.headline_opponent_card = "";
  this.game.state.headline_opponent_xor = "";


  //
  // how many turns left?
  //
  let rounds_in_turn = 6;
  if (this.game.state.round > 3) { rounds_in_turn = 7; }
  let moves_remaining = rounds_in_turn - this.game.state.turn_in_round;


  //
  //
  //
  let scoring_cards_available = 0;
  for (i = 0; i < this.game.deck[0].hand.length; i++) {
    if (this.game.deck[0].cards[this.game.deck[0].hand[i]].scoring == 1) { scoring_cards_available++; }
  }

console.log("MOVES REMAINING: " + moves_remaining);
console.log("SCORING CARDS: " + scoring_cards_available);

  //
  // player 1 moves
  //
  if (this.game.state.turn == 0) {
    if (this.game.player == 1) {
      if (this.game.state.turn_in_round == 0) {
	this.game.state.turn_in_round++;
	this.updateActionRound();
      }
      if (this.game.state.events.missile_envy == 1) {

	//
	// if must play scoring card -- moves remaining at 0 in last move
	//
	if (scoring_cards_available > moves_remaining) {
	  this.playerTurn("scoringcard");
	} else {

	  //
	  // if cannot sacrifice missile envy to bear trap because red purged
	  //
	  if (this.game.state.events.beartrap == 1 && this.game.state.events.redscare_player1 == 1) {
	    this.playerTurn();
	  } else {
	    this.game.state.events.missile_envy = 0;
            this.playerTurn("missileenvy");
	    this.game.state.events.missileenvy = 0;
	  }
	}
      } else {
        this.playerTurn();
      }
    } else {
      this.updateStatus("Waiting for USSR to move");
      if (this.game.state.turn_in_round == 0) {
	this.game.state.turn_in_round++;
	this.updateActionRound();
      }
    }
    return;
  }

  //
  // player 2 moves
  //
  if (this.game.state.turn == 1) {
    if (this.game.player == 2) {

      if (this.game.state.turn_in_round == 0) {
    	this.removeCardFromHand(this.game.state.headline_card);
      }

      if (this.game.state.events.missile_envy == 2) {
	//
	// moves remaining will be 0 last turn
	//
	if (scoring_cards_available > moves_remaining) {
	  this.playerTurn("scoringcard");
	} else {

	  //
	  // if cannot sacrifice missile envy to quagmire because red scare
	  //
	  if (this.game.state.events.quagmire == 1 && this.game.state.events.redscare_player2 == 1) {
	    this.playerTurn();
	  } else {
	    this.game.state.events.missile_envy = 0;
            this.playerTurn("missileenvy");
	    this.game.state.events.missileenvy = 0;
	  }

	}
      } else {
        this.playerTurn();
      }
    } else {
      this.updateStatus("Waiting for US to move");
    }
    return;
  }


  return 1;

}






Twilight.prototype.playOps = function playOps(player, ops, card) {

  //
  // modify ops
  //
  ops = this.modifyOps(ops);

  let me = "ussr";
  let twilight_self = this;

  // reset events / DOM
  twilight_self.playerFinishedPlacingInfluence();

  if (this.game.player == 2) { me = "us"; } 

  if (player === me) {

    let html  = player.toUpperCase() + ' plays ' + ops + ' OPS:<p></p><ul>';
    if (this.game.state.limit_placement == 0) { html += '<li class="card" id="place">place influence</li>'; }
    if (this.game.state.limit_coups == 0) { html += '<li class="card" id="coup">launch coup</li>'; }
    if (this.game.state.limit_realignments == 0) { html += '<li class="card" id="realign">realign country</li>'; }
    html += '</ul>';
    twilight_self.updateStatus(html);

    $('.card').off();
    $('.card').on('click', function() {

      let action2 = $(this).attr("id");

      if (action2 == "place") {

        twilight_self.updateStatus("Place " + ops + " influence");

        let j = ops;
        twilight_self.updateStatus("Place " + j + " influence.");
        twilight_self.prePlayerPlaceInfluence(player);
	if (j == 1) { 
          twilight_self.uneventOpponentControlledCountries(player, card);
	}
        twilight_self.playerPlaceInfluence(player, () => {

          j--;

	  //
	  // breaking control must be costly
	  //
	  if (twilight_self.game.break_control == 1) { 
	    j--;
	    if (j < 0) { twilight_self.endRegionBonus(); j = 0; }
	  }
	  twilight_self.game.break_control = 0;

	  if (j < 2) {
	    twilight_self.uneventOpponentControlledCountries(player, card);
	  }

          twilight_self.updateStatus("Place " + j + " influence");
  
        if (j <= 0) {
	    if (twilight_self.isRegionBonus(card) == 1) {
              twilight_self.updateStatus("Place regional bonus");
	      j++;
	      twilight_self.limitToRegionBonus();
	      twilight_self.endRegionBonus();
	    } else {
              twilight_self.playerFinishedPlacingInfluence();
              twilight_self.endTurn();
              return;
            }
          }
        });

      }

      if (action2 == "coup") {
        twilight_self.updateStatus("Pick a country to coup");
	twilight_self.playerCoupCountry(player, ops, card);
	return;
      }


      if (action2 == "realign") {

        twilight_self.updateStatus("Realign with " + ops + " OPS, or:<p></p><ul><li class=\"card\" id=\"cancelrealign\">stop realigning</li></ul>");

        $('.card').off();
        $('.card').on('click', function() {

          let action2 = $(this).attr("id");
          if (action2 == "cancelrealign") {
            twilight_self.addMove("notify\t"+player.toUpperCase()+" opts to end realignments");
            twilight_self.endTurn();
	    return;
	  }

	});

        let j = ops;
        twilight_self.playerRealign(player, card, () => {

          //
          // disable countries without 
          //
	  for (var countryname in twilight_self.countries) {

	    let divname3 = "#"+countryname;

            if (twilight_self.game.player == 1) {
              if (twilight_self.countries[countryname].us < 1) {
	        $(divname3).off();
	        $(divname3).on('click',()=>{ alert('invalid realign target'); });
              }
            } else {
              if (twilight_self.countries[countryname].ussr < 1) {
	        $(divname3).off();
	        $(divname3).on('click',()=>{ alert('invalid realign target'); });
              }
            }
	  }


          j--;

          twilight_self.updateStatus("Realign with " + j + " OPS, or:<p></p><ul><li class=\"card\" id=\"cancelrealign\">stop realigning</li></ul>");

          $('.card').off();
          $('.card').on('click', function() {

            let action2 = $(this).attr("id");
            if (action2 == "cancelrealign") {

	      //
	      // reverse order of realigns
	      //
	      // they need to be executed in the order that we did them for bonuses to work properly
	      //
	      let new_moves = [];
	      for (let z = twilight_self.moves.length-1; z >= 0; z--) {
		let tmpar = twilight_self.moves[z].split("\t");
		if (tmpar[0] === "realign") {
		  new_moves.push(twilight_self.moves[z]);
		} else {
		  new_moves.unshift(twilight_self.moves[z])
		}
	      }
	      twilight_self.moves = new_moves;
              twilight_self.endTurn();
	      return;
	    }
	  });


          if (j <= 0) {
            if (twilight_self.isRegionBonus(card) == 1) {
              twilight_self.updateStatus("Realign with bonus OP");
              j++;
              twilight_self.limitToRegionBonus();
              twilight_self.endRegionBonus();
            } else {

              //
              // reverse order of realigns
              //
              // they need to be executed in the order that we did them for bonuses to work properly
              //
              let new_moves = [];
              for (let z = twilight_self.moves.length-1; z >= 0; z--) {
                let tmpar = twilight_self.moves[z].split("\t");
                if (tmpar[0] === "realign") {
                  new_moves.push(twilight_self.moves[z]);
                } else {
                  new_moves.unshift(twilight_self.moves[z])
                }
              }
              twilight_self.moves = new_moves;
              twilight_self.endTurn();
              return;
            }
          }
        });
      }
    });
  }

  return;

}












Twilight.prototype.playerPickHeadlineCard = function playerPickHeadlineCard() {

  if (this.browser_active == 0) { return; }

  let player = "us";

  if (this.game.player == 1) { player = "ussr"; }

  let x = player.toUpperCase() + " pick your headline card: <p></p><ul>";
  for (i = 0; i < this.game.deck[0].hand.length; i++) {
    x += '<li class="card showcard" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name+'</li>';
  }
  x += '</ul>';

  this.updateStatus(x);

  let twilight_self = this;  

  $('.card').off();
  $('.showcard').off();
  $('.showcard').mouseover(function() {
    let card = $(this).attr("id");
    twilight_self.showCard(card);
  }).mouseout(function() {
    let card = $(this).attr("id");
    twilight_self.hideCard(card);
  });
  $('.card').on('click', function() {

    let card = $(this).attr("id");

    // cannot pick china card or UN intervention
    if (card == "china") { alert("You cannot headline China"); return; }
    if (card == "unintervention") { alert("You cannot headline UN Intervention"); return; }

    twilight_self.game.state.headline_card = card;
    twilight_self.game.state.headline_xor = twilight_self.app.crypto.hash(Math.random());
    twilight_self.game.state.headline_hash = twilight_self.app.crypto.encodeXOR(twilight_self.app.crypto.stringToHex(twilight_self.game.state.headline_card), twilight_self.game.state.headline_xor);

    if (twilight_self.game.player != 1) {
      twilight_self.game.state.headline1 = 1;
    }
    //twilight_self.saveGame(twilight_self.game.id);

    twilight_self.updateStatus("simultaneous blind pick... encrypting selected card");
    twilight_self.game.turn = [];

    let extra       = {};
    extra.headline_hash = twilight_self.game.state.headline_hash;
    extra.target    = twilight_self.returnNextPlayer(twilight_self.game.player);

    $('.card').off();
    $('.showcard').off();
    twilight_self.hideCard();

    twilight_self.sendMessage("game", extra);

    return;

  });

}



Twilight.prototype.playerTurn = function playerTurn(selected_card=null) {


  if (this.browser_active == 0) { return; }

  //
  // reset region bonuses (if applicable)
  //
  this.game.state.events.china_card_in_play = 0;
  this.game.state.events.vietnam_revolts_eligible = 1;
  this.game.state.events.china_card_eligible = 1;
  this.game.state.events.region_bonus = "";
  this.game.state.ironlady_before_ops = 0;

  let player = "ussr";
  let opponent = "us";
  if (this.game.player == 2) { player = "us"; opponent = "ussr"; }

  let is_this_missile_envy_noneventable = this.game.state.events.missileenvy;

  let user_message = "";
  if (selected_card == null) {

    user_message = player.toUpperCase() + " pick a card: <p></p><ul>";
    for (i = 0; i < this.game.deck[0].hand.length; i++) {
      //
      // when UN Intervention is eventing, we can only select opponent cards
      //
      if (this.game.state.events.unintervention == 1) {
	if (this.game.player == 1 && this.game.deck[0].cards[this.game.deck[0].hand[i]].player === "us") {
          user_message += '<li class="card showcard" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name+'</li>';
        } 
	if (this.game.player == 2 && this.game.deck[0].cards[this.game.deck[0].hand[i]].player === "ussr") {
          user_message += '<li class="card showcard" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name+'</li>';
        } 
      } else {
        user_message += '<li class="card showcard" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name+'</li>';
      }
    };
  } else {

    if (selected_card === "scoringcard") {
      user_message = 'Scoring card must be played: <p></p><ul>';
      for (i = 0; i < this.game.deck[0].hand.length; i++) {
        if (this.game.deck[0].cards[this.game.deck[0].hand[i]].scoring == 1) {
	  selected_card = this.game.deck[0].hand[i];
          user_message += '<li class="card showcard" id="'+selected_card+'">'+this.game.deck[0].cards[selected_card].name+'</li>';
        }
      }
    } else {
      user_message = 'Click to play: <p></p><ul><li class="card showcard" id="'+selected_card+'">'+this.game.deck[0].cards[selected_card].name+'</li>';
    }
  }

  //
  // Cuban Missile Crisis
  //
  if ((this.game.player == 1 && this.game.state.events.cubanmissilecrisis == 1) || (this.game.player == 2 && this.game.state.events.cubanmissilecrisis == 2)) {
    let can_remove = 0;
    if (this.game.player == 1 && this.countries['cuba'].ussr >= 2) { can_remove = 1; }
    if (this.game.player == 2 && this.countries['turkey'].us >= 2) { can_remove = 1; }
    if (this.game.player == 2 && this.countries['westgermany'].us >= 2) { can_remove = 1; }
    if (can_remove == 1) {
      user_message += '<li class="card" id="cancel_cmc">cancel cuban missile crisis</li>';
    }
  }
  user_message += '</ul>';


  //
  // Bear Trap and Quagmire
  //
  // headline check ensures that Quagmire does not trigger if headlined and the US triggers a card pull
  //
  if (this.game.state.headline == 0 && ((this.game.player == 1 && this.game.state.events.beartrap == 1) || (this.game.player == 2 && this.game.state.events.quagmire == 1)) ) {

    //
    // do we have cards to select
    //
    let cards_available = 0;
    let scoring_cards_available = 0;

    //
    // how many turns left?
    //
    let rounds_in_turn = 6;
    if (this.game.state.round > 3) { rounds_in_turn = 7; }
    let moves_remaining = rounds_in_turn - this.game.state.turn_in_round;

    
    if (this.game.state.events.beartrap == 1) {
      user_message = "Select a card for Bear Trap: <p></p><ul>";
    } else {
      user_message = "Select a card for Quagmire: <p></p><ul>";
    }

    for (i = 0; i < this.game.deck[0].hand.length; i++) {
      if (this.modifyOps(this.game.deck[0].cards[this.game.deck[0].hand[i]].ops) >= 2 && this.game.deck[0].hand[i] != "china") {
        user_message += '<li class="card showcard" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name+'</li>';
        cards_available++;
      }
      if (this.game.deck[0].cards[this.game.deck[0].hand[i]].scoring == 1) { scoring_cards_available++; }
    }
    user_message += '</ul>';


    //
    // do we have any cards to play?
    //
    if (cards_available > 0 && scoring_cards_available <= moves_remaining) {
      this.updateStatus(user_message);
    } else {
      if (scoring_cards_available > 0) {
        if (this.game.state.events.beartrap == 1) {
          user_message = "Bear Trap restricts you to Scoring Cards: <p></p><ul>";
        } else {
          user_message = "Quagmire restricts you to Scoring Cards: <p></p><ul>";
        }
        for (i = 0; i < this.game.deck[0].hand.length; i++) {
          if (this.game.deck[0].cards[this.game.deck[0].hand[i]].scoring == 1) {
            user_message += '<li class="card showcard" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name+'</li>';
          }
        }
	user_message += '</ul>';
        this.updateStatus(user_message);
      } else {
        if (this.game.state.events.beartrap == 1) {
          user_message = "No cards playable due to Bear Trap:<p></p><ul>";
        } else {
          user_message = "No cards playable due to Quagmire:<p></p><ul>";
        }
        user_message += '<li class="card showcard" id="skipturn">skip turn</li>';
        user_message += '</ul>';
	this.updateStatus(user_message);
      }
    }
  }

  this.updateStatus(user_message);


  let twilight_self = this;  

  if (this.game.state.events.unintervention != 1 && selected_card != "grainsales") {
    this.moves = [];
  }

  twilight_self.playerFinishedPlacingInfluence();

  //
  // cannot play if no cards remain
  //
  if (selected_card == null && this.game.deck[0].hand.length == 0) {
    this.updateStatus("Skipping turn... no cards left to play");
    this.updateLog("Skipping turn... no cards left to play");
    this.addMove("resolve\tplay");
    this.endTurn();
    return;
  }


  $('.card').off();
  $('.showcard').off();
  $('.showcard').mouseover(function() {
    let card = $(this).attr("id");
    twilight_self.showCard(card);
  }).mouseout(function() {
    let card = $(this).attr("id");
    twilight_self.hideCard(card);
  });
  $('.card').on('click', function() {

    let card = $(this).attr("id");


    //
    // warn if user is leaving a scoring card in hand
    //
    let scoring_cards_available = 0;
    let rounds_in_turn = 6;
    if (twilight_self.game.state.round > 3) { rounds_in_turn = 7; }
    let moves_remaining = rounds_in_turn - twilight_self.game.state.turn_in_round;

    for (i = 0; i < twilight_self.game.deck[0].hand.length; i++) {
      if (twilight_self.game.deck[0].cards[twilight_self.game.deck[0].hand[i]].scoring == 1) { scoring_cards_available++; }
    }

    if (scoring_cards_available > moves_remaining && twilight_self.game.deck[0].cards[card].scoring == 0) {
      let c = confirm("Holding a scoring card at the end of the turn will lose you the game. Still play this card?");
      if (c) {} else { return; } 
    }

    //
    // Quagmire / Bear Trap
    // 
    if (twilight_self.game.state.headline == 0 && (twilight_self.game.state.events.quagmire == 1 && twilight_self.game.player == 2) || (twilight_self.game.state.events.beartrap == 1 && twilight_self.game.player == 1) ) {

      //
      // scoring cards score, not get discarded
      //
      if (twilight_self.game.deck[0].cards[card].scoring == 0) { 
        twilight_self.hideCard(card);
        twilight_self.removeCardFromHand(card);
        twilight_self.addMove("resolve\tplay");
        twilight_self.addMove("quagmire\t"+player+"\t"+card);
        twilight_self.addMove("discard\t"+player+"\t"+card);
        twilight_self.endTurn();
        return 0;
      }
    }


    //
    // Skip Turn
    // 
    if (card == "skipturn") {
      twilight_self.hideCard(card);
      twilight_self.addMove("resolve\tplay");
      twilight_self.addMove("notify\t"+player+" has no cards playable.");
      twilight_self.endTurn();
      return 0;
    }


    //
    // Cuban Missile Crisis
    //
    if (card == "cancel_cmc") {
      if (twilight_self.game.player == 1) {
        twilight_self.removeInfluence("cuba", 2, "ussr");
        twilight_self.addMove("remove\tussr\tussr\tcuba\t2");
        twilight_self.addMove("unlimit\tcmc");
        twilight_self.addMove("notify\tUSSR has cancelled the Cuban Missile Crisis");
	twilight_self.endTurn();
      } else {

        let user_message = "Select country from which to remove influence:<p></p><ul>";
        if (twilight_self.countries['turkey'].us >= 2) {
          user_message += '<li class="card showcard" id="turkey">Turkey</li>';
        }
        if (twilight_self.countries['westgermany'].us >= 2) {
          user_message += '<li class="card showcard" id="westgermany">West Germany</li>';
        }
        user_message += '</ul>';
        twilight_self.updateStatus(user_message);

        $('.card').off();
        $('.card').on('click', function() {

          let action2 = $(this).attr("id");

	  if (action2 === "turkey") {
            twilight_self.removeInfluence("turkey", 2, "us");
            twilight_self.addMove("remove\tus\tus\tturkey\t2");
            twilight_self.addMove("unlimit\tcmc");
            twilight_self.addMove("notify\tUS has cancelled the Cuban Missile Crisis");
	    twilight_self.endTurn();
	  }
	  if (action2 === "westgermany") {
            twilight_self.removeInfluence("westgermany", 2, "us");
            twilight_self.addMove("remove\tus\tus\twestgermany\t2");
            twilight_self.addMove("unlimit\tcmc");
            twilight_self.addMove("notify\tUS has cancelled the Cuban Missile Crisis");
  	    twilight_self.endTurn();
	  }
        });

      }
      return 0;
    }

    //
    // The China Card
    //
    twilight_self.hideCard(card);
    twilight_self.addMove("resolve\tplay");
    twilight_self.addMove("discard\t"+player+"\t"+card);

    if (card == "china") { 
      twilight_self.addMove("unlimit\tchina");
      twilight_self.game.state.events.china_card_in_play = 1; 
    }

    //
    // WWBY triggers on non-headlines, so Grain Sales headline shdn't trigger
    //
    if (twilight_self.game.state.events.wwby == 1 && twilight_self.game.state.headline == 0) {
      if (player == "us") {
        if (card != "unintervention") {
	  twilight_self.game.state.events.wwby_triggers = 1;
	}
        twilight_self.game.state.events.wwby = 0;
      }
    }


    if (twilight_self.game.deck[0].cards[card].scoring == 1) { 
      twilight_self.updateStatus('Playing '+twilight_self.game.deck[0].cards[card].name+':<p></p><ul><li class="card" id="event">score region</li></ul>');
    } else {

      let ops = twilight_self.modifyOps(twilight_self.game.deck[0].cards[card].ops);


      //
      // is space race an option
      //
      let sre = 1;
      if (twilight_self.game.player == 1 && twilight_self.game.state.space_race_ussr_counter >= 1) {
	if (twilight_self.game.state.animal_in_space == "ussr" && twilight_self.game.state.space_race_ussr_counter < 2) {} else {
	  sre = 0;
	}
      }
      if (twilight_self.game.player == 2 && twilight_self.game.state.space_race_us_counter >= 1) {
	if (twilight_self.game.state.animal_in_space == "us" && twilight_self.game.state.space_race_us_counter < 2) {} else {
	  sre = 0;
	}
      }


      let announcement = player.toUpperCase() + ' playing '+twilight_self.game.deck[0].cards[card].name+'<p></p><ul>';

      //
      // cannot play China card or Missile Envy (forced) for event
      //
      // cannot event UN Intervention w/o the opponent card in hand
      //
      let can_play_event = 1;
      if (card == "unintervention") {
	let opponent_event_in_hand = 0;
        for (let b = 0; b < twilight_self.game.deck[0].hand.length; b++) {
	  let tmpc = twilight_self.game.deck[0].hand[b];
	  if (tmpc != "china") {
	    if (twilight_self.game.player == 1) {
	      if (twilight_self.game.deck[0].cards[tmpc].player === "us") { opponent_event_in_hand = 1; }
	    } else {
	      if (twilight_self.game.deck[0].cards[tmpc].player === "ussr") { opponent_event_in_hand = 1; }
	    }
	  }
	}
	if (opponent_event_in_hand == 0) { can_play_event = 0; }
      }
      if (card == "china") { can_play_event = 0; }
      if (card == "missileenvy" && is_this_missile_envy_noneventable == 1) { can_play_event = 0; }
      if (can_play_event == 1) { announcement += '<li class="card" id="event">play event</li>'; } 

      announcement += '<li class="card" id="ops">play ops</li>';

      if (sre == 1) {
        if (player == "ussr" && ops > 1) {
          if (twilight_self.game.state.space_race_ussr < 4 && ops > 1) {
            announcement += '<li class="card" id="space">space race</li>';  
	  }
          if (twilight_self.game.state.space_race_ussr >= 4 && twilight_self.game.state.space_race_ussr < 7 && ops > 2) {
            announcement += '<li class="card" id="space">space race</li>';  
	  }
          if (twilight_self.game.state.space_race_ussr == 7 && ops > 3) {
            announcement += '<li class="card" id="space">space race</li>';  
  	  }
        }
        if (player == "us" && ops > 1) {
          if (twilight_self.game.state.space_race_us < 4 && ops > 1) {
            announcement += '<li class="card" id="space">space race</li>';  
	  }
          if (twilight_self.game.state.space_race_us >= 4 && twilight_self.game.state.space_race_us < 7 && ops > 2) {
            announcement += '<li class="card" id="space">space race</li>';  
	  }
          if (twilight_self.game.state.space_race_us == 7 && ops > 3) {
            announcement += '<li class="card" id="space">space race</li>';  
  	  }
        }
      } else {
      }

      //
      // cancel cuban missile crisis
      //
      if ((twilight_self.game.player == 1 && twilight_self.game.state.events.cubanmissilecrisis == 1) || (twilight_self.game.player == 2 && twilight_self.game.state.events.cubanmissilecrisis == 2)) {
        let can_remove = 0;
        if (twilight_self.game.player == 1 && twilight_self.countries['cuba'].ussr >= 2) { can_remove = 1; }
        if (twilight_self.game.player == 2 && twilight_self.countries['turkey'].us >= 2) { can_remove = 1; }
        if (can_remove == 1) {
          announcement += '<li class="card" id="cancel_cmc">cancel cuban missile crisis</li>';
        }
      }

      twilight_self.updateStatus(announcement);
    }

    $('.card').off();
    $('.card').on('click', function() {

      let action = $(this).attr("id");
      $('.card').off();

      //
      // Cuban Missile Crisis
      //
      if (action == "cancel_cmc") {
	this.moves = [];
        if (twilight_self.game.player == 1) {
          twilight_self.removeInfluence("cuba", 2, "ussr");
          twilight_self.addMove("remove\tussr\tussr\tcuba\t2");
          twilight_self.addMove("notify\tUSSR has cancelled the Cuban Missile Crisis");
          twilight_self.addMove("unlimit\tcmc");
	  twilight_self.endTurn();
        } else {

          let user_message = "Select country from which to remove influence:<p></p><ul>";
          if (twilight_self.countries['turkey'].us >= 2) {
            user_message += '<li class="card showcard" id="turkey">Turkey</li>';
          }
          if (twilight_self.countries['westgermany'].us >= 2) {
            user_message += '<li class="card showcard" id="westgermany">West Germany</li>';
          }
          user_message += '</ul>';
          twilight_self.updateStatus(user_message);

          $('.card').off();
          $('.card').on('click', function() {

            let action2 = $(this).attr("id");

	    if (action2 === "turkey") {
              twilight_self.removeInfluence("turkey", 2, "us");
              twilight_self.addMove("remove\tus\tus\tturkey\t2");
              twilight_self.addMove("unlimit\tcmc");
              twilight_self.addMove("notify\tUS has cancelled the Cuban Missile Crisis");
	      twilight_self.endTurn();
	    }
	    if (action2 === "westgermany") {
              twilight_self.removeInfluence("westgermany", 2, "us");
              twilight_self.addMove("remove\tus\tus\twestgermany\t2");
              twilight_self.addMove("unlimit\tcmc");
              twilight_self.addMove("notify\tUS has cancelled the Cuban Missile Crisis");
  	      twilight_self.endTurn();
	    }
          });
        }
        return;
      }


      if (action == "event") {

        //
        // sanity check on opponent event choice
        //
        if (twilight_self.game.deck[0].cards[card].player != "both" && twilight_self.game.deck[0].cards[card].player != player) {

	  let fr =  "This is your opponent's event. Are you sure you wish to play it for the event instead of the OPS?<p></p><ul>";
              fr += '<li class="card" id="playevent">play event</li>';
              fr += '<li class="card" id="pickagain">pick again</li>';
	      fr += '</ul>';

          twilight_self.updateStatus(fr);

          $('.card').off();
          $('.card').on('click', function() {

            let action = $(this).attr("id");
            $('.card').off();

            if (action == "playevent") {
	      twilight_self.playerTriggerEvent(player, card);
	      return;
	    }
            if (action == "pickagain") {
	      twilight_self.playerTurn(selected_card);
	      return;
	    }

          });

	  return;
        }

	// our event or both
	//
	twilight_self.playerTriggerEvent(player, card);
	return;

      }

      if (action == "ops") {

        if (twilight_self.game.deck[0].cards[card].player == opponent) {
	  if (twilight_self.game.state.events.unintervention == 1) {

	    //
	    // Flower Power
	    //
	    if (twilight_self.game.state.events.flowerpower == 1) {
	      if (card == "arabisraeli" || card == "koreanwar" || card == "brushwar" || card == "indopaki" || card == "iraniraq") {
		if (player === "us") {
                  twilight_self.addMove("notify\tFlower Power triggered by "+card);
                  twilight_self.addMove("vp\tussr\t2\t1");
		}
	      }
	    }

	    // resolve added
            twilight_self.addMove("notify\t"+player.toUpperCase()+" plays "+card+" with UN Intervention");
            twilight_self.addMove("ops\t"+player+"\t"+card+"\t"+twilight_self.game.deck[0].cards[card].ops);
            twilight_self.removeCardFromHand(card);
	    twilight_self.endTurn();
            return;

	  } else {

	    //
	    // Flower Power
	    //
	    if (twilight_self.game.state.events.flowerpower == 1) {
	      if (card == "arabisraeli" || card == "koreanwar" || card == "brushwar" || card == "indopaki" || card == "iraniraq") {
		if (player === "us") {
                  twilight_self.addMove("notify\tFlower Power triggered by "+card);
                  twilight_self.addMove("vp\tussr\t2\t1");
		}
	      }
	    }

            twilight_self.updateStatus('Playing opponent card:<p></p><ul><li class="card" id="before">event before ops</li><li class="card" id="after">event after ops</li></ul>');

            $('.card').off();
            $('.card').on('click', function() {

              let action2 = $(this).attr("id");

	      twilight_self.game.state.event_before_ops = 0;
	      twilight_self.game.state.event_name = "";

	      if (action2 === "before") {
	        twilight_self.game.state.event_before_ops = 1;
	        twilight_self.game.state.event_name = twilight_self.game.deck[0].cards[card].name;
                twilight_self.addMove("ops\t"+player+"\t"+card+"\t"+twilight_self.game.deck[0].cards[card].ops);
                twilight_self.addMove("event\t"+player+"\t"+card);
                twilight_self.removeCardFromHand(card);
	        twilight_self.endTurn();
	        return;
	      }
	      if (action2 === "after") {
	        twilight_self.game.state.event_name = twilight_self.game.deck[0].cards[card].name;
                twilight_self.addMove("event\t"+player+"\t"+card);
                twilight_self.addMove("ops\t"+player+"\t"+card+"\t"+twilight_self.game.deck[0].cards[card].ops);
                twilight_self.removeCardFromHand(card);
	        twilight_self.endTurn();
                return;
              }

	    });
          }

	  return;

        } else {

          twilight_self.addMove("ops\t"+player+"\t"+card+"\t"+twilight_self.game.deck[0].cards[card].ops);
          if (card == "china") { twilight_self.addMove("limit\tchina"); }
          twilight_self.removeCardFromHand(card);
	  twilight_self.endTurn();
	  return;

	}
      }

      if (action == "space") {
	twilight_self.addMove("space\t"+player+"\t"+card);
        twilight_self.removeCardFromHand(card);
        twilight_self.endTurn();
	return;
      }

      twilight_self.updateStatus("");      

    });

  });
}


Twilight.prototype.playerTriggerEvent = function playerTriggerEvent(player, card) {

  let twilight_self = this;

  //
  // Flower Power
  //
  if (twilight_self.game.state.events.flowerpower == 1) {
    if (card == "arabisraeli" || card == "koreanwar" || card == "brushwar" || card == "indopaki" || card == "iraniraq") {
      if (player === "us") {
        twilight_self.addMove("notify\tFlower Power triggered by "+card);
        twilight_self.addMove("vp\tussr\t2\t1");
      }
    }
  }

  twilight_self.game.state.event_name = twilight_self.game.deck[0].cards[card].name;
  twilight_self.addMove("event\t"+player+"\t"+card);
  twilight_self.removeCardFromHand(card);


  //
  // Our Man in Tehran -- check if reshuffle is needed
  //
  if (card == "tehran") {

    //
    // reshuffle needed before event
    //
    if (5 > twilight_self.game.deck[0].crypt.length) {

      let discarded_cards = twilight_self.returnDiscardedCards();
      if (Object.keys(discarded_cards).length > 0) {

        //
        // shuffle in discarded cards -- eliminate SHUFFLE here as unnecessary
        //
        twilight_self.addMove("DECKRESTORE\t1");
        twilight_self.addMove("DECKENCRYPT\t1\t2");
        twilight_self.addMove("DECKENCRYPT\t1\t1");
        twilight_self.addMove("DECKXOR\t1\t2");
        twilight_self.addMove("DECKXOR\t1\t1");
        twilight_self.addMove("flush\tdiscards"); // opponent should know to flush discards as we have
        twilight_self.addMove("DECK\t1\t"+JSON.stringify(discarded_cards));
        twilight_self.addMove("DECKBACKUP\t1");
        twilight_self.updateLog("cards remaining: " + twilight_self.game.deck[0].crypt.length);
        twilight_self.updateLog("Shuffling discarded cards back into the deck...");

      }
    }
  }

  twilight_self.endTurn();
  return;

}











/////////////////////
// Place Influence //
/////////////////////
Twilight.prototype.uneventOpponentControlledCountries = function uneventOpponentControlledCountries(player, card) {

  let bonus_regions = this.returnArrayOfRegionBonuses(card);

  for (var i in this.countries) { 
    if (player == "us") {
      if (this.isControlled("ussr", i) == 1) {

	//
	// allow bonus regions to break control with bonuses
	//
	let bonus_region_applies = 0;
	for (let z = 0; z < bonus_regions.length; z++) {
	  if (this.countries[i].region.indexOf(bonus_regions[z]) > -1) { bonus_region_applies = 1; }
	}
	
	if (bonus_region_applies == 1) {
	} else {
          this.countries[i].place = 0; 
	  let divname = '#'+i;
	  $(divname).off();
	}

      }
    }

    if (player == "ussr") {
      if (this.isControlled("us", i) == 1) {

	//
	// allow bonus regions to break control with bonuses
	//
	let bonus_region_applies = 0;
	for (let z = 0; z < bonus_regions.length; z++) {
	  if (this.countries[i].region.indexOf(bonus_regions[z]) > -1) { bonus_region_applies = 1; }
	}
	
	if (bonus_region_applies == 1) {
	} else {
          this.countries[i].place = 0; 
	  let divname = '#'+i;
	  $(divname).off();
	}

      }
    }
  }

}
Twilight.prototype.prePlayerPlaceInfluence = function prePlayerPlaceInfluence(player) {

  //
  // reset
  //
  for (var i in this.game.countries) { this.game.countries[i].place = 0; }

  //
  // ussr
  //
  if (player == "ussr") {

    this.game.countries['finland'].place = 1;
    this.game.countries['poland'].place = 1;
    this.game.countries['romania'].place = 1;
    this.game.countries['afghanistan'].place = 1;
    this.game.countries['northkorea'].place = 1;

    for (var i in this.game.countries) {
      if (this.game.countries[i].ussr > 0) {

	let place_in_country = 1;

        //
        // skip argentina if only has 1 and ironlady_before_ops
        //
	if (this.game.state.ironlady_before_ops == 1 && this.game.countries['argentina'].ussr == 1 && i === "argentina") { place_in_country = 0; }

	this.game.countries[i].place = place_in_country;

	if (place_in_country == 1) {
          for (let n = 0; n < this.game.countries[i].neighbours.length; n++) {
            let j = this.game.countries[i].neighbours[n];
	    this.game.countries[j].place = 1;
          }
	}

      }
    }
  }

  //
  // us
  //
  if (player == "us") {

    this.game.countries['canada'].place = 1;
    this.game.countries['mexico'].place = 1;
    this.game.countries['cuba'].place = 1;
    this.game.countries['japan'].place = 1;

    for (var i in this.game.countries) {
      if (this.game.countries[i].us > 0) {
	this.game.countries[i].place = 1;
        for (let n = 0; n < this.game.countries[i].neighbours.length; n++) {
          let j = this.game.countries[i].neighbours[n];
	  this.game.countries[j].place = 1;
        }
      }
    }
  }

}
Twilight.prototype.playerPlaceInitialInfluence = function playerPlaceInitialInfluence(player) {

  let twilight_self = this;

  if (player == "ussr") {

    twilight_self.addMove("RESOLVE");

    let x = "You are the USSR. Place six additional influence in Eastern Europe.<p></p>[cards: ";
    for (let i = 0; i < this.game.deck[0].hand.length; i++) {
      if (i > 0) { x += ", "; }
console.log(this.game.deck[0].hand[i]);
      x += '<div class="showcard inline" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name.toLowerCase()+'</div>';
    }
    x += ']';
    this.updateStatus(x);


    $('.showcard').off();
    $('.showcard').mouseover(function() {
      let card = $(this).attr("id");
      twilight_self.showCard(card);
    }).mouseout(function() {
      let card = $(this).attr("id");
      twilight_self.hideCard(card);
    });


    var placeable = [];
    placeable.push("finland");
    placeable.push("eastgermany");
    placeable.push("poland");
    placeable.push("austria");
    placeable.push("czechoslovakia");
    placeable.push("hungary");
    placeable.push("romania");
    placeable.push("yugoslavia");
    placeable.push("bulgaria");

    let ops_to_place = 6;

    for (let i = 0; i < placeable.length; i++) {

      this.game.countries[placeable[i]].place = 1;

      let divname = "#"+placeable[i];

      $(divname).off();
      $(divname).on('click', function() {

	let countryname = $(this).attr('id');

        if (twilight_self.countries[countryname].place == 1) {
          twilight_self.addMove("place\tussr\tussr\t"+countryname+"\t1");
          twilight_self.placeInfluence(countryname, 1, "ussr");
	  ops_to_place--;

          if (ops_to_place == 0) {
	    twilight_self.playerFinishedPlacingInfluence();
	    twilight_self.game.state.placement = 1;
	    twilight_self.endTurn();
	  }
        } else {
          alert("you cannot place there...: " + j + " influence left");
        }
      });
    }
  }


  if (player == "us") {

    twilight_self.addMove("RESOLVE");

    let x = "You are the US. Place seven additional influence in Western Europe.<p></p>[cards: ";
    for (i = 0; i < this.game.deck[0].hand.length; i++) {
      if (i > 0) { x += ", "; }
      x += '<div class="inline showcard" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name.toLowerCase()+'</div>';
    }
    x += ']';
    this.updateStatus(x);

    $('.showcard').off();
    $('.showcard').mouseover(function() {
      let card = $(this).attr("id");
      twilight_self.showCard(card);
    }).mouseout(function() {
      let card = $(this).attr("id");
      twilight_self.hideCard(card);
    });

    var placeable = [];

    placeable.push("canada");
    placeable.push("uk");
    placeable.push("benelux");
    placeable.push("france");
    placeable.push("italy");
    placeable.push("westgermany");
    placeable.push("greece");
    placeable.push("spain");
    placeable.push("turkey");
    placeable.push("austria");
    placeable.push("norway");
    placeable.push("denmark");
    placeable.push("sweden");
    placeable.push("finland");

    var ops_to_place = 7;

    for (let i = 0; i < placeable.length; i++) {
      this.game.countries[placeable[i]].place = 1;

      let divname = "#"+placeable[i];

      $(divname).off();
      $(divname).on('click', function() {

	let countryname = $(this).attr('id');

        if (twilight_self.countries[countryname].place == 1) {
          twilight_self.addMove("place\tus\tus\t"+countryname+"\t1");
          twilight_self.placeInfluence(countryname, 1, "us");
          ops_to_place--;

          if (ops_to_place == 0) {
            twilight_self.playerFinishedPlacingInfluence();
            twilight_self.game.state.placement = 1;
            twilight_self.endTurn();
          }
        } else {
          alert("you cannot place there...: " + j + " influence left");
        }
      });
    }
  }
}


Twilight.prototype.playerPlaceBonusInfluence = function playerPlaceBonusInfluence(player, bonus) {

  let twilight_self = this;

  if (player == "ussr") {

    twilight_self.addMove("RESOLVE");

    let x = "You are the USSR. Place "+bonus+" additional influence in countries with existing Soviet influence.<p></p>[cards: ";
    for (let i = 0; i < this.game.deck[0].hand.length; i++) {
      if (i > 0) { x += ", "; }
      x += '<div class="showcard inline" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name.toLowerCase()+'</div>';
    }
    x += ']';
    this.updateStatus(x);


    $('.showcard').off();
    $('.showcard').mouseover(function() {
      let card = $(this).attr("id");
      twilight_self.showCard(card);
    }).mouseout(function() {
      let card = $(this).attr("id");
      twilight_self.hideCard(card);
    });

    let ops_to_place = bonus;

    for (var i in this.game.countries) {
      if (this.game.countries[i].ussr > 0) {

        let countryname  = i;
        let divname      = '#'+i;

        $(divname).off();
        $(divname).on('click', function() {

	  let countryname = $(this).attr('id');

          twilight_self.addMove("place\tussr\tussr\t"+countryname+"\t1");
          twilight_self.placeInfluence(countryname, 1, "ussr");
	  ops_to_place--;

          if (ops_to_place == 0) {
	    twilight_self.playerFinishedPlacingInfluence();
	    twilight_self.game.state.placement = 1;
	    twilight_self.endTurn();
	  }
        });
      }
    }
  }



  if (player == "us") {

    twilight_self.addMove("RESOLVE");

    let x = "You are the US. Place "+bonus+" additional influence in countries with existing US influence.<p></p>[cards: ";
    for (let i = 0; i < this.game.deck[0].hand.length; i++) {
      if (i > 0) { x += ", "; }
      x += '<div class="showcard inline" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name.toLowerCase()+'</div>';
    }
    x += ']';
    this.updateStatus(x);


    $('.showcard').off();
    $('.showcard').mouseover(function() {
      let card = $(this).attr("id");
      twilight_self.showCard(card);
    }).mouseout(function() {
      let card = $(this).attr("id");
      twilight_self.hideCard(card);
    });

    let ops_to_place = bonus;

    for (var i in this.game.countries) {
      if (this.game.countries[i].us > 0) {

        let countryname  = i;
        let divname      = '#'+i;

        $(divname).off();
        $(divname).on('click', function() {

	  let countryname = $(this).attr('id');

          twilight_self.addMove("place\tus\tus\t"+countryname+"\t1");
          twilight_self.placeInfluence(countryname, 1, "us");
	  ops_to_place--;

          if (ops_to_place == 0) {
	    twilight_self.playerFinishedPlacingInfluence();
	    twilight_self.game.state.placement = 1;
	    twilight_self.endTurn();
	  }
        });
      }
    }
  }
}









/////////////////////
// PLACE INFLUENCE //
/////////////////////
Twilight.prototype.removeCardFromHand = function removeCardFromHand(card) {

  for (i = 0; i < this.game.deck[0].hand.length; i++) {
    if (this.game.deck[0].hand[i] == card) {
      this.game.deck[0].hand.splice(i, 1);
    }
  }

}
Twilight.prototype.removeInfluence = function removeInfluence(country, inf, player, mycallback=null) {

  if (player == "us") {
    this.countries[country].us = parseInt(this.countries[country].us) - parseInt(inf);  
    if (this.countries[country].us < 0) { this.countries[country].us = 0; };  
    this.showInfluence(country, "ussr");
  } else {
    this.countries[country].ussr = parseInt(this.countries[country].ussr) - parseInt(inf);  
    if (this.countries[country].ussr < 0) { this.countries[country].ussr = 0; };  
    this.showInfluence(country, "us");
  }

  this.updateLog(player.toUpperCase() + " removes " + inf + " from " + this.countries[country].name);

  this.showInfluence(country, player, mycallback);

}
Twilight.prototype.placeInfluence = function placeInfluence(country, inf, player, mycallback=null) {

  if (player == "us") {
    this.countries[country].us = parseInt(this.countries[country].us) + parseInt(inf);  
  } else {
    this.countries[country].ussr = parseInt(this.countries[country].ussr) + parseInt(inf);  
  }

  this.updateLog(player.toUpperCase() + " places " + inf + " in " + this.countries[country].name);

  this.showInfluence(country, player, mycallback);

}
Twilight.prototype.showInfluence = function showInfluence(country, player, mycallback=null) {

  let obj_us    = "#"+country+ " > .us";
  let obj_ussr = "#"+country+ " > .ussr";

  let us_i   = parseInt(this.countries[country].us);
  let ussr_i = parseInt(this.countries[country].ussr);

  let has_control = 0;

  if (player == "us") {
    let diff = us_i - ussr_i;
    if (diff > 0 && diff >= this.countries[country].control) {
      has_control = 1;
    }
  } else {
    let diff = ussr_i - us_i;
    if (diff > 0 && diff >= this.countries[country].control) {
      has_control = 1;
    }
  }


  //
  // update non-player if control broken
  //
  if (player == "us") {
    if (this.isControlled("ussr", country) == 0) {
      if (this.countries[country].ussr > 0) {
        $(obj_ussr).html('<div class="ussr_uncontrol">'+ussr_i+'</div>');
      }
    } else {
      if (this.isControlled("us", country) == 1) {
        $(obj_us).html('<div class="us_control">'+us_i+'</div>');
      }
    }
  } else {
    if (this.isControlled("us", country) == 0) {
      if (this.countries[country].us > 0) {
        $(obj_us).html('<div class="us_uncontrol">'+us_i+'</div>');
      }
    } else {
      if (this.isControlled("ussr", country) == 1) {
        $(obj_ussr).html('<div class="ussr_control">'+ussr_i+'</div>');
      }
    }
  }


  //
  // update HTML
  //
  if (has_control == 1) {
    if (player == "us") {
      $(obj_us).html('<div class="us_control">'+us_i+'</div>');
    } else {
      $(obj_ussr).html('<div class="ussr_control">'+ussr_i+'</div>');
    }
  } else {
    if (player == "us") {
      if (us_i == 0) {
        $(obj_us).html('');
      } else {
        $(obj_us).html('<div class="us_uncontrol">'+us_i+'</div>');
      }
    } else {
      if (ussr_i == 0) {
        $(obj_ussr).html('');
      } else {
        $(obj_ussr).html('<div class="ussr_uncontrol">'+ussr_i+'</div>');
      }
    }
  }

  $('.us_control').css('height', this.scale(100)+"px");
  $('.us_uncontrol').css('height', this.scale(100)+"px");
  $('.ussr_control').css('height', this.scale(100)+"px");
  $('.ussr_uncontrol').css('height', this.scale(100)+"px");

  $('.us_control').css('font-size', this.scale(100)+"px");
  $('.us_uncontrol').css('font-size', this.scale(100)+"px");
  $('.ussr_control').css('font-size', this.scale(100)+"px");
  $('.ussr_uncontrol').css('font-size', this.scale(100)+"px");

  //
  // adjust screen ratio
  //
  $('.country').css('width', this.scale(202)+"px");
  $('.us').css('width', this.scale(100)+"px");
  $('.ussr').css('width', this.scale(100)+"px");
  $('.us').css('height', this.scale(100)+"px");
  $('.ussr').css('height', this.scale(100)+"px");

  //
  // update game state
  //
  this.game.countries = this.countries;

  if (mycallback != null) { mycallback(); }

}








Twilight.prototype.prePlayerRealign = function prePlayerRealign(player, mycallback=null) {

}
Twilight.prototype.playerRealign = function playerRealign(player, card, mycallback=null) {

  // reset off
  this.playerFinishedPlacingInfluence();

  var twilight_self = this;
  var valid_target = 0;

  // all countries can be realigned
  for (var i in this.countries) {

    let countryname = i;

    valid_target = 1;     


    //
    // Can Only Realign Countries with Opponent Influence
    //
    if (twilight_self.game.player == 1) {
      if (twilight_self.countries[countryname].us < 1) {
        valid_target = 0;
      }
    } else {
      if (twilight_self.countries[countryname].ussr < 1) {
        valid_target = 0;
      }
    }


    //
    // Region Restrictions
    //
    if (twilight_self.game.state.limit_region.indexOf(twilight_self.countries[countryname].region) > -1) {
      valid_target = 0;
    }

    //
    // DEFCON restrictions
    //
    if (twilight_self.game.state.limit_ignoredefcon == 0) {
      if (twilight_self.countries[countryname].region == "europe" && twilight_self.game.state.defcon < 5) {
        valid_target = 0;
      }
      if (twilight_self.countries[countryname].region == "asia" && twilight_self.game.state.defcon < 4) {
        valid_target = 0;
      }
      if (twilight_self.countries[countryname].region == "seasia" && twilight_self.game.state.defcon < 4) {
        valid_target = 0;
      }
      if (twilight_self.countries[countryname].region == "mideast" && twilight_self.game.state.defcon < 3) {
        valid_target = 0;
      }
    }

    //
    // Junta
    //
    if (card == "junta" && (this.countries[i].region != "camerica" && this.countries[i].region != "samerica")) {
      valid_target = 0;
    }

    let divname      = '#'+i;

    if (valid_target == 1) {

      $(divname).off();
      $(divname).on('click', function() {

        let c = $(this).attr('id');

        //
        // US / Japan Alliance
        //
        if (twilight_self.game.state.events.usjapan == 1 && c == "japan" && this.game.player == 1) {
          alert("US / Japan Alliance prevents realignments in Japan");
          valid_target = 0;
        }

        //
        // vietnam revolts and china card bonuses
        //
        if (twilight_self.countries[c].region !== "seasia") { twilight_self.game.state.events.vietnam_revolts_eligible = 0; }
        if (twilight_self.countries[c].region !== "seasia" && twilight_self.countries[c].region !== "asia") { twilight_self.game.state.events.china_card_eligible = 0; }

        var result = twilight_self.playRealign(c);
        twilight_self.addMove("realign\t"+player+"\t"+c);
	mycallback();
      });

    } else {

      $(divname).off();
      $(divname).on('click', function() {
        alert("Invalid Target");
      });

    }
  }
}
Twilight.prototype.playerPlaceInfluence = function playerPlaceInfluence(player, mycallback=null) {

  // reset off
  this.playerFinishedPlacingInfluence();

  var twilight_self = this;

  for (var i in this.countries) {
      
    let countryname  = i;
    let divname      = '#'+i;

    let restricted_country = 0;

    //
    // Chernobyl
    //
    if (this.game.player == 1 && this.game.state.events.chernobyl != "") {
      if (this.countries[i].region == this.game.state.events.chernobyl) { restricted_country = 1; }
    }

    if (this.game.state.limit_region.indexOf(this.countries[i].region) > -1) { restricted_country = 1; }

    if (restricted_country == 1) {
      $(divname).off();
      $(divname).on('click', function() {
	alert("Invalid Target");
      });
    } else {

    if (player == "us") {
      $(divname).off();
      $(divname).on('click', function() {

        let countryname = $(this).attr('id');

        if (twilight_self.countries[countryname].place == 1) {
	
	  //
	  // vietnam revolts and china card
	  //
	  if (twilight_self.countries[countryname].region !== "seasia") { twilight_self.game.state.events.vietnam_revolts_eligible = 0; }
	  if (twilight_self.countries[countryname].region.indexOf("asia") < 0) { twilight_self.game.state.events.china_card_eligible = 0; }
 
          if (twilight_self.isControlled("ussr", countryname) == 1) { twilight_self.game.break_control = 1; }

	  //
	  // permit cuban missile crisis removal after placement
	  //
	  if (twilight_self.game.state.events.cubanmissilecrisis == 2) {
	    if (countryname === "turkey" || countryname === "westgermany") {
	      if (twilight_self.countries[countryname].us >= 1) {

		//
		// allow player to remove CMC
		//
	        if (twilight_self.app.BROWSER == 1) {

		  let removeinf = confirm("You are placing 1 influence in "+twilight_self.countries[countryname].name+". Once this is done, do you want to cancel the Cuban Missile Crisis by removing 2 influence in "+twilight_self.countries[countryname].name+"?");
	          if (removeinf) {

	            if (countryname === "turkey") {
            	      twilight_self.removeInfluence("turkey", 2, "us");
            	      twilight_self.addMove("remove\tus\tus\tturkey\t2");
                      twilight_self.addMove("unlimit\tcmc");
                      twilight_self.addMove("notify\tUS has cancelled the Cuban Missile Crisis");
	            }
	            if (countryname === "westgermany") {
                      twilight_self.removeInfluence("westgermany", 2, "us");
                      twilight_self.addMove("remove\tus\tus\twestgermany\t2");
                      twilight_self.addMove("unlimit\tcmc");
                      twilight_self.addMove("notify\tUS has cancelled the Cuban Missile Crisis");
	            }
		  }
		}
	      }
	    }
	  }

	  twilight_self.addMove("place\tus\tus\t"+countryname+"\t1");
          twilight_self.placeInfluence(countryname, 1, "us", mycallback);

	} else {
	  alert("you cannot place there...");
	  return;
	}
      });
    } else {
      $(divname).off();
      $(divname).on('click', function() {

        let countryname = $(this).attr('id');

        if (twilight_self.countries[countryname].place == 1) {

	  //
	  // vietnam revolts and china card
	  //
	  if (twilight_self.countries[countryname].region !== "seasia") { twilight_self.game.state.events.vietnam_revolts_eligible = 0; }
	  if (twilight_self.countries[countryname].region.indexOf("asia") < 0) { twilight_self.game.state.events.china_card_eligible = 0; }
          if (twilight_self.isControlled("us", countryname) == 1) { twilight_self.game.break_control = 1; }

	  //
	  // permit cuban missile crisis removal after placement
	  //
	  if (twilight_self.game.state.events.cubanmissilecrisis == 1) {
	    if (countryname === "cuba") {
	      if (twilight_self.countries[countryname].ussr >= 1) {

		//
		// allow player to remove CMC
		//
	        if (twilight_self.app.BROWSER == 1) {

		  let removeinf = confirm("You are placing 1 influence in "+twilight_self.countries[countryname].name+". Once this is done, do you want to cancel the Cuban Missile Crisis by removing 2 influence in "+twilight_self.countries[countryname].name+"?");
	          if (removeinf) {

	            if (countryname === "cuba") {
            	      twilight_self.removeInfluence("cuba", 2, "ussr");
            	      twilight_self.addMove("remove\tussr\tussr\tcuba\t2");
                      twilight_self.addMove("unlimit\tcmc");
                      twilight_self.addMove("notify\tUSSR has cancelled the Cuban Missile Crisis");
	            }
		  }
		}
	      }
	    }
	  }

	  twilight_self.addMove("place\tussr\tussr\t"+countryname+"\t1");
          twilight_self.placeInfluence(countryname, 1, "ussr", mycallback);
	} else {
	  alert("Invalid Target");
	  return;
	}
      });


    } // NON RESTRICTED COUNTRY
    }
  }

}
Twilight.prototype.playerFinishedPlacingInfluence = function playerFinishedPlacingInfluence(player, mycallback=null) {

  for (var i in this.countries) {
    let divname      = '#'+i;
    $(divname).off();
  }

  if (mycallback != null) { mycallback(); }

}
Twilight.prototype.playerSpaceCard = function playerSpaceCard(card, player) {

  if (player == "ussr") {
    this.game.state.space_race_ussr_counter++;
  } else {
    this.game.state.space_race_us_counter++;
  }

  let roll = this.rollDice(6);

  let successful     = 0;
  let next_box       = 1;

  if (player == "ussr") { next_box = this.game.state.space_race_ussr+1; }
  if (player == "us") { next_box = this.game.state.space_race_us+1; }

  if (next_box == 1) { if (roll < 4) { successful = 1; } }
  if (next_box == 2) { if (roll < 5) { successful = 1; } }
  if (next_box == 3) { if (roll < 4) { successful = 1; } }
  if (next_box == 4) { if (roll < 5) { successful = 1; } }
  if (next_box == 5) { if (roll < 4) { successful = 1; } }
  if (next_box == 6) { if (roll < 5) { successful = 1; } }
  if (next_box == 7) { if (roll < 4) { successful = 1; } }
  if (next_box == 8) { if (roll < 2) { successful = 1; } }

  this.updateLog(player.toUpperCase() + " attempts space race (rolls " + roll + ")");  

  if (successful == 1) { 
    this.updateLog(player.toUpperCase() + " advances in the Space Race");
    this.advanceSpaceRace(player); 
  } else {
    this.updateLog(player.toUpperCase() + " fails in the Space Race");
  }

}




///////////
// COUPS //
///////////
Twilight.prototype.playerCoupCountry = function playerCoupCountry(player,  ops, card) {

  var twilight_self = this;

  for (var i in this.countries) {
      
    let countryname  = i;
    let divname      = '#'+i;

    $(divname).off();
    $(divname).on('click', function() {

      let valid_target = 0;
      let countryname = $(this).attr('id');

      //
      // sanity DEFCON check
      //
      if (twilight_self.game.state.defcon == 2 && twilight_self.game.countries[countryname].bg == 1) {
	if (confirm("Are you sure you wish to coup a Battleground State? (DEFCON is 2)")) {
	} else {
	  twilight_self.playOps(player, ops, card);
	  return;
	}
      } 

      if (player == "us") {
        if (twilight_self.countries[countryname].ussr <= 0) { alert("Cannot Coup"); } else { valid_target = 1; }
      } else {
        if (twilight_self.countries[countryname].us <= 0)   { alert("Cannot Coup"); } else { valid_target = 1; }
      }

      //
      // Coup Restrictions
      //
      if (twilight_self.game.state.events.usjapan == 1 && countryname == "japan") {
        alert("US / Japan Alliance prevents coups in Japan");
        valid_target = 0;
      }
      if (twilight_self.game.state.limit_ignoredefcon == 0) {
        if (twilight_self.game.state.limit_region.indexOf(twilight_self.countries[countryname].region) > -1) {
          alert("Invalid Region for this Coup");
          valid_target = 0;
        }
        if (twilight_self.countries[countryname].region == "europe" && twilight_self.game.state.defcon < 5) {
          alert("DEFCON prevents coups in Europe");
          valid_target = 0;
        }
        if (twilight_self.countries[countryname].region == "asia" && twilight_self.game.state.defcon < 4) {
          alert("DEFCON prevents coups in Asia");
          valid_target = 0;
        }
        if (twilight_self.countries[countryname].region == "seasia" && twilight_self.game.state.defcon < 4) {
          alert("DEFCON prevents coups in Asia");
          valid_target = 0;
        }
        if (twilight_self.countries[countryname].region == "mideast" && twilight_self.game.state.defcon < 3) {
          alert("DEFCON prevents coups in the Middle-East");
          valid_target = 0;
        }
      }
      if (valid_target == 1 && twilight_self.countries[countryname].region == "europe" && twilight_self.game.state.events.nato == 1) {
	if (twilight_self.isControlled("us", countryname) == 1) {
	  if ( (countryname == "westgermany" && twilight_self.game.state.events.nato_westgermany == 0) || (countryname == "france" && twilight_self.game.state.events.nato_france == 0) ) {} else {
	    alert("NATO prevents coups of US-controlled countries in Europe");
	    valid_target = 0;
	  }
        }
      }

      if (valid_target == 1) {

        //
        // china card regional bonuses
        //
        if (card == "china" && (twilight_self.game.countries[countryname].region == "asia" || twilight_self.game.countries[countryname].region == "seasia")) { 
          twilight_self.updateLog("China bonus OP added to Asia coup...");
          ops++;
        }
        if (player == "ussr" && twilight_self.game.state.events.vietnam_revolts == 1 && twilight_self.game.countries[countryname].region == "seasia") { 
          twilight_self.updateLog("Vietnam Revolts bonus OP added to Southeast Asia coup...");
          ops++; 
        }

	alert("Coup launched in " + twilight_self.game.countries[countryname].name);
        twilight_self.addMove("coup\t"+player+"\t"+countryname+"\t"+ops);
        twilight_self.endTurn();
      }

    });
  }
}


Twilight.prototype.playCoup = function playCoup(player, countryname, ops, mycallback=null) {

  let roll    = this.rollDice(6);

  //
  // Yuri and Samantha
  //
  if (this.game.state.events.yuri == 1) {
    this.game.state.vp -= 1;
    this.updateVictoryPoints();
    this.updateLog("USSR gains 1 VP from Yuri and Samantha");
  }

  //
  // Salt Negotiations
  //
  if (this.game.state.events.saltnegotiations == 1) { 
    this.updateLog("Salt Negotiations -1 modifier on coups");
    roll--; 
  }


  //
  // Latin American Death Squads
  //
  if (this.game.state.events.deathsquads != 0) {
    if (this.game.state.events.deathsquads == 1) {
      if (this.countries[countryname].region == "camerica" || this.countries[countryname].region == "samerica") {
        if (player == "ussr") { 
          this.updateLog("USSR gets +1 coup bonus");
          this.updateLog("Latin American Death Squads trigger");
          roll++;
        }
      }
      if (player == "us")   { 
	this.updateLog("US gets -1 coup penalty");
        this.updateLog("Latin American Death Squads trigger");
	roll--; 
      }
    }
    if (this.game.state.events.deathsquads == 2) {
      if (player == "ussr") { 
	this.updateLog("USSR gets -1 coup penalty");
        this.updateLog("Latin American Death Squads trigger");
	roll--;
      }
      if (this.countries[countryname].region == "camerica" || this.countries[countryname].region == "samerica") {
        if (player == "us")   { 
	  this.updateLog("US gets +1 coup bonus");
          this.updateLog("Latin American Death Squads trigger");
	  roll++;
        }
      }
    }
  }



  let control = this.countries[countryname].control;
  let winning = parseInt(roll) + parseInt(ops) - parseInt(control * 2);

  //
  // Cuban Missile Crisis
  //
  if (player == "ussr" && this.game.state.events.cubanmissilecrisis == 1) {
    this.endGame("us","Cuban Missile Crisis");
  }
  if (player == "us" && this.game.state.events.cubanmissilecrisis == 2) {
    this.endGame("ussr","Cuban Missile Crisis");
  }


  if (this.countries[countryname].bg == 1) { 
    
    //
    // Nuclear Submarines
    //
    if (player == "us" && this.game.state.events.nuclearsubs == 1) {} else {
      this.lowerDefcon(); 
    }
  }

  if (winning > 0) {

    if (this.browser_active == 1) {
      alert("COUP SUCCEEDED: " + player.toUpperCase() + " rolls " + roll);
    }

    this.updateLog(player.toUpperCase() + " rolls " + roll);

    while (winning > 0) {

      if (player == "us") {

        if (this.countries[countryname].ussr > 0) {
          this.removeInfluence(countryname, 1, "ussr");
        } else {
          this.placeInfluence(countryname, 1, "us");
        }
      }

      if (player == "ussr") {
        if (this.countries[countryname].us > 0) {
          this.removeInfluence(countryname, 1, "us");
        } else {
          this.placeInfluence(countryname, 1, "ussr");
        }
      }
      winning--;

    }
  } else {
    if (this.browser_active == 1) {
      this.updateLog(player.toUpperCase() + " rolls " + roll + " (no change)");
      alert("COUP FAILED: " + player.toUpperCase() + " rolls " + roll);
    }
  }


  //
  // update country
  //
  this.showInfluence(countryname, player);

  if (mycallback != null) {
    mycallback();
  }

  return;
}
Twilight.prototype.playRealign = function playRealign(country) {

  let outcome_determined = 0;

  while (outcome_determined == 0) {

    let bonus_us = 0;
    let bonus_ussr = 0;

    if (this.countries[country].us > this.countries[country].ussr) {
      bonus_us++;
    }
    if (this.countries[country].ussr > this.countries[country].us) {
      bonus_ussr++;
    }
    for (let z = 0; z < this.countries[country].neighbours.length; z++) {
      let racn = this.countries[country].neighbours[z];
      if (this.isControlled("us", racn) == 1) {
        bonus_us++;
      }
      if (this.isControlled("ussr", racn) == 1) {
        bonus_ussr++;
      }
    }
  
    //
    // handle adjacent influence
    //
    if (country === "mexico") { bonus_us++; }
    if (country === "cuba")   { bonus_us++; }
    if (country === "japan")  { bonus_us++; }
    if (country === "canada") { bonus_us++; }
    if (country === "finland") { bonus_ussr++; }
    if (country === "romania") { bonus_ussr++; }
    if (country === "afghanistan") { bonus_ussr++; }
    if (country === "northkorea") { bonus_ussr++; }


    //
    // Iran-Contra Scandal
    //
    if (this.game.state.events.irancontra == 1) {
      this.updateLog("Iran-Contra Scandal -1 modification on US roll");
      bonus_us--;
    }

    let roll_us   = this.rollDice(6);
    let roll_ussr = this.rollDice(6);

    this.updateLog("US bonus " + bonus_us + " vs. USSR bonus " + bonus_ussr);
    this.updateLog("US roll " + roll_us + " vs. USSR roll " + roll_ussr);

    roll_us   = roll_us + bonus_us;
    roll_ussr = roll_ussr + bonus_ussr;

    if (roll_us > roll_ussr) {
      outcome_determined = 1;
      let diff = roll_us - roll_ussr;
      if (this.countries[country].ussr > 0) {
	if (this.countries[country].ussr < diff) {
	  diff = this.countries[country].ussr;
	}
        this.removeInfluence(country, diff, "ussr");
      }
    }
    if (roll_us < roll_ussr) {
      outcome_determined = 1;
      let diff = roll_ussr - roll_us;
      if (this.countries[country].us > 0) {
	if (this.countries[country].us < diff) {
	  diff = this.countries[country].us;
	}
        this.removeInfluence(country, diff, "us");
      }
    }
    if (roll_us === roll_ussr) {
      outcome_determined = 1;
    } 
  }

  this.showInfluence(country, "us");
  this.showInfluence(country, "ussr");

}








///////////////////////
// Twilight Specific //
///////////////////////
Twilight.prototype.addMove = function addMove(mv) {
  this.moves.push(mv);
}

Twilight.prototype.endTurn = function endTurn(nextTarget=0) {

  this.updateStatus("Waiting for information from peers....");
  
  //
  // remove events from board to prevent "Doug Corley" gameplay
  //
  $(".card").off();
  $(".country").off();

  //
  // we will bury you scores first!
  //
  if (this.game.state.events.wwby_triggers == 1) {
    this.addMove("notify\tWe Will Bury You triggers +3 VP for USSR");
    this.addMove("vp\tussr\t3");
    this.game.state.events.wwby_triggers = 0;
  }

  let cards_in_hand = this.game.deck[0].hand.length;
  for (let z = 0; z < this.game.deck[0].hand.length; z++) {
    if (this.game.deck[0].hand[z] == "china") {
      cards_in_hand--;
    }
  }

  let extra = {};
      extra.target = this.returnNextPlayer(this.game.player);
      extra.cards_in_hand = cards_in_hand;

  if (nextTarget != 0) { extra.target = nextTarget; }
  this.game.turn = this.moves;
  this.moves = [];
  this.sendMessage("game", extra);

}
Twilight.prototype.endGame = function endGame(winner, method) {

  this.game.over = 1;
  if (winner == "us") { this.game.winner = 2; }
  if (winner == "ussr") { this.game.winner = 1; }

  if (this.browser_active == 1) {
    alert("The Game is Over - " + winner.toUpperCase() + " wins by " + method);
    this.updateStatus("Game Over: " + winner.toUpperCase() + " wins by " + method);
  }
}


Twilight.prototype.endRound = function endRound() {

  this.game.state.round++;
  this.game.state.turn 		= 0;
  this.game.state.turn_in_round = 0;
  this.game.state.move 		= 0;

  // 
  // game over if scoring card is held
  //
  if (this.game.state.round > 1) {
    for (let i = 0 ; i < this.game.deck[0].hand.length; i++) {
      if (this.game.deck[0].cards[this.game.deck[0].hand[i]].scoring == 1) {
	let player = "us";
	let winner = "ussr";
	if (this.game.player == 1) { player = "ussr"; winner = "us"; }
	this.resignGame(player.toUpperCase() + " held scoring card");
	this.endGame(winner, "opponent held scoring card");
      }
    }
  }


  //
  // calculate milops
  //
  if (this.game.state.round > 1) {
    let milops_needed = this.game.state.defcon;
    let ussr_milops_deficit = (this.game.state.defcon-this.game.state.milops_ussr);
    let us_milops_deficit = (this.game.state.defcon-this.game.state.milops_us);

    if (ussr_milops_deficit > 0) {
      this.game.state.vp += ussr_milops_deficit;
      this.updateLog("USSR penalized " + ussr_milops_deficit + " VP (milops)");
    }
    if (us_milops_deficit > 0) {
      this.game.state.vp -= us_milops_deficit;
      this.updateLog("US penalized " + us_milops_deficit + " VP (milops)");
    }
  }

  this.game.state.us_defcon_bonus = 0;

  this.game.state.milops_us = 0;
  this.game.state.milops_ussr = 0;

  this.game.state.space_race_us_counter = 0;
  this.game.state.space_race_ussr_counter = 0;
  this.game.state.eagle_has_landed_bonus_taken = 0;
  this.game.state.space_shuttle_bonus_taken = 0;

  // set to 1 when ironlady events before ops played (by ussr - limits placement to rules)
  this.game.state.ironlady_before_ops = 0;

  this.game.state.events.wwby_triggers = 0;
  this.game.state.events.region_bonus = "";
  this.game.state.events.u2 = 0;
  this.game.state.events.containment = 0;
  this.game.state.events.brezhnev = 0;
  this.game.state.events.redscare_player1 = 0;
  this.game.state.events.redscare_player2 = 0;
  this.game.state.events.vietnam_revolts = 0;
  this.game.state.events.vietnam_revolts_eligible = 0;
  this.game.state.events.deathsquads = 0;
  this.game.state.events.missileenvy = 0;
  this.game.state.events.cubanmissilecrisis = 0;
  this.game.state.events.nuclearsubs = 0;
  this.game.state.events.saltnegotiations = 0;
  this.game.state.events.northseaoil_bonus = 0;
  this.game.state.events.yuri = 0;
  this.game.state.events.irancontra = 0;
  this.game.state.events.chernobyl = "";
  this.game.state.events.aldrich = 0;

  //
  // increase DEFCON by one
  //
  this.game.state.defcon++;
  if (this.game.state.defcon > 5) { this.game.state.defcon = 5; }
  this.game.state.ussr_milops = 0;
  this.game.state.us_milops = 0;


  this.updateDefcon();
  this.updateActionRound();
  this.updateSpaceRace();
  this.updateVictoryPoints();
  this.updateMilitaryOperations();
  this.updateRound();

  //
  // give me the china card if needed
  //
  let do_i_have_the_china_card = 0;
  for (let i = 0; i < this.game.deck[0].hand.length; i++) {
    if (this.game.deck[0].hand[i] == "china") {
      do_i_have_the_china_card = 1;
    }
  }
  if (do_i_have_the_china_card == 0) {
    if (this.game.player == 1) {
      if (this.game.state.events.china_card == 1) {
	if (!this.game.deck[0].hand.includes("china")) {
	  this.game.deck[0].hand.push("china");
	}
      }
    }
    if (this.game.player == 2) {
      if (this.game.state.events.china_card == 2) {
	if (!this.game.deck[0].hand.includes("china")) {
	  this.game.deck[0].hand.push("china");
	}
      }
    }
  }
  this.game.state.events.china_card = 0;
  this.game.state.events.china_card_eligible = 0;


}

Twilight.prototype.whoHasTheChinaCard = function whoHasTheChinaCard() {

  let do_i_have_the_china_card = 0;

  for (let i = 0; i < this.game.deck[0].hand.length; i++) {
    if (this.game.deck[0].hand[i] == "china") {
      do_i_have_the_china_card = 1;
    }
  }

  if (do_i_have_the_china_card == 0) {
    if (this.game.player == 1) {
      if (this.game.state.events.china_card == 1) {
	if (!this.game.deck[0].hand.includes("china")) {
	  return "us";
	} else {
	  return "ussr";
	}
      } else {
	if (do_i_have_the_china_card == 1) {
	  return "ussr";
	} else {
	  return "us";
	}
      }
    }
    if (this.game.player == 2) {
      if (this.game.state.events.china_card == 2) {
	if (!this.game.deck[0].hand.includes("china")) {
	  return "ussr";
	} else {
	  return "us";
	}
      } else {
	if (do_i_have_the_china_card == 1) {
	  return "us";
	} else {
	  return "ussr";
	}
      }
    }
  } else {
    if (this.game.player == 1) { return "ussr"; }
    if (this.game.player == 2) { return "us"; }
  }

  //
  // we should never hit this
  //

}




////////////////////
// Core Game Data //
////////////////////
Twilight.prototype.returnState = function returnState() {

  var state = {};

  state.dealt = 0;
  state.placement = 0;
  state.headline  = 0;
  state.headline1 = 0;
  state.headline2 = 0;
  state.headline3 = 0;
  state.headline4 = 0;
  state.headline5 = 0;
  state.headline_hash = "";
  state.headline_card = "";
  state.headline_xor = "";
  state.headline_opponent_hash = "";
  state.headline_opponent_card = "";
  state.headline_opponent_xor = "";
  state.round = 0;
  state.turn  = 0;
  state.turn_in_round = 0;
  state.broke_control = 0;
  state.us_efcon_bonus = 0;
  state.opponent_cards_in_hand = 0;
  state.event_before_ops = 0;
  state.event_name = "";

  state.vp_outstanding = 0; // vp not settled yet

  state.space_race_us = 0;
  state.space_race_ussr = 0;

  state.animal_in_space = "";
  state.man_in_earth_orbit = "";
  state.eagle_has_landed = "";
  state.eagle_has_landed_bonus_taken = 0;
  state.space_shuttle = "";
  state.space_shuttle_bonus_taken = 0;

  state.space_race_us_counter = 0;
  state.space_race_ussr_counter = 0;

  state.limit_coups = 0;
  state.limit_realignments = 0;
  state.limit_placement = 0;
  state.limit_spacerace = 0;
  state.limit_region = "";
  state.limit_ignoredefcon = 0;

  // track as US (+) and USSR (-)
  state.vp    = 0;

  state.ar_ps         = [];

  // relative --> top: 38px
  state.ar_ps[0]      = { top : 208 , left : 920 };
  state.ar_ps[1]      = { top : 208 , left : 1040 };
  state.ar_ps[2]      = { top : 208 , left : 1155 };
  state.ar_ps[3]      = { top : 208 , left : 1270 };
  state.ar_ps[4]      = { top : 208 , left : 1390 };
  state.ar_ps[5]      = { top : 208 , left : 1505 };
  state.ar_ps[6]      = { top : 208 , left : 1625 };
  state.ar_ps[7]      = { top : 208 , left : 1740 };

  state.vp_ps     = [];
  state.vp_ps[0]  = { top : 2460, left : 3040 };
  state.vp_ps[1]  = { top : 2460, left : 3300 };
  state.vp_ps[2]  = { top : 2460, left : 3435 };
  state.vp_ps[3]  = { top : 2460, left : 3570 };
  state.vp_ps[4]  = { top : 2460, left : 3705 };
  state.vp_ps[5]  = { top : 2460, left : 3840 };
  state.vp_ps[6]  = { top : 2460, left : 3975 };
  state.vp_ps[7]  = { top : 2460, left : 4110 };

  state.vp_ps[8]  = { top : 2600, left : 3035 };
  state.vp_ps[9]  = { top : 2600, left : 3170 };
  state.vp_ps[10]  = { top : 2600, left : 3305 };
  state.vp_ps[11]  = { top : 2600, left : 3435 };
  state.vp_ps[12]  = { top : 2600, left : 3570 };
  state.vp_ps[13]  = { top : 2600, left : 3705 };
  state.vp_ps[14]  = { top : 2600, left : 3840 };
  state.vp_ps[15]  = { top : 2600, left : 3975 };
  state.vp_ps[16]  = { top : 2600, left : 4110 };

  state.vp_ps[17]  = { top : 2740, left : 3035 };
  state.vp_ps[18]  = { top : 2740, left : 3170 };
  state.vp_ps[19]  = { top : 2740, left : 3305 };
  state.vp_ps[20]  = { top : 2740, left : 3570 };
  state.vp_ps[21]  = { top : 2740, left : 3840 };
  state.vp_ps[22]  = { top : 2740, left : 3975 };
  state.vp_ps[23]  = { top : 2740, left : 4110 };

  state.vp_ps[24]  = { top : 2880, left : 3035 };
  state.vp_ps[25]  = { top : 2880, left : 3170 };
  state.vp_ps[26]  = { top : 2880, left : 3305 };
  state.vp_ps[27]  = { top : 2880, left : 3435 };
  state.vp_ps[28]  = { top : 2880, left : 3570 };
  state.vp_ps[29]  = { top : 2880, left : 3705 };
  state.vp_ps[30]  = { top : 2880, left : 3840 };
  state.vp_ps[31]  = { top : 2880, left : 3975 };
  state.vp_ps[32]  = { top : 2880, left : 4110 };

  state.vp_ps[33]  = { top : 3025, left : 3035 };
  state.vp_ps[34]  = { top : 3025, left : 3170 };
  state.vp_ps[35]  = { top : 3025, left : 3305 };
  state.vp_ps[36]  = { top : 3025, left : 3435 };
  state.vp_ps[37]  = { top : 3025, left : 3570 };
  state.vp_ps[38]  = { top : 3025, left : 3705 };
  state.vp_ps[39]  = { top : 3025, left : 3840 };
  state.vp_ps[40]  = { top : 3025, left : 3975 };

  state.space_race_ps = [];
  state.space_race_ps[0] = { top : 510 , left : 3465 }  
  state.space_race_ps[1] = { top : 510 , left : 3638 }  
  state.space_race_ps[2] = { top : 510 , left : 3810 }  
  state.space_race_ps[3] = { top : 510 , left : 3980 }  
  state.space_race_ps[4] = { top : 510 , left : 4150 }  
  state.space_race_ps[5] = { top : 510 , left : 4320 }  
  state.space_race_ps[6] = { top : 510 , left : 4490 }  
  state.space_race_ps[7] = { top : 510 , left : 4660 }  
  state.space_race_ps[8] = { top : 510 , left : 4830 }  

  state.milops_us = 0;
  state.milops_ussr = 0;

  state.milops_ps    = [];
  state.milops_ps[0]  = { top : 2940 , left : 1520 };
  state.milops_ps[1]  = { top : 2940 , left : 1675 };
  state.milops_ps[2]  = { top : 2940 , left : 1830 };
  state.milops_ps[3]  = { top : 2940 , left : 1985 };
  state.milops_ps[4]  = { top : 2940 , left : 2150 };
  state.milops_ps[5]  = { top : 2940 , left : 2305 };

  state.defcon = 5;

  state.defcon_ps    = [];
  state.defcon_ps[0] = { top : 2585, left : 1520 };
  state.defcon_ps[1] = { top : 2585, left : 1675 };
  state.defcon_ps[2] = { top : 2585, left : 1830 };
  state.defcon_ps[3] = { top : 2585, left : 1985 };
  state.defcon_ps[4] = { top : 2585, left : 2140 };

  state.round_ps    = [];
  state.round_ps[0] = { top : 150, left : 3473 };
  state.round_ps[1] = { top : 150, left : 3627 };
  state.round_ps[2] = { top : 150, left : 3781 };
  state.round_ps[3] = { top : 150, left : 3935 };
  state.round_ps[4] = { top : 150, left : 4098 };
  state.round_ps[5] = { top : 150, left : 4252 };
  state.round_ps[6] = { top : 150, left : 4405 };
  state.round_ps[7] = { top : 150, left : 4560 };
  state.round_ps[8] = { top : 150, left : 4714 };
  state.round_ps[9] = { top : 150, left : 4868 };

  // events - early war
  state.events = {};
  state.events.formosan           = 0;
  state.events.redscare_player1   = 0;
  state.events.redscare_player2   = 0;
  state.events.containment        = 0;
  state.events.degaulle           = 0;
  state.events.nato               = 0;
  state.events.nato_westgermany   = 0;
  state.events.nato_france        = 0;
  state.events.marshall           = 0;
  state.events.warsawpact         = 0;
  state.events.unintervention     = 0;
  state.events.usjapan            = 0;
  state.events.norad              = 0;

  // regional bonus events
  state.events.vietnam_revolts = 0;
  state.events.vietnam_revolts_eligible = 0;
  state.events.china_card         = 0;
  state.events.china_card_in_play = 0;
  state.events.china_card_eligible = 0;

  // events - mid-war
  state.events.northseaoil        = 0;
  state.events.johnpaul           = 0;
  state.events.ourmanintehran     = 0;
  state.events.kitchendebates     = 0;
  state.events.brezhnev           = 0;
  state.events.wwby               = 0;
  state.events.wwby_triggers      = 0;
  state.events.willybrandt        = 0;
  state.events.shuttlediplomacy   = 0;
  state.events.deathsquads        = 0;
  state.events.campdavid          = 0;
  state.events.cubanmissilecrisis = 0;
  state.events.saltnegotiations   = 0;
  state.events.missileenvy        = 0; // tracks whether happening
  state.events.missile_envy       = 0; // to whom
  state.events.flowerpower        = 0;
  state.events.beartrap           = 0;
  state.events.quagmire           = 0;

  // events - late war
  state.events.awacs              = 0;
  state.events.starwars           = 0;
  state.events.teardown           = 0;
  state.events.iranianhostage     = 0;
  state.events.ironlady           = 0;
  state.events.reformer           = 0;
  state.events.northseaoil        = 0;
  state.events.northseaoil_bonus  = 0;
  state.events.evilempire         = 0;
  state.events.yuri               = 0;
  state.events.aldrich            = 0;

  return state;

}
Twilight.prototype.returnCountries = function returnCountries() {

  var countries = {};

  // EUROPE
  countries['canada'] = { top : 752, left : 842 , us : 2 , ussr : 0 , control : 4 , bg : 0 , neighbours : [ 'uk' ] , region : "europe" , name : "Canada" };
  countries['uk'] = { top : 572, left : 1690 , us : 5 , ussr : 0 , control : 5 , bg : 0 , neighbours : [ 'canada','norway','benelux','france' ] , region : "europe" , name : "UK" };
  countries['benelux'] = { top : 728, left : 1860 , us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'uk','westgermany' ] , region : "europe" , name : "Benelux" };
  countries['france'] = { top : 906, left : 1820 , us : 0 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'algeria', 'uk','italy','spain','westgermany' ] , region : "europe" , name : "France" };
  countries['italy'] = { top : 1036, left : 2114 , us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'spain','france','greece','austria','yugoslavia' ] , region : "europe" , name : "Italy" };
  countries['westgermany'] = { top : 728, left : 2078 , us : 0 , ussr : 0 , control : 4 , bg : 1 , neighbours : [ 'austria','france','benelux','denmark','eastgermany' ] , region : "europe" , name : "West Germany" };
  countries['eastgermany'] = { top : 580, left : 2156 , us : 0 , ussr : 3 , control : 3 , bg : 1 , neighbours : [ 'westgermany','poland','austria' ] , region : "europe" , name : "East Germany" };
  countries['poland'] = { top : 580, left : 2386 , us : 0 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'eastgermany','czechoslovakia' ] , region : "europe" , name : "Poland" };
  countries['spain'] = { top : 1118, left : 1660 , us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'morocco', 'france','italy' ] , region : "europe" , name : "Spain" };
  countries['greece'] = { top : 1200, left : 2392 , us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'italy','turkey','yugoslavia','bulgaria' ] , region : "europe" , name : "Greece" };
  countries['turkey'] = { top : 1056, left : 2788 , us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'syria', 'greece','romania','bulgaria' ] , region : "europe"  , name : "Turkey"};
  countries['yugoslavia'] = { top : 1038, left : 2342 , us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'italy','hungary','romania','greece' ] , region : "europe" , name : "Yugoslavia" };
  countries['bulgaria'] = { top : 1038, left : 2570 , us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'greece','turkey' ] , region : "europe" , name : "Bulgaria" };

  countries['romania'] = { top : 880, left : 2614 , us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'turkey','hungary','yugoslavia' ] , region : "europe" , name : "Romania" };
  countries['hungary'] = { top : 880, left : 2394 , us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'austria','czechoslovakia','romania','yugoslavia' ] , region : "europe" , name : "Hungary" };
  countries['austria'] = { top : 880, left : 2172 , us : 0 , ussr : 0 , control : 4 , bg : 0 , neighbours : [ 'hungary','italy','westgermany','eastgermany' ] , region : "europe" , name : "Austria" };
  countries['czechoslovakia'] = { top : 728, left : 2346 , us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'hungary','poland','eastgermany' ] , region : "europe" , name : "Czechoslovakia" };
  countries['denmark'] = { top : 432, left : 1982 , us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'sweden','westgermany' ] , region : "europe" , name : "Denmark" };
  countries['norway'] = { top : 278, left : 1932 , us : 0 , ussr : 0 , control : 4 , bg : 0 , neighbours : [ 'uk','sweden' ] , region : "europe" , name : "Norway" };
  countries['finland'] = { top : 286, left : 2522 , us : 0 , ussr : 1 , control : 4 , bg : 0 , neighbours : [ 'sweden' ] , region : "europe" , name : "Finland" };
  countries['sweden'] = { top : 410, left : 2234 , us : 0 , ussr : 0 , control : 4 , bg : 0 , neighbours : [ 'finland','denmark','norway' ] , region : "europe" , name : "Sweden" };

  // MIDDLE EAST
  countries['libya'] = { top : 1490, left : 2290, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'egypt','tunisia' ] , region : "mideast" , name : "Libya" };
  countries['egypt'] = { top : 1510, left : 2520, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'libya','sudan','israel' ], region : "mideast"  , name : "Egypt"};
  countries['lebanon'] = { top : 1205, left : 2660, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'syria','jordan','israel' ], region : "mideast"  , name : "Lebanon"};
  countries['syria'] = { top : 1205, left : 2870, us : 0 , ussr : 1 , control : 2 , bg : 0 , neighbours : [ 'lebanon','turkey','israel' ], region : "mideast"  , name : "Syria"};
  countries['israel'] = { top : 1350, left : 2620, us : 1 , ussr : 0 , control : 4 , bg : 1 , neighbours : [ 'egypt','jordan','lebanon','syria' ], region : "mideast" , name : "Israel" };
  countries['iraq'] = { top : 1350, left : 2870, us : 0 , ussr : 1 , control : 3 , bg : 1 , neighbours : [ 'jordan','iran','gulfstates','saudiarabia' ], region : "mideast" , name : "Iraq" };
  countries['iran'] = { top : 1350, left : 3082, us : 1 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'iraq','afghanistan','pakistan' ], region : "mideast" , name : "Iran" };
  countries['jordan'] = { top : 1500, left : 2760, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'israel','lebanon','iraq','saudiarabia' ], region : "mideast" , name : "Jordan" };
  countries['gulfstates'] = { top : 1500, left : 3010, us : 0 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'iraq','saudiarabia' ], region : "mideast" , name : "Gulf States" };
  countries['saudiarabia'] = { top : 1650, left : 2950, us : 0 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'jordan','iraq','gulfstates' ], region : "mideast" , name : "Saudi Arabia" };

  // ASIA
  countries['afghanistan'] = { top : 1250, left : 3345, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'iran','pakistan' ], region : "asia" , name : "Afghanistan" };
  countries['pakistan'] = { top : 1450, left : 3345, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'iran','afghanistan','india' ], region : "asia" , name : "Pakistan"}
  countries['india'] = { top : 1552, left : 3585, us : 0 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'pakistan','burma' ], region : "asia" , name : "India"};
  countries['burma'] = { top : 1580, left : 3855, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'india','laos' ], region : "seasia" , name : "Burma"};
  countries['laos'] = { top : 1600, left : 4070, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'burma','thailand','vietnam' ], region : "seasia" , name : "Laos"};
  countries['thailand'] = { top : 1769, left : 3980, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'laos','vietnam','malaysia' ], region : "seasia" , name : "Thailand"};
  countries['vietnam'] = { top : 1760, left : 4200, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'laos','thailand' ], region : "seasia" , name : "Vietnam"};
  countries['malaysia'] = { top : 1990, left : 4080, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'thailand','australia','indonesia' ], region : "seasia" , name : "Malaysia"};
  countries['australia'] = { top : 2442, left : 4450, us : 4 , ussr : 0 , control : 4 , bg : 0 , neighbours : [ 'malaysia' ], region : "seasia" , name : "Australia" };
  countries['indonesia'] = { top : 2176, left : 4450, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'malaysia','philippines' ], region : "seasia" , name : "Indonesia"};
  countries['philippines'] = { top : 1755, left : 4530, us : 1 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'indonesia','japan' ], region : "seasia" , name : "Philippines"};
  countries['taiwan'] = { top : 1525, left : 4435, us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'japan','southkorea' ], region : "asia" , name : "Taiwan"};
  countries['japan'] = { top : 1348, left : 4705, us : 1 , ussr : 0 , control : 4 , bg : 1 , neighbours : [ 'philippines','taiwan','southkorea' ], region : "asia" , name : "Japan"};
  countries['southkorea'] = { top : 1200, left : 4530, us : 1 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'japan','taiwan','northkorea' ], region : "asia" , name : "South Korea"};
  countries['northkorea'] = { top : 1050, left : 4480, us : 0 , ussr : 3 , control : 3 , bg : 1 , neighbours : [ 'southkorea' ], region : "asia" , name : "North Korea"};

  // CENTRAL AMERICA
  countries['mexico'] = { top : 1370, left : 175, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'guatemala' ], region : "camerica" , name : "Mexico"};
  countries['guatemala'] = { top : 1526, left : 360, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'mexico','elsalvador','honduras' ], region : "camerica" , name : "Guatemala"};
  countries['elsalvador'] = { top : 1690, left : 295, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'honduras','guatemala' ], region : "camerica" , name : "El Salvador"};
  countries['honduras'] = { top : 1675, left : 515, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'nicaragua','costarica','guatemala','elsalvador' ], region : "camerica" , name : "Honduras"};
  countries['nicaragua'] = { top : 1675, left : 735, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'costarica','honduras','cuba' ], region : "camerica" , name : "Nicaragua"};
  countries['costarica'] = { top : 1830, left : 495, us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'honduras', 'panama','nicaragua' ], region : "camerica" , name : "Costa Rica"};
  countries['panama'] = { top : 1830, left : 738, us : 1 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'colombia','costarica' ], region : "camerica" , name : "Panama"};
  countries['cuba'] = { top : 1480, left : 750, us : 0 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'haiti','nicaragua' ], region : "camerica" , name : "Cuba"};
  countries['haiti'] = { top : 1620, left : 970, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'cuba','dominicanrepublic' ], region : "camerica" , name : "Haiti"};
  countries['dominicanrepublic'] = { top : 1620, left : 1180, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'haiti' ], region : "camerica" , name : "Dominican Republic"};

  // SOUTH AMERICA
  countries['venezuela'] = { top : 1850, left : 1000, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'colombia','brazil' ], region : "samerica" , name : "Venezuela"};
  countries['colombia'] = { top : 2010, left : 878, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'panama','venezuela','ecuador' ], region : "samerica" , name : "Colombia"};
  countries['ecuador'] = { top : 2075, left : 650, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'peru','colombia' ], region : "samerica" , name : "Ecuador"};
  countries['peru'] = { top : 2244, left : 780, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'ecuador','chile','bolivia' ], region : "samerica" , name : "Peru"};
  countries['chile'] = { top : 2570, left : 885, us : 0 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'peru','argentina' ], region : "samerica" , name : "Chile"};
  countries['bolivia'] = { top : 2385, left : 1005, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'paraguay','peru' ], region : "samerica" , name : "Bolivia"};
  countries['argentina'] = { top : 2860, left : 955, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'chile','uruguay','paraguay' ], region : "samerica" , name : "Argentina"};
  countries['paraguay'] = { top : 2550, left : 1130, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'uruguay','argentina','bolivia' ], region : "samerica" , name : "Paraguay"};
  countries['uruguay'] = { top : 2740, left : 1200, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'argentina','paraguay','brazil' ], region : "samerica" , name : "Uruguay"};
  countries['brazil'] = { top : 2230, left : 1385, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'uruguay','venezuela' ], region : "samerica" , name : "Brazil"};

  // AFRICA
  countries['morocco'] = { top : 1400, left : 1710, us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'westafricanstates','algeria','spain' ], region : "africa" , name : "Morocco"};
  countries['algeria'] = { top : 1330, left : 1935, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'tunisia','morocco','france','saharanstates' ], region : "africa" , name : "Algeria"};
  countries['tunisia'] = { top : 1310, left : 2160, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'libya','algeria' ], region : "africa" , name : "Tunisia"};
  countries['westafricanstates'] = { top : 1595, left : 1690, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'ivorycoast','morocco' ], region : "africa" , name : "West African States"};
  countries['saharanstates'] = { top : 1650, left : 2025, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'algeria','nigeria' ], region : "africa" , name : "Saharan States"};
  countries['sudan'] = { top : 1690, left : 2550, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'egypt','ethiopia' ], region : "africa" , name : "Sudan"};
  countries['ivorycoast'] = { top : 1885, left : 1835, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'nigeria','westafricanstates' ], region : "africa" , name : "Ivory Coast"};
  countries['nigeria'] = { top : 1859, left : 2110, us : 0 , ussr : 0 , control : 1 , bg : 1 , neighbours : [ 'ivorycoast','cameroon','saharanstates' ], region : "africa" , name : "Nigeria"};
  countries['ethiopia'] = { top : 1845, left : 2710, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'sudan','somalia' ], region : "africa" , name : "Ethiopia"};
  countries['somalia'] = { top : 1910, left : 2955, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'ethiopia','kenya' ], region : "africa" , name : "Somalia"};
  countries['cameroon'] = { top : 2035, left : 2210, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'zaire','nigeria' ], region : "africa" , name : "Cameroon"};
  countries['zaire'] = { top : 2110, left : 2470, us : 0 , ussr : 0 , control : 1 , bg : 1 , neighbours : [ 'angola','zimbabwe','cameroon' ], region : "africa" , name : "Zaire"};
  countries['kenya'] = { top : 2045, left : 2735, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'seafricanstates','somalia' ], region : "africa" , name : "Kenya"};
  countries['angola'] = { top : 2290, left : 2280, us : 0 , ussr : 0 , control : 1 , bg : 1 , neighbours : [ 'southafrica','botswana','zaire' ], region : "africa" , name : "Angola"};
  countries['seafricanstates'] = { top : 2250, left : 2760, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'zimbabwe','kenya' ], region : "africa" , name : "Southeast African States"};
  countries['zimbabwe'] = { top : 2365, left : 2545, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'seafricanstates','botswana','zaire' ], region : "africa" , name : "Zimbabwe"};
  countries['botswana'] = { top : 2520, left : 2475, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'southafrica','angola','zimbabwe' ], region : "africa" , name : "Botswana"};
  countries['southafrica'] = { top : 2690, left : 2370, us : 1 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'angola','botswana' ], region : "africa" , name : "South Africa"};

  for (var i in countries) { countries[i].place = 0; }

  return countries;

}

Twilight.prototype.returnChinaCard = function returnChinaCard() {
  return { img : "TNRnTS-06" , name : "China" , scoring : 0 , bg : 0 , player : "both" , recurring : 1 , ops : 4 };
}

Twilight.prototype.returnEarlyWarCards = function returnEarlyWarCards() {

  var deck = {};

  // EARLY WAR
  deck['asia']            = { img : "TNRnTS-01" , name : "Asia Scoring", scoring : 1 , player : "both" , recurring : 1 , ops : 0 };
  deck['europe']          = { img : "TNRnTS-02" , name : "Europe Scoring", scoring : 1 , player : "both" , recurring : 1 , ops : 0 };
  deck['mideast']         = { img : "TNRnTS-03" , name : "Middle-East Scoring", scoring : 1 , player : "both" , recurring : 1 , ops : 0 };
  deck['duckandcover']    = { img : "TNRnTS-04" , name : "Duck and Cover", scoring : 0 , player : "us"   , recurring : 1 , ops : 3 };
  deck['fiveyearplan']    = { img : "TNRnTS-05" , name : "Five Year Plan", scoring : 0 , player : "us"   , recurring : 1 , ops : 3 };
  deck['socgov']          = { img : "TNRnTS-07" , name : "Socialist Governments", scoring : 0 , player : "ussr" , recurring : 1 , ops : 3 };
  deck['fidel']           = { img : "TNRnTS-08" , name : "Fidel", scoring : 0 , player : "ussr" , recurring : 0 , ops : 2 };
  deck['vietnamrevolts']  = { img : "TNRnTS-09" , name : "Vietnam Revolts", scoring : 0 , player : "ussr" , recurring : 0 , ops : 2 };
  deck['blockade']        = { img : "TNRnTS-10" , name : "Blockade", scoring : 0 , player : "ussr" , recurring : 0 , ops : 1 };
  deck['koreanwar']       = { img : "TNRnTS-11" , name : "Korean War", scoring : 0 , player : "ussr" , recurring : 0 , ops : 2 };
  deck['romanianab']      = { img : "TNRnTS-12" , name : "Romanian Abdication", scoring : 0 , player : "ussr" , recurring : 0 , ops : 1 };
  deck['arabisraeli']     = { img : "TNRnTS-13" , name : "Arab-Israeli War", scoring : 0 , player : "ussr" , recurring : 1 , ops : 2 };
  deck['comecon']         = { img : "TNRnTS-14" , name : "Comecon", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['nasser']          = { img : "TNRnTS-15" , name : "Nasser", scoring : 0 , player : "ussr" , recurring : 0 , ops : 1 };
  deck['warsawpact']      = { img : "TNRnTS-16" , name : "Warsaw Pact", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['degaulle']        = { img : "TNRnTS-17" , name : "De Gaulle Leads France", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['naziscientist']   = { img : "TNRnTS-18" , name : "Nazi Scientist", scoring : 0 , player : "both" , recurring : 0 , ops : 1 };
  deck['truman']          = { img : "TNRnTS-19" , name : "Truman", scoring : 0 , player : "us"   , recurring : 0 , ops : 1 };
  deck['olympic']         = { img : "TNRnTS-20" , name : "Olympic Games", scoring : 0 , player : "both" , recurring : 1 , ops : 2 };
  deck['nato']            = { img : "TNRnTS-21" , name : "NATO", scoring : 0 , player : "us"   , recurring : 0 , ops : 4 };
  deck['indreds']         = { img : "TNRnTS-22" , name : "Independent Reds", scoring : 0 , player : "us"   , recurring : 0 , ops : 2 };
  deck['marshall']        = { img : "TNRnTS-23" , name : "Marshall Plan", scoring : 0 , player : "us"   , recurring : 0 , ops : 4 };
  deck['indopaki']        = { img : "TNRnTS-24" , name : "Indo-Pakistani War", scoring : 0 , player : "both" , recurring : 1 , ops : 2 };
  deck['containment']     = { img : "TNRnTS-25" , name : "Containment", scoring : 0 , player : "us"   , recurring : 0 , ops : 3 };
  deck['cia']             = { img : "TNRnTS-26" , name : "CIA Created", scoring : 0 , player : "us"   , recurring : 0 , ops : 1 };
  deck['usjapan']         = { img : "TNRnTS-27" , name : "US/Japan Defense Pact", scoring : 0 , player : "us"   , recurring : 0 , ops : 4 };
  deck['suezcrisis']      = { img : "TNRnTS-28" , name : "Suez Crisis", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['easteuropean']    = { img : "TNRnTS-29" , name : "East European Unrest", scoring : 0 , player : "us"   , recurring : 1 , ops : 3 };
  deck['decolonization']  = { img : "TNRnTS-30" , name : "Decolonization", scoring : 0 , player : "ussr" , recurring : 1 , ops : 2 };
  deck['redscare']        = { img : "TNRnTS-31" , name : "Red Scare", scoring : 0 , player : "both" , recurring : 1 , ops : 4 };
  deck['unintervention']  = { img : "TNRnTS-32" , name : "UN Intervention", scoring : 0 , player : "both" , recurring : 1 , ops : 1 };
  deck['destalinization'] = { img : "TNRnTS-33" , name : "Destalinization", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['nucleartestban']  = { img : "TNRnTS-34" , name : "Nuclear Test Ban Treaty", scoring : 0 , player : "both" , recurring : 1 , ops : 4 };
  deck['formosan']        = { img : "TNRnTS-35" , name : "Formosan Resolution", scoring : 0 , player : "us"   , recurring : 0 , ops : 2 };

  //
  // OPTIONS - we default to the expanded deck
  //
  if (this.game.options.deck != "original" ) {
    deck['defectors']       = { img : "TNRnTS-103" ,name : "Defectors", scoring : 0 , player : "us"   , recurring : 1 , ops : 2 };
    deck['cambridge']       = { img : "TNRnTS-104" ,name : "The Cambridge Five", scoring : 0 , player : "ussr"   , recurring : 1 , ops : 2 };
    deck['specialrelation'] = { img : "TNRnTS-105" ,name : "Special Relationship", scoring : 0 , player : "us"   , recurring : 1 , ops : 2 };
    deck['norad']           = { img : "TNRnTS-106" ,name : "NORAD", scoring : 0 , player : "us"   , recurring : 0 , ops : 3 };
  }

  return deck;

}
Twilight.prototype.returnMidWarCards = function returnMidWarCards() {

  var deck = {};

  deck['brushwar']          = { img : "TNRnTS-36" , name : "Brush War", scoring : 0 , player : "both" , recurring : 1 , ops : 3 };
  deck['centralamerica']    = { img : "TNRnTS-37" , name : "Central America Scoring", scoring : 1 , player : "both" , recurring : 1 , ops : 0 };
  deck['seasia']            = { img : "TNRnTS-38" , name : "Southeast Asia Scoring", scoring : 1 , player : "both" , recurring : 0 , ops : 0 };
  deck['armsrace']          = { img : "TNRnTS-39" , name : "Arms Race", scoring : 0 , player : "both" , recurring : 1 , ops : 3 };
  deck['cubanmissile']      = { img : "TNRnTS-40" , name : "Cuban Missile Crisis", scoring : 0 , player : "both" , recurring : 0 , ops : 3 };
  deck['nuclearsubs']       = { img : "TNRnTS-41" , name : "Nuclear Subs", scoring : 0 , player : "us" , recurring : 0 , ops : 2 };
  deck['quagmire']          = { img : "TNRnTS-42" , name : "Quagmire", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['saltnegotiations']  = { img : "TNRnTS-43" , name : "Salt Negotiations", scoring : 0 , player : "both" , recurring : 0 , ops : 3 };
  deck['beartrap']          = { img : "TNRnTS-44" , name : "Bear Trap", scoring : 0 , player : "us" , recurring : 0 , ops : 3 };
  deck['summit']            = { img : "TNRnTS-45" , name : "Summit", scoring : 0 , player : "both" , recurring : 1 , ops : 1 };
  deck['howilearned']       = { img : "TNRnTS-46" , name : "How I Learned to Stop Worrying", scoring : 0 , player : "both" , recurring : 0 , ops : 2 };
  deck['junta']             = { img : "TNRnTS-47" , name : "Junta", scoring : 0 , player : "both" , recurring : 1 , ops : 2 };
  deck['kitchendebates']    = { img : "TNRnTS-48" , name : "Kitchen Debates", scoring : 0 , player : "us" , recurring : 0 , ops : 1 };
  deck['missileenvy']       = { img : "TNRnTS-49" , name : "Missile Envy", scoring : 0 , player : "both" , recurring : 1 , ops : 2 };
  deck['wwby']              = { img : "TNRnTS-50" , name : "We Will Bury You", scoring : 0 , player : "ussr" , recurring : 0 , ops : 4 };
  deck['brezhnev']          = { img : "TNRnTS-51" , name : "Brezhnev Doctrine", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['portuguese']        = { img : "TNRnTS-52" , name : "Portuguese Empire Crumbles", scoring : 0 , player : "ussr" , recurring : 0 , ops : 2 };
  deck['southafrican']      = { img : "TNRnTS-53" , name : "South African Unrest", scoring : 0 , player : "ussr" , recurring : 1 , ops : 2 };
  deck['allende']           = { img : "TNRnTS-54" , name : "Allende", scoring : 0 , player : "ussr" , recurring : 0 , ops : 1 };
  deck['willybrandt']       = { img : "TNRnTS-55" , name : "Willy Brandt", scoring : 0 , player : "ussr" , recurring : 0 , ops : 2 };
  deck['muslimrevolution']  = { img : "TNRnTS-56" , name : "Muslim Revolution", scoring : 0 , player : "ussr" , recurring : 1 , ops : 4 };
  deck['abmtreaty']         = { img : "TNRnTS-57" , name : "ABM Treaty", scoring : 0 , player : "both" , recurring : 1 , ops : 4 };
  deck['culturalrev']       = { img : "TNRnTS-58" , name : "Cultural Revolution", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['flowerpower']       = { img : "TNRnTS-59" , name : "Flower Power", scoring : 0 , player : "ussr" , recurring : 0 , ops : 4 };
  deck['u2']                = { img : "TNRnTS-60" , name : "U2 Incident", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['opec']              = { img : "TNRnTS-61" , name : "OPEC", scoring : 0 , player : "ussr" , recurring : 1 , ops : 3 };
  deck['lonegunman']        = { img : "TNRnTS-62" , name : "Lone Gunman", scoring : 0 , player : "ussr" , recurring : 0 , ops : 1 };
  deck['colonial']          = { img : "TNRnTS-63" , name : "Colonial Rear Guards", scoring : 0 , player : "us" , recurring : 1 , ops : 2 };
  deck['panamacanal']       = { img : "TNRnTS-64" , name : "Panama Canal Returned", scoring : 0 , player : "us" , recurring : 0 , ops : 1 };
  deck['campdavid']         = { img : "TNRnTS-65" , name : "Camp David Accords", scoring : 0 , player : "us" , recurring : 0 , ops : 2 };
  deck['puppet']            = { img : "TNRnTS-66" , name : "Puppet Governments", scoring : 0 , player : "us" , recurring : 0 , ops : 2 };
  deck['grainsales']        = { img : "TNRnTS-67" , name : "Grain Sales to Soviets", scoring : 0 , player : "us" , recurring : 1 , ops : 2 };
  deck['johnpaul']          = { img : "TNRnTS-68" , name : "John Paul II Elected Pope", scoring : 0 , player : "us" , recurring : 0 , ops : 2 };
  deck['deathsquads']       = { img : "TNRnTS-69" , name : "Latin American Death Squads", scoring : 0 , player : "both" , recurring : 1 , ops : 2 };
  deck['oas']               = { img : "TNRnTS-70" , name : "OAS Founded", scoring : 0 , player : "us" , recurring : 0 , ops : 1 };
  deck['nixon']             = { img : "TNRnTS-71" , name : "Nixon Plays the China Card", scoring : 0 , player : "us" , recurring : 0 , ops : 2 };
  deck['sadat']             = { img : "TNRnTS-72" , name : "Sadat Expels Soviets", scoring : 0 , player : "us" , recurring : 0 , ops : 1 };
  deck['shuttle']           = { img : "TNRnTS-73" , name : "Shuttle Diplomacy", scoring : 0 , player : "us" , recurring : 1 , ops : 3 };
  deck['voiceofamerica']    = { img : "TNRnTS-74" , name : "Voice of America", scoring : 0 , player : "us" , recurring : 1 , ops : 2 };
  deck['liberation']        = { img : "TNRnTS-75" , name : "Liberation Theology", scoring : 0 , player : "ussr" , recurring : 1 , ops : 2 };
  deck['ussuri']            = { img : "TNRnTS-76" , name : "Ussuri River Skirmish", scoring : 0 , player : "us" , recurring : 0 , ops : 3 };
  deck['asknot']            = { img : "TNRnTS-77" , name : "Ask Not What Your Country...", scoring : 0 , player : "us" , recurring : 0 , ops : 3 };
  deck['alliance']          = { img : "TNRnTS-78" , name : "Alliance for Progress", scoring : 0 , player : "us" , recurring : 0 , ops : 3 };
  deck['africa']            = { img : "TNRnTS-79" , name : "Africa Scoring", scoring : 1 , player : "both" , recurring : 1 , ops : 0 };
  deck['onesmallstep']      = { img : "TNRnTS-80" , name : "One Small Step", scoring : 0 , player : "both" , recurring : 1 , ops : 2 };
  deck['southamerica']      = { img : "TNRnTS-81" , name : "South America Scoring", scoring : 1 , player : "both" , recurring : 1 , ops : 0 };

  //
  // OPTIONS - we default to the expanded deck
  //
  if (this.game.options.deck != "original" ) {
    deck['che']               = { img : "TNRnTS-107" , name : "Che", scoring : 0 , player : "ussr" , recurring : 1 , ops : 3 };
    deck['tehran']            = { img : "TNRnTS-108" , name : "Our Man in Tehran", scoring : 0 , player : "us" , recurring : 0 , ops : 2 };
  }

  return deck;

}
Twilight.prototype.returnLateWarCards = function returnLateWarCards() {

  var deck = {};

  deck['iranianhostage']    = { img : "TNRnTS-82" , name : "Iranian Hostage Crisis", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['ironlady']          = { img : "TNRnTS-83" , name : "The Iron Lady", scoring : 0 , player : "us" , recurring : 0 , ops : 3 };
  deck['reagan']            = { img : "TNRnTS-84" , name : "Reagan Bombs Libya", scoring : 0 , player : "us" , recurring : 0 , ops : 2 };
  deck['starwars']          = { img : "TNRnTS-85" , name : "Star Wars", scoring : 0 , player : "us" , recurring : 0 , ops : 2 };
  deck['northseaoil']       = { img : "TNRnTS-86" , name : "North Sea Oil", scoring : 0 , player : "us" , recurring : 0 , ops : 3 };
  deck['reformer']          = { img : "TNRnTS-87" , name : "The Reformer", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['marine']            = { img : "TNRnTS-88" , name : "Marine Barracks Bombing", scoring : 0 , player : "ussr" , recurring : 0 , ops : 2 };
  deck['KAL007']            = { img : "TNRnTS-89" , name : "Soviets Shoot Down KAL-007", scoring : 0 , player : "us" , recurring : 0 , ops : 4 };
  deck['glasnost']          = { img : "TNRnTS-90" , name : "Glasnost", scoring : 0 , player : "ussr" , recurring : 0 , ops : 4 };
  deck['ortega']            = { img : "TNRnTS-91" , name : "Ortega Elected in Nicaragua", scoring : 0 , player : "ussr" , recurring : 0 , ops : 2 };
  deck['terrorism']         = { img : "TNRnTS-92" , name : "Terrorism", scoring : 0 , player : "both" , recurring : 1 , ops : 2 };
  deck['irancontra']        = { img : "TNRnTS-93" , name : "Iran Contra Scandal", scoring : 0 , player : "ussr" , recurring : 0 , ops : 2 };
  deck['chernobyl']         = { img : "TNRnTS-94" , name : "Chernobyl", scoring : 0 , player : "us" , recurring : 0 , ops : 3 };
  deck['debtcrisis']        = { img : "TNRnTS-95" , name : "Latin American Debt Crisis", scoring : 0 , player : "ussr" , recurring : 1 , ops : 2 };
  deck['teardown']          = { img : "TNRnTS-96" , name : "Tear Down this Wall", scoring : 0 , player : "us" , recurring : 0 , ops : 3 };
  deck['evilempire']        = { img : "TNRnTS-97" , name : "An Evil Empire", scoring : 0 , player : "us" , recurring : 0 , ops : 3 };
  deck['aldrichames']       = { img : "TNRnTS-98" , name : "Aldrich Ames Remix", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['pershing']          = { img : "TNRnTS-99" , name : "Pershing II Deployed", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['wargames']          = { img : "TNRnTS-100" , name : "Wargames", scoring : 0 , player : "both" , recurring : 0 , ops : 4 };
  deck['solidarity']        = { img : "TNRnTS-101" , name : "Solidarity", scoring : 0 , player : "us" , recurring : 0 , ops : 2 };

  //
  // OPTIONS - we default to the expanded deck
  //
  if (this.game.options.deck != "original" ) {
    deck['iraniraq']          = { img : "TNRnTS-102" , name : "Iran-Iraq War", scoring : 0 , player : "both" , recurring : 1 , ops : 2 };
    deck['yuri']              = { img : "TNRnTS-109" , name : "Yuri and Samantha", scoring : 0 , player : "ussr" , recurring : 0 , ops : 2 };
    deck['awacs']             = { img : "TNRnTS-110" , name : "AWACS Sale to Soviets", scoring : 0 , player : "us" , recurring : 0 , ops : 3 };
  }


  return deck;

}
Twilight.prototype.returnDiscardedCards = function returnDiscardedCards() {

  var discarded = {};

  for (var i in this.game.deck[0].discards) {
    discarded[i] = this.game.deck[0].cards[i];
    delete this.game.deck[0].cards[i];
  }

  this.game.deck[0].discards = {};

  return discarded;

}

/////////////////
// Play Events //
/////////////////
//
// the point of this function is either to execute events directly
// or permit the relevant player to translate them into actions
// that can be directly executed by UPDATE BOARD.
//
// this function returns 1 if we can continue, or 0 if we cannot
// in the handleGame loop managing the events / turns that are
// queued up to go.
//
Twilight.prototype.playEvent = function playEvent(player, card) {

  if (this.game.deck[0].cards[card] != undefined) {
    this.updateStatus("Playing event: " + this.game.deck[0].cards[card].name);
  } else {
    //
    // event already run - sync loading error
    //
    console.log("sync loading error -- playEvent");
    return 1;
  }


  ///////////////
  // EARLY WAR //
  ///////////////
  //
  // scoring
  //
  if (card == "asia") {
    this.scoreRegion("asia");
    return 1;
  }
  if (card == "europe") {
    this.scoreRegion("europe");
    return 1;
  }
  if (card == "mideast") {
    this.scoreRegion("mideast");
    return 1;
  }


  //
  // Defectors
  //
  if (card == "defectors") {
    if (this.game.state.headline == 0 && this.game.state.turn == 0) {
      this.game.state.vp += 1;
      this.updateLog("US gains 1 VP from Defectors");
      this.updateDefcon();
    }
    return 1;
  }

  //
  // Special Relationship
  //
  if (card == "specialrelation") {

    if (this.isControlled("us", "uk") == 1) {

      if (this.game.player == 1) { 
        this.updateStatus("US is playing Special Relationship");
        return 0; 
      }

      this.updateStatus("US is playing Special Relationship");

      let twilight_self = this;
      let ops_to_place = 1;
      let placeable = [];

      if (this.game.state.events.nato == 1) {
        ops_to_place = 2;
        placeable.push("canada");
        placeable.push("uk");
        placeable.push("italy");
        placeable.push("france");
        placeable.push("spain");
        placeable.push("greece");
        placeable.push("turkey");
        placeable.push("austria");
        placeable.push("benelux");
        placeable.push("westgermany");
        placeable.push("denmark");
        placeable.push("norway");
        placeable.push("sweden");
        placeable.push("finland");

        this.updateStatus("US is playing Special Relationship. Place 2 OPS anywhere in Western Europe.");

      } else {

        this.updateStatus("US is playing Special Relationship. Place 1 OP adjacent to the UK.");

        placeable.push("canada");
        placeable.push("france");
        placeable.push("norway");
        placeable.push("benelux");
      }

      for (let i = 0; i < placeable.length; i++) {

        this.game.countries[placeable[i]].place = 1;

        let divname = "#"+placeable[i];


        $(divname).off();
        $(divname).on('click', function() {

	  twilight_self.addMove("resolve\tspecialrelation");
	  if (twilight_self.game.state.events.nato == 1) {
  	    twilight_self.addMove("vp\tus\t2");
	  }

	  let c = $(this).attr('id');

          if (twilight_self.countries[c].place != 1) {
	    alert("Invalid Placement");
	  } else {
            twilight_self.placeInfluence(c, ops_to_place, "us", function() {
	      twilight_self.addMove("place\tus\tus\t"+c+"\t"+ops_to_place);
              twilight_self.playerFinishedPlacingInfluence();
              twilight_self.endTurn();
            });
	  }
	});
      }
      return 0;
    }
    return 1;
  }

  //
  // Cambridge Five
  //
  if (card == "cambridge") {

    if (this.game.state.round > 7) {
      this.updateLog("The Cambridge Five cannot be played as an event in Late War");
      this.updateStatus("The Cambridge Five cannot be played as an event in Late War");
      return 1;
    }

    if (this.game.player == 1) {
      this.updateStatus("USSR is playing The Cambridge Five (fetching scoring cards in US hand)");
      return 0;
    }

    if (this.game.player == 2) {

      this.addMove("resolve\tcambridge");
      this.updateStatus("USSR is playing The Cambridge Five");

      let scoring_cards = "";
      let scoring_alert  = "cambridge\t";
      for (let i = 0; i < this.game.deck[0].hand.length; i++) {
        if (this.game.deck[0].cards[this.game.deck[0].hand[i]].scoring == 1) {
	  if (scoring_cards.length > 0) { scoring_cards += ", "; scoring_alert += "\t"; }
          scoring_cards += this.game.deck[0].hand[i];
          scoring_alert += this.game.deck[0].hand[i];
        }
      }

      if (scoring_cards.length == 0) {

        this.addMove("notify\tUS does not have any scoring cards");
        this.endTurn();

      } else {
   
        this.addMove(scoring_alert);
        this.addMove("notify\tUS has scoring cards for: " + scoring_cards);
        this.endTurn();

      }
    }

    return 0;
  }



  //
  // Norad
  //
  if (card == "norad") {
    this.game.state.events.norad = 1;
    return 1;
  }



  //
  // NASSER
  //
  if (card == "nasser") {
    if (parseInt(this.countries["egypt"].us) % 2 == 1) {
      this.removeInfluence("egypt", 1, "us");
    }
    if (parseInt(this.countries["egypt"].us) > 0) {
      this.removeInfluence("egypt", (parseInt(this.countries["egypt"].us)/2), "us");
    }
    this.placeInfluence("egypt", 2, "ussr");
    this.updateStatus("Nasser - Soviets add two influence in Egypt. US loses half (rounded-up) of all influence in Egypt.");
    return 1;
  }



  //
  // Nazi Scientist
  //
  if (card == "naziscientist") {
    this.advanceSpaceRace(player);
    return 1;
  }



  //
  // INDEPENDENT REDS
  //
  if (card == "indreds") {

    if (this.game.player == 1) {
      this.updateStatus("US is playing Independent Reds");
      return 0;
    }

    let yugo_ussr = this.countries['yugoslavia'].ussr;
    let romania_ussr = this.countries['romania'].ussr;
    let bulgaria_ussr = this.countries['bulgaria'].ussr;
    let hungary_ussr = this.countries['hungary'].ussr;
    let czechoslovakia_ussr = this.countries['czechoslovakia'].ussr;

    let yugo_us = this.countries['yugoslavia'].us;
    let romania_us = this.countries['romania'].us;
    let bulgaria_us = this.countries['bulgaria'].us;
    let hungary_us = this.countries['hungary'].us;
    let czechoslovakia_us = this.countries['czechoslovakia'].us;

    let yugo_diff = yugo_ussr - yugo_us;
    let romania_diff = romania_ussr - romania_us;
    let bulgaria_diff = bulgaria_ussr - bulgaria_us;
    let hungary_diff = hungary_ussr - hungary_us;
    let czechoslovakia_diff = czechoslovakia_ussr - czechoslovakia_us;

 
    this.addMove("resolve\tindreds");
    if (yugo_us >= yugo_ussr && romania_us >= romania_ussr && bulgaria_us >= bulgaria_ussr && czechoslovakia_us >= czechoslovakia_ussr) {
      this.endTurn();
      return 0;
    } else {


      let userhtml = "Match USSR influence in which country?<p></p><ul>";

      if (yugo_diff > 0) {
        userhtml += '<li class="card" id="yugoslavia">Yugoslavia</li>';
      }
      if (romania_diff > 0) {
        userhtml += '<li class="card" id="romania">Romania</li>';
      }
      if (bulgaria_diff > 0) {
        userhtml += '<li class="card" id="bulgaria">Bulgaria</li>';
      }
      if (hungary_diff > 0) {
        userhtml += '<li class="card" id="hungary">Hungary</li>';
      }
      if (czechoslovakia_diff > 0) {
        userhtml += '<li class="card" id="czechoslovakia">Czechoslovakia</li>';
      }
      userhtml += '</ul>';

      this.updateStatus(userhtml);
      let twilight_self = this;

      $('.card').off();
      $('.card').on('click', function() {

        let myselect = $(this).attr("id");

        if (myselect == "romania") {
          twilight_self.placeInfluence(myselect, romania_diff, "us");
	  twilight_self.addMove("place\tus\tus\tromania\t"+romania_diff);
	  twilight_self.endTurn();
	}
        if (myselect == "yugoslavia") {
          twilight_self.placeInfluence(myselect, yugo_diff, "us");
	  twilight_self.addMove("place\tus\tus\tyugoslavia\t"+yugo_diff);
	  twilight_self.endTurn();
	}
        if (myselect == "bulgaria") {
          twilight_self.placeInfluence(myselect, bulgaria_diff, "us");
	  twilight_self.addMove("place\tus\tus\tbulgaria\t"+bulgaria_diff);
	  twilight_self.endTurn();
	}
        if (myselect == "hungary") {
          twilight_self.placeInfluence(myselect, hungary_diff, "us");
	  twilight_self.addMove("place\tus\tus\thungary\t"+hungary_diff);
	  twilight_self.endTurn();
	}
        if (myselect == "czechoslovakia") {
          twilight_self.placeInfluence(myselect, czechoslovakia_diff, "us");
	  twilight_self.addMove("place\tus\tus\tczechoslovakia\t"+czechoslovakia_diff);
	  twilight_self.endTurn();
	}
	return 0;

      });

      return 0;
    }
    return 1;
  }



  ///////////////////
  // MARSHALL PLAN //
  ///////////////////
  if (card == "marshall") {

    this.game.state.events.marshall = 1;

    if (this.game.player == 1) { 
      this.updateStatus("US is playing Marshall Plan");
      return 0; 
    }
    if (this.game.player == 2) {

      this.updateStatus("Place 1 influence in each of 7 non USSR-controlled countries in Western Europe");

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      var ops_to_place = 7;
      twilight_self.addMove("resolve\tmarshall");
      for (var i in this.countries) {

        let countryname  = i;
        let divname      = '#'+i;
	if (i == "canada" || i == "uk" || i == "sweden" || i == "france" || i == "benelux" || i == "westgermany" || i == "spain" ||  i == "italy" || i == "greece" || i == "turkey" || i == "denmark" || i == "norway" || i == "sweden" ||  i == "finland" || i == "austria") {
          if (twilight_self.isControlled("ussr", countryname) != 1) {
            twilight_self.countries[countryname].place = 1;
            $(divname).off();
            $(divname).on('click', function() {
	      let countryname = $(this).attr('id');
              if (twilight_self.countries[countryname].place == 1) {
                twilight_self.addMove("place\tus\tus\t"+countryname+"\t1");
                twilight_self.placeInfluence(countryname, 1, "us", function() {
		  twilight_self.countries[countryname].place = 0;
                  ops_to_place--;
                  if (ops_to_place == 0) {
                    twilight_self.playerFinishedPlacingInfluence();
                    twilight_self.endTurn();
                  }
	        });
              } else {
                alert("you cannot place there...");
              }
            });
          }
        }
      }
      return 0;
    }
  }


  ////////////////////
  // Decolonization //
  ////////////////////
  if (card == "decolonization") {

    if (this.game.player == 2) { 
      this.updateStatus("USSR is playing Decolonization");
      return 0;
    }
    if (this.game.player == 1) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      var ops_to_place = 4;
      twilight_self.addMove("resolve\tdecolonization");

      this.updateStatus("Place four influence in Africa or Southeast Asia (1 per country)");

      for (var i in this.countries) {

        let countryname  = i;
        let divname      = '#'+i;

	if (i == "morocco" || i == "algeria" || i == "tunisia" || i == "westafricanstates" || i == "saharanstates" || i == "sudan" || i == "ivorycoast" || i == "nigeria" || i == "ethiopia" || i == "somalia" || i == "cameroon" || i == "zaire" || i == "kenya" || i == "angola" || i == "seafricanstates" || i == "zimbabwe" || i == "botswana" || i == "southafrica" || i == "philippines" || i == "indonesia" || i == "malaysia" || i == "vietnam" || i == "thailand" || i == "laos" || i == "burma") {
          twilight_self.countries[countryname].place = 1;
          $(divname).off();
          $(divname).on('click', function() {
	    let countryname = $(this).attr('id');
            if (twilight_self.countries[countryname].place == 1) {
              twilight_self.addMove("place\tussr\tussr\t"+countryname+"\t1");
              twilight_self.placeInfluence(countryname, 1, "ussr", function() {
	        twilight_self.countries[countryname].place = 0;
                ops_to_place--;
                if (ops_to_place <= 0) {
                  twilight_self.playerFinishedPlacingInfluence();
                  twilight_self.endTurn();
                }
	      });
            } else {
              alert("you cannot place there...");
            }
          });
        }
      }
      return 0;
    }
  }



  /////////////
  // Comecon //
  /////////////
  if (card == "comecon") {

    if (this.game.player == 2) { return 0; }
    if (this.game.player == 1) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();
      twilight_self.updateStatus("Place four influence in non-US controlled countries in Eastern Europe (1 per country)");

      var ops_to_place = 4;
      twilight_self.addMove("resolve\tcomecon");
      for (var i in this.countries) {

        let countryname  = i;
        let divname      = '#'+i;

	if (i == "finland" || i == "poland" || i == "eastgermany" || i == "austria" || i == "czechoslovakia" || i == "bulgaria" || i == "hungary" || i == "romania" || i == "yugoslavia") {
          twilight_self.countries[countryname].place = 1;
          $(divname).off();
          $(divname).on('click', function() {
	    let countryname = $(this).attr('id');
            if (twilight_self.countries[countryname].place == 1 && twilight_self.isControlled("us", countryname) != 1) {
              twilight_self.addMove("place\tussr\tussr\t"+countryname+"\t1");
              twilight_self.placeInfluence(countryname, 1, "ussr", function() {
	        twilight_self.countries[countryname].place = 0;
                ops_to_place--;
                if (ops_to_place == 0) {
                  twilight_self.playerFinishedPlacingInfluence();
                  twilight_self.endTurn();
                }
	      });
            } else {
              alert("you cannot place there...");
            }
          });
        }
      }
      return 0;
    }
  }


  /////////////////////
  // UN Intervention //
  /////////////////////
  if (card == "unintervention") {

    this.game.state.events.unintervention = 1;

    let me = "ussr";
    let opponent = "us";
    if (this.game.player == 2) { opponent = "ussr"; me = "us"; }

    if (player != me) {
      return 0;
    } else {

      let twilight_self = this;

      //
      // U2
      //
      if (twilight_self.game.state.events.u2 == 1) {
        twilight_self.addMove("notify\tU2 activates and triggers +1 VP for USSR");
        twilight_self.addMove("vp\tussr\t1\t1");
      }

      //
      // let player pick another turn
      //
      this.addMove("resolve\tunintervention");
      this.addMove("play\t"+this.game.player);
      this.playerTurn();
      return 0;
    }

  }


  ////////////////////////
  // Indo-Pakistani War //
  ////////////////////////
  if (card == "indopaki") {

    let me = "ussr";
    let opponent = "us";
    if (this.game.player == 2) { opponent = "ussr"; me = "us"; }

    if (me != player) { 
      let burned = this.rollDice(6);
      return 0;
    }
    if (me == player) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      twilight_self.addMove("resolve\tindopaki");
      twilight_self.updateStatus('Indo-Pakistani War. Choose Target:<p></p><ul><li class="card" id="invadepakistan">Pakistan</li><li class="card" id="invadeindia">India</li></ul>');

      let target = 4;

      $('.card').off();
      $('.card').on('click', function() {

        let invaded = $(this).attr("id");

        if (invaded == "invadepakistan") {

          if (twilight_self.isControlled(opponent, "india") == 1) { target++; }
          if (twilight_self.isControlled(opponent, "iran") == 1) { target++; }
          if (twilight_self.isControlled(opponent, "afghanistan") == 1) { target++; }

	  let die = twilight_self.rollDice(6);
          twilight_self.addMove("notify\t"+player.toUpperCase()+" rolls "+die);

	  if (die >= target) {

	    if (player == "us") {
              twilight_self.addMove("place\tus\tus\tpakistan\t"+twilight_self.countries['pakistan'].ussr);
              twilight_self.addMove("remove\tus\tussr\tpakistan\t"+twilight_self.countries['pakistan'].ussr);
              twilight_self.addMove("milops\tus\t2");
	      if (twilight_self.game.state.events.flowerpower == 1) {
                twilight_self.addMove("vp\tus\t2\t1");
	      } else {
                twilight_self.addMove("vp\tus\t2");
	      }
              twilight_self.placeInfluence("pakistan", twilight_self.countries['pakistan'].ussr, "us");
              twilight_self.removeInfluence("pakistan", twilight_self.countries['pakistan'].ussr, "ussr");
	      twilight_self.endTurn();
	      twilight_self.showInfluence("pakistan", "ussr");
	    } else {
              twilight_self.addMove("place\tussr\tussr\tpakistan\t"+twilight_self.countries['pakistan'].us);
              twilight_self.addMove("remove\tussr\tus\tpakistan\t"+twilight_self.countries['pakistan'].us);
              twilight_self.addMove("milops\tussr\t2");
	      if (twilight_self.game.state.events.flowerpower == 1) {
                twilight_self.addMove("vp\tussr\t2\t1");
	      } else {
                twilight_self.addMove("vp\tussr\t2");
	      }
              twilight_self.placeInfluence("pakistan", twilight_self.countries['pakistan'].us, "ussr");
              twilight_self.removeInfluence("pakistan", twilight_self.countries['pakistan'].us, "us");
	      twilight_self.endTurn();
	      twilight_self.showInfluence("pakistan", "ussr");
	    }
	  } else {

	    if (player == "us") {
              twilight_self.addMove("milops\tus\t2");
	      twilight_self.endTurn();
	    } else {
              twilight_self.addMove("milops\tussr\t2");
	      twilight_self.endTurn();
	    }
	  }
	}
        if (invaded == "invadeindia") {

          if (twilight_self.isControlled(opponent, "pakistan") == 1) { target++; }
          if (twilight_self.isControlled(opponent, "burma") == 1) { target++; }

	  let die = twilight_self.rollDice(6);
          twilight_self.addMove("notify\t"+player.toUpperCase()+" rolls "+die);

	  if (die >= target) {

	    if (player == "us") {
              twilight_self.addMove("place\tus\tus\tindia\t"+twilight_self.countries['india'].ussr);
              twilight_self.addMove("remove\tus\tussr\tindia\t"+twilight_self.countries['india'].ussr);
              twilight_self.addMove("milops\tus\t2");
	      if (twilight_self.game.state.events.flowerpower == 1) {
                twilight_self.addMove("vp\tus\t2\t1");
	      } else {
                twilight_self.addMove("vp\tus\t2");
	      }
              twilight_self.placeInfluence("india", twilight_self.countries['india'].ussr, "us");
              twilight_self.removeInfluence("india", twilight_self.countries['india'].ussr, "ussr");
	      twilight_self.endTurn();
	      twilight_self.showInfluence("india", "ussr");
	    } else {
              twilight_self.addMove("place\tussr\tussr\tindia\t"+twilight_self.countries['india'].us);
              twilight_self.addMove("remove\tussr\tus\tindia\t"+twilight_self.countries['india'].us);
              twilight_self.addMove("milops\tussr\t2");
	      if (twilight_self.game.state.events.flowerpower == 1) {
                twilight_self.addMove("vp\tussr\t2\t1");
	      } else {
                twilight_self.addMove("vp\tussr\t2");
	      }
              twilight_self.placeInfluence("india", twilight_self.countries['india'].us, "ussr");
              twilight_self.removeInfluence("india", twilight_self.countries['india'].us, "us");
 	      twilight_self.endTurn();
	      twilight_self.showInfluence("india", "ussr");
	    }
	  } else {

	    if (player == "us") {
              twilight_self.addMove("milops\tus\t2");
	      twilight_self.endTurn();
	    } else {
              twilight_self.addMove("milops\tussr\t2");
 	      twilight_self.endTurn();
	    }
	  }
	}
      });
    }
    return 0;
  }




  //////////////////////
  // Arab Israeli War //
  //////////////////////
  if (card == "arabisraeli") {

    if (this.game.state.events.campdavid == 1) {
      this.updateLog("Arab-Israeli conflict cancelled by Camp David Accords");
      return 1;
    }

    let target = 4;

    if (this.isControlled("us", "israel") == 1) { target++; }
    if (this.isControlled("us", "egypt") == 1) { target++; }
    if (this.isControlled("us", "jordan") == 1) { target++; }
    if (this.isControlled("us", "lebanon") == 1) { target++; }
    if (this.isControlled("us", "syria") == 1) { target++; }

    let roll = this.rollDice(6);
    this.updateLog(player.toUpperCase()+" rolls "+roll);

    if (roll >= target) {
      this.updateLog("USSR wins the Arab-Israeli War");
      this.placeInfluence("israel", this.countries['israel'].us, "ussr");
      this.removeInfluence("israel", this.countries['israel'].us, "us");
      if (this.game.state.events.flowerpower == 1) {
        this.game.state.vp_outstanding -= 2;
      } else {
        this.game.state.vp -= 2;
      }
      this.game.state.milops_ussr += 2;
      this.updateVictoryPoints();
      this.updateMilitaryOperations();
    } else {
      this.updateLog("US wins the Arab-Israeli War");
      this.game.state.milops_ussr += 2;
      this.updateMilitaryOperations();
    }

    return 1;
  }








  ////////////////
  // Korean War //
  ////////////////
  if (card == "koreanwar") {

    let target = 4;

    if (this.isControlled("us", "japan") == 1) { target++; }
    if (this.isControlled("us", "taiwan") == 1) { target++; }

    let roll = this.rollDice(6);

    this.updateLog("Korean War happens (roll: " + roll + ")");

    if (roll >= target) {
      this.updateLog("North Korea wins the Korean War");
      this.placeInfluence("southkorea", this.countries['southkorea'].us, "ussr");
      this.removeInfluence("southkorea", this.countries['southkorea'].us, "us");
      if (this.game.state.events.flowerpower == 1) {
        this.game.state.vp_outstanding -= 2;
      } else {
        this.game.state.vp -= 2;
      }
      this.game.state.milops_ussr += 2;
      this.updateMilitaryOperations();
      this.updateVictoryPoints();
    } else {
      this.updateLog("South Korea wins the Korean War");
      this.game.state.milops_ussr += 2;
      this.updateMilitaryOperations();
    }
    return 1;

  }


  /////////////////////
  // Vietnam Revolts //
  /////////////////////
  if (card == "vietnamrevolts") {
    this.game.state.events.vietnam_revolts = 1;
    this.placeInfluence("vietnam", 2, "ussr");
    return 1;
  }



  //////////
  // NATO //
  //////////
  if (card == "nato") {
    if (this.game.state.events.marshall == 1 || this.game.state.events.warsawpact == 1) {
      this.game.state.events.nato = 1;
      this.game.state.events.nato_westgermany = 1;
      this.game.state.events.nato_france = 1;
    } else {
      this.updateLog("NATO cannot trigger before Warsaw Pact of Marshall Plan. Moving to discard pile.");
    }
    return 1;
  }



  ////////////////
  // China Card //
  ////////////////
  if (card == "china") {
    this.game.state.events.formosan = 0;
    if (player == "ussr") {
      this.game.state.events.china_card = 2;
    } else {
      this.game.state.events.china_card = 1;
    }
    return 1;
  }



  //////////////
  // Formosan //
  //////////////
  if (card == "formosan") {
    this.game.state.events.formosan = 1;
    return 1;
  }


  ///////////
  // Fidel //
  ///////////
  if (card == "fidel") {
    let usinf = parseInt(this.countries['cuba'].us);
    let ussrinf = parseInt(this.countries['cuba'].ussr);
    this.removeInfluence("cuba", usinf, "us");
    if (ussrinf < 3) {
      this.placeInfluence("cuba", (3-ussrinf), "ussr");
    }
    return 1;
  }


  /////////////////
  // Containment //
  /////////////////
  if (card == "containment") {
    this.game.state.events.containment = 1;
    return 1;
  }


  ////////////
  // Truman //
  ////////////
  if (card == "truman") {

    if (this.game.player == 1) { 
      this.updateStatus("US is selecting target for Truman");
      return 0; 
    }
    if (this.game.player == 2) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      twilight_self.addMove("resolve\ttruman");

      var options_purge = [];


      if (twilight_self.countries['canada'].ussr > 0 && twilight_self.isControlled('ussr', 'canada') != 1 && twilight_self.isControlled('us', 'canada') != 1) { options_purge.push('canada'); }
      if (twilight_self.countries['uk'].ussr > 0 && twilight_self.isControlled('ussr', 'uk') != 1 && twilight_self.isControlled('us', 'uk') != 1) { options_purge.push('uk'); }
      if (twilight_self.countries['france'].ussr > 0 && twilight_self.isControlled('ussr', 'france') != 1 && twilight_self.isControlled('us', 'france') != 1) { options_purge.push('france'); }
      if (twilight_self.countries['spain'].ussr > 0 && twilight_self.isControlled('ussr', 'spain') != 1 && twilight_self.isControlled('us', 'spain') != 1) { options_purge.push('spain'); }
      if (twilight_self.countries['greece'].ussr > 0 && twilight_self.isControlled('ussr', 'greece') != 1 && twilight_self.isControlled('us', 'greece') != 1) { options_purge.push('greece'); }
      if (twilight_self.countries['turkey'].ussr > 0 && twilight_self.isControlled('ussr', 'turkey') != 1 && twilight_self.isControlled('us', 'turkey') != 1) { options_purge.push('turkey'); }
      if (twilight_self.countries['italy'].ussr > 0 && twilight_self.isControlled('ussr', 'italy') != 1 && twilight_self.isControlled('us', 'italy') != 1) { options_purge.push('italy'); }
      if (twilight_self.countries['westgermany'].ussr > 0 && twilight_self.isControlled('ussr', 'westgermany') != 1 && twilight_self.isControlled('us', 'westgermany') != 1) { options_purge.push('westgermany'); }
      if (twilight_self.countries['eastgermany'].ussr > 0 && twilight_self.isControlled('ussr', 'eastgermany') != 1 && twilight_self.isControlled('us', 'eastgermany') != 1) { options_purge.push('eastgermany'); }
      if (twilight_self.countries['poland'].ussr > 0 && twilight_self.isControlled('ussr', 'poland') != 1 && twilight_self.isControlled('us', 'poland') != 1) { options_purge.push('poland'); }
      if (twilight_self.countries['benelux'].ussr > 0 && twilight_self.isControlled('ussr', 'benelux') != 1 && twilight_self.isControlled('us', 'benelux') != 1) { options_purge.push('benelux'); }
      if (twilight_self.countries['denmark'].ussr > 0 && twilight_self.isControlled('ussr', 'denmark') != 1 && twilight_self.isControlled('us', 'denmark') != 1) { options_purge.push('denmark'); }
      if (twilight_self.countries['norway'].ussr > 0 && twilight_self.isControlled('ussr', 'norway') != 1 && twilight_self.isControlled('us', 'norway') != 1) { options_purge.push('norway'); }
      if (twilight_self.countries['finland'].ussr > 0 && twilight_self.isControlled('ussr', 'finland') != 1 && twilight_self.isControlled('us', 'finland') != 1) { options_purge.push('finland'); }
      if (twilight_self.countries['sweden'].ussr > 0 && twilight_self.isControlled('ussr', 'sweden') != 1 && twilight_self.isControlled('us', 'sweden') != 1) { options_purge.push('sweden'); }
      if (twilight_self.countries['yugoslavia'].ussr > 0 && twilight_self.isControlled('ussr', 'yugoslavia') != 1 && twilight_self.isControlled('us', 'yugoslavia') != 1) { options_purge.push('yugoslavia'); }
      if (twilight_self.countries['czechoslovakia'].ussr > 0 && twilight_self.isControlled('ussr', 'czechoslovakia') != 1 && twilight_self.isControlled('us', 'czechoslovakia') != 1) { options_purge.push('czechoslovakia'); }
      if (twilight_self.countries['bulgaria'].ussr > 0 && twilight_self.isControlled('ussr', 'bulgaria') != 1 && twilight_self.isControlled('us', 'bulgaria') != 1) { options_purge.push('bulgaria'); }
      if (twilight_self.countries['hungary'].ussr > 0 && twilight_self.isControlled('ussr', 'hungary') != 1 && twilight_self.isControlled('us', 'hungary') != 1) { options_purge.push('hungary'); }
      if (twilight_self.countries['romania'].ussr > 0 && twilight_self.isControlled('ussr', 'romania') != 1 && twilight_self.isControlled('us', 'romania') != 1) { options_purge.push('romania'); }
      if (twilight_self.countries['austria'].ussr > 0 && twilight_self.isControlled('ussr', 'austria') != 1 && twilight_self.isControlled('us', 'austria') != 1) { options_purge.push('austria'); }
  
      if (options_purge.length == 0) {
        twilight_self.addMove("notify\tUSSR has no influence that can be removed");
        twilight_self.endTurn();
      }

      twilight_self.updateStatus("Select a non-controlled country in Europe to remove all USSR influence: ");

      for (let i = 0; i < options_purge.length; i++) {

        let countryname  = options_purge[i];
        let divname      = '#'+countryname;

        twilight_self.countries[countryname].place = 1;

        $(divname).off();
        $(divname).on('click', function() {

	  let c = $(this).attr('id');
	  let ussrpur = twilight_self.countries[c].ussr;

          twilight_self.removeInfluence(c, ussrpur, "ussr", function() {
            twilight_self.addMove("remove\tus\tussr\t"+c+"\t"+ussrpur);
            twilight_self.playerFinishedPlacingInfluence();
            twilight_self.endTurn();
          });
	});
      }
    }

    return 0;
  }



  ///////////////////////////
  // Socialist Governments //
  ///////////////////////////
  if (card == "socgov") {

    if (this.game.state.events.ironlady == 1) {
      this.updateLog("Iron Lady cancels Socialist Governments");
      return 1;
    }

    if (this.game.player == 2) { 
      this.updateStatus("Socialist Governments: USSR is removing 3 US influence from Western Europe (max 2 per country)");
      return 0;
    }
    if (this.game.player == 1) {

      this.updateStatus("Remove 3 US influence from Western Europe (max 2 per country)");

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      twilight_self.addMove("resolve\tsocgov");

      var ops_to_purge = 3; 
      var ops_purged = {};

      for (var i in this.countries) {

        let countryname  = i;
  	ops_purged[countryname] = 0;
        let divname      = '#'+i;

        if (i == "italy" || i == "turkey" || i == "greece" || i == "spain" || i == "france" || i == "westgermany" || i == "uk" ||  i == "canada" || i == "benelux" || i == "finland" || i == "austria" || i == "denmark" || i == "norway" || i == "sweden") {

          twilight_self.countries[countryname].place = 1;
          $(divname).off();
          $(divname).on('click', function() {

	    let c = $(this).attr('id');

            if (twilight_self.countries[c].place != 1) {
	      alert("Invalid Country");
	    } else {
	      ops_purged[c]++;
	      if (ops_purged[c] >= 2) {
                twilight_self.countries[c].place = 0;
	      }
              twilight_self.removeInfluence(c, 1, "us", function() {
	        twilight_self.addMove("remove\tussr\tus\t"+c+"\t1");
                ops_to_purge--;
                if (ops_to_purge == 0) {
                  twilight_self.playerFinishedPlacingInfluence();
                  twilight_self.endTurn();
                }
              });
            }
          });
        }
      }
      return 0;
    }
  }




  /////////////////
  // Suez Crisis //
  /////////////////
  if (card == "suezcrisis") {

    if (this.game.player == 2) {
      this.updateStatus("USSR is playing Suez Crisis");
      return 0;
    }
    if (this.game.player == 1) {

      var twilight_self = this;

      twilight_self.addMove("resolve\tsuezcrisis");
      twilight_self.updateStatus("Remove four influence from Israel, UK or France");

      var ops_to_purge = 4;
      var options_purge = [];
      var options_available = 0;
      let options_purged = {};

      var israel_ops = twilight_self.countries['israel'].us;
      var uk_ops = twilight_self.countries['uk'].us;
      var france_ops = twilight_self.countries['france'].us;

      if (israel_ops > 2) { israel_ops = 2; }
      if (uk_ops > 2)     { uk_ops = 2; }
      if (france_ops > 2) { france_ops = 2; }

      options_available = israel_ops + uk_ops + france_ops;

      if (options_available <= 4) {
 
	this.updateLog("Suez Crisis auto-removed available influence");

	if (israel_ops >= 2) { israel_ops = 2; } else {}
	if (uk_ops >= 2) { uk_ops = 2; } else {}
	if (france_ops >= 2) { france_ops = 2; } else {}

	if (israel_ops > 0) {
          twilight_self.removeInfluence("israel", israel_ops, "us");
  	  twilight_self.addMove("remove\tussr\tus\tisrael\t"+israel_ops);
        }
	if (france_ops > 0) {
	  twilight_self.removeInfluence("france", france_ops, "us");
	  twilight_self.addMove("remove\tussr\tus\tfrance\t"+france_ops);
        }
	if (uk_ops > 0) {
	  twilight_self.removeInfluence("uk", uk_ops, "us");
	  twilight_self.addMove("remove\tussr\tus\tuk\t"+uk_ops);
        }
        twilight_self.endTurn();

      } else {

        if (twilight_self.countries['uk'].us > 0) { options_purge.push('uk'); }
        if (twilight_self.countries['france'].us > 0) { options_purge.push('france'); }
        if (twilight_self.countries['israel'].us > 0) { options_purge.push('israel'); }

        for (let m = 0; m < options_purge.length; m++) {

          let countryname = options_purge[m];
	  options_purged[countryname] = 0;
          twilight_self.countries[countryname].place = 1;

          let divname      = '#'+countryname;

          $(divname).off();
          $(divname).on('click', function() {

	    let c = $(this).attr('id');

            if (twilight_self.countries[c].place != 1) {
	      alert("Invalid Option");
	    } else {
              twilight_self.removeInfluence(c, 1, "us");
	      twilight_self.addMove("remove\tussr\tus\t"+c+"\t1");
	      options_purged[c]++;
	      if (options_purged[c] >= 2) {
		twilight_self.countries[c].place = 0;
	      }
	      ops_to_purge--;
	      if (ops_to_purge == 0) {
                twilight_self.playerFinishedPlacingInfluence();
		alert("All Influence Removed");
                twilight_self.endTurn();
              }
            }
          });
        }
      }
    }
    return 0;
  }




  /////////////////
  // CIA Created //
  /////////////////
  if (card == "cia") {

    if (this.game.player == 2) {
      this.updateStatus("USSR is playing CIA Created");
      return 0;
    }
    if (this.game.player == 1) {

      this.addMove("resolve\tcia");
      this.updateStatus("US is playing CIA Created");

      if (this.game.deck[0].hand.length < 1) {
        this.addMove("ops\tus\tcia\t1");
        this.addMove("notify\tUSSR has no cards to reveal");
        this.endTurn();
      } else {
	let revealed = "";
        for (let i = 0; i < this.game.deck[0].hand.length; i++) {
	  if (i > 0) { revealed += ", "; }
          revealed += this.game.deck[0].cards[this.game.deck[0].hand[i]].name;
        }
        this.addMove("ops\tus\tcia\t1");
        this.addMove("notify\tUSSR holds: "+revealed);
        this.endTurn();
      }
    }
    return 0;
  }




  //////////////
  // Blockade //
  //////////////
  if (card == "blockade") {

    if (this.game.player == 1) {
      this.updateStatus("US is responding to Blockade");
      return 0;
    }
    if (this.game.player == 2) {

      this.addMove("resolve\tblockade");

      let twilight_self = this;
      let available = 0;

      for (let i = 0; i < this.game.deck[0].hand.length; i++) {
	if (this.game.deck[0].hand[i] != "china") {
          let avops = this.modifyOps(this.game.deck[0].cards[this.game.deck[0].hand[i]].ops);
          if (avops >= 3) { available = 1; }
	}
      }

      if (available == 0) {
	this.updateStatus("Blockade played: no cards available to discard.");
	this.addMove("remove\tus\tus\twestgermany\t"+this.countries['westgermany'].us);
	this.addMove("notify\tUS removes all influence from West Germany");
        this.removeInfluence("westgermany", this.countries['westgermany'].us, "us");
	this.endTurn();
	return 0;
      }

      this.updateStatus('Blockade triggers:<p></p><ul><li class="card" id="discard">discard 3 OP card</li><li class="card" id="remove">remove all US influence in W. Germany</li></ul>');

      $('.card').off();
      $('.card').on('click', function() {

        let action = $(this).attr("id");

        if (action == "discard") {
	  let choicehtml = "Choose a card to discard:<p></p><ul>";
	  for (let i = 0; i < twilight_self.game.deck[0].hand.length; i++) {
	    if (twilight_self.modifyOps(twilight_self.game.deck[0].cards[twilight_self.game.deck[0].hand[i]].ops) >= 3 && twilight_self.game.deck[0].hand[i] != "china") {
              choicehtml += '<li class="card showcard" id="'+twilight_self.game.deck[0].hand[i]+'">'+twilight_self.game.deck[0].cards[twilight_self.game.deck[0].hand[i]].name+'</li>';
	    }
	  }
	  choicehtml += '</ul>';
          twilight_self.updateStatus(choicehtml);


          $('.card').off();
          $('.card').on('click', function() {

            let card = $(this).attr("id");

	    twilight_self.removeCardFromHand(card);
  	    twilight_self.addMove("notify\tus discarded "+card);
	    twilight_self.endTurn();
	    return 0;

	  });

        }
        if (action == "remove") {
	  twilight_self.updateStatus("Blockade played: no cards available to discard.");
	  twilight_self.addMove("remove\tus\tus\twestgermany\t"+twilight_self.countries['westgermany'].us);
          twilight_self.removeInfluence("westgermany", twilight_self.countries['westgermany'].us, "us");
	  twilight_self.endTurn();
	  return 0;
        }

      });

      return 0;
    }
  }




  ///////////////////
  // Olympic Games //
  ///////////////////
  if (card == "olympic") {

    let me = "ussr";
    let opponent = "us";
    if (this.game.player == 2) { opponent = "ussr"; me = "us"; }

    if (player == me) {
      this.updateStatus("Opponent is deciding whether to boycott the Olympics");
      return 0;
    } else {

      let twilight_self = this;

      this.addMove("resolve\tolympic");

      twilight_self.updateStatus(opponent.toUpperCase() + ' holds the Olympics:<p></p><ul><li class="card" id="boycott">boycott</li><li class="card" id="participate">participate</li></ul>');

      $('.card').off();
      $('.card').on('click', function() {

        let action = $(this).attr("id");

	if (action == "boycott") {
	  twilight_self.addMove("ops\t"+opponent+"\tolympic\t4");
	  twilight_self.addMove("defcon\tlower");
	  twilight_self.addMove("notify\t"+opponent.toUpperCase()+" plays 4 OPS");
	  twilight_self.addMove("notify\t"+me.toUpperCase()+" boycotts the Olympics");
	  twilight_self.endTurn();
	  return;
	}
	if (action == "participate") {

	  let winner = 0;

	  while (winner == 0) {

  	    let usroll   = twilight_self.rollDice(6);
	    let ussrroll = twilight_self.rollDice(6);

	    twilight_self.addMove("dice\tburn\t"+player);
	    twilight_self.addMove("dice\tburn\t"+player);

	    if (opponent == "us") {
	      usroll += 2;
	    } else {
	      ussrroll += 2;
	    }

	    if (ussrroll > usroll) {
	      twilight_self.addMove("vp\tussr\t2");
	      twilight_self.addMove("notify\tUSSR rolls "+ussrroll+" / US rolls "+usroll);
	      twilight_self.addMove("notify\t"+me.toUpperCase()+" participates in the Olympics");
	      twilight_self.endTurn();
	      winner = 1;
	    }
	    if (usroll > ussrroll) {
	      twilight_self.addMove("vp\tus\t2");
	      twilight_self.addMove("notify\tUSSR rolls "+ussrroll+" / US rolls "+usroll);
	      twilight_self.addMove("notify\t"+me.toUpperCase()+" participates in the Olympics");
	      twilight_self.endTurn();
	      winner = 2;
	    }
	  }
	}
      });
    }

    return 0;
  }





  //////////////////////////
  // East European Unrest //
  //////////////////////////
  if (card == "easteuropean") {

    if (this.game.player == 1) {
      this.updateStatus("US is playing East European Unrest");
      return 0;
    }
    if (this.game.player == 2) {

      var twilight_self = this;

      var ops_to_purge = 1;
      var countries_to_purge = 3;
      var options_purge = [];

      if (this.game.state.round > 7) {
	ops_to_purge = 2;
      }

      twilight_self.addMove("resolve\teasteuropean");

      if (twilight_self.countries['czechoslovakia'].ussr > 0) { options_purge.push('czechoslovakia'); }
      if (twilight_self.countries['austria'].ussr > 0) { options_purge.push('austria'); }
      if (twilight_self.countries['hungary'].ussr > 0) { options_purge.push('hungary'); }
      if (twilight_self.countries['romania'].ussr > 0) { options_purge.push('romania'); }
      if (twilight_self.countries['yugoslavia'].ussr > 0) { options_purge.push('yugoslavia'); }
      if (twilight_self.countries['bulgaria'].ussr > 0) { options_purge.push('bulgaria'); }
      if (twilight_self.countries['eastgermany'].ussr > 0) { options_purge.push('eastgermany'); }
      if (twilight_self.countries['poland'].ussr > 0) { options_purge.push('poland'); }
      if (twilight_self.countries['finland'].ussr > 0) { options_purge.push('finland'); }

      if (options_purge.length <= countries_to_purge) {
	for (let i = 0; i < options_purge.length; i++) {
	  twilight_self.addMove("remove\tus\tussr\t"+options_purge[i]+"\t"+ops_to_purge);
	  twilight_self.removeInfluence(options_purge[i], ops_to_purge, "ussr");
	}
	twilight_self.endTurn();
      } else {

        twilight_self.updateStatus("Remove "+ops_to_purge+" from 3 countries in Eastern Europe");

	var countries_purged = 0;
	   
        for (var i in twilight_self.countries) {

          let countryname  = i;
          let divname      = '#'+i;

          if (i == "czechoslovakia" || i == "austria" || i == "hungary" || i == "romania" || i == "yugoslavia" || i == "bulgaria" ||  i == "eastgermany" || i == "poland" || i == "finland") {

            if (twilight_self.countries[countryname].ussr > 0) {
              twilight_self.countries[countryname].place = 1;
            }

            $(divname).off();
            $(divname).on('click', function() {

	      let c = $(this).attr('id');

              if (twilight_self.countries[c].place != 1) {
	        alert("Invalid Option");
	      } else {
                twilight_self.countries[c].place = 0;
                twilight_self.removeInfluence(c, ops_to_purge, "ussr", function() {
	          twilight_self.addMove("remove\tus\tussr\t"+c+"\t"+ops_to_purge);
                  countries_to_purge--;

                  if (countries_to_purge == 0) {
                    twilight_self.playerFinishedPlacingInfluence();
                    twilight_self.endTurn();
                  }
		});
	      }
	    });
          }
	}
      }

      return 0;
    }
  }




  /////////////////
  // Warsaw Pact //
  /////////////////
  if (card == "warsawpact") {

    this.game.state.events.warsawpact = 1;

    if (this.game.player == 2) { 
      this.updateStatus("Waiting for USSR to play Warsaw Pact");
      return 0; 
    }
    if (this.game.player == 1) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      let html  = "USSR establishes the Warsaw Pact:<p></p><ul>";
          html += '<li class="card" id="remove">remove all US influence in four countries in Eastern Europe</li>';
          html += '<li class="card" id="add">add five USSR influence in Eastern Europe (max 2 per country)</li>';
          html += '</ul>';
      twilight_self.updateStatus(html);

      $('.card').off();
      $('.card').on('click', function() {

        let action2 = $(this).attr("id");

	if (action2 == "remove") {

          twilight_self.addMove("resolve\twarsawpact");
          twilight_self.updateStatus('Remove all US influence from four countries in Eastern Europe');

          var countries_to_purge = 4;
          var options_purge = [];

	  if (twilight_self.countries['czechoslovakia'].us > 0) { options_purge.push('czechoslovakia'); }
	  if (twilight_self.countries['austria'].us > 0) { options_purge.push('austria'); }
	  if (twilight_self.countries['hungary'].us > 0) { options_purge.push('hungary'); }
	  if (twilight_self.countries['romania'].us > 0) { options_purge.push('romania'); }
	  if (twilight_self.countries['yugoslavia'].us > 0) { options_purge.push('yugoslavia'); }
	  if (twilight_self.countries['bulgaria'].us > 0) { options_purge.push('bulgaria'); }
	  if (twilight_self.countries['eastgermany'].us > 0) { options_purge.push('eastgermany'); }
	  if (twilight_self.countries['poland'].us > 0) { options_purge.push('poland'); }
	  if (twilight_self.countries['finland'].us > 0) { options_purge.push('finland'); }

	  if (options_purge.length <= countries_to_purge) {

	    for (let i = 0; i < options_purge.length; i++) {
	      twilight_self.removeInfluence(options_purge[i], twilight_self.countries[options_purge[i]].us, "us");
	      twilight_self.addMove("remove\tus\tus\t"+options_purge[i]+"\t"+twilight_self.countries[options_purge[i]].us);
	    }

	    twilight_self.endTurn();

	  } else {

	    var countries_purged = 0;

            for (var i in this.countries) {

              let countryname  = i;
              let divname      = '#'+i;

              if (i == "czechoslovakia" || i == "austria" || i == "hungary" || i == "romania" || i == "yugoslavia" || i == "bulgaria" ||  i == "eastgermany" || i == "poland" || i == "finland") {

	        if (twilight_self.countries[countryname].us > 0) {
                  twilight_self.countries[countryname].place = 1;
		}

                $(divname).off();
                $(divname).on('click', function() {

		  let c = $(this).attr('id');

                  if (twilight_self.countries[c].place != 1) {
		    alert("Invalid Option");
		  } else {
                    twilight_self.countries[c].place = 0;
 		    let uspur = twilight_self.countries[c].us;
                    twilight_self.removeInfluence(c, uspur, "us", function() {
	              twilight_self.addMove("remove\tus\tus\t"+c+"\t"+uspur);
                      countries_purged--;
                      if (countries_purged == countries_to_purge) {
                        twilight_self.playerFinishedPlacingInfluence();
                        twilight_self.endTurn();
                      }
		    });
		  }
	        });
              }
	    }
          }
	}
	if (action2 == "add") {

          twilight_self.addMove("resolve\twarsawpact");
          twilight_self.updateStatus('Add five influence in Eastern Europe (max 2 per country)');

          var ops_to_place = 5;
	  var ops_placed = {};

          for (var i in twilight_self.countries) {

            let countryname  = i;
	    ops_placed[countryname] = 0;
            let divname      = '#'+i;

            if (i == "czechoslovakia" || i == "austria" || i == "hungary" || i == "romania" || i == "yugoslavia" || i == "bulgaria" ||  i == "eastgermany" || i == "poland" || i == "finland") {

              twilight_self.countries[countryname].place = 1;

              $(divname).off();
              $(divname).on('click', function() {

		let c = $(this).attr('id');

                if (twilight_self.countries[c].place != 1) {
		  alert("Invalid Placement");
		} else {
		  ops_placed[c]++;
                  twilight_self.placeInfluence(c, 1, "ussr", function() {
		    twilight_self.addMove("place\tussr\tussr\t"+c+"\t1");
		    if (ops_placed[c] >= 2) { twilight_self.countries[c].place = 0; }
                    ops_to_place--;
                    if (ops_to_place == 0) {
                      twilight_self.playerFinishedPlacingInfluence();
                      twilight_self.endTurn();
                    }
		  });
		}
	      });
            }
	  }
	}
      });
      return 0;
    }
 
    return 1;
  }




  /////////////////////
  // Destalinization //
  /////////////////////
  if (card == "destalinization") {

    if (this.game.player == 2) {
      this.updateStatus("USSR is playing Destalinization");
      return 0;
    }
    if (this.game.player == 1) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      twilight_self.addMove("resolve\tdestalinization");

      twilight_self.updateStatus('Remove four USSR influence from existing countries:');

      let ops_to_purge = 4;

      for (var i in this.countries) {

        let countryname  = i;
        let divname      = '#'+i;

        $(divname).off();
        $(divname).on('click', function() {

	  let c = $(this).attr('id');

          if (twilight_self.countries[c].ussr <= 0) { 
	    alert("Invalid Option"); 
	    return;
          } else {
            twilight_self.removeInfluence(c, 1, "ussr");
	    twilight_self.addMove("remove\tussr\tussr\t"+c+"\t1");
	    ops_to_purge--;
	    if (ops_to_purge == 0) {

              twilight_self.updateStatus('Add four USSR influence to any non-US controlled countries');

              twilight_self.playerFinishedPlacingInfluence();

              var ops_to_place = 4;
              var countries_placed = {};

              for (var i in twilight_self.countries) {

		countries_placed[i] = 0;
                let countryname  = i;
                let divname      = '#'+i;

                $(divname).off();
                $(divname).on('click', function() {

	          let cn = $(this).attr('id');
                  if (twilight_self.isControlled("us", cn) == 1) {
		    alert("Cannot re-allocate to US controlled countries");
		    return;
		  } else {
                    if (countries_placed[cn] == 2) {
		      alert("Cannot place more than 2 influence in any one country");
		      return;
		    } else {
                      twilight_self.placeInfluence(cn, 1, "ussr");
	              twilight_self.addMove("place\tussr\tussr\t"+cn+"\t1");
	              ops_to_place--;
		      countries_placed[cn]++;
	              if (ops_to_place == 0) {
		        twilight_self.playerFinishedPlacingInfluence();
		        twilight_self.endTurn();
		      }
		    }
		  }
		});
	      }
	    }
          }
	});
      }
    }
    return 0;
  }



  ///////////////
  // Red Scare //
  ///////////////
  if (card == "redscare") {
    if (player == "ussr") { this.game.state.events.redscare_player2 = 1; }
    if (player == "us") { this.game.state.events.redscare_player1 = 1; }
    return 1;
  }


  ///////////
  // Fidel //
  ///////////
  if (card == "fidel") {
    let usinf = parseInt(this.countries['cuba'].us);
    let ussrinf = parseInt(this.countries['cuba'].ussr);
    this.removeInfluence("cuba", usinf, "us");
    if (ussrinf < 3) {
      this.placeInfluence("cuba", (3-ussrinf), "ussr");
    }
    return 1;
  }



  //////////////////////
  // Nuclear Test Ban //
  //////////////////////
  if (card == "nucleartestban") {

    let vpchange = this.game.state.defcon-2;
    if (vpchange < 0) { vpchange = 0; }
    this.game.state.defcon = this.game.state.defcon+2;
    if (this.game.state.defcon > 5) { this.game.state.defcon = 5; }

    if (player == "us") {
      this.game.state.vp = this.game.state.vp+vpchange;
    } else {
      this.game.state.vp = this.game.state.vp-vpchange;
    }
    this.updateVictoryPoints();
    this.updateDefcon();

    return 1;
  }


  ////////////////////
  // Duck and Cover //
  ////////////////////
  if (card == "duckandcover") {

    this.lowerDefcon();
    this.updateDefcon();

    let vpchange = 5-this.game.state.defcon;

    if (this.game.state.defcon <= 1) {
      if (this.game.state.turn == 0) { 
        this.endGame("ussr", "defcon");
      } else {
        this.endGame("us", "defcon");
      }

      return;

    } else {

      this.game.state.vp = this.game.state.vp+vpchange;
      this.updateVictoryPoints();

    }
    return 1;
  }


  ////////////////////
  // Five Year Plan //
  ////////////////////
  if (card == "fiveyearplan") {

    let twilight_self = this;

    //
    // US has to wait for Soviets to execute
    // burn 1 roll
    //
    if (this.game.player == 2) { 
      let burnrand = this.rollDice();
      return 0; 
    }

    //
    // Soviets self-report - TODO provide proof
    // of randomness
    //
    if (this.game.player == 1) {

      twilight_self.addMove("resolve\tfiveyearplan");

      let size_of_hand_minus_china_card = this.game.deck[0].hand.length;
      for (let i = 0; i < this.game.deck[0].hand.length; i++) {
	if (this.game.deck[0].hand == "china") { size_of_hand_minus_china_card--; }
      }


      if (size_of_hand_minus_china_card < 1) {
	// burn roll anyway as US will burn
        let burnrand = this.rollDice();
	alert("No cards left to discard");
  	this.addMove("notify\tUSSR has no cards to discard");
	this.endTurn();
	return 0;
      } else {

	let twilight_self = this;

        twilight_self.rollDice(twilight_self.game.deck[0].hand.length, function(roll) {
	  roll = parseInt(roll)-1;
          let card = twilight_self.game.deck[0].hand[roll];

	  if (card == "china") {
	    if (roll-1 >= 0) { card = twilight_self.game.deck[0].hand[roll-1]; } else {
  	      card = twilight_self.game.deck[0].hand[roll+1];
	    }
	  }

	  twilight_self.removeCardFromHand(card);
	  if (twilight_self.game.deck[0].cards[card].player == "us") {
	    alert("You have rolled: " + card);
	    twilight_self.addMove("event\tus\t"+card);
            twilight_self.endTurn();
          } else {
	    alert("You have rolled: " + card);
  	    twilight_self.addMove("notify\tUSSR discarded "+card);
            twilight_self.endTurn();
          }
        });

        return 0;
      }
      return 0;
    }
  }



  ///////////////////////////
  // DeGaulle Leads France //
  ///////////////////////////
  if (card == "degaulle") {
    this.game.state.events.degaulle = 1;
    this.removeInfluence("france", 2, "us");
    this.placeInfluence("france", 1, "ussr");
    return 1;
  }

  /////////////////////////
  // Romanian Abdication //
  /////////////////////////
  if (card == "romanianab") {
    let usinf = parseInt(this.countries['romania'].us);
    let ussrinf = parseInt(this.countries['romania'].ussr);
    this.removeInfluence("romania", usinf, "us");
    if (ussrinf < 3) {
      this.placeInfluence("romania", (3-ussrinf), "ussr");
    }
    return 1;
  }



  /////////////////////////
  // US / Japan Alliance //
  /////////////////////////
  if (card == "usjapan") {
    this.game.state.events.usjapan = 1;
    let usinf = parseInt(this.countries['japan'].us);
    let ussrinf = parseInt(this.countries['japan'].ussr);
    let targetinf = ussrinf + 4;
    this.placeInfluence("japan", (targetinf - usinf), "us");
    return 1;
  }





















  /////////////
  // MID WAR //
  /////////////
  //
  // scoring
  //
  if (card == "seasia") {
    this.scoreRegion("seasia");
    return 1;
  }
  if (card == "southamerica") {
    this.scoreRegion("southamerica");
    return 1;
  }
  if (card == "centralamerica") {
    this.scoreRegion("centralamerica");
    return 1;
  }
  if (card == "africa") {
    this.scoreRegion("africa");
    return 1;
  }



  //
  // Willy Brandt
  //
  if (card == "willybrandt") {

    if (this.game.state.events.teardown == 1) {
      this.updateLog("Willy Brandt canceled by Tear Down this Wall");
      return 1;
    }

    this.game.state.vp -= 1;
    this.updateVictoryPoints();

    this.countries["westgermany"].ussr += 1;
    this.showInfluence("westgermany", "ussr");

    this.game.state.events.nato_westgermany = 0;
    this.game.state.events.willybrandt = 1;

    return 1;
  }




  //
  // Muslim Revolution
  //
  if (card == "muslimrevolution") {

    if (this.game.state.events.awacs == 1) { return 1; }

    var countries_to_purge = 2; 
    let countries_with_us_influence = 0;
    if (this.countries["sudan"].us > 0) { countries_with_us_influence++; }
    if (this.countries["egypt"].us > 0) { countries_with_us_influence++; }
    if (this.countries["libya"].us > 0) { countries_with_us_influence++; }
    if (this.countries["syria"].us > 0) { countries_with_us_influence++; }
    if (this.countries["iran"].us > 0) { countries_with_us_influence++; }
    if (this.countries["iraq"].us > 0) { countries_with_us_influence++; }
    if (this.countries["jordan"].us > 0) { countries_with_us_influence++; }
    if (this.countries["saudiarabia"].us > 0) { countries_with_us_influence++; }
    if (countries_with_us_influence < countries_to_purge) { countries_to_purge = countries_with_us_influence; }
    if (countries_with_us_influence == 0) {
      this.updateLog("No countries with US influence to remove");
      return 1;
    }

    if (this.game.player == 2) { this.updateStatus("USSR is playing Muslim Revolution"); return 0; }
    if (this.game.player == 1) {

      this.updateStatus("Remove All US influence from 2 countries among: Sudan, Egypt, Iran, Iraq, Libya, Saudi Arabia, Syria, Joran.");

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();
      twilight_self.addMove("resolve\tmuslimrevolution");

      for (var i in this.countries) {

        let countryname  = i;
        let divname      = '#'+i;

        if (i == "sudan" || i == "egypt" || i == "iran" || i == "iraq" || i == "libya" || i == "saudiarabia" || i == "syria" || i == "jordan") {

	  if (this.countries[i].us > 0) { countries_with_us_influence++; }

          $(divname).off();
          $(divname).on('click', function() {

	    let c = $(this).attr('id');

            if (twilight_self.countries[c].us <= 0) {
	      alert("Invalid Country");
	    } else {
	      let purginf = twilight_self.countries[c].us;
              twilight_self.removeInfluence(c, purginf, "us", function() {
	        twilight_self.addMove("remove\tussr\tus\t"+c+"\t"+purginf);
	        countries_to_purge--;
                if (countries_to_purge == 0) {
                  twilight_self.playerFinishedPlacingInfluence();
                  twilight_self.endTurn();
                }
              });
            }
          });
        }
      }
    }
    return 0;
  }







  //
  // Shuttle Diplomacy
  //
  if (card == "shuttle") { 
    this.game.state.events.shuttlediplomacy = 1;
    return 1;
  }



  //
  // Latin American Death Squads
  //
  if (card == "deathsquads") { 
    if (player == "ussr") { this.game.state.events.deathsquads = 1; }
    if (player == "us") { this.game.state.events.deathsquads = 2; }
    return 1;
  }





  //
  // Grain Sales to Soviets
  //
  if (card == "grainsales") { 

    //
    // US has to wait for Soviets to execute
    // burn 1 roll
    //
    if (this.game.player == 2) {
      this.updateStatus("Waiting for random card from USSR");
      let burnrand = this.rollDice();
      return 0;
    }

    //
    // Soviets self-report - TODO provide proof
    // of randomness
    //
    if (this.game.player == 1) {

      this.updateStatus("Sending random card to USSR");
      this.addMove("resolve\tgrainsales");

      if (this.game.deck[0].hand.length < 1) {
        let burnrand = this.rollDice();
        this.addMove("ops\tus\tgrainsales\t2");
        this.addMove("notify\tUSSR has no cards to discard");
        this.endTurn();
        return 0;
      } else {

        let twilight_self = this;

        if (this.game.deck[0].hand.length == 1 && this.game.deck[0].hand[0] == "china") {
          let burnrand = this.rollDice();
          this.addMove("ops\tus\tgrainsales\t2");
          this.addMove("notify\tUSSR has no cards to discard");
          this.endTurn();
          return 0;
	}

        twilight_self.rollDice(twilight_self.game.deck[0].hand.length, function(roll) {
	  roll = parseInt(roll)-1;
          let card = twilight_self.game.deck[0].hand[roll];

	  if (card == "china") {
	    if (roll > 0) { roll--; } else { roll++; }
            card = twilight_self.game.deck[0].hand[roll];
	  }

          twilight_self.removeCardFromHand(card);
          twilight_self.addMove("grainsales\tussr\t"+card);
          twilight_self.addMove("notify\tUSSR shares "+twilight_self.game.deck[0].cards[card].name);
          twilight_self.endTurn();
        });
      }
    }
    return 0;
  }




  //
  // Missile Envy
  //
  if (card == "missileenvy") { 

    let instigator = 1;
    let opponent = "us"; 
    if (player == "us") { instigator = 2; opponent = "ussr"; }
    this.game.state.events.missileenvy = 1;

    //
    //
    //
    if (this.game.player == instigator) {
      this.updateStatus("Opponent is returning card for Missile Envy");
      return 0;
    }

    //
    // targeted player provided list if multiple options available
    //
    if (this.game.player != instigator) {

      this.addMove("resolve\tmissileenvy");

      let selected_card  = "";
      let selected_ops   = 0;
      let multiple_cards = 0;

      if (this.game.deck[0].hand.length == 0) {
        this.addMove("notify\t"+opponent.toUpperCase()+" hand contains no cards.");
        this.endTurn();
	return 0;
      }


      for (let i = 0; i < this.game.deck[0].hand.length; i++) {

	if (this.game.deck[0].hand[i] == "china") { 
	  i++;
	  if (this.game.deck[0].hand.length < 2) {
            this.addMove("notify\t"+opponent.toUpperCase()+" hand contains only the China card.");
            this.endTurn();
	    return 0;
	  }
	}

	if (i < this.game.deck[0].hand.length) {

  	  let card = this.game.deck[0].cards[this.game.deck[0].hand[i]];

          if (card != "china") {
	    if (card.ops == selected_ops) {
	      multiple_cards++;
	    }
	    if (card.ops > selected_ops) {
	      selected_ops  = card.ops;
	      selected_card = this.game.deck[0].hand[i];
	      multiple_cards = 0;
            }
          }
	}
      }


      if (multiple_cards == 0) {

        //
        // offer highest card
        //
        this.addMove("missileenvy\t"+this.game.player+"\t"+selected_card);	
        this.endTurn();

      } else {

        //
        // select highest card
        //
        let user_message = "Select card to give opponent:<p></p><ul>";
        for (let i = 0; i < this.game.deck[0].hand.length; i++) {
          if (this.game.deck[0].cards[this.game.deck[0].hand[i]].ops == selected_ops && this.game.deck[0].hand[i] != "china") {
            user_message += '<li class="card showcard" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name+'</li>';
          }
        }
        user_message += '</ul>';
        this.updateStatus(user_message);

	let twilight_self = this;

        $('.card').off();
        $('.card').on('click', function() {

          let action2 = $(this).attr("id");

          //
          // offer card
          //
          twilight_self.addMove("missileenvy\t"+twilight_self.game.player+"\t"+action2);	
          twilight_self.endTurn();

        });
      }
    }
    return 0;
  }






  //
  // Che
  //
  if (card == "che") {

    let twilight_self = this;
    let valid_targets = 0;
    let couppower = 3;

    if (player == "us") { couppower = this.modifyOps(3,2); }
    if (player == "ussr") { couppower = this.modifyOps(3,1); }

    for (var i in this.countries) {
      let countryname = i;
      if ( twilight_self.countries[countryname].bg == 0 && (twilight_self.countries[countryname].region == "africa" || twilight_self.countries[countryname].region == "camerica" || twilight_self.countries[countryname].region == "samerica") && twilight_self.countries[countryname].us > 0 ) {
	valid_targets++;
      }
    }

    if (valid_targets == 0) {
      this.updateLog("No valid targets for Che");
      return 1;
    }

    if (this.game.player == 2) {
      this.updateStatus("Waiting for USSR to play Che");
      return 0;
    }
    if (this.game.player == 1) {

      twilight_self.playerFinishedPlacingInfluence();
      let user_message = "Che takes effect. Pick first target for coup:<p></p><ul>";
          user_message += '<li class="card" id="skipche">or skip coup</li>';
          user_message += '</ul>';
      twilight_self.updateStatus(user_message);

      $('.card').off();
      $('.card').on('click', function() {
        let action2 = $(this).attr("id");
	if (action2 == "skipche") {
	  twilight_self.updateStatus("Skipping Che coups...");
	  twilight_self.addMove("resolve\tche");
	  twilight_self.endTurn();
	}
      });

      for (var i in twilight_self.countries) {

        let countryname  = i;
        let divname      = '#'+i;

        if ( twilight_self.countries[countryname].bg == 0 && (twilight_self.countries[countryname].region == "africa" || twilight_self.countries[countryname].region == "camerica" || twilight_self.countries[countryname].region == "samerica") && twilight_self.countries[countryname].us > 0 ) {

          $(divname).off();
          $(divname).on('click', function() {

	    let c = $(this).attr('id');

	    twilight_self.addMove("resolve\tche");
	    twilight_self.addMove("checoup\tussr\t"+c+"\t"+couppower);
            twilight_self.addMove("milops\tussr\t"+couppower);
	    twilight_self.endTurn();
	  });
	} else {

          $(divname).off();
          $(divname).on('click', function() {
	    alert("Invalid Target");
	  });

        }
      }
    }
    return 0;
  }











  //
  // Ask Not What Your Country Can Do For You
  //
  if (card == "asknot") {

    if (this.game.player == 1) {
      this.updateStatus("Waiting for US to play Ask Not What Your Country Can Do For You");
      return 0;
    }
    if (this.game.player == 2) {

      var twilight_self = this;
      let cards_discarded = 0;

      let cards_to_discard = 0;
      let user_message = "Select cards to discard:<p></p><ul>";
      for (let i = 0; i < this.game.deck[0].hand.length; i++) {
	if (this.game.deck[0].hand[i] != "china") {
          user_message += '<li class="card logcard" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name+'</li>';
	  cards_to_discard++;
	}
      }

      if (cards_to_discard == 0) {
	twilight_self.addMove("notify\tUS has no cards available to discard");
        twilight_self.endTurn();
	return;
      }

      user_message += '</ul><p></p>When you are done discarding <span class="card dashed" id="finished">click here</span>.';

      twilight_self.updateStatus(user_message);
      twilight_self.addMove("resolve\tasknot");

      $('.card').off();
      $('.logcard').off();
      $('.logcard').mouseover(function() {
        let card = $(this).attr("id");
        twilight_self.showCard(card);
      }).mouseout(function() {
        let card = $(this).attr("id");
        twilight_self.hideCard(card);
      });
      $('.card').on('click', function() {

        let action2 = $(this).attr("id");

        if (action2 == "finished") {

	  //
	  // if Aldrich Ames is active, US must reveal cards
	  //
          if (twilight_self.game.state.events.aldrich == 1) {
            twilight_self.addMove("aldrichreveal\tus");
	  }

          twilight_self.addMove("DEAL\t1\t2\t"+cards_discarded);

	  //
	  // are there enough cards available, if not, reshuffle
	  //
	  if (cards_discarded > twilight_self.game.deck[0].crypt.length) {

            let discarded_cards = twilight_self.returnDiscardedCards();
            if (Object.keys(discarded_cards).length > 0) {

              //
              // shuffle in discarded cards
              //
              twilight_self.addMove("SHUFFLE\t1");
              twilight_self.addMove("DECKRESTORE\t1");
              twilight_self.addMove("DECKENCRYPT\t1\t2");
              twilight_self.addMove("DECKENCRYPT\t1\t1");
              twilight_self.addMove("DECKXOR\t1\t2");
              twilight_self.addMove("DECKXOR\t1\t1");
              twilight_self.addMove("flush\tdiscards"); // opponent should know to flush discards as we have
              twilight_self.addMove("DECK\t1\t"+JSON.stringify(discarded_cards));
              twilight_self.addMove("DECKBACKUP\t1");
              twilight_self.updateLog("cards remaining: " + twilight_self.game.deck[0].crypt.length);
              twilight_self.updateLog("Shuffling discarded cards back into the deck...");

            }
	  }

          twilight_self.endTurn();

        } else {
          $(this).hide();
	  cards_discarded++;
          twilight_self.removeCardFromHand(action2);
          twilight_self.addMove("discard\tus\t"+action2);
        }
      });
    }

    return 0;
  }




  //
  // Salt Negotiations
  //
  if (card == "saltnegotiations") { 

    // update defcon
    this.game.state.defcon += 2;
    if (this.game.state.defcon > 5) { this.game.state.defcon = 5; }
    this.updateDefcon();

    // affect coups
    this.game.state.events.saltnegotiations = 1;

    // otherwise sort through discards
    let discardlength = 0;
    for (var i in this.game.deck[0].discards) { discardlength++; }
    if (discardlength == 0) {
      this.updateLog("No cards in discard pile");
      return 1;
    }

    let my_go = 0;

    if (player == "ussr" && this.game.player == 1) { my_go = 1; }
    if (player == "us" && this.game.player == 2) { my_go = 1; }

    if (my_go == 0) {
      this.updateStatus("Opponent retrieving card from discard pile");
      return 0;
    }

    // pick discarded card
    var twilight_self = this;

    let user_message = "Pick Card to Reclaim:<p></p><ul>";
    for (var i in this.game.deck[0].discards) {
      if (this.game.deck[0].discards[i].scoring == 0) {
        user_message += '<li class="card showcard" id="'+i+'">'+this.game.deck[0].discards[i].name+'</li>';
      }
    }
    user_message += '<li class="card showcard" id="nocard">do not reclaim card...</li>';
    user_message += "</ul>";
    twilight_self.updateStatus(user_message);

    twilight_self.addMove("resolve\tsaltnegotiations");


    $('.card').off();
    $('.card').on('click', function() {

      let action2 = $(this).attr("id");

      if (action2 != "nocard") {
        twilight_self.game.deck[0].hand.push(action2);
        twilight_self.addMove("notify\t"+player+" retrieved "+twilight_self.game.deck[0].cards[action2].name);
      } else {
        twilight_self.addMove("notify\t"+player+" does not retrieve card");
      }
      twilight_self.endTurn();
    });

    return 0;
  }




  //
  // Our Man in Tehran
  //
  if (card == "tehran") { 

    let usc = 0;

    if (this.isControlled("us", "egypt") == 1) { usc = 1; }
    if (this.isControlled("us", "libya") == 1) { usc = 1; }
    if (this.isControlled("us", "israel") == 1) { usc = 1; }
    if (this.isControlled("us", "lebanon") == 1) { usc = 1; }
    if (this.isControlled("us", "syria") == 1) { usc = 1; }
    if (this.isControlled("us", "iraq") == 1) { usc = 1; }
    if (this.isControlled("us", "iran") == 1) { usc = 1; }
    if (this.isControlled("us", "jordan") == 1) { usc = 1; }
    if (this.isControlled("us", "gulfstates") == 1) { usc = 1; }
    if (this.isControlled("us", "saudiarabia") == 1) { usc = 1; }

    if (usc == 0) {
      this.updateLog("US does not control any Middle-East Countries");
      return 1;
    }

    this.game.state.events.ourmanintehran = 1;

    if (this.game.player == 2) {
      this.updateStatus("Waiting for USSR to provide keys to examine deck");
    }
    if (this.game.player == 1) {
      this.addMove("resolve\ttehran"); 
      let keys_given = 0;
      for (let i = 0; i < this.game.deck[0].crypt.length && i < 5; i++) {
	this.addMove(this.game.deck[0].keys[i]);
	keys_given++;
      } 
      this.addMove("tehran\tussr\t"+keys_given);
      this.endTurn();
    }
    return 0;
  }




  //
  // Flower Power
  //
  if (card == "flowerpower") { 
    if (this.game.state.events.evilempire == 1) {
      this.updateLog("Flower Power prevented by Evil Empire");
      return 1;
    }
    this.game.state.events.flowerpower = 1;
    return 1;
  }




  //
  // Quagmire
  //
  if (card == "quagmire") { 
    this.game.state.events.norad = 0;
    this.game.state.events.quagmire = 1;
    return 1;
  }


  //
  // Bear Trap
  //
  if (card == "beartrap") { 
    this.game.state.events.beartrap = 1;
    return 1;
  }




  //
  // Summit
  //
  if (card == "summit") { 

    let us_roll = this.rollDice(6);
    let ussr_roll = this.rollDice(6);

    this.updateLog("Summit: US rolls "+us_roll+" and USSR rolls "+ussr_roll);

    if (this.doesPlayerDominateRegion("ussr", "europe") == 1)   { ussr_roll++; }
    if (this.doesPlayerDominateRegion("ussr", "mideast") == 1)  { ussr_roll++; }
    if (this.doesPlayerDominateRegion("ussr", "asia") == 1)     { ussr_roll++; }
    if (this.doesPlayerDominateRegion("ussr", "africa") == 1)   { ussr_roll++; }
    if (this.doesPlayerDominateRegion("ussr", "camerica") == 1) { ussr_roll++; }
    if (this.doesPlayerDominateRegion("ussr", "samerica") == 1) { ussr_roll++; }

    if (this.doesPlayerDominateRegion("us", "europe") == 1)   { us_roll++; }
    if (this.doesPlayerDominateRegion("us", "mideast") == 1)  { us_roll++; }
    if (this.doesPlayerDominateRegion("us", "asia") == 1)     { us_roll++; }
    if (this.doesPlayerDominateRegion("us", "africa") == 1)   { us_roll++; }
    if (this.doesPlayerDominateRegion("us", "camerica") == 1) { us_roll++; }
    if (this.doesPlayerDominateRegion("us", "samerica") == 1) { us_roll++; }

    let is_winner = 0;

    if (us_roll > ussr_roll) { is_winner = 1; }
    if (ussr_roll > us_roll) { is_winner = 1; }

    if (is_winner == 0) { 
      return 1; 
    } else {

      //
      // winner
      //
      let my_go = 0;
      if (us_roll > ussr_roll && this.game.player == 2) { my_go = 1; }
      if (ussr_roll > us_roll && this.game.player == 1) { my_go = 1; }

      if (my_go == 1) {
 
	let twilight_self = this;

        twilight_self.addMove("resolve\tsummit"); 

        if (us_roll > ussr_roll) {
	  twilight_self.addMove("vp\tus\t2");
        } else {
 	  twilight_self.addMove("vp\tussr\t2");
        }

        let x = 0;
        let y = 0;

        this.updateStatus('You win the Summit:<p></p><ul><li class="card" id="raise">raise DEFCON</li><li class="card" id="lower">lower DEFCON</li></ul>');

        $('.card').off();
        $('.card').on('click', function() {

          let action2 = $(this).attr("id");

  	  if (action2 == "raise") {
	    twilight_self.updateStatus("broadcasting choice....");
            twilight_self.addMove("resolve\tsummit");
            twilight_self.addMove("defcon\traise");
	    twilight_self.endTurn();
          }
  	  if (action2 == "lower") {
	    twilight_self.updateStatus("broadcasting choice....");
            twilight_self.addMove("resolve\tsummit");
            twilight_self.addMove("defcon\tlower");
	    twilight_self.endTurn();
          }

        });
      }
      return 0;
    }
  }




  //
  // Nuclear Subs
  //
  if (card == "nuclearsubs") { 
    this.game.state.events.nuclearsubs = 1;
    return 1;
  }



  //
  // Cuban Missile Crisis
  //
  if (card == "cubanmissile") {
    this.game.state.defcon = 2;
    this.updateDefcon();
    if (player == "ussr") { this.game.state.events.cubanmissilecrisis = 2; }
    if (player == "us") { this.game.state.events.cubanmissilecrisis = 1; }
    return 1;
  }




  //
  // Junta
  //
  if (card == "junta") { 

    this.game.state.events.junta = 1;

    let my_go = 0;
    if (player == "ussr" && this.game.player == 1) { my_go = 1; }
    if (player == "us" && this.game.player == 2) { my_go = 1; }

    if (my_go == 0) {
      this.updateStatus(player.toUpperCase() + " playing Junta");
    }
    if (my_go == 1) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      twilight_self.updateStatus(player.toUpperCase() + ' to place 2 Influence in Central or South America');

      for (var i in this.countries) {

        let countryname  = i;
        let divname      = '#'+i;
	let countries_with_us_influence = 0;

        if (this.countries[i].region === "samerica" || this.countries[i].region === "camerica") {

	  let divname = '#'+i;

          $(divname).off();
          $(divname).on('click', function() {

	    let c = $(this).attr('id');

	    twilight_self.placeInfluence(c, 2, player, function() {

      	      let confirmoptional = 'Do you wish to launch a free coup or conduct realignment rolls in Central or South America with the Junta card?<p></p><ul><li class="card" id="conduct">coup or realign</li><li class="card" id="skip">skip</li></ul>';
	      twilight_self.updateStatus(confirmoptional);

	      $('.card').off();
	      $('.card').on('click', function() {

                let action2 = $(this).attr("id");

                if (action2 == "conduct") {
               	  twilight_self.addMove("resolve\tjunta");
                  twilight_self.addMove("unlimit\tplacement");
                  twilight_self.addMove("unlimit\tmilops");
                  twilight_self.addMove("unlimit\tregion");
                  twilight_self.addMove("ops\t"+player+"\tjunta\t2");
                  twilight_self.addMove("limit\tregion\teurope");
                  twilight_self.addMove("limit\tregion\tafrica");
                  twilight_self.addMove("limit\tregion\tmideast");
                  twilight_self.addMove("limit\tregion\tasia");
                  twilight_self.addMove("limit\tmilops");
                  twilight_self.addMove("limit\tplacement");
                  twilight_self.addMove("place\t"+player+"\t"+player+"\t"+c+"\t2");
                  twilight_self.playerFinishedPlacingInfluence();
                  twilight_self.endTurn();
                }

                if (action2 == "skip") {
               	  twilight_self.addMove("resolve\tjunta");
                  twilight_self.addMove("place\t"+player+"\t"+player+"\t"+c+"\t2");
                  twilight_self.playerFinishedPlacingInfluence();
                  twilight_self.endTurn();
                }

	      });
	    });
          });
	}
      }
    }
    return 0;
  }





  //
  // ABM Treaty
  //
  if (card == "abmtreaty") {
 
    this.updateStatus(player.toUpperCase() + " plays ABM Treaty");
    this.updateLog("DEFCON increases by 1");

    this.game.state.defcon++;
    if (this.game.state.defcon > 5) { this.game.state.defcon = 5; }
    this.updateDefcon();

    let did_i_play_this = 0;

    if (player == "us" && this.game.player == 2)   { did_i_play_this = 1; }
    if (player == "ussr" && this.game.player == 1) { did_i_play_this = 1; }

    if (did_i_play_this == 1) {
      this.addMove("resolve\tabmtreaty");
      this.addMove("ops\t"+player+"\tabmtreaty\t4");
      this.endTurn();
    }
  
    return 0;
  }










  //
  // Cultural Revolution
  //
  if (card == "culturalrev") {

    if (this.game.state.events.china_card == 1) {

      this.game.state.vp -= 1;
      this.updateVictoryPoints();

    } else {

      if (this.game.state.events.china_card == 2) {

	if (this.game.player == 1) {
	  this.game.deck[0].hand.push("china");
	}
	this.game.state.events.china_card = 0;

      } else {

	//
	// it is in one of our hands
	//
        if (this.game.player == 1) {

	  let do_i_have_cc = 0;

          for (let i = 0; i < this.game.deck[0].hand.length; i++) {
    	    if (this.game.deck[0].hand[i] == "china") {
	      do_i_have_cc = 1;  
	    }
          }

	  if (do_i_have_cc == 1) {
	    this.game.state.vp -= 1;
	    this.updateVictoryPoints();
	  } else {
	    if (! this.game.deck[0].hand.includes("china")) {
	      this.game.deck[0].hand.push("china");
	    }
	    this.game.state.events.china_card = 0;
	  }

        }
        if (this.game.player == 2) {

  	  let do_i_have_cc = 0;

          for (let i = 0; i < this.game.deck[0].hand.length; i++) {
    	    if (this.game.deck[0].hand[i] == "china") {
	      do_i_have_cc = 1;  
	    }
          }

	  if (do_i_have_cc == 1) {
	    for (let i = 0; i < this.game.deck[0].hand.length; i++) {
	      if (this.game.deck[0].hand[i] == "china") {
	        this.game.deck[0].hand.splice(i, 1);
	        return 1;
	      }
	    }
	  } else {
	    this.game.state.vp -= 1;
	    this.updateVictoryPoints();
	  }
        }
      }
    }
    return 1;
  }






  //
  // Nixon Plays the China Card
  //
  if (card == "nixon") {

    let does_us_get_vp = 0;

    if (this.game.state.events.china_card == 2) {
      does_us_get_vp = 1;
    } else {

      if (this.game.state.events.china_card == 1) {
	this.game.state.events.china_card = 2; 
      } else {

        if (this.game.player == 2) {
          for (let i = 0; i < this.game.deck[0].hand.length; i++) {
    	    if (this.game.deck[0].hand[i] == "china") {
	      does_us_get_vp = 1;  
	    }
          }
        }
        if (this.game.player == 1) {
  	  does_us_get_vp = 1;
          for (let i = 0; i < this.game.deck[0].hand.length; i++) {
    	    if (this.game.deck[0].hand[i] == "china") {
	      does_us_get_vp = 0;  
	    }
          }
        }
      }
    }

    if (does_us_get_vp == 1) {
      this.game.state.vp += 2;
      this.updateVictoryPoints();
      this.updateLog("US gets 2 VP from Nixon");
    } else {
      if (this.game.player == 1) {
	for (let i = 0; i < this.game.deck[0].hand.length; i++) {
	  if (this.game.deck[0].hand[i] == "china") {
	    this.updateLog("US gets the China Card (face down)");
	    this.game.deck[0].hand.splice(i, 1);
	  }
	}
      }
      this.game.state.events.china_card = 2;
    }

    return 1;
  }




  //
  // Kitchen Debates
  //
  if (card == "kitchendebates") {

    let us_bg = 0;
    let ussr_bg = 0;

    if (this.isControlled("us", "mexico") == 1)        { us_bg++; }
    if (this.isControlled("ussr", "mexico") == 1)      { ussr_bg++; }
    if (this.isControlled("us", "cuba") == 1)          { us_bg++; }
    if (this.isControlled("ussr", "cuba") == 1)        { ussr_bg++; }
    if (this.isControlled("us", "panama") == 1)        { us_bg++; }
    if (this.isControlled("ussr", "panama") == 1)      { ussr_bg++; }

    if (this.isControlled("us", "venezuela") == 1)     { us_bg++; }
    if (this.isControlled("ussr", "venezuela") == 1)   { ussr_bg++; }
    if (this.isControlled("us", "brazil") == 1)        { us_bg++; }
    if (this.isControlled("ussr", "brazil") == 1)      { ussr_bg++; }
    if (this.isControlled("us", "argentina") == 1)     { us_bg++; }
    if (this.isControlled("ussr", "argentina") == 1)   { ussr_bg++; }
    if (this.isControlled("us", "chile") == 1)         { us_bg++; }
    if (this.isControlled("ussr", "chile") == 1)       { ussr_bg++; }

    if (this.isControlled("us", "southafrica") == 1)   { us_bg++; }
    if (this.isControlled("ussr", "southafrica") == 1) { ussr_bg++; }
    if (this.isControlled("us", "angola") == 1)        { us_bg++; }
    if (this.isControlled("ussr", "angola") == 1)      { ussr_bg++; }
    if (this.isControlled("us", "zaire") == 1)         { us_bg++; }
    if (this.isControlled("ussr", "zaire") == 1)       { ussr_bg++; }
    if (this.isControlled("us", "nigeria") == 1)       { us_bg++; }
    if (this.isControlled("ussr", "nigeria") == 1)     { ussr_bg++; }
    if (this.isControlled("us", "algeria") == 1)       { us_bg++; }
    if (this.isControlled("ussr", "algeria") == 1)     { ussr_bg++; }

    if (this.isControlled("us", "poland") == 1)        { us_bg++; }
    if (this.isControlled("ussr", "poland") == 1)      { ussr_bg++; }
    if (this.isControlled("us", "eastgermany") == 1)   { us_bg++; }
    if (this.isControlled("ussr", "eastgermany") == 1) { ussr_bg++; }
    if (this.isControlled("us", "westgermany") == 1)   { us_bg++; }
    if (this.isControlled("ussr", "westgermany") == 1) { ussr_bg++; }
    if (this.isControlled("us", "france") == 1)        { us_bg++; }
    if (this.isControlled("ussr", "france") == 1)      { ussr_bg++; }
    if (this.isControlled("us", "italy") == 1)         { us_bg++; }
    if (this.isControlled("ussr", "italy") == 1)       { ussr_bg++; }

    if (this.isControlled("us", "libya") == 1)         { us_bg++; }
    if (this.isControlled("ussr", "libya") == 1)       { ussr_bg++; }
    if (this.isControlled("us", "egypt") == 1)         { us_bg++; }
    if (this.isControlled("ussr", "egypt") == 1)       { ussr_bg++; }
    if (this.isControlled("us", "israel") == 1)        { us_bg++; }
    if (this.isControlled("ussr", "israel") == 1)      { ussr_bg++; }
    if (this.isControlled("us", "iraq") == 1)          { us_bg++; }
    if (this.isControlled("ussr", "iraq") == 1)        { ussr_bg++; }
    if (this.isControlled("us", "iran") == 1)          { us_bg++; }
    if (this.isControlled("ussr", "iran") == 1)        { ussr_bg++; }
    if (this.isControlled("us", "saudiarabia") == 1)   { us_bg++; }
    if (this.isControlled("ussr", "saudiarabia") == 1) { ussr_bg++; }

    if (this.isControlled("us", "pakistan") == 1)      { us_bg++; }
    if (this.isControlled("ussr", "pakistan") == 1)    { ussr_bg++; }
    if (this.isControlled("us", "india") == 1)         { us_bg++; }
    if (this.isControlled("ussr", "india") == 1)       { ussr_bg++; }
    if (this.isControlled("us", "thailand") == 1)      { us_bg++; }
    if (this.isControlled("ussr", "thailand") == 1)    { ussr_bg++; }
    if (this.isControlled("us", "japan") == 1)         { us_bg++; }
    if (this.isControlled("ussr", "japan") == 1)       { ussr_bg++; }
    if (this.isControlled("us", "southkorea") == 1)    { us_bg++; }
    if (this.isControlled("ussr", "southkorea") == 1)  { ussr_bg++; }
    if (this.isControlled("us", "northkorea") == 1)    { us_bg++; }
    if (this.isControlled("ussr", "northkorea") == 1)  { ussr_bg++; }

    if (us_bg > ussr_bg) {
      this.game.state.events.kitchendebates = 1;
      this.updateLog("US pokes USSR in chest...");
      this.game.state.vp += 2;
      this.updateVictoryPoints();
    } 

    return 1;
  }




  //
  // Voice of America
  //
  if (card == "voiceofamerica") {

    var ops_to_purge = 4;
    var ops_removable = 0;

    for (var i in this.countries) { if (this.countries[i].ussr > 0) { ops_removable += this.countries[i].ussr; } }
    if (ops_to_purge > ops_removable) { ops_to_purge = ops_removable; }
    if (ops_to_purge <= 0) {
      return 1;
    }

   
    if (this.game.player == 1) { return 0; }
    if (this.game.player == 2) {

      this.updateStatus("Remove 4 USSR influence from non-European countries (max 2 per country)");

      var twilight_self = this;
      var ops_purged = {};

      twilight_self.playerFinishedPlacingInfluence();
      twilight_self.addMove("resolve\tvoiceofamerica");

      for (var i in this.countries) {

        let countryname  = i;
  	ops_purged[countryname] = 0;
        let divname      = '#'+i;

        if (this.countries[i].region != "europe") {

          twilight_self.countries[countryname].place = 1;

          $(divname).off();
          $(divname).on('click', function() {

	    let c = $(this).attr('id');

            if (twilight_self.countries[c].place != 1) {
	      alert("Invalid Country");
	    } else {
	      ops_purged[c]++;
	      if (ops_purged[c] >= 2) {
                twilight_self.countries[c].place = 0;
	      }
              twilight_self.removeInfluence(c, 1, "ussr", function() {
	        twilight_self.addMove("remove\tus\tussr\t"+c+"\t1");
                ops_to_purge--;
                if (ops_to_purge == 0) {
                  twilight_self.playerFinishedPlacingInfluence();
                  twilight_self.endTurn();
                }
              });
            }
          });
        }
      }
    }
    return 0;
  }



  //
  // Puppet Government
  //
  if (card == "puppet") {

    if (this.game.player == 1) { 
      this.updateStatus("US is playing Puppet Regimes");
      return 0;
    }
    if (this.game.player == 2) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      var ops_to_place = 3;
      var available_targets = 0;

      twilight_self.addMove("resolve\tpuppet");

      this.updateStatus("US place three influence in countries without any influence");

      for (var i in this.countries) {

        let countryname  = i;
        let divname      = '#'+i;

	if (twilight_self.countries[countryname].us == 0 && twilight_self.countries[countryname].ussr == 0) {

	  available_targets++;
          twilight_self.countries[countryname].place = 1;

          $(divname).off();
          $(divname).on('click', function() {
	    let countryname = $(this).attr('id');
            if (twilight_self.countries[countryname].place == 1) {
              twilight_self.addMove("place\tus\tus\t"+countryname+"\t1");
              twilight_self.placeInfluence(countryname, 1, "us", function() {
	        twilight_self.countries[countryname].place = 0;
                ops_to_place--;
                if (ops_to_place == 0) {
                  twilight_self.playerFinishedPlacingInfluence();
                  twilight_self.endTurn();
                }
	      });
            } else {
              alert("you cannot place there...");
            }
          });
        }
      }

      if (available_targets < ops_to_place) { ops_to_place = available_targets; }
      if (ops_to_place > 0) {
        return 0;
      } else {
	twilight_self.playerFinishedPlacingInfluence();
        return 0;
      }
    }
  }




  //
  // Liberation Theology
  //
  if (card == "liberation") {

    if (this.game.player == 2) { 
      this.updateStatus("USSR is playing Liberation Theology");
      return 0;
    }
    if (this.game.player == 1) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      var ops_to_place = 3;
      var already_placed = [];

      twilight_self.addMove("resolve\tliberation");

      this.updateStatus("USSR places three influence in Central America");
      for (var i in this.countries) {

        let countryname  = i;
        let divname      = '#'+i;
	if (i == "mexico" || i == "guatemala" || i == "elsalvador" || i == "honduras" || i == "nicaragua" || i == "costarica" || i == "panama" || i == "cuba" || i == "haiti" || i == "dominicanrepublic") {
          twilight_self.countries[countryname].place = 1;

	  already_placed[countryname] = 0;

          $(divname).off();
          $(divname).on('click', function() {
	    let countryname = $(this).attr('id');
            if (twilight_self.countries[countryname].place == 1) {
	      already_placed[countryname]++;
	      if (already_placed[countryname] == 2) { 
		twilight_self.countries[countryname].place = 0;
	      }
              twilight_self.addMove("place\tussr\tussr\t"+countryname+"\t1");
              twilight_self.placeInfluence(countryname, 1, "ussr", function() {
                ops_to_place--;
                if (ops_to_place == 0) {
                  twilight_self.playerFinishedPlacingInfluence();
                  twilight_self.endTurn();
                }
	      });
            } else {
              alert("you cannot place there...");
            }
          });
        }
      }
      return 0;
    }
  }




  //
  // Ussuri River Skirmish
  //
  if (card == "ussuri") {

    let us_cc = 0;

    //
    // does us have cc
    //
    if (this.game.state.events.china_card == 2) {
      us_cc = 1;
    } else {

      //
      // it is in one of our hands
      //
      if (this.game.player == 1) {

	let do_i_have_cc = 0;

	if (this.game.state.events.china_card == 1) { do_i_have_cc = 1; }

        for (let i = 0; i < this.game.deck[0].hand.length; i++) {
    	  if (this.game.deck[0].hand[i] == "china") {
	    do_i_have_cc = 1;  
	  }
        }

	if (do_i_have_cc == 1) {
	} else {
	  us_cc = 1;
	}

      }
      if (this.game.player == 2) {
        for (let i = 0; i < this.game.deck[0].hand.length; i++) {
    	  if (this.game.deck[0].hand[i] == "china") {
	    us_cc = 1;
	  }
        }
      }
    }


    //
    //
    //
    if (us_cc == 1) {

      this.updateLog("US places 4 influence in Asia (max 2 per country)");

      //
      // place four in asia
      //
      if (this.game.player == 1) { 
        this.updateStatus("US is playing USSURI River Skirmish");
        return 0;
      }
      if (this.game.player == 2) {

        var twilight_self = this;
        twilight_self.playerFinishedPlacingInfluence();

        var ops_to_place = 4;
        twilight_self.addMove("resolve\tussuri");

        this.updateStatus("US place four influence in Asia (2 max per country)");

        for (var i in this.countries) {

          let countryname  = i;
          let divname      = '#'+i;
	  let ops_placed   = [];

  	  if (this.countries[i].region.indexOf("asia") != -1) {

	    ops_placed[i] = 0;

            twilight_self.countries[countryname].place = 1;
            $(divname).off();
            $(divname).on('click', function() {
	      let countryname = $(this).attr('id');
              if (twilight_self.countries[countryname].place == 1) {
		ops_placed[countryname]++;
                twilight_self.addMove("place\tus\tus\t"+countryname+"\t1");
                twilight_self.placeInfluence(countryname, 1, "us", function() {
		  if (ops_placed[countryname] >= 2) {
	            twilight_self.countries[countryname].place = 0;
                  }
		  ops_to_place--;
                  if (ops_to_place == 0) {
                    twilight_self.playerFinishedPlacingInfluence();
                    twilight_self.endTurn();
                  }
	        });
              } else {
                alert("you cannot place there...");
              }
            });
          }
        }
        return 0;
      }
    } else {

      this.updateLog("US gets the China Card (face up)");

      //
      // us gets china card face up
      //
      this.game.state.events.china_card = 0;

      if (this.game.player == 1) {
        for (let i = 0; i < this.game.deck[0].hand.length; i++) {
          if (this.game.deck[0].hand[i] == "china") {
            this.game.deck[0].hand.splice(i, 1);
          }
        }
      }
      if (this.game.player == 2) {
	if (! this.game.deck[0].hand.includes("china")) {
          this.game.deck[0].hand.push("china");
	}
      }

      return 1;
    }
  }



  //
  // South African Unrest
  //
  if (card == "southafrican") {

    if (this.game.player == 2) { 
      this.updateStatus("USSR is playing South African Unrest");
      return 0;
    }
    if (this.game.player == 1) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      twilight_self.updateStatus('USSR chooses:<p></p><ul><li class="card" id="southafrica">2 Influence in South Africa</li><li class="card" id="adjacent">1 Influence in South Africa and 2 Influence in adjacent countries</li></ul>');

      $('.card').off();
      $('.card').on('click', function() {

        let action2 = $(this).attr("id");

	if (action2 == "southafrica") {

          twilight_self.placeInfluence("southafrica", 2, "ussr", function() {
            twilight_self.addMove("resolve\tsouthafrican");
            twilight_self.addMove("place\tussr\tussr\tsouthafrica\t2");
	    twilight_self.endTurn();
          });
	  return 0;

        }
	if (action2 == "adjacent") {

          twilight_self.placeInfluence("southafrica", 1, "ussr", function() {
            twilight_self.addMove("resolve\tsouthafrican");
            twilight_self.addMove("place\tussr\tussr\tsouthafrica\t1");

	    twilight_self.updateStatus("Place two influence in countries adjacent to South Africa");

	    var ops_to_place = 2;

            for (var i in twilight_self.countries) {

              let countryname  = i;
              let divname      = '#'+i;
	      
              if (i == "angola" || i == "botswana") {

                $(divname).off();
                $(divname).on('click', function() {

		  let c = $(this).attr('id');
                  twilight_self.placeInfluence(c, 1, "ussr", function() {

		    twilight_self.addMove("place\tussr\tussr\t"+c+"\t1");
                    ops_to_place--;
                    if (ops_to_place == 0) {
                      twilight_self.playerFinishedPlacingInfluence();
                      twilight_self.endTurn();
                    }
		  });
		});
	      };
            }
	  });
	}
      });
      return 0;
    }
  }




  //
  // How I Learned to Stop Worrying
  //
  if (card == "howilearned") {

    let twilight_self = this;

    let my_go = 0;

    if (player == "ussr") { this.game.state.milops_ussr = 5; }
    if (player == "us") { this.game.state.milops_us = 5; }

    if (player == "ussr" && this.game.player == 1) { my_go = 1; }
    if (player == "us"   && this.game.player == 2) { my_go = 1; }

    if (my_go == 1) {

      twilight_self.updateStatus('Set DEFCON at level:<p></p><ul><li class="card" id="five">five</li><li class="card" id="four">four</li><li class="card" id="three">three</li><li class="card" id="two">two</li><li class="card" id="one">one</li></ul>');

      $('.card').off();
      $('.card').on('click', function() {

        let defcon_target = 5;

	let action2 = $(this).attr("id");

	twilight_self.addMove("resolve\thowilearned");

	if (action2 == "one")   { defcon_target = 1; }
	if (action2 == "two")   { defcon_target = 2; }
	if (action2 == "three") { defcon_target = 3; }
	if (action2 == "four")  { defcon_target = 4; }
	if (action2 == "five")  { defcon_target = 5; }

	if (defcon_target > twilight_self.game.state.defcon) {
	  let defcon_diff = defcon_target-twilight_self.game.state.defcon;
	  for (i = 0; i < defcon_diff; i++) {
	    twilight_self.addMove("defcon\traise");
	  }
	}

	if (defcon_target < twilight_self.game.state.defcon) {
	  let defcon_diff = twilight_self.game.state.defcon - defcon_target;
	  for (i = 0; i < defcon_diff; i++) {
	    twilight_self.addMove("defcon\tlower");
	  }
	}
	
	twilight_self.endTurn();

      });
    }
    return 0;
  }





  //
  // OAS
  //
  if (card == "oas") {

    if (this.game.player == 1) { 
      this.updateStatus("US is playing OAS");
      return 0;
    }
    if (this.game.player == 2) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      var ops_to_place = 2;

      twilight_self.addMove("resolve\toas");

      this.updateStatus("US places two influence in Central or South America");
      for (var i in this.countries) {

        let countryname  = i;
        let divname      = '#'+i;
	if (i == "venezuela" || i == "colombia" || i == "ecuador" || i == "peru" || i == "chile" || i == "bolivia" || i == "argentina" || i == "paraguay" || i == "uruguay" || i == "brazil" || i == "mexico" || i == "guatemala" || i == "elsalvador" || i == "honduras" || i == "nicaragua" || i == "costarica" || i == "panama" || i == "cuba" || i == "haiti" || i == "dominicanrepublic") {

          twilight_self.countries[countryname].place = 1;

          $(divname).off();
          $(divname).on('click', function() {
	    let countryname = $(this).attr('id');
            if (twilight_self.countries[countryname].place == 1) {
              twilight_self.addMove("place\tus\tus\t"+countryname+"\t1");
              twilight_self.placeInfluence(countryname, 1, "us", function() {
                ops_to_place--;
                if (ops_to_place == 0) {
                  twilight_self.playerFinishedPlacingInfluence();
                  twilight_self.endTurn();
                }
	      });
            } else {
              alert("you cannot place there...");
            }
          });
        }
      }
      return 0;
    }
  }





  //
  // Allende
  //
  if (card == "allende") {
    this.placeInfluence("chile", 2, "ussr");
    return 1;
  }



  //
  // Panama Canal
  //
  if (card == "panamacanal") {
    this.placeInfluence("panama", 1, "us");
    this.placeInfluence("venezuela", 1, "us");
    this.placeInfluence("costarica", 1, "us");
    return 1;
  }



  //
  // Camp David
  //
  if (card == "campdavid") {

    this.game.state.events.campdavid = 1;

    this.updateLog("US gets 1 VP for Camp David Accords");

    this.game.state.vp += 1;
    this.updateVictoryPoints();

    this.placeInfluence("israel", 1, "us");
    this.placeInfluence("egypt", 1, "us");
    this.placeInfluence("jordan", 1, "us");
    return 1;
  }





  //
  // Sadat Expels Soviets
  //
  if (card == "sadat") {
    if (this.countries["egypt"].ussr > 0) {
      this.removeInfluence("egypt", this.countries["egypt"].ussr, "ussr");
    }
    this.placeInfluence("egypt", 1, "us");
    return 1;
  }




  //
  // U2 Incident
  //
  if (card == "u2") {

    this.game.state.events.u2 = 1;
    this.game.state.vp -= 1;
    this.updateVictoryPoints(); 
 
    return 1;
  }





  //
  // Portuguese Empire Crumbles
  //
  if (card == "portuguese") {
    this.placeInfluence("seafricanstates", 2, "ussr");
    this.placeInfluence("angola", 2, "ussr");
    return 1;
  }



  //
  // John Paul II
  //
  if (card == "johnpaul") {

    this.game.state.events.johnpaul = 1;

    this.removeInfluence("poland", 2, "ussr");
    this.placeInfluence("poland", 1, "us");
    return 1;
  }



  //
  // Colonial Rear Guards //
  //
  if (card == "colonial") {

    if (this.game.player == 1) { 
      this.updateStatus("US is playing Colonial Rear Guards");
      return 0;
    }
    if (this.game.player == 2) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      var ops_to_place = 4;
      twilight_self.addMove("resolve\tcolonial");

      this.updateStatus("US place four influence in Africa or Asia (1 per country)");

      for (var i in this.countries) {

        let countryname  = i;
        let divname      = '#'+i;

	if (i == "morocco" || i == "algeria" || i == "tunisia" || i == "westafricanstates" || i == "saharanstates" || i == "sudan" || i == "ivorycoast" || i == "nigeria" || i == "ethiopia" || i == "somalia" || i == "cameroon" || i == "zaire" || i == "kenya" || i == "angola" || i == "seafricanstates" || i == "zimbabwe" || i == "botswana" || i == "southafrica" || i == "philippines" || i == "indonesia" || i == "malaysia" || i == "vietnam" || i == "thailand" || i == "laos" || i == "burma") {
          twilight_self.countries[countryname].place = 1;
          $(divname).off();
          $(divname).on('click', function() {
	    let countryname = $(this).attr('id');
            if (twilight_self.countries[countryname].place == 1) {
              twilight_self.addMove("place\tus\tus\t"+countryname+"\t1");
              twilight_self.placeInfluence(countryname, 1, "us", function() {
	        twilight_self.countries[countryname].place = 0;
                ops_to_place--;
                if (ops_to_place == 0) {
                  twilight_self.playerFinishedPlacingInfluence();
                  twilight_self.endTurn();
                }
	      });
            } else {
              alert("you cannot place there...");
            }
          });
        }
      }
      return 0;
    }
  }


  //
  // Brezhnev Doctrine
  //
  if (card == "brezhnev") {
    this.game.state.events.brezhnev = 1;
    return 1;
  }





  //
  // We Will Bury You
  //
  if (card == "wwby") {

    this.game.state.events.wwby = 1;

    this.lowerDefcon();
    this.updateDefcon();

    if (this.game.state.defcon <= 1) {
      if (this.game.state.turn == 0) {
        this.endGame("us", "defcon");
      } else {
        this.endGame("ussr", "defcon");
      }
      return 0;
    }
    return 1;
  }







  //
  // One Small Step
  //
  if (card == "onesmallstep") {
    if (player == "us") {
      if (this.game.state.space_race_us < this.game.state.space_race_ussr) {
	this.updateLog("US takes one small step into space...");
	this.game.state.space_race_us += 1;
	this.advanceSpaceRace("us");
      }
    } else {
      if (this.game.state.space_race_ussr < this.game.state.space_race_us) {
	this.updateLog("USSR takes one small step into space...");
	this.game.state.space_race_ussr += 1;
	this.advanceSpaceRace("ussr");
      }
    }

    return 1;
  }



  //
  // Alliance for Progress
  //
  if (card == "alliance") {

    let us_bonus = 0;

    if (this.isControlled("us", "mexico") == 1)     { us_bonus++; }
    if (this.isControlled("us", "cuba") == 1)       { us_bonus++; }
    if (this.isControlled("us", "panama") == 1)     { us_bonus++; }
    if (this.isControlled("us", "chile") == 1)      { us_bonus++; }
    if (this.isControlled("us", "argentina") == 1)  { us_bonus++; }
    if (this.isControlled("us", "brazil") == 1)     { us_bonus++; }
    if (this.isControlled("us", "venezuela") == 1)  { us_bonus++; }

    this.game.state.vp += us_bonus;
    this.updateVictoryPoints();  
    this.updateLog("US VP bonus is: " + us_bonus);

    return 1;

  }




  //
  // Lone Gunman
  //
  if (card == "lonegunman") {

    if (this.game.player == 1) {
      this.updateStatus("US is playing Lone Gunman");
      return 0;
    }
    if (this.game.player == 2) {

      this.addMove("resolve\tlonegunman");
      this.updateStatus("US is playing Lone Gunman");

      if (this.game.deck[0].hand.length < 1) {
        this.addMove("ops\tussr\tlonegunman\t1");
        this.addMove("notify\tUS has no cards to reveal");
        this.endTurn();
      } else {
	let revealed = "";
        for (let i = 0; i < this.game.deck[0].hand.length; i++) {
	  if (i > 0) { revealed += ", "; }
          revealed += this.game.deck[0].cards[this.game.deck[0].hand[i]].name;
        }
        this.addMove("ops\tussr\tlonegunman\t1");
        this.addMove("notify\tUS holds: "+revealed);
        this.endTurn();
      }
    }
    return 0;
  }



  //
  // OPEC
  //
  if (card == "opec") {

    if (this.game.state.events.northseaoil == 0) {

      let ussr_bonus = 0;

      if (this.isControlled("ussr", "egypt") == 1)       { ussr_bonus++; }
      if (this.isControlled("ussr", "iran") == 1)        { ussr_bonus++; }
      if (this.isControlled("ussr", "libya") == 1)       { ussr_bonus++; }
      if (this.isControlled("ussr", "saudiarabia") == 1) { ussr_bonus++; }
      if (this.isControlled("ussr", "gulfstates") == 1)  { ussr_bonus++; }
      if (this.isControlled("ussr", "iraq") == 1)        { ussr_bonus++; }
      if (this.isControlled("ussr", "venezuela") == 1)   { ussr_bonus++; }

      this.game.state.vp -= ussr_bonus;
      this.updateVictoryPoints();  
      this.updateLog("USSR VP bonus is: " + ussr_bonus);

    }

    return 1;

  }




  //
  // Brush War
  //
  if (card == "brushwar") {

    let me = "ussr";
    let opponent = "us";
    if (this.game.player == 2) { opponent = "ussr"; me = "us"; }

    if (me != player) {
      let burned = this.rollDice(6);
      return 0;
    }
    if (me == player) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      twilight_self.addMove("resolve\tbrushwar");
      twilight_self.updateStatus('Pick target for Brush War');



      for (var i in twilight_self.countries) {

        if (twilight_self.countries[i].control <= 2) {

          let play_brush_war = 1;
          let divname = "#" + i;

          if (i === "italy") {
            if (twilight_self.game.state.events.nato == 1) {
              if (twilight_self.isControlled("us", "italy") == 1) {
                play_brush_war = 0;
              }
            }
          }

          if (play_brush_war == 1) {

            $(divname).off();
            $(divname).on('click', function() {

              let c = $(this).attr('id');

              alert("Launching Brush War in "+twilight_self.countries[c].name);

              let dieroll = twilight_self.rollDice(6);
              let modify = 0;

              for (let v = 0; v < twilight_self.countries[c].neighbours.length; v++) {
                if (twilight_self.isControlled(opponent, v) == 1) {
                  modify++;
                }
              }

              if (twilight_self.game.player == 1) {
                if (c == "mexico") { modify++; }
                if (c == "cuba") { modify++; }
                if (c == "japan") { modify++; }
                if (c == "canada") { modify++; }
              }
              if (twilight_self.game.player == 2) {
                if (c == "finland") { modify++; }
                if (c == "romania") { modify++; }
                if (c == "afghanistan") { modify++; }
                if (c == "northkorea") { modify++; }
              }

              dieroll = dieroll - modify;

              if (dieroll >= 3) {

                let usinf = twilight_self.countries[c].us;
                let ussrinf = twilight_self.countries[c].ussr;

                if (me == "us") {
                  twilight_self.removeInfluence(c, ussrinf, "ussr");
                  twilight_self.placeInfluence(c, ussrinf, "us");
                  twilight_self.addMove("remove\tus\tussr\t"+c+"\t"+ussrinf);
                  twilight_self.addMove("place\tus\tus\t"+c+"\t"+ussrinf);
                  twilight_self.addMove("milops\tus\t3");
                  if (twilight_self.game.state.events.flowerpower == 1) {
                    twilight_self.addMove("vp\tus\t1\t1");
                  } else {
                    twilight_self.addMove("vp\tus\t1");
                  }
                  twilight_self.endTurn();
                } else {
                  twilight_self.removeInfluence(c, usinf, "us");
                  twilight_self.placeInfluence(c, usinf, "ussr");
                  twilight_self.addMove("remove\tussr\tus\t"+c+"\t"+usinf);
                  twilight_self.addMove("place\tussr\tussr\t"+c+"\t"+usinf);
                  twilight_self.addMove("milops\tussr\t3");
                  if (twilight_self.game.state.events.flowerpower == 1) {
                    twilight_self.addMove("vp\tussr\t1\t1");
                  } else {
                    twilight_self.addMove("vp\tussr\t1");
                  }
                }
                twilight_self.addMove("notify\tBrush War in "+twilight_self.countries[c].name+" succeeded.");
                twilight_self.addMove("notify\tBrush War rolls "+dieroll);
                twilight_self.endTurn();

              } else {
                if (me == "us") {
	          twilight_self.addMove("milops\tus\t3");
		} else {
	          twilight_self.addMove("milops\tussr\t3");
		}
                twilight_self.addMove("notify\tBrush War in "+twilight_self.countries[c].name+" failed.");
                twilight_self.addMove("notify\tBrush War rolls "+dieroll);
                twilight_self.endTurn();
              }
            });
	  }
	}
      }
    }
    return 0;
  }




  //
  // Arms Race
  //
  if (card == "armsrace") {

    let me = "ussr";
    let opponent = "us";
    if (this.game.player == 2) { opponent = "ussr"; me = "us"; }

    if (player == "us") {
      if (this.game.state.milops_us > this.game.state.milops_ussr) {
	this.updateLog("US gains 1 VP from Arms Race");
        this.game.state.vp += 1;
        if (this.game.state.milops_us >= this.game.state.defcon) {
	  this.updateLog("US gains 2 bonus VP rom Arms Race");
	  this.game.state.vp += 2;
	}
      }
    } else {
      if (this.game.state.milops_ussr > this.game.state.milops_us) {
	this.updateLog("USSR gains 1 VP from Arms Race");
        this.game.state.vp -= 1;
        if (this.game.state.milops_ussr >= this.game.state.defcon) {
	  this.updateLog("USSR gains 2 bonus VP from Arms Race");
	  this.game.state.vp -= 2;
	}
      }
    }

    this.updateVictoryPoints();
    return 1;

  }
















  //////////////
  // LATE WAR //
  //////////////


  //
  // Iranian Hostage Crisis
  //
  if (card == "iranianhostage") {
    this.game.state.events.iranianhostage = 1;
    if (this.countries["iran"].us > 0) { this.removeInfluence("iran", this.countries["iran"].us, "us"); }
    this.placeInfluence("iran", 2, "ussr");
    return 1;
  }



  //
  // North Sea Oil
  //
  if (card == "northseaoil") {
    this.game.state.events.northseaoil = 1;
    this.game.state.events.northseaoil_bonus = 1;
    return 1;
  }



  //
  // Marine Barracks Bombing
  //
  if (card == "marine") {

    this.countries["lebanon"].us = 0;
    this.showInfluence("lebanon", "us");
    this.updateLog("All US influence removed from Lebanon");

    let ustroops = 0;
    for (var i in this.countries) {
      if (this.countries[i].region == "mideast") {
	ustroops += this.countries[i].us;
      }
    }

    if (ustroops == 0) {
      this.updateLog("US has no influence in the Middle-East");
      return 1;
    }

    if (this.game.player == 2) {
      return 0;
    }
    if (this.game.player == 1) {

      this.addMove("resolve\tmarine");

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      var ops_to_purge = 2;

      var ops_available = 0;
      for (var i in this.countries) {
        if (this.countries[i].region == "mideast") {
	  if (this.countries[i].us > 0) {
	    ops_available += this.countries[i].us;
	  }
	}
      }

      if (ops_available < 2) { ops_to_purge = ops_available; }

      this.updateStatus("Remove "+ops_to_purge+" US influence from the Middle East");
      for (var i in this.countries) {

        let countryname  = i;
        let divname      = '#'+i;

        if (this.countries[i].region == "mideast") {

          twilight_self.countries[countryname].place = 1;
          $(divname).off();
          $(divname).on('click', function() {

	    let c = $(this).attr('id');

            if (twilight_self.countries[c].place != 1) {
	      alert("Invalid Country");
	    } else {
              twilight_self.removeInfluence(c, 1, "us", function() {
	        twilight_self.addMove("remove\tussr\tus\t"+c+"\t1");
                ops_to_purge--;
                if (ops_to_purge == 0) {
                  twilight_self.playerFinishedPlacingInfluence();
                  twilight_self.endTurn();
                }
              });
            }
          });
        }
      }
      return 0;
    }
  }





  //
  // Latin American Debt Crisis
  //
  if (card == "debtcrisis") {

    if (this.game.player == 1) {
      this.updateStatus("US playing Latin American Debt Crisis");
      return 0;
    }

    let cards_available = 0;
    let twilight_self = this;

    let user_message = "Choose a card to discard or USSR doubles influence in two countries in South America:<p></p><ul>";
    for (i = 0; i < this.game.deck[0].hand.length; i++) {
      if (this.modifyOps(this.game.deck[0].cards[this.game.deck[0].hand[i]].ops) > 2 && this.game.deck[0].hand[i] != "china") {
        user_message += '<li class="card showcard" id="'+this.game.deck[0].hand[i]+'">'+this.game.deck[0].cards[this.game.deck[0].hand[i]].name+'</li>';
        cards_available++;
      }
    }
    user_message += '<li class="card showcard" id="nodiscard">[do not discard]</li>';
    user_message += '</ul>';
    this.updateStatus(user_message);


    if (cards_available == 0) {
      this.addMove("resolve\tdebtcrisis");
      this.addMove("latinamericandebtcrisis");
      this.addMove("notify\tUS has no cards available for Latin American Debt Crisis");
      this.endTurn();
      return 0;
    }


    $('.card').off();
    $('.card').on('click', function() {

      let action2 = $(this).attr("id");

      if (action2 == "nodiscard") {
        twilight_self.addMove("resolve\tdebtcrisis");
	twilight_self.addMove("latinamericandebtcrisis");
	twilight_self.endTurn();
	return 0;
      }

      twilight_self.addMove("resolve\tdebtcrisis");
      twilight_self.addMove("discard\tus\t"+action2);
      twilight_self.addMove("notify\tUS discards <span class=\"logcard\" id=\""+action2+"\">"+twilight_self.game.deck[0].cards[action2].name + "</span>");
      twilight_self.removeCardFromHand(action2);
      twilight_self.endTurn();

    });

    return 0;
  }





  //
  // AWACS Sale to Soviets
  //
  if (card == "awacs") {
    this.game.state.events.awacs = 1;
    this.countries["saudiarabia"].us += 2;
    this.showInfluence("saudiarabia", "us");
    return 1;
  }



  //
  // Iran-Iraq War
  //
  if (card == "iraniraq") {

    let me = "ussr";
    let opponent = "us";
    if (this.game.player == 2) { opponent = "ussr"; me = "us"; }

    if (me != player) { 
      let burned = this.rollDice(6);
      return 0;
    }
    if (me == player) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      twilight_self.addMove("resolve\tiraniraq");
      twilight_self.updateStatus('Iran-Iraq War. Choose Target:<p></p><ul><li class="card" id="invadeiraq">Iraq</li><li class="card" id="invadeiran">Iran</li></ul>');

      let target = 4;

      $('.card').off();
      $('.card').on('click', function() {

        let invaded = $(this).attr("id");

        if (invaded == "invadeiran") {

          if (twilight_self.isControlled(opponent, "pakistan") == 1) { target++; }
          if (twilight_self.isControlled(opponent, "iraq") == 1) { target++; }
          if (twilight_self.isControlled(opponent, "afghanistan") == 1) { target++; }

	  let die = twilight_self.rollDice(6);
          twilight_self.addMove("notify\t"+player.toUpperCase()+" rolls "+die);

	  if (die >= target) {

	    if (player == "us") {
              twilight_self.addMove("place\tus\tus\tiran\t"+twilight_self.countries['iran'].ussr);
              twilight_self.addMove("remove\tus\tussr\tiran\t"+twilight_self.countries['iran'].ussr);
	      twilight_self.addMove("milops\tus\t2");
	      if (twilight_self.game.state.events.flowerpower == 1) {
                twilight_self.addMove("vp\tus\t2\t1");
	      } else {
                twilight_self.addMove("vp\tus\t2");
	      }
              twilight_self.placeInfluence("iran", twilight_self.countries['iran'].ussr, "us");
              twilight_self.removeInfluence("iran", twilight_self.countries['iran'].ussr, "ussr");
	      twilight_self.endTurn();
	      twilight_self.showInfluence("iran", "ussr");
	    } else {
              twilight_self.addMove("place\tussr\tussr\tiran\t"+twilight_self.countries['iran'].us);
              twilight_self.addMove("remove\tussr\tus\tiran\t"+twilight_self.countries['iran'].us);
	      twilight_self.addMove("milops\tussr\t2");
	      if (twilight_self.game.state.events.flowerpower == 1) {
                twilight_self.addMove("vp\tus\t2\t1");
	      } else {
                twilight_self.addMove("vp\tus\t2");
	      }
              twilight_self.placeInfluence("iran", twilight_self.countries['iran'].us, "ussr");
              twilight_self.removeInfluence("iran", twilight_self.countries['iran'].us, "us");
	      twilight_self.endTurn();
	      twilight_self.showInfluence("iran", "ussr");
	    }
	  } else {

	    if (player == "us") {
	      twilight_self.addMove("milops\tus\t2");
	      twilight_self.endTurn();
	    } else {
	      twilight_self.addMove("milops\tussr\t2");
	      twilight_self.endTurn();
	    }

	  }

	}
        if (invaded == "invadeiraq") {

          if (twilight_self.isControlled(opponent, "iran") == 1) { target++; }
          if (twilight_self.isControlled(opponent, "jordan") == 1) { target++; }
          if (twilight_self.isControlled(opponent, "gulfstates") == 1) { target++; }
          if (twilight_self.isControlled(opponent, "saudiarabia") == 1) { target++; }

	  let die = twilight_self.rollDice(6);

	  if (die >= target) {

	    if (player == "us") {
              twilight_self.addMove("place\tus\tus\tiraq\t"+twilight_self.countries['iraq'].ussr);
              twilight_self.addMove("remove\tus\tussr\tiraq\t"+twilight_self.countries['iraq'].ussr);
	      twilight_self.addMove("milops\tus\t2");
	      twilight_self.addMove("vp\tus\t2");
              twilight_self.placeInfluence("iraq", twilight_self.countries['iraq'].ussr, "us");
              twilight_self.removeInfluence("iraq", twilight_self.countries['iraq'].ussr, "ussr");
	      twilight_self.endTurn();
	      twilight_self.showInfluence("iraq", "ussr");
	    } else {
              twilight_self.addMove("place\tus\tussr\tiraq\t"+twilight_self.countries['iraq'].us);
              twilight_self.addMove("remove\tus\tus\tiraq\t"+twilight_self.countries['iraq'].us);
	      twilight_self.addMove("milops\tussr\t2");
	      twilight_self.addMove("vp\tussr\t2");
              twilight_self.placeInfluence("iraq", twilight_self.countries['iraq'].us, "ussr");
              twilight_self.removeInfluence("iraq", twilight_self.countries['iraq'].us, "us");
 	      twilight_self.endTurn();
	      twilight_self.showInfluence("iraq", "ussr");
	    }
	  } else {

	    if (player == "us") {
	      twilight_self.addMove("milops\tus\t2");
	      twilight_self.endTurn();
	    } else {
	      twilight_self.addMove("milops\tussr\t2");
 	      twilight_self.endTurn();
	    }
	  }
	}
      });
    }
    return 0;
  }




  //
  // Tear Down This Wall
  //
  if (card === "teardown") {

    this.game.state.events.teardown = 1;
    this.game.state.events.willybrandt = 0;
    if (this.game.state.events.nato == 1) {
      this.game.state.events.nato_westgermany = 1;
    }

    this.countries["eastgermany"].us += 3;
    this.showInfluence("eastgermany", "us");

    if (this.game.player == 2) {
      this.addMove("resolve\tteardown");
      this.addMove("teardownthiswall\tus");
      this.endTurn();
    }

    return 0;
  }




  //
  // Chernobyl
  //
  if (card == "chernobyl") {

    if (this.game.player == 1) {
      this.updateStatus("US is playing Chernobyl");
      return 0;
    }

    let html = "Chernobyl triggered. Designate region to prohibit USSR placement of influence from OPS: <p></p><ul>";
        html += '<li class="card" id="asia">Asia</li>';
        html += '<li class="card" id="europe">Europe</li>';
        html += '<li class="card" id="africa">Africa</li>';
        html += '<li class="card" id="camerica">Central America</li>';
        html += '<li class="card" id="samerica">South America</li>';
        html += '<li class="card" id="mideast">Middle-East</li>';
        html += '</ul>';

    this.updateStatus(html);

    let twilight_self = this;

    $('.card').off();
    $('.card').on('click', function() {

      let action2 = $(this).attr("id");

      twilight_self.addMove("resolve\tchernobyl");
      twilight_self.addMove("chernobyl\t"+action2);
      twilight_self.addMove("notify\tUS restricts placement in "+action2);
      twilight_self.endTurn();

    });

    return 0;
  }




  //
  // Aldrich Ames Remix
  //
  if (card == "aldrichames") {

    this.game.state.events.aldrich = 1;

    if (this.game.player == 1) {
      this.updateStatus("US is revealing its cards to USSR");
      return 0;
    }
    if (this.game.player == 2) {

      this.updateStatus("USSR is playing Aldrich Ames");

      this.addMove("resolve\taldrichames");

      let cards_to_reveal = this.game.deck[0].hand.length;
      for (let i = 0; i < this.game.deck[0].hand.length; i++) {
        if (this.game.deck[0].hand[i] === "china") { cards_to_reveal--; }
        else { 
          this.addMove(this.game.deck[0].hand[i]); 
        }
      }
      this.addMove("aldrich\tus\t"+cards_to_reveal);
      this.endTurn();

    }
    return 0;
  }



  //
  // Solidarity
  //
  if (card == "solidarity") {
    if (this.game.state.events.johnpaul == 1) {
      this.placeInfluence("poland", 3, "us");
    }
    return 1;
  }




  //
  // Star Wars
  //
  if (card == "starwars") {

    if (this.game.state.space_race_us <= this.game.state.space_race_ussr) {
      this.updateLog("US is not ahead of USSR in the space race");
      return 1;
    }

    this.game.state.events.starwars = 1;

    // otherwise sort through discards
    let discardlength = 0;
    for (var i in this.game.deck[0].discards) { discardlength++; }
    if (discardlength == 0) {
      this.updateLog("No cards in discard pile");
      return 1;
    }

    if (this.game.player == 1) {
      updateStatus("Opponent retrieving event from discard pile");
      return 0;
    }


    var twilight_self = this;

    this.addMove("resolve\tstarwars");

    let user_message = "Choose card to reclaim: <p></p><ul>";
    for (var i in this.game.deck[0].discards) {
      if (this.game.state.headline == 1 && i == "unintervention") {} else {
        user_message += '<li class="card showcard" id="'+i+'">'+this.game.deck[0].cards[i].name+'</li>';
      }
    }
    user_message += '</li>';
    twilight_self.updateStatus(user_message);


    $('.card').off();
    $('.card').mouseover(function() {
      let card = $(this).attr("id");
      twilight_self.showCard(card);
    }).mouseout(function() {
      let card = $(this).attr("id");
      twilight_self.hideCard(card);
    });
    $('.card').on('click', function() {

      let action2 = $(this).attr("id");

      twilight_self.addMove("event\tus\t"+action2);
      twilight_self.addMove("notify\t"+player+" retrieved "+twilight_self.game.deck[0].cards[action2].name);
      twilight_self.endTurn();

    });

    return 0;
  }




  //
  // Iran-Contra Scandal
  //
  if (card == "irancontra") {
    this.game.state.events.irancontra = 1;
    return 1;
  }




  //
  // Yuri and Samantha
  //
  if (card == "yuri") {
    this.game.state.events.yuri = 1;
    return 1;
  }





  //
  // Wargames
  //
  if (card == "wargames") {

    if (this.game.state.defcon != 2) {
      this.updateLog("Wargames event cannot trigger as DEFCON is not at 2");
      return 1;
    }

    let twilight_self = this;
    let player_to_go = 1;
    if (player == "us") { player_to_go = 2; }

    let choicehtml = 'Wargames triggers. Do you want to give your opponent 6 VP and End the Game? (VP ties will be won by opponents)<p></p><ul><li class="card" id="endgame">end the game</li><li class="card" id="cont">continue playing</li></ul>';

    if (player_to_go == this.game.player) {
      this.updateStatus(choicehtml);
    } else {
      this.updateStatus("Opponent deciding whether to trigger Wargames...");
      return 0;
    }

    $('.card').off();
    $('.card').on('click', function() {
      let action2 = $(this).attr("id");
      if (action2 == "endgame") {
        twilight_self.updateStatus("Triggering Wargames...");
        twilight_self.addMove("resolve\twargames");
        twilight_self.addMove("wargames\t"+player+"\t1");
        twilight_self.endTurn();
      } 
      if (action2 == "cont") {
        twilight_self.updateStatus("Discarding Wargames...");
        twilight_self.addMove("resolve\twargames");
        twilight_self.addMove("wargames\t"+player+"\t0");
        twilight_self.endTurn();
      } 
    });

    return 0;
  }




  //
  // An Evil Empire
  //
  if (card == "evilempire") {

    this.game.state.events.evilempire = 1;
    this.game.state.events.flowerpower = 0;

    this.game.state.vp += 1;
    this.updateVictoryPoints();

    return 1;

  }




  //
  // The Iron Lady
  //
  if (card == "ironlady") {

    this.game.state.vp += 1;
    this.updateVictoryPoints();

    //
    // keep track of whether the USSR has influence in Argentina in order
    // to know whether it can place there or beside Argentina if it plays
    // ops after the event, and uses the US event to get influence into the
    // country..
    //
    this.game.state.ironlady_before_ops = 1;

    this.placeInfluence("argentina", 1, "ussr");
    if (this.countries["uk"].ussr > 0) { this.removeInfluence("uk", this.countries["uk"].ussr, "ussr"); }
    
    this.game.state.events.ironlady = 1;

    return 1;
  }




  //
  // Reagan Bombs Libya
  //
  if (card == "reagan") {

    let us_vp = 0;
    let x = this.countries["libya"].ussr;
    
    if (x < 2) { 
    } else {
      while (x -= 2) { us_vp++; }
      this.updateLog("Reagan bombs Libya and US scores "+us_vp+" VP");
      this.game.state.vp += us_vp;
      this.updateVictoryPoints();
    }

    return 1;
  }






  //
  // Soviets Shoot Down KAL-007
  //
  if (card == "KAL007") {

    this.game.state.vp += 2;
    this.updateVictoryPoints();

    this.lowerDefcon();

    if (this.isControlled("us", "southkorea") == 1) {
      this.addMove("resolve\tKAL007");
      this.addMove("unlimit\tcoups");
      this.addMove("ops\tus\tKAL007\t4");
      this.addMove("limit\tcoups");
      this.endTurn();
      return 0;
    } else {
      return 1;
    }

  }




  //
  // Pershing II Deployed
  //
  if (card == "pershing") {

    if (this.game.player == 2) { 
      this.updateStatus("USSR playing Pershing II Deployed");
      return 0; 
    }
    if (this.game.player == 1) {

      this.updateStatus("Remove 3 US influence from Europe (max 1 per country)");

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      twilight_self.addMove("resolve\tpershing");
      twilight_self.addMove("vp\tussr\t1");

      let valid_targets = 0;
      for (var i in this.countries) {
        let countryname  = i;
        let divname      = '#'+i;
	if (twilight_self.countries[countryname].us > 0) {
	  valid_targets++;
	}
      }

      if (valid_targets == 0) {
	twilight_self.addMove("notify\tUS does not have any targets for Pershing II");
	twilight_self.endTurn();
	return;
      }

      var ops_to_purge = 3; 
      if (valid_targets < ops_to_purge) { ops_to_purge = valid_targets; }

      for (var i in this.countries) {

        let countryname  = i;
        let divname      = '#'+i;

        if (this.countries[i].region == "europe") {

	  if (twilight_self.countries[countryname].us > 0) {

            twilight_self.countries[countryname].place = 1;
            $(divname).off();
            $(divname).on('click', function() {

  	      let c = $(this).attr('id');

              if (twilight_self.countries[c].place != 1) {
	        alert("Invalid Country");
	      } else {
                twilight_self.countries[c].place = 0;
                twilight_self.removeInfluence(c, 1, "us", function() {
	          twilight_self.addMove("remove\tussr\tus\t"+c+"\t1");
                  ops_to_purge--;
                  if (ops_to_purge == 0) {
                    twilight_self.playerFinishedPlacingInfluence();
                    twilight_self.endTurn();
                  }
                });
              }
            });
	  }
        }
      }
    }
    return 0;
  }




  //
  // Terrorism
  //
  if (card == "terrorism") {

    let cards_to_discard = 1;
    let target = "ussr";
    let twilight_self = this;

    if (player == "ussr") { target = "us"; }
    if (target == "us") { if (this.game.state.events.iranianhostage == 1) { cards_to_discard = 2; } }

    this.addMove("resolve\tterrorism");

    if (this.game.player == 2 && target == "us") {

      let available_cards = this.game.deck[0].hand.length;
      for (let z = 0; z < this.game.deck[0].hand.length; z++) {
	if (this.game.deck[0].hand[z] == "china") { available_cards--; }
      }
      if (available_cards < cards_to_discard) { cards_to_discard = available_cards; }

      if (cards_to_discard == 0) { this.addMove("notify\tUS has no cards to discard"); }


      for (let i = 0; i < cards_to_discard; i++) {
        this.rollDice(twilight_self.game.deck[0].hand.length, function(roll) {
	  roll = parseInt(roll)-1;
          let card = twilight_self.game.deck[0].hand[roll];

	  if (card == "china") {
	    if (roll-2 >= 0) { card = twilight_self.game.deck[0].hand[roll-2]; } else {
	      card = twilight_self.game.deck[0].hand[roll];
	    }
	  }

	  twilight_self.removeCardFromHand(card);
	  twilight_self.addMove("dice\tburn\tussr");
	  twilight_self.addMove("discard\tus\t"+card);
  	  twilight_self.addMove("notify\t"+target.toUpperCase()+" discarded "+twilight_self.game.deck[0].cards[card].name);
	});
      }
      twilight_self.endTurn();
    }
    if (this.game.player == 1 && target == "ussr") {

      let available_cards = this.game.deck[0].hand.length;
      for (let z = 0; z < this.game.deck[0].hand.length; z++) {
	if (this.game.deck[0].hand[z] == "china") { available_cards--; }
      }
      if (available_cards < cards_to_discard) { cards_to_discard = available_cards; }

      if (cards_to_discard == 0) { this.addMove("notify\tUSSR has no cards to discard"); this.endTurn(); return 0; }
      this.rollDice(twilight_self.game.deck[0].hand.length, function(roll) {
	  roll = parseInt(roll)-1;
          let card = twilight_self.game.deck[0].hand[roll];

	  if (card == "china") {
	    if (roll-2 >= 0) { card = twilight_self.game.deck[0].hand[roll-2]; } else {
	      card = twilight_self.game.deck[0].hand[roll];
	    }
	  }

	  twilight_self.removeCardFromHand(card);
	  twilight_self.addMove("dice\tburn\tus");
	  twilight_self.addMove("discard\tussr\t"+card);
  	  twilight_self.addMove("notify\t"+target.toUpperCase()+" discarded "+twilight_self.game.deck[0].cards[card].name);
          twilight_self.endTurn();
      });
    }

    return 0;
  }









  //
  // Glasnost
  //
  if (card == "glasnost") {

    let twilight_self = this;

    this.game.state.defcon += 1;
    if (this.game.state.defcon > 5) { this.game.state.defcon = 5; }
    this.game.state.vp -= 2;
    this.updateDefcon();
    this.updateVictoryPoints();

    this.updateLog("DEFCON increases by 1 point");
    this.updateLog("USSR gains 2 VP");

    if (this.game.state.events.reformer == 1) {
      this.addMove("resolve\tglasnost");      
      this.addMove("unlimit\tcoups");
      this.addMove("ops\tussr\tglasnost\t4");
      this.addMove("limit\tcoups");
      this.addMove("notify\tUSSR plays 4 OPS for influence or realignments");
      this.endTurn();
    } else {
      return 1;
    }

    return 0;
  }




  //
  // The Reformer
  //
  if (card == "reformer") {

    this.game.state.events.reformer = 1;

    if (this.game.player == 2) { 
      this.updateStatus("Waiting for USSR to play The Reformer");
      return 0; 
    }
    if (this.game.player == 1) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      let influence_to_add = 4;
      if (this.game.state.vp < 0) { influence_to_add = 6; }
      
      this.addMove("resolve\treformer");
      this.updateStatus('Add '+influence_to_add+' influence in Europe (max 2 per country)');

      var ops_to_place = influence_to_add;
      var ops_placed = {};
      for (var i in twilight_self.countries) {

        let countryname  = i;
	ops_placed[countryname] = 0;
        let divname      = '#'+i;

        if (this.countries[countryname].region == "europe") {

          this.countries[countryname].place = 1;

          $(divname).off();
          $(divname).on('click', function() {

 	    let c = $(this).attr('id');

            if (twilight_self.countries[c].place != 1) {
	      alert("Invalid Placement");
	    } else {
	      ops_placed[c]++;
              twilight_self.placeInfluence(c, 1, "ussr", function() {
		twilight_self.addMove("place\tussr\tussr\t"+c+"\t1");
		if (ops_placed[c] >= 2) { twilight_self.countries[c].place = 0; }
                ops_to_place--;
                if (ops_to_place == 0) {
                  twilight_self.playerFinishedPlacingInfluence();
                  twilight_self.endTurn();
                }
	      });
            }
	  });
	}
      }
      return 0;
    }
 
    return 1;
  }



  //
  // Ortega Elected in Nicaragua
  //
  if (card == "ortega") {

    let twilight_self = this;

    this.countries["nicaragua"].us = 0;
    this.showInfluence("nicaragua", "us");

    let can_coup = 0;

    if (this.countries["cuba"].us > 0) { can_coup = 1; }
    if (this.countries["honduras"].us > 0) { can_coup = 1; }
    if (this.countries["costarica"].us > 0) { can_coup = 1; }

    if (can_coup == 0) {
      this.updateLog("notify\tUSSR does not have valid coup target");
      return 1;
    }

    if (this.game.player == 1) {
      this.updateStatus("Pick a country adjacent to Nicaragua to coup: ");
    } else {
      this.updateStatus("USSR is selecting a country for its free coup");
      return 0;
    }

    for (var i in twilight_self.countries) {

      let countryname  = i;
      let divname      = '#'+i;

      if (i == "costarica" || i == "cuba" || i == "honduras") {

        $(divname).off();
        $(divname).on('click', function() {

	  let c = $(this).attr('id');

	  twilight_self.addMove("resolve\tortega");
          twilight_self.addMove("unlimit\tmilops");
          twilight_self.addMove("coup\tussr\t"+c+"\t2");
          twilight_self.addMove("limit\tmilops");
          twilight_self.addMove("notify\tUSSR launches coup in "+c);
	  twilight_self.endTurn();

	});

      } else {

        $(divname).off();
        $(divname).on('click', function() {
	  alert("Invalid Target");
	});

      }
    }

    return 0;
  }







  //
  // return 0 so other cards do not trigger infinite loop 
  //
  return 0;
}

Twilight.prototype.isControlled = function isControlled(player, country) {

  if (this.countries[country] == undefined) { return 0; }

  let country_lead = 0;

  if (player == "ussr") {
    country_lead = parseInt(this.countries[country].ussr) - parseInt(this.countries[country].us);
  }
  if (player == "us") {
    country_lead = parseInt(this.countries[country].us) - parseInt(this.countries[country].ussr);
  }

  if (this.countries[country].control <= country_lead) { return 1; }
  return 0;

}
Twilight.prototype.returnArrayOfRegionBonuses = function returnArrayOfRegionBonuses(card="") {

  let regions = [];

  //
  // Vietnam Revolts
  //
  if (this.game.state.events.vietnam_revolts == 1 && this.game.state.events.vietnam_revolts_eligible == 1 && this.game.player == 1) {

    //
    // Vietnam Revolts does not give bonus to 1 OP card in SEA if USSR Red Purged
    // https://boardgamegeek.com/thread/1136951/red-scarepurge-and-vietnam-revolts
    let pushme = 1;
    if (card != "") { if (this.game.deck[0].cards[card].ops == 1 && this.game.state.events.redscare_player1 == 1) { pushme = 0; } }
    if (pushme == 1) {
      regions.push("seasia");
    }
  }

  //
  // The China Card
  //
  if (this.game.state.events.china_card_in_play == 1 && this.game.state.events.china_card_eligible == 1) {
    regions.push("asia");
  }

  return regions;

}
Twilight.prototype.isRegionBonus = function isRegionBonus(card="") {

  //
  // Vietnam Revolts
  //
  if (this.game.state.events.vietnam_revolts == 1 && this.game.state.events.vietnam_revolts_eligible == 1 && this.game.player == 1) {

    //
    // Vietnam Revolts does not give bonus to 1 OP card in SEA if USSR Red Purged
    // https://boardgamegeek.com/thread/1136951/red-scarepurge-and-vietnam-revolts
    if (card != "") { if (this.game.deck[0].cards[card].ops == 1 && this.game.state.events.redscare_player1 == 1) { return 0; } }

    this.updateStatus("Extra 1 OP Available for Southeast Asia");
    this.game.state.events.region_bonus = "seasia"; 
    return 1;
  }

  //
  // The China Card
  //
  if (this.game.state.events.china_card_in_play == 1 && this.game.state.events.china_card_eligible == 1) {
    this.updateStatus("Extra 1 OP Available for Asia");
    this.game.state.events.region_bonus = "asia"; 
    return 1;
  }
  return 0;
}
Twilight.prototype.endRegionBonus = function endRegionBonus() {
  if (this.game.state.events.vietnam_revolts_eligible == 1 && this.game.state.events.vietnam_revolts == 1) {
    this.game.state.events.vietnam_revolts_eligible = 0;
    return;
  }
  if (this.game.state.events.china_card_eligible == 1) {
    this.game.state.events.china_card_eligible = 0;
    return;
  }
}
Twilight.prototype.limitToRegionBonus = function limitToRegionBonus() {
  for (var i in this.countries) {
    if (this.countries[i].region.indexOf(this.game.state.events.region_bonus) == -1) {
      let divname = '#'+i;
      $(divname).off();
    }
  }
  return;
}
Twilight.prototype.modifyOps = function modifyOps(ops,playernum=0) {

  if (playernum == 0) { playernum = this.game.player; }

  if (this.game.state.events.brezhnev == 1 && playernum == 1) { 
    this.updateLog("USSR gets Brezhnev bonus +1");
    ops++;
  }
  if (this.game.state.events.containment == 1 && playernum == 2) { 
    this.updateLog("US gets Containment bonus +1");
    ops++;
  }
  if (this.game.state.events.redscare_player1 == 1 && playernum == 1) { 
    this.updateLog("USSR is affected by Red Purge");
    ops--; 
  }
  if (this.game.state.events.redscare_player2 == 1 && playernum == 2) { 
    this.updateLog("US is affected by Red Scare");
    ops--;
  }
  if (ops <= 0) { return 1; }
  if (ops >= 4) { return 4; }
  return ops;
}

Twilight.prototype.finalScoring = function finalScoring() {

  //
  // disable shuttle diplomacy
  //
  this.game.state.events.shuttlediplomacy = 0;

  this.scoreRegion("europe");
  this.scoreRegion("asia");
  this.scoreRegion("mideast");
  this.scoreRegion("africa");
  this.scoreRegion("southamerica");
  this.scoreRegion("centralamerica");

  this.updateVictoryPoints();

  if (this.game.state.vp < 0) {
    this.endGame("ussr", "final scoring");
  } else {
    this.endGame("us", "final scoring");
  }

  return 1;
}


Twilight.prototype.scoreRegion = function scoreRegion(card) {

  let total_us = 0;
  let total_ussr = 0;
  let bg_us = 0;
  let bg_ussr = 0;
  let vp_us = 0;
  let vp_ussr = 0;

  ////////////
  // EUROPE //
  ////////////
  if (card == "europe") {

    if (this.isControlled("us", "italy") == 1) { bg_us++; }
    if (this.isControlled("ussr", "italy") == 1) { bg_ussr++; }
    if (this.isControlled("us", "france") == 1) { bg_us++; }
    if (this.isControlled("ussr", "france") == 1) { bg_ussr++; }
    if (this.isControlled("us", "westgermany") == 1) { bg_us++; }
    if (this.isControlled("ussr", "westgermany") == 1) { bg_ussr++; }
    if (this.isControlled("us", "eastgermany") == 1) { bg_us++; }
    if (this.isControlled("ussr", "eastgermany") == 1) { bg_ussr++; }
    if (this.isControlled("us", "poland") == 1) { bg_us++; }
    if (this.isControlled("ussr", "poland") == 1) { bg_ussr++; }

    total_us = bg_us;
    total_ussr = bg_ussr;

    if (this.isControlled("us", "spain") == 1) { total_us++; }
    if (this.isControlled("ussr", "spain") == 1) { total_ussr++; }
    if (this.isControlled("us", "greece") == 1) { total_us++; }
    if (this.isControlled("ussr", "greece") == 1) { total_ussr++; }
    if (this.isControlled("us", "turkey") == 1) { total_us++; }
    if (this.isControlled("ussr", "turkey") == 1) { total_ussr++; }
    if (this.isControlled("us", "yugoslavia") == 1) { total_us++; }
    if (this.isControlled("ussr", "yugoslavia") == 1) { total_ussr++; }
    if (this.isControlled("us", "bulgaria") == 1) { total_us++; }
    if (this.isControlled("ussr", "bulgaria") == 1) { total_ussr++; }
    if (this.isControlled("us", "austria") == 1) { total_us++; }
    if (this.isControlled("ussr", "austria") == 1) { total_ussr++; }
    if (this.isControlled("us", "romania") == 1) { total_us++; }
    if (this.isControlled("ussr", "romania") == 1) { total_ussr++; }
    if (this.isControlled("us", "hungary") == 1) { total_us++; }
    if (this.isControlled("ussr", "hungary") == 1) { total_ussr++; }
    if (this.isControlled("us", "czechoslovakia") == 1) { total_us++; }
    if (this.isControlled("ussr", "czechoslovakia") == 1) { total_ussr++; }
    if (this.isControlled("us", "benelux") == 1) { total_us++; }
    if (this.isControlled("ussr", "benelux") == 1) { total_ussr++; }
    if (this.isControlled("us", "uk") == 1) { total_us++; }
    if (this.isControlled("ussr", "uk") == 1) { total_ussr++; }
    if (this.isControlled("us", "canada") == 1) { total_us++; }
    if (this.isControlled("ussr", "canada") == 1) { total_ussr++; }
    if (this.isControlled("us", "norway") == 1) { total_us++; }
    if (this.isControlled("ussr", "norway") == 1) { total_ussr++; }
    if (this.isControlled("us", "denmark") == 1) { total_us++; }
    if (this.isControlled("ussr", "denmark") == 1) { total_ussr++; }
    if (this.isControlled("us", "sweden") == 1) { total_us++; }
    if (this.isControlled("ussr", "sweden") == 1) { total_ussr++; }
    if (this.isControlled("us", "finland") == 1) { total_us++; }
    if (this.isControlled("ussr", "finland") == 1) { total_ussr++; }

    if (total_us > 0) { vp_us = 3; }
    if (total_ussr> 0) { vp_ussr = 3; }
    
    if (bg_us > bg_ussr && total_us > bg_us && total_us > total_ussr) { vp_us = 7; }
    if (bg_ussr > bg_us && total_ussr > bg_ussr && total_ussr > total_us) { vp_ussr = 7; }

    if (bg_us == 5 && total_us > total_ussr) { vp_us = 10000; }
    if (bg_ussr == 5 && total_ussr > total_us) { vp_ussr = 10000; }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;

    //
    // neighbouring countries
    //
    if (this.isControlled("us", "finland") == 1) { vp_ussr++; }
    if (this.isControlled("us", "romania") == 1) { vp_ussr++; }
    if (this.isControlled("us", "poland") == 1) { vp_ussr++; }
    if (this.isControlled("ussr", "canada") == 1) { vp_us++; }

  }



  /////////////////
  // MIDDLE EAST //
  /////////////////
  if (card == "mideast") {

    if (this.isControlled("us", "libya") == 1) { bg_us++; }
    if (this.isControlled("ussr", "libya") == 1) { bg_ussr++; }
    if (this.isControlled("us", "egypt") == 1) { bg_us++; }
    if (this.isControlled("ussr", "egypt") == 1) { bg_ussr++; }
    if (this.isControlled("us", "israel") == 1) { bg_us++; }
    if (this.isControlled("ussr", "israel") == 1) { bg_ussr++; }
    if (this.isControlled("us", "iraq") == 1) { bg_us++; }
    if (this.isControlled("ussr", "iraq") == 1) { bg_ussr++; }
    if (this.isControlled("us", "iran") == 1) { bg_us++; }
    if (this.isControlled("ussr", "iran") == 1) { bg_ussr++; }
    if (this.isControlled("us", "saudiarabia") == 1) { bg_us++; }
    if (this.isControlled("ussr", "saudiarabia") == 1) { bg_ussr++; }

    total_us = bg_us;
    total_ussr = bg_ussr;

    if (this.isControlled("us", "lebanon") == 1) { total_us++; }
    if (this.isControlled("ussr", "lebanon") == 1) { total_ussr++; }
    if (this.isControlled("us", "syria") == 1) { total_us++; }
    if (this.isControlled("ussr", "syria") == 1) { total_ussr++; }
    if (this.isControlled("us", "jordan") == 1) { total_us++; }
    if (this.isControlled("ussr", "jordan") == 1) { total_ussr++; }
    if (this.isControlled("us", "gulfstates") == 1) { total_us++; }
    if (this.isControlled("ussr", "gulfstates") == 1) { total_ussr++; }

    //
    // Shuttle Diplomacy
    //
    if (this.game.state.events.shuttlediplomacy == 1) {
      if (bg_ussr > 0) {
        bg_ussr--;
        total_ussr--;
      }
      this.game.state.events.shuttlediplomacy = 0;
    }


    if (total_us > 0) { vp_us = 3; }
    if (total_ussr> 0) { vp_ussr = 3; }
    
    if (bg_us > bg_ussr && total_us > bg_us && total_us > total_ussr) { vp_us = 5; }
    if (bg_ussr > bg_us && total_ussr > bg_ussr && total_ussr > total_us) { vp_ussr = 5; }

    if (bg_us == 6 && total_us > total_ussr) { vp_us = 7; }
    if (bg_ussr == 6 && total_ussr > total_us) { vp_ussr = 7; }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;
  }



  ////////////////////
  // SOUTHEAST ASIA //
  ////////////////////
  if (card == "seasia") {

    vp_us = 0;
    vp_ussr = 0;

    if (this.isControlled("us", "burma") == 1) { vp_us++; }
    if (this.isControlled("ussr", "burma") == 1) { vp_ussr++; }
    if (this.isControlled("us", "laos") == 1) { vp_us++; }
    if (this.isControlled("ussr", "laos") == 1) { vp_ussr++; }
    if (this.isControlled("us", "vietnam") == 1) { vp_us++; }
    if (this.isControlled("ussr", "vietnam") == 1) { vp_ussr++; }
    if (this.isControlled("us", "malaysia") == 1) { vp_us++; }
    if (this.isControlled("ussr", "malaysia") == 1) { vp_ussr++; }
    if (this.isControlled("us", "philippines") == 1) { vp_us++; }
    if (this.isControlled("ussr", "philippines") == 1) { vp_ussr++; }
    if (this.isControlled("us", "indonesia") == 1) { vp_us++; }
    if (this.isControlled("ussr", "indonesia") == 1) { vp_ussr++; }
    if (this.isControlled("us", "thailand") == 1) { vp_us+=2; }
    if (this.isControlled("ussr", "thailand") == 1) { vp_ussr+=2; }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;
  }




  ////////////
  // AFRICA //
  ////////////
  if (card == "africa") {

    if (this.isControlled("us", "algeria") == 1) { bg_us++; }
    if (this.isControlled("ussr", "algeria") == 1) { bg_ussr++; }
    if (this.isControlled("us", "nigeria") == 1) { bg_us++; }
    if (this.isControlled("ussr", "nigeria") == 1) { bg_ussr++; }
    if (this.isControlled("us", "zaire") == 1) { bg_us++; }
    if (this.isControlled("ussr", "zaire") == 1) { bg_ussr++; }
    if (this.isControlled("us", "angola") == 1) { bg_us++; }
    if (this.isControlled("ussr", "angola") == 1) { bg_ussr++; }
    if (this.isControlled("us", "southafrica") == 1) { bg_us++; }
    if (this.isControlled("ussr", "southafrica") == 1) { bg_ussr++; }

    total_us = bg_us;
    total_ussr = bg_ussr;

    if (this.isControlled("us", "morocco") == 1) { total_us++; }
    if (this.isControlled("ussr", "morocco") == 1) { total_ussr++; }
    if (this.isControlled("us", "tunisia") == 1) { total_us++; }
    if (this.isControlled("ussr", "tunisia") == 1) { total_ussr++; }
    if (this.isControlled("us", "westafricanstates") == 1) { total_us++; }
    if (this.isControlled("ussr", "westafricanstates") == 1) { total_ussr++; }
    if (this.isControlled("us", "saharanstates") == 1) { total_us++; }
    if (this.isControlled("ussr", "saharanstates") == 1) { total_ussr++; }
    if (this.isControlled("us", "sudan") == 1) { total_us++; }
    if (this.isControlled("ussr", "sudan") == 1) { total_ussr++; }
    if (this.isControlled("us", "ivorycoast") == 1) { total_us++; }
    if (this.isControlled("ussr", "ivorycoast") == 1) { total_ussr++; }
    if (this.isControlled("us", "ethiopia") == 1) { total_us++; }
    if (this.isControlled("ussr", "ethiopia") == 1) { total_ussr++; }
    if (this.isControlled("us", "somalia") == 1) { total_us++; }
    if (this.isControlled("ussr", "somalia") == 1) { total_ussr++; }
    if (this.isControlled("us", "cameroon") == 1) { total_us++; }
    if (this.isControlled("ussr", "cameroon") == 1) { total_ussr++; }
    if (this.isControlled("us", "kenya") == 1) { total_us++; }
    if (this.isControlled("ussr", "kenya") == 1) { total_ussr++; }
    if (this.isControlled("us", "seafricanstates") == 1) { total_us++; }
    if (this.isControlled("ussr", "seafricanstates") == 1) { total_ussr++; }
    if (this.isControlled("us", "zimbabwe") == 1) { total_us++; }
    if (this.isControlled("ussr", "zimbabwe") == 1) { total_ussr++; }
    if (this.isControlled("us", "botswana") == 1) { total_us++; }
    if (this.isControlled("ussr", "botswana") == 1) { total_ussr++; }

    if (total_us > 0) { vp_us = 1; }
    if (total_ussr> 0) { vp_ussr = 1; }
    
    if (bg_us > bg_ussr && total_us > bg_us && total_us > total_ussr) { vp_us = 4; }
    if (bg_ussr > bg_us && total_ussr > bg_ussr && total_ussr > total_us) { vp_ussr = 4; }

    if (bg_us == 5 && total_us > total_ussr) { vp_us = 6; }
    if (bg_ussr == 5 && total_ussr > total_us) { vp_ussr = 6; }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;
  }



  /////////////////////
  // CENTRAL AMERICA //
  /////////////////////
  if (card == "centralamerica") {

    if (this.isControlled("us", "mexico") == 1) { bg_us++; }
    if (this.isControlled("ussr", "mexico") == 1) { bg_ussr++; }
    if (this.isControlled("us", "cuba") == 1) { bg_us++; }
    if (this.isControlled("ussr", "cuba") == 1) { bg_ussr++; }
    if (this.isControlled("us", "panama") == 1) { bg_us++; }
    if (this.isControlled("ussr", "panama") == 1) { bg_ussr++; }

    total_us = bg_us;
    total_ussr = bg_ussr;

    if (this.isControlled("us", "guatemala") == 1) { total_us++; }
    if (this.isControlled("ussr", "guatemala") == 1) { total_ussr++; }
    if (this.isControlled("us", "elsalvador") == 1) { total_us++; }
    if (this.isControlled("ussr", "elsalvador") == 1) { total_ussr++; }
    if (this.isControlled("us", "honduras") == 1) { total_us++; }
    if (this.isControlled("ussr", "honduras") == 1) { total_ussr++; }
    if (this.isControlled("us", "costarica") == 1) { total_us++; }
    if (this.isControlled("ussr", "costarica") == 1) { total_ussr++; }
    if (this.isControlled("us", "nicaragua") == 1) { total_us++; }
    if (this.isControlled("ussr", "nicaragua") == 1) { total_ussr++; }
    if (this.isControlled("us", "haiti") == 1) { total_us++; }
    if (this.isControlled("ussr", "haiti") == 1) { total_ussr++; }
    if (this.isControlled("us", "dominicanrepublic") == 1) { total_us++; }
    if (this.isControlled("ussr", "dominicanrepublic") == 1) { total_ussr++; }

    if (total_us > 0) { vp_us = 1; }
    if (total_ussr > 0) { vp_ussr = 1; }
    
    if (bg_us > bg_ussr && total_us > bg_us && total_us > total_ussr) { vp_us = 3; }
    if (bg_ussr > bg_us && total_ussr > bg_ussr && total_ussr > total_us) { vp_ussr = 3; }

    if (bg_us == 3 && total_us > total_ussr) { vp_us = 5; }
    if (bg_ussr == 3 && total_ussr > total_us) { vp_ussr = 5; }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;

    //
    // neighbouring countries
    //
    if (this.isControlled("ussr", "mexico") == 1) { vp_ussr++; }
    if (this.isControlled("ussr", "cuba") == 1) { vp_ussr++; }

  }



  ///////////////////
  // SOUTH AMERICA //
  ///////////////////
  if (card == "southamerica") {

    if (this.isControlled("us", "venezuela") == 1) { bg_us++; }
    if (this.isControlled("ussr", "venezuela") == 1) { bg_ussr++; }
    if (this.isControlled("us", "brazil") == 1) { bg_us++; }
    if (this.isControlled("ussr", "brazil") == 1) { bg_ussr++; }
    if (this.isControlled("us", "argentina") == 1) { bg_us++; }
    if (this.isControlled("ussr", "argentina") == 1) { bg_ussr++; }
    if (this.isControlled("us", "chile") == 1) { bg_us++; }
    if (this.isControlled("ussr", "chile") == 1) { bg_ussr++; }

    total_us = bg_us;
    total_ussr = bg_ussr;

    if (this.isControlled("us", "colombia") == 1) { total_us++; }
    if (this.isControlled("ussr", "colombia") == 1) { total_ussr++; }
    if (this.isControlled("us", "ecuador") == 1) { total_us++; }
    if (this.isControlled("ussr", "ecuador") == 1) { total_ussr++; }
    if (this.isControlled("us", "peru") == 1) { total_us++; }
    if (this.isControlled("ussr", "peru") == 1) { total_ussr++; }
    if (this.isControlled("us", "bolivia") == 1) { total_us++; }
    if (this.isControlled("ussr", "bolivia") == 1) { total_ussr++; }
    if (this.isControlled("us", "paraguay") == 1) { total_us++; }
    if (this.isControlled("ussr", "paraguay") == 1) { total_ussr++; }
    if (this.isControlled("us", "uruguay") == 1) { total_us++; }
    if (this.isControlled("ussr", "uruguay") == 1) { total_ussr++; }

    if (total_us > 0) { vp_us = 2; }
    if (total_ussr> 0) { vp_ussr = 2; }
    
    if (bg_us > bg_ussr && total_us > bg_us && total_us > total_ussr) { vp_us = 5; }
    if (bg_ussr > bg_us && total_ussr > bg_ussr && total_ussr > total_us) { vp_ussr = 5; }

    if (bg_us == 4 && total_us > total_ussr) { vp_us = 6; }
    if (bg_ussr == 4 && total_ussr > total_us) { vp_ussr = 6; }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;
  }




  //////////
  // ASIA //
  //////////
  if (card == "asia") {

    if (this.isControlled("us", "northkorea") == 1) { bg_us++; }
    if (this.isControlled("ussr", "northkorea") == 1) { bg_ussr++; }
    if (this.isControlled("us", "southkorea") == 1) { bg_us++; }
    if (this.isControlled("ussr", "southkorea") == 1) { bg_ussr++; }
    if (this.isControlled("us", "japan") == 1) { bg_us++; }
    if (this.isControlled("ussr", "japan") == 1) { bg_ussr++; }
    if (this.isControlled("us", "thailand") == 1) { bg_us++; }
    if (this.isControlled("ussr", "thailand") == 1) { bg_ussr++; }
    if (this.isControlled("us", "india") == 1) { bg_us++; }
    if (this.isControlled("ussr", "india") == 1) { bg_ussr++; }
    if (this.isControlled("us", "pakistan") == 1) { bg_us++; }
    if (this.isControlled("ussr", "pakistan") == 1) { bg_ussr++; }
    if (this.game.state.events.formosan == 1) {
      if (this.isControlled("us", "taiwan") == 1) { bg_us++; }
      if (this.isControlled("ussr", "taiwan") == 1) { bg_ussr++; }
    }

    total_us = bg_us;
    total_ussr = bg_ussr;

    if (this.isControlled("us", "afghanistan") == 1) { total_us++; }
    if (this.isControlled("ussr", "afghanistan") == 1) { total_ussr++; }
    if (this.isControlled("us", "burma") == 1) { total_us++; }
    if (this.isControlled("ussr", "burma") == 1) { total_ussr++; }
    if (this.isControlled("us", "laos") == 1) { total_us++; }
    if (this.isControlled("ussr", "laos") == 1) { total_ussr++; }
    if (this.isControlled("us", "vietnam") == 1) { total_us++; }
    if (this.isControlled("ussr", "vietnam") == 1) { total_ussr++; }
    if (this.isControlled("us", "malaysia") == 1) { total_us++; }
    if (this.isControlled("ussr", "malaysia") == 1) { total_ussr++; }
    if (this.isControlled("us", "australia") == 1) { total_us++; }
    if (this.isControlled("ussr", "australia") == 1) { total_ussr++; }
    if (this.isControlled("us", "indonesia") == 1) { total_us++; }
    if (this.isControlled("ussr", "indonesia") == 1) { total_ussr++; }
    if (this.isControlled("us", "philippines") == 1) { total_us++; }
    if (this.isControlled("ussr", "philippines") == 1) { total_ussr++; }
    if (this.game.state.events.formosan == 0) {
      if (this.isControlled("us", "taiwan") == 1) { total_us++; }
      if (this.isControlled("ussr", "taiwan") == 1) { total_ussr++; }
    }

    //
    // Shuttle Diplomacy
    //
    if (this.game.state.events.shuttlediplomacy == 1) {
      if (bg_ussr > 0) {
        bg_ussr--;
        total_ussr--;
      }
      this.game.state.events.shuttlediplomacy = 0;
    }

    if (total_us > 0) { vp_us = 3; }
    if (total_ussr> 0) { vp_ussr = 3; }
    
    if (bg_us > bg_ussr && total_us > bg_us && total_us > total_ussr) { vp_us = 7; }
    if (bg_ussr > bg_us && total_ussr > bg_ussr && total_ussr > total_us) { vp_ussr = 7; }

    if (this.game.state.events.formosan == 1) {
      if (bg_us == 7 && total_us > total_ussr) { vp_us = 9; }
      if (bg_ussr == 7 && total_ussr > total_us) { vp_ussr = 9; }
    } else {
      if (bg_us == 6 && total_us > total_ussr) { vp_us = 9; }
      if (bg_ussr == 6 && total_ussr > total_us) { vp_ussr = 9; }
    }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;

    //
    // neighbouring countries
    //
    if (this.isControlled("us", "afghanistan") == 1) { vp_us++; }
    if (this.isControlled("us", "northkorea") == 1) { vp_us++; }
    if (this.isControlled("ussr", "japan") == 1) { vp_ussr++; }


  }

  //
  // adjust VP
  //
  let vp_adjustment = vp_us - vp_ussr;
  this.game.state.vp += vp_adjustment;

  this.updateLog("VP adjusted: " + vp_adjustment);
  this.updateVictoryPoints();

}
Twilight.prototype.doesPlayerDominateRegion = function doesPlayerDominateRegion(player, region) {

  let total_us = 0;
  let total_ussr = 0;
  let bg_us = 0;
  let bg_ussr = 0;
  let vp_us = 0;
  let vp_ussr = 0;


  ////////////
  // EUROPE //
  ////////////
  if (region == "europe") {

    if (this.isControlled("us", "italy") == 1) { bg_us++; }
    if (this.isControlled("ussr", "italy") == 1) { bg_ussr++; }
    if (this.isControlled("us", "france") == 1) { bg_us++; }
    if (this.isControlled("ussr", "france") == 1) { bg_ussr++; }
    if (this.isControlled("us", "westgermany") == 1) { bg_us++; }
    if (this.isControlled("ussr", "westgermany") == 1) { bg_ussr++; }
    if (this.isControlled("us", "eastgermany") == 1) { bg_us++; }
    if (this.isControlled("ussr", "eastgermany") == 1) { bg_ussr++; }
    if (this.isControlled("us", "poland") == 1) { bg_us++; }
    if (this.isControlled("ussr", "poland") == 1) { bg_ussr++; }

    total_us = bg_us;
    total_ussr = bg_ussr;

    if (this.isControlled("us", "spain") == 1) { total_us++; }
    if (this.isControlled("ussr", "spain") == 1) { total_ussr++; }
    if (this.isControlled("us", "greece") == 1) { total_us++; }
    if (this.isControlled("ussr", "greece") == 1) { total_ussr++; }
    if (this.isControlled("us", "turkey") == 1) { total_us++; }
    if (this.isControlled("ussr", "turkey") == 1) { total_ussr++; }
    if (this.isControlled("us", "yugoslavia") == 1) { total_us++; }
    if (this.isControlled("ussr", "yugoslavia") == 1) { total_ussr++; }
    if (this.isControlled("us", "bulgaria") == 1) { total_us++; }
    if (this.isControlled("ussr", "bulgaria") == 1) { total_ussr++; }
    if (this.isControlled("us", "austria") == 1) { total_us++; }
    if (this.isControlled("ussr", "austria") == 1) { total_ussr++; }
    if (this.isControlled("us", "romania") == 1) { total_us++; }
    if (this.isControlled("ussr", "romania") == 1) { total_ussr++; }
    if (this.isControlled("us", "hungary") == 1) { total_us++; }
    if (this.isControlled("ussr", "hungary") == 1) { total_ussr++; }
    if (this.isControlled("us", "czechoslovakia") == 1) { total_us++; }
    if (this.isControlled("ussr", "czechoslovakia") == 1) { total_ussr++; }
    if (this.isControlled("us", "benelux") == 1) { total_us++; }
    if (this.isControlled("ussr", "benelux") == 1) { total_ussr++; }
    if (this.isControlled("us", "uk") == 1) { total_us++; }
    if (this.isControlled("ussr", "uk") == 1) { total_ussr++; }
    if (this.isControlled("us", "canada") == 1) { total_us++; }
    if (this.isControlled("ussr", "canada") == 1) { total_ussr++; }
    if (this.isControlled("us", "norway") == 1) { total_us++; }
    if (this.isControlled("ussr", "norway") == 1) { total_ussr++; }
    if (this.isControlled("us", "denmark") == 1) { total_us++; }
    if (this.isControlled("ussr", "denmark") == 1) { total_ussr++; }
    if (this.isControlled("us", "sweden") == 1) { total_us++; }
    if (this.isControlled("ussr", "sweden") == 1) { total_ussr++; }
    if (this.isControlled("us", "finland") == 1) { total_us++; }
    if (this.isControlled("ussr", "finland") == 1) { total_ussr++; }

    if (total_us > 0) { vp_us = 3; }
    if (total_ussr> 0) { vp_ussr = 3; }
    
    if (bg_us > bg_ussr && total_us > bg_us && total_us > total_ussr) { vp_us = 7; }
    if (bg_ussr > bg_us && total_ussr > bg_ussr && total_ussr > total_us) { vp_ussr = 7; }

    if (total_us == 6 && total_us > total_ussr) { vp_us = 10000; }
    if (total_ussr == 6 && total_us > total_ussr) { vp_ussr = 10000; }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;

    if (vp_us >= vp_ussr+2) {
      if (player == "us") { return 1; }
      if (player == "ussr") { return 0; }
    }
    if (vp_ussr >= vp_us+2) {
      if (player == "us") { return 0; }
      if (player == "ussr") { return 1; }
    }
  }



  /////////////////
  // MIDDLE EAST //
  /////////////////
  if (region == "mideast") {

    if (this.isControlled("us", "libya") == 1) { bg_us++; }
    if (this.isControlled("ussr", "libya") == 1) { bg_ussr++; }
    if (this.isControlled("us", "egypt") == 1) { bg_us++; }
    if (this.isControlled("ussr", "egypt") == 1) { bg_ussr++; }
    if (this.isControlled("us", "israel") == 1) { bg_us++; }
    if (this.isControlled("ussr", "israel") == 1) { bg_ussr++; }
    if (this.isControlled("us", "iraq") == 1) { bg_us++; }
    if (this.isControlled("ussr", "iraq") == 1) { bg_ussr++; }
    if (this.isControlled("us", "iran") == 1) { bg_us++; }
    if (this.isControlled("ussr", "iran") == 1) { bg_ussr++; }
    if (this.isControlled("us", "saudiarabia") == 1) { bg_us++; }
    if (this.isControlled("ussr", "saudiarabia") == 1) { bg_ussr++; }

    total_us = bg_us;
    total_ussr = bg_ussr;

    if (this.isControlled("us", "lebanon") == 1) { total_us++; }
    if (this.isControlled("ussr", "lebanon") == 1) { total_ussr++; }
    if (this.isControlled("us", "syria") == 1) { total_us++; }
    if (this.isControlled("ussr", "syria") == 1) { total_ussr++; }
    if (this.isControlled("us", "jordan") == 1) { total_us++; }
    if (this.isControlled("ussr", "jordan") == 1) { total_ussr++; }
    if (this.isControlled("us", "gulfstates") == 1) { total_us++; }
    if (this.isControlled("ussr", "gulfstates") == 1) { total_ussr++; }

    if (total_us > 0) { vp_us = 3; }
    if (total_ussr> 0) { vp_ussr = 3; }
    
    if (bg_us > bg_ussr && total_us > bg_us && total_us > total_ussr) { vp_us = 5; }
    if (bg_ussr > bg_us && total_ussr > bg_ussr && total_ussr > total_us) { vp_ussr = 5; }

    if (total_us == 7 && total_us > total_ussr) { vp_us = 7; }
    if (total_ussr == 7 && total_us > total_ussr) { vp_ussr = 7; }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;

    if (vp_us >= vp_ussr+2) {
      if (player == "us") { return 1; }
      if (player == "ussr") { return 0; }
    }
    if (vp_ussr >= vp_us+2) {
      if (player == "us") { return 0; }
      if (player == "ussr") { return 1; }
    }
  }



  ////////////
  // AFRICA //
  ////////////
  if (region == "africa") {

    if (this.isControlled("us", "algeria") == 1) { bg_us++; }
    if (this.isControlled("ussr", "algeria") == 1) { bg_ussr++; }
    if (this.isControlled("us", "nigeria") == 1) { bg_us++; }
    if (this.isControlled("ussr", "nigeria") == 1) { bg_ussr++; }
    if (this.isControlled("us", "zaire") == 1) { bg_us++; }
    if (this.isControlled("ussr", "zaire") == 1) { bg_ussr++; }
    if (this.isControlled("us", "angola") == 1) { bg_us++; }
    if (this.isControlled("ussr", "angola") == 1) { bg_ussr++; }
    if (this.isControlled("us", "southafrica") == 1) { bg_us++; }
    if (this.isControlled("ussr", "southafrica") == 1) { bg_ussr++; }

    total_us = bg_us;
    total_ussr = bg_ussr;

    if (this.isControlled("us", "morocco") == 1) { total_us++; }
    if (this.isControlled("ussr", "morocco") == 1) { total_ussr++; }
    if (this.isControlled("us", "tunisia") == 1) { total_us++; }
    if (this.isControlled("ussr", "tunisia") == 1) { total_ussr++; }
    if (this.isControlled("us", "westafricanstates") == 1) { total_us++; }
    if (this.isControlled("ussr", "westafricanstates") == 1) { total_ussr++; }
    if (this.isControlled("us", "saharanstates") == 1) { total_us++; }
    if (this.isControlled("ussr", "saharanstates") == 1) { total_ussr++; }
    if (this.isControlled("us", "sudan") == 1) { total_us++; }
    if (this.isControlled("ussr", "sudan") == 1) { total_ussr++; }
    if (this.isControlled("us", "ivorycoast") == 1) { total_us++; }
    if (this.isControlled("ussr", "ivorycoast") == 1) { total_ussr++; }
    if (this.isControlled("us", "ethiopia") == 1) { total_us++; }
    if (this.isControlled("ussr", "ethiopia") == 1) { total_ussr++; }
    if (this.isControlled("us", "somalia") == 1) { total_us++; }
    if (this.isControlled("ussr", "somalia") == 1) { total_ussr++; }
    if (this.isControlled("us", "cameroon") == 1) { total_us++; }
    if (this.isControlled("ussr", "cameroon") == 1) { total_ussr++; }
    if (this.isControlled("us", "kenya") == 1) { total_us++; }
    if (this.isControlled("ussr", "kenya") == 1) { total_ussr++; }
    if (this.isControlled("us", "seafricanstates") == 1) { total_us++; }
    if (this.isControlled("ussr", "seafricanstates") == 1) { total_ussr++; }
    if (this.isControlled("us", "zimbabwe") == 1) { total_us++; }
    if (this.isControlled("ussr", "zimbabwe") == 1) { total_ussr++; }
    if (this.isControlled("us", "botswana") == 1) { total_us++; }
    if (this.isControlled("ussr", "botswana") == 1) { total_ussr++; }

    if (total_us > 0) { vp_us = 1; }
    if (total_ussr> 0) { vp_ussr = 1; }
    
    if (bg_us > bg_ussr && total_us > bg_us && total_us > total_ussr) { vp_us = 4; }
    if (bg_ussr > bg_us && total_ussr > bg_ussr && total_ussr > total_us) { vp_ussr = 4; }

    if (total_us == 7 && total_us > total_ussr) { vp_us = 6; }
    if (total_ussr == 7 && total_us > total_ussr) { vp_ussr = 6; }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;

    if (vp_us >= vp_ussr+2) {
      if (player == "us") { return 1; }
      if (player == "ussr") { return 0; }
    }
    if (vp_ussr >= vp_us+2) {
      if (player == "us") { return 0; }
      if (player == "ussr") { return 1; }
    }
  }



  /////////////////////
  // CENTRAL AMERICA //
  /////////////////////
  if (region == "centralamerica") {

    if (this.isControlled("us", "mexico") == 1) { bg_us++; }
    if (this.isControlled("ussr", "mexico") == 1) { bg_ussr++; }
    if (this.isControlled("us", "cuba") == 1) { bg_us++; }
    if (this.isControlled("ussr", "cuba") == 1) { bg_ussr++; }
    if (this.isControlled("us", "panama") == 1) { bg_us++; }
    if (this.isControlled("ussr", "panama") == 1) { bg_ussr++; }

    total_us = bg_us;
    total_ussr = bg_ussr;

    if (this.isControlled("us", "guatemala") == 1) { total_us++; }
    if (this.isControlled("ussr", "guatemala") == 1) { total_ussr++; }
    if (this.isControlled("us", "elsalvador") == 1) { total_us++; }
    if (this.isControlled("ussr", "elsalvador") == 1) { total_ussr++; }
    if (this.isControlled("us", "honduras") == 1) { total_us++; }
    if (this.isControlled("ussr", "honduras") == 1) { total_ussr++; }
    if (this.isControlled("us", "costarica") == 1) { total_us++; }
    if (this.isControlled("ussr", "costarica") == 1) { total_ussr++; }
    if (this.isControlled("us", "nicaragua") == 1) { total_us++; }
    if (this.isControlled("ussr", "nicaragua") == 1) { total_ussr++; }
    if (this.isControlled("us", "haiti") == 1) { total_us++; }
    if (this.isControlled("ussr", "haiti") == 1) { total_ussr++; }
    if (this.isControlled("us", "dominicanrepublic") == 1) { total_us++; }
    if (this.isControlled("ussr", "dominicanrepublic") == 1) { total_ussr++; }

    if (total_us > 0) { vp_us = 1; }
    if (total_ussr> 0) { vp_ussr = 1; }
    
    if (bg_us > bg_ussr && total_us > bg_us && total_us > total_ussr) { vp_us = 3; }
    if (bg_ussr > bg_us && total_ussr > bg_ussr && total_ussr > total_us) { vp_ussr = 3; }

    if (total_us == 7 && total_us > total_ussr) { vp_us = 5; }
    if (total_ussr == 7 && total_us > total_ussr) { vp_ussr = 5; }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;

    if (vp_us >= vp_ussr+2) {
      if (player == "us") { return 1; }
      if (player == "ussr") { return 0; }
    }
    if (vp_ussr >= vp_us+2) {
      if (player == "us") { return 0; }
      if (player == "ussr") { return 1; }
    }
  }



  ///////////////////
  // SOUTH AMERICA //
  ///////////////////
  if (region == "southamerica") {

    if (this.isControlled("us", "venezuela") == 1) { bg_us++; }
    if (this.isControlled("ussr", "venezuela") == 1) { bg_ussr++; }
    if (this.isControlled("us", "brazil") == 1) { bg_us++; }
    if (this.isControlled("ussr", "brazil") == 1) { bg_ussr++; }
    if (this.isControlled("us", "argentina") == 1) { bg_us++; }
    if (this.isControlled("ussr", "argentina") == 1) { bg_ussr++; }
    if (this.isControlled("us", "chile") == 1) { bg_us++; }
    if (this.isControlled("ussr", "chile") == 1) { bg_ussr++; }

    total_us = bg_us;
    total_ussr = bg_ussr;

    if (this.isControlled("us", "colombia") == 1) { total_us++; }
    if (this.isControlled("ussr", "colombia") == 1) { total_ussr++; }
    if (this.isControlled("us", "ecuador") == 1) { total_us++; }
    if (this.isControlled("ussr", "ecuador") == 1) { total_ussr++; }
    if (this.isControlled("us", "peru") == 1) { total_us++; }
    if (this.isControlled("ussr", "peru") == 1) { total_ussr++; }
    if (this.isControlled("us", "bolivia") == 1) { total_us++; }
    if (this.isControlled("ussr", "bolivia") == 1) { total_ussr++; }
    if (this.isControlled("us", "paraguay") == 1) { total_us++; }
    if (this.isControlled("ussr", "paraguay") == 1) { total_ussr++; }
    if (this.isControlled("us", "uruguay") == 1) { total_us++; }
    if (this.isControlled("ussr", "uruguay") == 1) { total_ussr++; }

    if (total_us > 0) { vp_us = 2; }
    if (total_ussr> 0) { vp_ussr = 2; }
    
    if (bg_us > bg_ussr && total_us > bg_us && total_us > total_ussr) { vp_us = 5; }
    if (bg_ussr > bg_us && total_ussr > bg_ussr && total_ussr > total_us) { vp_ussr = 5; }

    if (total_us == 7 && total_us > total_ussr) { vp_us = 6; }
    if (total_ussr == 7 && total_us > total_ussr) { vp_ussr = 6; }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;

    if (vp_us >= vp_ussr+2) {
      if (player == "us") { return 1; }
      if (player == "ussr") { return 0; }
    }
    if (vp_ussr >= vp_us+2) {
      if (player == "us") { return 0; }
      if (player == "ussr") { return 1; }
    }

  }




  //////////
  // ASIA //
  //////////
  if (region == "asia") {

    if (this.isControlled("us", "northkorea") == 1) { bg_us++; }
    if (this.isControlled("ussr", "northkorea") == 1) { bg_ussr++; }
    if (this.isControlled("us", "southkorea") == 1) { bg_us++; }
    if (this.isControlled("ussr", "southkorea") == 1) { bg_ussr++; }
    if (this.isControlled("us", "japan") == 1) { bg_us++; }
    if (this.isControlled("ussr", "japan") == 1) { bg_ussr++; }
    if (this.isControlled("us", "thailand") == 1) { bg_us++; }
    if (this.isControlled("ussr", "thailand") == 1) { bg_ussr++; }
    if (this.isControlled("us", "india") == 1) { bg_us++; }
    if (this.isControlled("ussr", "india") == 1) { bg_ussr++; }
    if (this.isControlled("us", "pakistan") == 1) { bg_us++; }
    if (this.isControlled("ussr", "pakistan") == 1) { bg_ussr++; }
    if (this.game.state.events.formosan == 1) {
      if (this.isControlled("us", "taiwan") == 1) { bg_us++; }
      if (this.isControlled("ussr", "taiwan") == 1) { bg_ussr++; }
    }

    total_us = bg_us;
    total_ussr = bg_ussr;

    if (this.isControlled("us", "afghanistan") == 1) { total_us++; }
    if (this.isControlled("ussr", "afghanistan") == 1) { total_ussr++; }
    if (this.isControlled("us", "burma") == 1) { total_us++; }
    if (this.isControlled("ussr", "burma") == 1) { total_ussr++; }
    if (this.isControlled("us", "laos") == 1) { total_us++; }
    if (this.isControlled("ussr", "laos") == 1) { total_ussr++; }
    if (this.isControlled("us", "vietnam") == 1) { total_us++; }
    if (this.isControlled("ussr", "vietnam") == 1) { total_ussr++; }
    if (this.isControlled("us", "malaysia") == 1) { total_us++; }
    if (this.isControlled("ussr", "malaysia") == 1) { total_ussr++; }
    if (this.isControlled("us", "australia") == 1) { total_us++; }
    if (this.isControlled("ussr", "australia") == 1) { total_ussr++; }
    if (this.isControlled("us", "indonesia") == 1) { total_us++; }
    if (this.isControlled("ussr", "indonesia") == 1) { total_ussr++; }
    if (this.isControlled("us", "philippines") == 1) { total_us++; }
    if (this.isControlled("ussr", "philippines") == 1) { total_ussr++; }

    if (total_us > 0) { vp_us = 3; }
    if (total_ussr> 0) { vp_ussr = 3; }
    
    if (bg_us > bg_ussr && total_us > bg_us && total_us > total_ussr) { vp_us = 7; }
    if (bg_ussr > bg_us && total_ussr > bg_ussr && total_ussr > total_us) { vp_ussr = 7; }

    if (this.game.state.events.formosan == 1) {
      if (total_us == 7 && total_us > total_ussr) { vp_us = 9; }
      if (total_ussr == 7 && total_us > total_ussr) { vp_ussr = 9; }
    } else {
      if (total_us == 6 && total_us > total_ussr) { vp_us = 9; }
      if (total_ussr == 6 && total_us > total_ussr) { vp_ussr = 9; }
    }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;

    if (vp_us >= vp_ussr+2) {
      if (player == "us") { return 1; }
      if (player == "ussr") { return 0; }
    }
    if (vp_ussr >= vp_us+2) {
      if (player == "us") { return 0; }
      if (player == "ussr") { return 1; }
    }
  }

  return 0;

}








Twilight.prototype.updateStatus = function updateStatus(str) {

  let twilight_self = this;

  this.game.status = str;

  if (this.app.BROWSER == 1) { 

    $('#status').html(this.game.status);

    try {
      $('.showcard').off();
      $('.showcard').mouseover(function() {
        let card = $(this).attr("id");
        twilight_self.showCard(card);
      }).mouseout(function() {
        let card = $(this).attr("id");
        twilight_self.hideCard(card);
      });
    } catch (err) {}


    try {
      if ($('#game_log').hasClass("loading") == true) {
        $('#game_log').removeClass("loading");
        $('#game_log').addClass("loaded");
      } else {
      }
    } catch (err) {
    }
  };

}
Twilight.prototype.updateRound = function updateRound() {

  let dt = 0;
  let dl = 0;

  if (this.game.state.round == 0) { 
    dt = this.game.state.round_ps[0].top; 
    dl = this.game.state.round_ps[0].left; 
  }
  if (this.game.state.round == 1) { 
    dt = this.game.state.round_ps[0].top; 
    dl = this.game.state.round_ps[0].left; 
  }
  if (this.game.state.round == 2) { 
    dt = this.game.state.round_ps[1].top; 
    dl = this.game.state.round_ps[1].left; 
  }
  if (this.game.state.round == 3) { 
    dt = this.game.state.round_ps[2].top; 
    dl = this.game.state.round_ps[2].left; 
  }
  if (this.game.state.round == 4) { 
    dt = this.game.state.round_ps[3].top; 
    dl = this.game.state.round_ps[3].left; 
  }
  if (this.game.state.round == 5) { 
    dt = this.game.state.round_ps[4].top; 
    dl = this.game.state.round_ps[4].left; 
  }
  if (this.game.state.round == 6) { 
    dt = this.game.state.round_ps[5].top; 
    dl = this.game.state.round_ps[5].left; 
  }
  if (this.game.state.round == 7) { 
    dt = this.game.state.round_ps[6].top; 
    dl = this.game.state.round_ps[6].left; 
  }
  if (this.game.state.round == 8) { 
    dt = this.game.state.round_ps[7].top; 
    dl = this.game.state.round_ps[7].left; 
  }
  if (this.game.state.round == 9) { 
    dt = this.game.state.round_ps[8].top; 
    dl = this.game.state.round_ps[8].left; 
  }
  if (this.game.state.round == 10) { 
    dt = this.game.state.round_ps[9].top; 
    dl = this.game.state.round_ps[9].left; 
  }

  dt = this.scale(dt)+"px";
  dl = this.scale(dl)+"px";

  $('.round').css('width', this.scale(140)+"px");
  $('.round').css('height', this.scale(140)+"px");
  $('.round').css('top', dt);
  $('.round').css('left', dl);

}

Twilight.prototype.lowerDefcon = function lowerDefcon() {

  this.game.state.defcon--;

  this.updateLog("DEFCON falls to " + this.game.state.defcon);

  if (this.game.state.defcon == 2) {
    if (this.game.state.events.norad == 1) {
      if (this.game.state.headline != 1) {
	this.game.state.us_defcon_bonus = 1;
      }
    }
  }


  if (this.game.state.defcon == 1) {
    if (this.game.state.turn == 0) {
      this.endGame("us", "USSR triggers thermonuclear war");
    } else {
      this.endGame("ussr", "US triggers thermonuclear war");
    }
  }

  this.updateDefcon();
}
Twilight.prototype.updateDefcon = function updateDefcon() {

  if (this.game.state.defcon > 5) { this.game.state.defcon = 5; }

  let dt = 0;
  let dl = 0;

  if (this.game.state.defcon == 5) { 
    dt = this.game.state.defcon_ps[0].top; 
    dl = this.game.state.defcon_ps[0].left; 
  }
  if (this.game.state.defcon == 4) { 
    dt = this.game.state.defcon_ps[1].top; 
    dl = this.game.state.defcon_ps[1].left; 
  }
  if (this.game.state.defcon == 3) { 
    dt = this.game.state.defcon_ps[2].top; 
    dl = this.game.state.defcon_ps[2].left; 
  }
  if (this.game.state.defcon == 2) { 
    dt = this.game.state.defcon_ps[3].top; 
    dl = this.game.state.defcon_ps[3].left; 
  }
  if (this.game.state.defcon == 1) { 
    dt = this.game.state.defcon_ps[4].top; 
    dl = this.game.state.defcon_ps[4].left; 
  }

  dt = this.scale(dt) + "px";
  dl = this.scale(dl) + "px";

  dt = dt;
  dl = dl;

  $('.defcon').css('width', this.scale(120)+"px");
  $('.defcon').css('height', this.scale(120)+"px");
  $('.defcon').css('top', dt);
  $('.defcon').css('left', dl);

}
Twilight.prototype.updateActionRound = function updateActionRound() {

  let dt = 0;
  let dl = 0;
  let dt_us = 0;
  let dl_us = 0;

  let turn_in_round = this.game.state.turn_in_round;

  if (turn_in_round == 0) { 
    dt = this.game.state.ar_ps[0].top; 
    dl = this.game.state.ar_ps[0].left; 
  }
  if (turn_in_round == 1) { 
    dt = this.game.state.ar_ps[0].top; 
    dl = this.game.state.ar_ps[0].left; 
  }
  if (turn_in_round == 2) { 
    dt = this.game.state.ar_ps[1].top; 
    dl = this.game.state.ar_ps[1].left; 
  }
  if (turn_in_round == 3) { 
    dt = this.game.state.ar_ps[2].top; 
    dl = this.game.state.ar_ps[2].left; 
  }
  if (turn_in_round == 4) { 
    dt = this.game.state.ar_ps[3].top; 
    dl = this.game.state.ar_ps[3].left; 
  }
  if (turn_in_round == 5) { 
    dt = this.game.state.ar_ps[4].top; 
    dl = this.game.state.ar_ps[4].left; 
  }
  if (turn_in_round == 6) { 
    dt = this.game.state.ar_ps[5].top; 
    dl = this.game.state.ar_ps[5].left; 
  }
  if (turn_in_round == 7) { 
    dt = this.game.state.ar_ps[6].top; 
    dl = this.game.state.ar_ps[6].left; 
  }
  if (turn_in_round == 8) { 
    dt = this.game.state.ar_ps[7].top; 
    dl = this.game.state.ar_ps[7].left; 
  }

  dt = this.scale(dt)+"px";
  dl = this.scale(dl)+"px";

  if (this.game.state.turn == 0) {
    $('.action_round_us').hide();
    $('.action_round_ussr').show();
    $('.action_round_ussr').css('width', this.scale(100)+"px");
    $('.action_round_ussr').css('height', this.scale(100)+"px");
    $('.action_round_ussr').css('top', dt);
    $('.action_round_ussr').css('left', dl);
  } else {
    $('.action_round_ussr').hide();
    $('.action_round_us').show();
    $('.action_round_us').css('width', this.scale(100)+"px");
    $('.action_round_us').css('height', this.scale(100)+"px");
    $('.action_round_us').css('top', dt);
    $('.action_round_us').css('left', dl);
  }

  let rounds_this_turn = 6;
  if (this.game.state.round > 3) { rounds_this_turn = 7; }
  if (this.game.state.northseaoil == 1 && this.game.player == 2) { rounds_this_turn++; }
  if (this.game.state.space_station === "us" && this.game.player == 2) { rounds_this_turn++; }
  if (this.game.state.space_station === "ussr" && this.game.player == 1) { rounds_this_turn++; }

  $('.action_round_cover').css('width', this.scale(100)+"px");
  $('.action_round_cover').css('height', this.scale(100)+"px");

  let dt8 = this.scale(this.game.state.ar_ps[7].top) + "px"; 
  let dl8 = this.scale(this.game.state.ar_ps[7].left) + "px"; 
  let dt7 = this.scale(this.game.state.ar_ps[6].top) + "px"; 
  let dl7 = this.scale(this.game.state.ar_ps[6].left) + "px"; 

  $('.action_round_8_cover').css('top', dt8);
  $('.action_round_8_cover').css('left', dl8);
  $('.action_round_7_cover').css('top', dt7);
  $('.action_round_7_cover').css('left', dl7);

  if (rounds_this_turn < 8) { $('.action_round_8_cover').css('display','all'); } else { $('.action_round_8_cover').css('display','none'); }
  if (rounds_this_turn < 7) { $('.action_round_7_cover').css('display','all'); } else { $('.action_round_7_cover').css('display','none'); }

}
Twilight.prototype.advanceSpaceRace = function advanceSpaceRace(player) {

  this.updateLog(player.toUpperCase() + " has advanced in the space race");

  if (player == "us") {

    this.game.state.space_race_us++;

    // Earth Satellite
    if (this.game.state.space_race_us == 1) {
      if (this.game.state.space_race_ussr < 1) { 
        this.game.state.vp += 2;
        this.updateVictoryPoints();  
      } else {
        this.game.state.vp += 1;
        this.updateVictoryPoints();  
      }
    }

    // Animal in Space
    if (this.game.state.space_race_us == 2) {
      if (this.game.state.space_race_ussr < 2) { 
        this.game.state.animal_in_space = "us";
      } else {
        this.game.state.animal_in_space = "";
      }
    }

    // Man in Space
    if (this.game.state.space_race_us == 3) {
      if (this.game.state.space_race_ussr < 3) { 
        this.game.state.vp += 2;
        this.updateVictoryPoints();  
      } else {
        this.game.state.animal_in_space = "";
      }
    }

    // Man in Earth Orbit
    if (this.game.state.space_race_us == 4) {
      if (this.game.state.space_race_ussr < 4) { 
        this.game.state.man_in_earth_orbit = "us";
      } else {
        this.game.state.man_in_earth_orbit = "";
        this.game.state.animal_in_space = "";
      }
    }

    // Lunar Orbit
    if (this.game.state.space_race_us == 5) {
      if (this.game.state.space_race_ussr < 5) { 
        this.game.state.vp += 3;
        this.updateVictoryPoints();  
      } else {
        this.game.state.vp += 1;
        this.updateVictoryPoints();  
        this.game.state.man_in_earth_orbit = "";
        this.game.state.animal_in_space = "";
      }
    }

    // Eagle has Landed
    if (this.game.state.space_race_us == 6) {
      if (this.game.state.space_race_ussr < 6) { 
        this.game.state.eagle_has_landed = "us";
      } else {
        this.game.state.eagle_has_landed = "";
        this.game.state.man_in_earth_orbit = "";
        this.game.state.animal_in_space = "";
      }
    }

    // Space Shuttle
    if (this.game.state.space_race_us == 7) {
      if (this.game.state.space_race_ussr < 7) { 
        this.game.state.vp += 4;
        this.updateVictoryPoints();  
      } else {
        this.game.state.vp += 2;
        this.updateVictoryPoints();  
        this.game.state.eagle_has_landed = "";
        this.game.state.man_in_earth_orbit = "";
        this.game.state.animal_in_space = "";
      }
    }

    // Space Station
    if (this.game.state.space_race_us == 8) {
      if (this.game.state.space_race_ussr < 8) { 
        this.game.state.vp += 2;
        this.updateVictoryPoints();  
        this.game.state.space_shuttle = "us";
      } else {
        this.game.state.eagle_has_landed = "";
        this.game.state.man_in_earth_orbit = "";
        this.game.state.animal_in_space = "";
        this.game.state.space_shuttle = "";
      }
    }
  }





  if (player == "ussr") {

    this.game.state.space_race_ussr++;

    // Earth Satellite
    if (this.game.state.space_race_ussr == 1) {
      if (this.game.state.space_race_us < 1) { 
        this.game.state.vp -= 2;
        this.updateVictoryPoints();  
      } else {
        this.game.state.vp -= 1;
        this.updateVictoryPoints();  
      }
    }

    // Animal in Space
    if (this.game.state.space_race_ussr == 2) {
      if (this.game.state.space_race_us < 2) { 
        this.game.state.animal_in_space = "ussr";
      } else {
        this.game.state.animal_in_space = "";
      }
    }

    // Man in Space
    if (this.game.state.space_race_ussr == 3) {
      if (this.game.state.space_race_us < 3) { 
        this.game.state.vp -= 2;
        this.updateVictoryPoints();  
      } else {
        this.game.state.animal_in_space = "";
      }
    }

    // Man in Earth Orbit
    if (this.game.state.space_race_ussr == 4) {
      if (this.game.state.space_race_us < 4) { 
        this.game.state.man_in_earth_orbit = "ussr";
      } else {
        this.game.state.animal_in_space = "";
        this.game.state.man_in_earth_orbit = "";
      }
    }

    // Lunar Orbit
    if (this.game.state.space_race_ussr == 5) {
      if (this.game.state.space_race_us < 5) { 
        this.game.state.vp -= 3;
        this.updateVictoryPoints();  
      } else {
        this.game.state.vp -= 1;
        this.updateVictoryPoints();  
        this.game.state.animal_in_space = "";
        this.game.state.man_in_earth_orbit = "";
      }
    }

    // Bear has Landed
    if (this.game.state.space_race_ussr == 6) {
      if (this.game.state.space_race_us < 6) { 
        this.game.state.eagle_has_landed = "ussr";
      } else {
        this.game.state.animal_in_space = "";
        this.game.state.man_in_earth_orbit = "";
        this.game.state.eagle_has_landed = "";
      }
    }

    // Space Shuttle
    if (this.game.state.space_race_ussr == 7) {
      if (this.game.state.space_race_us < 7) { 
        this.game.state.vp -= 4;
        this.updateVictoryPoints();  
      } else {
        this.game.state.vp -= 2;
        this.updateVictoryPoints();  
        this.game.state.animal_in_space = "";
        this.game.state.man_in_earth_orbit = "";
        this.game.state.eagle_has_landed = "";
      }
    }

    // Space Station
    if (this.game.state.space_race_ussr == 8) {
      if (this.game.state.space_race_us < 8) { 
        this.game.state.vp -= 2;
        this.updateVictoryPoints();  
        this.game.state.space_shuttle = "ussr";
      } else {
        this.game.state.animal_in_space = "";
        this.game.state.man_in_earth_orbit = "";
        this.game.state.eagle_has_landed = "";
        this.game.state.space_shuttle = "";
      }
    }
  }

  this.updateSpaceRace();
}
Twilight.prototype.updateSpaceRace = function updateSpaceRace() {

  let dt_us = 0;
  let dl_us = 0;
  let dt_ussr = 0;
  let dl_ussr = 0;

  if (this.game.state.space_race_us == 0) { 
    dt_us = this.game.state.space_race_ps[0].top; 
    dl_us = this.game.state.space_race_ps[0].left; 
  }
  if (this.game.state.space_race_us == 1) { 
    dt_us = this.game.state.space_race_ps[1].top; 
    dl_us = this.game.state.space_race_ps[1].left; 
  }
  if (this.game.state.space_race_us == 2) { 
    dt_us = this.game.state.space_race_ps[2].top; 
    dl_us = this.game.state.space_race_ps[2].left; 
  }
  if (this.game.state.space_race_us == 3) { 
    dt_us = this.game.state.space_race_ps[3].top; 
    dl_us = this.game.state.space_race_ps[3].left; 
  }
  if (this.game.state.space_race_us == 4) { 
    dt_us = this.game.state.space_race_ps[4].top; 
    dl_us = this.game.state.space_race_ps[4].left; 
  }
  if (this.game.state.space_race_us == 5) { 
    dt_us = this.game.state.space_race_ps[5].top; 
    dl_us = this.game.state.space_race_ps[5].left; 
  }
  if (this.game.state.space_race_us == 6) { 
    dt_us = this.game.state.space_race_ps[6].top; 
    dl_us = this.game.state.space_race_ps[6].left; 
  }
  if (this.game.state.space_race_us == 7) { 
    dt_us = this.game.state.space_race_ps[7].top; 
    dl_us = this.game.state.space_race_ps[7].left; 
  }
  if (this.game.state.space_race_us == 8) { 
    dt_us = this.game.state.space_race_ps[8].top; 
    dl_us = this.game.state.space_race_ps[8].left; 
  }

  if (this.game.state.space_race_ussr == 0) { 
    dt_ussr = this.game.state.space_race_ps[0].top; 
    dl_ussr = this.game.state.space_race_ps[0].left; 
  }
  if (this.game.state.space_race_ussr == 1) { 
    dt_ussr = this.game.state.space_race_ps[1].top; 
    dl_ussr = this.game.state.space_race_ps[1].left; 
  }
  if (this.game.state.space_race_ussr == 2) { 
    dt_ussr = this.game.state.space_race_ps[2].top; 
    dl_ussr = this.game.state.space_race_ps[2].left; 
  }
  if (this.game.state.space_race_ussr == 3) { 
    dt_ussr = this.game.state.space_race_ps[3].top; 
    dl_ussr = this.game.state.space_race_ps[3].left; 
  }
  if (this.game.state.space_race_ussr == 4) { 
    dt_ussr = this.game.state.space_race_ps[4].top; 
    dl_ussr = this.game.state.space_race_ps[4].left; 
  }
  if (this.game.state.space_race_ussr == 5) { 
    dt_ussr = this.game.state.space_race_ps[5].top; 
    dl_ussr = this.game.state.space_race_ps[5].left; 
  }
  if (this.game.state.space_race_ussr == 6) { 
    dt_ussr = this.game.state.space_race_ps[6].top; 
    dl_ussr = this.game.state.space_race_ps[6].left; 
  }
  if (this.game.state.space_race_ussr == 7) { 
    dt_ussr = this.game.state.space_race_ps[7].top; 
    dl_ussr = this.game.state.space_race_ps[7].left; 
  }
  if (this.game.state.space_race_ussr == 8) { 
    dt_ussr = this.game.state.space_race_ps[8].top; 
    dl_ussr = this.game.state.space_race_ps[8].left; 
  }

  dt_us = this.scale(dt_us);
  dl_us = this.scale(dl_us);
  dt_ussr = this.scale(dt_ussr+40)+"px";
  dl_ussr = this.scale(dl_ussr+10)+"px";

  $('.space_race_us').css('width', this.scale(100)+"px");
  $('.space_race_us').css('height', this.scale(100)+"px");
  $('.space_race_us').css('top', dt_us);
  $('.space_race_us').css('left', dl_us);

  $('.space_race_ussr').css('width', this.scale(100)+"px");
  $('.space_race_ussr').css('height', this.scale(100)+"px");
  $('.space_race_ussr').css('top', dt_ussr);
  $('.space_race_ussr').css('left', dl_ussr);

}
Twilight.prototype.updateEventTiles = function updateEventTiles() {

  if (this.game.state.events.warsawpact == 0) {
    $('#eventtile_warsaw').css('display','none');
  } else {
    $('#eventtile_warsaw').css('display','block');
  }

  if (this.game.state.events.degaulle == 0) {
    $('#eventtile_degaulle').css('display','none');
  } else {
    $('#eventtile_degaulle').css('display','block');
  }

  if (this.game.state.events.nato == 0) {
    $('#eventtile_nato').css('display','none');
  } else {
    $('#eventtile_nato').css('display','block');
  }

  if (this.game.state.events.marshall == 0) {
    $('#eventtile_marshall').css('display','none');
  } else {
    $('#eventtile_marshall').css('display','block');
  }

  if (this.game.state.events.usjapan == 0) {
    $('#eventtile_usjapan').css('display','none');
  } else {
    $('#eventtile_usjapan').css('display','block');
  }

  if (this.game.state.events.norad == 0) {
    $('#eventtile_norad').css('display','none');
  } else {
    $('#eventtile_norad').css('display','block');
  }

  if (this.game.state.events.quagmire == 0) {
    $('#eventtile_quagmire').css('display','none');
  } else {
    $('#eventtile_quagmire').css('display','block');
  }

  if (this.game.state.events.beartrap == 0) {
    $('#eventtile_beartrap').css('display','none');
  } else {
    $('#eventtile_beartrap').css('display','block');
  }

  if (this.game.state.events.willybrandt == 0) {
    $('#eventtile_willybrandt').css('display','none');
  } else {
    $('#eventtile_willybrandt').css('display','block');
  }

  if (this.game.state.events.campdavid == 0) {
    $('#eventtile_campdavid').css('display','none');
  } else {
    $('#eventtile_campdavid').css('display','block');
  }

  if (this.game.state.events.flowerpower == 0) {
    $('#eventtile_flowerpower').css('display','none');
  } else {
    $('#eventtile_flowerpower').css('display','block');
  }

  if (this.game.state.events.johnpaul == 0) {
    $('#eventtile_johnpaul').css('display','none');
  } else {
    $('#eventtile_johnpaul').css('display','block');
  }

  if (this.game.state.events.iranianhostage == 0) {
    $('#eventtile_iranianhostagecrisis').css('display','none');
  } else {
    $('#eventtile_iranianhostagecrisis').css('display','block');
  }

  if (this.game.state.events.ironlady == 0) {
    $('#eventtile_ironlady').css('display','none');
  } else {
    $('#eventtile_ironlady').css('display','block');
  }

  if (this.game.state.events.northseaoil == 0) {
    $('#eventtile_northseaoil').css('display','none');
  } else {
    $('#eventtile_northseaoil').css('display','block');
  }

  if (this.game.state.events.reformer == 0) {
    $('#eventtile_reformer').css('display','none');
  } else {
    $('#eventtile_reformer').css('display','block');
  }

  if (this.game.state.events.teardown == 0) {
    $('#eventtile_teardown').css('display','none');
  } else {
    $('#eventtile_teardown').css('display','block');
  }

  if (this.game.state.events.evilempire == 0) {
    $('#eventtile_evilempire').css('display','none');
  } else {
    $('#eventtile_evilempire').css('display','block');
  }

  if (this.game.state.events.awacs == 0) {
    $('#eventtile_awacs').css('display','none');
  } else {
    $('#eventtile_awacs').css('display','block');
  }

}
Twilight.prototype.updateMilitaryOperations = function updateMilitaryOperations() {

  let dt_us = 0;
  let dl_us = 0;
  let dt_ussr = 0;
  let dl_ussr = 0;

  if (this.game.state.milops_us == 0) { 
    dt_us = this.game.state.milops_ps[0].top; 
    dl_us = this.game.state.milops_ps[0].left; 
  }
  if (this.game.state.milops_us == 1) { 
    dt_us = this.game.state.milops_ps[1].top; 
    dl_us = this.game.state.milops_ps[1].left; 
  }
  if (this.game.state.milops_us == 2) { 
    dt_us = this.game.state.milops_ps[2].top; 
    dl_us = this.game.state.milops_ps[2].left; 
  }
  if (this.game.state.milops_us == 3) { 
    dt_us = this.game.state.milops_ps[3].top; 
    dl_us = this.game.state.milops_ps[3].left; 
  }
  if (this.game.state.milops_us == 4) { 
    dt_us = this.game.state.milops_ps[4].top; 
    dl_us = this.game.state.milops_ps[4].left; 
  }
  if (this.game.state.milops_us >= 5) { 
    dt_us = this.game.state.milops_ps[5].top; 
    dl_us = this.game.state.milops_ps[5].left; 
  }

  if (this.game.state.milops_ussr == 0) { 
    dt_ussr = this.game.state.milops_ps[0].top; 
    dl_ussr = this.game.state.milops_ps[0].left; 
  }
  if (this.game.state.milops_ussr == 1) { 
    dt_ussr = this.game.state.milops_ps[1].top; 
    dl_ussr = this.game.state.milops_ps[1].left; 
  }
  if (this.game.state.milops_ussr == 2) { 
    dt_ussr = this.game.state.milops_ps[2].top; 
    dl_ussr = this.game.state.milops_ps[2].left; 
  }
  if (this.game.state.milops_ussr == 3) { 
    dt_ussr = this.game.state.milops_ps[3].top; 
    dl_ussr = this.game.state.milops_ps[3].left; 
  }
  if (this.game.state.milops_ussr == 4) { 
    dt_ussr = this.game.state.milops_ps[4].top; 
    dl_ussr = this.game.state.milops_ps[4].left; 
  }
  if (this.game.state.milops_ussr >= 5) { 
    dt_ussr = this.game.state.milops_ps[5].top; 
    dl_ussr = this.game.state.milops_ps[5].left; 
  }

  dt_us = this.scale(dt_us);
  dl_us = this.scale(dl_us);
  dt_ussr = this.scale(dt_ussr+40)+"px";
  dl_ussr = this.scale(dl_ussr+10)+"px";

  $('.milops_us').css('width', this.scale(100)+"px");
  $('.milops_us').css('height', this.scale(100)+"px");
  $('.milops_us').css('top', dt_us);
  $('.milops_us').css('left', dl_us);

  $('.milops_ussr').css('width', this.scale(100)+"px");
  $('.milops_ussr').css('height', this.scale(100)+"px");
  $('.milops_ussr').css('top', dt_ussr);
  $('.milops_ussr').css('left', dl_ussr);

}
Twilight.prototype.updateVictoryPoints = function updateVictoryPoints() {

  //
  // if VP are outstanding, do not update VP and trigger end
  //
  if (this.game.state.vp_outstanding != 0) { return; }

  let dt = 0;
  let dl = 0;

  if (this.game.state.vp == -20) { 
    dt = this.game.state.vp_ps[0].top; 
    dl = this.game.state.vp_ps[0].left; 
  }
  if (this.game.state.vp == -19) { 
    dt = this.game.state.vp_ps[1].top; 
    dl = this.game.state.vp_ps[1].left; 
  }
  if (this.game.state.vp == -18) { 
    dt = this.game.state.vp_ps[2].top; 
    dl = this.game.state.vp_ps[2].left; 
  }
  if (this.game.state.vp == -17) { 
    dt = this.game.state.vp_ps[3].top; 
    dl = this.game.state.vp_ps[3].left; 
  }
  if (this.game.state.vp == -16) { 
    dt = this.game.state.vp_ps[4].top; 
    dl = this.game.state.vp_ps[4].left; 
  }
  if (this.game.state.vp == -15) { 
    dt = this.game.state.vp_ps[5].top; 
    dl = this.game.state.vp_ps[5].left; 
  }
  if (this.game.state.vp == -14) { 
    dt = this.game.state.vp_ps[6].top; 
    dl = this.game.state.vp_ps[6].left; 
  }
  if (this.game.state.vp == -13) { 
    dt = this.game.state.vp_ps[7].top; 
    dl = this.game.state.vp_ps[7].left; 
  }
  if (this.game.state.vp == -12) { 
    dt = this.game.state.vp_ps[8].top; 
    dl = this.game.state.vp_ps[8].left; 
  }
  if (this.game.state.vp == -11) { 
    dt = this.game.state.vp_ps[9].top; 
    dl = this.game.state.vp_ps[9].left; 
  }
  if (this.game.state.vp == -10) { 
    dt = this.game.state.vp_ps[10].top; 
    dl = this.game.state.vp_ps[10].left; 
  }
  if (this.game.state.vp == -9) { 
    dt = this.game.state.vp_ps[11].top; 
    dl = this.game.state.vp_ps[11].left; 
  }
  if (this.game.state.vp == -8) { 
    dt = this.game.state.vp_ps[12].top; 
    dl = this.game.state.vp_ps[12].left; 
  }
  if (this.game.state.vp == -7) { 
    dt = this.game.state.vp_ps[13].top; 
    dl = this.game.state.vp_ps[13].left; 
  }
  if (this.game.state.vp == -6) { 
    dt = this.game.state.vp_ps[14].top; 
    dl = this.game.state.vp_ps[14].left; 
  }
  if (this.game.state.vp == -5) { 
    dt = this.game.state.vp_ps[15].top; 
    dl = this.game.state.vp_ps[15].left; 
  }
  if (this.game.state.vp == -4) { 
    dt = this.game.state.vp_ps[16].top; 
    dl = this.game.state.vp_ps[16].left; 
  }
  if (this.game.state.vp == -3) { 
    dt = this.game.state.vp_ps[17].top; 
    dl = this.game.state.vp_ps[17].left; 
  }
  if (this.game.state.vp == -2) { 
    dt = this.game.state.vp_ps[18].top; 
    dl = this.game.state.vp_ps[18].left; 
  }
  if (this.game.state.vp == -1) { 
    dt = this.game.state.vp_ps[19].top; 
    dl = this.game.state.vp_ps[19].left; 
  }
  if (this.game.state.vp == 0) { 
    dt = this.game.state.vp_ps[20].top; 
    dl = this.game.state.vp_ps[20].left; 
  }
  if (this.game.state.vp == 1) { 
    dt = this.game.state.vp_ps[21].top; 
    dl = this.game.state.vp_ps[21].left; 
  }
  if (this.game.state.vp == 2) { 
    dt = this.game.state.vp_ps[22].top; 
    dl = this.game.state.vp_ps[22].left; 
  }
  if (this.game.state.vp == 3) { 
    dt = this.game.state.vp_ps[23].top; 
    dl = this.game.state.vp_ps[23].left; 
  }
  if (this.game.state.vp == 4) { 
    dt = this.game.state.vp_ps[24].top; 
    dl = this.game.state.vp_ps[24].left; 
  }
  if (this.game.state.vp == 5) { 
    dt = this.game.state.vp_ps[25].top; 
    dl = this.game.state.vp_ps[25].left; 
  }
  if (this.game.state.vp == 6) { 
    dt = this.game.state.vp_ps[26].top; 
    dl = this.game.state.vp_ps[26].left; 
  }
  if (this.game.state.vp == 7) { 
    dt = this.game.state.vp_ps[27].top; 
    dl = this.game.state.vp_ps[27].left; 
  }
  if (this.game.state.vp == 8) { 
    dt = this.game.state.vp_ps[28].top; 
    dl = this.game.state.vp_ps[28].left; 
  }
  if (this.game.state.vp == 9) { 
    dt = this.game.state.vp_ps[29].top; 
    dl = this.game.state.vp_ps[29].left; 
  }
  if (this.game.state.vp == 10) { 
    dt = this.game.state.vp_ps[30].top; 
    dl = this.game.state.vp_ps[30].left; 
  }
  if (this.game.state.vp == 11) { 
    dt = this.game.state.vp_ps[31].top; 
    dl = this.game.state.vp_ps[31].left; 
  }
  if (this.game.state.vp == 12) { 
    dt = this.game.state.vp_ps[32].top; 
    dl = this.game.state.vp_ps[32].left; 
  }
  if (this.game.state.vp == 13) { 
    dt = this.game.state.vp_ps[33].top; 
    dl = this.game.state.vp_ps[33].left; 
  }
  if (this.game.state.vp == 14) { 
    dt = this.game.state.vp_ps[34].top; 
    dl = this.game.state.vp_ps[34].left; 
  }
  if (this.game.state.vp == 15) { 
    dt = this.game.state.vp_ps[35].top; 
    dl = this.game.state.vp_ps[35].left; 
  }
  if (this.game.state.vp == 16) { 
    dt = this.game.state.vp_ps[36].top; 
    dl = this.game.state.vp_ps[36].left; 
  }
  if (this.game.state.vp == 17) { 
    dt = this.game.state.vp_ps[37].top; 
    dl = this.game.state.vp_ps[37].left; 
  }
  if (this.game.state.vp == 18) { 
    dt = this.game.state.vp_ps[38].top; 
    dl = this.game.state.vp_ps[38].left; 
  }
  if (this.game.state.vp == 19) { 
    dt = this.game.state.vp_ps[39].top; 
    dl = this.game.state.vp_ps[39].left; 
  }
  if (this.game.state.vp == 20) { 
    dt = this.game.state.vp_ps[40].top; 
    dl = this.game.state.vp_ps[40].left; 
  }


  if (this.app.BROWSER == 1) {

    if (this.game.state.vp > 19) {
      this.endGame("us", "victory point track");
    }
    if (this.game.state.vp < -19) {
      this.endGame("ussr", "victory point track");
    }

    dt = this.scale(dt);
    dl = this.scale(dl);

    dt = dt + "px";
    dl = dl + "px";

    $('.vp').css('width', this.scale(120)+"px");
    $('.vp').css('height', this.scale(120)+"px");
    $('.vp').css('top', dt);
    $('.vp').css('left', dl);
  }
}








///////////////
// webServer //
///////////////
Twilight.prototype.webServer = function webServer(app, expressapp) {

  expressapp.get('/twilight/', function (req, res) {
    res.sendFile(__dirname + '/web/index.html');
    return;
  });
  expressapp.get('/twilight/help', function (req, res) {
    res.sendFile(__dirname + '/web/help.html');
    return;
  });
  expressapp.get('/twilight/style.css', function (req, res) {
    res.sendFile(__dirname + '/web/style.css');
    return;
  });
  expressapp.get('/twilight/script.js', function (req, res) {
    res.sendFile(__dirname + '/web/script.js');
    return;

  });
  expressapp.get('/twilight/images/:imagefile', function (req, res) {
    var imgf = '/web/images/'+req.params.imagefile;
    if (imgf.indexOf("\/") != false) { return; }
    res.sendFile(__dirname + imgf);
    return;
  });
  expressapp.get('/twilight/images/zh/:imagefile', function (req, res) {
    var imgf = '/web/images/zh/'+req.params.imagefile;
    if (imgf.indexOf("\/") != false) { return; }
    res.sendFile(__dirname + imgf);
    return;
  });
  expressapp.get('/twilight/images/en/:imagefile', function (req, res) {
    var imgf = '/web/images/en/'+req.params.imagefile;
    if (imgf.indexOf("\/") != false) { return; }
    res.sendFile(__dirname + imgf);
    return;
  });

}


Twilight.prototype.showCard = function showCard(cardname) {

  let c = this.game.deck[0].cards[cardname];
  if (c == undefined) { c = this.game.deck[0].discards[cardname]; }
  if (c == undefined) { c = this.game.deck[0].removed[cardname]; }

  let url = '<img class="cardimg" src="/twilight/images/' + this.lang + "/" + c.img + '.svg" />';
      url +='<img class="cardimg" src="/twilight/images/EarlyWar.svg" />';
  if (c.player == "both") {
      url +='<img class="cardimg" src="/twilight/images/BothPlayerCard.svg" />';
      if (c.ops == 1) { url +='<img class="cardimg" src="/twilight/images/White1.svg" />'; }
      if (c.ops == 2) { url +='<img class="cardimg" src="/twilight/images/White2.svg" />'; }
      if (c.ops == 3) { url +='<img class="cardimg" src="/twilight/images/White3.svg" />'; }
      if (c.ops == 4) { url +='<img class="cardimg" src="/twilight/images/White4.svg" />'; }
      if (c.ops == 1) { url +='<img class="cardimg" src="/twilight/images/Black1.svg" />'; }
      if (c.ops == 2) { url +='<img class="cardimg" src="/twilight/images/Black2.svg" />'; }
      if (c.ops == 3) { url +='<img class="cardimg" src="/twilight/images/Black3.svg" />'; }
      if (c.ops == 4) { url +='<img class="cardimg" src="/twilight/images/Black4.svg" />'; }
  }
  if (c.player == "us") {
      url +='<img class="cardimg" src="/twilight/images/AmericanPlayerCard.svg" />';
      if (c.ops == 1) { url +='<img class="cardimg" src="/twilight/images/Black1.svg" />'; }
      if (c.ops == 2) { url +='<img class="cardimg" src="/twilight/images/Black2.svg" />'; }
      if (c.ops == 3) { url +='<img class="cardimg" src="/twilight/images/Black3.svg" />'; }
      if (c.ops == 4) { url +='<img class="cardimg" src="/twilight/images/Black4.svg" />'; }
  }
  if (c.player == "ussr") {
      url +='<img class="cardimg" src="/twilight/images/SovietPlayerCard.svg" />';
      if (c.ops == 1) { url +='<img class="cardimg" src="/twilight/images/White1.svg" />'; }
      if (c.ops == 2) { url +='<img class="cardimg" src="/twilight/images/White2.svg" />'; }
      if (c.ops == 3) { url +='<img class="cardimg" src="/twilight/images/White3.svg" />'; }
      if (c.ops == 4) { url +='<img class="cardimg" src="/twilight/images/White4.svg" />'; }
  }
  if (c.scoring == 1) {
      url +='<img class="cardimg" src="/twilight/images/MayNotBeHeld.svg" />';
  }
  if (c.recurring == 0) {
      url +='<img class="cardimg" src="/twilight/images/RemoveFromPlay.svg" />';
  }


  //
  // mobile needs recentering
  //
  if (this.app.browser.isMobileBrowser(navigator.userAgent)) {
    $('#cardbox').css('top','100px');
    $('#cardbox').css('left','100px');
  }

  $('#cardbox').html(url);
  $('#cardbox').show();
}
Twilight.prototype.hideCard = function hideCard() {
  $('#cardbox').hide();
}



//
// OVERWRITES GAME.JS MODULE TO ADD CARD HOVERING
//
Twilight.prototype.updateLog = function updateLog(str, length = 25) {

  let twilight_self = this;

  if (str) {
    this.game.log.unshift(str);
    if (this.game.log.length > length) { this.game.log.splice(length); }
  }

  let html = '';

  for (let i = 0; i < this.game.log.length; i++) {
    if (i > 0) { html += '<br/>'; }
    html += "> " + this.game.log[i];
  }

  if (this.app.BROWSER == 1) {

    $('#log').html(html);
      $('.logcard').off();
      $('.logcard').mouseover(function() {
      let card = $(this).attr("id");
      twilight_self.showCard(card);
    }).mouseout(function() {
      let card = $(this).attr("id");
      twilight_self.hideCard(card);
    });

    try {
      if (! $('#game_log').isVisible()) {
        $('#game_log').addClass("loading");
      }
    } catch (err) {}

  }

}







Twilight.prototype.returnGameOptionsHTML = function returnGameOptionsHTML() {

  return `
        <h3>Twilight Struggle: </h3>

        <p></p>

        <form id="options" class="options" style="font-size:1.2em">

          <label for="player1">Play as:</label>
          <select name="player1" style="font-size:1.2em">
            <option value="random">random</option>
            <option value="ussr" default>USSR</option>
            <option value="us">US</option>
          </select>

          <p></p>

          <label for="deck">Deck:</label>
          <select name="deck" style="font-size:1.2em">
            <option value="original">original</option>
            <option value="optional" selected>optional</option>
          </select>

          <p></p>

          <label for="usbonus">US bonus: </label>
          <select name="usbonus" style="font-size:1.2em">
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
          </select>

        </form>

	`;

}

Twilight.prototype.settleVPOutstanding = function settleVPOutstanding() {

  if (this.game.state.vp_outstanding != 0) {
    this.game.state.vp += this.game.state.vp_outstanding;
  }
  this.game.state.vp_outstanding = 0;
  this.updateVictoryPoints();

}


