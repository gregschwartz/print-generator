import { useEffect, useState, useRef } from "react";
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
  const [prompt, setPrompt] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [timeTaken, setTimeTaken] = useState(0);
  const imageRef = useRef(null);

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
    
    let thePrompt = `${type1}, ${type2} style, ${visual}, business called "${name}"`;
    console.log("prompt", thePrompt);
    setPrompt(thePrompt);

    //start the generation
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: thePrompt,
      }),
    });
    let prediction = await response.json();
    if (response.status !== 201) {
      setError(prediction.detail);
      return;
    }
    setPrediction(prediction);
    setProgress(1);

    let cycle=0.0;
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

      if(prediction.status === "starting") {
        cycle = Math.min(30, cycle + 0.1);

        //round to first decimal
        cycle = Math.round(cycle * 10) / 10;
        console.log("starting so tiny steps:", cycle);
      } else if(cycle < 98) {
        cycle = Math.round(cycle + 1);
      }

      setProgress(cycle);
    }

    if(prediction.status === "succeeded") {
      //scroll to image
      if(imageRef.current) {
        imageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }

      //store the image
      setProgress(99);
      // await uploadImageToConvex(prediction.output, prompt);
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
    console.log("Form change", type1, type2, visual, name);
  }, [type1, type2, visual, name]);

  return (
    <div className={styles.container}>
      <Head>
        <title>{loading ? `${progress}%: Wish Craft` : 'Wish Craft'}</title>
      </Head>

      <h1>Wish Craft</h1>

      <Tabs>
        <TabList>
          <Tab>{loading ? `Generating Your ${type1}: ${progress}%` : `Generate ${type1}`}</Tab>
          <Tab>Previously Crafted Wishes</Tab>
        </TabList>

        <TabPanel>
          <form className="grid grid-cols-4 gap-4 items-center" onSubmit={handleSubmit}>
            <label>I wish for a:</label>
            <ButtonBar name="type1" buttons={["Logo", "Textual Art", "3D Icon"]} onChange={handleType1Change} selected={type1} className="col-span-3" />
            
            <label>In this style:</label>
            <ButtonBar name="type2" buttons={["Cartoon", "Illustration", "Modern"]} onChange={handleType2Change} selected={type2} className="col-span-3" />
            
            <label>Primary visual:</label>
            <input type="text" name="visual" placeholder="Visual e.g. robot at a desk, skateboard" onChange={handleVisualChange}  className="rounded-lg px-2 col-span-3" />
            
            <label>With the name:</label>
            <input type="text" name="name" placeholder="Name, e.g. Super Startup" onChange={handleNameChange} className="rounded-lg px-2 col-span-3" />
            
            <button type="submit" className="rounded-full text-white bg-blue-500	hover:bg-blue-600 col-span-4">Craft My Wish!</button>
          </form>


          {error && <div>{error}</div>}

          {prediction && (
            <div className="output mt-14 flex flex-col items-center text-sm">
                {prediction.output && (
                  <div className={`flex flex-col items-center ${styles.imageWrapper}`}>
                    <h1 className="mb-4">🎉 Wish crafted 🎉</h1>
                    <img src={prediction.output} alt="output" ref={imageRef} />
                    <p className="text-gray-400">
                      Time taken: {timeTaken} seconds
                    </p>
                </div>
                )}
                {loading && (
                  <div className="loadingUI flex flex-col items-center">
                    <p>
                      <ClipLoader color={"#123abc"} loading={loading} css={`
                        display: block;
                        margin: 0 auto;
                        border-color: red;
                      `} size={50} />
                      Status: {prediction.status}
                    </p>
                    <ProgressBar completed={progress} width="80vw" bgColor="#3b82f6" labelColor="#eeeeee" />
                  </div>
                )}
              <p className="text-gray-400">
                Prompt: {prompt}
              </p>
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