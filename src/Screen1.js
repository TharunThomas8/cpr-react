import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Link } from 'react-router-dom';
import cv, { Mat } from "@techstark/opencv-js";
import "./styles.css";
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { api_base, page_base } from "./config";

// const api_base = "http://127.0.0.1:5000";
// const page_base = "http://127.0.0.1:3000";

const SPACING = 16;
const LEARNING_RATE = 0.005;
let weights = new Array(1000 * 1000).fill(0);
let average_left = 0;
let average_right = 0;
let num_moving = 0;
let last_frame = 0;
let num_compressions = 0;
let frame_no = 0;
let prev_movement = 0; //-1: down, 0: stationary, 1: up
let breathing_movement = 0; //not breathing
let time_since_compression = 0;
let time_since_downward = 0;
let breath_frames = 0;
let comps_while_breathing = 0;
let down_since_last_up = false;
// let ltot = 0;
let showCountdown = true;
let speedText = "";
let currentSpeech = null;
let breathStart = 0;
let breathTotal = 0;
let compressions_in_phase = 0;
let breathBlocker = false;
let prevBloc = false;
let breathText = "";


const Screen1 = () => {

  const { userId } = useParams();
  const [CPRrate, setCPRrate] = useState(0);

  const [countdown, setCountdown] = useState(5);
  const [startCountdown, setStartCountdown] = React.useState(false);
  const [breathChain, setBreathChain] = useState([]);
  const webcamRef = useRef(null);
  const startTimeRef = useRef(null);
  const [selectedOption, setSelectedOption] = useState('With Feedback');

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
    // console.log(selectedOption);
  };


  useEffect(() => {

    // setStartCountdown(false);

    weights = new Array(1000 * 1000).fill(0);
    average_left = 0;
    average_right = 0;
    num_moving = 0;
    last_frame = 0;
    num_compressions = 0;
    frame_no = 0;
    prev_movement = 0; //-1: down, 0: stationary, 1: up
    breathing_movement = 0; //not breathing
    time_since_compression = 0;
    time_since_downward = 0;
    breath_frames = 0;
    comps_while_breathing = 0;
    down_since_last_up = false;
    // let ltot = 0;
    showCountdown = true;
    speedText = "";
    currentSpeech = null;
    breathStart = 0;
    breathTotal = 0;
    compressions_in_phase = 0;
    breathBlocker = false;
    prevBloc = false;

    // const history = useHistory();


    if (startCountdown) {

      const interval = setInterval(captureFrame, 20);

      // Countdown logic
      const countdownInterval = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);

      const countdownTimeout = setTimeout(() => {
        showCountdown = false;
        // setTot(0);
        clearInterval(countdownInterval);
        startTimeRef.current = performance.now();

        // Create a new speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance("Begin");
        // Play the text as speech
        speechSynthesis.speak(utterance);

        console.log("Start time: ", startTimeRef.current);
        console.log(userId);
        sendDataAndNavigate();
      }, 5000);

      return () => {
        clearInterval(interval);
        clearInterval(countdownInterval);
        clearTimeout(countdownTimeout);
      };
    }
  }, [startCountdown]);


  const sendDataAndNavigate = async () => {
    // Wait for 60 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));

    try {
      // Send the data as a POST request
      let json_data = {
        userId: userId,
        cprRate: CPRrate,
        cprFraction: (((performance.now() - startTimeRef.current) - breathTotal) / (performance.now() - startTimeRef.current)) * 100,
        compression: num_compressions,
        feedback: selectedOption === 'With Feedback',
      }

      // console.log(json_data);

      await axios.post( '/save', json_data);

      // Navigate to another URL
      window.location.href = page_base + '/';
    } catch (error) {
      console.error('Error sending data:', error);
    }
  };

  let prevMat = null;

  function startTimer() {
    // Start a timer
    // console.log('Timer started!');
    const timer = setTimeout(() => {
      // console.log('Timer completed!');
      speakText("End Breathing", 2);
      breathText = "";
      handlecprRate(CPRrate, true);
    }, 5000); // 5000 milliseconds = 5 seconds

    // Cancel the timer before it completes
    // clearTimeout(timer);
  }

  const drawOpticalFlow = (flow) => {

    let totalUp = 0;       //total upward movement in frame
    let totalDown = 0;     //total downward movement in frame
    let totalLeft = 0;     //total left movement in frame
    let totalRight = 0;    //total right movement in frame
    let curr_movement = 0; //0: static, 1: up, -1: down
    let moving_regions = 0;
    let non_moving = 0;

    //calculate displacement for subset of pixels
    for (let row = SPACING / 2; row < flow.rows; row += SPACING) {
      for (let column = SPACING / 2; column < flow.cols; column += SPACING) {
        const flowData = flow.data32F;
        const index = (row * flow.cols + column) * 2; // Multiply by 2 to access x and y components

        const fxy0 = flowData[index];
        const fxy1 = flowData[index + 1];

        const old_weight = weights[row * flow.cols + column];
        let new_weight;

        // console.log(fxy);

        // 0.5 is the movement threshold
        if (fxy0 > 0.5) {
          // arrowedLine(display, Point(column, row), Point(cvRound(column + fxy1 * 3), cvRound(row + fxy0 * 3)), green, 1, 8, 0, .5);
          totalDown += fxy0 * old_weight;
          new_weight = Math.max(1.0, old_weight * (1 - LEARNING_RATE) + LEARNING_RATE);
          moving_regions++;
          if (fxy1 > 0 && old_weight > 0.99) {
            totalRight += fxy1;
          }
          if (fxy1 < 0 && old_weight > 0.99) {
            totalLeft += Math.abs(fxy1);
          }
        } else if (fxy0 < -0.5) {
          // arrowedLine(display, Point(column, row), Point(cvRound(column + fxy1 * 3), cvRound(row + fxy0 * 3)), red, 1, 8, 0, .4);
          totalUp += Math.abs(fxy0) * old_weight;
          new_weight = Math.max(1.0, old_weight * (1 - LEARNING_RATE) + LEARNING_RATE);
          moving_regions++;
          if (fxy1 > 0 && old_weight > 0.9) {
            totalRight += fxy1;
          }
          if (fxy1 < 0 && old_weight > 0.9) {
            totalLeft += Math.abs(fxy1);
          }
        } else {
          non_moving++;
          new_weight = old_weight * (1 - LEARNING_RATE);
        }

        if (breathing_movement === 0) {
          weights[row * flow.cols + column] = new_weight;
        }

        const color = new_weight > 1 ? 255 : new_weight * 255;
      }
    }

    if (
      moving_regions > 16 &&
      ((totalUp > totalDown * 2 && totalUp > 20) ||
        (totalUp > 10 && totalUp > totalDown * 5))
    ) {
      curr_movement = 1; // upward movement
      time_since_downward++;
      // end of breathing
      // console.log("Total right: " + totalRight);
      if (breathing_movement === 1) {
        breathing_movement = 0;
        time_since_compression = 0;
        prev_movement = 1;

        // Breath end

        // console.log("Breath end at " + frame_no);
        breathTotal += performance.now() - breathStart;
        breathStart = 0;
        setBreathChain(prevBreathChain => [...prevBreathChain, "E"]);

        last_frame = -1;
        return frame_no * -1;
      } else {
        average_left = ((average_left * num_moving) + totalLeft) / (num_moving + 1);
        average_right = ((average_right * num_moving) + totalRight) / (num_moving + 1);
        num_moving++;
      }
    } else if (
      moving_regions > 16 &&
      (totalDown > totalUp * 2 && totalDown > 20) ||
      (totalDown > 10 && totalDown > totalUp * 5)
    ) {
      curr_movement = -1;
      down_since_last_up = true;
      time_since_downward = 0;
      if (
        num_compressions > 5 &&
        ((totalRight > average_right * 5 && totalRight > totalDown / 3) ||
          (totalLeft > average_left * 5 && totalLeft > totalDown / 3))
      ) {
        // console.log("Total right: " + totalRight);
        // console.log("breathing movement" + breathing_movement);
        // console.log("Breath frames: " + breath_frames);
        if (breathing_movement === 0 && last_frame !== -1) {
          if (breath_frames === 2) {
            breathing_movement = 1;

            // Breath start

            // console.log("Breath start at " + frame_no);
            breathStart = performance.now();
            compressions_in_phase = 0;
            setBreathChain(prevBreathChain => [...prevBreathChain, "S"]);


            breath_frames = 0;
            time_since_compression = 0;
            return -1;
          } else breath_frames++;
        }
      } else {
        breath_frames = 0;
        // update average lateral movement
        average_left = ((average_left * num_moving) + totalLeft) / (num_moving + 1);
        average_right = ((average_right * num_moving) + totalRight) / (num_moving + 1);
        num_moving++;
      }
    } else {
      curr_movement = 0; // stationary scene
    }
    if (prev_movement !== 1 && curr_movement === 1 && time_since_compression >= 7) {
      // previous movement not upward, current movement upward
      if (breathing_movement === 1 && comps_while_breathing < 2) {
        // self-correcting compressions while breathing
        comps_while_breathing++;
        return -1;
      } else if (down_since_last_up && time_since_downward <= 10) {
        // there has been downward movement since last upward movement, there has been recent downward movement
        num_compressions++;
        compressions_in_phase++;
        // console.log("num_compressions: " + num_compressions);
        prev_movement = curr_movement;
        time_since_compression = 0;
        comps_while_breathing = 0;
        breathing_movement = 0;
        breath_frames = 0;
        last_frame = frame_no;
        down_since_last_up = false;
        // console.log("Compression at " + frame_no);
        // console.log("Total Up: " + totalUp);
        // console.log("Total Down: " + totalDown);
        // console.log("Moving Regions: " + moving_regions);
        return frame_no;
      }
    }
    prev_movement = curr_movement;
    time_since_compression++;
    return -1;

  };

  const handlecprRate = (cprRate, flag = false) => {

    // console.log(speedText);

    let temp_speedText = "";
    if (cprRate < 90) {
      temp_speedText = "Speed up!";
    } else if (cprRate < 100) {
      temp_speedText = "slightly Speed up";
    } else if (cprRate > 130) {
      temp_speedText = "Slow Down!";
    } else if (cprRate > 120) {
      temp_speedText = "slightly Slow down";
    } else {
      temp_speedText = "Maintain Pace";
    }

    if (!flag) {
      if (temp_speedText !== speedText) {
        speedText = temp_speedText;
        speakText(speedText);
      }
    } else {
      speedText = temp_speedText;
      speakText(speedText);
    }

  };

  const processOutputImage = (prevImage, currentImage) => {
    const prevGray = new cv.Mat();
    const currentGray = new cv.Mat();
    const prevPoints = new cv.Mat();
    const nextPoints = new cv.Mat();
    const status = new cv.Mat();
    const err = new cv.Mat();

    const flow = new cv.Mat();

    const sm1 = new cv.Mat();
    const sm2 = new cv.Mat();

    cv.resize(prevImage, sm2, new cv.Size(216, 216));
    cv.resize(currentImage, sm1, new cv.Size(216, 216));

    cv.cvtColor(sm2, prevGray, cv.COLOR_RGBA2GRAY);
    cv.cvtColor(sm1, currentGray, cv.COLOR_RGBA2GRAY);
    cv.calcOpticalFlowFarneback(
      prevGray,     // Previous grayscale image (Mat)
      currentGray,     // Current grayscale image (Mat)
      flow,      // Optical flow result (Mat)
      0.4,       // Pyramid scale factor (0.5 is a common value)
      1,         // Number of pyramid layers
      12,        // Window size
      2,         // Number of iterations at each pyramid level
      8,         // Size of the pixel neighborhood used to find polynomial expansion in each pixel
      1.2,       // Standard deviation used to smooth derivatives
      0          // Flags (set to 0)
    );



    let number = drawOpticalFlow(flow);
    if (number !== -1) {
      const endTime = performance.now();

      // setTot(prevTot => prevTot + 1);
      // ltot = ltot + 1;
      const cprRate = ((num_compressions / ((endTime - startTimeRef.current) - breathTotal)) * 60) * 1000;
      
      console.log(num_compressions, endTime - startTimeRef.current, breathTotal);
      // console.log(breathTotal, endTime - startTimeRef.current);

      handlecprRate(cprRate);

      setCPRrate(cprRate.toFixed(3));
    }



    prevGray.delete();
    currentGray.delete();
    prevPoints.delete();
    nextPoints.delete();
    status.delete();
    err.delete();
    flow.delete();
    sm1.delete();
    sm2.delete();
  };

  const speakText = (text, control = 0) => {

    if (selectedOption === 'Without Feedback') return;
    // If there is currently playing speech, stop it
    if (!breathBlocker) {
      if (currentSpeech) {
        if (!prevBloc) {
          speechSynthesis.cancel();
        }
      }

      // Create a new speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(text);

      // Play the text as speech
      speechSynthesis.speak(utterance);

      // Update the currentSpeech variable
      currentSpeech = utterance;

      if (control === 1) {
        breathBlocker = true;
      }
      prevBloc = false;
    }
    if (control === 2) {
      breathBlocker = false;

      prevBloc = true;
      // Create a new speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(text);

      // Play the text as speech
      speechSynthesis.speak(utterance);

      // Update the currentSpeech variable
      currentSpeech = utterance;
    }
  };

  if (compressions_in_phase === 30) {
    speakText("Begin breathing", 1);
    breathText = "Perform breathing";
    startTimer();
  }
  // Create the canvas and context outside the captureFrame function
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Reuse the same Image object
  const img = new Image();

  const captureFrame = () => {

    if (showCountdown) return;
    // Get front facing camera image
    try {
      const imageSrc = webcamRef.current.getScreenshot();

      if (!imageSrc) return;


      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const currentMat = cv.matFromImageData(imageData);

        if (prevMat) {
          processOutputImage(prevMat, currentMat);
          prevMat.delete();
        }

        prevMat = currentMat;
      };

      img.src = imageSrc;

    }
    catch (err) {
      console.log(err);
    }

  };

  return (
    <div className="App">
      <Link to="/">
        <button>Home Page</button>
      </Link>
      <h2>Real-time Optical Flow</h2>
      <div className="webcamContainer">
        <h3>Live Feed</h3>
        <Webcam
          ref={webcamRef}
          className="webcam"
          mirrored
          screenshotFormat="image/jpeg"
          videoConstraints={{ width: 640, height: 480 }}
        />
      </div>
      {!startCountdown && (
        <>
          <button onClick={() => setStartCountdown(prevState => !prevState)}>
            {startCountdown ? 'Stop Countdown' : 'Start Countdown'}
          </button>
          <div>
            <label>
              <input
                type="radio"
                value="With Feedback"
                checked={selectedOption === 'With Feedback'}
                onChange={handleOptionChange}
              />
              With Feedback
            </label>
            <label>
              <input
                type="radio"
                value="Without Feedback"
                checked={selectedOption === 'Without Feedback'}
                onChange={handleOptionChange}
              />
              Without Feedback
            </label>
          </div>
        </>

      )}
      {startCountdown && showCountdown && <div className="countdown">{countdown}</div>}
      {!showCountdown && selectedOption === "With Feedback" && (
        <>
          <div className="totValue">Count: {num_compressions}</div>
          <div className="rateValue">
            Rate: {speedText} ({CPRrate})
          </div>
          <h4>Maintain 100-120</h4>
          <div className="breathSeq">Breath Chain: {breathChain}</div>
          <div className="breathText">{breathText}</div>
        </>
      )}
    </div>
  );
};

export default Screen1;
