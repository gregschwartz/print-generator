import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import globalStyles from "../styles/globals.css";
import ClipLoader from "react-spinners/ClipLoader";
import ProgressBar from "@ramonak/react-progress-bar";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState(new Date());
  const [timeTaken, setTimeTaken] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setLoading(true);
    setProgress(0);
    setStartTime(new Date());
    setTimeTaken(0);
    
    //start the generation
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: e.target.prompt.value,
      }),
    });
    let prediction = await response.json();
    if (response.status !== 201) {
      setError(prediction.detail);
      return;
    }
    setPrediction(prediction);
    setProgress(1);

    let cycle=0;
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(1000);
      const response = await fetch("/api/predictions/" + prediction.id);
      prediction = await response.json();

      console.log(prediction.status, cycle);
      if(startTime && cycle % 10 === 0) {
        const timeDiff = (new Date()).getTime() - startTime.getTime();
        console.log("Time so far: ", timeDiff / 1000, "seconds");
      }

      if (response.status !== 200) {
        console.log("error!", prediction);
        setError(prediction.detail);
        return;
      }
      setPrediction(prediction);

      cycle += 1;
      setProgress(cycle);
    }
    setProgress(100);
    setLoading(false);
    console.log("image generated", prediction.output);

    //calculate time it took to run
    setTimeTaken(((new Date()).getTime() - startTime.getTime())/1000);
    console.log("Time it took was: ", timeTaken);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Print Wizard</title>
      </Head>

      <p>
        Logo Maker
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input type="text" name="prompt" placeholder="Enter a prompt to display an image" />
        <button type="submit">Go!</button>
      </form>

      {error && <div>{error}</div>}

      {prediction && (
        <div>
            {prediction.output && (
              <div className={styles.imageWrapper}>
                {/* Image URL: {prediction.output}<br /> */}
                <img
                  src={prediction.output}
                  alt="output"
                  style={{"maxWidth": "100vw"}}
                />
                <p>Time taken: {timeTaken} seconds</p>
              </div>
            )}
            {loading && (
              <div>
                <p>
                  <ClipLoader color={"#123abc"} loading={loading} css={`
                    display: block;
                    margin: 0 auto;
                    border-color: red;
                  `} size={50} />
                  status: {prediction.status}
                </p>
                <ProgressBar completed={progress} />
              </div>
            )}
        </div>
      )}
    </div>
  );
}