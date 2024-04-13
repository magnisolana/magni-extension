import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import CropFreeIcon from "@mui/icons-material/CropFree";
import QrCodeIcon from "@mui/icons-material/QrCode";
import * as web3 from "@solana/web3.js";
import { Scanner } from "@yudiel/react-qr-scanner";
import * as bip39 from "bip39";
import * as bs58 from "bs58";
import { derivePath } from "ed25519-hd-key";
import { Dispatch, FC, SetStateAction, useState } from "react";
import QRCode from "react-qr-code";
import nacl from "tweetnacl";

export const Sign: FC<{
  transaction: string;
  setTxId: Dispatch<SetStateAction<string>>;
  setSending: Dispatch<SetStateAction<boolean | null>>;
}> = ({ transaction, setTxId, setSending }) => {
  const { toast } = useToast();
  const [scan, setScan] = useState(false);

  const getPrivateKey = async (phrase: string) => {
    const seed = await bip39.mnemonicToSeed(phrase);
    const seedBuffer = Buffer.from(seed).toString("hex");
    const path44Change = `m/44'/501'/0'/0'`;
    const derivedSeed = derivePath(path44Change, seedBuffer).key;

    return new web3.Account(nacl.sign.keyPair.fromSeed(derivedSeed).secretKey);
  };

  const signAndPublish = async (_sign: string) => {
    const privateKey = await getPrivateKey(
      "target captain cattle response skull mouse tip mom mouse relax aisle soccer",
    );

    const connection = new web3.Connection(
      "https://svc.blockdaemon.com/solana/mainnet/native?apiKey=mTWZ46f2YRFkCbSA3AwIRpCoksF2K81zjEVdaZHLsFBv50Uu",
      { commitment: "confirmed" },
    );

    console.log("TRANSACTION =============================================");
    console.log(transaction.replace("solana:", ""));

    const swapTransactionBuf = bs58.decode(transaction.replace("solana:", ""));
    console.log(swapTransactionBuf);
    const tx = web3.VersionedTransaction.deserialize(swapTransactionBuf);

    tx.sign([privateKey]);

    console.log("SIGNATURE=============================================");
    console.log(tx.signatures[0] && bs58.encode(tx.signatures[0]));
    console.log(tx.signatures[0]);

    console.log(
      "TRANSACTION AFTER SIGNING========================================",
    );
    console.log(bs58.encode(tx.serialize()));
    console.log(tx.serialize());

    const txId = await connection.sendTransaction(tx);

    console.log(`txId: ${txId}`);

    setTxId(txId);
  };

  return (
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
                        "Please try again and make sure that your QR code is valid, you have coins on your balance and transaction is not old.",
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
          <Button className={"flex items-center"} onClick={() => setScan(true)}>
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
  );
};
