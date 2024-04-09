const send = (message) => {
  const tryRequest = (success) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const [tab] = tabs;

      if (tab && tab.status === "complete") {
        chrome.tabs.sendMessage(tab.id, message, () => {});
        success();
      }
    });
  };

  const interval = setInterval(() => {
    tryRequest(() => clearInterval(interval));
  }, 10);
};

chrome.webRequest.onBeforeRequest.addListener(
  (msg) => {
    send({ type: "network", data: msg });

    return {
      cancel: false,
    };
  },
  {
    urls: ["*://connect.solflare.com/*"],
  },
  ["blocking"],
);

chrome?.runtime?.onMessage?.addListener((message) => {
  switch (message.type) {
    case "sign_transaction_bg":
      {
        chrome.windows.create({
          url: chrome.runtime.getURL(`index.html?tx=${message.tx}`),
          top: message.top,
          left: message.left,
          type: "popup",
          width: 420,
          height: 600,
        });
      }
      break;
  }
});
