// Cuando se hace clic en el icono de la extensión...
chrome.action.onClicked.addListener((tab) => {
  // ...abre una pestaña nueva con nuestra App profesional
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
});