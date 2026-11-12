import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, EllipsisVertical, Lock } from 'lucide-react';
import { PoliceFrame } from './components/PoliceFrame';
import { DialogueLayer } from './components/DialogueLayer';
import { OngoingCallIndicator } from './components/OngoingCallIndicator';
import { useScriptPlayer } from './useScriptPlayer';
import { getOrCreateScenarioSession } from '../../lib/session/ScenarioSessionFactory';
import { buildScenario03Script } from '../../data/scenario03Dialogues';
import { addWarningFlags, getScenario03State, updateScenario03State } from '../../lib/scenario03Store';
import { usePaceMultiplier } from '../../lib/experiencePace';
import { playSound } from '../../lib/scenario03Feedback';
import { BALANCE_PARTIAL, BALANCE_TOTAL, formatNT } from '../../data/scenario03Config';
import { getScenario03Strings } from './i18n';
import { FraudWarningBanner } from '../../components/warnings/FraudWarningBanner';
import { useARInteraction } from '../../lib/arInteraction';

// Scene 10 - 好匯銀行 HOWEI BANK, a WEBSITE the player opened from a link in
// LINE. Not an app on their phone: they never installed it, never had an
// account with it, and the only reason they are looking at it is that the
// "investigating officer" sent them the address a moment ago. The browser
// chrome above the page is what says so - one back arrow, the address, one
// menu dot-column, all inert, exactly like the browser chrome Scenario 05
// draws over its own fake site. It is deliberately plain: a full Safari or
// Chrome simulation would pull attention onto the browser and away from the
// page, and the page is the thing being learned.
//
// The site itself says nothing about the police, the case, an investigation
// or "following instructions". A real bank has no idea its customer is on
// the phone with someone, and a fake bank that admits it does gives itself
// away for free - so every "do as you are told" line in this scene belongs
// to the officer in LINE and on the call, and the page carries only what an
// online bank carries: sign in, balance, transfer, confirm.
//
// The transfer form offers both amounts the player might reach for - 部分金額
// and 全部餘額 - because "can I just send some of it?" is the thing a
// hesitating victim actually tries, and because the scam's answer to it is
// the lesson. The caller does not take a part: he refuses it on the spot,
// in procedural language, and demands the whole balance.
//
// What this must NOT be, and an earlier build was: an amount that silently
// rewrites itself into the full balance a moment after the player picks the
// smaller one. The rewrite is the scam's move, so the scam makes it out
// loud, on its own screen (`pressure`), and the player is the one who acts
// on it. Both paths then meet on the same confirm screen moving the same
// BALANCE_TOTAL - which is what the caller was always going to take.
const STAGES = ['login', 'overview', 'transfer', 'pressure', 'confirm'];

