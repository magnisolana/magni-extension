import { Button } from "@/components/ui/button";
import DoneIcon from "@mui/icons-material/Done";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { FC } from "react";

export const Success: FC<{ txId: string }> = ({ txId }) => (
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
        <OpenInNewIcon className={"mr-2"} />
        Show on Solscan
      </Button>
      <Button className={"flex items-center"} onClick={() => window.close()}>
        Done
      </Button>
    </div>
  </>
);
