import { defaultState, drawable, start } from "../src/game/engine";
import { Solitaire } from "../src/types";

const ACE = 1;
const JACK = 11;
const QUEEN = 12;
const KING = 13;
const CARD_SCALE = 0.75;
const CARD_WIDTH = 103 * CARD_SCALE;
const CARD_HEIGHT = 138 * CARD_SCALE;
const CLUBS = "Clubs";
const HEARTS = "Hearts";
const DIAMONDS = "Diamond";
const SPADES = "Spades";
const PADDING = 5;
const WIDTH = PADDING * 8 + CARD_WIDTH * 7;
const HEIGHT = CARD_HEIGHT + (13 + 6) * CARD_HEIGHT * 0.2;

const SUITS: Solitaire.Suit[] = [CLUBS, DIAMONDS, HEARTS, SPADES];
const VALUES: Solitaire.Value[] = [
  ACE,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  JACK,
  QUEEN,
  KING,
];

const cards = SUITS.flatMap((suit) => {
  return VALUES.map((value) => {
    return drawable<Solitaire.State, Solitaire.CardData>({
      x: -CARD_WIDTH,
      y: -CARD_HEIGHT,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      data: {
        suit,
        value,
        isRevealed: false,
      },
      image() {
        return this.data.isRevealed
          ? `/public/solitaire/${this.data.suit} ${this.data.value}.png`
          : `/public/solitaire/Back Blue 1.png`;
      },
    });
  });
});

const stock = Array.from({ length: 2 }).map((_, index) =>
  drawable<Solitaire.State>({
    x: index * CARD_WIDTH + (index + 1) * PADDING,
    y: PADDING,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    stroke: "white",
    radius: 5,
    lineWidth: 2,
  })
);

const foundation = Array.from({ length: 4 }).map((_, index) => {
  const offset = index + 3;
  return drawable<Solitaire.State>({
    x: offset * CARD_WIDTH + (offset + 1) * PADDING,
    y: PADDING,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    stroke: "white",
    radius: 5,
    lineWidth: 2,
  });
});

const tableau = Array.from({ length: 7 }).map((_, index) => {
  return drawable<Solitaire.State>({
    x: index * CARD_WIDTH + (index + 1) * PADDING,
    y: 2 * PADDING + CARD_HEIGHT,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    stroke: "white",
    radius: 5,
    lineWidth: 2,
  });
});

start<Solitaire.State>({
  drawables: [...foundation, ...stock, ...tableau, ...cards],
  width: WIDTH,
  height: HEIGHT,
  state: {
    ...defaultState(),
    foundation: [],
    stock: [],
    tableau: [],
    hand: {
      cards: [],
      pile: "",
      index: -1,
    },
  },
  background: "green",
  //   debug: true,
});