export function BankSite() {
  const navigate = useNavigate();
  const [session] = useState(() => getOrCreateScenarioSession());
  const initialState = useRef(getScenario03State()).current;
  // A run that was already inside the site keeps its place; anything else
  // (a fresh run, a stale value from an older build's flow) starts at the
  // page the link actually opens - the sign-in page.
  const [stage, setStage] = useState(
    STAGES.includes(initialState.bankStage) ? initialState.bankStage : 'login',
  );
  const [amount, setAmount] = useState(initialState.bankAmount ?? null);
  const pace = usePaceMultiplier();

  useEffect(() => {
    if (stage === 'transfer') addWarningFlags('entered_bank_app');
  }, [stage]);

  // police_bank_guide: the officer talks the player through the transfer form
  // itself ("照畫面上的資料操作"), so it is gated on the transfer stage - the
  // first screen where the prefilled recipient account and amount are
  // actually visible - rather than on merely reaching the site. His voice is
  // where that instruction belongs; the page never repeats it.
  const guideScript = useMemo(() => buildScenario03Script('bankGuide', session), [session]);
  const guidePlayer = useScriptPlayer(guideScript, pace, stage === 'transfer');

  // The refusal of 部分金額. Text-only (see bank_amount_pressure in
  // data/scenario03Dialogues.js for why it carries no recording), gated on
  // the pressure stage so it starts when the player picks the smaller
  // amount and not before.
  const pressureScript = useMemo(() => buildScenario03Script('bankPressure', session), [session]);
  const pressurePlayer = useScriptPlayer(pressureScript, pace, stage === 'pressure');

  const t = getScenario03Strings();

  function persistBankProgress(patch) {
    updateScenario03State(patch);
  }

  function signIn() {
    playSound('click');
    setStage('overview');
    persistBankProgress({ bankStage: 'overview' });
  }

  function goTransfer() {
    playSound('click');
    setStage('transfer');
    persistBankProgress({ bankStage: 'transfer' });
  }

  // 部分金額: the player's own choice, kept exactly as chosen and shown back
  // to them on the next screen next to what the caller demands instead. The
  // run is NOT yet flagged full_balance_transfer here - at this point the
  // player has not agreed to send everything.
  function choosePartial() {
    playSound('click');
    addWarningFlags('pressured_to_full_amount');
    setAmount(BALANCE_PARTIAL);
    setStage('pressure');
    persistBankProgress({ bankStage: 'pressure', bankAmount: BALANCE_PARTIAL });
  }

  // The one amount this transfer ever actually moves. Reached either
  // straight from the form (全部餘額) or from the pressure screen, and
  // identical both ways: the confirm page, the ending's 轉入所謂「監管帳戶」
  // 金額 and transferAmount all read the same BALANCE_TOTAL, so no screen
  // can quote a figure the player never chose.
  function toConfirm() {
    playSound('click');
    addWarningFlags('full_balance_transfer');
    setAmount(BALANCE_TOTAL);
    setStage('confirm');
    persistBankProgress({ bankStage: 'confirm', bankAmount: BALANCE_TOTAL });
  }

  function toFinal() {
    playSound('click');
    updateScenario03State({ transferAmount: BALANCE_TOTAL });
    navigate('/scenario03-police/final');
  }

  // AR Interaction Contract: every stage is one action - 登入, 轉帳,
  // 改為全部餘額並繼續, 確認交易 - except the transfer form, which is the
  // one place the player picks between two amounts and is therefore `dual`.
  // LEFT is 部分金額 and RIGHT is 全部餘額, in the order the two buttons are
  // drawn, and matching the rest of the app's left-is-the-safer-answer
  // geometry: neither amount escapes the scam, but only one of them hands
  // over everything on the first move. The officer's guide recording plays
  // over the form on its own and never asks the player anything, so it does
  // not change the geometry.
  useARInteraction(stage === 'transfer'
    ? {
      mode: 'dual',
      surfaceId: 'scenario03/bank/transfer',
      left: choosePartial,
      right: toConfirm,
    }
    : {
      mode: 'single',
      surfaceId: `scenario03/bank/${stage}`,
      action: stage === 'login'
        ? signIn
        : stage === 'overview'
          ? goTransfer
          : stage === 'pressure'
            ? toConfirm
            : toFinal,
    });

  // The browser the page is being viewed in. Display-only on purpose: the
  // back arrow and the menu are chrome the player recognises, not controls
  // this simulation implements, so neither is focusable or clickable.
  const browserChrome = (
    <div className="pol-web-chrome">
      <span className="pol-web-chrome-icon" aria-hidden="true"><ChevronLeft size={18} /></span>
      <span className="pol-web-omnibox">
        <Lock size={11} aria-hidden="true" />
        <span className="pol-web-domain">{t.bank.domain}</span>
      </span>
      <span className="pol-web-chrome-icon" aria-hidden="true"><EllipsisVertical size={16} /></span>
    </div>
  );

  if (stage === 'login') {
    return (
      <PoliceFrame stepKey="bank" dark statusTitle={t.bank.statusTitleLogin}>
        <div className="pol-web pol-web-dark">
          {browserChrome}
          <OngoingCallIndicator />
          <div className="pol-bank-login">
            <div className="pol-bank-login-brand">
              <strong>{t.bank.brand}</strong>
              {t.bank.brandLatin !== t.bank.brand && <span>{t.bank.brandLatin}</span>}
            </div>
            <p className="pol-bank-login-title">{t.bank.loginTitle}</p>
            <div className="pol-bank-field">
              <span>{t.bank.loginIdLabel}</span>
              <input value={session.maskedBankAccount} disabled readOnly />
            </div>
            <div className="pol-bank-field">
              <span>{t.bank.loginPasswordLabel}</span>
              <input value="••••••••" disabled readOnly />
            </div>
            <button type="button" className="pol-cta" onClick={signIn}>{t.bank.enterAccount}</button>
          </div>
        </div>
      </PoliceFrame>
    );
  }

  return (
    <PoliceFrame stepKey="bank" statusTitle={t.bank.statusTitleApp}>
      <FraudWarningBanner active={stage === 'confirm'} theme="phone" severity="block" title={t.bank.warningTitle} body={t.bank.warnBox} duration={7000} placement="above-footer" />
      {stage === 'transfer' && <DialogueLayer player={guidePlayer} />}
      {stage === 'pressure' && <DialogueLayer player={pressurePlayer} />}
      <div className="pol-web">
        {browserChrome}
        <div className="pol-bank">
          <OngoingCallIndicator />
          <header className="pol-bank-header">
            <div className="pol-bank-brand">
              {t.bank.brand}
              {t.bank.brandLatin !== t.bank.brand && <em>{t.bank.brandLatin}</em>}
            </div>
            <div className="pol-bank-sub">{t.bank.subGreeting(session.maskedBankAccount)}</div>
          </header>

          <div className="pol-bank-body">

            {stage === 'overview' && (
              <>
                <section className="pol-bank-balance">
                  <div className="label">{t.bank.balanceLabel}</div>
                  <div className="amount">{formatNT(BALANCE_TOTAL)}</div>
                  <div className="pol-bank-row"><span>{t.bank.rowSalary}</span><span>+ NT$ 48,000</span></div>
                  <div className="pol-bank-row"><span>{t.bank.rowRent}</span><span>- NT$ 18,000</span></div>
                  <div className="pol-bank-row"><span>{t.bank.rowCard}</span><span>- NT$ 6,420</span></div>
                </section>
                <button type="button" className="pol-cta" onClick={goTransfer}>{t.bank.goTransfer}</button>
              </>
            )}

            {stage === 'transfer' && (
              <>
                <section className="pol-card">
                  <h3>{t.bank.transferCardHeader}</h3>
                  <dl className="pol-kv">
                    <dt>{t.bank.fromAccountLabel}</dt><dd>{session.maskedBankAccount}</dd>
                    <dt>{t.bank.availableBalanceLabel}</dt><dd>{formatNT(BALANCE_TOTAL)}</dd>
                    <dt>{t.bank.toBankLabel}</dt><dd>{t.bank.brand}</dd>
                    <dt>{t.bank.toAccountLabel}</dt><dd>{session.fakeBankAccount}</dd>
                    <dt>{t.bank.accountNameLabel}</dt><dd>{t.bank.accountNameValue}</dd>
                    <dt>{t.bank.noteLabel}</dt><dd>{t.bank.noteValue(session.caseNumber)}</dd>
                  </dl>
                </section>

                {/* AR3-16. Two amounts, drawn LEFT then RIGHT to match the
                    dual gesture declared above. The smaller one is a real
                    choice with a real consequence - it is refused on the
                    next screen - not a decoy that rewrites itself. */}
                <div className="pol-bank-field">
                  <span>{t.bank.amountSectionLabel}</span>
                </div>
                <div className="pol-bank-amounts">
                  <button type="button" className="pol-bank-amount" onClick={choosePartial}>
                    <span className="pol-bank-amount-label">{t.bank.amountPartial}</span>
                    <span className="pol-bank-amount-value">{formatNT(BALANCE_PARTIAL)}</span>
                  </button>
                  <button type="button" className="pol-bank-amount is-full" onClick={toConfirm}>
                    <span className="pol-bank-amount-label">{t.bank.amountFull}</span>
                    <span className="pol-bank-amount-value">{formatNT(BALANCE_TOTAL)}</span>
                  </button>
                </div>
              </>
            )}

            {stage === 'pressure' && (
              <>
                <section className="pol-card">
                  <h3>{t.bank.pressureHeader}</h3>
                  <dl className="pol-kv">
                    <dt>{t.bank.pressureFromLabel}</dt>
                    <dd className="pol-bank-amount-rejected">{formatNT(amount ?? BALANCE_PARTIAL)}</dd>
                    <dt>{t.bank.pressureToLabel}</dt>
                    <dd style={{ fontSize: 'var(--fs-title-sm)' }}>{formatNT(BALANCE_TOTAL)}</dd>
                    <dt>{t.bank.toAccountLabel}</dt><dd>{session.fakeBankAccount}</dd>
                    <dt>{t.bank.accountNameLabel}</dt><dd>{t.bank.accountNameValue}</dd>
                  </dl>
                </section>
                <button type="button" className="pol-cta" onClick={toConfirm}>{t.bank.pressureCta}</button>
              </>
            )}

            {stage === 'confirm' && (
              <>
                <section className="pol-card">
                  <h3>{t.bank.confirmHeader}</h3>
                  <dl className="pol-kv">
                    <dt>{t.bank.fromAccountLabel}</dt><dd>{session.maskedBankAccount}</dd>
                    <dt>{t.bank.toAccountLabel}</dt><dd>{session.fakeBankAccount}</dd>
                    <dt>{t.bank.accountNameLabel}</dt><dd>{t.bank.accountNameValue}</dd>
                    <dt>{t.bank.transferAmountLabel}</dt><dd style={{ fontSize: 'var(--fs-title-sm)' }}>{formatNT(amount ?? BALANCE_TOTAL)}</dd>
                    <dt>{t.bank.afterBalanceLabel}</dt><dd>{t.bank.afterBalanceValue}</dd>
                  </dl>
                </section>
                <button type="button" className="pol-cta pol-cta-danger" onClick={toFinal}>{t.bank.next}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </PoliceFrame>
  );
}
