import { getHashNum } from "./helpers.js";

export const avatars = [
  "👺",
  "🤡",
  "💩",
  "👽",
  "👾",
  "🤖",
  "🎃",
  "😺",
  "😈",
  "🤠",
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🦊",
  "🐻",
  "🐍",
  "🐻‍❄️",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
  "🐷",
  "🐽",
  "🐸",
  "🐵",
  "🐙",
  "🦀",
  "🐢",
  "🐼",
  "🦄",
  "🐝",
  "🌚",
  "🌝",
];

export function getAvatarForUid(uid) {
  const avatarId = getHashNum(uid, avatars.length);
  return avatars[avatarId];
}
