import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PoliceFrame } from './components/PoliceFrame';
import { DialogueLayer } from './components/DialogueLayer';
import { useScriptPlayer } from './useScriptPlayer';
import { useARInteraction } from '../../lib/arInteraction';
import { getOrCreateScenarioSession } from '../../lib/session/ScenarioSessionFactory';
import { buildScenario03Script } from '../../data/scenario03Dialogues';
import { getScenario03Strings } from './i18n';
import { usePaceMultiplier } from '../../lib/scenario03Store';

// 撥打 165 查證 - the one call in this scenario the player is right to make.
//
// This branch used to resolve straight to the 成功反詐 ending: the player made
// the correct decision and never heard what 165 actually says. What the
// hotline tells a caller - that the case number is in no system, that the
// caller's number appears in no investigation, that the messages and transfer
// records must be kept - is the teaching the branch was missing, so it is
// played here, then the ending follows exactly as before.
//
// It plays through useScriptPlayer, like every other call screen, because the
// three 165 lines now have recordings of their own
// (public/assets/scenarios/scenario-03/audio/hotline/). An earlier version of
// this screen spoke them with the Web Speech API instead, which worked in a
// desktop browser and was silent on the glasses: Android's WebView does not
// implement `speechSynthesis` at all, and the fallback path quietly left the
// subtitles running with no voice. Nothing here decides timing or speed any
// more - the shared player ends each beat on its clip's own progress, and
// 快速節奏 reaches the recording through useScenarioAudio's playbackRate, so
// this call speeds up with the rest of the scenario and stays in sync.
export function Hotline165() {
  const navigate = useNavigate();
  const pace = usePaceMultiplier();
  const [session] = useState(() => getOrCreateScenarioSession());
  const t = getScenario03Strings();
  const script = useMemo(() => buildScenario03Script('hotline165', session), [session]);
  const player = useScriptPlayer(script, pace);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function toEnding() {
    player.stop();
    navigate('/scenario03-police/ending/success');
  }

  useARInteraction(player.done
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

        <DialogueLayer
          player={player}
          pace={pace}
          continueLabel={copy.continueLabel}
          onContinue={toEnding}
        />
      </div>
    </PoliceFrame>
  );
}
