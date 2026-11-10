import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PoliceFrame } from './components/PoliceFrame';
import { Subtitle } from './components/Subtitle';
import { useARInteraction } from '../../lib/arInteraction';
import { getOrCreateScenarioSession } from '../../lib/session/ScenarioSessionFactory';
import { buildScenario03Script } from '../../data/scenario03Dialogues';
import { getScenario03Lang, getScenario03Strings } from './i18n';
import { usePaceMultiplier } from '../../lib/scenario03Store';
import { isSoundEnabled } from '../../lib/feedback';

// 撥打 165 查證 - the one call in this scenario the player is right to make.
//
// This branch used to resolve straight to the 成功反詐 ending: the player made
// the correct decision and never heard what 165 actually says. What the
// hotline tells a caller - that the case number is in no system, that the
// caller's number appears in no investigation, that the messages and transfer
// records must be kept - is the teaching the branch was missing, so it is
// played here, then the ending follows exactly as before.
//
// Why the device speaks instead of a recording: the 18 clips under
// public/assets/scenarios/scenario-03/audio are the scam side's, and that
// README states they are the only voice source for this scenario. There is no
// 165 recording to use and inventing one is not this code's call. The lines
// are therefore spoken by the platform's own voice, with the subtitle driven
// by the same utterance so the two cannot drift apart. Register an `audioKey`
// on the three `hotline_165_*` entries in data/scenario03Dialogues.js once a
// real recording exists and buildDialogueBeats will serve it instead, with no
// change needed here.

const SPEECH_LANG = { zh: 'zh-TW', en: 'en-US', jp: 'ja-JP' };

// What a line costs to read aloud when the device cannot speak it. Same shape
// as useScriptPlayer's own fallback, so a muted or speech-less device still
// paces the subtitles like every other scene in this scenario.
function readingMs(text, pace) {
  const plain = (text ?? '').replace(/\*/g, '');
  return Math.max(900, Math.min(20000, 1100 + plain.length * 115) * pace);
}

function speechAvailable() {
  try {
    return typeof window !== 'undefined'
      && typeof window.speechSynthesis !== 'undefined'
      && typeof window.SpeechSynthesisUtterance !== 'undefined';
  } catch {
    return false;
  }
}

export function Hotline165() {
  const navigate = useNavigate();
  const pace = usePaceMultiplier();
  const [session] = useState(() => getOrCreateScenarioSession());
  const lang = getScenario03Lang();
  const t = getScenario03Strings();
  const script = useMemo(() => buildScenario03Script('hotline165', session), [session]);

  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const cancelledRef = useRef(false);

  const current = script[index] ?? null;
  const done = index >= script.length;

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // One effect owns the whole line: it speaks it, and it is what moves on.
  // Whichever way the line ends - the utterance finishing, the device
  // refusing to speak, or the fallback timer - only this effect advances, so
  // the voice and the subtitle can never be on different lines.
  useEffect(() => {
    if (!current) return undefined;
    cancelledRef.current = false;
    let timer = null;
    const advance = () => {
      if (cancelledRef.current) return;
      cancelledRef.current = true;
      setIndex((i) => i + 1);
    };

    const text = (current.text ?? '').replace(/\*/g, '');
    const canSpeak = isSoundEnabled() && speechAvailable() && text;

    if (canSpeak) {
      try {
        const u = new window.SpeechSynthesisUtterance(text);
        u.lang = SPEECH_LANG[lang] ?? SPEECH_LANG.zh;
        // 快速節奏 speeds the hotline up the same amount it speeds the
        // scammers up, so one setting governs the whole scenario.
        u.rate = Math.min(4, Math.max(0.5, 1 / pace));
        u.onend = advance;
        u.onerror = advance;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
        // A device that accepts the utterance and then never fires `onend`
        // would strand the scene, so a generous ceiling still moves it on.
        timer = window.setTimeout(advance, readingMs(text, pace) * 2.5);
      } catch {
        timer = window.setTimeout(advance, readingMs(text, pace));
      }
    } else {
      timer = window.setTimeout(advance, readingMs(text, pace));
    }

    return () => {
      cancelledRef.current = true;
      if (timer) window.clearTimeout(timer);
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // Nothing to cancel on a device that never spoke.
      }
    };
  }, [current, pace, lang]);

  // Leaving the call stops the voice - the same guarantee every other call
  // screen in this scenario gives (AR3-05's 切換頁面時語音應停止).
  useEffect(() => () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // Nothing to cancel.
    }
  }, []);

  function toEnding() {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // Nothing to cancel.
    }
    navigate('/scenario03-police/ending/success');
  }

  useARInteraction(done
    ? { mode: 'single', surfaceId: 'scenario03/hotline-165/continue', action: toEnding }
    : { mode: 'display', surfaceId: 'scenario03/hotline-165' });

  const copy = t.hotline165;

  return (
    <PoliceFrame stepKey="decision" dark statusTitle={copy.statusTitle}>
      <div className="pol-incall">
        <div className="pol-incall-head">
          <div className="pol-incall-name">{copy.hotlineName}</div>
          <div className="pol-incall-org">{copy.hotlineSubtitle}</div>
          <div className="pol-incall-timer">
            {`${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`}
          </div>
          <div className="pol-wave" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => <span key={i} style={{ '--i': i }} />)}
          </div>
        </div>

        <div className="pol-dialogue-layer">
          <Subtitle beat={current} />
          {done && (
            <button type="button" className="pol-cta" onClick={toEnding}>{copy.continueLabel}</button>
          )}
        </div>
      </div>
    </PoliceFrame>
  );
}
