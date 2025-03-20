import { Field, ZkProgram } from 'o1js';
import { separateBoardDigits, validateBoardAndGetRoot } from './utils.js';

export { BoardProgram, BoardProof, GuessProgram, GuessProof };

const treeHeight = 8;

// Checks if board is valid
// Must have 16 digits
// Must have 4 1's and 12 0's
let BoardProgram = ZkProgram({
  name: 'valid-board-proof',
  publicOutput: Field,
  methods: {
    validateSecret: {
      privateInputs: [Field],
      async method(secretBoard: Field) {
        const separatedBoard = separateBoardDigits(secretBoard);

        const root = validateBoardAndGetRoot(separatedBoard);

        return {
          publicOutput: root,
        };
      },
    },
  },
});

let GuessProgram = ZkProgram({
  name: 'valid-guess-proof',
  publicInput: Field,

  // Validates the guess and generates the outcome (hit or miss)
  methods: {
    validateGuess: {
      privateInputs: [],
      async method(guess: Field) {
        const isValid = guess
          .greaterThanOrEqual(0)
          .and(guess.lessThanOrEqual(15));
        isValid.assertTrue('The guess must be between 0 and 15!');
      },
    },
  },
});

let BoardProof_ = ZkProgram.Proof(BoardProgram);
class BoardProof extends BoardProof_ {}

let GuessProof_ = ZkProgram.Proof(GuessProgram);
class GuessProof extends GuessProof_ {}
