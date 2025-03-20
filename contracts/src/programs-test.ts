import { assert, Field, Provable } from 'o1js';
import { BoardProgram, GuessProgram } from './programs.js';

console.time('Compiling Valid BoardProgram...');
await BoardProgram.compile();
console.timeEnd('Compiling Valid BoardProgram...');

let proof;
({ proof } = await BoardProgram.validateSecret(Field(1121121121121111n)));
const isSecretProofValid = await BoardProgram.verify(proof);

assert(isSecretProofValid, 'Proof is not valid!');
Provable.log(
  'Board Proof: PublicOutput (board root):',
  proof.publicOutput,
  '\n'
);

// ----------------------------------------

console.time('Compiling Invalid BoardProgram...');
await BoardProgram.compile();
console.timeEnd('Compiling Invalid BoardProgram...');

try {
  ({ proof } = await BoardProgram.validateSecret(Field(1121121121122211n)));
  const result = await BoardProgram.verify(proof);
  assert(!result, 'Proof should be invalid');
} catch (e) {
  console.log('Proof invalid as expected');
  //console.log(e);
}
// ----------------------------------------

console.time('Compiling Valid GuessProgram...');
await GuessProgram.compile();
console.timeEnd('Compiling Valid GuessProgram...');

({ proof } = await GuessProgram.validateGuess(Field(12)));
const isGuessProofValid = await GuessProgram.verify(proof);

assert(isGuessProofValid, 'Proof is not valid!');
Provable.log('Guess Proof: PublicInput (guess):', proof.publicInput, '\n');

// ----------------------------------------

console.time('Compiling Invalid GuessProgram...');
await GuessProgram.compile();
console.timeEnd('Compiling Invalid GuessProgram...');

try {
  ({ proof } = await GuessProgram.validateGuess(Field(16)));
  const result = await GuessProgram.verify(proof);
  assert(!result, 'Proof should be invalid');
} catch (e) {
  console.log('Proof invalid as expected');
  //console.log(e);
}
