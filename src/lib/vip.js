// Shared VIP unlock status — a single 2100 FCFA payment unlocks BOTH the
// VIP ticket page and the official match predictions for the rest of the
// day. Both features check the same localStorage flag.

export function vipTodayKey() {
  return `kp_vip_unlocked_${new Date().toISOString().split("T")[0]}`;
}

export function isVipUnlockedToday() {
  return !!localStorage.getItem(vipTodayKey());
}

export function unlockVipToday() {
  localStorage.setItem(vipTodayKey(), "1");
}
