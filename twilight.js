var saito = require('../../../saito');
var Game = require('../../game');
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

  //
  // this sets the ratio used for determining
  // the size of the original pieces
  //
  this.boardgameWidth  = 5100;

  this.moves           = [];

  return this;

}
module.exports = Twilight;
util.inherits(Twilight, Game);





////////////////
// initialize //
////////////////
Twilight.prototype.initializeGame = async function initializeGame(game_id) {

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
    this.game.state     = this.returnState();
  }
  if (this.game.deck.cards.length == 0) {
    this.updateStatus("Generating the Game");
    this.initializeDeck(this.returnEarlyWarCards());
    this.game.discard = {};
    this.game.removed = {}; 
  }

  this.countries = this.game.countries;

  //
  // adjust screen ratio
  //
  $('.country').css('width', this.scale(202));
  $('.us').css('width', this.scale(100));
  $('.ussr').css('width', this.scale(100));
  $('.us').css('height', this.scale(100));
  $('.ussr').css('height', this.scale(100));

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
    $(divname).css('top', this.scale(this.countries[i].top));
    $(divname).css('left', this.scale(this.countries[i].left));
    $(divname_us).css('height', this.scale(100));
    $(divname_ussr).css('height', this.scale(100));

    //
    // restore influence
    //
    if (this.countries[i].us > 0) { this.showInfluence(i, "us"); }
    if (this.countries[i].ussr > 0) { this.showInfluence(i, "ussr"); }
  } 



  //
  // if the browser is active, shift to the game that way
  //
  if (this.browser_active == 1) {
    let msg = {};
    msg.extra = {};
    msg.extra.target = this.game.target;
    this.handleGame(msg);
  }

}





