// Emojis do opisywania w grze – łatwe do opisania
const MISSION_EMOJIS = [
    '🐺', '🐴', '😎', '🦊', '🐱', '👻', '🦁', '🐻', '🐼', '🐨',
    '🦄', '🐲', '🦅', '🐸', '🦉', '🐶', '🐹', '🦋', '🐢', '🦈',
    '🎭', '🌙', '☀️', '⭐', '🔥', '❄️', '🍕', '🎸', '🎮', '👑',
    '🦩', '🐙', '🦕', '🐳', '🦜', '🐝', '🦇', '🐿️', '🦒', '🐘'
];

function getRandomMissionEmoji() {
    return MISSION_EMOJIS[Math.floor(Math.random() * MISSION_EMOJIS.length)];
}
