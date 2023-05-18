import { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import globalStyles from "../styles/globals.css";
import ClipLoader from "react-spinners/ClipLoader";
import ProgressBar from "@ramonak/react-progress-bar";
import { useQuery } from "../convex/_generated/react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import ButtonBar from "../components/buttonbar";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [type1, setType1] = useState("");
  const [type2, setType2] = useState("");
  const [visual, setVisual] = useState("");
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [timeTaken, setTimeTaken] = useState(0);

  const images = useQuery("getImages");

  async function uploadImageToConvex(imageUrl, prompt) {
    const response = await fetch(imageUrl);
    const imageBlob = await response.blob();
    
    const sendImageUrl = new URL(`${process.env.NEXT_PUBLIC_CONVEX_SITE}/sendImage`);
    sendImageUrl.searchParams.set("prompt", prompt);

    try {
      await fetch(sendImageUrl, {
        method: "POST",
        headers: { "Content-Type": imageBlob.type },
        body: imageBlob,
      });
    } catch (error) {
      console.log(error);
      setError(JSON.stringify(error));
    }
  }  

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setLoading(true);
    setProgress(0);
    setStartTime(new Date());
    setTimeTaken(0);
    
    let prompt = "";
    if(type1 == "Logo") {
      prompt = `Logo, ${visual}, business called "${name}"`;
    } else if(type1 == "Textual Art") {
      prompt = `Textual Art, ${visual}, business called "${name}"`;
    } else if(type1 == "3D Icon") {
      prompt = `3D Icon, ${visual}, business called "${name}"`;
    }

    //start the generation
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
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

      if(startTime && cycle % 50 === 0) {
        console.log(prediction.status, cycle);
        const timeDiff = (new Date()).getTime() - startTime.getTime();
        console.log("Time so far: ", timeDiff / 1000, "seconds");
      }

      if (response.status !== 200) {
        console.log("error!", prediction);
        setError(prediction.detail);
        return;
      }
      setPrediction(prediction);

      if(cycle < 98) {
        cycle += 1;
        setProgress(cycle);
      }
    }

    if(prediction.status === "succeeded") {
      //store the image
      setProgress(99);
      await uploadImageToConvex(prediction.output, prompt);
      console.log("image generated", prediction.output);
      
      setProgress(100);
    }
    
    //calculate time it took to run
    setTimeTaken(((new Date()).getTime() - startTime.getTime())/1000);
    setLoading(false);
  };

  //handle changes
  const handleType1Change = (event) => setType1(event.target.value);
  const handleType2Change = (event) => setType2(event.target.value);
  const handleVisualChange = (event) => setVisual(event.target.value);
  const handleNameChange = (event) => setName(event.target.value);

  useEffect(() => {
    console.log(type1, type2, visual, name);
  }, [type1, type2, visual, name]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Print Wizard</title>
      </Head>

      <h1>Logo Maker</h1>

      <Tabs>
        <TabList>
          <Tab>{loading ? `Generate: ${progress}%` : 'Generate'}</Tab>
          <Tab>More Generated Images</Tab>
        </TabList>

        <TabPanel>
          <form className="flex flex-col space-y-1 items-center" onSubmit={handleSubmit}>
            <ButtonBar name="type1" buttons={["Logo", "Textual Art", "3D Icon"]} onChange={handleType1Change} />
            <ButtonBar name="type2" buttons={["Style 1", "Style 2", "Style 3"]} onChange={handleType2Change} />
            <label className="my-2" style={{width: "60%"}}>Primary visual:
              <input type="text" name="visual" placeholder="Visual e.g. robot at a desk, skateboard" onChange={handleVisualChange}  style={{width: "70%"}} />
            </label>
            <label className="my-2" style={{width: "60%"}}>Company name:
              <input type="text" name="name" placeholder="Name, e.g. Super Startup" onChange={handleNameChange}  style={{width: "70%"}} />
            </label>
            <button type="submit" className="rounded-full bg-green-500	hover:bg-green-600" style={{width: "80%"}}>Generate my logo!</button>
          </form>

          {error && <div>{error}</div>}

          {prediction && (
            <div>
                {prediction.output && (
                  <div className={styles.imageWrapper}>
                    <img src={prediction.output} alt="output" style={{"maxWidth": "100vw"}} />
                    <p>
                      Time taken: {timeTaken} seconds
                      {/* Image URL: {prediction.output}<br /> */}
                    </p>
                </div>
                )}
                {loading && (
                  <div>
                    <p>
                      {/* <img id="wishGif" src="/wish.gif" /> */}
                      <ClipLoader color={"#123abc"} loading={loading} css={`
                        display: block;
                        margin: 0 auto;
                        border-color: red;
                      `} size={50} />
                      Status: {prediction.status}
                    </p>
                    <ProgressBar completed={progress} />
                  </div>
                )}
            </div>
          )}
        </TabPanel>
        <TabPanel>
          <div className="generatedImages">
            {images?.map(({ _id, prompt, url }) => (
              <div key={_id.toString()} className="flex my-10">
                <img src={url} alt={prompt} />
                <span class="prompt">{prompt}</span>
              </div>
            ))}
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}