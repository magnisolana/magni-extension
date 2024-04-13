import { LoadingSpinner } from "@/components/ui/loader";
import { Connect } from "@/components/wallet/connect";
import { Sign } from "@/components/wallet/sign";
import { Success } from "@/components/wallet/success";
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [address, setAddress] = useState("");
  const [sending, setSending] = useState<boolean | null>(null);

  const [transaction, setTransaction] = useState<string>("");
  const [txId, setTxId] = useState<string>("");

  useEffect(() => {
    const tx58 = new URLSearchParams(location.search).get("tx");

    if (tx58) {
      const address = new URLSearchParams(location.search).get("address");

      setAddress(address || "");
      setTransaction(`solana:${tx58}`);
    }
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
        <Connect address={address} setAddress={setAddress} />
      ) : sending === null ? (
        <Sign
          transaction={transaction}
          setTxId={setTxId}
          setSending={setSending}
        />
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
            <Success txId={txId} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
