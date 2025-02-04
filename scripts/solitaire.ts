import { defaultState, drawable, start } from "../src/game/engine";
import { Solitaire } from "../src/types";
import { shuffle } from "../src/utility";

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
const CARD_PEEK = 0.2;
const WIDTH = PADDING * 8 + CARD_WIDTH * 7;
const HEIGHT = CARD_HEIGHT + (13 + 6) * CARD_HEIGHT * CARD_PEEK;

const SUITS: Solitaire.Suit[] = [CLUBS, DIAMONDS, HEARTS, SPADES];
const RANKS: Solitaire.Rank[] = [
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
  return RANKS.map((rank) => {
    return drawable<Solitaire.State, Solitaire.CardData>({
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      data: {
        suit,
        rank,
      },
      x(state) {
        const card = getCard(state, this.data);
        return card.x;
      },
      y(state) {
        const card = getCard(state, this.data);
        return card.y;
      },
      z(state) {
        const card = getCard(state, this.data);
        return card.index;
      },
      image(state) {
        const card = getCard(state, this.data);
        return card.isRevealed
          ? `/public/solitaire/${this.data.suit} ${this.data.rank}.png`
          : `/public/solitaire/Back Blue 1.png`;
      },
      onMouseDown({ state }) {
        const card = getCard(state, this.data);
        if (card.isRevealed) {
          console.log(card, this.data);
          // put that card and every card over it in your hand
        }
        return state;
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
    onClick({ state }) {
      if (index === 0) {
        const top = state.stock[0]?.pop();
        if (top) {
          state.stock[1]?.push(top);
        } else {
          state.stock[0] = state.stock[1]?.reverse()!;
          state.stock[1] = [];
        }
      }
      return state;
    },
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

const getCard = (
  state: Solitaire.State,
  data: Solitaire.CardData
): {
  pile: string;
  x: number;
  y: number;
  index: number;
  isRevealed: boolean;
} => {
  for (const pile of state.tableau) {
    for (const card of pile) {
      if (card.rank === data.rank && card.suit === data.suit) {
        const pileIndex = state.tableau.indexOf(pile);
        const cardIndex = pile.indexOf(card);
        return {
          x: (pileIndex + 1) * PADDING + pileIndex * CARD_WIDTH,
          y: 2 * PADDING + CARD_HEIGHT + cardIndex * CARD_HEIGHT * CARD_PEEK,
          index: cardIndex,
          pile: "tableau",
          isRevealed: card.isRevealed,
        };
      }
    }
  }
  for (const pile of state.stock) {
    for (const card of pile) {
      if (card.rank === data.rank && card.suit === data.suit) {
        const pileIndex = state.stock.indexOf(pile);
        const cardIndex = pile.indexOf(card);
        return {
          x: (pileIndex + 1) * PADDING + pileIndex * CARD_WIDTH,
          y: PADDING,
          index: cardIndex,
          pile: "stock",
          isRevealed: pileIndex === 1,
        };
      }
    }
  }
  return {
    x: 0,
    y: HEIGHT - CARD_HEIGHT,
    index: 0,
    pile: "error",
    isRevealed: true,
  };
};

const restart = (state: Solitaire.State) => {
  state.foundation = Array.from({ length: 4 }).map(() => []);
  state.tableau = Array.from({ length: 7 }).map(() => []);
  state.stock = Array.from({ length: 2 }).map(() => []);
  state.hand.cards = [];
  state.hand.index = -1;
  state.hand.pile = "";
  const deck = shuffle(
    SUITS.flatMap((suit) =>
      RANKS.map((rank) => ({
        rank,
        suit,
        isRevealed: false,
      }))
    )
  );
  for (let i = 0; i < state.tableau.length; i++) {
    for (let j = 0; j < i; j++) {
      state.tableau[i]!.push(deck.pop()!);
    }
    const top = deck.pop()!;
    top.isRevealed = true;
    state.tableau[i]!.push(top);
  }
  state.stock[0] = deck;
  const top = deck.pop()!;
  state.stock[1]?.push(top);
  return state;
};

start<Solitaire.State>({
  drawables: [...foundation, ...stock, ...tableau, ...cards],
  width: WIDTH,
  height: HEIGHT,
  state: restart({
    ...defaultState(),
    foundation: [],
    stock: [],
    tableau: [],
    hand: {
      cards: [],
      pile: "",
      index: -1,
    },
  }),
  background: "green",
  debug: true,
});
