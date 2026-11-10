import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useARInteraction } from '../../lib/arInteraction';
import './trueFalseQuiz.css';

// 反詐小測驗, three-statement form. Scenario 04's acceptance sheet asks for
// three things to answer instead of one, and a 是/否 statement is the only
// shape that keeps all of them reachable: the AR Interaction Contract has
// exactly two gestures, so a three-OPTION question would leave its third
// answer pickable by touch alone. Three 是/否 statements give the player nine
// gestures' worth of nothing-unreachable - LEFT is 是 and RIGHT is 否, every
// time, which is also the only mapping that does not move under them between
// statements.
//
// Statements are answered one at a time and never re-answered: each locks the
// moment it is taken, the next appears, and after the third the screen shows
// every statement back with its verdict and why. Nothing is scored out of
// three and no result is stored - this is the same teaching step as the
// two-option quiz, just asked three times (see ScenarioFinalDecision.jsx,
// which the other four scenarios still use unchanged).
export function TrueFalseQuiz({
  t,
  statements,
  backTo = '/ar-scan',
  onAnswer,
}) {
  // One entry per statement, in order, holding what the player said.
  const [answers, setAnswers] = useState([]);
  const navigate = useNavigate();

  const index = answers.length;
  const done = index >= statements.length;
  const current = done ? null : statements[index];

  function answer(said) {
    if (done) return;
    const statement = statements[index];
    const next = [...answers, said];
    setAnswers(next);
    onAnswer?.(said === statement.answer, next.length - 1);
  }

  // However many story actions the screen has, that is its geometry: 是/否
  // while a statement is open, and the one 返回掃描 once all three are taken.
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

  const correctCount = answers.filter((said, i) => said === statements[i].answer).length;

  return (
    <div className="tfq-shell">
      <div className="tfq-scroll">
        <div className="tfq-card">
          <h2>{t('反詐小測驗')}</h2>

          {!done && (
            <>
              <p className="tfq-progress">{t('第 {n} 題，共 {total} 題')
                .replace('{n}', String(index + 1))
                .replace('{total}', String(statements.length))}</p>
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
            <>
              <p className="tfq-progress">{t('答對 {n} / {total} 題')
                .replace('{n}', String(correctCount))
                .replace('{total}', String(statements.length))}</p>
              <ul className="tfq-review">
                {statements.map((statement, i) => {
                  const said = answers[i];
                  const right = said === statement.answer;
                  return (
                    <li key={statement.text} className={`tfq-review-item${right ? ' is-ok' : ' is-no'}`}>
                      <p className="tfq-review-statement">{statement.text}</p>
                      <p className="tfq-review-verdict">
                        {right ? t('✅ 判斷正確') : t('❌ 判斷錯誤')}
                        {'　'}
                        {t('你的答案：{said}　正解：{answer}')
                          .replace('{said}', said ? t('是') : t('否'))
                          .replace('{answer}', statement.answer ? t('是') : t('否'))}
                      </p>
                      <p className="tfq-review-why">{statement.explanation}</p>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
      <Button to={backTo} className="tfq-back">{t('返回掃描')}</Button>
    </div>
  );
}
