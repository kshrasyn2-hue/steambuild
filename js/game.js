// ════════════════════════════════════════════════════════
//  世界の真理 — スチームパンク・デッキ構築ゲーム
// ════════════════════════════════════════════════════════

// ─── 定数 ───────────────────────────────────────────────
const TYPE = {
  TREASURE: 'treasure',
  VICTORY:  'victory',
  ACTION:   'action',
  STARTING: 'starting',
};

const PHASE = {
  ACTION:   'action',
  BUY:      'buy',
  AI_TURN:  'ai_turn',
  GAME_OVER:'game_over',
};

// ─── ランダムカード名生成プール ──────────────────────────
var _adj  = ['蒸気','機械','歯車','煤煙','エーテル','電磁','時計','錬金',
             '飛行','光学','磁力','黄金','水晶','鉄鋼','霧','熱','精密',
             '高圧','真空','超合金','反重力','蒸発','螺旋','旋回'];
var _noun = ['機関','望遠鏡','工房','人形','装置','砲台','炉','計算機',
             '図書館','実験室','操縦室','気球','鍛冶場','観測台','羅針盤',
             'タービン','ゴーレム','変換器','蒸留器','弁','回路','ピストン',
             '発電機','推進器'];

var _TREASURE_NAMES = {
  steam_silver: ['銀製歯車','精錬銀貨','磨かれた銀','銀の証書','白銀の印章','精製銀塊'],
  steam_gold:   ['黄金歯車','精錬金貨','黄金の証書','黄金印章','純金の紋章','精製金塊'],
};
var _VP_NAMES = {
  truth_fragment: ['真理の断片','知識の欠片','解読の糸口','謎の断片','秘密の欠片','観測記録'],
  truth_tome:     ['真理の書','知識の典籍','謎解きの書','解析記録','秘密の書','研究論文'],
  world_truth:    ['世界の真理','究極の知識','宇宙の秘密','万物の理','創造の真理','最終解答'],
};

// ─── アクション効果プール（コスト帯別）────────────────────
var _EFFECT_POOL = {
  c3: [
    { coins:0, actions:1, draws:2, buys:0, special:null,      emoji:'📚', desc:'+1アクション、+2ドロー' },
    { coins:2, actions:1, draws:0, buys:0, special:null,      emoji:'⚙️', desc:'+1アクション、+2コイン' },
    { coins:0, actions:1, draws:0, buys:0, special:'scry3',   emoji:'🔭', desc:'+1アクション、デッキ上位3枚を確認・並べ替え' },
    { coins:3, actions:0, draws:0, buys:0, special:null,      emoji:'💰', desc:'+3コイン' },
    { coins:1, actions:1, draws:1, buys:0, special:null,      emoji:'🔩', desc:'+1アクション、+1コイン、+1ドロー' },
    { coins:0, actions:0, draws:3, buys:0, special:null,      emoji:'🗂️', desc:'+3ドロー' },
  ],
  c4: [
    { coins:3, actions:0, draws:0, buys:0, special:null,      emoji:'🔧', desc:'+3コイン' },
    { coins:2, actions:0, draws:0, buys:1, special:null,      emoji:'🛒', desc:'+2コイン、+1購入' },
    { coins:0, actions:2, draws:0, buys:0, special:null,      emoji:'⚡', desc:'+2アクション' },
    { coins:2, actions:0, draws:0, buys:0, special:'attack',  emoji:'✈️', desc:'+2コイン、相手は3枚以下に捨て' },
    { coins:0, actions:0, draws:0, buys:0, special:'upgrade', emoji:'🏭', desc:'手札1枚を廃棄し、コスト+2以下を獲得' },
    { coins:0, actions:2, draws:1, buys:0, special:null,      emoji:'🤖', desc:'+2アクション、+1ドロー' },
    { coins:4, actions:0, draws:0, buys:0, special:null,      emoji:'💎', desc:'+4コイン' },
    { coins:1, actions:1, draws:1, buys:0, special:null,      emoji:'🔩', desc:'+1アクション、+1コイン、+1ドロー' },
  ],
  c5: [
    { coins:2, actions:1, draws:0, buys:1, special:null,      emoji:'💻', desc:'+1アクション、+1購入、+2コイン' },
    { coins:0, actions:1, draws:3, buys:0, special:null,      emoji:'🌟', desc:'+1アクション、+3ドロー' },
    { coins:1, actions:0, draws:2, buys:1, special:null,      emoji:'📖', desc:'+1コイン、+2ドロー、+1購入' },
    { coins:2, actions:2, draws:0, buys:0, special:null,      emoji:'🕰️', desc:'+2アクション、+2コイン' },
    { coins:4, actions:0, draws:0, buys:0, special:null,      emoji:'💎', desc:'+4コイン' },
  ],
  c6: [
    { coins:0, actions:1, draws:3, buys:0, special:null,      emoji:'🏛️', desc:'+1アクション、+3ドロー' },
    { coins:4, actions:1, draws:0, buys:0, special:null,      emoji:'⚗️', desc:'+1アクション、+4コイン' },
    { coins:2, actions:2, draws:2, buys:0, special:null,      emoji:'🏭', desc:'+2アクション、+2ドロー、+2コイン' },
    { coins:3, actions:0, draws:0, buys:2, special:null,      emoji:'🛸', desc:'+3コイン、+2購入' },
    { coins:0, actions:2, draws:3, buys:0, special:null,      emoji:'🌌', desc:'+2アクション、+3ドロー' },
  ],
};

