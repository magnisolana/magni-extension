import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loader";
import { useToast } from "@/components/ui/use-toast";
import { shortenAddress } from "@/lib/utils";
import CropFreeIcon from "@mui/icons-material/CropFree";
import DoneIcon from "@mui/icons-material/Done";
import LanguageIcon from "@mui/icons-material/Language";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import QrCodeIcon from "@mui/icons-material/QrCode";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import * as web3 from "@solana/web3.js";
import { Scanner } from "@yudiel/react-qr-scanner";
import * as bip39 from "bip39";
import * as bs58 from "bs58";
import { derivePath } from "ed25519-hd-key";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import nacl from "tweetnacl";
import "./App.css";

function App() {
  const [address, setAddress] = useState("");
  const [logged, setLogged] = useState(false);

  const [appUrl, setAppUrl] = useState("");
  const [favicon, setFavicon] = useState("");
  const [appName, setAppName] = useState("");

  const [sending, setSending] = useState<boolean | null>(null);

  const [scan, setScan] = useState(false);

  const [transaction, setTransaction] = useState<string>("");
  const [txId, setTxId] = useState<string>("");

  const { toast } = useToast();

  function isValidSolanaAddress(address: string) {
    const solanaAddressRegex = /^([1-9A-HJ-NP-Za-km-z]{32,44})$/;
    return address && solanaAddressRegex.test(address);
  }

  const submit = async () => {
    if (!chrome) {
      toast({
        variant: "destructive",
        title: "Extension not supported.",
        description:
          "This extension is not supported in your browser. Try updating your browser to the latest version or trying another browser.",
      });
      return;
    }

    const valid = isValidSolanaAddress(address);

    if (!valid) {
      toast({
        variant: "destructive",
        title: "Invalid address.",
        description: "Please make sure you have entered SOL address correctly.",
      });
      return;
    }

    chrome?.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      const [tab] = tabs;
      chrome.tabs.sendMessage(tab.id!, { type: "connect", address });
      toast({
        variant: "default",
        title: `Connecting.`,
        description: `Connecting to ${appUrl} as ${shortenAddress(address)}`,
      });
      setLogged(true);
    });
  };

  const disconnect = () => {
    chrome?.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      const [tab] = tabs;
      chrome.tabs.sendMessage(tab.id!, { type: "disconnect" });

      toast({
        variant: "default",
        title: "Disconnected.",
        description: `Disconnected from ${appUrl}`,
      });

      setAddress("");
      setLogged(false);
    });
  };

  const getPrivateKey = async (phrase: string) => {
    const seed = await bip39.mnemonicToSeed(phrase);
    const seedBuffer = Buffer.from(seed).toString("hex");
    const path44Change = `m/44'/501'/0'/0'`;
    const derivedSeed = derivePath(path44Change, seedBuffer).key;

    return new web3.Account(nacl.sign.keyPair.fromSeed(derivedSeed).secretKey);
  };

  const signAndPublish = async (_sign: string) => {
    const privateKey = await getPrivateKey(
      "style danger object elegant pass miss certain diary give anchor kidney sport",
    );

    console.log(privateKey);

    const connection = new web3.Connection(
      "https://svc.blockdaemon.com/solana/mainnet/native?apiKey=mTWZ46f2YRFkCbSA3AwIRpCoksF2K81zjEVdaZHLsFBv50Uu",
      { commitment: "confirmed" },
    );

    const swapTransactionBuf = bs58.decode(transaction.replace("solana:", ""));
    const tx = web3.VersionedTransaction.deserialize(swapTransactionBuf);

    console.log(tx);

    // tx.addSignature(
    //   new PublicKey(address),
    //   bs58.decode(
    //     "3Q4ZuTgi4Hj8DJ8YAwY4Z1VKiZH2VfavLMELzkepwxzXUwYmbkDRG4X1jbBuNXJjoiFrdmG2hwhu8wHN7zUeLvvh",
    //   ),
    // );

    tx.sign([privateKey]);

    const txId = await connection.sendTransaction(tx);

    console.log(`txId: ${txId}`);

    setTxId(txId);
  };

  useEffect(() => {
    const tx58 = new URLSearchParams(location.search).get("tx");

    if (tx58) {
      const address = new URLSearchParams(location.search).get("address");

      setAddress(address || "");

      setTransaction(`solana:${tx58}`);
    }

    if (!chrome) {
      toast({
        variant: "destructive",
        title: "Extension not supported.",
        description:
          "This extension is not supported in your browser. Try updating your browser to the latest version or trying another browser.",
      });
    }

    chrome?.runtime?.onMessage?.addListener((message) => {
      switch (message.type) {
        case "login_status": {
          if (message.status) {
            setAddress(message.address);
            setLogged(true);
          }

          break;
        }
      }
    });

    chrome?.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      const [tab] = tabs;

      setAppName(tab.title!);
      setAppUrl(tab.url!);
      setFavicon(tab.favIconUrl!);

      chrome.tabs.sendMessage(tab.id!, { type: "login_status" });
    });
  }, []);

  return (
    <div
      className={"flex flex-col justify-center items-center"}
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      {!transaction ? (
        <>
          <div className={"flex flex-col items-center mb-3"}>
            {!favicon ? (
              <LanguageIcon sx={{ fontSize: 100, color: "#797979" }} />
            ) : (
              <img src={favicon} alt="icon" width="100" height="100" />
            )}
          </div>
          <div className={"flex flex-col items-center mb-3"}>
            <div className={"text-lg font-bold text-center"}>{appName}</div>
            <div
              className={"text-sm text-center"}
              style={{
                color: "#797979",
              }}
            >
              {appUrl && new URL(appUrl).origin}
            </div>
          </div>
          {!logged ? (
            <div className={"flex flex-col items-center p-3"}>
              <Input
                type={"address"}
                placeholder={"Enter Solana address"}
                className={"mb-3 w-72 text-center"}
                value={address}
                onChange={(e: any) => setAddress(e.currentTarget.value)}
              />
              <Button className={"w-40 flex items-center"} onClick={submit}>
                <VpnKeyIcon className={"mr-2"} />
                Connect
              </Button>
            </div>
          ) : (
            <div className={"flex flex-col items-center p-3"}>
              <h2 className={"mb-2"}>
                Connected as{" "}
                <span className={"text-blue-500"}>
                  {shortenAddress(address)}
                </span>
              </h2>
              <Button
                className={"w-40 flex items-center"}
                variant="destructive"
                onClick={disconnect}
              >
                <VpnKeyIcon className={"mr-2"} />
                Disconnect
              </Button>
            </div>
          )}
        </>
      ) : sending === null ? (
        <>
          <div className={"flex flex-col items-center p-4"}>
            <h2 className={"mb-6 text-base text-center flex flex-col"}>
              Sign a transaction using your phone.{" "}
              <span className={"text-sm"}>
                {!scan
                  ? `Scan this QR-code via your wallet-phone to sign the transaction.`
                  : `Scan QR-code from your wallet-phone via web-camera to send the transaction.`}
              </span>
            </h2>
            <div
              style={{
                border: "2px solid #c2c2c2",
                padding: 15,
                borderRadius: 10,
              }}
            >
              {!scan ? (
                <QRCode value={transaction} size={300} />
              ) : (
                <Scanner
                  onResult={(text, result) => {
                    console.log(text, result);

                    setSending(true);
                    signAndPublish(text)
                      .then(() => setSending(false))
                      .catch((e) => {
                        console.log(e);

                        toast({
                          variant: "destructive",
                          title: "Failed to sign transaction.",
                          description:
                            "Please make sure your QR code is valid and you have coins on your balance.",
                        });

                        setSending(null);
                      });
                  }}
                  onError={(error) => console.log(error?.message)}
                  styles={{
                    container: {
                      width: 300,
                      height: 300,
                    },
                    finderBorder: 10,
                  }}
                />
              )}
            </div>
          </div>
          <div className={"flex flex-col items-center mt-3"}>
            {!scan ? (
              <Button
                className={"flex items-center"}
                onClick={() => setScan(true)}
              >
                <CropFreeIcon className={"mr-2"} />
                Switch to scan
              </Button>
            ) : (
              <Button
                className={"flex items-center"}
                onClick={() => setScan(false)}
              >
                <QrCodeIcon className={"mr-2"} />
                Switch to QR-Code
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          {sending ? (
            <LoadingSpinner
              styles={{
                width: 50,
                height: 50,
                stroke: "#949494",
              }}
            />
          ) : (
            <>
              <div className={"flex flex-col items-center p-4"}>
                <h2 className={"mb-6 text-base text-center flex flex-col"}>
                  Success!{" "}
                  <span className={"text-sm"}>
                    Transaction was sent to the blockchain for execution.
                  </span>
                </h2>
                <div>
                  <DoneIcon className={"text-xl text-green-500"} />
                </div>
              </div>
              <div className={"flex items-center mt-3"}>
                <Button
                  variant={"secondary"}
                  className={"flex items-center mr-2"}
                  onClick={() => window.open(`https://solscan.io/tx/${txId}`)}
                >
                  <OpenInNewIcon />
                  Show on Solscan
                </Button>
                <Button
                  className={"flex items-center"}
                  onClick={() => window.close()}
                >
                  Done
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
