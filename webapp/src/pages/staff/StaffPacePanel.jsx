import { FAST_PACE_MULTIPLIER, setPace, usePace } from '../../lib/scenario03Store';

// 體驗節奏 - part of 工作人員管理模式 and nowhere else, for the same reason the
// other panels here are (see StaffVersionPanel.jsx): the player never chooses
// how fast the scam talks to them.
//
// It exists for 假檢警 only. That is the one scenario carried by recorded
// voice: a full run of it is several minutes of a caller the visitor cannot
// hurry, which is right for a visitor and wrong for a demo, an inspection or
// a training walkthrough with ten people waiting. 快速 plays every beat at
// FAST_PACE_MULTIPLIER of its normal length - the recording itself is sped up
// (useScenarioAudio), not the subtitles alone - so the voice and the subtitle
// stay locked together and no line is cut. Nothing is skipped: the same
// script, the same choices, the same endings, just faster.
//
// The setting is the venue's, not the run's: it is saved and survives the
// reset every scenario entry does, so staff set it once and hand the device
// over. See the comment on PACE_KEY in lib/scenario03Store.js.
const OPTIONS = [
  {
    id: 'normal',
    label: '正常',
    hint: '依錄音原速播放，給一般參觀者使用。',
  },
  {
    id: 'fast',
    label: '快速',
    hint: `語音與字幕同步加快為 ${Math.round((1 / FAST_PACE_MULTIPLIER) * 100) / 100}×，內容不減，供展示與教育訓練使用。`,
  },
];

export function StaffPacePanel() {
  const pace = usePace();

  return (
    <div className="staff-card">
      <h2>體驗節奏（假檢警情境）</h2>
      <p className="mini">
        只影響「權威陷阱／假檢警」情境的語音與字幕速度，其他四個情境不受影響。
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
