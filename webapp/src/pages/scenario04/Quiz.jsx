import { TrueFalseQuiz } from './TrueFalseQuiz';
import { useT } from './i18n';

// Screen 27 - 反詐小測驗. Reached after Ending.jsx's 詐騙疑點分析.
//
// One question with three options, each judged 是/否 - a 複選題 walked one
// option at a time (see TrueFalseQuiz.jsx for why it is walked rather than
// ticked as a set). The other four scenarios still ask the single two-option
// question in components/ui/ScenarioFinalDecision.jsx; this scenario's
// acceptance sheet asks for three options, so only this one differs.
//
// The three options are the three moves this run's seller actually made:
// the evidence the player should have kept, the "I agreed to the return"
// that was never a refund, and the off-platform settlement he pushed for.
// One 是 and two 否, so the pattern cannot be guessed.
//
// Rendered unwrapped (no blackpi app chrome/stage, which defaults to a light
// theme the quiz's own fixed-dark styling was never designed against) so this
// step looks the same across all five scenarios, then routes back to /ar-scan.
export function Quiz() {
  const t = useT();
  return (
    <TrueFalseQuiz
      t={t}
      question={t('收到的商品與商品頁宣稱明顯不符。下列每一個做法，正確嗎？')}
      options={[
        {
          text: t('先保存商品頁截圖、開箱照片與對話紀錄，再透過平台申請退貨退款。'),
          answer: true,
          explanation: t('商品圖片、規格與評價都可能被刻意包裝。紀錄是後續爭議處理唯一的依據，收到不對版的商品時要先保存，再透過平台正式機制申請退貨退款。'),
        },
        {
          text: t('賣家已經同意退貨，就可以放心等退款自動完成。'),
          answer: false,
          explanation: t('同意退貨不等於退款。本次情境裡賣家收到退貨後仍不斷以驗收、確認等理由拖延，最後失聯。退款未入帳前，爭議都還沒有結束。'),
        },
        {
          text: t('依賣家指示離開平台、用私下管道退款，這樣比較快。'),
          answer: false,
          explanation: t('平台外完成的付款或交易，平台通常無法退款或賠償。對方要求離開平台、私下協調或直接取消訂單，都是把保障拿掉的手法；疑似詐騙應保留證據並撥打 165 或報案。'),
        },
      ]}
    />
  );
}
