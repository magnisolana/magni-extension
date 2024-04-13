import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { shortenAddress } from "@/lib/utils";
import LanguageIcon from "@mui/icons-material/Language";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";

export const Connect: FC<{
  address: string;
  setAddress: Dispatch<SetStateAction<string>>;
}> = ({ address, setAddress }) => {
  const [logged, setLogged] = useState(false);
  const [appUrl, setAppUrl] = useState("");
  const [favicon, setFavicon] = useState("");
  const [appName, setAppName] = useState("");
  const [loginAutomatically, setLoginAutomatically] = useState(false);

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
      chrome.tabs.sendMessage(tab.id!, {
        type: "connect",
        address,
        loginAutomatically,
      });
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

  useEffect(() => {
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
            className={"w-72 text-center"}
            value={address}
            onChange={(e: any) => setAddress(e.currentTarget.value)}
          />
          <div className={"flex items-center space-x-2 mt-5 mb-5"}>
            <Checkbox
              id="terms"
              onCheckedChange={() => setLoginAutomatically((x) => !x)}
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Connect automatically
            </label>
          </div>
          <Button className={"w-40 flex items-center"} onClick={submit}>
            <VpnKeyIcon className={"mr-2"} />
            Connect
          </Button>
        </div>
      ) : (
        <div className={"flex flex-col items-center p-3"}>
          <h2 className={"mb-2"}>
            Connected as{" "}
            <span
              className={"text-blue-500 cursor-pointer hover:underline"}
              onClick={() =>
                window.open(`https://solscan.io/account/${address}`, "_blank")
              }
            >
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
  );
};
