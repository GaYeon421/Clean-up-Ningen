import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("start");

  const [dirtList, setDirtList] = useState([]);
  const [cleanliness, setCleanliness] = useState(100);
  const [isCleaning, setIsCleaning] = useState(false);
  const [selectedTool, setSelectedTool] = useState("mop");
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [character, setCharacter] = useState({
    x: 45,
    y: 40,
  });

  const characterRef = useRef(character);
  const [gameOver, setGameOver] = useState(false);
  const [graveList, setGraveList] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bestTime, setBestTime] = useState(() => {
    return Number(localStorage.getItem("bestTime")) || 0;
  });
  const [shakeType, setShakeType] = useState("");

  const [popupList, setPopupList] = useState([]);
  const [draggingPopup, setDraggingPopup] = useState(null);
  const [characterMessage, setCharacterMessage] = useState("");

  const wrongSoundRef = useRef(null);
  const cleanSoundRef = useRef(null);
  const popupSoundRef = useRef(null);
  const gameOverSoundRef = useRef(null);
  const bgmRef = useRef(null);
  const [isBgmOn, setIsBgmOn] = useState(true);

  const [particleList, setParticleList] = useState([]);
  const prankType = Math.floor(Math.random() * 3);

  const [cleanedCount, setCleanedCount] = useState(0);

  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    return JSON.parse(localStorage.getItem("achievements")) || [];
  });

  const [achievementPopup, setAchievementPopup] = useState(null);
  const [showAchievementList, setShowAchievementList] = useState(false);

  const [showCreditList, setShowCreditList] = useState(false);

  const restartGame = () => {
    setDirtList([]);
    setPopupList([]);
    setCleanliness(100);
    setElapsedTime(0);
    setCleanedCount(0);
    setGameOver(false);
    setCharacter({ x: 45, y: 40 });

    if (isBgmOn && bgmRef.current) {
      bgmRef.current.currentTime = 0;
      bgmRef.current.play();
    }
  };

  const triggerShake = (type = "medium") => {
    setShakeType(`shake-${type}`);

    setTimeout(() => {
      setShakeType("");
    }, 500);
  };

  const formatTime = (seconds) => {
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");

    return `${min}:${sec}`;
  };

  const getCharacterFace = () => {
    if (cleanliness >= 70) return "😄";
    if (cleanliness >= 45) return "😊";
    if (cleanliness >= 25) return "😟";
    if (cleanliness >= 1) return "🤒";
    return "💀";
  };

  const getToolIcon = () => {
    if (selectedTool === "mop") return "🧽";
    if (selectedTool === "trash") return "🗑️";
    if (selectedTool === "glue") return "🩹";
    return "🧽";
  };

  const achievements = [
    {
      id: "survive30",
      icon: "🏆",
      name: "첫 생존자",
      description: "30초 버티기",
      condition: () => elapsedTime >= 30,
    },
    {
      id: "survive60",
      icon: "⏱️",
      name: "끈질긴 인간",
      description: "1분 버티기",
      condition: () => elapsedTime >= 60,
    },
    {
      id: "clean50",
      icon: "🧽",
      name: "청소 장인",
      description: "오염물 50개 제거",
      condition: () => cleanedCount >= 50,
    },
    {
      id: "clean100",
      icon: "🧽",
      name: "청소 달인",
      description: "오염물 100개 제거",
      condition: () => cleanedCount >= 100,
    },
    {
      id: "dangerSurvivor",
      icon: "⚠️",
      name: "위기관리왕",
      description: "청결도 10% 이하 도달",
      condition: () => cleanliness <= 10 && screen === "play" && !gameOver,
    },
    {
      id: "survive180",
      icon: "👑",
      name: "불굴의 의지",
      description: "3분 버티기",
      condition: () => elapsedTime >= 180,
    },
    {
      id: "survive600",
      icon: "👑",
      name: "정녕 인간인가",
      description: "10분 버티기",
      condition: () => elapsedTime >= 600,
    },
  ];

  useEffect(() => {
    characterRef.current = character;
  }, [character]);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      if (gameOver || screen !== "play") return;
      setCharacter({
        x: Math.random() * 80 + 5,
        y: Math.random() * 65 + 5,
      });
    }, 1500);

    return () => clearInterval(moveInterval);
  }, [gameOver, screen]);

  useEffect(() => {
    const dirtInterval = setInterval(() => {
      if (gameOver || screen !== "play") return;
      const currentCharacter = characterRef.current;

      const randomX = currentCharacter.x + (Math.random() * 16 - 8);
      const randomY = currentCharacter.y + (Math.random() * 16 - 8);

      const dirtTypes = [
        {
          type: "dust",
          icon: "🟤",
          tool: "mop",
          hp: 8,
        },
        {
          type: "trash",
          icon: "🫙",
          tool: "trash",
          hp: 1,
        },
        {
          type: "crack",
          icon: "⚡",
          tool: "glue",
          hp: 6,
        },
      ];

      const randomType = dirtTypes[Math.floor(Math.random() * dirtTypes.length)];

      const newDirt = {
        id: Date.now() + Math.random(),
        x: Math.min(Math.max(randomX, 0), 90),
        y: Math.min(Math.max(randomY, 0), 85),
        type: randomType.type,
        icon: randomType.icon,
        requiredTool: randomType.tool,
        hp: randomType.hp,
        maxHp: randomType.hp,
        lastScrubTime: 0,
      };

      setDirtList((prev) => [...prev, newDirt]);
    }, 2000);

    return () => clearInterval(dirtInterval);
  }, [gameOver, screen]);

  useEffect(() => {
    const dirtPenalty = dirtList.reduce((total, dirt) => {
      if (dirt.type === "dust") return total + 3;
      if (dirt.type === "trash") return total + 5;
      if (dirt.type === "crack") return total + 7;
      return total;
    }, 0);

    const newCleanliness = Math.max(100 - dirtPenalty, 0);

    setCleanliness(newCleanliness);
  }, [dirtList]);

  useEffect(() => {
    if (cleanliness <= 0 && !gameOver) {

      bgmRef.current?.pause();

      playSound(gameOverSoundRef);

      triggerShake("heavy");

      if (elapsedTime > bestTime) {
        localStorage.setItem("bestTime", elapsedTime);
        setBestTime(elapsedTime);
      }

      setGameOver(true);

      setGraveList((prev) => [
        ...prev,
        {
          id: Date.now(),
          x: 3 + prev.length * 4,
          y: 82,
        },
      ]);
    }
  }, [cleanliness, gameOver]);

  useEffect(() => {
    const popupInterval = setInterval(() => {
      if (gameOver || screen !== "play") return;

      const messages = [
        "놀아줘!",
        "청소하지 마!",
        "나 안 더러운데?",
        "이거 내 작품이야!",
        "어지르는 중...",
        "닫지 마!",
      ];

      const newPopup = {
        id: Date.now() + Math.random(),
        x: Math.random() * 65 + 10,
        y: Math.random() * 55 + 10,
        message: messages[Math.floor(Math.random() * messages.length)],
      };

      setPopupList((prev) => [...prev, newPopup]);

      playSound(popupSoundRef);

      triggerShake("light");
    }, 5000);

    return () => clearInterval(popupInterval);
  }, [gameOver, screen]);

  const startDragPopup = (id) => {
    setDraggingPopup(id);
  };

  useEffect(() => {
    if (screen !== "play" || gameOver) return;

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, gameOver]);

  useEffect(() => {
    if (screen !== "play" || gameOver) return;
    if (cleanliness > 20) return;

    const shakeInterval = setInterval(() => {
      triggerShake("heavy");
    }, 1500);

    return () => clearInterval(shakeInterval);
  }, [cleanliness, screen, gameOver]);

  useEffect(() => {
    wrongSoundRef.current = new Audio("/sounds/wrong.mp3");
    cleanSoundRef.current = new Audio("/sounds/clean.mp3");
    popupSoundRef.current = new Audio("/sounds/popup.mp3");
    gameOverSoundRef.current = new Audio("/sounds/gameover.mp3");

    wrongSoundRef.current.volume = 0.7;
    cleanSoundRef.current.volume = 0.5;
    popupSoundRef.current.volume = 0.6;
    gameOverSoundRef.current.volume = 0.8;

    bgmRef.current = new Audio("/sounds/bgm.mp3");
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.25;
  }, []);

  useEffect(() => {
    if (screen !== "play" || gameOver) return;

    const prankInterval = setInterval(() => {
      if (Math.random() < 0.4) {
        characterPrank();
      }
    }, 8000);

    return () => clearInterval(prankInterval);
  }, [screen, gameOver]);

  useEffect(() => {
    if (screen !== "play") return;

    achievements.forEach((achievement) => {
      if (
        !unlockedAchievements.includes(achievement.id) &&
        achievement.condition()
      ) {
        unlockAchievement(achievement);
      }
    });
  }, [elapsedTime, cleanedCount, cleanliness, screen, gameOver]);

  const playSound = (soundRef) => {
    if (!soundRef.current) return;

    soundRef.current.currentTime = 0;
    soundRef.current.play().catch((error) => {
      console.log("소리 재생 실패:", error);
    });
  };

  const unlockAchievement = (achievement) => {
    if (unlockedAchievements.includes(achievement.id)) return;

    const newUnlocked = [...unlockedAchievements, achievement.id];

    setUnlockedAchievements(newUnlocked);
    localStorage.setItem("achievements", JSON.stringify(newUnlocked));

    setAchievementPopup(achievement);

    setTimeout(() => {
      setAchievementPopup(null);
    }, 2500);
  };

  const stopDragPopup = () => {
    setDraggingPopup(null);
  };

  const movePopup = (e) => {
    if (!draggingPopup) return;

    const area = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - area.left) / area.width) * 100;
    const y = ((e.clientY - area.top) / area.height) * 100;

    setPopupList((prev) =>
      prev.map((popup) =>
        popup.id === draggingPopup
          ? {
            ...popup,
            x: Math.min(Math.max(x, 0), 80),
            y: Math.min(Math.max(y, 0), 80),
          }
          : popup
      )
    );
  };

  const changeToolPrank = () => {
    const tools = ["mop", "trash", "glue"];
    const randomTool = tools[Math.floor(Math.random() * tools.length)];

    setSelectedTool(randomTool);
    setCharacterMessage("헤헤! 도구 바꿨지롱 😜");
    triggerShake("medium");

    setTimeout(() => {
      setCharacterMessage("");
    }, 1200);
  };

  const dirtBombPrank = () => {
    const dirtTypes = [
      { type: "dust", icon: "🟤", tool: "mop", hp: 8 },
      { type: "trash", icon: "🫙", tool: "trash", hp: 1 },
      { type: "crack", icon: "⚡", tool: "glue", hp: 6 },
    ];

    const dirtCount =
      elapsedTime < 30 ? 4 :
        elapsedTime < 60 ? 6 :
          elapsedTime < 90 ? 8 :
            10;

    const newDirties = Array.from({ length: dirtCount }, () => {
      const randomType = dirtTypes[Math.floor(Math.random() * dirtTypes.length)];

      return {
        id: Date.now() + Math.random(),
        x: Math.random() * 85 + 5,
        y: Math.random() * 75 + 5,
        type: randomType.type,
        icon: randomType.icon,
        requiredTool: randomType.tool,
        hp: randomType.hp,
        maxHp: randomType.hp,
        lastScrubTime: 0,
      };
    });

    setDirtList((prev) => [...prev, ...newDirties]);
    setCharacterMessage("어질러버렸다!! 😈");
    triggerShake("heavy");

    setTimeout(() => {
      setCharacterMessage("");
    }, 1200);
  };

  const characterPrank = () => {
    const prankType = Math.floor(Math.random() * 3);

    if (prankType === 0) {
      changeToolPrank();
    } else if (prankType === 1) {
      dirtBombPrank();
    } else {
      changeToolPrank();
      dirtBombPrank();
    }
  };

  const cleanDirt = (id) => {
    if (gameOver) return;
    if (!isCleaning) return;

    const now = Date.now();

    setDirtList((prev) =>
      prev
        .map((dirt) => {
          if (dirt.id !== id) return dirt;

          if (dirt.requiredTool !== selectedTool) {

            playSound(wrongSoundRef);

            setCharacterMessage("그걸로는 안 닦여!");
            triggerShake("medium");

            setTimeout(() => {
              setCharacterMessage("");
            }, 1200);

            return dirt;
          }

          if (now - dirt.lastScrubTime < 120) {
            return dirt;
          }

          playSound(cleanSoundRef);

          const newHp = dirt.hp - 1;

          if (newHp <= 0) {
            createParticles(dirt.x, dirt.y);
            setCleanedCount((prev) => prev + 1);
          }

          return {
            ...dirt,
            hp: newHp,
            lastScrubTime: now,
          };
        })
        .filter((dirt) => dirt.hp > 0)
    );
  };

  const closePopup = (id) => {
    setPopupList((prev) => prev.filter((popup) => popup.id !== id));
  };

  const createParticles = (x, y) => {
    const newParticles = Array.from({ length: 6 }, () => ({
      id: Date.now() + Math.random(),
      x,
      y,
      dx: Math.random() * 40 - 20,
      dy: Math.random() * 40 - 20,
    }));

    setParticleList((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticleList((prev) =>
        prev.filter((particle) => !newParticles.some((p) => p.id === particle.id))
      );
    }, 600);
  };

  if (screen === "start") {
    return (
      <div className="start-screen">
        <h1 className="game-title">또 어질렀어!</h1>

        <button
          className="sound-button"
          onClick={() => {
            if (!bgmRef.current) return;

            if (isBgmOn) {
              bgmRef.current.pause();
              setIsBgmOn(false);
            } else {
              bgmRef.current.play();
              setIsBgmOn(true);
            }
          }}
        >
          {isBgmOn ? "🔊" : "🔇"}
        </button>

        <div className="start-character">
          😄
        </div>
        <p>어지르는 캐릭터를 돌보며 화면을 깨끗하게 유지하세요!</p>

        <button
          className="start-button"
          onClick={() => {
            setScreen("play");

            if (isBgmOn && bgmRef.current) {
              bgmRef.current.play();
            }
          }}
        >
          시작
        </button>

        <button
          className="achievement-button"
          onClick={() => setShowAchievementList(true)}
        >
          🏆 업적 보기
        </button>

        <button
          className="credit-button"
          onClick={() => setShowCreditList(true)}
        >
          🎵 음원 출처
        </button>

        {showAchievementList && (
          <div className="achievement-list-modal">
            <div className="achievement-list-box">
              <button
                className="achievement-close"
                onClick={() => setShowAchievementList(false)}
              >
                X
              </button>

              <h2>🏆 업적 목록</h2>

              {achievements.map((achievement) => {
                const unlocked = unlockedAchievements.includes(achievement.id);

                return (
                  <div
                    key={achievement.id}
                    className={`achievement-item ${unlocked ? "unlocked" : "locked"}`}
                  >
                    <span>{unlocked ? achievement.icon : "🔒"}</span>
                    <div>
                      <strong>{achievement.name}</strong>
                      <p>{achievement.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showCreditList && (
          <div className="credit-modal">
            <div className="credit-box">
              <button
                className="credit-close"
                onClick={() => setShowCreditList(false)}
              >
                X
              </button>

              <h2>🎵 음원 출처</h2>

              <p>✔ SFX provided by 셀바이뮤직</p>
              <p>🎵 Title : coin</p>
              <p>https://sellbuymusic.com/md/sdontfk-ofhtwkx</p>

              <p>✔ SFX provided by 셀바이뮤직</p>
              <p>🎵 Title : Zap 8</p>
              <p>https://sellbuymusic.com/md/sgontzt-dfhtwkx</p>

              <p>✔ SFX provided by 셀바이뮤직</p>
              <p>🎵 Title : Descending 10</p>
              <p>https://sellbuymusic.com/md/srjnctx-ufhtwkx</p>

              <p>✔ SFX provided by 셀바이뮤직</p>
              <p>🎵 Title : Error 7</p>
              <p>https://sellbuymusic.com/md/spvnfwf-efhtwkx</p>

              <p>✔ Music provided by 셀바이뮤직</p>
              <p>🎵 Title : 뿅뿅뿅울렐레레렐 by SellBuyMusic</p>
              <p>https://sellbuymusic.com/md/mdpztbc-jfhtwkx</p>
            </div>
          </div>
        )}

        <div className="credit">
          Made by 권가연 (@하달다)
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <h1>또 어질렀어!!</h1>

      {achievementPopup && (
        <div className="achievement-popup">
          <div>업적 달성!</div>
          <strong>
            {achievementPopup.icon} {achievementPopup.name}
          </strong>
          <span>{achievementPopup.description}</span>
        </div>
      )}

      <div className="clean-bar-container">
        <div
          className="clean-bar"
          style={{ width: `${cleanliness}%` }}
        ></div>
      </div>

      <p>
        청결도: {cleanliness}% |
        버틴 시간: {formatTime(elapsedTime)} |
        최고 기록: {formatTime(bestTime)}
      </p>

      <div
        className={`game-area ${cleanliness <= 20 ? "danger" : cleanliness <= 40 ? "warning" : ""
          } ${shakeType}`}
        onMouseDown={() => setIsCleaning(true)}
        onMouseUp={() => {
          setIsCleaning(false);
          stopDragPopup();
        }}
        onMouseLeave={() => {
          setIsCleaning(false);
          stopDragPopup();
        }}
        onMouseMove={(e) => {
          const area = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - area.left;
          const y = e.clientY - area.top;

          setCursorPosition({ x, y });
          movePopup(e);
        }}
      >

        {cleanliness <= 20 && !gameOver && (
          <div className="warning-text">
            WARNING
          </div>
        )}

        {/* 캐릭터 */}
        <div
          className="character"
          style={{
            left: `${character.x}%`,
            top: `${character.y}%`,
          }}
        >
          {getCharacterFace()}
        </div>

        {characterMessage && (
          <div
            className="character-bubble"
            style={{
              left: `${character.x + 5}%`,
              top: `${character.y - 8}%`,
            }}
          >
            {characterMessage}
          </div>
        )}

        {/* 무덤 */}
        {graveList.map((grave) => (
          <div
            key={grave.id}
            className="field-grave"
            style={{
              left: `${grave.x}%`,
              top: `${grave.y}%`,
            }}
          >
            🪦
          </div>
        ))}

        {/* 오염물 */}
        {dirtList.map((dirt) => (
          <div
            key={dirt.id}
            className={`dirt ${dirt.type}`}
            style={{
              left: `${dirt.x}%`,
              top: `${dirt.y}%`,
              opacity: dirt.hp / dirt.maxHp,
              transform: `scale(${0.6 + (dirt.hp / dirt.maxHp) * 0.4})`,
            }}
            onMouseMove={() => cleanDirt(dirt.id)}
          >
            {dirt.icon}
          </div>
        ))}

        {/* 청소 효과 파티클 */}
        {particleList.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              "--dx": `${particle.dx}px`,
              "--dy": `${particle.dy}px`,
            }}
          >
            ✨
          </div>
        ))}

        {/* 팝업 메시지 */}
        {popupList.map((popup) => (
          <div
            key={popup.id}
            className="annoying-popup"
            style={{
              left: `${popup.x}%`,
              top: `${popup.y}%`,
            }}
          >
            <div
              className="popup-header"
              onMouseDown={(e) => {
                e.stopPropagation();
                startDragPopup(popup.id);
              }}
            >
              <span>캐릭터 메시지</span>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => closePopup(popup.id)}
              >
                X
              </button>
            </div>
            <p>{popup.message}</p>
          </div>
        ))}

        {!gameOver && (
          <div
            className="tool-cursor"
            style={{
              left: `${cursorPosition.x}px`,
              top: `${cursorPosition.y}px`,
            }}
          >
            {getToolIcon()}
          </div>
        )}

        {gameOver && (
          <div className="game-over">
            <div className="grave">🪦</div>
            <h2>캐릭터가 활동을 멈췄습니다...</h2>
            <p>버틴 시간: {formatTime(elapsedTime)}</p>
            <button onClick={restartGame}>다시 시작</button>
          </div>
        )}
      </div>

      <div className="tool-bar">
        <button
          className={selectedTool === "mop" ? "tool selected" : "tool"}
          onClick={() => setSelectedTool("mop")}
        >
          🧽 걸레
        </button>

        <button
          className={selectedTool === "trash" ? "tool selected" : "tool"}
          onClick={() => setSelectedTool("trash")}
        >
          🗑️ 쓰레기통
        </button>

        <button
          className={selectedTool === "glue" ? "tool selected" : "tool"}
          onClick={() => setSelectedTool("glue")}
        >
          🩹 본드
        </button>
      </div>

      <p>도구를 선택한 뒤, 오염물 위를 문질러 제거하세요!</p>
    </div>
  );
}

export default App;