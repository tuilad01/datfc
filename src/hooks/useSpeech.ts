const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function detectLang(text: string): string {
  return viRegex.test(text) ? 'vi-VN' : 'en-US';
}

export function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = detectLang(text);
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}
