import { Link, useNavigate } from 'react-router-dom';
import { useARInteraction } from '../../lib/arInteraction';
import { outcomeStrings } from './outcomeStrings';
import { useFitToBox } from './useFitToBox';
import './FraudClueAnalysis.css';

// 詐騙疑點分析 - the second half of the Outcome System, and CIBAR's own
// educational UI for exactly the same reason ScenarioOutcome is: the
// simulation is over, so no Scenario App shell, PhoneShell, PoliceFrame or
// fake browser may appear here either.
//
// The page analyses the SCAM, not the player. There is no score, no
// 五項評估, no 個人化分析 and nothing folded behind an accordion: the clue
// list is read at once, and the single CTA continues into 反詐小測驗.
//
// The UI is shared; the content is not. Every Scenario owns its own clue
// list - short titles, an optional one-line note - plus an optional lede and
// closing line, all handed in already translated. The screen's own name and
// its CTA are the Outcome System's (see outcomeStrings.js), so they cannot
// drift per scenario.
//
// AR Interaction Contract (lib/arInteraction): declared here once, exactly
// like ScenarioOutcome above, so no Scenario repeats it. The geometry is
// `single` - 進行反詐小測驗 is the only story action on the page - and the
// gesture runs the same `onContinue` side effect and the same router push the
// <Link> below performs, in that order.
export function FraudClueAnalysis({
  scenarioId,
  lede = [],
  clues,
  // Optional three-part form, used only by scenario 04 (AR4-19 asks for a
  // 三段式教育解析 with a 證據選擇回顧). When given, these replace the flat
  // clue list; every other scenario passes `clues` and renders exactly as it
  // always has.
  //
  // Two levels, and nothing to operate: a section heading is the first
  // level, its clues or evidence rows the second. No disclosure, no toggle,
  // no state. An earlier version made each section a real <details> that
  // opened and closed; it is gone because nothing on this screen should
  // need operating to be read. Both gestures here are already spoken for
  // (LEFT 小測驗, RIGHT 體驗另一件商品), so anything hidden behind a control
  // is text the glasses can never reach - and the hierarchy alone is what
  // the structure was for.
  sections,
  summary,
  quizTo,
  onContinue,
  // An optional second way out, used only by scenario 04: that run has two
  // products and only one of them was lived through, so its analysis offers
  // "體驗另一件商品" beside the quiz. Every other scenario passes neither and
  // keeps exactly the one CTA it has always had.
  altTo,
  altLabel,
  onAlt,
}) {
  const strings = outcomeStrings();
  const ledeLines = Array.isArray(lede) ? lede : [lede];
  const navigate = useNavigate();
  const scrollRef = useFitToBox(scenarioId, clues?.length ?? sections?.length ?? 0, summary, ledeLines.join('\n'));

  // However many story actions the screen has, that is its geometry: one CTA
  // is `single`, two is `dual` in the order they are drawn - LEFT the quiz,
  // RIGHT the other product.
  const hasAlt = Boolean(altTo && altLabel);
  const goQuiz = () => { onContinue?.(); navigate(quizTo); };
  const goAlt = () => { onAlt?.(); navigate(altTo); };
  useARInteraction(hasAlt
    ? {
      mode: 'dual',
      surfaceId: 'shared/fraud-clue-analysis',
      left: goQuiz,
      right: goAlt,
    }
    : {
      mode: 'single',
      surfaceId: 'shared/fraud-clue-analysis',
      action: goQuiz,
    });

  return (
    <main className="cibar-analysis" data-analysis-scenario={scenarioId}>
      <div className="cibar-analysis-scroll" ref={scrollRef}>
        <h1 className="cibar-analysis-title">{strings.analysisTitle}</h1>
        {ledeLines.filter(Boolean).map((line) => (
          <p key={line} className="cibar-analysis-lede">{line}</p>
        ))}
        {!sections && (
          <ul className="cibar-analysis-clues">
            {clues.map(({ title, note }) => (
              <li key={title} className="cibar-analysis-clue">
                <h2>{title}</h2>
                {note && <p>{note}</p>}
              </li>
            ))}
          </ul>
        )}

        {sections?.map((section) => (
          <section key={section.id} className="cibar-analysis-section">
            <h2 className="cibar-analysis-section-title">{section.title}</h2>
            <div className="cibar-analysis-section-body">
              {section.lead && <p className="cibar-analysis-section-lead">{section.lead}</p>}

              {section.clues && (
                <ul className="cibar-analysis-clues">
                  {section.clues.map(({ title, note }) => (
                    <li key={title} className="cibar-analysis-clue">
                      <h2>{title}</h2>
                      {note && <p>{note}</p>}
                    </li>
                  ))}
                </ul>
              )}

              {/* 證據選擇回顧: what this run actually ended up holding. The
                  rows are the player's own doing, so they are reported, not
                  graded - a gap says what is missing and why it matters,
                  never that the player failed. */}
              {section.rows && (
                <ul className="cibar-analysis-evidence">
                  {section.rows.map(({ key, label, statusLabel, status }) => (
                    <li key={key} className={`cibar-analysis-evidence-row is-${status}`}>
                      <span className="cibar-analysis-evidence-label">{label}</span>
                      <span className="cibar-analysis-evidence-status">{statusLabel}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
        {summary && <p className="cibar-analysis-summary">{summary}</p>}
      </div>
      {/* Same rule as the outcome screen: the CTA is a sibling of the
          scroller, so it is reachable without scrolling first. */}
      <div className={`cibar-analysis-cta-bar${hasAlt ? ' has-alt' : ''}`}>
        <Link className="cibar-analysis-cta" to={quizTo} onClick={onContinue}>{strings.quizCta}</Link>
        {hasAlt && (
          <Link className="cibar-analysis-cta secondary" to={altTo} onClick={onAlt}>{altLabel}</Link>
        )}
      </div>
    </main>
  );
}
