import { FAST_PACE_MULTIPLIER, setPace, usePace } from '../../lib/experiencePace';

// 體驗節奏 - part of 工作人員管理模式 and nowhere else, for the same reason the
// other panels here are (see StaffVersionPanel.jsx): the player never chooses
// how fast the scam talks to them.
//
// It covers every scenario: 快速 plays every story beat - a message arriving,
// a typing indicator, a pause, an automatic step - at FAST_PACE_MULTIPLIER of
// its normal length (lib/experiencePace.js). In 假檢警 the recording itself is
// sped up with its subtitles, so the voice stays locked to the text. Nothing is
// skipped; videos and the time a player has to answer are not touched. The
// setting is the venue's, saved across runs and restarts: set it once and hand
// the device over.
const OPTIONS = [
  {
    id: 'normal',
    label: '正常',
    hint: '對話與語音依原本速度，給一般參觀者使用。',
  },
  {
    id: 'fast',
    label: '快速',
    hint: `五個情境的對話文字（假檢警的語音也一起）加快為 ${Math.round((1 / FAST_PACE_MULTIPLIER) * 100) / 100}×，內容不減；影片與作答時間不變。供展示與教育訓練使用。`,
  },
];

export function StaffPacePanel() {
  const pace = usePace();

  return (
    <div className="staff-card">
      <h2>體驗節奏</h2>
      <p className="mini">
        五個情境的對話速度一起調整。
      </p>

      <div className="staff-btn-row staff-pace-row">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`btn${pace === opt.id ? '' : ' secondary'}`}
            aria-pressed={pace === opt.id}
            onClick={() => setPace(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <p className="mini staff-pace-hint">
        {OPTIONS.find((o) => o.id === pace)?.hint}
      </p>
      <p className="mini">
        目前節奏：<strong>{pace === 'fast' ? '快速' : '正常'}</strong>
        ；設定會保留到下次更改，下一輪體驗即生效。
      </p>
    </div>
  );
}