var _ACTION_SLOT_IDS = [
  'alchemy_lab','steam_engine','clockwork_doll','aether_scope',
  'inventors_workshop','airship_raid','analytical_engine','grand_observatory',
];

function _pickN(arr, n) {
  var copy = arr.slice(), result = [];
  while (result.length < n && copy.length > 0) {
    var i = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(i, 1)[0]);
  }
  return result;
}

function _randName(used) {
  var name, tries = 0;
  do {
    name = _adj[Math.floor(Math.random() * _adj.length)]
         + _noun[Math.floor(Math.random() * _noun.length)];
    tries++;
  } while (used[name] && tries < 200);
  used[name] = true;
  return name;
}

function _pick1(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── CARD_DEFS をゲームごとにランダム生成 ────────────────
var CARD_DEFS = {};

function generateCardDefs() {
  CARD_DEFS = {
    steam_copper: {
      id:'steam_copper', name:'蒸気銅貨', type:TYPE.TREASURE, cost:0,
      coins:1, vp:0, description:'+1コイン', emoji:'🪙',
    },
    steam_silver: {
      id:'steam_silver', name:_pick1(_TREASURE_NAMES.steam_silver), type:TYPE.TREASURE, cost:3,
      coins:2, vp:0, description:'+2コイン', emoji:'⚙️',
    },
    steam_gold: {
      id:'steam_gold', name:_pick1(_TREASURE_NAMES.steam_gold), type:TYPE.TREASURE, cost:6,
      coins:3, vp:0, description:'+3コイン', emoji:'✨',
    },
    observation_note: {
      id:'observation_note', name:'観測ノート', type:TYPE.STARTING, cost:0,
      coins:0, vp:1, description:'1VP（初期カード）', emoji:'📓',
    },
    truth_fragment: {
      id:'truth_fragment', name:_pick1(_VP_NAMES.truth_fragment), type:TYPE.VICTORY, cost:2,
      coins:0, vp:1, description:'1VP', emoji:'🔮',
    },
    truth_tome: {
      id:'truth_tome', name:_pick1(_VP_NAMES.truth_tome), type:TYPE.VICTORY, cost:5,
      coins:0, vp:3, description:'3VP', emoji:'📚',
    },
    world_truth: {
      id:'world_truth', name:_pick1(_VP_NAMES.world_truth), type:TYPE.VICTORY, cost:8,
      coins:0, vp:6, description:'6VP', emoji:'🌍',
    },
  };

  // アクションカード8枚: コスト帯 2+3+2+1 でランダム選択（costを付与）
  function addCost(arr, cost) {
    return arr.map(function(e) { return Object.assign({ cost: cost }, e); });
  }
  var picked = shuffle(
    addCost(_pickN(_EFFECT_POOL.c3, 2), 3).concat(
    addCost(_pickN(_EFFECT_POOL.c4, 3), 4),
    addCost(_pickN(_EFFECT_POOL.c5, 2), 5),
    addCost(_pickN(_EFFECT_POOL.c6, 1), 6))
  );
  var usedNames = {};
  for (var i = 0; i < _ACTION_SLOT_IDS.length; i++) {
    var id  = _ACTION_SLOT_IDS[i];
    var eff = picked[i];
    CARD_DEFS[id] = {
      id:          id,
      name:        _randName(usedNames),
      type:        TYPE.ACTION,
      cost:        eff.cost,
      coins:       eff.coins   || 0,
      vp:          0,
      actions:     eff.actions || 0,
      draws:       eff.draws   || 0,
      buys:        eff.buys    || 0,
      special:     eff.special || null,
      description: eff.desc,
      emoji:       eff.emoji,
    };
  }
}

const SUPPLY_CONFIG = {
  steam_silver:       30,
  steam_gold:         20,
  truth_fragment:     24,
  truth_tome:         12,
  world_truth:         8,
  alchemy_lab:        10,
  steam_engine:       10,
  clockwork_doll:     10,
  aether_scope:       10,
  inventors_workshop: 10,
  airship_raid:       10,
  analytical_engine:  10,
  grand_observatory:  10,
};

function makeStartingDeck() {
  const deck = [];
  for (let i = 0; i < 7; i++) deck.push(Object.assign({}, CARD_DEFS.steam_copper));
  for (let i = 0; i < 3; i++) deck.push(Object.assign({}, CARD_DEFS.observation_note));
  return deck;
}

// ─── ユーティリティ ──────────────────────────────────────
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let _uidCounter = 0;
function uid() { return 'c' + (++_uidCounter); }

function makeCardInstance(cardId) {
  return Object.assign({}, CARD_DEFS[cardId], { uid: uid() });
}

// ─── ゲーム状態 ──────────────────────────────────────────
class GameState {
  constructor() {
    this.supply = {};
    this.player = { deck: [], hand: [], discard: [], played: [] };
    this.ai     = { deck: [], hand: [], discard: [], played: [] };

    this.coins   = 0;
    this.actions = 1;
    this.buys    = 1;
    this.phase   = PHASE.ACTION;
    this.turn    = 0;
    this.log     = [];
    this.winner  = null;

    this.upgradeMode = false;
    this.upgradeMax  = 0;
    this.scryCards   = [];
    this.scryMode    = false;

    this._initSupply();
    this._initPlayer(this.player);
    this._initPlayer(this.ai);
    this._drawHand(this.player, 5);
  }

  _initSupply() {
    for (const [id, count] of Object.entries(SUPPLY_CONFIG)) {
      this.supply[id] = count;
    }
  }

  _initPlayer(p) {
    p.deck    = shuffle(makeStartingDeck());
    p.hand    = [];
    p.discard = [];
    p.played  = [];
  }

  _drawCards(p, n) {
    for (let i = 0; i < n; i++) {
      if (p.deck.length === 0) {
        if (p.discard.length === 0) break;
        p.deck = shuffle(p.discard);
        p.discard = [];
      }
      p.hand.push(p.deck.shift());
    }
  }

  _drawHand(p, n) { this._drawCards(p, n); }

  _cleanup(p) {
    p.discard.push(...p.hand, ...p.played);
    p.hand   = [];
    p.played = [];
  }

  addLog(msg) {
    this.log.unshift(msg);
    if (this.log.length > 60) this.log.pop();
  }

  // ── プレイヤー操作 ─────────────────────────────────────

  playCard(cardUid) {
    if (this.phase === PHASE.GAME_OVER) return { ok: false };
    const idx = this.player.hand.findIndex(c => c.uid === cardUid);
    if (idx === -1) return { ok: false, msg: 'カードが見つかりません' };
    const card = this.player.hand[idx];

    if (this.phase === PHASE.ACTION) {
      if (card.type !== TYPE.ACTION) return { ok: false, msg: 'アクションフェーズではアクションカードのみ使えます' };
      if (this.actions < 1) return { ok: false, msg: 'アクションが残っていません' };
      this.actions--;
      this.player.hand.splice(idx, 1);
      this.player.played.push(card);
      return this._applyPlayerAction(card);
    }

    if (this.phase === PHASE.BUY) {
      if (card.type !== TYPE.TREASURE && card.type !== TYPE.STARTING) {
        return { ok: false, msg: '購入フェーズでは財宝カードのみ使えます' };
      }
      this.coins += card.coins || 0;
      this.player.hand.splice(idx, 1);
      this.player.played.push(card);
      this.addLog('\u{1F4B0} ' + card.name + ' を使用 → コイン +' + (card.coins || 0) + '（計' + this.coins + '）');
      return { ok: true };
    }

    return { ok: false };
  }

  _applyPlayerAction(card) {
    this.addLog('▶ ' + card.emoji + ' ' + card.name + ' をプレイ');
    this.coins   += card.coins   || 0;
    this.actions += card.actions || 0;
    this.buys    += card.buys    || 0;
    if (card.draws) this._drawCards(this.player, card.draws);

    if (card.special === 'scry3')   return this._startScry(card.name);
    if (card.special === 'upgrade') return this._startUpgrade(card.name);
    if (card.special === 'attack')  this._applyAttack(this.ai, 'AI', card.name);
    return { ok: true };
  }

  _startScry(cardName) {
    const top = [];
    for (let i = 0; i < 3; i++) {
      if (this.player.deck.length === 0) {
        if (this.player.discard.length === 0) break;
        this.player.deck = shuffle(this.player.discard.splice(0));
      }
      if (this.player.deck.length > 0) top.push(this.player.deck.shift());
    }
    this.scryCards = top;
    this.scryMode  = true;
    this.addLog('🔭 ' + (cardName || 'スクライ') + ': デッキ上位' + top.length + '枚を確認中...');
    return { ok: true, scry: true, cards: top };
  }

  commitScry(order) {
    // order[0] = 最初に引かれるカードのインデックス
    const reordered = order.map(i => this.scryCards[i]);
    this.player.deck.unshift(...reordered);
    this.scryCards = [];
    this.scryMode  = false;
    this.addLog('🔭 エーテル望遠鏡: デッキ上部を並べ替えました');
    return { ok: true };
  }

  _startUpgrade(cardName) {
    this.upgradeMode = true;
    this.addLog('🏭 ' + (cardName || 'アップグレード') + ': 廃棄するカードを手札から選んでください');
    return { ok: true, upgrade: true };
  }

  selectUpgradeTrash(cardUid) {
    if (!this.upgradeMode) return { ok: false };
    const idx = this.player.hand.findIndex(c => c.uid === cardUid);
    if (idx === -1) return { ok: false };
    const card = this.player.hand.splice(idx, 1)[0];
    this.upgradeMax  = card.cost + 2;
    this.upgradeMode = false;
    this.addLog('🏭 ' + card.name + '（コスト' + card.cost + '）を廃棄 → コスト' + this.upgradeMax + '以下を獲得可');
    return { ok: true, maxCost: this.upgradeMax };
  }

  selectUpgradeGain(cardId) {
    const def = CARD_DEFS[cardId];
    if (!def) return { ok: false };
    if (def.cost > this.upgradeMax) return { ok: false, msg: 'コストが高すぎます（最大' + this.upgradeMax + '）' };
    if ((this.supply[cardId] || 0) <= 0) return { ok: false, msg: '在庫切れ' };
    this.supply[cardId]--;
    this.player.discard.push(makeCardInstance(cardId));
    this.upgradeMax = 0;
    this.addLog('🏭 ' + def.emoji + ' ' + def.name + ' を獲得（捨て札へ）');
    return { ok: true };
  }

  _applyAttack(target, targetName, cardName) {
    while (target.hand.length > 3) {
      target.discard.push(target.hand.pop());
    }
    this.addLog((cardName ? '✈️ ' + cardName : '✈️ 攻撃') + ': ' + targetName + 'の手札を3枚に削減');
  }

  buyCard(cardId) {
    if (this.phase !== PHASE.BUY) return { ok: false, msg: '購入フェーズではありません' };
    if (this.buys < 1) return { ok: false, msg: '購入回数が残っていません' };
    const def = CARD_DEFS[cardId];
    if (!def) return { ok: false };
    if ((this.supply[cardId] || 0) <= 0) return { ok: false, msg: '在庫切れ' };
    if (this.coins < def.cost) return { ok: false, msg: 'コインが足りません（必要: ' + def.cost + '、所持: ' + this.coins + '）' };

    this.coins -= def.cost;
    this.buys--;
    this.supply[cardId]--;
    this.player.discard.push(makeCardInstance(cardId));
    this.addLog('🛒 ' + def.emoji + ' ' + def.name + '（コスト' + def.cost + '）を購入');

    const gameOver = this._checkGameOver();
    return { ok: true, gameOver };
  }

  enterBuyPhase() {
    if (this.phase !== PHASE.ACTION) return;
    this.phase = PHASE.BUY;
    this.addLog('── 購入フェーズ ──');
    // 手札の財宝を自動プレイ
    const treasures = this.player.hand.filter(
      c => c.type === TYPE.TREASURE || c.type === TYPE.STARTING
    );
    for (const t of treasures) {
      const idx = this.player.hand.indexOf(t);
      this.player.hand.splice(idx, 1);
      this.player.played.push(t);
      this.coins += t.coins || 0;
    }
    if (treasures.length > 0) {
      this.addLog('💰 財宝' + treasures.length + '枚を自動プレイ → ' + this.coins + 'コイン');
    }
  }

  endPlayerTurn() {
    if (this.phase === PHASE.GAME_OVER) return { gameOver: true };
    this._cleanup(this.player);
    this._drawHand(this.player, 5);
    this.addLog('─── あなたのターン終了 ───');

    const gameOver = this._checkGameOver();
    if (gameOver) return { gameOver: true };

    this.phase = PHASE.AI_TURN;
    return { gameOver: false };
  }

  startPlayerTurn() {
    this.coins   = 0;
    this.actions = 1;
    this.buys    = 1;
    this.phase   = PHASE.ACTION;
    this.turn++;
    this.addLog('═══ ターン ' + this.turn + ' 開始（あなた）═══');
    // アクションカードがなければ購入フェーズへ自動スキップ
    const hasAction = this.player.hand.some(c => c.type === TYPE.ACTION);
    if (!hasAction) this.enterBuyPhase();
  }

  // ── 勝利判定 ───────────────────────────────────────────

  _checkGameOver() {
    if (this.phase === PHASE.GAME_OVER) return true;
    if (this.supply.world_truth === 0) {
      this._endGame('世界の真理カードが全て解明された');
      return true;
    }
    const exhausted = Object.values(this.supply).filter(n => n === 0).length;
    if (exhausted >= 3) {
      this._endGame('3種のサプライが尽きた');
      return true;
    }
    return false;
  }

  _endGame(reason) {
    const playerVP = this._countVP(this.player);
    const aiVP     = this._countVP(this.ai);
    this.phase = PHASE.GAME_OVER;
    this.winner = playerVP > aiVP ? 'player' : aiVP > playerVP ? 'ai' : 'draw';
    this.addLog('🌟 ゲーム終了: ' + reason);
    this.addLog('あなた: ' + playerVP + 'VP / AI: ' + aiVP + 'VP');
  }

  _countVP(p) {
    return [...p.deck, ...p.hand, ...p.discard, ...p.played]
      .reduce((sum, c) => sum + (c.vp || 0), 0);
  }

  countPlayerVP() { return this._countVP(this.player); }
  countAIVP()     { return this._countVP(this.ai); }
}

// ─── AI ──────────────────────────────────────────────────
function _scoreActionCard(card) {
  return (card.coins   || 0) * 1.2
       + (card.actions || 0) * 2.5
       + (card.draws   || 0) * 1.5
       + (card.buys    || 0) * 2.0
       + (card.special === 'scry3'   ? 1.0 : 0)
       + (card.special === 'upgrade' ? 2.5 : 0)
       + (card.special === 'attack'  ? 1.5 : 0);
}

function _scoreCardForBuy(def, allCards) {
  if (!def) return -Infinity;
  if (def.id === 'world_truth') return 1000;
  if (def.type === TYPE.VICTORY) return def.vp * 9 - def.cost;
  if (def.type === TYPE.TREASURE) {
    const cnt = allCards.filter(function(c) { return c.id === def.id; }).length;
    const limit = Math.max(2, Math.floor((allCards.length || 1) / 5) + 1);
    if (cnt >= limit) return -1;
    return def.coins * 8 - def.cost * 1.5;
  }
  if (def.type === TYPE.ACTION) {
    const cnt = allCards.filter(function(c) { return c.id === def.id; }).length;
    if (cnt >= 2) return -1;
    return _scoreActionCard(def) - def.cost * 0.4;
  }
  return 0;
}

function aiChooseBuy(supply, coins, allCards) {
  if (coins >= 8 && (supply.world_truth || 0) > 0) return 'world_truth';
  var bestId = null, bestScore = -Infinity;
  for (var id in supply) {
    if ((supply[id] || 0) <= 0) continue;
    var def = CARD_DEFS[id];
    if (!def || def.cost > coins || def.type === TYPE.STARTING) continue;
    var score = _scoreCardForBuy(def, allCards);
    if (score > bestScore) { bestScore = score; bestId = id; }
  }
  return bestId;
}

function aiChooseBestGain(supply, maxCost) {
  var bestId = null, bestScore = -Infinity;
  for (var id in supply) {
    if ((supply[id] || 0) <= 0) continue;
    var def = CARD_DEFS[id];
    if (!def || def.cost > maxCost || def.type === TYPE.STARTING) continue;
    var score = _scoreCardForBuy(def, []);
    if (score > bestScore) { bestScore = score; bestId = id; }
  }
  return bestId;
}

function runAITurn(game) {
  var ai = game.ai;
  game.addLog('═══ AIのターン ═══');
  game._drawHand(ai, 5);
  game.addLog('AI: 5枚ドロー（手札' + ai.hand.length + '枚）');

  var actionsLeft = 1;
  var aiCoins = 0;
  var aiBuys  = 0;

  var acted = true;
  while (acted && actionsLeft > 0) {
    acted = false;
    var actionCards = ai.hand
      .filter(function(c) { return c.type === TYPE.ACTION; })
      .sort(function(a, b) { return _scoreActionCard(b) - _scoreActionCard(a); });
    if (actionCards.length === 0) break;
    var card = actionCards[0];
    var idx = ai.hand.findIndex(function(c) { return c.uid === card.uid; });
    ai.hand.splice(idx, 1);
    ai.played.push(card);
    actionsLeft--;
    actionsLeft += card.actions || 0;
    aiCoins     += card.coins   || 0;
    aiBuys      += card.buys    || 0;
    if (card.draws) game._drawCards(ai, card.draws);

    if (card.special === 'attack') {
      while (game.player.hand.length > 3) {
        game.player.discard.push(game.player.hand.pop());
      }
      game.addLog('✈️ ' + card.name + ': あなたの手札が3枚に削減された！');
    }
    if (card.special === 'upgrade') {
      var trashable = ai.hand.filter(function(c) { return c.vp === 0 && c.type !== TYPE.VICTORY; });
      if (trashable.length > 0) {
        trashable.sort(function(a, b) { return a.cost - b.cost; });
        var toTrash = trashable[0];
        var ti = ai.hand.findIndex(function(c) { return c.uid === toTrash.uid; });
        ai.hand.splice(ti, 1);
        var maxCost = toTrash.cost + 2;
        var gainId  = aiChooseBestGain(game.supply, maxCost);
        if (gainId) {
          game.supply[gainId]--;
          ai.discard.push(makeCardInstance(gainId));
          game.addLog('🏭 AI: ' + toTrash.name + 'を廃棄 → ' + CARD_DEFS[gainId].name + 'を獲得');
        }
      }
    }

    game.addLog('AI ▶ ' + card.emoji + ' ' + card.name + ' をプレイ（' + card.description + '）');
    acted = true;
  }

  // 財宝をすべて使用
  var treasures = ai.hand.filter(function(c) { return c.type === TYPE.TREASURE; });
  var treasureCoins = 0;
  for (var ti2 = 0; ti2 < treasures.length; ti2++) {
    var t = treasures[ti2];
    var tidx = ai.hand.findIndex(function(c) { return c.uid === t.uid; });
    ai.hand.splice(tidx, 1);
    ai.played.push(t);
    treasureCoins += t.coins || 0;
  }
  var totalCoins = aiCoins + treasureCoins;
  if (treasures.length > 0) {
    game.addLog('AI: 財宝' + treasures.length + '枚使用 → ' + totalCoins + 'コイン');
  }

  // 購入
  var buysLeft = 1 + aiBuys;
  var coinsLeft = totalCoins;
  var allAI = ai.deck.concat(ai.discard);

  while (buysLeft > 0) {
    var buyId = aiChooseBuy(game.supply, coinsLeft, allAI);
    if (!buyId) break;
    var buyDef = CARD_DEFS[buyId];
    game.supply[buyId]--;
    ai.discard.push(makeCardInstance(buyId));
    allAI.push(Object.assign({}, buyDef));
    coinsLeft -= buyDef.cost;
    buysLeft--;
    game.addLog('AI 🛒 ' + buyDef.emoji + ' ' + buyDef.name + '（コスト' + buyDef.cost + '）を購入');
  }

  // クリーンアップ
  ai.discard.push.apply(ai.discard, ai.hand.concat(ai.played));
  ai.hand   = [];
  ai.played = [];
  game.addLog('AI: ターン終了');
}

// ─── UI ──────────────────────────────────────────────────
function cardTypeClass(card) {
  if (card.type === TYPE.TREASURE || card.type === TYPE.STARTING) return 'treasure';
  if (card.type === TYPE.VICTORY)  return 'victory';
  if (card.type === TYPE.ACTION)   return 'action';
  return '';
}

function makeCardEl(card, opts) {
  opts = opts || {};
  const el = document.createElement('div');
  el.className = 'card card-' + cardTypeClass(card) +
    (opts.faded    ? ' faded'    : '') +
    (opts.selected ? ' selected' : '');
  if (opts.uid) el.dataset.uid = opts.uid;
  if (opts.id)  el.dataset.id  = opts.id;

  el.innerHTML =
    '<div class="card-cost">' + card.cost + '</div>' +
    '<div class="card-emoji">' + card.emoji + '</div>' +
    '<div class="card-name">' + card.name + '</div>' +
    '<div class="card-desc">' + card.description + '</div>' +
    (card.vp ? '<div class="card-vp">' + card.vp + 'VP</div>' : '');
  return el;
}

function makeSupplyCardEl(cardId, count) {
  const def = CARD_DEFS[cardId];
  const el  = document.createElement('div');
  el.className = 'card card-' + cardTypeClass(def) + ' supply-card' + (count <= 0 ? ' exhausted' : '');
  el.dataset.id = cardId;
  el.innerHTML =
    '<div class="card-cost">' + def.cost + '</div>' +
    '<div class="supply-count">×' + count + '</div>' +
    '<div class="card-emoji">' + def.emoji + '</div>' +
    '<div class="card-name">' + def.name + '</div>' +
    '<div class="card-desc">' + def.description + '</div>' +
    (def.vp ? '<div class="card-vp">' + def.vp + 'VP</div>' : '');
  return el;
}

function renderStatus(game) {
  document.getElementById('stat-coins').textContent   = game.coins;
  document.getElementById('stat-actions').textContent = game.actions;
  document.getElementById('stat-buys').textContent    = game.buys;
  document.getElementById('stat-turn').textContent    = game.turn;
  document.getElementById('player-vp').textContent    = game.countPlayerVP();
  document.getElementById('ai-vp').textContent        = game.countAIVP();
  document.getElementById('player-deck').textContent  = game.player.deck.length;
  document.getElementById('player-disc').textContent  = game.player.discard.length;
  document.getElementById('ai-hand').textContent      = game.ai.hand.length;
  document.getElementById('ai-deck').textContent      = game.ai.deck.length;
  document.getElementById('ai-disc').textContent      = game.ai.discard.length;

  const phaseEl = document.getElementById('phase-label');
  const phaseMap = {
    [PHASE.ACTION]:   'アクションフェーズ',
    [PHASE.BUY]:      '購入フェーズ',
    [PHASE.AI_TURN]:  'AIのターン',
    [PHASE.GAME_OVER]:'ゲーム終了',
  };
  phaseEl.textContent = phaseMap[game.phase] || '';
  phaseEl.className   = 'phase-label phase-' + game.phase;
}

function _handSortOrder(card) {
  if (card.type === TYPE.ACTION)   return 0;
  if (card.type === TYPE.TREASURE || card.type === TYPE.STARTING) return 1;
  return 2;
}

function renderHand(game, onPlayCard) {
  const container = document.getElementById('player-hand');
  container.innerHTML = '';
  const sorted = game.player.hand.slice().sort(function(a, b) {
    return _handSortOrder(a) - _handSortOrder(b);
  });
  for (const card of sorted) {
    const playable = isPlayable(card, game);
    const el = makeCardEl(card, { uid: card.uid, faded: !playable });
    if (playable) {
      el.addEventListener('click', function() { onPlayCard(card.uid); });
      el.title = 'クリックしてプレイ';
    }
    container.appendChild(el);
  }
}

function isPlayable(card, game) {
  if (game.upgradeMode) return true; // 発明家の工房: 廃棄する任意のカードを選択
  if (game.phase === PHASE.ACTION) return card.type === TYPE.ACTION && game.actions > 0;
  if (game.phase === PHASE.BUY)    return card.type === TYPE.TREASURE;
  return false;
}

function renderPlayArea(game) {
  const container = document.getElementById('play-area');
  container.innerHTML = '';
  for (const card of game.player.played) {
    container.appendChild(makeCardEl(card, {}));
  }
}

function renderSupply(game, onBuyCard) {
  var container = document.getElementById('supply-cards');
  container.innerHTML = '';

  var isMobile = window.innerWidth <= 767;

  if (isMobile) {
    // ─── モバイル: タブごとに1フラット行（横スクロール可） ───
    var mobileGroups = [
      {
        tab: 'vp-treasure',
        ids: ['steam_silver', 'steam_gold', 'truth_fragment', 'truth_tome', 'world_truth'],
      },
      {
        tab: 'action',
        ids: ['alchemy_lab', 'steam_engine', 'clockwork_doll', 'aether_scope',
              'inventors_workshop', 'airship_raid', 'analytical_engine', 'grand_observatory'],
      },
    ];
    for (var gi = 0; gi < mobileGroups.length; gi++) {
      var grp = mobileGroups[gi];
      var rowEl = document.createElement('div');
      rowEl.className = 'supply-row mobile-supply-row';
      rowEl.dataset.tab = grp.tab;
      if (grp.tab !== activeSupplyTab) rowEl.classList.add('hidden-tab');
      for (var ci = 0; ci < grp.ids.length; ci++) {
        var id = grp.ids[ci];
        var count = game.supply[id] !== undefined ? game.supply[id] : 0;
        var el = makeSupplyCardEl(id, count);
        var canBuy = (game.phase === PHASE.BUY && count > 0 && game.coins >= CARD_DEFS[id].cost && game.buys > 0)
          || (game.upgradeMax > 0 && count > 0 && CARD_DEFS[id].cost <= game.upgradeMax);
        if (canBuy) {
          el.classList.add('buyable');
          el.addEventListener('click', (function(cid) {
            return function() { onBuyCard(cid); };
          })(id));
        }
        rowEl.appendChild(el);
      }
      container.appendChild(rowEl);
    }
    return;
  }

  // ─── デスクトップ: セクション分け表示 ───
  var sections = [
    { label: '財宝', ids: ['steam_silver', 'steam_gold'], tab: 'vp-treasure' },
    { label: '知識（勝利点）', ids: ['truth_fragment', 'truth_tome', 'world_truth'], tab: 'vp-treasure' },
    { label: '発明品（アクション）', ids: ['alchemy_lab', 'steam_engine', 'clockwork_doll', 'aether_scope', 'inventors_workshop', 'airship_raid', 'analytical_engine', 'grand_observatory'], tab: 'action' },
  ];
  for (var si = 0; si < sections.length; si++) {
    var sec = sections[si];
    var secEl = document.createElement('div');
    secEl.className = 'supply-section';
    secEl.dataset.tab = sec.tab;
    var labelEl = document.createElement('div');
    labelEl.className = 'supply-label';
    labelEl.textContent = sec.label;
    secEl.appendChild(labelEl);
    var deskRowEl = document.createElement('div');
    deskRowEl.className = 'supply-row';
    for (var di = 0; di < sec.ids.length; di++) {
      var did = sec.ids[di];
      var dcount = game.supply[did] !== undefined ? game.supply[did] : 0;
      var del = makeSupplyCardEl(did, dcount);
      var dcanBuy = (game.phase === PHASE.BUY && dcount > 0 && game.coins >= CARD_DEFS[did].cost && game.buys > 0)
        || (game.upgradeMax > 0 && dcount > 0 && CARD_DEFS[did].cost <= game.upgradeMax);
      if (dcanBuy) {
        del.classList.add('buyable');
        del.addEventListener('click', (function(cid) {
          return function() { onBuyCard(cid); };
        })(did));
        del.title = 'クリックして購入（コスト' + CARD_DEFS[did].cost + '）';
      }
      deskRowEl.appendChild(del);
    }
    secEl.appendChild(deskRowEl);
    container.appendChild(secEl);
  }
}

function renderLog(game) {
  const el = document.getElementById('game-log');
  el.innerHTML = game.log
    .map(function(l) { return '<div class="log-line">' + l + '</div>'; })
    .join('');
}

function renderButtons(game) {
  const busy = game.upgradeMode || game.scryMode || game.upgradeMax > 0;
  document.getElementById('btn-buy-phase').disabled = game.phase !== PHASE.ACTION || busy;
  document.getElementById('btn-end-turn').disabled  = game.phase !== PHASE.BUY    || busy;
}

function showScryModal(cards, onCommit) {
  const modal      = document.getElementById('scry-modal');
  const container  = document.getElementById('scry-cards');
  const confirmBtn = document.getElementById('btn-scry-confirm');
  container.innerHTML = '';
  const clickOrder = [];

  cards.forEach(function(card, i) {
    const el = makeCardEl(card, { id: card.id });
    el.style.cursor = 'pointer';
    el.style.position = 'relative';

    const badge = document.createElement('div');
    badge.className = 'scry-badge hidden';
    el.appendChild(badge);

    el.addEventListener('click', function() {
      if (clickOrder.indexOf(i) !== -1) return;
      clickOrder.push(i);
      badge.textContent = clickOrder.length;
      badge.classList.remove('hidden');
      el.classList.add('selected');
      if (clickOrder.length === cards.length) confirmBtn.disabled = false;
    });
    container.appendChild(el);
  });

  confirmBtn.disabled = cards.length > 1;
  modal.classList.remove('hidden');
  confirmBtn.onclick = function() {
    modal.classList.add('hidden');
    const remaining = cards.map(function(_, i) { return i; })
      .filter(function(i) { return clickOrder.indexOf(i) === -1; });
    onCommit(clickOrder.concat(remaining));
  };
}

function showUpgradeTrashPrompt() {
  const el = document.getElementById('upgrade-msg');
  el.textContent = '廃棄するカードを手札から選んでください';
  el.classList.remove('hidden');
}

function showUpgradeGainPrompt(maxCost) {
  const el = document.getElementById('upgrade-msg');
  el.textContent = 'コスト ' + maxCost + ' 以下のカードをサプライから選んで獲得';
}

function hideUpgradeMsg() {
  document.getElementById('upgrade-msg').classList.add('hidden');
}

function showGameOver(game) {
  const overlay = document.getElementById('gameover-overlay');
  const title   = document.getElementById('gameover-title');
  const detail  = document.getElementById('gameover-detail');
  const pVP = game.countPlayerVP();
  const aVP = game.countAIVP();

  if (game.winner === 'player') {
    title.textContent = '✨ 世界の真理を解明！あなたの勝利！';
    title.className   = 'gameover-win';
  } else if (game.winner === 'ai') {
    title.textContent = '⚙️ AIが世界の真理を解明。AIの勝利。';
    title.className   = 'gameover-lose';
  } else {
    title.textContent = '🔮 引き分け。真理は等しく共有された。';
    title.className   = 'gameover-draw';
  }
  detail.textContent = 'あなた: ' + pVP + 'VP  /  AI: ' + aVP + 'VP';
  overlay.classList.remove('hidden');
}

function renderAll(game) {
  renderStatus(game);
  renderHand(game, onPlayCard);
  renderPlayArea(game);
  renderSupply(game, onBuyCard);
  renderLog(game);
  renderButtons(game);
  if (game.phase === PHASE.GAME_OVER) showGameOver(game);
}

// ─── メインロジック ──────────────────────────────────────
let game;
let upgradeWaitingGain = false;
let activeSupplyTab    = 'vp-treasure'; // モバイルのアクティブタブ

function onPlayCard(cardUid) {
  if (game.phase === PHASE.GAME_OVER) return;

  if (game.upgradeMode) {
    const result = game.selectUpgradeTrash(cardUid);
    if (!result.ok) return;
    upgradeWaitingGain = true;
    showUpgradeGainPrompt(result.maxCost);
    renderAll(game);
    return;
  }

  const result = game.playCard(cardUid);
  if (!result.ok) {
    if (result.msg) showToast(result.msg);
    return;
  }
  if (result.scry) {
    renderAll(game);
    showScryModal(result.cards, function(order) {
      game.commitScry(order);
      renderAll(game);
      checkAutoAdvance();
    });
    return;
  }
  if (result.upgrade) {
    showUpgradeTrashPrompt();
    renderAll(game);
    return;
  }
  renderAll(game);
  checkAutoAdvance();
}

function onBuyCard(cardId) {
  if (game.phase === PHASE.GAME_OVER) return;

  if (upgradeWaitingGain) {
    const result = game.selectUpgradeGain(cardId);
    if (!result.ok) {
      if (result.msg) showToast(result.msg);
      return;
    }
    upgradeWaitingGain = false;
    hideUpgradeMsg();
    renderAll(game);
    checkAutoAdvance();
    return;
  }

  const result = game.buyCard(cardId);
  if (!result.ok) {
    if (result.msg) showToast(result.msg);
    return;
  }
  renderAll(game);
  checkAutoAdvance();
}

function doEndTurn() {
  if (!game || game.phase !== PHASE.BUY) return;
  const result = game.endPlayerTurn();
  renderAll(game);
  if (result.gameOver) return;

  setTimeout(function() {
    runAITurn(game);
    const gameOver = game._checkGameOver();
    if (!gameOver) game.startPlayerTurn();
    renderAll(game);
    checkAutoAdvance();
  }, 700);
}

function checkAutoAdvance() {
  if (!game || game.phase === PHASE.GAME_OVER) return;
  if (game.upgradeMode || game.scryMode || game.upgradeMax > 0) return;

  if (game.phase === PHASE.ACTION) {
    const hasPlayable = game.actions > 0 &&
      game.player.hand.some(function(c) { return c.type === TYPE.ACTION; });
    if (!hasPlayable) {
      game.enterBuyPhase();
      renderAll(game);
      setTimeout(checkAutoAdvance, 0);
    }
    return;
  }

  if (game.phase === PHASE.BUY) {
    const canBuyAny = game.buys > 0 && Object.keys(game.supply).some(function(id) {
      return (game.supply[id] || 0) > 0 && CARD_DEFS[id] && CARD_DEFS[id].cost <= game.coins;
    });
    if (!canBuyAny) doEndTurn();
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  setTimeout(function() {
    toast.classList.remove('show');
    toast.classList.add('hidden');
  }, 2500);
}

function startGame() {
  generateCardDefs();
  game = new GameState();
  upgradeWaitingGain = false;
  document.getElementById('gameover-overlay').classList.add('hidden');
  game.startPlayerTurn();
  renderAll(game);
  checkAutoAdvance();
}

// ─── イベントリスナー ────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('btn-buy-phase').addEventListener('click', function() {
    if (game.phase !== PHASE.ACTION) return;
    game.enterBuyPhase();
    renderAll(game);
    checkAutoAdvance();
  });

  document.getElementById('btn-end-turn').addEventListener('click', doEndTurn);

  document.getElementById('btn-restart').addEventListener('click', startGame);

  // サプライタブ切り替え（モバイル用）
  var tabsEl = document.getElementById('supply-tabs');
  if (tabsEl) {
    tabsEl.addEventListener('click', function(e) {
      var btn = e.target.closest('.supply-tab');
      if (!btn) return;
      activeSupplyTab = btn.dataset.tab;
      document.querySelectorAll('.supply-tab').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      // モバイル行(.mobile-supply-row)とデスクトップセクション両方に対応
      document.querySelectorAll('#supply-cards [data-tab]').forEach(function(el) {
        el.classList.toggle('hidden-tab', el.dataset.tab !== activeSupplyTab);
      });
    });
  }

  startGame();
});
