import { useState } from "react";
import { db, collection, addDoc, updateDoc, doc } from "./firebase";

function App() {
  // State management
  const [activeGroup, setActiveGroup] = useState("A");
  
  // Group A states
  const [designerGoalA, setDesignerGoalA] = useState("");
  const [userProfilesA, setUserProfilesA] = useState([
    { dimension: "User ID", content: "" },
    { dimension: "Age", content: "" },
    { dimension: "Gender", content: "" },
    { dimension: "TAM Group", content: "" },
    { dimension: "Commuting Situation", content: "" }
  ]);
  const [customPromptA, setCustomPromptA] = useState("");
  const [apiKeyA, setApiKeyA] = useState("");
  const [designGuideA, setDesignGuideA] = useState("");
  const [designerNotes, setDesignerNotes] = useState("");
  const [loadingA, setLoadingA] = useState(false);
  const [currentDocIdA, setCurrentDocIdA] = useState(null);
  const [savingNotes, setSavingNotes] = useState(false);
  
  // GPT-4o parameters for Group A
  const [temperatureA, setTemperatureA] = useState(0.7);
  const [maxTokensA, setMaxTokensA] = useState(2000);
  const [topPA, setTopPA] = useState(1.0);

  // Group B states
  const [designerGoalB, setDesignerGoalB] = useState("");
  const [userProfilesB, setUserProfilesB] = useState([
    { dimension: "User ID", content: "" },
    { dimension: "Age", content: "" },
    { dimension: "Gender", content: "" },
    { dimension: "TAM Group", content: "" },
    { dimension: "Commuting Situation", content: "" }
  ]);
  const [customPromptB, setCustomPromptB] = useState("");
  const [apiKeyB, setApiKeyB] = useState("");
  const [designGuideB, setDesignGuideB] = useState("");
  const [userFeedback, setUserFeedback] = useState("");
  const [suggestedDimensions, setSuggestedDimensions] = useState("");
  const [loadingB, setLoadingB] = useState(false);
  const [currentDocIdB, setCurrentDocIdB] = useState(null);
  
  // GPT-4o parameters for Group B
  const [temperatureB, setTemperatureB] = useState(0.7);
  const [maxTokensB, setMaxTokensB] = useState(2000);
  const [topPB, setTopPB] = useState(1.0);
  
  // Group C states (Silicon Sample)
  const [userIdC, setUserIdC] = useState("");
  const [userProfileC, setUserProfileC] = useState("");
  const [designerGoalC, setDesignerGoalC] = useState("");
  const [customPromptC, setCustomPromptC] = useState("");
  const [apiKeyC, setApiKeyC] = useState("");
  const [designGuideC, setDesignGuideC] = useState("");
  const [userEvaluation, setUserEvaluation] = useState("");
  const [loadingC, setLoadingC] = useState(false);
  const [currentDocIdC, setCurrentDocIdC] = useState(null);
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  
  // GPT-4o parameters for Group C
  const [temperatureC, setTemperatureC] = useState(0.7);
  const [maxTokensC, setMaxTokensC] = useState(2000);
  const [topPC, setTopPC] = useState(1.0);

  // Common functions
  const addUserProfile = (group) => {
    const newDimension = { dimension: "", content: "" };
    if (group === "A") {
      setUserProfilesA([...userProfilesA, newDimension]);
    } else if (group === "B") {
      setUserProfilesB([...userProfilesB, newDimension]);
    }
  };

  const updateUserProfile = (group, index, field, value) => {
    if (group === "A") {
      const profiles = [...userProfilesA];
      profiles[index][field] = value;
      setUserProfilesA(profiles);
    } else if (group === "B") {
      const profiles = [...userProfilesB];
      profiles[index][field] = value;
      setUserProfilesB(profiles);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Save designer notes for Group A
  const saveDesignerNotes = async () => {
    if (!currentDocIdA || !designerNotes.trim()) return;
    
    setSavingNotes(true);
    
    try {
      const docRef = doc(db, "groupA", currentDocIdA);
      await updateDoc(docRef, {
        designerNotes: designerNotes
      });
      
      // Show visual feedback that save was successful
      setTimeout(() => {
        setSavingNotes(false);
      }, 1000);
    } catch (error) {
      console.error("Error saving notes:", error);
      setSavingNotes(false);
    }
  };
  
  // Save user evaluation for Group C
  const saveUserEvaluation = async () => {
    if (!currentDocIdC || !userEvaluation.trim()) return;
    
    setSavingEvaluation(true);
    
    try {
      const docRef = doc(db, "groupC", currentDocIdC);
      await updateDoc(docRef, {
        userEvaluation: userEvaluation,
        evaluationTimestamp: new Date()
      });
      
      // Show visual feedback that save was successful
      setTimeout(() => {
        setSavingEvaluation(false);
      }, 1000);
    } catch (error) {
      console.error("Error saving evaluation:", error);
      setSavingEvaluation(false);
    }
  };

  // Design guide generation
  const generateDesignGuide = async (group) => {
    let states;
    if (group === "A") {
      states = {
        apiKey: apiKeyA,
        designerGoal: designerGoalA,
        userProfiles: userProfilesA,
        customPrompt: customPromptA,
        setLoading: setLoadingA,
        setDesignGuide: setDesignGuideA,
        setCurrentDocId: setCurrentDocIdA,
        temperature: temperatureA,
        maxTokens: maxTokensA,
        topP: topPA
      };
    } else if (group === "B") {
      states = {
        apiKey: apiKeyB,
        designerGoal: designerGoalB,
        userProfiles: userProfilesB,
        customPrompt: customPromptB,
        setLoading: setLoadingB,
        setDesignGuide: setDesignGuideB,
        setCurrentDocId: setCurrentDocIdB,
        temperature: temperatureB,
        maxTokens: maxTokensB,
        topP: topPB
      };
    } else {
      states = {
        apiKey: apiKeyC,
        designerGoal: designerGoalC,
        userProfile: userProfileC,
        customPrompt: customPromptC,
        setLoading: setLoadingC,
        setDesignGuide: setDesignGuideC,
        setCurrentDocId: setCurrentDocIdC,
        temperature: temperatureC,
        maxTokens: maxTokensC,
        topP: topPC
      };
    }

    if (!states.apiKey) {
      states.setDesignGuide("Please provide OpenAI API Key");
      return;
    }

    states.setLoading(true);
    
    try {
      let profileText;
      let fullPrompt;
      
      if (group === "C") {
        // For Group C, create a digital clone simulation prompt
        fullPrompt = `You are creating a design guide for a digital clone of user "${userIdC}". 
        
Designer Goal: ${states.designerGoal}

User Profile:
${states.userProfile}

Custom Prompt: ${states.customPrompt}

Based on this user profile, generate a comprehensive design guide that would be most suitable for this specific user.`;
      } else {
        profileText = states.userProfiles
          .map(p => `${p.dimension}: ${p.content}`)
          .join("\n");
        
        fullPrompt = `Designer Goal: ${states.designerGoal}\nUser Profiles:\n${profileText}\nCustom Prompt: ${states.customPrompt}`;
      }

      // 添加调试信息
      console.log("API Request:", {
        apiKey: states.apiKey ? states.apiKey.substring(0, 4) + "..." : "not provided", // Only display first few characters to protect the API key
        model: "gpt-4o",
        temperature: states.temperature,
        max_tokens: states.maxTokens,
        group: group
      });
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${states.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "system", content: fullPrompt }],
          temperature: states.temperature,
          max_tokens: states.maxTokens,
          top_p: states.topP
        })
      });

      // 添加细节错误信息处理
      if (!response.ok) {
        const errorText = await response.text().catch(e => "Unable to get error details");
        console.error("API Error details:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        if (response.status === 401) {
          throw new Error(`Authentication failed (401): Please check if your API key is correct and valid`);
        } else {
          throw new Error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      const result = data.choices[0]?.message?.content || "Generation failed";

      states.setDesignGuide(result);
      
      // Store data in Firebase with different structures for different groups
      let docData;
      
      if (group === "A") {
        docData = {
          designerGoal: states.designerGoal,
          userProfiles: states.userProfiles,
          customPrompt: states.customPrompt,
          prompt: fullPrompt,
          result: result,
          timestamp: new Date(),
          temperature: temperatureA,
          maxTokens: maxTokensA,
          topP: topPA,
          designerNotes: designerNotes
        };
      } else if (group === "B") {
        docData = {
          designerGoal: states.designerGoal,
          userProfiles: states.userProfiles,
          customPrompt: states.customPrompt,
          prompt: fullPrompt,
          result: result,
          timestamp: new Date(),
          temperature: temperatureB,
          maxTokens: maxTokensB,
          topP: topPB,
          userFeedback: "",
          suggestedDimensions: ""
        };
      } else if (group === "C") {
        docData = {
          designerGoal: states.designerGoal,
          userProfile: states.userProfile,
          customPrompt: states.customPrompt,
          prompt: fullPrompt,
          result: result,
          timestamp: new Date(),
          temperature: temperatureC,
          maxTokens: maxTokensC,
          topP: topPC,
          userId: userIdC,
          userEvaluation: ""
        };
      }

      const collectionRef = collection(db, `group${group}`);
      const docRef = await addDoc(collectionRef, docData);
      states.setCurrentDocId(docRef.id);
      
    } catch (error) {
      console.error("API Error:", error);
      states.setDesignGuide(`Error: ${error.message}`);
    } finally {
      states.setLoading(false);
    }
  };

  // Generate suggested dimensions
  const generateSuggestedDimensions = async () => {
    if (!userFeedback.trim() || !apiKeyB) {
      setSuggestedDimensions("Please provide feedback and API key");
      return;
    }

    if (!currentDocIdB) {
      setSuggestedDimensions("No design guide generated yet. Please generate a design guide first.");
      return;
    }

    setLoadingB(true);
    try {
      // 添加调试日志
      console.log("Generate Suggested Dimensions - API Request:", {
        apiKey: apiKeyB ? apiKeyB.substring(0, 4) + "..." : "not provided",
        feedback: userFeedback ? userFeedback.substring(0, 20) + "..." : "empty"
      });
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeyB}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{
            role: "system",
            content: `Analyze the following user feedback and extract relevant user dimension phrases.

User Feedback: "${userFeedback}"

Extract dimensions that the user actually mentions or cares about (such as "Space Preference", "Functionality Requirements", "Aesthetic Preference", "Technology Acceptance", etc.).
Each dimension should:
1. Be directly extracted from the user's feedback
2. Be concise (2-3 words)
3. Reflect actual aspects that the user is concerned about

Return ONLY the dimension phrases, one per line, without explanations, numbering, or additional text.`
          }],
          temperature: temperatureB,
          max_tokens: maxTokensB,
          top_p: topPB
        })
      });

      // 添加细节错误信息处理
      if (!response.ok) {
        const errorText = await response.text().catch(e => "Unable to get error details");
        console.error("Suggest Dimensions API Error details:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        if (response.status === 401) {
          throw new Error(`Authentication failed (401): Please check if your API key is correct and valid`);
        } else {
          throw new Error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      const dimensions = data.choices[0]?.message?.content || "Generation failed";
      
      setSuggestedDimensions(dimensions);
      
      // Update the existing group B document instead of creating a new one
      const docRef = doc(db, "groupB", currentDocIdB);
      await updateDoc(docRef, {
        userFeedback: userFeedback,
        suggestedDimensions: dimensions,
        feedbackTimestamp: new Date()
      });
    } catch (error) {
      console.error("Generation failed:", error);
      setSuggestedDimensions(`Error: ${error.message}`);
    } finally {
      setLoadingB(false);
    }
  };

  // UI Components
  const renderGroupA = () => (
    <>
      <div className="left-section">
        <h2>Designer Goal</h2>
        <textarea
          placeholder="Enter AI designer goal..."
          value={designerGoalA}
          onChange={(e) => setDesignerGoalA(e.target.value)}
        />
        <h2>User Dimensions</h2>
        {userProfilesA.map((profile, index) => (
          <div key={index} className="user-profile-container">
            <input
              className="user-dimension"
              value={profile.dimension}
              onChange={(e) => updateUserProfile("A", index, "dimension", e.target.value)}
              placeholder="Dimension name"
            />
            <textarea
              className="user-content"
              value={profile.content}
              onChange={(e) => updateUserProfile("A", index, "content", e.target.value)}
              placeholder="Dimension content..."
            />
          </div>
        ))}
        <button className="small-button" onClick={() => addUserProfile("A")}>
          Add Dimension
        </button>
        <h2>Custom Prompt</h2>
        <textarea
          placeholder="Enter custom prompt..."
          value={customPromptA}
          onChange={(e) => setCustomPromptA(e.target.value)}
        />
        <h2>OpenAI API Key</h2>
        <input
          type="password"
          placeholder="Enter API key..."
          value={apiKeyA}
          onChange={(e) => setApiKeyA(e.target.value)}
        />
        <button 
          className="full-width generate-button"
          onClick={() => generateDesignGuide("A")}
          disabled={loadingA}
        >
          {loadingA ? "Generating..." : "Generate Design Guide"}
        </button>
      </div>

      <div className="right-section expanded">
        <h2 className="guide-header">
          Design Guide
          <button 
            className="copy-button" 
            onClick={() => copyToClipboard(designGuideA)}
          >
            Copy
          </button>
        </h2>
        <textarea 
          className="design-guide-box"
          readOnly
          value={designGuideA}
          placeholder="Generated content will appear here..."
        />

        <h2 className="notes-header">
          Expert Notes
          <button 
            className={`copy-button ${savingNotes ? 'saving' : ''}`}
            onClick={saveDesignerNotes}
            disabled={savingNotes}
          >
            {savingNotes ? "Saving..." : "Save"}
          </button>
        </h2>
        <textarea
          className="notes-box"
          placeholder="Enter expert notes..."
          value={designerNotes}
          onChange={(e) => setDesignerNotes(e.target.value)}
        />
      </div>
    </>
  );

  const renderGroupB = () => (
    <>
      <div className="left-section">
        <h2>Designer Goal</h2>
        <textarea
          placeholder="Enter AI designer goal..."
          value={designerGoalB}
          onChange={(e) => setDesignerGoalB(e.target.value)}
        />
        <h2>User Dimensions</h2>
        {userProfilesB.map((profile, index) => (
          <div key={index} className="user-profile-container">
            <input
              className="user-dimension"
              value={profile.dimension}
              onChange={(e) => updateUserProfile("B", index, "dimension", e.target.value)}
              placeholder="Dimension name"
            />
            <textarea
              className="user-content"
              value={profile.content}
              onChange={(e) => updateUserProfile("B", index, "content", e.target.value)}
              placeholder="Dimension content..."
            />
          </div>
        ))}
        <button className="small-button" onClick={() => addUserProfile("B")}>
          Add Dimension
        </button>
        <h2>Custom Prompt</h2>
        <textarea
          placeholder="Enter custom prompt..."
          value={customPromptB}
          onChange={(e) => setCustomPromptB(e.target.value)}
        />
        <h2>OpenAI API Key</h2>
        <input
          type="password"
          placeholder="Enter API key..."
          value={apiKeyB}
          onChange={(e) => setApiKeyB(e.target.value)}
        />
        <button 
          className="full-width generate-button"
          onClick={() => generateDesignGuide("B")}
          disabled={loadingB}
        >
          {loadingB ? "Generating..." : "Generate Design Guide"}
        </button>
      </div>

      <div className="right-section expanded">
        <h2 className="guide-header">
          Design Guide
          <button 
            className="copy-button" 
            onClick={() => copyToClipboard(designGuideB)}
          >
            Copy
          </button>
        </h2>
        <textarea 
          className="design-guide-box"
          readOnly
          value={designGuideB}
          placeholder="Generated content will appear here..."
        />

        <div className="feedback-section">
          <h2 className="feedback-header">User Feedback</h2>
          <textarea
            className="feedback-box"
            placeholder="Enter your feedback..."
            value={userFeedback}
            onChange={(e) => setUserFeedback(e.target.value)}
          />
          <button 
            className="generate-dimensions-button" 
            onClick={generateSuggestedDimensions}
            disabled={loadingB}
          >
            {loadingB ? "Generating..." : "Suggest New Dimensions"}
          </button>
          
          <h2 className="suggested-dimensions-header">Suggested Dimensions</h2>
          <textarea
            className="suggested-dimensions-box"
            readOnly
            value={suggestedDimensions}
            placeholder="Short dimension phrases will appear here (one per line)..."
          />
        </div>
      </div>
    </>
  );
  
  const renderGroupC = () => (
    <>
      <div className="left-section">
        <h2>Digital Clone User ID</h2>
        <input
          placeholder="Enter user ID (e.g. B1, B2, B3, etc.)..."
          value={userIdC}
          onChange={(e) => setUserIdC(e.target.value)}
          className="full-width"
        />
        
        <h2>Designer Goal</h2>
        <textarea
          placeholder="Enter AI designer goal..."
          value={designerGoalC}
          onChange={(e) => setDesignerGoalC(e.target.value)}
        />
        
        <h2>User Profile</h2>
        <textarea
          className="user-profile-box"
          placeholder="Enter complete user profile information..."
          value={userProfileC}
          onChange={(e) => setUserProfileC(e.target.value)}
        />
        
        <h2>Custom Prompt</h2>
        <textarea
          placeholder="Enter custom prompt..."
          value={customPromptC}
          onChange={(e) => setCustomPromptC(e.target.value)}
        />
        
        <h2>OpenAI API Key</h2>
        <input
          type="password"
          placeholder="Enter API key..."
          value={apiKeyC}
          onChange={(e) => setApiKeyC(e.target.value)}
        />
        <button 
          className="full-width generate-button"
          onClick={() => generateDesignGuide("C")}
          disabled={loadingC}
        >
          {loadingC ? "Generating..." : "Generate Digital Clone Design Guide"}
        </button>
      </div>

      <div className="right-section expanded">
        <h2 className="guide-header">
          Design Guide for Digital Clone {userIdC || "User"}
          <button 
            className="copy-button" 
            onClick={() => copyToClipboard(designGuideC)}
          >
            Copy
          </button>
        </h2>
        <textarea 
          className="design-guide-box"
          readOnly
          value={designGuideC}
          placeholder="Generated design guide for digital clone will appear here..."
        />

        <h2 className="evaluation-header">
          Real User Evaluation
          <button 
            className={`copy-button ${savingEvaluation ? 'saving' : ''}`}
            onClick={saveUserEvaluation}
            disabled={savingEvaluation}
          >
            {savingEvaluation ? "Saving..." : "Save"}
          </button>
        </h2>
        <textarea
          className="notes-box"
          placeholder="Enter real user's evaluation of this digital clone's design guide..."
          value={userEvaluation}
          onChange={(e) => setUserEvaluation(e.target.value)}
        />
      </div>
    </>
  );

  return (
    <div className="app-container">
      <h1 className="page-title">Human-AI Collaborative Method for Future-Oriented Design Prompt System</h1>
      
      <div className="layout-container">
        <div className="group-selector">
          <button 
            className={`group-button ${activeGroup === "A" ? "active" : ""}`} 
            onClick={() => setActiveGroup("A")}
          >
            Group A (with Design Expert)
          </button>
          <button 
            className={`group-button ${activeGroup === "B" ? "active" : ""}`} 
            onClick={() => setActiveGroup("B")}
          >
            Group B (without Design Expert)
          </button>
          <button 
            className={`group-button ${activeGroup === "C" ? "active" : ""}`} 
            onClick={() => setActiveGroup("C")}
          >
            Group C (Silicon Sample)
          </button>
        </div>
        
        <div className="container">
          {activeGroup === "A" 
            ? renderGroupA() 
            : activeGroup === "B" 
              ? renderGroupB() 
              : renderGroupC()
          }
        </div>
      </div>

      <style>
        {`
          /* ✅ 解决背景白色问题 */
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: #121212;
            color: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .page-title {
            text-align: center;
            font-size: 18px;
            margin-top: 10px;
            color: #bb86fc;
          }

          .layout-container {
            display: flex;
            flex-direction: column;
            width: 95vw;
            height: 95vh;
          }

          .group-selector {
            display: flex;
            justify-content: flex-start;
            margin-bottom: 10px;
          }

          .group-button {
            background: #333;
            color: white;
            border: none;
            border-radius: 5px 5px 0 0;
            cursor: pointer;
            padding: 10px 15px;
            margin-right: 5px;
          }

          .group-button.active {
            background: #bb86fc;
          }

          .container {
            display: flex;
            flex: 1;
            background: #1e1e1e;
            border-radius: 10px;
            overflow: hidden;
          }

          .left-section, .right-section.expanded {
            width: 50%;
            display: flex;
            flex-direction: column;
            padding: 20px;
            overflow-y: auto;
          }

          .user-profile-container {
            display: flex;
            flex-direction: row;
            gap: 20px;
            margin-bottom: 12px;
          }

          .user-dimension {
            width: 40%;
          }

          .user-content {
            width: 60%;
          }

          .generate-button, .small-button, .copy-button, .generate-dimensions-button {
            background: #bb86fc; 
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            padding: 8px 12px;
            margin-bottom: 15px;
          }

          .generate-button:disabled, .generate-dimensions-button:disabled, .copy-button.saving {
            background: #666;
            cursor: not-allowed;
          }
          
          .copy-button.saving:after {
            content: '';
            display: inline-block;
            width: 8px;
            height: 8px;
            margin-left: 5px;
            border-radius: 50%;
            background-color: #fff;
            animation: pulse 1s infinite;
          }
          
          @keyframes pulse {
            0% { opacity: 0.3; }
            50% { opacity: 1; }
            100% { opacity: 0.3; }
          }

          .small-button {
            width: 40%;
          }

          .copy-button {
            font-size: 14px;
            padding: 5px 10px;
            background: #bb86fc;
          }

          .design-guide-box {
            flex-grow: 1;
            min-height: 300px;
            margin-bottom: 15px;
          }

          .notes-box, .feedback-box, .suggested-dimensions-box {
            min-height: 80px;
            margin-bottom: 15px;
          }

          .feedback-section {
            display: flex;
            flex-direction: column;
          }

          h2 {
            color: #bb86fc;
            margin-bottom: 10px;
          }

          textarea, input {
            padding: 8px;
            border: none;
            border-radius: 5px;
            background: #333;
            color: #fff;
            margin-bottom: 10px;
          }

          input:focus, textarea:focus {
            outline: 1px solid #bb86fc;
          }

          .full-width {
            width: 100%;
          }
          
          .user-profile-box {
            min-height: 150px;
            margin-bottom: 15px;
          }
        `}
      </style>
    </div>
  );
}

export default App;