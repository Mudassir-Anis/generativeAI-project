import { createContext, useContext, useRef, useState } from "react";
import run from "../config/gemini";

export const Context = createContext();

export const ContextProvider = (props) => {
  const [input, setInput] = useState("");
  const [recentPrompt, setRecentPrompt] = useState("");
  const [prevPrompts, setPrevPrompts] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState("");

  const delayPara = (index, nextWord, requestObject) => {
    setTimeout(function () {
      if (requestObject.abort) return;
      setResultData((prev) => prev + nextWord);
    }, 75 * index);
  };

  const latestRequestRef = useRef(null);

  const newChat = () => {
    setLoading(false);
    setShowResult(false);
  };

  const onSent = async (prompt) => {
    if (latestRequestRef.current) {
      latestRequestRef.current.abort = true;
    }

    // Store the new request reference
    const requestObject = { abort: false };
    latestRequestRef.current = requestObject;
    const input1 = input;
    setInput("");
    setResultData("");
    setLoading(true);
    setShowResult(true);
    let response;

    if (prompt !== undefined) {
      response = await run(prompt);
      setRecentPrompt(prompt);
    } else {
      setPrevPrompts((prev) => [...prev, input1]);
      setRecentPrompt(input1);
      response = await run(input1);
    }
    const responseArray = response
      .split("**")
      .map((el, index) => {
        if (index % 2 === 0) {
          return el;
        } else {
          return "<b>" + el + "</b>";
        }
      })
      .join(" ")
      .split("*")
      .join("<br/>");

    if (requestObject.abort) {
      console.log("Previous request aborted.");
      return;
    }

    const newResponseArray = responseArray.split(" ");

    for (let i = 0; i < newResponseArray.length; i++) {
      delayPara(i, newResponseArray[i] + " ", requestObject);
    }

    // setResultData(responseArray);

    setLoading(false);
    // setResultData(
    //   responseArray.map((el, index) => {
    //     if (index % 2 === 0) {
    //       return el;
    //     } else {
    //       return "<b>" + el + "</b>";
    //     }
    //   }).join(' ').split("*").join("<br/>")
    // );
    setInput("");
  };

  const contextValue = {
    input,
    setInput,
    recentPrompt,
    setRecentPrompt,
    onSent,
    prevPrompts,
    setPrevPrompts,
    showResult,
    loading,
    resultData,
    setResultData,
    newChat,
  };

  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};
