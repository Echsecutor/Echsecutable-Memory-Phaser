/**********************************************************************
 *
 * @file memory.echse.js
 *
 * @version 1.0.0
 *
 * @copyright 2016 Sebastian Schmittner <sebastian@schmittner.pw>
 *
 *
 * @section DESCRIPTION 
 * 
 * This is a simple mathced pair game prototype
 * made with phaser (tutorial level complexity).
 *
 *
 * @section LICENSE
 *
 * The is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public
 * License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this. If not, see <http://www.gnu.org/licenses/>.
 *
 ***********************************************************************/


"use strict";

// number of graphics
var num_cards = 15;

// static dimensions:
var num_x = 4;
var num_y = 3;

// the game board : (x,y) -> card number
var field = [];

// enum
// and singleton holding the game state
var game_state =
    {
      INI: {instruction:"Choose a card to reveal!"},
      ONE_REVEALED: {instruction:"Find the match!", card: {}},
      TWO_REVEALED: {instruction:"Click!", card1: {}, card1: {}, match:false},
      ALL_REVEALED: {instruction:"You found all matches! Click to start a new game!"}
    }


var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-game-frame', { preload: preload, create: create, update: update });

// derived quantities
var num_fields = num_x * num_y;
var dx = Math.floor(game.width / num_x);
var dy = Math.floor(game.height / num_y);


// load all card images
function preload() {
  for(var i = 0; i <= num_cards; i++){
    game.load.image("img" + i, "img/img_0_" + i + ".png");
  }
  game.load.image("card_bg", "img/fieldbg.png");
}

// prepare a fresh game board
function shuffle(){
  var card_used = [];
  for(var i=0;i<num_cards;i++)
  {
    card_used[i] = false;
  }
  for(var i=0;i<num_fields; i++)
  {
    field[i]=-1;
  }

  for(var pairs_chosen = 0; pairs_chosen < num_fields / 2; pairs_chosen++)
  {
    // choose a random (non used) card
    var next_card = Math.floor(Math.random() * num_cards);
    while(card_used[next_card])
      next_card = Math.floor(Math.random() * num_cards);

    card_used[next_card] = true;

    var free_field = Math.floor(Math.random() * num_fields);

    // put both cards of the pair
    for(var i=0;i<2;i++)
    {
      // find free field
      while (field[free_field] >= 0)
        free_field = Math.floor(Math.random() * num_fields);
      // put card there
      field[free_field] = next_card;
      //console.log("Putting card " + next_card + " at " + free_field);
    }
  }
}

var cards_group;
var label;

function create() {

  cards_group = game.add.group();

  label = game.add.text(game.width / 2, game.height / 2, "loading", { fontSize: '32px', fill: 'red'});
  label.anchor.setTo(0.5, 0.5);
  label.alpha = 0;
  flash_text("Welcome!\nClick Cards to reveal!");

  new_game();
}

function flash_text(msg)
{
  var dur = 1000;
  label.alpha = 0;
  label.text = msg;
  game.add.tween(label).to({alpha: 1}, dur, Phaser.Easing.Quadratic.Out, true, 0, 0, true);
}

function new_game()
{
  
  game_state.current_state = game_state.INI;
  game_state.pairs_found = 0;

  shuffle();

  // empty the group
  cards_group.destroy(true,true);

  for(var x=0;x<num_x;x++){
    for(var y=0;y<num_y;y++)
    {
      var card = cards_group.create(x*dx + dx/2,y*dy,"img" + field[(num_x * y + x)]);
      card.width = 0;
      card.height = dy;
      card.inputEnabled = true;
      card.events.onInputUp.add(card_clicked, this);

      var back = cards_group.create(x*dx,y*dy,"card_bg");
      back.width = dx;
      back.height = dy;
      back.inputEnabled = true;
      back.events.onInputUp.add(card_clicked, this);

      back.card = card;
      card.back = back;

      card.matching_id = field[(num_x * y + x)];
      card.anchor_x = x*dx;
      back.anchor_x = card.anchor_x;
    }
  }
}

function turn_card(from, to)
          {
            var dur = 500;
            game.add.tween(from).to({width: 0, x: from.anchor_x + dx / 2}, dur, Phaser.Easing.Quadratic.In,true);
            game.add.tween(to).to({width: dx, x: to.anchor_x}, dur, Phaser.Easing.Quadratic.Out,true, dur);
          }


function card_clicked(sprite, pointer){
  //    console.log("card clicked");

  if(sprite.back == undefined)
  {
    // card back clicked
    var back = sprite;
    var card = back.card;

    if(game_state.current_state == game_state.INI)
    {
      game_state.current_state = game_state.ONE_REVEALED;
      game_state.current_state.card = card;
      turn_card(back, card);
      flash_text(game_state.current_state.instruction);
      return;
    }
    else if (game_state.current_state == game_state.ONE_REVEALED)
    {
      turn_card(back,card);
      if (card.matching_id == game_state.current_state.card.matching_id){
        // found match
        game_state.pairs_found++;
        flash_text(game_state.pairs_found + " pair(s) found!");
        if(game_state.pairs_found < num_fields / 2)
        {
          game_state.current_state = game_state.INI;
        }
        else
        {
          game_state.current_state = game_state.ALL_REVEALED;
          flash_text("All found! You win!");
        }
      }
      else
      {
        //no match
        game_state.current_state = game_state.TWO_REVEALED;
        game_state.current_state.card1 = game_state.ONE_REVEALED.card;
        game_state.current_state.card2 = card;
        flash_text("No match.")
      }
      return;
    }
  }

  if(game_state.current_state == game_state.TWO_REVEALED)
  {
    // cover mismatch
    turn_card(game_state.current_state.card1, game_state.current_state.card1.back);
    turn_card(game_state.current_state.card2, game_state.current_state.card2.back);
    game_state.current_state = game_state.INI;
  }

  if(game_state.current_state == game_state.ALL_REVEALED)
  {
    new_game();
  }

  flash_text(game_state.current_state.instruction);

}


function update() {

}
