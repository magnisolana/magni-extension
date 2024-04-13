const state = {
  hostname: window.location.hostname,
  isSolflareRequested: false,
  storedAddress: localStorage.getItem("last-wallet-address"),
  clearOnAuth: localStorage.getItem("clearOnAuth") === "true",
};

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

const onLoad = () => {
  if (state.hostname === "connect.solflare.com") {
    window.addEventListener("message", (message) => {
      const { data } = message;

      if (data.data.method === "signTransaction") {
        const tx = data.data.params.transaction;

        chrome.runtime.sendMessage({
          type: "sign_transaction_bg",
          address: state.storedAddress,
          tx,
        });
      }
    });

    return;
  }

  if (state.storedAddress) {
    const interval = setInterval(() => {
      if (state.isSolflareRequested) {
        window.postMessage(commands.collapse);
        window.postMessage(commands.connect(state.storedAddress));

        if (state.clearOnAuth) {
          localStorage.removeItem("clearOnAuth");
          localStorage.removeItem("last-wallet-address");
          localStorage.removeItem("walletName");
          localStorage.removeItem("solflarePreferredWalletAdapter");
        }

        clearInterval(interval);
      }
    }, 10);
  }
};

const connect = (address, loginAutomatically) => {
  if (!loginAutomatically) {
    localStorage.setItem("clearOnAuth", "true");
  }

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

if (state.hostname !== "connect.solflare.com") {
  chrome.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      case "network": {
        state.isSolflareRequested = true;

        console.log(message);
        break;
      }
      case "connect": {
        connect(message.address, message.loginAutomatically);
        break;
      }
      case "disconnect": {
        disconnect();
        break;
      }
      case "login_status": {
        chrome.runtime.sendMessage({
          type: "login_status",
          status: state.isSolflareRequested,
          address:
            state.isSolflareRequested && state.storedAddress
              ? state.storedAddress
              : null,
        });
        break;
      }
    }
  });
}

onLoad();
