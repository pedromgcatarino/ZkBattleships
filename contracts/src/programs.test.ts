import { assert, Field } from 'o1js';
import { BoardProgram } from './programs';

console.time('Compiling BoardProgram...');
await BoardProgram.compile();
console.timeEnd('Compiling BoardProgram...');

let proof;
({ proof } = await BoardProgram.validateSecret(Field(1121121121121111n)));
const isSecretProofValid = await SolutionProgram.verify(proof);

assert(isSecretProofValid, 'Proof is not valid!');
Provable.log(
  'Solution Proof: PublicOutput (solution hash):',
  proof.publicOutput,
  '\n'
);

// ----------------------------------------

console.time('Compiling GuessProgram...');
await GuessProgram.compile();
console.timeEnd('Compiling GuessProgram...');

({ proof } = await GuessProgram.validateGuess(Field(3456)));
const isGuessProofValid = await GuessProgram.verify(proof);

assert(isGuessProofValid, 'Proof is not valid!');
Provable.log('Guess Proof: PublicInput (guess):', proof.publicInput, '\n');

// ----------------------------------------

console.time('Compiling ClueProgram...');
await ClueProgram.compile();
console.timeEnd('Compiling ClueProgram...');

({ proof } = await ClueProgram.getClueFromGuess(
  Field(3456), // Guess
  Field(1234), // Secret
  Field.random() // Salt
));

const isClueProofValid = await ClueProgram.verify(proof);
assert(isClueProofValid, 'Proof is not valid!');

Provable.log('Clue Proof: PublicInput (guess):', proof.publicInput);
Provable.log(
  'Clue Proof: PublicOutput (solution hash):',
  proof.publicOutput[0]
);
Provable.log(
  'Clue Proof: PublicOutput (serialized clue):',
  proof.publicOutput[1]
);
