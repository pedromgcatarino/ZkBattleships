import { Field, Bool, Provable, MerkleTree } from 'o1js';

export {
  separateBoardDigits,
  compressBoardDigits,
  validateBoardAndGetRoot,
  serializeClue,
  deserializeClue,
  getClueFromGuess,
  checkIfSolved,
};

const treeHeight = 8;
function separateBoardDigits(board: Field) {
  // Assert that the board is a 16 digit Field
  const is16Digit = board
    .greaterThanOrEqual(1111111111112222n)
    .and(board.lessThanOrEqual(2222111111111111n));
  is16Digit.assertTrue('The board must be a 16 digit Field!');

  // Witness single digits of the board
  // Witness an array of 16 digits.
  // The digits are extracted from the board (from most-significant to least-significant)
  const digits = Provable.witness(Provable.Array(Field, 16), () => {
    const num = board.toBigInt();
    const arr: bigint[] = [];
    // Loop from 15 down to 0 to extract each digit
    for (let i = 15; i >= 0; i--) {
      const divisor = 10n ** BigInt(i);
      const digit = (num / divisor) % 10n;
      arr.push(digit);
    }
    return arr;
  });

  // Assert the correctness of the witnessed digit separation
  compressBoardDigits(digits).assertEquals(board);

  return digits;
}

// Recombine an array of 16 Field digits into one Field
function compressBoardDigits(digits: Field[]): Field {
  let board = Field(0);
  // For each digit, multiply the accumulator by 10 and add the next digit.
  for (let i = 0; i < 16; i++) {
    board = board.mul(Field(10)).add(digits[i]);
  }
  return board;
}

/**
 * Validates the board digits to ensure they meet the game rules, adds the digits to the tree and returns the tree's hash.
 *
 * @param board - An array of 16 Field digits representing the fleet, 2 if a ship is placed there, 1 otherwise.
 *
 * @throws Will throw an error if the digits don't add up to 20 (4 * 2 + 12 * 1).
 * @throws Will throw an error if any of the digits are not 1 or 2.
 */
function validateBoardAndGetRoot(board: Field[]): Field {
  let sum = Field(0);
  const tree = new MerkleTree(treeHeight);
  for (let i = 0; i < board.length; i++) {
    board[i]
      .equals(Field(1))
      .or(board[i].equals(Field(2)))
      .assertTrue('Board digit must be 1 or 2!');
    sum = sum.add(board[i]);
    tree.setLeaf(BigInt(i), board[i]);
  }
  sum.assertEquals(20, 'Board must have exactly 4 ships!');
  return tree.getRoot();
}

/**
 * Serializes an array of Field elements representing a clue into a single Field
 * Each clue element is converted to 2 bits and then combined into a single Field.
 *
 * @param clue - An array of 4 Field elements, each representing a part of the clue.
 * @returns - A single Field representing the serialized clue.
 */
function serializeClue(clue: Field[]): Field {
  const clueBits = clue.map((f) => f.toBits(2)).flat();
  const serializedClue = Field.fromBits(clueBits);

  return serializedClue;
}

/**
 * Deserializes a Field into an array of Field elements, each representing a part of the clue.
 * The serialized clue is split into 2-bit segments to retrieve the original clue elements.
 *
 * @note This function is not used within a zkApp itself but is utilized for reading and deserializing
 * on-chain stored data, as well as verifying integrity during integration tests.
 *
 * @param serializedClue - A Field representing the serialized clue.
 * @returns - An array of 4 Field elements representing the deserialized clue.
 */
function deserializeClue(serializedClue: Field): Field[] {
  const bits = serializedClue.toBits(8);
  const clueA = Field.fromBits(bits.slice(0, 2));
  const clueB = Field.fromBits(bits.slice(2, 4));
  const clueC = Field.fromBits(bits.slice(4, 6));
  const clueD = Field.fromBits(bits.slice(6, 8));

  return [clueA, clueB, clueC, clueD];
}
/**
 * Compares the guess with the solution and returns a clue indicating hits and blows.
 * A "hit" is when a guess digit matches a solution digit in both value and position.
 * A "blow" is when a guess digit matches a solution digit in value but not position.
 *
 * @param guess - The array representing the guessed combination.
 * @param solution - The array representing the correct solution.
 * @returns - An array where each element represents the clue for a corresponding guess digit.
 *                           2 indicates a "hit" and 1 indicates a "blow".
 */
function getClueFromGuess(guess: Field[], solution: Field[]) {
  let clue = Array.from({ length: 4 }, () => Field(0));

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const isEqual = guess[i].equals(solution[j]).toField();
      if (i === j) {
        clue[i] = clue[i].add(isEqual.mul(2)); // 2 for a hit (correct digit and position)
      } else {
        clue[i] = clue[i].add(isEqual); // 1 for a blow (correct digit, wrong position)
      }
    }
  }

  return clue;
}

/**
 * Determines if the secret combination is solved based on the given clue.
 *
 * @param clue - An array representing the clues for each guess.
 * @returns Returns true if all clues indicate a "hit" (2), meaning the secret is solved.
 */
function checkIfSolved(clue: Field[]) {
  let isSolved = Bool(true);

  for (let i = 0; i < 4; i++) {
    let isHit = clue[i].equals(2);
    isSolved = isSolved.and(isHit);
  }

  return isSolved;
}
