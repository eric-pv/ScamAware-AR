import { useParams } from 'react-router-dom';
import { FraudClueAnalysis } from '../../components/outcome/FraudClueAnalysis';
import { getShoppingState, resetShoppingRoute } from '../../lib/shoppingStore';
import { buildEvidenceInventory } from '../../data/scenarioConfig';
import { useT } from './i18n';

// Screen 26 - 詐騙疑點分析. The teaching page analyses the SCAM, not the
// player: no score, no five-dimension rating, no personalised "what you did
// well / badly" write-up, and nothing folded away behind an accordion. The
// player reaches this straight from the結局 and reads all four red flags at
// once, then goes to the quiz.
//
// The four flags are per-route because the player only ever lived through one
// of the two products, so the first flag names what THAT listing actually
// claimed. The last three are the same trap in both runs - the refund stall,
// the shop going dark, and the off-platform transaction - because that is
// literally the same scam either way.
//
// The flags themselves are unchanged; what changed is that they no longer
// render inside BlackPi's own app shell (`blackpi-app`, `bp-*`), which carried
// the simulation past the結局. They render through the shared
// FraudClueAnalysis, which is CIBAR's own UI.
const SIGNALS = {
  // `health` = the 智慧掃拖機器人 route (legacy internal key, see
  // data/products.js).
  health: [
    {
      title: '商品資訊與實際收到內容明顯不符',
      text: '商品頁宣稱為智慧掃拖機器人，但實際收到的卻是完全不同的清潔用品。',
    },
    {
      title: '賣家以退貨流程持續拖延退款',
      text: '同意退貨不代表退款已經完成。賣家在收到退貨後仍不斷以驗收、確認等理由拖延。',
    },
    {
      title: '賣家失聯或賣場停止營業',
      text: '退款尚未完成時，賣家突然無法聯絡、賣場停止營業，是非常明顯的警訊。',
    },
    {
      title: '平台外交易缺乏平台保障',
      text: '如果付款或交易是在平台外完成，平台通常無法直接退款或賠償。發現疑似詐騙時應保留證據並盡快聯絡 165 或報案。',
    },
  ],
  // `luckyBag` = the VEXA FLEX X1 route (legacy internal key, see
  // apps/blackpi/data/catalog.js).
  luckyBag: [
    {
      title: '遠低於原價的「限時優惠」可能只是誘餌',
      text: '遠低於原價的限時優惠，可能利用價格吸引消費者忽略商品真偽與賣家資訊。購買前先確認商品規格、賣家資訊與交易保障，並保存商品頁面及賣家承諾。',
    },
    {
      title: '賣家以退貨流程持續拖延退款',
      text: '同意退貨不代表退款已經完成。賣家在收到退貨後仍不斷以驗收、確認等理由拖延。',
    },
    {
      title: '賣家失聯或賣場停止營業',
      text: '退款尚未完成時，賣家突然無法聯絡、賣場停止營業，是非常明顯的警訊。',
    },
    {
      title: '平台外交易缺乏平台保障',
      text: '如果付款或交易是在平台外完成，平台通常無法直接退款或賠償。發現疑似詐騙時應保留證據並盡快聯絡 165 或報案。',
    },
  ],
};

// 第三段：下次怎麼辦. Not a scolding and not a checklist of things the
// player got wrong - the same three moves, stated as what to do next time,
// in the order a real dispute needs them.
const NEXT_STEPS = [
  {
    title: '先留紀錄，再跟對方談',
    text: '商品頁截圖、開箱照片、對話紀錄、付款與物流單據，在開口爭取之前就要先存下來。平台與警方能幫上忙的範圍，取決於你手上留下了什麼。',
  },
  {
    title: '退款沒入帳，爭議就還沒結束',
    text: '賣家同意退貨、商品已寄回、對方說「正在處理」，都不等於退款完成。以帳戶實際入帳為準，逾期就直接向平台申請介入，不要再等對方。',
  },
  {
    title: '任何要你離開平台的要求都要拒絕',
    text: '私下匯款、改用其他通訊軟體、直接取消訂單再補款，都是把平台保障拿掉。只要對方開始引導你離開平台，就保留證據並撥打 165。',
  },
];

export function Ending() {
  const { route } = useParams();
  const t = useT();
  const signals = SIGNALS[route] || SIGNALS.health;

  // 證據選擇回顧 (AR4-19). buildEvidenceInventory reads what this run
  // actually ended up holding - the photos the player kept, the return they
  // filed, the receipt they chased - so the section reports the player's own
  // choices rather than a fixed list. Read once at render: the run is over
  // by the time this screen exists, so nothing here can change under it.
  const evidence = buildEvidenceInventory(getShoppingState());

  return (
    <FraudClueAnalysis
      scenarioId="package"
      // 三段式：這次的疑點 → 你留下了什麼 → 下次怎麼辦。
      sections={[
        {
          id: 'clues',
          title: t('一、這次的詐騙疑點'),
          clues: signals.map(({ title, text }) => ({ title: t(title), note: t(text) })),
        },
        {
          id: 'evidence',
          title: t('二、證據選擇回顧'),
          lead: t('以下是你在這次體驗中實際留下的紀錄。爭議能不能處理，取決於這幾項。'),
          rows: evidence.map((row) => ({
            ...row,
            label: t(row.label),
            statusLabel: t(row.statusLabel),
          })),
        },
        {
          id: 'next',
          title: t('三、下次該怎麼做'),
          clues: NEXT_STEPS.map(({ title, text }) => ({ title: t(title), note: t(text) })),
        },
      ]}
      quizTo="/scenario04-shopping/quiz"
      // The route is banked either way: `resetShoppingRoute` marks the product
      // just played as completed and clears the run, so the other product is
      // what a restart lands on.
      onContinue={resetShoppingRoute}
      // 體驗另一件商品: this scenario is the only one with two products, and a
      // visitor only ever lives through one of them. The second exit restarts
      // the shopping flow at the simulated phone so the next run picks up the
      // product this one did not.
      altTo="/scenario04-shopping/phone-home"
      altLabel={t('體驗另一件商品')}
      onAlt={resetShoppingRoute}
    />
  );
}
