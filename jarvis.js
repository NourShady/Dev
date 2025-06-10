(() => {
  // ------------------------------------------------------------------------------------------------

  const style = document.createElement("style");
  style.textContent = `
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background-color: #000;
      overflow: hidden;
      font-family: Arial, sans-serif;
    }

    #jarvis-container {
      position: fixed;
      top: 0; left: 0;
      width: 100vw;
      height: 100vh;
      background-color: #111;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      z-index: 9999;
    }
#status{
      position: fixed;
      bottom: 20px;
      left: 20px;
      color: white;
      font-size: 18px;
      z-index: 10000;
    }
      svg#jarvis-like {
    scale: 2;
}
    #name{  
    position: fixed;
    top: 21%;
}
    #jarvis-icon {
      font-size: 120px;
      animation: float 3s ease-in-out infinite;
      transition: transform 0.3s ease;
    }

    #jarvis-status {
         margin-top: 20px;
    font-size: 24px;
    position: fixed;
    top: 46%;
    left: 47.2%;
      font-size: 24px;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
  `;
  document.head.appendChild(style);

  // 2. Create UI elements
  const container = document.createElement("div");
  container.id = "jarvis-container";

  const icon = document.createElement("i");
  icon.id = "jarvis-icon";
  container.appendChild(icon);

  const name = document.createElement("h1");
  name.id = "name";
  name.innerText = "J.A.R.V.I.S";
  container.appendChild(name);

  const status = document.createElement("div");
  status.id = "jarvis-status";

  container.appendChild(status);

  const chk = document.createElement("input");
  chk.id = "status";
  chk.type = "checkbox";
  chk.checked = true; // Default checked
  container.appendChild(chk);
  // -----------------------------------------------------------------------
  const svgNS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "210");
  svg.setAttribute("height", "210");
  svg.setAttribute("id", "jarvis-like");

  // Create <defs> and <filter>
  const defs = document.createElementNS(svgNS, "defs");

  const filter = document.createElementNS(svgNS, "filter");
  filter.setAttribute("id", "light-circle");

  const gaussian = document.createElementNS(svgNS, "feGaussianBlur");
  gaussian.setAttribute("result", "blurred");
  gaussian.setAttribute("in", "SourceGraphic");
  gaussian.setAttribute("stdDeviation", "1");

  filter.appendChild(gaussian);
  defs.appendChild(filter);
  svg.appendChild(defs);

  // Helper to add <circle> with attributes
  function addCircle(attrs) {
    const circle = document.createElementNS(svgNS, "circle");
    for (let [key, value] of Object.entries(attrs)) {
      circle.setAttribute(key, value);
    }
    svg.appendChild(circle);
    return circle;
  }

  // Outer circles
  addCircle({
    cx: 105,
    cy: 105,
    r: 100,
    style:
      "fill: transparent; stroke: #B4F6FB; stroke-width: 2; stroke-dasharray: 50, 5",
  });
  addCircle({
    cx: 105,
    cy: 105,
    r: 95,
    style: "fill: transparent; stroke: #64E6EF; stroke-width: 1.5",
  });

  // Rotating dashed circle (clockwise)
  const rotating1 = addCircle({
    cx: 105,
    cy: 105,
    r: 80,
    style:
      "fill: transparent; stroke: #B4F6FB; stroke-width: 10; stroke-dasharray: 2,2.29",
  });
  const animate1 = document.createElementNS(svgNS, "animateTransform");
  animate1.setAttribute("attributeName", "transform");
  animate1.setAttribute("attributeType", "XML");
  animate1.setAttribute("type", "rotate");
  animate1.setAttribute("from", "0 105 105");
  animate1.setAttribute("to", "360 105 105");
  animate1.setAttribute("dur", "10s");
  animate1.setAttribute("repeatCount", "indefinite");
  rotating1.appendChild(animate1);

  // Rotating dashed circle (counter-clockwise)
  const rotating2 = addCircle({
    cx: 105,
    cy: 105,
    r: 61,
    transform: "rotate(0 105 105)",
    style:
      "fill: transparent; stroke: #B4F6FB; stroke-width: 2; stroke-dasharray: 50, 25",
  });
  const animate2 = document.createElementNS(svgNS, "animateTransform");
  animate2.setAttribute("attributeName", "transform");
  animate2.setAttribute("attributeType", "XML");
  animate2.setAttribute("type", "rotate");
  animate2.setAttribute("from", "0 105 105");
  animate2.setAttribute("to", "-360 105 105");
  animate2.setAttribute("dur", "10s");
  animate2.setAttribute("repeatCount", "indefinite");
  rotating2.appendChild(animate2);

  // Inner circles
  addCircle({
    cx: 105,
    cy: 105,
    r: 50,
    style:
      "fill: transparent; stroke: #64E6EF; stroke-width: 15; filter: url(#light-circle);",
  });
  addCircle({
    cx: 105,
    cy: 105,
    r: 40,
    style: "fill: transparent; stroke: #64E6EF; stroke-width: 2",
  });

  // Append to container
  container.appendChild(svg);

  document.body.appendChild(container);

  // 3. Mode function
  function setMode(mode) {
    if (mode === "thinking") {
      icon.className = "fas fa-circle-notch fa-spin";
      status.textContent = "Thinking...";
      document.title = "Thinking...";
    } else if (mode === "speaking") {
      icon.className = "fas fa-volume-up";
      status.textContent = "Speaking...";
      document.title = "Speaking...";
    } else if (mode === "listening") {
      icon.className = "fas fa-microphone";
      status.textContent = "Listening...";
      document.title = "Listening...";
    }
  }
  // -----------------------------------------------------------------------------------------------
  var isSpeaking = false; // Track if currently speaking
  const langOptions = {
    en: "en-US",
    ar: "ar-EG",
  };

  let lang = "ar"; // Default language
  let isRecognizing = false;
  let recognition;
  let currentUtterance;

  function getInputBox() {
    return document.querySelector(".ql-editor").querySelector("p");
  }

  function getSendButton() {
    // New Gemini often uses button with aria-label="Send message"
    return Array.from(document.querySelectorAll("button")).find((btn) =>
      btn.getAttribute("aria-label")?.toLowerCase().includes("send")
    );
  }

  function sendToGemini(text) {
    const textarea = getInputBox();
    // if (!textarea || !sendBtn) {
    //     console.warn("❌ Could not find input or send button");
    //     return;
    // }

    // textarea.focus();
    textarea.innerText = text;

    // Trigger input event to simulate real typing
    textarea.dispatchEvent(new InputEvent("input", { bubbles: true }));
    const sendBtn = getSendButton();

    if (!sendBtn) {
      console.warn("❌ Could not find send button");
      return;
    }
    setTimeout(() => {
      sendBtn.click();
    }, 100); // Small delay to ensure input is processed
  }

  function startRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = langOptions[lang];
    recognition.continuous = true;
    recognition.interimResults = false;

    // recognition.onstart = () => console.log("🎙️ Listening...");
    recognition.onstart = () => setMode("listening");

    recognition.onerror = (e) => console.error("🎙️ Error:", e);

    // recognition.onresult = (e) => {
    //   const text = e.results[e.resultIndex][0].transcript.trim();
    //   console.log("🗣️ You said:", text);

    //   if (speechSynthesis.speaking) speechSynthesis.cancel();

    //   sendToGemini(text);
    //   waitForGeminiResponse().then(response => {
    //     console.log("🤖 Gemini:", response);
    //     speak(response);
    //   });
    // };

    recognition.onresult = (e) => {
      const text = e.results[e.resultIndex][0].transcript.trim();
      const isEneabled = document.querySelector("#status").checked;
      console.log("🗣️ You said:", text);

      const stopWords = ["إسكت", "خلاص", "اسمع"];

      if (speechSynthesis.speaking) {
        // ✅ أثناء التحدث فقط، اسمع للأوامر فقط
        // if (stopWords.some(word => text.includes(word))) {
        if (stopWords.some((word) => text.includes(word))) {
          speechSynthesis.cancel();
           isSpeaking = false;
          console.log("🛑 Stopped speaking by command.");
        } else {
          console.log("🔇 Ignored speech during TTS.");
        }
        return; // لا ترسل أي شيء لـ Gemini أثناء الكلام
      }

      // ✅ إذا ما كان بيتكلم، أرسل النص لـ Gemini
      if (!speechSynthesis.speaking) {
        if (!isSpeaking) {
          if (isEneabled) {
            sendToGemini(text);
            setMode("thinking");
            waitForGeminiResponse().then((response) => {
              console.log("🤖 Gemini:", response);

              speak(response, langOptions[lang]);
              setMode("speaking");
            });
          }
        }
      }
    };

    recognition.onend = () => {
      if (isRecognizing) recognition.start(); // keep listening
    };

    recognition.start();
    isRecognizing = true;
  }

  function waitForGeminiResponse(timeout = 3000, stableDelay = 1500) {
    return new Promise((resolve) => {
      let lastText = "";
      let stableTimer;
      let timeoutTimer;

      const observer = new MutationObserver(() => {
        const allMessages = [
          ...document.querySelectorAll("[data-message-text], .markdown"),
        ];
        const lastEl = allMessages[allMessages.length - 1];
        if (!lastEl) return;

        const currentText = lastEl.innerText.trim();

        if (currentText && currentText !== lastText) {
          lastText = currentText;

          if (stableTimer) clearTimeout(stableTimer);
          stableTimer = setTimeout(() => {
            observer.disconnect();
            clearTimeout(timeoutTimer);
            resolve(currentText);
          }, stableDelay); // Wait after last change
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // Failsafe timeout
      timeoutTimer = setTimeout(() => {
        observer.disconnect();
        resolve(lastText);
      }, timeout);
    });
  }
  function waitForGeminiResponse(timeout = 3000, stableDelay = 1500) {
    return new Promise((resolve) => {
      let targetEl = null;
      let stableTimer = null;
      let timeoutTimer = null;
      let hasResolved = false;

      const messageSelector = "[data-message-text], .markdown";

      const initialMessages = document.querySelectorAll(messageSelector);
      const initialCount = initialMessages.length;

      const observer = new MutationObserver(() => {
        const allMessages = [...document.querySelectorAll(messageSelector)];

        // Check if a new element has been added
        if (allMessages.length > initialCount && !targetEl) {
          targetEl = allMessages[allMessages.length - 1]; // Newest message only
        }

        if (!targetEl) return;

        const currentText = targetEl.innerText.trim();
        if (!currentText) return;

        // Reset stable timer since content is still changing
        if (stableTimer) clearTimeout(stableTimer);

        stableTimer = setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            observer.disconnect();
            clearTimeout(timeoutTimer);
            resolve(currentText);
          }
        }, stableDelay);
      });

      observer.observe(document.body, { childList: true, subtree: true });

      timeoutTimer = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          observer.disconnect();
          clearTimeout(stableTimer);
          resolve(targetEl ? targetEl.innerText.trim() : "");
        }
      }, timeout);
    });
  }

  //   function speak(text) {
  //     const utterance = new SpeechSynthesisUtterance(text);
  //     utterance.lang = langOptions[lang];
  //     currentUtterance = utterance;
  //     speechSynthesis.speak(utterance);
  //   }
  function speak(text, lang = "ar-EG") {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    // ✅ تحديد الصوت بالاسم الدقيق
    const preferredVoiceName =
      "Microsoft Shakir Online (Natural) - Arabic (Egypt)";
    const voices = speechSynthesis.getVoices();
    const selectedVoice = voices.find((v) => v.name === preferredVoiceName);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log("✅ Using voice:", selectedVoice.name);
    } else {
      console.warn("⚠️ Voice not found, using default.");
    }
    isSpeaking = true;
    setMode("speaking");
    speechSynthesis.speak(utterance);

    utterance.onend = () => {
      console.log("🔊 Finished speaking.");

      // بعد انتهاء التحدث انتظر 1.5 ثانية، ثم غيّر المتغير
      setTimeout(() => {
        isSpeaking = false;
        console.log("⏳ Done waiting, isSpeaking =", isSpeaking);
      }, 100); // 1500ms = 1.5s
    };
  }

  // Add language toggle button
  const btn = document.createElement("button");
  btn.textContent = "🌐 Toggle Lang (Current: AR)";
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 9999,
    padding: "10px",
    background: "#333",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
  });
  document.body.appendChild(btn);

  btn.onclick = () => {
    lang = lang === "en" ? "ar" : "en";
    btn.textContent = `🌐 Toggle Lang (Current: ${lang.toUpperCase()})`;
    if (recognition) recognition.lang = langOptions[lang];
    console.log("🌍 Language set to:", lang);
  };

  startRecognition();

  // 4. Demo sequence
  // setMode('thinking');
  // setTimeout(() => setMode('listening'), 2000);
  // setTimeout(() => setMode('speaking'), 5000);
  // setTimeout(() => setMode('thinking'), 8000);
})();
