// RETURN THE CARDS TO THE PILE
// DROP ALTERNATING COLORS
// REVEAL TOP CARDS
// DROP FOUNDATION
// TIMER
// SCORE

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
const CARD_PEEK = 0.35;
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
        if (card.pile === "hand") {
          return 100 + card.cardIndex;
        }
        return card.cardIndex;
      },
      image(state) {
        const card = getCard(state, this.data);
        return card.isRevealed
          ? `/public/solitaire/${this.data.suit} ${this.data.rank}.png`
          : `/public/solitaire/Back Blue 1.png`;
      },
      onMouseDown({ state }) {
        const card = getCard(state, this.data);
        if (card.pile !== "hand" && card.pile !== "error") {
          const pile = state[card.pile][card.pileIndex];
          if (pile) {
            const threshold =
              card.cardIndex + 1 === pile.length
                ? CARD_HEIGHT
                : CARD_HEIGHT * CARD_PEEK;
            if (
              pile &&
              card.isRevealed &&
              state.mouse.location.y - this.bounds.y <= threshold
            ) {
              const grabbed = pile.splice(card.cardIndex);
              state.hand.cards = grabbed;
              state.hand.pile = card.pile;
              state.hand.pileIndex = card.pileIndex;
            }
          }
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
): Solitaire.CardStats => {
  for (const pile of state.tableau) {
    for (const card of pile) {
      if (card.rank === data.rank && card.suit === data.suit) {
        const pileIndex = state.tableau.indexOf(pile);
        const cardIndex = pile.indexOf(card);
        return {
          x: (pileIndex + 1) * PADDING + pileIndex * CARD_WIDTH,
          y: 2 * PADDING + CARD_HEIGHT + cardIndex * CARD_HEIGHT * CARD_PEEK,
          cardIndex,
          pileIndex,
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
          cardIndex,
          pileIndex,
          pile: "stock",
          isRevealed: pileIndex === 1,
        };
      }
    }
    for (const card of state.hand.cards) {
      if (card.rank === data.rank && card.suit === data.suit) {
        const cardIndex = state.hand.cards.indexOf(card);
        return {
          x: state.mouse.location.x - CARD_WIDTH / 2,
          y:
            state.mouse.location.y -
            (CARD_HEIGHT * CARD_PEEK) / 2 +
            CARD_HEIGHT * CARD_PEEK * cardIndex,
          cardIndex,
          pileIndex: 0,
          pile: "hand",
          isRevealed: true,
        };
      }
    }
  }
  return {
    x: 0,
    y: HEIGHT - CARD_HEIGHT,
    cardIndex: 0,
    pileIndex: 0,
    pile: "error",
    isRevealed: true,
  };
};

const restart = (state: Solitaire.State) => {
  state.foundation = Array.from({ length: 4 }).map(() => []);
  state.tableau = Array.from({ length: 7 }).map(() => []);
  state.stock = Array.from({ length: 2 }).map(() => []);
  state.hand.cards = [];
  state.hand.pileIndex = -1;
  state.hand.pile = "hand";
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

const dropzone = drawable<Solitaire.State>({
  x: 0,
  y: 0,
  width: WIDTH,
  height: HEIGHT,
  onMouseUp({ state }) {
    if (state.hand.pile !== "hand" && state.hand.pile !== "error") {
      const pile = state[state.hand.pile][state.hand.pileIndex]?.push(
        ...state.hand.cards.splice(0)
      );
    }
    return state;
  },
});

start<Solitaire.State>({
  drawables: [...foundation, ...stock, ...tableau, ...cards, dropzone],
  width: WIDTH,
  height: HEIGHT,
  state: restart({
    ...defaultState(),
    foundation: [],
    stock: [],
    tableau: [],
    hand: {
      cards: [],
      pile: "hand",
      pileIndex: -1,
    },
  }),
  background: "green",
  debug: true,
});
