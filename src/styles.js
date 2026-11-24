/**
 * One stylesheet for both surfaces.
 *
 * Every colour is a host theme token, so the page follows the light and dark
 * appearance without a second palette. The class prefix keeps the selectors
 * out of the host's namespace.
 */

export const HEATMAP_CSS = `
.thm-page{display:flex;flex-direction:column;gap:16px;padding:8px 0;font-size:13px;line-height:22px;color:var(--dsw-alias-label-primary);}
.thm-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;}
.thm-head-text{display:flex;flex-direction:column;gap:2px;min-width:0;}
.thm-title{font-size:14px;font-weight:600;}
.thm-desc{font-size:12px;color:var(--dsw-alias-label-tertiary);}
.thm-btn{appearance:none;height:30px;min-width:72px;padding:0 12px;font-size:12px;line-height:20px;border:0.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer;font-family:inherit;white-space:nowrap;}
.thm-btn:hover{background:var(--dsw-alias-interactive-bg-hover);}
.thm-btn:disabled{opacity:.5;cursor:default;}
.thm-card{padding:12px 16px;border:0.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-settings-card-fill);}
.thm-card-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:10px;}
.thm-card-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);}
.thm-card-note{font-size:11px;color:var(--dsw-alias-label-tertiary);}
.thm-summary{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;}
.thm-total{display:flex;align-items:baseline;gap:6px;}
.thm-total-value{font-size:28px;font-weight:600;line-height:32px;letter-spacing:-0.5px;}
.thm-total-unit{font-size:12px;color:var(--dsw-alias-label-tertiary);}
.thm-rate{display:flex;flex-direction:column;gap:4px;min-width:180px;}
.thm-rate-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:11px;color:var(--dsw-alias-label-tertiary);}
.thm-rate-value{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary);}
.thm-bar{height:6px;border-radius:999px;background:color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent);overflow:hidden;}
.thm-bar-fill{height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary);}
.thm-months-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(152px,1fr));gap:16px 20px;}
.thm-month{display:flex;flex-direction:column;gap:5px;}
.thm-month-title{font-size:11px;color:var(--dsw-alias-label-secondary);}
.thm-switch{display:flex;align-items:center;justify-content:center;gap:10px;margin:2px 0 10px;}
.thm-switch-label{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);min-width:110px;text-align:center;}
.thm-step{appearance:none;width:26px;height:26px;line-height:22px;font-size:16px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,6px);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-family:inherit;}
.thm-step:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}
.thm-step:disabled{opacity:.35;cursor:default;}
.thm-columns{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:16px;align-items:start;}
.thm-heatmap-card{grid-column:1;grid-row:1;}
.thm-plans-card{grid-column:2;grid-row:1;}
.thm-models-card{grid-column:1/-1;grid-row:2;}
@media (max-width:760px){.thm-columns{grid-template-columns:minmax(0,1fr);}.thm-heatmap-card,.thm-plans-card,.thm-models-card{grid-column:1;grid-row:auto;}}
.thm-weekday-row,.thm-month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;max-width:300px;margin:0 auto;}
.thm-weekday{font-size:9px;line-height:10px;color:var(--dsw-alias-label-tertiary);text-align:center;}
.thm-cell{aspect-ratio:1/1;border-radius:3px;background:transparent;}
.thm-cell.empty{background:color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l1);}
.thm-cell.future{background:transparent;box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l1);opacity:.55;}
.thm-cell.today{box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary);}
.thm-cell.l1{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, transparent);}
.thm-cell.l2{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 48%, transparent);}
.thm-cell.l3{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 74%, transparent);}
.thm-cell.l4{background:var(--dsw-alias-brand-primary);}
.thm-pad{background:transparent;}
.thm-legend{display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:12px;font-size:10px;color:var(--dsw-alias-label-tertiary);}
.thm-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--dsw-alias-bg-layer-2);}
.thm-legend i.empty{background:color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l1);}
.thm-legend i.l1{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, transparent);}
.thm-legend i.l2{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 48%, transparent);}
.thm-legend i.l3{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 74%, transparent);}
.thm-legend i.l4{background:var(--dsw-alias-brand-primary);}
.thm-models{display:flex;flex-direction:column;}
.thm-model{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:0.5px solid var(--dsw-alias-border-l2);cursor:pointer;}
.thm-model:first-child{border-top:none;}
.thm-model:hover .thm-model-name{color:var(--dsw-alias-label-primary);}
.thm-model.is-active .thm-model-name{color:var(--dsw-alias-brand-primary);font-weight:600;}
.thm-dot{width:8px;height:8px;border-radius:50%;flex:none;background:var(--dsw-alias-brand-primary);}
.thm-model-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--dsw-alias-label-secondary);}
.thm-model-share{width:110px;height:6px;border-radius:999px;background:color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent);overflow:hidden;flex:none;}
.thm-model-share i{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary);}
.thm-model-tokens{flex:none;min-width:76px;text-align:right;font-size:12px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;}
.thm-stats{display:flex;gap:28px;flex-wrap:wrap;}
.thm-stat{display:flex;flex-direction:column;gap:2px;}
.thm-stat-label{font-size:11px;color:var(--dsw-alias-label-tertiary);}
.thm-stat-value{font-size:16px;font-weight:600;font-variant-numeric:tabular-nums;}
.thm-note{font-size:11px;color:var(--dsw-alias-label-tertiary);}
.thm-error{font-size:12px;color:var(--dsw-alias-state-error-primary);}
.thm-empty{padding:20px 4px;text-align:center;font-size:12px;color:var(--dsw-alias-label-tertiary);}
.thm-tip{position:fixed;z-index:60;padding:4px 8px;border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-bg-overlay);border:0.5px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);font-size:11px;line-height:16px;white-space:nowrap;pointer-events:none;box-shadow:var(--dsw-elevation-soft,0 2px 8px rgba(0,0,0,0.18));}
.thm-foot{display:flex;flex-direction:column;gap:8px;padding:4px 12px 10px;width:100%;}
.thm-foot-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;}
.thm-foot-label{font-size:11px;color:var(--dsw-alias-label-tertiary);}
.thm-foot-value{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;}
.thm-plans{display:flex;flex-direction:column;gap:6px;}
.thm-plan-select{position:relative;display:flex;flex-direction:column;gap:2px;}
.thm-plan-toggle{appearance:none;display:flex;align-items:center;justify-content:space-between;gap:6px;width:100%;padding:2px 4px;border:0.5px solid transparent;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;font-family:inherit;cursor:pointer;text-align:left;}
.thm-plan-toggle:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}
.thm-plan-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.thm-plan-caret{flex:none;font-size:9px;color:var(--dsw-alias-label-tertiary);}
.thm-plan-menu{display:flex;flex-direction:column;gap:1px;padding:2px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-bg-overlay);box-shadow:var(--dsw-elevation-soft,0 2px 8px rgba(0,0,0,0.18));}
.thm-plan-option{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;font-family:inherit;text-align:left;padding:3px 6px;border-radius:4px;cursor:pointer;}
.thm-plan-option:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}
.thm-plan-option.is-active{color:var(--dsw-alias-brand-primary);font-weight:600;}
.thm-window{display:flex;flex-direction:column;gap:2px;}
.thm-window-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;}
.thm-window-name{font-size:11px;color:var(--dsw-alias-label-secondary);}
.thm-window-value{font-size:11px;font-weight:600;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;flex:none;}
.thm-window-bar{height:4px;border-radius:999px;background:color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);overflow:hidden;}
.thm-window-bar i{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary);}
.thm-plan-note{font-size:10px;line-height:14px;color:var(--dsw-alias-label-tertiary);}
.thm-plan-list{display:flex;flex-direction:column;gap:10px;max-height:248px;overflow-y:auto;overflow-x:hidden;padding-right:2px;scrollbar-width:thin;}
.thm-plan-block{display:flex;flex-direction:column;gap:5px;padding-bottom:9px;border-bottom:0.5px solid var(--dsw-alias-border-l2);}
.thm-plan-block:last-child{padding-bottom:0;border-bottom:none;}
.thm-plan-block-name{font-size:11px;font-weight:600;color:var(--dsw-alias-label-primary);}
.thm-page :focus-visible,.thm-foot :focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:2px;}
`
