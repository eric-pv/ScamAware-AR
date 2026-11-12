import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneShell } from '../../apps/mydondon';
import { BrowserChrome } from './components/BrowserChrome';
import { SuqubianSiteHeader } from './components/SuqubianSiteHeader';
import { useARInteraction } from '../../lib/arInteraction';
import { FAKE_TRADE_SITE_BRAND, FAKE_TRADE_SITE_DOMAIN } from '../../data/scenario05FakeSite';
import { useT } from './i18n';
import { paced } from '../../lib/experiencePace';

const PROCESSING_MS = 1200;

// Screen S09 - the ghost order reveals itself. The player lands here straight
// from the conversation once the real courier has really delivered the item:
// they go back to SafeDeal to collect what they're owed, and there is nothing
// to collect.
//
// This is the SAME page they already read before they shipped
// (SafeDealPaymentStatus.jsx - 收款狀態), which is the whole point. Back then
// every row was filled in: the buyer "聲稱已付款", the seller just needed to
// finish a verification. Now the identical page, at the identical address,
// answers 查無資料 to every one of those rows. Nothing was ever there; the
// rows the player trusted were the site telling them what they wanted to
// hear, and the site is still up to say so.
//
// An earlier version of this screen had the whole site stop resolving
// instead. That read well, but it taught the wrong lesson - it let the
// player conclude "the website disappeared" rather than "the website never
// had my money", and it did not match the acceptance sheet (AR5-A03:
// 確認 SafeDeal 款項頁顯示查無資料). A scam site that stays up and shrugs is
// also simply more common than one that vanishes.
//
// Nothing here states the word "scam"; the player is left to read the page
// for what it is before EndingScammed spells it out.
//
// Reference surface for the two simplest AR Interaction Contract geometries
// (lib/arInteraction), because this screen really is both in turn: the
// processing beat is genuinely a screen with nothing to do, and what follows
// it has exactly one story action. So it declares `display` while processing
// - no gesture does anything, and no button was added to give one something
// to do - and `single` afterwards, where RIGHT runs the same 繼續 handler
// the button already runs. Unchanged from the previous version of this
// screen: the geometry is the same two steps in the same order.
export function OrderGone() {
  const navigate = useNavigate();
  const t = useT();
  const [processing, setProcessing] = useState(true);

  const seeResult = () => navigate('/scenario05-atm/ending-scammed');

  useEffect(() => {
    const timer = setTimeout(() => setProcessing(false), paced(PROCESSING_MS));
    return () => clearTimeout(timer);
  }, []);

  useARInteraction(processing
    ? { mode: 'display', surfaceId: 'scenario05/order-gone-processing' }
    : { mode: 'single', surfaceId: 'scenario05/order-gone', action: seeResult });

  if (processing) {
    return (
      <PhoneShell context="bank">
        <div className="bk-processing">
          <span className="bk-spinner" />
          <p>{t('款項處理中')}</p>
        </div>
      </PhoneShell>
    );
  }

  const noData = t('查無資料');

  return (
    <PhoneShell context="hpefake">
      <BrowserChrome domain={FAKE_TRADE_SITE_DOMAIN} />
      <SuqubianSiteHeader section={t('收款狀態')} brand={FAKE_TRADE_SITE_BRAND} tag={t('安全交易・安心收付')} />
      <div className="go-scroll sq-page">
        {/* The same three rows SafeDealPaymentStatus.jsx fills in before the
            item ships. All three now answer 查無資料, which is the finding
            this screen exists to deliver. */}
        <div className="sq-field">
          <div className="sq-field-label">{t('交易編號')}</div>
          <div className="sq-field-value">{noData}</div>
        </div>
        <div className="sq-field">
          <div className="sq-field-label">{t('買方付款狀態')}</div>
          <div className="sq-field-value">{noData}</div>
        </div>
        <div className="sq-field">
          <div className="sq-field-label">{t('賣方收款狀態')}</div>
          <div className="sq-field-value strong">{noData}</div>
        </div>
        <section className="sq-card">
          <div className="sq-card-title">{t('系統提示')}</div>
          <p>{t('查無此筆款項資料。系統中沒有這筆交易的任何付款或收款紀錄。')}</p>
        </section>
        <div className="go-spacer" />
        <button type="button" className="sq-btn" onClick={seeResult}>
          {t('繼續')}
        </button>
      </div>
    </PhoneShell>
  );
}
