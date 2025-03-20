import {
  Field,
  SmartContract,
  state,
  State,
  method,
  UInt8,
  Bool,
  Poseidon,
  MerkleWitness,
  Provable,
} from 'o1js';
import { BoardProof, GuessProof } from './programs';

class MerkleWitness8 extends MerkleWitness(8) {}

export class Battleships extends SmartContract {
  @state(UInt8) turnCount = State<UInt8>();

  @state(Field) player1Id = State<Field>();
  @state(Field) player2Id = State<Field>();

  @state(Field) player1FleetHash = State<Field>();
  @state(Field) player2FleetHash = State<Field>();
  @state(Field) player1RemainingShips = State<UInt8>();
  @state(Field) player2RemainingShips = State<UInt8>();

  @state(Bool) isOver = State<Bool>();

  @method async init() {
    const isInitialized = this.account.provedState.getAndRequireEquals();
    isInitialized.assertFalse('The game has already been initialized!');

    // Sets entire state to 0.
    super.init();

    this.player1RemainingShips.set(UInt8.from(4));
    this.player2RemainingShips.set(UInt8.from(4));
    // I dont think this is needed
    //this.isOver.set(Bool(false));
  }

  @method async startGameP1(validBoardProof: BoardProof) {
    const isInitialized = this.account.provedState.getAndRequireEquals();
    isInitialized.assertTrue('The game has not been initialized yet!');

    const turnCount = this.turnCount.getAndRequireEquals();
    turnCount.assertEquals(0, 'A game is already created!');

    this.isOver.getAndRequireEquals().assertFalse('The game is already over!');

    validBoardProof.verify();

    this.player1FleetHash.set(validBoardProof.publicOutput);

    const player1Id = Poseidon.hash(
      this.sender.getAndRequireSignature().toFields()
    );

    this.player1Id.set(player1Id);
  }

  @method async startGameP2(validBoardProof: BoardProof) {
    const isInitialized = this.account.provedState.getAndRequireEquals();
    isInitialized.assertTrue('The game has not been initialized yet!');

    const turnCount = this.turnCount.getAndRequireEquals();
    turnCount.assertEquals(0, 'A game is already created!');

    this.isOver.getAndRequireEquals().assertFalse('The game is already over!');

    validBoardProof.verify();
    // END OF VALIDITY CHECKS / START OF GAME LOGIC

    this.player2FleetHash.set(validBoardProof.publicOutput);

    const player2Id = Poseidon.hash(
      this.sender.getAndRequireSignature().toFields()
    );

    this.player2Id.set(player2Id);

    this.turnCount.set(turnCount.add(1));
  }

  @method async makeGuessP1(
    validGuessProof: GuessProof,
    guessWitness: MerkleWitness8
  ) {
    const isInitialized = this.account.provedState.getAndRequireEquals();
    isInitialized.assertTrue('The game has not been initialized yet!');

    const turnCount = this.turnCount.getAndRequireEquals();
    turnCount.assertGreaterThan(0, 'A game hasnt been created!');

    this.isOver.getAndRequireEquals().assertFalse('The game is already over!');

    const remainingShips = this.player2RemainingShips.getAndRequireEquals();
    remainingShips.assertGreaterThan(0, 'Player 2 has no remaining ships!');

    const isP1Turn = turnCount.value.isOdd();
    isP1Turn.assertTrue('Please wait for your turn!');

    const txSender = Poseidon.hash(
      this.sender.getAndRequireSignature().toFields()
    );
    this.player1Id
      .getAndRequireEquals()
      .assertEquals(txSender, 'You are not player 1!');

    validGuessProof.verify();
    // END OF VALIDITY CHECKS / START OF GAME LOGIC

    const fleetRoot = this.player2FleetHash.getAndRequireEquals();

    const computedHitRoot = guessWitness.calculateRoot(Field(2));
    const computedMissRoot = guessWitness.calculateRoot(Field(1));

    const isHit = computedHitRoot.equals(fleetRoot);

    const isHitOrMiss = isHit.or(computedMissRoot.equals(fleetRoot));

    isHitOrMiss.assertTrue('Invalid guess!');

    const gameOverFlow = () => {
      this.isOver.set(Bool(true));
      return Field(0);
    };

    const hitFlow = () => {
      const newRemainingShips = remainingShips.sub(1);
      const isOver = Field(newRemainingShips.value).equals(0);
      Provable.if(isOver, gameOverFlow(), Field(0));
      this.player2RemainingShips.set(newRemainingShips);
      // If it hits, we change the board to not allow further hits on the same ship.
      this.player2FleetHash.set(computedMissRoot);
      return Field(0);
    };

    Provable.if(isHit, hitFlow(), Field(0));

    this.turnCount.set(turnCount.add(1));
  }

  @method async makeGuessP2(
    validGuessProof: GuessProof,
    guessWitness: MerkleWitness8
  ) {
    const isInitialized = this.account.provedState.getAndRequireEquals();
    isInitialized.assertTrue('The game has not been initialized yet!');

    const turnCount = this.turnCount.getAndRequireEquals();
    turnCount.assertEquals(0, 'A game is already created!');

    this.isOver.getAndRequireEquals().assertFalse('The game is already over!');

    const remainingShips = this.player1RemainingShips.getAndRequireEquals();
    remainingShips.assertGreaterThan(0, 'Player 1 has no remaining ships!');

    const isP2Turn = turnCount.value.isEven();
    isP2Turn.assertTrue('Please wait for your turn!');

    const txSender = Poseidon.hash(
      this.sender.getAndRequireSignature().toFields()
    );
    this.player2Id
      .getAndRequireEquals()
      .assertEquals(txSender, 'You are not player 2!');

    validGuessProof.verify();
    // END OF VALIDITY CHECKS / START OF GAME LOGIC

    const fleetRoot = this.player1FleetHash.getAndRequireEquals();

    const computedHitRoot = guessWitness.calculateRoot(Field(2));
    const computedMissRoot = guessWitness.calculateRoot(Field(1));

    const isHit = computedHitRoot.equals(fleetRoot);

    const isHitOrMiss = isHit.or(computedMissRoot.equals(fleetRoot));

    isHitOrMiss.assertTrue('Invalid guess!');

    const gameOverFlow = () => {
      this.isOver.set(Bool(true));
      return Field(0);
    };

    const hitFlow = () => {
      const newRemainingShips = remainingShips.sub(1);
      const isOver = Field(newRemainingShips.value).equals(0);
      Provable.if(isOver, gameOverFlow(), Field(0));
      this.player1RemainingShips.set(newRemainingShips);
      // If it hits, we change the board to not allow further hits on the same ship.
      this.player1FleetHash.set(computedMissRoot);
      return Field(0);
    };

    Provable.if(isHit, hitFlow(), Field(0));

    this.turnCount.set(turnCount.add(1));
  }
}