//
// Core Game Logic
//
Twilight.prototype.handleGame = function handleGame(msg=null) {

  let twilight_self = this;

  if (this.game.dice == "") { this.initializeDice(); }
  
  let msg_undefined = 0;
  if (msg == null) { msg_undefined = 1; }
  if (msg_undefined == 1) {  msg = {}; }
  if (msg.extra == undefined) { msg.extra = {}; }
  if (msg.extra.target == undefined) { if (this.game.target != undefined) { msg.extra.target = this.game.target; } }
  if (msg.extra.target == undefined) { msg.extra.target = this.game.state.turn+1; } // turn 0 = ussr
  if (msg.turn == undefined) { msg.turn = []; }

  let player = "ussr";
  if (this.game.player == 2) { player = "us"; }



  if (msg.extra.skipqueue != 1) {

    ///////////
    // QUEUE //
    ///////////
    if (this.game.state.queue != undefined) {

      //
      // add incoming to game queue
      // 
      for (let i = 0; i < msg.turn.length; i++) { this.game.state.queue.push(msg.turn[i]); }
      msg.turn = [];

      while (this.game.state.queue.length > 0) {

  console.log("queue: " + JSON.stringify(this.game.state.queue));

        let qe = this.game.state.queue.length-1;
        let mv = this.game.state.queue[qe].split("\t");
        let shd_continue = 1;

        //
        // ops [us/ussr] card num
        // round
        // move [us/ussr]
        // turn [us/ussr]
        // event [us/ussr] card
        // remove [us/ussr] [us/ussr] countryname influence     // player moving, then player whose ops to remove
        // place [us/ussr] [us/ussr] countryname influence      // player moving, then player whose ops to remove
        // resolve card
        // defcon [lower/raise]
        // notify [msg]
        // coup [us/ussr] countryname influence
        // realign [us/ussr] countryname
        // card [us/ussr] card  --> hand card to play
        // vp [us/ussr] points
        // discard [us/ussr] card --> discard from hand
	// cambridge region
        //
        if (mv[0] == "discard") {
          if (mv[2] == "china") { 
          } else {
            for (var i in this.game.deck) {
              if (mv[2] === i) {
  	        //
	        // move to discard pile
	        //
                this.updateLog(mv[1].toUpperCase() + " discards " + this.game.cards[mv[2]].name);
	        this.game.discard[i] = this.game.deck[i];
	        delete this.game.deck[i];
	      }
            }
          }
          this.game.state.queue.splice(qe, 1);
        }
	//
	// cambridge five
	//
        if (mv[0] == "cambridge") {
	  if (this.game.player == 1) {
	    let placetxt = player.toUpperCase() + " place 1 OP in";
	    for (let b = 1; b < mv.length; b++) {
	      placetxt += " ";
	      placetxt += mv[b];
	    }
	    twilight_self.updateStatus(placetxt);
	    for (let i = 1; i < mv.length; i++) {
	      for (var k in this.countries) {
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
          this.game.state.queue.splice(qe, 1);
          shd_continue = 0;
        }
        if (mv[0] == "ops") {
	  this.updateLog(mv[1].toUpperCase() + " plays " + this.game.cards[mv[2]].name + " for " + mv[3] + " OPS"); 
          this.playOps(mv[1], mv[3], mv[2]);
          this.game.state.queue.splice(qe, 1);
          shd_continue = 0;
        }
        if (mv[0] == "vp") {
          this.updateLog(mv[1].toUpperCase() + " receives " + mv[2] + " VP");
          if (mv[1] == "us") {
    	    this.updateLog(mv[1].toUpperCase() + " receives " + mv[2] + " VP");
	    this.game.state.vp += parseInt(mv[2]);
          } else {
    	    this.updateLog(mv[1].toUpperCase() + " receives " + mv[2] + " VP");
	    this.game.state.vp -= parseInt(mv[2]);
          }
          this.updateVictoryPoints();
          this.game.state.queue.splice(qe, 1);
        }
        if (mv[0] == "coup") {
	  this.updateLog(mv[1].toUpperCase() + " coups " + mv[2] + " with " + mv[3] + " OPS"); 
          if (mv[1] == "us") { this.game.state.milops_us += parseInt(mv[3]); }
          if (mv[1] == "ussr") { this.game.state.milops_ussr += parseInt(mv[3]); }
	  this.updateMilitaryOperations();
 	  this.playCoup(mv[1], mv[2], mv[3]);
          this.game.state.queue.splice(qe, 1);
        }
        if (mv[0] == "realign") {
	  this.updateLog(mv[1].toUpperCase() + " realigns " + mv[2] + " with 1 OPS"); 
	  if (mv[1] != player) { this.playRealign(mv[2]); }
          this.game.state.queue.splice(qe, 1);
        }
        if (mv[0] == "defcon") {
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
          this.game.state.queue.splice(qe, 1);
        }
        if (mv[0] == "notify") {
	  this.updateLog(mv[1]);
          this.game.state.queue.splice(qe, 1);
        }
        if (mv[0] == "round") {
          this.game.state.round = parseInt(this.game.state.round)+1;
          this.game.state.queue.splice(qe, 1);
        }
        if (mv[0] == "move") {
          if (mv[1] == "ussr") { this.game.state.move = 0; }
          if (mv[1] == "us") { this.game.state.move = 1; }
          this.game.state.queue.splice(qe, 1);
        }
        if (mv[0] == "turn") {

	  //
          // deactivate cards
	  //
  	  this.game.state.events.china_card = 0;
  	  this.game.state.events.china_card_eligible = 0;

	  //
	  // NORAD 
	  //
	  if (this.game.state.us_defcon_bonus == 1) {

	    let twilight_self = this;
	    this.game.state.us_defcon_bonus = 0;

	    if (this.game.player == 1) { return; }
	    if (this.game.player == 2) {

              for (var i in this.countries) {

                let countryname  = i;
	        let divname      = '#'+i;

	        if (this.countries[countryname].us > 0) {

                  $(divname).off();
                  $(divname).on('click', function() {

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

	    return;

          } else {

  	    //
	    // remove at beginning so we go
            // right through queue next 
	    // turn
	    //
            this.game.state.queue.splice(qe, 1);

            if (mv[1] == "ussr") { 
              this.game.state.turn = 0; 
  	      this.game.state.turn_in_round++;

	      if (this.game.state.round > 3) {
	        if (this.game.state.turn_in_round >= 7) {
	          this.endRound();
	          return;
	        }
	      } else {
	        if (this.game.state.turn_in_round >= 6) {
	          this.endRound();
	          return;
	        }
              }
            }
            if (mv[1] == "us") { 
  	      this.game.state.turn = 1; 
            }

	    this.updateDefcon();
	    this.updateActionRound();
	    this.updateSpaceRace();
	    this.updateVictoryPoints();
	    this.updateMilitaryOperations();
	    this.updateRound();

            this.game.state.queue.splice(qe, 1);
	    this.updateRound();
	  }
        }
        if (mv[0] == "event") {
          shd_continue = this.playEvent(mv[1], mv[2]);
	  this.updateLog(mv[1].toUpperCase() + " triggers " + this.game.cards[mv[2]].name + " event"); 
          if (mv[1] == "china") {
          } else {
            //
            // remove non-recurring events from game
            //
            for (var i in this.game.deck) {
              if (mv[1] == i) {
	        if (this.game.deck[i].recurring != 1) {
	          this.game.removed[i] = this.game.deck[i];
	          delete this.game.deck[i];
	        }
  	      }
            }
            for (var i in this.game.discard) {
              if (mv[1] == i) {
	        if (this.game.discard[i].recurring != 1) {
	          this.game.removed[i] = this.game.discard[i];
	          delete this.game.deck[i];
	        }
  	      }
            }
          }
          this.game.state.queue.splice(qe, 1);
        }
        if (mv[0] == "place") {
          if (player != mv[1]) { this.placeInfluence(mv[3], parseInt(mv[4]), mv[2]); }
          this.game.state.queue.splice(qe, 1);
        }
        if (mv[0] == "remove") {
          if (player != mv[1]) { this.removeInfluence(mv[3], parseInt(mv[4]), mv[2]); }
          this.game.state.queue.splice(qe, 1);
        }
        if (mv[0] == "resolve") {
	  //
	  // this can happen if we headline a complicated
	  // back-and-forth that is not event-triggered 
	  // like The Cambridge Five
	  //
	  if (qe == 0) {
  	    this.game.state.queue = [];
	  } else {

            let le = qe-1;

            //
            // resolving UN intervention means disabling the effect
            //
            if (mv[1] == "unintervention") {
              let lmv = this.game.state.queue[le].split("\t");
              if (lmv[0] == "event" && lmv[2] == mv[1]) {
                this.game.state.events.unintervention = 0;
  	      }
            }
            //
            // we can remove the event if it is immediately above us in the queue
            //
            if (le <= 0) { 
              this.game.state.queue = [];
            } else {

              let lmv = this.game.state.queue[le].split("\t");
	      let rmvd = 0;

              if (lmv[0] == "event" && lmv[2] == mv[1]) {
  	        this.game.state.queue.splice(le, 2);
	        rmvd = 1;
	      }
              if (lmv[0] == "discard" && lmv[2] == mv[1]) {
  	        this.game.state.queue.splice(qe, 1);
	        rmvd = 1;
	      }
	      //
	      // testing whether this causes problems!
	      //
	      if (rmvd == 0) {
  	        this.game.state.queue.splice(qe, 1);
	      }
            }
          }
        }

        //
        // save each loop
        //
        this.saveGame(this.game.id);

        //
        // avoid infinite loops if waiting
        //
        if (shd_continue == 0) { 
	  console.log("NOT CONTINUING");
	  return; 
	}

      }
    }
  } // skip queue






console.log("1 ---- 1");


  ////////////////
  // DEAL CARDS //
  ////////////////
  //
  // cards are dealt player by player
  //
  if (this.game.state.dealt < (this.game.opponents.length+2)) {

    console.log("JUST ENTERED CARD DEALING: " + this.game.state.dealt);
    if (this.game.state.dealt == 0) { this.updateLog("Dealing new cards..."); }
    this.updateStatus("Dealing new cards. This may take several minutes if handled directly on-chain.... ");

    var cards_to_deal = 8;
    var do_i_have_china = 0;
    for (let i = 0; i < this.game.hand.length; i++) { if (this.game.hand[i] == "china") { do_i_have_china = 1; } }

    if (this.game.state.round > 0) {
      if (this.game.state.round < 3) {
        cards_to_deal = 8 - this.game.hand.length;
      }
      if (this.game.state.round >= 3) {
        cards_to_deal = 9 - this.game.hand.length;
      }
      if (do_i_have_china == 1) { cards_to_deal++; }
    }


    //
    // the next time we hit this, another player
    // will ask for cards, until we are all out
    // of players. So the "deal" function in the 
    // game module should only kick back here once
    // the receiving player has fully received their
    // cards.
    //
    this.game.state.dealt++;

    if (this.game.state.dealt == this.game.opponents.length+2 && this.game.state.round == 0) {
      let title = this.emailAppName + " Game Ready";
      let data  = 'Your game of ' + this.emailAppName + ' is ready to begin.<p></p><div id="'+this.game.id+'_'+this.game.module+'" class="open_game link">Click here to open or continue this game.</div>';
      let email_self = this.app.modules.returnModule("Email");

      let newtx = new saito.transaction();
      newtx.transaction.ts = new Date().getTime();
      newtx.transaction.from = [];
      newtx.transaction.to = [];
      newtx.transaction.from.push(new saito.slip(this.app.wallet.returnPublicKey()));
      newtx.transaction.to.push(new saito.slip(this.app.wallet.returnPublicKey()));
      email_self.receiveMail(title, data, newtx, function() {});

    }

    if (this.game.player == this.game.state.dealt) {

      let extra      = {};
      extra.receiver = this.game.player;  // who gets cards
      extra.target   = this.returnNextPlayer(this.game.player);  // start with whom?
      extra.cards    = cards_to_deal;     // how many cards
      this.game.turn = [];
      this.sendMessage("deal", extra);

      this.updateStatus("Player " + this.game.player + " is being dealt cards...");

    }
    return;
  }
   




console.log("1 ---- 2");




  ///////////////////////
  // Initial Influence //
  ///////////////////////
  if (this.browser_active == 0) { return; }
  if (this.game.state.placement == 0) {

    //
    // add china card
    //
    this.game.cards["china"] = this.returnChinaCard();
    if (this.game.player == 1) {
      let hand_contains_china = 0;
      for (let x = 0; x < this.game.hand.length; x++) {
        if (this.game.hand[x] == "china") { hand_contains_china = 1; }
      }
      if (hand_contains_china == 0) {
        this.game.hand.push("china");
      }
    }
    if (msg.extra.target == 1) {
      this.updateLog("USSR placing initial influence.");
      if (this.game.player == 1) {
        this.playerPlaceInitialInfluence("ussr");
      } else {
        this.updateStatus("USSR is making its initial placemement of influence.");
      }
    }
    if (msg.extra.target == 2) {
      this.updateLog("US placing initial influence.");
      if (this.game.player == 2) {
        this.playerPlaceInitialInfluence("us");
      } else {
        this.updateStatus("US is making its initial placemement of influence.");
      }
    }
    return;
  } else {
    if (this.game.player == 1) {
      let count = 0;
      for (var i in this.countries) {
        count = parseInt(count) + parseInt(this.countries[i].us);
      }
      if (count < 20) {
        this.updateStatus("Waiting for US to finish placing initial influence.");
        return;
      }
    }
  }







console.log("1 ---- 3");







  ////////////////////
  // Headline Cards //
  ////////////////////
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
        this.updateStatus("Waiting for USSR to pick headline card");
      }
      return;
    }

    if (msg.extra.target == 2) {
      this.updateLog("US selecting headline card");
      if (this.game.player == 2) {

        //
        // accept headline card submission
        //
        this.game.state.headline_opponent_hash = msg.turn[0];
        this.saveGame(this.game.id);

        //
        // then make my own turn
        //
        this.playerPickHeadlineCard();

      } else {
        this.updateStatus("Waiting for US to pick headline card");
	if (this.game.player == 1) { 
	  this.game.state.headline1 = 1;
	}
      }
      return;
    }
    return;
  }

  if (this.game.state.headline2 == 0) {

    //
    // player one sends XOR
    //
    if (msg.extra.target == 1) {
      if (this.game.player == 1) {

        this.game.state.headline_opponent_hash = msg.turn[0];

        this.game.turn = [];
        this.game.turn[0] = this.game.state.headline_card;
        this.game.turn[1] = this.game.state.headline_xor;

        this.saveGame(this.game.id);

        let extra      = {};
            extra.skipqueue = 1;
            extra.target   = this.returnNextPlayer(this.game.player);
        this.sendMessage("game", extra);

        return;

      } else {
        this.updateStatus("Waiting for USSR to send confirming information");
      }
      return;
    }


    //
    // player two sends XOR
    //
    if (msg.extra.target == 2) {
      if (this.game.player == 2) {

        this.game.state.headline_opponent_card = msg.turn[0];
        this.game.state.headline_opponent_xor = msg.turn[1];

        this.updateStatus("Exchanging encrypted and shuffled cards...");
        this.updateLog("Secure card exchange...");

        this.game.turn = [];
        this.game.turn[0] = this.game.state.headline_card;
        this.game.turn[1] = this.game.state.headline_xor;

        if (this.game.state.headline_opponent_hash != this.app.crypto.encodeXOR(this.app.crypto.stringToHex(this.game.state.headline_opponent_card), this.game.state.headline_opponent_xor)) {
alert("PLAYER 1 HASH WRONG: " + this.game.state.headline_opponent_hash + " -- " + this.game.state.headline_opponent_card + " -- " + this.game.headline_opponent_xor + " -- " + this.app.crypto.encodeXOR(this.app.crypto.stringToHex(this.game.state.headline_opponent_card), this.game.state.headline_opponent_xor));
        }

        this.game.state.headline2 = 1;
        this.saveGame(this.game.id);

        let extra      = {};
            extra.skipqueue = 1;
            extra.target   = this.returnNextPlayer(this.game.player);
        this.sendMessage("game", extra);

        return;

      } else {

        this.updateStatus("Waiting for US to decrypt USSR headline card...");
        this.game.state.headline2 = 1;
	this.saveGame(this.game.id);

      }
      return;
    }
    return;
  }


  if (this.game.state.headline3 == 0) {

    //
    // player one receives confirming info
    //
    if (msg.extra.target == 1) {
      if (this.game.player == 1) {

console.log("target 1, headline 3: USSR");

        this.game.state.headline_opponent_card = msg.turn[0];
        this.game.state.headline_opponent_xor = msg.turn[1];

        if (this.game.state.headline_opponent_hash != this.app.crypto.encodeXOR(this.app.crypto.stringToHex(this.game.state.headline_opponent_card), this.game.state.headline_opponent_xor)) {
alert("PLAYER 2 HASH WRONG: " + this.game.state.headline_opponent_hash + " -- " + this.game.state.headline_opponent_card + " -- " + this.game.headline_opponent_xor + " -- " + this.app.crypto.encodeXOR(this.app.crypto.stringToHex(this.game.state.headline_opponent_card), this.game.state.headline_opponent_xor));
        }

	this.saveGame(this.game.id);

	this.game.turn = [];
	//this.addMove("discard\tus\t"+this.game.state.headline_card); // discard card
        //this.removeCardFromHand(this.game.state.headline_card);
        let extra      = {};
            extra.skipqueue = 1;
            extra.target   = this.returnNextPlayer(this.game.player);
        this.sendMessage("game", extra);
        return;

      } else {
        this.updateStatus("Waiting for US to decrypt USSR headline card...");
      }
      return;
    }


    if (msg.extra.target == 2) {
      if (this.game.player == 2) {

        //
        // we now have both headline cards, just tell players what they are
        //
        this.game.state.headline3 = 1;
        this.saveGame(this.game.id);

        this.game.turn = [];
	//this.addMove("discard\tus\t"+this.game.state.headline_card); // discard card
        //this.removeCardFromHand(this.game.state.headline_card);
        let extra      = {};
            extra.skipqueue = 1;
            extra.target   = this.returnNextPlayer(this.game.player);
        this.sendMessage("game", extra);

      } else {

        //
        // we now have both headline cards, just tell players what they are
        //
        this.game.state.headline3 = 1;
        this.saveGame(this.game.id);

      }
      return;
    }
    return;
  }

  if (this.game.state.headline4 == 0) {

    let my_card = this.game.state.headline_card;
    let opponent_card = this.game.state.headline_opponent_card;

    //
    // default to USSR
    //
    let player_to_go = 1;

    if (this.game.player == 1) {
      if (this.game.cards[my_card].ops > this.game.cards[opponent_card].ops) {
        player_to_go = 1;
      } else {
        player_to_go = 2;
      }
    }
    if (this.game.player == 2) {
      if (this.game.cards[my_card].ops >= this.game.cards[opponent_card].ops) {
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

      this.updateLog("US headlines Defectors");

      this.game.turn = [];
      this.addMove("discard\tus\tdefectors");
      if (my_card != "defectors") {
        this.updateLog("USSR headlines "+this.game.cards[my_card].name);
        this.addMove("discard\tussr\t"+my_card);
      } else {
        this.updateLog("USSR headlines "+this.game.cards[opponent_card].name);
        this.addMove("discard\tussr\t"+opponent_card);
      }

      this.game.state.headline4 = 1;
      this.game.state.headline5 = 1;
      this.game.state.headline  = 0;
      this.saveGame(this.game.id);

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

      if (player_to_go == this.game.player) {
        if (this.game.state.headline_card !== my_card) { card_player = opponent; }
        this.updateLog(player.toUpperCase() + " headlines " + this.game.cards[my_card].name);
        shd_continue = this.playEvent(card_player, my_card);
      } else {
        if (this.game.state.headline_card !== opponent_card) { card_player = opponent; }
        this.updateLog(card_player.toUpperCase() + " headlines " + this.game.cards[opponent_card].name);
        shd_continue = this.playEvent(card_player, opponent_card);
      }

      this.game.state.headline4 = 1;
      this.saveGame(this.game.id);

      //
      // only one player should trigger next round
      //
      if (card_player == player && shd_continue == 1) {
        let extra      = {};
          extra.skipqueue = 0;
	  extra.target   = this.returnNextPlayer(this.game.player);
        this.sendMessage("game", extra);
      }
    }

    return;
  }

  if (this.game.state.headline5 == 0) {

    let my_card = this.game.state.headline_card;
    let opponent_card = this.game.state.headline_opponent_card;

    //
    // default to USSR
    //
    let player_to_go = 1;

    if (this.game.player == 1) {
      if (this.game.cards[my_card].ops > this.game.cards[opponent_card].ops) {
        player_to_go = 1;
      } else {
        player_to_go = 2;
      }
    }

    if (this.game.player == 2) {
      if (this.game.cards[my_card].ops >= this.game.cards[opponent_card].ops) {
        player_to_go = 2;
      } else {
        player_to_go = 1;
      }
    }

    //
    // we switch to the other player now
    //
    if (player_to_go == 1) { player_to_go = 2; } else { player_to_go = 1; }


    let player = "ussr";
    let opponent = "us";
    if (this.game.player == 2) { player = "us"; opponent = "ussr"; }
    let card_player = player;
 
    //
    // headline4 is our FIRST headline card
    // headline5 is our SECOND headline card
    //

    let shd_continue = 1;


    if (player_to_go == this.game.player) {
      if (this.game.state.headline_card !== my_card) { card_player = opponent; }
      this.updateLog(player.toUpperCase() + " headlines " + this.game.cards[my_card].name);
      shd_continue = this.playEvent(player, my_card);
    } else {
      if (this.game.state.headline_card !== opponent_card) { card_player = opponent; }
      this.updateLog(card_player.toUpperCase() + " headlines " + this.game.cards[opponent_card].name);
      shd_continue = this.playEvent(card_player, opponent_card);
    }

    this.game.state.headline5 = 1;
    this.saveGame(this.game.id);

    //
    // only one player should trigger next round
    //
    if (player_to_go == this.game.player && shd_continue == 1) {
      let extra      = {};
          extra.skipqueue = 0;
          extra.target   = this.returnNextPlayer(this.game.player);
      this.sendMessage("game", extra);
    }

    return;

  }



console.log("1 ---- 4");




  ///////////////////////
  // Normal Operations //
  ///////////////////////
  if (this.movesRemain() == 1) {

    //
    // no longer in headline phase
    //
    this.game.state.headline  = 0;

    //
    // player 1 moves
    //
    if (this.game.state.turn == 0) {
      if (this.game.player == 1) {

        if (this.game.state.turn_in_round == 0) {
    	  //
    	  // discard the headline cards
    	  //
    	  this.addMove("discard\tussr\t"+this.game.state.headline_card);
    	  this.addMove("discard\tus\t"+this.game.state.opponent_headline_card);
    	  this.removeCardFromHand(this.game.state.headline_card);
	}

        this.playerTurn();
      } else {
        this.updateStatus("Waiting for USSR to move");
      }
      return;
    }

    //
    // player 2 moves
    //
    if (this.game.state.turn == 1) {
      if (this.game.player == 2) {

        if (this.game.state.turn_in_round == 0) {
    	  //
    	  // discard headline card
    	  //
    	  this.removeCardFromHand(this.game.state.headline_card);
	}

        this.playerTurn();
      } else {
        this.updateStatus("Waiting for US to move");
      }
      return;
    }
  }

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

    twilight_self.updateStatus(player.toUpperCase() + ' plays ' + ops + ' OPS:<p></p><ul><li class="card" id="place">place influence</li><li class="card" id="coup">launch coup</li><li class="card" id="realign">realign country</li></ul>');

    $('.card').off();
    $('.card').on('click', function() {

      let action2 = $(this).attr("id");

      if (action2 == "place") {

        twilight_self.updateStatus("Place " + ops + " influence");

        let j = ops;
        twilight_self.updateStatus("Place " + j + " influence.");
        twilight_self.prePlayerPlaceInfluence(player);
        twilight_self.playerPlaceInfluence(player, () => {

          j--;

	  //
	  // breaking control must be costly
	  //
	  if (twilight_self.game.break_control == 1) { j--; }
	  twilight_self.game.break_control = 0;

	  if (j < 2) {
	    twilight_self.uneventOpponentControlledCountries(player);
	  }

          if (j == 0) {
	    if (twilight_self.isRegionBonus() == 1) {
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
	twilight_self.playerCoupCountry(player, ops);
	return;
      }


      if (action2 == "realign") {

        twilight_self.updateStatus("Realign " + ops + " influence");

        let j = ops;
        twilight_self.prePlayerRealign(player);
        twilight_self.playerRealign(player, () => {

          twilight_self.updateStatus("Realign " + ops + " influence");

          j--;

          if (j == 0) {
            if (twilight_self.isRegionBonus() == 1) {
              j++;
              twilight_self.limitToRegionBonus();
              twilight_self.endRegionBonus();
            } else {
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






Twilight.prototype.movesRemain = function movesRemain() {

  return 1;
/*
  let mv = this.game.state.move; 

  let availmv = 7;
  if (this.game.state.round > 3) { availmv = 8; }

  if (mv < availmv) { return 1; }
  return 0;
*/
}







Twilight.prototype.playerPickHeadlineCard = function playerPickHeadlineCard() {

  if (this.browser_active == 0) { return; }

  let x = "Pick a headline card: <p></p><ul>";
  for (i = 0; i < this.game.hand.length; i++) {
    x += '<li class="card showcard" id="'+this.game.hand[i]+'">'+this.game.cards[this.game.hand[i]].name+'</li>';
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
    twilight_self.saveGame(twilight_self.game.id);

    twilight_self.updateStatus("simultaneous blind pick... encrypting selected card");
    twilight_self.game.turn = [];
    twilight_self.game.turn[0] = twilight_self.game.state.headline_hash;

    let extra       = {};
    extra.skipqueue = 1;
    extra.target    = twilight_self.returnNextPlayer(twilight_self.game.player);
console.log("SENDING HEADLINE1 INFOR TO OTHER PLAYER WITH: " + twilight_self.game.turn[0]);

    $('.card').off();
    $('.showcard').off();
    twilight_self.hideCard();

    twilight_self.sendMessage("game", extra);

    return;

  });

}



Twilight.prototype.playerTurn = function playerTurn() {

  if (this.browser_active == 0) { return; }

  //
  // reset region bonuses (if applicable)
  //
  this.game.state.events.vietnam_revolts_eligible = 1;
  this.game.state.events.china_card_eligible = 1;
  this.game.state.events.region_bonus = "";

  let player = "ussr";
  let opponent = "us";
  if (this.game.player == 2) { player = "us"; opponent = "ussr"; }

  let x = player.toUpperCase() + " pick a card: <p></p><ul>";
  for (i = 0; i < this.game.hand.length; i++) {
    x += '<li class="card showcard" id="'+this.game.hand[i]+'">'+this.game.cards[this.game.hand[i]].name+'</li>';
  };
  x += '</ul>';
  this.updateStatus(x);

  let twilight_self = this;  

  if (this.game.state.events.unintervention != 1) {
    this.moves = [];
    twilight_self.addMove("turn\t"+opponent);
  }

  twilight_self.playerFinishedPlacingInfluence();

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
    // The China Card
    //
    if (card == "china") { twilight_self.game.state.events.china_card = 1; }

    twilight_self.hideCard(card);

    twilight_self.addMove("discard\t"+player+"\t"+card);

    if (twilight_self.game.cards[card].scoring == 1) { 
      twilight_self.updateStatus('Playing '+twilight_self.game.cards[card].name+':<p></p><ul><li class="card" id="event">score region</li></ul>');
    } else {

      let ops = twilight_self.modifyOps(twilight_self.game.cards[card].ops);

      let announcement = player.toUpperCase() + ' playing '+twilight_self.game.cards[card].name+'<p></p><ul><li class="card" id="event">play event</li><li class="card" id="ops">play ops</li>';
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
      twilight_self.updateStatus(announcement);
    }

    $('.card').off();
    $('.card').on('click', function() {

      let action = $(this).attr("id");
      $('.card').off();

      if (action == "event") {
        twilight_self.addMove("event\t"+player+"\t"+card);
        twilight_self.removeCardFromHand(card);
        twilight_self.endTurn();
	return;
      }

      if (action == "ops") {

console.log("CARD: " + card);

        if (twilight_self.game.cards[card].player == opponent) {

	  if (twilight_self.game.state.events.unintervention == 1) {

	    // resolve added
            twilight_self.addMove("notify\t"+player.toUpperCase()+" plays "+card+" with UN Intervention");
            twilight_self.addMove("ops\t"+player+"\t"+card+"\t"+twilight_self.game.cards[card].ops);
            twilight_self.removeCardFromHand(card);
	    twilight_self.endTurn();
            return;

	  } else {

            twilight_self.updateStatus('Playing opponent card:<p></p><ul><li class="card" id="before">event before ops</li><li class="card" id="after">event after ops</li></ul>');

            $('.card').off();
            $('.card').on('click', function() {

              let action2 = $(this).attr("id");

	      if (action2 === "before") {
                twilight_self.addMove("ops\t"+player+"\t"+card+"\t"+twilight_self.game.cards[card].ops);
                twilight_self.addMove("event\t"+player+"\t"+card);
                twilight_self.removeCardFromHand(card);
	        twilight_self.endTurn();
	        return;
	      }
	      if (action2 === "after") {
                twilight_self.addMove("event\t"+player+"\t"+card);
                twilight_self.addMove("ops\t"+player+"\t"+card+"\t"+twilight_self.game.cards[card].ops);
                twilight_self.removeCardFromHand(card);
	        twilight_self.endTurn();
                return;
              }

	    });
          }

	  return;

        } else {

          twilight_self.addMove("ops\t"+player+"\t"+card+"\t"+twilight_self.game.cards[card].ops);
          twilight_self.removeCardFromHand(card);
	  twilight_self.endTurn();
	  return;

	}
      }

      if (action == "space") {
	twilight_self.playerSpaceCard(card, player);
        twilight_self.removeCardFromHand(card);
        twilight_self.endTurn();
	return;
      }

      twilight_self.updateStatus("");      

    });
  });


}














/////////////////////
// Place Influence //
/////////////////////
Twilight.prototype.uneventOpponentControlledCountries = function uneventOpponentControlledCountries(player) {

  for (var i in this.countries) { 
    if (player == "us") {
      if (this.isControlled("ussr", i) == 1) {
        this.countries[i].place = 0; 
      }
    }

    if (player == "ussr") {
      if (this.isControlled("us", i) == 1) {
        this.countries[i].place = 0; 
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
	this.game.countries[i].place = 1;
        for (let n = 0; n < this.game.countries[i].neighbours.length; n++) {
          let j = this.game.countries[i].neighbours[n];
	  this.game.countries[j].place = 1;
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
 
    let x = "Place six additional influence in Eastern Europe.<p></p>[cards: ";
    for (i = 0; i < this.game.hand.length; i++) {
      if (i > 0) { x += ", "; }
      x += '<div class="showcard inline" id="'+this.game.hand[i]+'">'+this.game.cards[this.game.hand[i]].name.toLowerCase()+'</div>';
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

    var ops_to_place = 6;

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

    let x = "Place seven additional influence in Western Europe.<p></p>[cards: ";
    for (i = 0; i < this.game.hand.length; i++) {
      if (i > 0) { x += ", "; }
      x += '<div class="inline showcard" id="'+this.game.hand[i]+'">'+this.game.cards[this.game.hand[i]].name.toLowerCase()+'</div>';
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






/////////////////////
// PLACE INFLUENCE //
/////////////////////
Twilight.prototype.removeCardFromHand = function removeCardFromHand(card) {

  for (i = 0; i < this.game.hand.length; i++) {
    if (this.game.hand[i] == card) {
      this.game.hand.splice(i, 1);
    }
  }

}
Twilight.prototype.removeInfluence = function removeInfluence(country, inf, player, mycallback=null) {

  if (player == "us") {
    this.countries[country].us = parseInt(this.countries[country].us) - parseInt(inf);  
    if (this.countries[country].us < 0) { this.countries[country].us = 0; };  
  } else {
    this.countries[country].ussr = parseInt(this.countries[country].ussr) - parseInt(inf);  
    if (this.countries[country].ussr < 0) { this.countries[country].ussr = 0; };  
  }

  this.showInfluence(country, player, mycallback);

}
Twilight.prototype.placeInfluence = function placeInfluence(country, inf, player, mycallback=null) {

  if (player == "us") {
    this.countries[country].us = parseInt(this.countries[country].us) + parseInt(inf);  
  } else {
    this.countries[country].ussr = parseInt(this.countries[country].ussr) + parseInt(inf);  
  }

  this.updateLog(player.toUpperCase() + " places " + inf + " in " + country);

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
    }
  } else {
    if (this.isControlled("us", country) == 0) {
      if (this.countries[country].us > 0) {
        $(obj_us).html('<div class="us_uncontrol">'+us_i+'</div>');
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

  $('.us_control').css('height', this.scale(100));
  $('.us_uncontrol').css('height', this.scale(100));
  $('.ussr_control').css('height', this.scale(100));
  $('.ussr_uncontrol').css('height', this.scale(100));

  $('.us_control').css('font-size', this.scale(100));
  $('.us_uncontrol').css('font-size', this.scale(100));
  $('.ussr_control').css('font-size', this.scale(100));
  $('.ussr_uncontrol').css('font-size', this.scale(100));

  //
  // adjust screen ratio
  //
  $('.country').css('width', this.scale(202));
  $('.us').css('width', this.scale(100));
  $('.ussr').css('width', this.scale(100));
  $('.us').css('height', this.scale(100));
  $('.ussr').css('height', this.scale(100));

  //
  // update game state
  //
  this.game.countries = this.countries;

  if (mycallback != null) { mycallback(); }

}








Twilight.prototype.prePlayerRealign = function prePlayerRealign(player, mycallback=null) {

}
Twilight.prototype.playerRealign = function playerRealign(player, mycallback=null) {

  // reset off
  this.playerFinishedPlacingInfluence();

  var twilight_self = this;
  var valid_target = 0;

  // all countries can be realigned
  for (var i in this.countries) {
 
    let countryname = i;

    valid_target = 1;     

    //
    // DEFCON restrictions
    //
    if (twilight_self.countries[countryname].region == "europe" && twilight_self.game.state.defcon < 5) {
      valid_target = 0;
    }
    if (twilight_self.countries[countryname].region == "asia" && twilight_self.game.state.defcon < 4) {
      valid_target = 0;
    }
    if (twilight_self.countries[countryname].region == "mideast" && twilight_self.game.state.defcon < 3) {
      valid_target = 0;
    }

    let divname      = '#'+i;

    if (valid_target == 1) {

      $(divname).off();
      $(divname).on('click', function() {
        let c = $(this).attr('id');
        var result = twilight_self.playRealign(c);
        twilight_self.addMove("realign\t"+player+"\t"+c);
      });

    }
  }

}
Twilight.prototype.playerPlaceInfluence = function playerPlaceInfluence(player, mycallback=null) {

  // reset off
  this.playerFinishedPlacingInfluence();

  var twilight_self = this;

  // set place to only choose valid countries
  this.prePlayerPlaceInfluence(player);

  for (var i in this.countries) {
      
    let countryname  = i;
    let divname      = '#'+i;

    if (player == "us") {
      $(divname).off();
      $(divname).on('click', function() {
        if (twilight_self.countries[countryname].place == 1) {
	
	  //
	  // vietnam revolts and china card
	  //
	  if (twilight_self.countries[countryname].region !== "seasia") { twilight_self.game.state.events.vietnam_revolts_eligible = 0; }
	  if (twilight_self.countries[countryname].region.indexOf("asia") < 0) { twilight_self.game.state.events.china_card_eligible = 0; }
 
          if (twilight_self.isControlled("ussr", countryname) == 1) { twilight_self.game.break_control = 1; }
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
        if (twilight_self.countries[countryname].place == 1) {

	  //
	  // vietnam revolts and china card
	  //
	  if (twilight_self.countries[countryname].region !== "seasia") { twilight_self.game.state.events.vietnam_revolts_eligible = 0; }
	  if (twilight_self.countries[countryname].region.indexOf("asia") < 0) { twilight_self.game.state.events.china_card_eligible = 0; }
          if (twilight_self.isControlled("us", countryname) == 1) { twilight_self.game.break_control = 1; }
	  twilight_self.addMove("place\tussr\tussr\t"+countryname+"\t1");
          twilight_self.placeInfluence(countryname, 1, "ussr", mycallback);
	} else {
	  alert("you cannot place there...");
	  return;
	}
      });
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

  let roll = this.rollDice(6);

  this.addMove("notify\t"+player.toUpperCase()+" rolls a "+roll);

  let successful     = 0;
  let next_box       = 1;

  if (player == "ussr") { next_box = this.game.state.space_race_ussr; }
  if (player == "us") { next_box = this.game.state.space_race_us; }

  if (next_box == 1) { if (roll < 4) { successful = 1; } }
  if (next_box == 2) { if (roll < 5) { successful = 1; } }
  if (next_box == 3) { if (roll < 4) { successful = 1; } }
  if (next_box == 4) { if (roll < 5) { successful = 1; } }
  if (next_box == 5) { if (roll < 4) { successful = 1; } }
  if (next_box == 6) { if (roll < 5) { successful = 1; } }
  if (next_box == 7) { if (roll < 4) { successful = 1; } }
  if (next_box == 8) { if (roll < 2) { successful = 1; } }
  
  if (successful == 1) { this.advanceSpaceRace(player); }

}




///////////
// COUPS //
///////////
Twilight.prototype.playerCoupCountry = function playerCoupCountry(player,  ops, mycallback=null) {

  var twilight_self = this;

  for (var i in this.countries) {
      
    let countryname  = i;
    let divname      = '#'+i;
    let valid_target = 0;

    $(divname).off();
    $(divname).on('click', function() {

      let countryname = $(this).attr('id');

      if (player == "us") {
        if (twilight_self.countries[countryname].ussr <= 0) { alert("Cannot Coup"); } else { valid_target = 1; }
      } else {
	
	//
	// Coup Restrictions
	//
        if (twilight_self.countries[countryname].region == "europe" && twilight_self.game.state.defcon < 5) {
	  alert("DEFCON prevents coups in Europe");
	  valid_target = 0;
        }
        if (twilight_self.countries[countryname].region == "asia" && twilight_self.game.state.defcon < 4) {
	  alert("DEFCON prevents coups in Asia");
	  valid_target = 0;
        }
        if (twilight_self.countries[countryname].region == "mideast" && twilight_self.game.state.defcon < 3) {
	  alert("DEFCON prevents coups in the Middle-East");
	  valid_target = 0;
        }
        if (twilight_self.countries[countryname].region == "europe" && twilight_self.game.state.events.nato == 1) {
	  alert("NATO prevents coups in Europe");
	  valid_target = 0;
        }
        if (twilight_self.countries[countryname].us <= 0)   { alert("Cannot Coup"); } else { valid_target = 1; }
      }

      if (valid_target == 1) {

        twilight_self.addMove("coup\t"+player+"\t"+countryname+"\t"+ops);
        twilight_self.endTurn();

      }

    });
  }
}


Twilight.prototype.playCoup = function playCoup(player, countryname, ops, mycallback=null) {

  let roll    = this.rollDice(6);
  let control = this.countries[countryname].control;
  let winning = parseInt(roll) + parseInt(ops) - parseInt(control * 2);

  if (this.countries[countryname].bg == 1) { this.lowerDefcon(); }

  if (winning > 0) {

    alert("COUP SUCCEEDED: " + player.toUpperCase() + " rolls " + roll);
    this.updateLog(player + " rolls " + roll + " ("+winning+" added)");

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
    alert("COUP FAILED: " + player.toUpperCase() + " rolls " + roll);
  }
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
    for (var racn in this.countries[country].neighbours) {
      if (this.isControlled("us", racn) == 1) {
        bonus_us++;
      }
      if (this.isControlled("ussr", racn) == 1) {
        bonus_ussr++;
      }
    }

    let roll_us   = this.rollDice(6) + bonus_us;
    let roll_ussr = this.rollDice(6) + bonus_ussr;

    console.log("US roll: " + roll_us + " versus USSR roll: " + roll_ussr);
    this.updateLog("US roll " + roll_us + " vs. USSR roll " + roll_ussr);

    if (roll_us > roll_ussr) {
      outcome_determined = 1;
      let diff = roll_us - roll_ussr;
      this.removeInfluence(country, diff, "ussr");
    }
    if (roll_us < roll_ussr) {
      outcome_determined = 1;
      let diff = roll_ussr - roll_us;
      this.removeInfluence(country, diff, "us");
    }
  }
}








///////////////////////
// Twilight Specific //
///////////////////////
Twilight.prototype.addMove = function addMove(mv) {
  this.moves.push(mv);
}

Twilight.prototype.endTurn = function endTurn() {

  this.updateStatus("Waiting for information from peers....");

  
  let extra = {};
      extra.target = this.returnNextPlayer(this.game.player);
  this.game.turn = this.moves;
  this.sendMessage("game", extra);
  this.moves = [];
  this.saveGame(this.game.id);

}
Twilight.prototype.endGame = function endGame(winner, method) {
  alert("The Game is Over - " + winner + " by " + method);
}


Twilight.prototype.endRound = function endRound() {

  //
  // calculate milops
  //
  let milops_needed = this.game.state.defcon;
  let ussr_milops_deficit = (this.game.state.defcon-state.milops_ussr);
  let us_milops_deficit = (this.game.state.defcon-state.milops_us);

  if (ussr_milops_deficit > 0) {
    this.game.state.vp += ussr_milops_deficit;
    this.updateLog("USSR penalized " + ussr_milops_deficit + " VP (milops)");
  }
  if (us_milops_deficit > 0) {
    this.game.state.vp -= us_milops_deficit;
    this.updateLog("US penalized " + us_milops_deficit + " VP (milops)");
  }


  this.game.state.round++;
  this.game.state.turn 		= 0;
  this.game.state.turn_in_round = 0;
  this.game.state.move 		= 0;

  this.game.state.events.region_bonus = "";
  this.game.state.events.containment = 0;
  this.game.state.events.redscare_player1 = 0;
  this.game.state.events.redscare_player2 = 0;
  this.game.state.events.vietnam_revolts = 0;
  this.game.state.events.vietnam_revolts_eligible = 0;
  this.game.state.events.china_card = 0;
  this.game.state.events.china_card_eligible = 0;
  this.game.state.events.cubanmissilecrisis = 0;
  this.game.state.events.nuclearsubs = 0;

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
  for (let i = 0; i < this.game.hand.length; i++) {
    if (this.game.hand[i] == "china") {
      do_i_have_the_china_card = 1;
    }
  }
  if (do_i_have_the_china_card == 0) {
    if (this.game.player == 1) {
      if (this.game.state_china_card == 1) {
	this.game.hand.push("china");
      }
    }
    if (this.game.player == 2) {
      if (this.game.state_china_card == 2) {
	this.game.hand.push("china");
      }
    }
  }

  //
  // what we do next depends on the round
  //
  if (this.game.state.round > 0) {

    if (this.game.state.round == 2) {

      this.updateStatus("Shuffling Deck with Discarded Non-Triggered Event Cards");
alert("dealing not done yet cards in deck are only -----> UNDEALT CARDS: " + this.game.deck.cards.length);

      this.game.state.dealt = 0;
      this.game.step.deck = 0;

      var deck = this.returnDiscardedCards();
alert("DISCARDED CARDS: " + JSON.stringify(deck));
      for (var i in deck) { 
        alert("D: " + i + " -- " + JSON.stringify(deck[i]));
      }
      //var midwar = this.returnMidWarCards();
      //for (var i in midwar) { deck[i] = midwar[i]; }
      this.initializeDeck(deck);
      return;

    }


    if (this.game.state.round == 2) {
      if (this.game.state.vp < 0) {
	this.endGame("ussr","VP points");
      } else {
	this.endGame("us","VP points");
      }
      return;
    }


    this.updateStatus("Dealing New Cards");

    this.game.state.dealt = 0;

    let msg          = {};
    msg.extra        = {};
    msg.extra.target = 1;
    msg.turn         = [];
    this.handleGame(msg);

  }


  //
  // add new cards, shuffle
  //
  /*********
  if (this.game.state.round > 0) {

    alert("ADDING SHUFFLED MIDWAR CARDS!");

    this.game.state.dealt = 0;
    this.game.step.deck = 0;

    var deck = this.returnDiscardedCards();
    var midwar = this.returnMidWarCards();

    for (var i in midwar) { deck[i] = midwar[i]; }

    this.initializeDeck(deck);

  }
  ********/

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
  state.china_card = 1;
  state.queue = [];
  state.broke_control = 0;
  state.us_defcon_bonus = 0;

  state.animal_in_space = "";
  state.man_in_earth_orbit = "";
  state.moon_landing = "";
  state.space_shuttle = "";

  // track as US (+) and USSR (-)
  state.vp    = 0;
 
  state.ar_ps         = [];
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
  state.vp_ps[20]  = { top : 2740, left : 3440 };
  state.vp_ps[21]  = { top : 2740, left : 3840 };
  state.vp_ps[22]  = { top : 2740, left : 3975 };
  state.vp_ps[23]  = { top : 2740, left : 4110 };

  state.vp_ps[24]  = { top : 2880, left : 3035 };
  state.vp_ps[25]  = { top : 2800, left : 3170 };
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

  state.space_race_us = 0;
  state.space_race_ussr = 0;

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

  // events
  state.events = {};
  state.events.formosan          = 0;
  state.events.redscare_player1  = 0;
  state.events.redscare_player2  = 0;
  state.events.containment       = 0;
  state.events.nato              = 0;
  state.events.marshall          = 0;
  state.events.warsawpact        = 0;
  state.events.unintervention    = 0;
  state.events.norad             = 0;

  return state;

}
Twilight.prototype.returnCountries = function returnCountries() {

  var countries = {};

  // EUROPE
  countries['canada'] = { top : 752, left : 842 , us : 2 , ussr : 0 , control : 4 , bg : 0 , neighbours : [ 'uk' ] , region : "europe" };
  countries['uk'] = { top : 572, left : 1690 , us : 5 , ussr : 0 , control : 5 , bg : 0 , neighbours : [ 'canada','norway','benelux','france' ] , region : "europe" };
  countries['benelux'] = { top : 728, left : 1860 , us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'uk','westgermany' ] , region : "europe" };
  countries['france'] = { top : 906, left : 1820 , us : 0 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'uk','italy','spain','westgermany' ] , region : "europe" };
  countries['italy'] = { top : 1036, left : 2114 , us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'spain','france','greece','austria','yugoslavia' ] , region : "europe" };
  countries['westgermany'] = { top : 728, left : 2078 , us : 0 , ussr : 0 , control : 4 , bg : 1 , neighbours : [ 'austria','france','benelux','denmark','eastgermany' ] , region : "europe" };
  countries['eastgermany'] = { top : 580, left : 2156 , us : 0 , ussr : 3 , control : 3 , bg : 1 , neighbours : [ 'westgermany','poland','austria' ] , region : "europe" };
  countries['poland'] = { top : 580, left : 2386 , us : 0 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'eastgermany','czechoslovakia' ] , region : "europe" };
  countries['spain'] = { top : 1118, left : 1660 , us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'france','italy' ] , region : "europe" };
  countries['greece'] = { top : 1200, left : 2392 , us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'italy','turkey','yugoslavia','bulgaria' ] , region : "europe" };
  countries['turkey'] = { top : 1056, left : 2788 , us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'greece','romania','bulgaria' ] , region : "europe" };
  countries['yugoslavia'] = { top : 1038, left : 2342 , us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'italy','hungary','romania','greece' ] , region : "europe" };
  countries['bulgaria'] = { top : 1038, left : 2570 , us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'greece','turkey' ] , region : "europe" };
  countries['romania'] = { top : 880, left : 2614 , us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'turkey','hungary','yugoslavia' ] , region : "europe" };
  countries['hungary'] = { top : 880, left : 2394 , us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'austria','czechoslovakia','romania','yugoslavia' ] , region : "europe" };
  countries['austria'] = { top : 880, left : 2172 , us : 0 , ussr : 0 , control : 4 , bg : 0 , neighbours : [ 'hungary','italy','westgermany','eastgermany' ] , region : "europe" };
  countries['czechoslovakia'] = { top : 728, left : 2346 , us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'hungary','poland','eastgermany' ] , region : "europe" };
  countries['denmark'] = { top : 432, left : 1982 , us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'sweden','westgermany' ] , region : "europe" };
  countries['norway'] = { top : 278, left : 1932 , us : 0 , ussr : 0 , control : 4 , bg : 0 , neighbours : [ 'uk','sweden' ] , region : "europe" };
  countries['finland'] = { top : 286, left : 2522 , us : 0 , ussr : 1 , control : 4 , bg : 0 , neighbours : [ 'sweden' ] , region : "europe" };
  countries['sweden'] = { top : 410, left : 2234 , us : 0 , ussr : 0 , control : 4 , bg : 0 , neighbours : [ 'finland','denmark','norway' ] , region : "europe" };

  // MIDDLE EAST
  countries['libya'] = { top : 1490, left : 2290, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'egypt','tunisia' ] , region : "mideast"};
  countries['egypt'] = { top : 1510, left : 2520, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'libya','sudan','israel' ], region : "mideast"};
  countries['lebanon'] = { top : 1205, left : 2660, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'syria','israel' ], region : "mideast"};
  countries['syria'] = { top : 1205, left : 2870, us : 0 , ussr : 1 , control : 2 , bg : 0 , neighbours : [ 'lebanon','turkey','israel' ], region : "mideast"};
  countries['israel'] = { top : 1350, left : 2620, us : 1 , ussr : 0 , control : 4 , bg : 1 , neighbours : [ 'egypt','jordan','lebanon','syria' ], region : "mideast"};
  countries['iraq'] = { top : 1350, left : 2870, us : 0 , ussr : 1 , control : 3 , bg : 1 , neighbours : [ 'jordan','iran','gulfstates','saudiarabia' ], region : "mideast"};
  countries['iran'] = { top : 1350, left : 3082, us : 1 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'iraq','afghanistan','pakistan' ], region : "mideast"};
  countries['jordan'] = { top : 1500, left : 2760, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'israel','lebanon','iraq','saudiarabia' ], region : "mideast"};
  countries['gulfstates'] = { top : 1500, left : 3010, us : 0 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'iraq','saudiarabia' ], region : "mideast"};
  countries['saudiarabia'] = { top : 1650, left : 2950, us : 0 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'jordan','iraq','gulfstates' ], region : "mideast"};

  // ASIA
  countries['afghanistan'] = { top : 1250, left : 3345, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'iran','pakistan' ], region : "asia"};
  countries['pakistan'] = { top : 1450, left : 3345, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'iran','afghanistan','india' ], region : "asia"}
  countries['india'] = { top : 1552, left : 3585, us : 0 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'pakistan','burma' ], region : "asia"};
  countries['burma'] = { top : 1580, left : 3855, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'india','laos' ], region : "seasia"};
  countries['laos'] = { top : 1600, left : 4070, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'burma','thailand','vietnam' ], region : "seasia"};
  countries['thailand'] = { top : 1769, left : 3980, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'laos','vietnam','malaysia' ], region : "seasia"};
  countries['vietnam'] = { top : 1760, left : 4200, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'laos','thailand' ], region : "seasia"};
  countries['malaysia'] = { top : 1990, left : 4080, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'thailand','australia','indonesia' ], region : "seasia"};
  countries['australia'] = { top : 2442, left : 4450, us : 4 , ussr : 0 , control : 4 , bg : 0 , neighbours : [ 'malaysia' ], region : "seasia"};
  countries['indonesia'] = { top : 2176, left : 4450, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'malaysia','philippines' ], region : "seasia"};
  countries['philippines'] = { top : 1755, left : 4530, us : 1 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'indonesia','japan' ], region : "seasia"};
  countries['taiwan'] = { top : 1525, left : 4435, us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'japan','southkorea' ], region : "asia"};
  countries['japan'] = { top : 1348, left : 4705, us : 1 , ussr : 0 , control : 4 , bg : 1 , neighbours : [ 'philippines','taiwan','southkorea' ], region : "asia"};
  countries['southkorea'] = { top : 1200, left : 4530, us : 1 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'japan','taiwan','northkorea' ], region : "asia"};
  countries['northkorea'] = { top : 1050, left : 4480, us : 0 , ussr : 3 , control : 3 , bg : 1 , neighbours : [ 'southkorea' ], region : "asia"};

  // CENTRAL AMERICA
  countries['mexico'] = { top : 1370, left : 175, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'gautemala' ], region : "camerica"};
  countries['guatemala'] = { top : 1526, left : 360, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'mexico','elsalvador','honduras' ], region : "camerica"};
  countries['elsalvador'] = { top : 1690, left : 295, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'honduras','guatemala' ], region : "camerica"};
  countries['honduras'] = { top : 1675, left : 515, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'nicaragua','costarica','guatemala','elsalvador' ], region : "camerica"};
  countries['nicaragua'] = { top : 1675, left : 735, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'costarica','honduras','cuba' ], region : "camerica"};
  countries['costarica'] = { top : 1830, left : 495, us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'panama','nicaragua' ], region : "camerica"};
  countries['panama'] = { top : 1830, left : 738, us : 1 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'colombia','costarica' ], region : "camerica"};
  countries['cuba'] = { top : 1480, left : 750, us : 0 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'haiti','nicaragua' ], region : "camerica"};
  countries['haiti'] = { top : 1620, left : 970, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'cuba','dominicanrepublic' ], region : "camerica"};
  countries['dominicanrepublic'] = { top : 1620, left : 1180, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'haiti' ], region : "camerica"};

  // SOUTH AMERICA
  countries['venezuela'] = { top : 1850, left : 1000, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'colombia','brazil' ], region : "samerica"};
  countries['colombia'] = { top : 2010, left : 878, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'panama','venezuela','ecuador' ], region : "samerica"};
  countries['ecuador'] = { top : 2075, left : 650, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'peru','colombia' ], region : "samerica"};
  countries['peru'] = { top : 2244, left : 780, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'ecuador','chile','bolivia' ], region : "samerica"};
  countries['chile'] = { top : 2570, left : 885, us : 0 , ussr : 0 , control : 3 , bg : 1 , neighbours : [ 'peru','argentina' ], region : "samerica"};
  countries['bolivia'] = { top : 2385, left : 1005, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'paraguay','peru' ], region : "samerica"};
  countries['argentina'] = { top : 2860, left : 955, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'chile','uruguay','paraguay' ], region : "samerica"};
  countries['paraguay'] = { top : 2550, left : 1130, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'uruguay','argentina','bolivia' ], region : "samerica"};
  countries['uruguay'] = { top : 2740, left : 1200, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'argentina','paraguay','brazil' ], region : "samerica"};
  countries['brazil'] = { top : 2230, left : 1385, us : 0 , ussr : 0 , control : 2 , bg : 1 , neighbours : [ 'uruguay','venezuela' ], region : "samerica"};

  // AFRICA
  countries['morocco'] = { top : 1400, left : 1710, us : 0 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'westafricanstates','algeria','spain' ], region : "africa"};
  countries['algeria'] = { top : 1330, left : 1935, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'tunisia','morocco','france' ], region : "africa"};
  countries['tunisia'] = { top : 1310, left : 2160, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'libya','algeria' ], region : "africa"};
  countries['westafricanstates'] = { top : 1595, left : 1690, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'ivorycoast','morocco' ], region : "africa"};
  countries['saharanstates'] = { top : 1650, left : 2025, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'algeria','nigeria' ], region : "africa"};
  countries['sudan'] = { top : 1690, left : 2550, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'egypt','ethiopia' ], region : "africa"};
  countries['ivorycoast'] = { top : 1885, left : 1835, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'nigeria','westafricanstates' ], region : "africa"};
  countries['nigeria'] = { top : 1859, left : 2110, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'ivorycoast','cameroon','saharanstates' ], region : "africa"};
  countries['ethiopia'] = { top : 1845, left : 2710, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'sudan','somalia' ], region : "africa"};
  countries['somalia'] = { top : 1910, left : 2955, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'ethiopia','kenya' ], region : "africa"};
  countries['cameroon'] = { top : 2035, left : 2210, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'zaire','nigeria' ], region : "africa"};
  countries['zaire'] = { top : 2110, left : 2470, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'angola','zimbabwe','cameroon' ], region : "africa"};
  countries['kenya'] = { top : 2045, left : 2735, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'seafricanstates','somalia' ], region : "africa"};
  countries['angola'] = { top : 2290, left : 2280, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'southafrica','botswana','zaire' ], region : "africa"};
  countries['seafricanstates'] = { top : 2250, left : 2760, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'zimbabwe','kenya' ], region : "africa"};
  countries['zimbabwe'] = { top : 2365, left : 2545, us : 0 , ussr : 0 , control : 1 , bg : 0 , neighbours : [ 'seafricanstates','botswana','zaire' ], region : "africa"};
  countries['botswana'] = { top : 2520, left : 2475, us : 0 , ussr : 0 , control : 2 , bg : 0 , neighbours : [ 'southafrica','angola','zimbabwe' ], region : "africa"};
  countries['southafrica'] = { top : 2690, left : 2370, us : 1 , ussr : 0 , control : 3 , bg : 0 , neighbours : [ 'angola','botswana' ], region : "africa"};

  for (var i in countries) { countries[i].place = 0; }

  return countries;

}
Twilight.prototype.returnChinaCard = function returnChinaCard() {
  return { img : "TNRnTS-06" , name : "China" , scoring : 0 , bg : 0 , player : "both" , recurring : 1 , ops : 4 };
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
  deck['howilearned']       = { img : "TNRnTS-46" , name : "How I Learned", scoring : 0 , player : "both" , recurring : 0 , ops : 2 };
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
  deck['shuttle']           = { img : "TNRnTS-73" , name : "Shuttle Diplomacy", scoring : 0 , player : "us" , recurring : 0 , ops : 3 };
  deck['voiceofamerica']    = { img : "TNRnTS-74" , name : "Voice of America", scoring : 0 , player : "us" , recurring : 1 , ops : 2 };
  deck['liberation']        = { img : "TNRnTS-75" , name : "Liberation Theology", scoring : 0 , player : "ussr" , recurring : 1 , ops : 2 };
  deck['ussuri']            = { img : "TNRnTS-76" , name : "Ussuri River Skirmish", scoring : 0 , player : "us" , recurring : 0 , ops : 3 };
  deck['asknot']            = { img : "TNRnTS-77" , name : "Ask Not What Your Country...", scoring : 0 , player : "us" , recurring : 0 , ops : 3 };
  deck['alliance']          = { img : "TNRnTS-78" , name : "Alliance for Progress", scoring : 0 , player : "us" , recurring : 0 , ops : 3 };
  deck['africa']            = { img : "TNRnTS-79" , name : "Africa Scoring", scoring : 1 , player : "both" , recurring : 1 , ops : 0 };
  deck['onesmallstep']      = { img : "TNRnTS-80" , name : "One Small Step", scoring : 0 , player : "both" , recurring : 1 , ops : 2 };
  deck['southamerica']      = { img : "TNRnTS-81" , name : "South America Scoring", scoring : 1 , player : "both" , recurring : 1 , ops : 0 };
  deck['che']               = { img : "TNRnTS-107" , name : "Che", scoring : 0 , player : "both" , recurring : 1 , ops : 3 };
  deck['tehran']            = { img : "TNRnTS-108" , name : "Our Man in Tehran", scoring : 0 , player : "both" , recurring : 0 , ops : 2 };

  return deck;

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
  deck['vietnam']         = { img : "TNRnTS-09" , name : "Vietnam", scoring : 0 , player : "ussr" , recurring : 0 , ops : 2 };
  deck['blockade']        = { img : "TNRnTS-10" , name : "Blockade", scoring : 0 , player : "ussr" , recurring : 0 , ops : 1 };
  deck['koreanwar']       = { img : "TNRnTS-11" , name : "Korean War", scoring : 0 , player : "ussr" , recurring : 0 , ops : 2 };
  deck['romanianab']      = { img : "TNRnTS-12" , name : "Romanian Abdication", scoring : 0 , player : "ussr" , recurring : 0 , ops : 1 };
  deck['arabisraeli']     = { img : "TNRnTS-13" , name : "Arab-Israeli War", scoring : 0 , player : "both" , recurring : 1 , ops : 2 };
  deck['comecon']         = { img : "TNRnTS-14" , name : "Comecon", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['nasser']          = { img : "TNRnTS-15" , name : "Nasser", scoring : 0 , player : "ussr" , recurring : 0 , ops : 1 };
  deck['warsawpact']      = { img : "TNRnTS-16" , name : "Warsaw Pact", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['degaulle']        = { img : "TNRnTS-17" , name : "De Gaulle", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['naziscientist']   = { img : "TNRnTS-18" , name : "Nazi Scientist", scoring : 0 , player : "both" , recurring : 0 , ops : 1 };
  deck['truman']          = { img : "TNRnTS-19" , name : "Truman", scoring : 0 , player : "us"   , recurring : 0 , ops : 1 };
  deck['olympic']         = { img : "TNRnTS-20" , name : "Olympic", scoring : 0 , player : "both" , recurring : 1 , ops : 2 };
  deck['nato']            = { img : "TNRnTS-21" , name : "NATO", scoring : 0 , player : "us"   , recurring : 0 , ops : 4 };
  deck['indreds']         = { img : "TNRnTS-22" , name : "Independent Reds", scoring : 0 , player : "us"   , recurring : 0 , ops : 2 };
  deck['marshall']        = { img : "TNRnTS-23" , name : "Marshall Plan", scoring : 0 , player : "us"   , recurring : 0 , ops : 4 };
  deck['indopaki']        = { img : "TNRnTS-24" , name : "Indo-Pakistani War", scoring : 0 , player : "both" , recurring : 1 , ops : 2 };
  deck['containment']     = { img : "TNRnTS-25" , name : "Containment", scoring : 0 , player : "us"   , recurring : 0 , ops : 3 };
  deck['cia']             = { img : "TNRnTS-26" , name : "CIA", scoring : 0 , player : "us"   , recurring : 0 , ops : 1 };
  deck['usjapan']         = { img : "TNRnTS-27" , name : "US/Japan Defense Pact", scoring : 0 , player : "us"   , recurring : 0 , ops : 4 };
  deck['suezcrisis']      = { img : "TNRnTS-28" , name : "Suez Crisis", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['easteuropean']    = { img : "TNRnTS-29" , name : "East European Unrest", scoring : 0 , player : "us"   , recurring : 1 , ops : 3 };
  deck['decolonization']  = { img : "TNRnTS-30" , name : "Decolonization", scoring : 0 , player : "ussr" , recurring : 1 , ops : 2 };
  deck['redscare']        = { img : "TNRnTS-31" , name : "Red Scare", scoring : 0 , player : "both" , recurring : 1 , ops : 4 };
  deck['unintervention']  = { img : "TNRnTS-32" , name : "UN Intervention", scoring : 0 , player : "both" , recurring : 1 , ops : 1 };
  deck['destalinization'] = { img : "TNRnTS-33" , name : "Destalinization", scoring : 0 , player : "ussr" , recurring : 0 , ops : 3 };
  deck['nucleartestban']  = { img : "TNRnTS-34" , name : "Nuclear Test Ban Treaty", scoring : 0 , player : "both" , recurring : 1 , ops : 4 };
  deck['formosan']        = { img : "TNRnTS-35" , name : "Formosan Resolution", scoring : 0 , player : "us"   , recurring : 0 , ops : 2 };
  deck['defectors']       = { img : "TNRnTS-103" ,name : "Defectors", scoring : 0 , player : "us"   , recurring : 0 , ops : 2 };
  deck['cambridge']       = { img : "TNRnTS-104" ,name : "The Cambridge Five", scoring : 0 , player : "ussr"   , recurring : 0 , ops : 2 };
  deck['specialrelation'] = { img : "TNRnTS-105" ,name : "Special Relationship", scoring : 0 , player : "us"   , recurring : 0 , ops : 2 };
  deck['norad']           = { img : "TNRnTS-106" ,name : "NORAD", scoring : 0 , player : "us"   , recurring : 0 , ops : 3 };

  for (var i in deck) { deck[i].dealt = 0; deck[i].discarded = 0; deck[i].removed = 0; }

  return deck;

}
Twilight.prototype.returnDiscardedCards = function returnDiscardedCards() {

  var deck = {};

  for (var i in this.game.cards) { 
    if (this.game.cards[i].discarded == 1) {
      deck[i] = this.game.cards[i]; 
      deck[i].discarded = 0;
    }; 
  }

  return deck;

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

  this.updateStatus("Playing event: " + this.game.cards[card].name);


  ///////////////
  // EARLY WAR //
  ///////////////
  //
  // scoring
  //
  if (card == "asia") {
    this.scoreRegion("asia");
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }
  if (card == "europe") {
    this.scoreRegion("europe");
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }
  if (card == "mideast") {
    this.scoreRegion("mideast");
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }


  //
  // Defectors
  //
  if (card == "defectors") {
    if (this.game.state.headline == 0) {
      this.game.state.vp += 1;
      this.updateDefcon();
    }
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
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

	  let c = $(this).attr('id');

          if (twilight_self.countries[c].place != 1) {
	    alert("Invalid Placement");
	  } else {
            twilight_self.placeInfluence(c, 1, "us", function() {
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
      for (let i = 0; i < this.game.hand.length; i++) {
        if (this.game.cards[this.game.hand[i]].scoring == 1) {
	  if (scoring_cards.length > 0) { scoring_cards += ", "; scoring_alert += "\t"; }
          scoring_cards += this.game.hand[i];
          scoring_alert += this.game.hand[i];
        }
      }

      if (scoring_cards.length == 0) {

        this.addMove("notify\tus does not have any scoring cards");
        this.endTurn();

      } else {
   
        this.addMove("notify\tus has scoring cards for: " + scoring_cards);
        this.addMove(scoring_alert);
        this.endTurn();

      }
    }

    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 0;
  }



  //
  // Norad
  //
  if (card == "norad") {
    this.game.state.events.norad = 1;
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
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
    this.updateStatus("Nasser - Soviets add two influence in Egypt. US loses all influence in Egypt.");
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }



  //
  // NAZI SCIENTIST
  //
  if (card == "naziscientist") {
    this.advanceSpaceRace(player);
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
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

    if (yugo_us >= yugo_ussr && romania_us >= romania_ussr && bulgaria_us >= bulgaria_ussr && czechoslovakia_us >= czechoslovakia_ussr) {
      this.endTurn();
      return 0;
    } else {


      let userhtml = "Pick a country to equalize Soviet influence:<p></p><ul>";

      if (yugo_diff > 0) {
        userhtml += '<li class="card inline" id="yugoslavia">yugoslavia</li>';
      }
      if (romania_diff > 0) {
        userhtml += '<li class="card inline" id="romania">romania</li>';
      }
      if (bulgaria_diff > 0) {
        userhtml += '<li class="card inline" id="bulgaria">bulgaria</li>';
      }
      if (hungary_diff > 0) {
        userhtml += '<li class="card inline" id="hungary">hungary</li>';
      }
      if (czechoslovakia_diff > 0) {
        userhtml += '<li class="card inline" id="czechoslovakia">czechoslovakia</li>';
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
	if (i == "canada" || i == "uk" || i == "france" || i == "benelux" || i == "westgermany" || i == "spain" ||  i == "italy" || i == "greece" || i == "turkey" || i == "denmark" || i == "norway" || i == "sweden" ||  i == "finland") {
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
      this.updateStatus("USSR is playing decolonization");
      return 0;
    }
    if (this.game.player == 1) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      var ops_to_place = 4;
      twilight_self.addMove("resolve\tdecolonization");

      this.updateStatus("USSR place four influence in Africa or Asia (1 per country)");

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
    this.saveGame(this.game.id);

    let me = "ussr";
    let opponent = "us";
    if (this.game.player == 2) { opponent = "ussr"; me = "us"; }

    if (player != me) {

      return 0;
    } else {
      //
      // let player pick another turn
      //
      this.addMove("resolve\tunintervention");
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
      twilight_self.updateStatus('Indo-Pakistani War:<p></p><ul><li class="card" id="pakistan">India invades Pakistan</li><li class="card" id="india">Pakistan invades India</li></ul>');

      let target = 3;

      $('.card').off();
      $('.card').on('click', function() {

        let invaded = $(this).attr("id");

        if (invaded == "pakistan") {

          if (twilight_self.isControlled(opponent, "india") == 1) { target++; }
          if (twilight_self.isControlled(opponent, "iran") == 1) { target++; }
          if (twilight_self.isControlled(opponent, "afghanistan") == 1) { target++; }

	  let die = twilight_oelf.rollDice(6);
          twilight_self.addMove("notify\t"+player.toUpperCase()+" rolls "+die);

	  if (die >= target) {

	    if (player == "us") {
              twilight_self.addMove("place\tus\tus\tpakistan\t"+twilight_self.countries['pakistan'].ussr);
              twilight_self.addMove("remove\tussr\tussr\tpakistan\t"+twilight_self.countries['pakistan'].ussr);
              twilight_self.placeInfluence("pakistan", twilight_self.countries['pakistan'].ussr, "us");
              twilight_self.removeInfluence("pakistan", twilight_self.countries['pakistan'].ussr, "ussr");
              twilight_self.game.state.vp += 2;
              twilight_self.game.state.milops_us += 2;
              twilight_self.updateVictoryPoints();
	      twilight_self.endTurn();
	    } else {
              twilight_self.addMove("place\tussr\tussr\tpakistan\t"+twilight_self.countries['pakistan'].us);
              twilight_self.addMove("remove\tus\tus\tpakistan\t"+twilight_self.countries['pakistan'].us);
              twilight_self.placeInfluence("pakistan", twilight_self.countries['pakistan'].us, "ussr");
              twilight_self.removeInfluence("pakistan", twilight_self.countries['pakistan'].us, "us");
              twilight_self.game.state.vp -= 2;
              twilight_self.game.state.milops_ussr += 2;
              twilight_self.updateVictoryPoints();
	      twilight_self.endTurn();
	    }
	  }

	}
        if (invaded == "india") {

          if (twilight_self.isControlled(opponent, "pakistan") == 1) { target++; }
          if (twilight_self.isControlled(opponent, "burma") == 1) { target++; }

	  let die = twilight_self.rollDice(6);

	  if (die >= target) {

	    if (player == "us") {
              twilight_self.addMove("place\tus\tus\tindia\t"+twilight_self.countries['india'].ussr);
              twilight_self.addMove("remove\tussr\tussr\tindia\t"+twilight_self.countries['india'].ussr);
              twilight_self.placeInfluence("india", twilight_self.countries['india'].ussr, "us");
              twilight_self.removeInfluence("india", twilight_self.countries['india'].ussr, "ussr");
              twilight_self.game.state.vp += 2;
              twilight_self.game.state.milops_us += 2;
              twilight_self.updateVictoryPoints();
	      twilight_self.endTurn();
	    } else {
              twilight_self.addMove("place\tussr\tussr\tindia\t"+twilight_self.countries['india'].us);
              twilight_self.addMove("remove\tus\tus\tindia\t"+twilight_self.countries['india'].us);
              twilight_self.placeInfluence("india", twilight_self.countries['india'].us, "ussr");
              twilight_self.removeInfluence("india", twilight_self.countries['india'].us, "us");
              twilight_self.game.state.vp -= 2;
              twilight_self.game.state.milops_ussr += 2;
              twilight_self.updateVictoryPoints();
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
      this.placeInfluence("israel", this.countries['southkorea'].us, "ussr");
      this.removeInfluence("israel", this.countries['southkorea'].us, "us");
      this.game.state.vp -= 2;
      this.game.state.milops_ussr += 2;
      this.updateVictoryPoints();
    } else {
      this.updateLog("US wins the Arab-Israeli War");
    }

    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
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
    twilight_self.addMove("notify\t"+player.toUpperCase()+" rolls "+roll);

    if (roll >= target) {
      this.placeInfluence("southkorea", this.countries['southkorea'].us, "ussr");
      this.removeInfluence("southkorea", this.countries['southkorea'].us, "us");
      this.game.state.vp -= 2;
      this.updateVictoryPoints();
    }
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;

  }


  /////////////////////
  // Vietnam Revolts //
  /////////////////////
  if (card == "vietnam") {
    this.game.state.events.vietnam_revolts = 1;
    this.placeInfluence("vietnam", 2, "ussr");
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }



  //////////
  // NATO //
  //////////
  if (card == "nato") {
    if (this.game.state.events.marshall == 1 || this.game.state.events.warsawpact == 1) {
      this.game.state.events.nato = 1;
    }
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }



  ////////////////
  // China Card //
  ////////////////
  if (card == "china") {

    this.game.state.events.formosan = 0;
    if (player == "ussr") {
      this.game.state.china_card = 2;
    } else {
      this.game.state.china_card = 1;
    }
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }



  //////////////
  // Formosan //
  //////////////
  if (card == "formosan") {
    this.game.state.events.formosan = 1;
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
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
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }


  /////////////////
  // Containment //
  /////////////////
  if (card == "containment") {
    this.game.state.events.containment = 1;
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }


  ////////////
  // Truman //
  ////////////
  if (card == "truman") {

    if (this.game.player == 1) { return 0; }
    if (this.game.player == 2) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      twilight_self.addMove("resolve\ttruman");

      var options_purge = [];

      if (twilight_self.countries['canada'].ussr > 0 && twilight_self.isControlled('canada', 'ussr') != 1) { options_purge.push('canada'); }
      if (twilight_self.countries['uk'].ussr > 0 && twilight_self.isControlled('uk', 'ussr') != 1) { options_purge.push('uk'); }
      if (twilight_self.countries['france'].ussr > 0 && twilight_self.isControlled('france', 'ussr') != 1) { options_purge.push('france'); }
      if (twilight_self.countries['spain'].ussr > 0 && twilight_self.isControlled('spain', 'ussr') != 1) { options_purge.push('spain'); }
      if (twilight_self.countries['greece'].ussr > 0 && twilight_self.isControlled('greece', 'ussr') != 1) { options_purge.push('greece'); }
      if (twilight_self.countries['turkey'].ussr > 0 && twilight_self.isControlled('turkey', 'ussr') != 1) { options_purge.push('turkey'); }
      if (twilight_self.countries['italy'].ussr > 0 && twilight_self.isControlled('italy', 'ussr') != 1) { options_purge.push('italy'); }
      if (twilight_self.countries['westgermany'].ussr > 0 && twilight_self.isControlled('westgermany', 'ussr') != 1) { options_purge.push('westgermany'); }
      if (twilight_self.countries['eastgermany'].ussr > 0 && twilight_self.isControlled('eastgermany', 'ussr') != 1) { options_purge.push('eastgermany'); }
      if (twilight_self.countries['poland'].ussr > 0 && twilight_self.isControlled('poland', 'ussr') != 1) { options_purge.push('poland'); }
      if (twilight_self.countries['benelux'].ussr > 0 && twilight_self.isControlled('benelux', 'ussr') != 1) { options_purge.push('benelux'); }
      if (twilight_self.countries['denmark'].ussr > 0 && twilight_self.isControlled('denmark', 'ussr') != 1) { options_purge.push('denmark'); }
      if (twilight_self.countries['norway'].ussr > 0 && twilight_self.isControlled('norway', 'ussr') != 1) { options_purge.push('norway'); }
      if (twilight_self.countries['finland'].ussr > 0 && twilight_self.isControlled('finland', 'ussr') != 1) { options_purge.push('finland'); }
      if (twilight_self.countries['sweden'].ussr > 0 && twilight_self.isControlled('sweden', 'ussr') != 1) { options_purge.push('sweden'); }
      if (twilight_self.countries['yugoslavia'].ussr > 0 && twilight_self.isControlled('yugoslavia', 'ussr') != 1) { options_purge.push('yugoslavia'); }
      if (twilight_self.countries['czechoslovakia'].ussr > 0 && twilight_self.isControlled('czechoslovakia', 'ussr') != 1) { options_purge.push('czechoslovakia'); }
      if (twilight_self.countries['bulgaria'].ussr > 0 && twilight_self.isControlled('bulgaria', 'ussr') != 1) { options_purge.push('bulgaria'); }
      if (twilight_self.countries['hungary'].ussr > 0 && twilight_self.isControlled('hungary', 'ussr') != 1) { options_purge.push('hungary'); }
      if (twilight_self.countries['romania'].ussr > 0 && twilight_self.isControlled('romania', 'ussr') != 1) { options_purge.push('romania'); }
      if (twilight_self.countries['austria'].ussr > 0 && twilight_self.isControlled('austria', 'ussr') != 1) { options_purge.push('austria'); }

      if (options_purge.length == 0) {
        twilight_self.addMove("notify\tussr has no influence that can be removed");
        twilight_self.endTurn();
      }

      for (let i = 0; i < options_purge.length; i++) {

        let countryname  = options_purge[i];
        let divname      = '#'+i;

        twilight_self.countries[countryname].place = 1;

        $(divname).off();
        $(divname).on('click', function() {

	  let c = $(this).attr('id');
	  let ussrpur = twilight_self.countries[countryname].ussr;

          twilight_self.removeInfluence(c, ussrpur, "ussr", function() {
            twilight_self.addMove("remove\tussr\tussr\t"+c+"\t1");
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

    if (this.game.player == 2) { return 0; }
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
      
	alert("Only four influence available to remove");

        twilight_self.removeInfluence("israel", 2, "us");
	twilight_self.addMove("remove\tus\tus\tisrael\t2");
        twilight_self.removeInfluence("france", 2, "us");
	twilight_self.addMove("remove\tus\tus\tfrance\t2");
        twilight_self.removeInfluence("uk", 2, "us");
	twilight_self.addMove("remove\tus\tus\tuk\t2");
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
	      twilight_self.addMove("remove\tus\tus\t"+c+"\t1");
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
      this.updateStatus("USSR is playing CIA Created");

      if (this.game.hand.length < 1) {
        this.addMove("ops\tus\tcia\t1");
        this.addMove("notify\tUSSR has no cards to reveal");
        this.endTurn();
	return 1;
      } else {
	let revealed = "";
        for (let i = 0; i < this.game.hand.length; i++) {
	  if (i > 0) { revealed += ", "; }
          revealed += this.game.cards[this.game.hand[i]].name;
        }
        this.addMove("ops\tus\tcia\t1");
        this.addMove("notify\tUSSR holds: "+revealed);
        this.endTurn();
	return 1;
      }
    }
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

      for (let i = 0; i < this.game.hand.length; i++) {
        let avops = this.modifyOps(this.game.cards[this.game.hand[i]].ops);
        if (this.game.cards[this.game.hand[i]].ops >= 3) {
          available = 1;
        }
      }

      if (available == 0) {
	this.updateStatus("Blockade played: no cards available to discard.");
	this.addMove("remove\tus\tus\twestgermany\t"+this.countries['westgermany'].us);
        this.removeInfluence("westgermany", this.countries['westgermany'].us, "us");
	this.endTurn();
	return 0;
      }

      this.updateStatus('<div class="card inline" id="discard">Discard 3 OP card</div> or <div class="card inline" id="remove">Remove all US influence in West Germany</div>');

      $('.card').off();
      $('.card').on('click', function() {

        let action = $(this).attr("id");

        if (action == "discard") {
	  let choicehtml = "";
	  for (let i = 0; i < twilight_self.game.hand.length; i++) {
	    if (twilight_self.modifyOps(twilight_self.game.cards[twilight_self.game.hand[i]].ops) >= 3) {
	      if (choicehtml.length > 0) { choicehtml += ", "; }
              choicehtml += '<div class="card inline" id="'+twilight_self.game.hand[i]+'">'+twilight_self.game.hand[i]+'</div>';
	    }
	  }

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

      twilight_self.updateStatus(opponent.toUpperCase() + ' holds the Olympics:<p></p><ul><li class="card inline" id="boycott">boycott</li><li class="card inline" id="participate">participate</li></ul>');

      $('.card').off();
      $('.card').on('click', function() {

        let action = $(this).attr("id");

	if (action == "boycott") {
	  twilight_self.addMove("ops\t"+opponent+"\tolympic\t4");
	  twilight_self.addMove("defcon\tlower");
	  twilight_self.endTurn();
	  return;
	}
	if (action == "participate") {

	  let winner = 0;

	  while (winner == 0) {

  	    let usroll   = twilight_self.rollDice(6);
	    let ussrroll = twilight_self.rollDice(6);

	    if (opponent == "us") {
	      usroll += 2;
	    } else {
	      ussrroll += 2;
	    }

	    if (ussrroll > usroll) {
	      twilight_self.addMove("vp\tussr\t2");
	      twilight_self.endTurn();
	      winner = 1;
	    }
	    if (usroll > ussroll) {
	      twilight_self.addMove("vp\tus\t2");
	      twilight_self.endTurn();
	      winner = 2;
	    }
	  }
	}
      });
    }

    return 0;
  }





  ////////////////////////////
  // East European Uprising //
  ////////////////////////////
  if (card == "easteuropean") {

    if (this.game.player == 1) {

      this.updateStatus("US is playing East European Uprising");
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
	  twilight_self.addMove("remove\tus\tus\t"+options_purge[i]+"\t"+ops_to_purge);
	  twilight_self.removeInfluence(options_purge[i], ops_to_purge, "us");
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
	          twilight_self.addMove("remove\tus\tus\t"+c+"\t"+ops_to_purge);
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
    this.saveGame(this.game.id);

    if (this.game.player == 2) { 
      this.updateStatus("Waiting for USSR to play Warsaw Pact");
      return 0; 
    }
    if (this.game.player == 1) {

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      twilight_self.updateStatus('<div class="card inline" id="remove">remove all US influence from four countries in Eastern Europe</div> or <div class="card inline" id="add">add five USSR influence in Eastern Europe (max 2 per country)</div>');

      $('.card').off();
      $('.card').on('click', function() {

        let action2 = $(this).attr("id");

	if (action2 == "remove") {

	  alert("REMOVING US INFLUENCE");
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

	  alert("ADDING USSR INFLUENCE");
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

alert("warsaw pact id to add: ");

		let c = $(this).attr('id');

alert("warsaw pact id to add2: " + c);

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
 
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
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
	    twilight_self.addMove("remove\tus\tus\t"+c+"\t1");
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
console.log("RED SCARE: " + this.game.state.events.redscare_player1 + " -- " + this.game.state.events.redscare_player2);
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
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
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
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

    this.saveGame(this.game.id);
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }


  ////////////////////
  // Duch and Cover //
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
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    this.saveGame(this.game.id);
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

      var ops_to_place = 7;
      twilight_self.addMove("resolve\tfiveyearplan");

      if (this.game.hand.length < 1) {
	alert("No cards left to discard");
  	this.addMove("notify\tsoviets have no cards to discard");
	this.endTurn();
	return 0;
      } else {

	let twilight_self = this;

        twilight_self.rollDice(twilight_self.game.hand.length, function(roll) {
          let card = twilight_self.game.hand[roll];
	  twilight_self.removeCardFromHand(card);
	  if (twilight_self.game.cards[card].player == "us") {
	    alert("You have rolled: " + card);
	    twilight_self.addMove("event\tus\t"+card);
            twilight_self.endTurn();
          } else {
	    alert("You have rolled: " + card);
  	    twilight_self.addMove("notify\tsoviets discarded "+card);
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
    this.removeInfluence("france", 2, "us");
    this.placeInfluence("france", 1, "ussr");
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
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
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }



  /////////////////////////
  // US / Japan Alliance //
  /////////////////////////
  if (card == "usjapan") {
    let usinf = parseInt(this.countries['japan'].us);
    let ussrinf = parseInt(this.countries['japan'].ussr);
    let targetinf = ussrinf + 4;
    this.placeInfluence("japan", (targetinf - usinf), "us");
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
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
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }
  if (card == "southamerica") {
    this.scoreRegion("southamerica");
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }
  if (card == "centralamerica") {
    this.scoreRegion("centralamerica");
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }
  if (card == "africa") {
    this.scoreRegion("africa");
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;
  }


/***** MID WAR 
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

	  let divname = "#" + i;

          $(divname).off();
          $(divname).on('click', function() {

	    let c = $(this).attr('id');
	    let dieroll = twilight_self.rollDice(6);
	    let modify = 0;

	    for (let v = 0; v < twilight_self.countries[i].neighbours.length; v++) {
	      if (twilight_self.isControlled(opponent, i) == 1) {
		modify++;
	      }
	    }

	    dieroll = dieroll - modify;

	    if (dieroll >= 3) {

	      let usinf = twilight_self.countries[i].us;
	      let ussrinf = twilight_self.countries[i].ussr;

	      if (me == "us") {
		twilight_self.removeInfluence(i, "ussr", ussrinf);
		twilight_self.placeInfluence(i, "us", ussrinf);
	        twilight_self.addMove("remove\tus\tussr\t"+i+"\t"+ussrinf);
	        twilight_self.addMove("place\tus\tus\t"+i+"\t"+ussrinf);
		twilight_self.endTurn();
	      } else {
		twilight_self.removeInfluence(i, "us", usinf);
		twilight_self.placeInfluence(i, "ussr", usinf);
	        twilight_self.addMove("remove\tussr\tus\t"+i+"\t"+usinf);
	        twilight_self.addMove("place\tussr\tussr\t"+i+"\t"+usinf);
	      }
	      twilight_self.addMove("notify\tBrush War in "+i+" succeeded.");
	      twilight_self.endTurn();
	
	    } else {
	      twilight_self.addMove("notify\tBrush War in "+i+" failed.");
	      twilight_self.endTurn();
	    }

	  });
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
        this.game.state.vp += 1;
        if (this.game.state.milops_us > this.game.state.defcon) {
	  this.game.state.vp += 2;
	}
      }
    } else {
      if (this.game.state.milops_ussr > this.game.state.milops_us) {
        this.game.state.vp -= 1;
        if (this.game.state.milops_ussr > this.game.state.defcon) {
	  this.game.state.vp -= 2;
	}
      }
    }

    this.updateVictoryPoints();
    this.game.state.queue.splice(this.game.state.queue.length-1, 1);
    return 1;

  }



******/
















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
Twilight.prototype.isRegionBonus = function isRegionBonus() {

  //
  // Vietnam Revolts
  //
  if (this.game.state.events.vietnam_revolts == 1 && this.game.state.events.vietnam_revolts_eligible == 1 && this.game.player == 1) {
    this.updateStatus("Extra 1 OP Available for Southeast Asia");
    this.game.state.events.region_bonus += "seasia"; 
    return 1;
  }

  //
  // The China Card
  //
  if (this.game.state.events.china_card == 1 && this.game.state.events.china_card_eligible == 1) {
    this.updateStatus("Extra 1 OP Available for Asia");
    this.game.state.events.region_bonus += "seasia"; 
    return 1;
  }
  return 0;
}
Twilight.prototype.endRegionBonus = function endRegionBonus() {
  this.game.state.events.vietnam_revolts_eligible = 0;
  this.game.state.events.china_card_eligible = 0;
}
Twilight.prototype.limitToRegionBonus = function limitToRegionBonus() {
  for (var i in this.countries) {
    if (this.game.state.events.region_bonus.indexOf(this.countries[i].region) == -1) {
      let divname = '#'+i;
      $(divname).off();
    }
  }
  return;
}
Twilight.prototype.modifyOps = function modifyOps(ops) {
console.log("MODIFY OPS: " + JSON.stringify(this.game.state.events));
  if (this.game.state.events.containment == 1 && this.game.player == 2) { ops++; }
  if (this.game.state.events.redscare_player1 == 1 && this.game.player == 1) { ops--; }
  if (this.game.state.events.redscare_player2 == 1 && this.game.player == 2) { ops--; }
  if (ops <= 0) { return 1; }
  if (ops >= 4) { return 4; }
  return ops;
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
    
    if (bg_us > bg_ussr && total_us > total_ussr) { vp_us = 7; }
    if (bg_ussr < bg_us && total_ussr > total_us) { vp_ussr = 7; }

    if (total_us == 6 && total_us > total_ussr) { vp_us = 10000; }
    if (total_ussr == 6 && total_us > total_ussr) { vp_ussr = 10000; }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;
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

    if (total_us > 0) { vp_us = 3; }
    if (total_ussr> 0) { vp_ussr = 3; }
    
    if (bg_us > bg_ussr && total_us > total_ussr) { vp_us = 5; }
    if (bg_ussr < bg_us && total_ussr > total_us) { vp_ussr = 5; }

    if (total_us == 7 && total_us > total_ussr) { vp_us = 7; }
    if (total_ussr == 7 && total_us > total_ussr) { vp_ussr = 7; }

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
    
    if (bg_us > bg_ussr && total_us > total_ussr) { vp_us = 4; }
    if (bg_ussr < bg_us && total_ussr > total_us) { vp_ussr = 4; }

    if (total_us == 7 && total_us > total_ussr) { vp_us = 6; }
    if (total_ussr == 7 && total_us > total_ussr) { vp_ussr = 6; }

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
    if (total_ussr> 0) { vp_ussr = 1; }
    
    if (bg_us > bg_ussr && total_us > total_ussr) { vp_us = 3; }
    if (bg_ussr < bg_us && total_ussr > total_us) { vp_ussr = 3; }

    if (total_us == 7 && total_us > total_ussr) { vp_us = 5; }
    if (total_ussr == 7 && total_us > total_ussr) { vp_ussr = 5; }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;
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
    
    if (bg_us > bg_ussr && total_us > total_ussr) { vp_us = 5; }
    if (bg_ussr < bg_us && total_ussr > total_us) { vp_ussr = 5; }

    if (total_us == 7 && total_us > total_ussr) { vp_us = 6; }
    if (total_ussr == 7 && total_us > total_ussr) { vp_ussr = 6; }

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

    if (total_us > 0) { vp_us = 3; }
    if (total_ussr> 0) { vp_ussr = 3; }
    
    if (bg_us > bg_ussr && total_us > total_ussr) { vp_us = 7; }
    if (bg_ussr < bg_us && total_ussr > total_us) { vp_ussr = 7; }

    if (this.game.state.events.formosan == 1) {
      if (total_us == 7 && total_us > total_ussr) { vp_us = 9; }
      if (total_ussr == 7 && total_us > total_ussr) { vp_ussr = 9; }
    } else {
      if (total_us == 6 && total_us > total_ussr) { vp_us = 9; }
      if (total_ussr == 6 && total_us > total_ussr) { vp_ussr = 9; }
    }

    vp_us = vp_us + bg_us;
    vp_ussr = vp_ussr + bg_ussr;

  }

  //
  // adjust VP
  //
  let vp_adjustment = vp_us - vp_ussr;
  this.game.state.vp += vp_adjustment;
  this.updateVictoryPoints();

}








Twilight.prototype.updateStatus = function updateStatus(str) {

  this.game.status = str;
  console.log("STATUS: " + this.game.status);
  if (this.app.BROWSER == 1) { $('#status').html(this.game.status) }

}
Twilight.prototype.updateRound = function updateRound() {

  let dt = 0;
  let dl = 0;

  if (this.game.state.round == 0) { 
    dt = this.game.state.round_ps[0].top; 
    dl = this.game.state.round_ps[0].left; 
  }
  if (this.game.state.round == 1) { 
    dt = this.game.state.round_ps[1].top; 
    dl = this.game.state.round_ps[1].left; 
  }
  if (this.game.state.round == 2) { 
    dt = this.game.state.round_ps[2].top; 
    dl = this.game.state.round_ps[2].left; 
  }
  if (this.game.state.round == 3) { 
    dt = this.game.state.round_ps[3].top; 
    dl = this.game.state.round_ps[3].left; 
  }
  if (this.game.state.round == 4) { 
    dt = this.game.state.round_ps[4].top; 
    dl = this.game.state.round_ps[4].left; 
  }
  if (this.game.state.round == 5) { 
    dt = this.game.state.round_ps[5].top; 
    dl = this.game.state.round_ps[5].left; 
  }
  if (this.game.state.round == 6) { 
    dt = this.game.state.round_ps[6].top; 
    dl = this.game.state.round_ps[6].left; 
  }
  if (this.game.state.round == 7) { 
    dt = this.game.state.round_ps[7].top; 
    dl = this.game.state.round_ps[7].left; 
  }
  if (this.game.state.round == 8) { 
    dt = this.game.state.round_ps[8].top; 
    dl = this.game.state.round_ps[8].left; 
  }
  if (this.game.state.round == 9) { 
    dt = this.game.state.round_ps[9].top; 
    dl = this.game.state.round_ps[9].left; 
  }

  dt = this.scale(dt);
  dl = this.scale(dl);

  $('.round').css('width', this.scale(140));
  $('.round').css('height', this.scale(140));
  $('.round').css('top', dt);
  $('.round').css('left', dl);

}

Twilight.prototype.lowerDefcon = function lowerDefcon() {

  this.game.state.defcon--;

  this.updateLog("DEFCON falls to " + this.game.state.defcon);

  if (this.game.state.defcon == 2) {
    if (this.game.state.events.norad == 1) {
      if (this.isControlled("us","uk") == 1) {
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

  dt = this.scale(dt);
  dl = this.scale(dl);

  dt = dt;
  dl = dl;

  $('.defcon').css('width', this.scale(120));
  $('.defcon').css('height', this.scale(120));
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
    dt = this.game.state.ar_ps[1].top; 
    dl = this.game.state.ar_ps[1].left; 
  }
  if (turn_in_round == 2) { 
    dt = this.game.state.ar_ps[2].top; 
    dl = this.game.state.ar_ps[2].left; 
  }
  if (turn_in_round == 3) { 
    dt = this.game.state.ar_ps[3].top; 
    dl = this.game.state.ar_ps[3].left; 
  }
  if (turn_in_round == 4) { 
    dt = this.game.state.ar_ps[4].top; 
    dl = this.game.state.ar_ps[4].left; 
  }
  if (turn_in_round == 5) { 
    dt = this.game.state.ar_ps[5].top; 
    dl = this.game.state.ar_ps[5].left; 
  }
  if (turn_in_round == 6) { 
    dt = this.game.state.ar_ps[6].top; 
    dl = this.game.state.ar_ps[6].left; 
  }
  if (turn_in_round == 7) { 
    dt = this.game.state.ar_ps[7].top; 
    dl = this.game.state.ar_ps[7].left; 
  }

  dt = this.scale(dt);
  dl = this.scale(dl);

  if (this.game.state.turn == 0) {
    $('.action_round_us').hide();
    $('.action_round_ussr').show();
    $('.action_round_ussr').css('width', this.scale(100));
    $('.action_round_ussr').css('height', this.scale(100));
    $('.action_round_ussr').css('top', dt);
    $('.action_round_ussr').css('left', dl);
  } else {
    $('.action_round_ussr').hide();
    $('.action_round_us').show();
    $('.action_round_us').css('width', this.scale(100));
    $('.action_round_us').css('height', this.scale(100));
    $('.action_round_us').css('top', dt);
    $('.action_round_us').css('left', dl);
  }

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
      }
    }

    // Man in Earth Orbit
    if (this.game.state.space_race_us == 4) {
      if (this.game.state.space_race_ussr < 4) { 
        this.game.state.man_in_earth_orbit = "us";
      } else {
        this.game.state.man_in_earth_orbit = "";
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
      }
    }

    // Eagle has Landed
    if (this.game.state.space_race_us == 6) {
      if (this.game.state.space_race_ussr < 6) { 
        this.game.state.moon_landing = "us";
      } else {
        this.game.state.moon_landing = "";
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
      }
    }

    // Space Station
    if (this.game.state.space_race_us == 8) {
      if (this.game.state.space_race_ussr < 8) { 
        this.game.state.vp += 2;
        this.updateVictoryPoints();  
        this.game.state.space_shuttle = "us";
      } else {
        this.game.state.space_shuttle = "";
      }
    }
  }





  if (player == "ussr") {

    this.game.state.space_race_ussr++;

    // Earth Satellite
    if (this.game.state.space_race_ussr == 1) {
      if (this.game.state.space_race_us < 1) { 
        this.game.state.vp += 2;
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
      }
    }

    // Man in Earth Orbit
    if (this.game.state.space_race_ussr == 4) {
      if (this.game.state.space_race_us < 4) { 
        this.game.state.man_in_earth_orbit = "ussr";
      } else {
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
      }
    }

    // Bear has Landed
    if (this.game.state.space_race_ussr == 6) {
      if (this.game.state.space_race_us < 6) { 
        this.game.state.moon_landing = "ussr";
      } else {
        this.game.state.moon_landing = "";
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
      }
    }

    // Space Station
    if (this.game.state.space_race_ussr == 8) {
      if (this.game.state.space_race_us < 8) { 
        this.game.state.vp -= 2;
        this.updateVictoryPoints();  
        this.game.state.space_shuttle = "ussr";
      } else {
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
  dt_ussr = this.scale(dt_ussr+40);
  dl_ussr = this.scale(dl_ussr+10);

  $('.space_race_us').css('width', this.scale(100));
  $('.space_race_us').css('height', this.scale(100));
  $('.space_race_us').css('top', dt_us);
  $('.space_race_us').css('left', dl_us);

  $('.space_race_ussr').css('width', this.scale(100));
  $('.space_race_ussr').css('height', this.scale(100));
  $('.space_race_ussr').css('top', dt_ussr);
  $('.space_race_ussr').css('left', dl_ussr);

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
  if (this.game.state.milops_us >= 4) { 
    dt_us = this.game.state.milops_ps[4].top; 
    dl_us = this.game.state.milops_ps[4].left; 
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
  if (this.game.state.milops_ussr >= 4) { 
    dt_ussr = this.game.state.milops_ps[4].top; 
    dl_ussr = this.game.state.milops_ps[4].left; 
  }

  dt_us = this.scale(dt_us);
  dl_us = this.scale(dl_us);
  dt_ussr = this.scale(dt_ussr+40);
  dl_ussr = this.scale(dl_ussr+10);

  $('.milops_us').css('width', this.scale(100));
  $('.milops_us').css('height', this.scale(100));
  $('.milops_us').css('top', dt_us);
  $('.milops_us').css('left', dl_us);

  $('.milops_ussr').css('width', this.scale(100));
  $('.milops_ussr').css('height', this.scale(100));
  $('.milops_ussr').css('top', dt_ussr);
  $('.milops_ussr').css('left', dl_ussr);

}
Twilight.prototype.updateVictoryPoints = function updateVictoryPoints() {

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

    dt = dt;
    dl = dl;

    $('.vp').css('width', this.scale(120));
    $('.vp').css('height', this.scale(120));
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

}


Twilight.prototype.showCard = function showCard(cardname) {

  let c = this.game.cards[cardname];

  let url = '<img class="cardimg" src="/twilight/images/' + c.img + '.svg" />';
      url +='<img class="cardimg" src="/twilight/images/EarlyWar.svg" />';
  if (c.player == "both") {
      url +='<img class="cardimg" src="/twilight/images/BothPlayerCard.svg" />';
  }
  if (c.player == "us") {
      url +='<img class="cardimg" src="/twilight/images/AmericanPlayerCard.svg" />';
  }
  if (c.player == "ussr") {
      url +='<img class="cardimg" src="/twilight/images/SovietPlayerCard.svg" />';
  }
  if (c.scoring == 1) {
      url +='<img class="cardimg" src="/twilight/images/MayNotBeHeld.svg" />';
  }
  if (c.recurring == 0) {
      url +='<img class="cardimg" src="/twilight/images/RemoveFromPlay.svg" />';
  }
  $('#cardbox').html(url);
  $('#cardbox').show();
}
Twilight.prototype.hideCard = function hideCard() {
  $('#cardbox').hide();
}



