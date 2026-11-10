import { TrueFalseQuiz } from './TrueFalseQuiz';
import { useT } from './i18n';

// Screen 27 - 反詐小測驗. Reached after Ending.jsx's 詐騙疑點分析.
//
// Three 是/否 statements rather than the single two-option question the other
// four scenarios ask (components/ui/ScenarioFinalDecision.jsx): this
// scenario's acceptance sheet asks for three things to answer, and a
// statement is the only three-part shape that stays fully reachable on the
// glasses - LEFT is 是 and RIGHT is 否 on every one of them, where a
// three-OPTION question would have left its third answer to touch alone.
//
// The three are the three moves this run's seller actually made: the evidence
// the player should have kept, the "I agreed to the return" that was never a
// refund, and the off-platform settlement he pushed for. One 是 and two 否, so
// the pattern cannot be guessed.
//
// Rendered unwrapped (no blackpi app chrome/stage, which defaults to a light
// theme the quiz's own fixed-dark styling was never designed against) so this
// step looks the same across all five scenarios, then routes back to /ar-scan.
export function Quiz() {
  const t = useT();
  return (
    <TrueFalseQuiz
      t={t}
      statements={[
        {
          text: t('收到的商品與商品頁宣稱明顯不符時，應該先保存商品頁、開箱照片與對話紀錄。'),
          answer: true,
          explanation: t('商品圖片、規格與評價都可能被刻意包裝。紀錄是後續爭議處理唯一的依據，收到不對版的商品時要先保存，再透過平台正式機制申請退貨退款。'),
        },
        {
          text: t('賣家已經同意退貨，就表示退款一定會完成。'),
          answer: false,
          explanation: t('同意退貨不等於退款。本次情境裡賣家收到退貨後仍不斷以驗收、確認等理由拖延，最後失聯。退款未入帳前，爭議都還沒有結束。'),
        },
        {
          text: t('賣家說走平台外的管道退款比較快，依他的指示操作沒有問題。'),
          answer: false,
          explanation: t('平台外完成的付款或交易，平台通常無法退款或賠償。對方要求離開平台、私下協調或直接取消訂單，都是把保障拿掉的手法；疑似詐騙應保留證據並撥打 165 或報案。'),
        },
      ]}
    />
  );
}
