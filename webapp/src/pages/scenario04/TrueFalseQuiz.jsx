import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useARInteraction } from '../../lib/arInteraction';
import './trueFalseQuiz.css';

// 反詐小測驗, Scenario 04's form: ONE question, three options, and a 是/否
// judgement on each option - a 複選題 asked one option at a time.
//
// The question stem stays on screen the whole way through, including over
// the review, because every option is a candidate answer to that one
// question and none of them means anything read on its own. The three are
// NOT three separate quizzes.
//
// Why 是/否 per option rather than "tick the ones that are right": the AR
// Interaction Contract has exactly two gestures. A three-option question
// answered as a set would need a third action to submit, which no gesture
// can reach, so the third option would be pickable by touch alone. Walking
// the options one at a time keeps every answer on LEFT=是 / RIGHT=否 - the
// same mapping on every option, so it never moves under the player - and
// the geometry of this screen is unchanged from the two-option quiz the
// other four scenarios use (dual while a question is open, single once it
// is answered).
//
// Options are answered in order and never re-answered. Each one locks the
// moment it is taken AND shows its verdict and explanation right there -
// not held back to a summary at the end (AR4-20: 作答後選項立即鎖定並顯示
// 正解與解析). The answered options stay on screen as locked cards and the
// next option appears under them, so by the third the player has already
// read why the first two went the way they did. Nothing is stored.
//
// This costs no gesture: the feedback appears in place, so there is no
// "繼續" step between options and the geometry stays dual the whole way
// through the three, exactly as it was.
export function TrueFalseQuiz({
  t,
  question,
  options,
  backTo = '/ar-scan',
  onAnswer,
}) {
  // One entry per option, in order, holding what the player said.
  const [answers, setAnswers] = useState([]);
  const navigate = useNavigate();

  const index = answers.length;
  const done = index >= options.length;
  const current = done ? null : options[index];

  function answer(said) {
    if (done) return;
    const option = options[index];
    const next = [...answers, said];
    setAnswers(next);
    onAnswer?.(said === option.answer, next.length - 1);
  }

  // However many story actions the screen has, that is its geometry: 是/否
  // while an option is open, and the one 返回掃描 once all three are taken.
  useARInteraction(done
    ? {
      mode: 'single',
      surfaceId: 'shared/true-false-quiz-answered',
      action: () => navigate(backTo),
    }
    : {
      mode: 'dual',
      surfaceId: `shared/true-false-quiz/${index}`,
      left: () => answer(true),
      right: () => answer(false),
    });

  const correctCount = answers.filter((said, i) => said === options[i].answer).length;
  const optionLabel = (n) => t('選項 {n}').replace('{n}', String(n));

  return (
    <div className="tfq-shell">
      <div className="tfq-scroll">
        <div className="tfq-card">
          <h2>{t('反詐小測驗')}</h2>

          {/* The one question. Never unmounted - the options below are its
              answers, and the review under them is still answering it. */}
          <p className="tfq-question">{question}</p>

          {/* Every option already answered: locked, with its verdict and
              explanation. This list grows by one the instant the player
              answers, which is what "作答後選項立即鎖定並顯示正解與解析"
              asks for - the feedback is not held back to the end. */}
          {answers.length > 0 && (
            <ul className="tfq-review">
              {answers.map((said, i) => {
                const option = options[i];
                const right = said === option.answer;
                return (
                  <li key={option.text} className={`tfq-review-item${right ? ' is-ok' : ' is-no'}`}>
                    <p className="tfq-review-label">{optionLabel(i + 1)}</p>
                    <p className="tfq-review-statement">{option.text}</p>
                    <p className="tfq-review-verdict">
                      {right ? t('✅ 判斷正確') : t('❌ 判斷錯誤')}
                      {'　'}
                      {t('你的答案：{said}　正解：{answer}')
                        .replace('{said}', said ? t('是') : t('否'))
                        .replace('{answer}', option.answer ? t('是') : t('否'))}
                    </p>
                    <p className="tfq-review-why">{option.explanation}</p>
                  </li>
                );
              })}
            </ul>
          )}

          {!done && (
            <>
              <p className="tfq-progress">{t('選項 {n}，共 {total} 個')
                .replace('{n}', String(index + 1))
                .replace('{total}', String(options.length))}</p>
              <p className="tfq-statement">{current.text}</p>
              <div className="tfq-pair">
                <button type="button" className="tfq-answer" onClick={() => answer(true)}>
                  {t('是')}
                </button>
                <button type="button" className="tfq-answer" onClick={() => answer(false)}>
                  {t('否')}
                </button>
              </div>
            </>
          )}

          {done && (
            <p className="tfq-progress tfq-tally">{t('答對 {n} / {total} 個選項')
              .replace('{n}', String(correctCount))
              .replace('{total}', String(options.length))}</p>
          )}
        </div>
      </div>
      <Button to={backTo} className="tfq-back">{t('返回掃描')}</Button>
    </div>
  );
}
