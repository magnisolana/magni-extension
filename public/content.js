let isSolflareRequested = false;

const commands = {
  connect: (address) => ({
    channel: "solflareIframeToWalletAdapter",
    data: {
      type: "event",
      event: {
        type: "connect",
        data: {
          publicKey: address,
          adapter: "extension",
        },
      },
    },
  }),
  collapse: {
    channel: "solflareIframeToWalletAdapter",
    data: {
      type: "event",
      event: {
        type: "collapse",
      },
    },
  },
  disconnect: {
    channel: "solflareIframeToWalletAdapter",
    data: {
      type: "event",
      event: {
        type: "disconnect",
      },
    },
  },
};

const storedAddress = localStorage.getItem("last-wallet-address");

const hostname = window.location.hostname;

const onLoad = () => {
  if (hostname === "connect.solflare.com") {
    window.addEventListener("message", (message) => {
      const { data } = message;

      if (data.data.method === "signTransaction") {
        const tx = data.data.params.transaction;

        chrome.runtime.sendMessage({
          type: "sign_transaction_bg",
          tx,
        });
      }
    });

    return;
  }

  if (storedAddress) {
    const interval = setInterval(() => {
      if (isSolflareRequested) {
        window.postMessage(commands.collapse);
        window.postMessage(commands.connect(storedAddress));

        clearInterval(interval);
      }
    }, 10);
  }
};

const connect = (address) => {
  localStorage.setItem("walletName", `"Solflare"`);
  localStorage.setItem("solflarePreferredWalletAdapter", "extension");

  localStorage.setItem("last-wallet-address", address);

  window.location.reload();
};

const disconnect = () => {
  window.postMessage(commands.disconnect);

  localStorage.removeItem("last-wallet-address");
  localStorage.removeItem("walletName");
  localStorage.removeItem("solflarePreferredWalletAdapter");
};

if (hostname !== "connect.solflare.com") {
  chrome.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      case "network": {
        isSolflareRequested = true;

        console.log(message);
        break;
      }
      case "connect": {
        connect(message.address);
        break;
      }
      case "disconnect": {
        disconnect();
        break;
      }
      case "login_status": {
        chrome.runtime.sendMessage({
          type: "login_status",
          status: isSolflareRequested,
          address: isSolflareRequested && storedAddress ? storedAddress : null,
        });
        break;
      }
    }
  });
}

onLoad();
