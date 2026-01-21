import { useState, useEffect, useCallback } from 'react'
import './App.css'

// ==================== 共用邏輯 ====================

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // 橫排
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // 直列
  [0, 4, 8], [2, 4, 6], // 對角線
]

function checkWinner(board) {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }
  return null
}

function checkDraw(board) {
  return board.every(cell => cell !== null) && !checkWinner(board)
}

function getWinningLine(board) {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return combo
    }
  }
  return []
}

// ==================== AI 邏輯 ====================

function minimax(board, depth, isMaximizing, alpha, beta, aiSymbol, playerSymbol) {
  const winner = checkWinner(board)
  if (winner === aiSymbol) return 10 - depth
  if (winner === playerSymbol) return depth - 10
  if (checkDraw(board)) return 0

  if (isMaximizing) {
    let maxEval = -Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiSymbol
        const evaluation = minimax(board, depth + 1, false, alpha, beta, aiSymbol, playerSymbol)
        board[i] = null
        maxEval = Math.max(maxEval, evaluation)
        alpha = Math.max(alpha, evaluation)
        if (beta <= alpha) break
      }
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = playerSymbol
        const evaluation = minimax(board, depth + 1, true, alpha, beta, aiSymbol, playerSymbol)
        board[i] = null
        minEval = Math.min(minEval, evaluation)
        beta = Math.min(beta, evaluation)
        if (beta <= alpha) break
      }
    }
    return minEval
  }
}

function getBestMove(board, aiSymbol, playerSymbol) {
  let bestMove = -1
  let bestValue = -Infinity
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = aiSymbol
      const moveValue = minimax(board, 0, false, -Infinity, Infinity, aiSymbol, playerSymbol)
      board[i] = null
      if (moveValue > bestValue) {
        bestValue = moveValue
        bestMove = i
      }
    }
  }
  return bestMove
}

function getRandomMove(board) {
  const available = board.map((cell, i) => cell === null ? i : null).filter(i => i !== null)
  return available[Math.floor(Math.random() * available.length)]
}

function getAIMove(board, difficulty, aiSymbol, playerSymbol) {
  const randomChance = { easy: 0.6, medium: 0.3, hard: 0 }
  if (Math.random() < randomChance[difficulty]) {
    return getRandomMove(board)
  }
  return getBestMove(board, aiSymbol, playerSymbol)
}

// ==================== 經典模式 ====================

function ClassicGame({ onBack, scores, setScores }) {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [status, setStatus] = useState('')
  const [winningLine, setWinningLine] = useState([])
  const [difficulty, setDifficulty] = useState('medium')
  const [playerSymbol, setPlayerSymbol] = useState('X')
  const [gameStarted, setGameStarted] = useState(false)

  const aiSymbol = playerSymbol === 'X' ? 'O' : 'X'
  const playerFirst = playerSymbol === 'X'

  const checkGameStatus = useCallback((currentBoard, currentPlayer) => {
    const winner = checkWinner(currentBoard)
    if (winner) {
      setGameOver(true)
      setWinningLine(getWinningLine(currentBoard))
      if (winner === playerSymbol) {
        setStatus('恭喜你贏了！')
        setScores(s => ({ ...s, player: s.player + 1 }))
      } else {
        setStatus('AI 獲勝！')
        setScores(s => ({ ...s, ai: s.ai + 1 }))
      }
      return true
    }
    if (checkDraw(currentBoard)) {
      setGameOver(true)
      setStatus('平局！')
      setScores(s => ({ ...s, draws: s.draws + 1 }))
      return true
    }
    return false
  }, [playerSymbol, setScores])

  // AI 移動
  useEffect(() => {
    if (gameStarted && !isPlayerTurn && !gameOver) {
      const timer = setTimeout(() => {
        const move = getAIMove([...board], difficulty, aiSymbol, playerSymbol)
        if (move !== -1 && move !== undefined) {
          const newBoard = [...board]
          newBoard[move] = aiSymbol
          setBoard(newBoard)
          if (!checkGameStatus(newBoard)) {
            setIsPlayerTurn(true)
            setStatus('你的回合')
          }
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isPlayerTurn, gameOver, board, difficulty, aiSymbol, playerSymbol, checkGameStatus, gameStarted])

  const startGame = () => {
    setGameStarted(true)
    setBoard(Array(9).fill(null))
    setGameOver(false)
    setWinningLine([])
    if (playerFirst) {
      setIsPlayerTurn(true)
      setStatus('你的回合')
    } else {
      setIsPlayerTurn(false)
      setStatus('AI 思考中...')
    }
  }

  const handleClick = (index) => {
    if (!gameStarted || board[index] || !isPlayerTurn || gameOver) return
    const newBoard = [...board]
    newBoard[index] = playerSymbol
    setBoard(newBoard)
    if (!checkGameStatus(newBoard)) {
      setIsPlayerTurn(false)
      setStatus('AI 思考中...')
    }
  }

  const resetGame = () => {
    setGameStarted(false)
    setBoard(Array(9).fill(null))
    setGameOver(false)
    setWinningLine([])
    setStatus('')
  }

  if (!gameStarted) {
    return (
      <div className="game">
        <h1>經典模式</h1>

        <div className="settings-panel">
          <div className="setting-group">
            <label>選擇難度</label>
            <div className="button-group">
              {[
                { key: 'easy', label: '簡單' },
                { key: 'medium', label: '中等' },
                { key: 'hard', label: '困難' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`option-btn ${difficulty === key ? 'active' : ''}`}
                  onClick={() => setDifficulty(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <label>選擇先手</label>
            <div className="button-group">
              <button
                className={`option-btn ${playerSymbol === 'X' ? 'active' : ''}`}
                onClick={() => setPlayerSymbol('X')}
              >
                玩家先手 (X)
              </button>
              <button
                className={`option-btn ${playerSymbol === 'O' ? 'active' : ''}`}
                onClick={() => setPlayerSymbol('O')}
              >
                AI 先手 (X)
              </button>
            </div>
          </div>

          <div className="scoreboard">
            <h3>計分板</h3>
            <div className="scores">
              <div className="score-item player">
                <span>玩家</span>
                <span className="score-num">{scores.player}</span>
              </div>
              <div className="score-item draws">
                <span>平局</span>
                <span className="score-num">{scores.draws}</span>
              </div>
              <div className="score-item ai">
                <span>AI</span>
                <span className="score-num">{scores.ai}</span>
              </div>
            </div>
          </div>

          <button className="start-btn" onClick={startGame}>
            開始遊戲
          </button>
          <button className="back-btn" onClick={onBack}>
            返回主選單
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="game">
      <h1>經典模式</h1>
      <p className="subtitle">
        難度: {difficulty === 'easy' ? '簡單' : difficulty === 'medium' ? '中等' : '困難'}
      </p>

      <div className="scoreboard mini">
        <span className="player">玩家: {scores.player}</span>
        <span className="draws">平局: {scores.draws}</span>
        <span className="ai">AI: {scores.ai}</span>
      </div>

      <div className="status">{status}</div>

      <div className="board">
        {board.map((value, index) => (
          <button
            key={index}
            className={`square ${value || ''} ${winningLine.includes(index) ? 'winning' : ''}`}
            onClick={() => handleClick(index)}
            disabled={!isPlayerTurn || gameOver || board[index]}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="game-buttons">
        <button className="reset-button" onClick={resetGame}>
          重新設定
        </button>
        {gameOver && (
          <button className="start-btn" onClick={startGame}>
            再玩一局
          </button>
        )}
      </div>

      <div className="info">
        <p>你是 <span className={playerSymbol}>{playerSymbol}</span>，AI 是 <span className={aiSymbol}>{aiSymbol}</span></p>
      </div>
    </div>
  )
}

// ==================== 超級井字遊戲 ====================

function UltimateGame({ onBack, scores, setScores }) {
  const [boards, setBoards] = useState(Array(9).fill(null).map(() => Array(9).fill(null)))
  const [boardWinners, setBoardWinners] = useState(Array(9).fill(null))
  const [activeBoard, setActiveBoard] = useState(null) // null = 可以下任何棋盤
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [status, setStatus] = useState('你的回合 - 選擇任意格子')
  const [difficulty, setDifficulty] = useState('medium')
  const [playerSymbol, setPlayerSymbol] = useState('X')
  const [gameStarted, setGameStarted] = useState(false)
  const [winningBoards, setWinningBoards] = useState([])

  const aiSymbol = playerSymbol === 'X' ? 'O' : 'X'
  const playerFirst = playerSymbol === 'X'

  const checkUltimateWinner = useCallback((winners) => {
    return checkWinner(winners)
  }, [])

  const checkUltimateDraw = useCallback((winners) => {
    return winners.every(w => w !== null) && !checkWinner(winners)
  }, [])

  // AI 移動
  useEffect(() => {
    if (gameStarted && !isPlayerTurn && !gameOver) {
      const timer = setTimeout(() => {
        // 找出可下的位置
        const validMoves = []
        for (let b = 0; b < 9; b++) {
          if (boardWinners[b]) continue
          if (activeBoard !== null && activeBoard !== b) continue
          for (let c = 0; c < 9; c++) {
            if (boards[b][c] === null) {
              validMoves.push({ board: b, cell: c })
            }
          }
        }

        if (validMoves.length === 0) return

        let move
        const randomChance = { easy: 0.7, medium: 0.4, hard: 0.1 }

        if (Math.random() < randomChance[difficulty]) {
          // 隨機移動
          move = validMoves[Math.floor(Math.random() * validMoves.length)]
        } else {
          // 簡單策略：優先佔據中心、角落
          const priorities = [4, 0, 2, 6, 8, 1, 3, 5, 7]
          move = validMoves[0]
          for (const priority of priorities) {
            const found = validMoves.find(m => m.cell === priority)
            if (found) {
              move = found
              break
            }
          }
        }

        makeMove(move.board, move.cell, aiSymbol)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [isPlayerTurn, gameOver, boards, boardWinners, activeBoard, difficulty, aiSymbol, gameStarted])

  const makeMove = (boardIndex, cellIndex, symbol) => {
    const newBoards = boards.map(b => [...b])
    newBoards[boardIndex][cellIndex] = symbol
    setBoards(newBoards)

    // 檢查小棋盤獲勝
    const newBoardWinners = [...boardWinners]
    if (!newBoardWinners[boardIndex]) {
      const winner = checkWinner(newBoards[boardIndex])
      if (winner) {
        newBoardWinners[boardIndex] = winner
        setBoardWinners(newBoardWinners)
      } else if (checkDraw(newBoards[boardIndex])) {
        newBoardWinners[boardIndex] = 'D' // 平局標記
        setBoardWinners(newBoardWinners)
      }
    }

    // 檢查大棋盤獲勝
    const ultimateWinner = checkUltimateWinner(newBoardWinners.map(w => w === 'D' ? null : w))
    if (ultimateWinner) {
      setGameOver(true)
      setWinningBoards(getWinningLine(newBoardWinners.map(w => w === 'D' ? null : w)))
      if (ultimateWinner === playerSymbol) {
        setStatus('恭喜你贏了！')
        setScores(s => ({ ...s, player: s.player + 1 }))
      } else {
        setStatus('AI 獲勝！')
        setScores(s => ({ ...s, ai: s.ai + 1 }))
      }
      return
    }

    // 檢查大棋盤平局
    if (checkUltimateDraw(newBoardWinners)) {
      setGameOver(true)
      setStatus('平局！')
      setScores(s => ({ ...s, draws: s.draws + 1 }))
      return
    }

    // 設定下一個活動棋盤
    const nextBoard = cellIndex
    if (newBoardWinners[nextBoard] || newBoards[nextBoard].every(c => c !== null)) {
      setActiveBoard(null) // 可以下任何棋盤
    } else {
      setActiveBoard(nextBoard)
    }

    // 切換回合
    const nextIsPlayer = symbol === aiSymbol
    setIsPlayerTurn(nextIsPlayer)
    if (nextIsPlayer) {
      setStatus(activeBoard === null || newBoardWinners[nextBoard] || newBoards[nextBoard].every(c => c !== null)
        ? '你的回合 - 選擇任意格子'
        : `你的回合 - 請在棋盤 ${nextBoard + 1} 下棋`)
    } else {
      setStatus('AI 思考中...')
    }
  }

  const handleClick = (boardIndex, cellIndex) => {
    if (!gameStarted || !isPlayerTurn || gameOver) return
    if (boards[boardIndex][cellIndex]) return
    if (boardWinners[boardIndex]) return
    if (activeBoard !== null && activeBoard !== boardIndex) return

    makeMove(boardIndex, cellIndex, playerSymbol)
  }

  const startGame = () => {
    setGameStarted(true)
    setBoards(Array(9).fill(null).map(() => Array(9).fill(null)))
    setBoardWinners(Array(9).fill(null))
    setActiveBoard(null)
    setGameOver(false)
    setWinningBoards([])
    if (playerFirst) {
      setIsPlayerTurn(true)
      setStatus('你的回合 - 選擇任意格子')
    } else {
      setIsPlayerTurn(false)
      setStatus('AI 思考中...')
    }
  }

  const resetGame = () => {
    setGameStarted(false)
    setBoards(Array(9).fill(null).map(() => Array(9).fill(null)))
    setBoardWinners(Array(9).fill(null))
    setActiveBoard(null)
    setGameOver(false)
    setWinningBoards([])
    setStatus('')
  }

  if (!gameStarted) {
    return (
      <div className="game">
        <h1>超級井字遊戲</h1>
        <p className="rules">
          9個小棋盤組成大棋盤。你下的位置決定對手要下哪個小棋盤。
          <br />贏得3個一線的小棋盤即可獲勝！
        </p>

        <div className="settings-panel">
          <div className="setting-group">
            <label>選擇難度</label>
            <div className="button-group">
              {[
                { key: 'easy', label: '簡單' },
                { key: 'medium', label: '中等' },
                { key: 'hard', label: '困難' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`option-btn ${difficulty === key ? 'active' : ''}`}
                  onClick={() => setDifficulty(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <label>選擇先手</label>
            <div className="button-group">
              <button
                className={`option-btn ${playerSymbol === 'X' ? 'active' : ''}`}
                onClick={() => setPlayerSymbol('X')}
              >
                玩家先手 (X)
              </button>
              <button
                className={`option-btn ${playerSymbol === 'O' ? 'active' : ''}`}
                onClick={() => setPlayerSymbol('O')}
              >
                AI 先手 (X)
              </button>
            </div>
          </div>

          <div className="scoreboard">
            <h3>計分板</h3>
            <div className="scores">
              <div className="score-item player">
                <span>玩家</span>
                <span className="score-num">{scores.player}</span>
              </div>
              <div className="score-item draws">
                <span>平局</span>
                <span className="score-num">{scores.draws}</span>
              </div>
              <div className="score-item ai">
                <span>AI</span>
                <span className="score-num">{scores.ai}</span>
              </div>
            </div>
          </div>

          <button className="start-btn" onClick={startGame}>
            開始遊戲
          </button>
          <button className="back-btn" onClick={onBack}>
            返回主選單
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="game ultimate">
      <h1>超級井字遊戲</h1>

      <div className="scoreboard mini">
        <span className="player">玩家: {scores.player}</span>
        <span className="draws">平局: {scores.draws}</span>
        <span className="ai">AI: {scores.ai}</span>
      </div>

      <div className="status">{status}</div>

      <div className="ultimate-board">
        {boards.map((smallBoard, boardIndex) => (
          <div
            key={boardIndex}
            className={`small-board
              ${boardWinners[boardIndex] ? `won ${boardWinners[boardIndex]}` : ''}
              ${winningBoards.includes(boardIndex) ? 'ultimate-winning' : ''}
              ${!gameOver && activeBoard === null && !boardWinners[boardIndex] ? 'active' : ''}
              ${!gameOver && activeBoard === boardIndex ? 'active' : ''}
            `}
          >
            {boardWinners[boardIndex] && boardWinners[boardIndex] !== 'D' ? (
              <div className="board-winner">{boardWinners[boardIndex]}</div>
            ) : (
              smallBoard.map((cell, cellIndex) => (
                <button
                  key={cellIndex}
                  className={`mini-square ${cell || ''}`}
                  onClick={() => handleClick(boardIndex, cellIndex)}
                  disabled={
                    !isPlayerTurn ||
                    gameOver ||
                    cell !== null ||
                    boardWinners[boardIndex] ||
                    (activeBoard !== null && activeBoard !== boardIndex)
                  }
                >
                  {cell}
                </button>
              ))
            )}
          </div>
        ))}
      </div>

      <div className="game-buttons">
        <button className="reset-button" onClick={resetGame}>
          重新設定
        </button>
        {gameOver && (
          <button className="start-btn" onClick={startGame}>
            再玩一局
          </button>
        )}
      </div>

      <div className="info">
        <p>你是 <span className={playerSymbol}>{playerSymbol}</span>，AI 是 <span className={aiSymbol}>{aiSymbol}</span></p>
      </div>
    </div>
  )
}

// ==================== 主選單 ====================

function MainMenu({ onSelectMode }) {
  return (
    <div className="game menu">
      <h1>井字遊戲</h1>
      <p className="subtitle">選擇遊戲模式</p>

      <div className="menu-buttons">
        <button className="menu-btn classic" onClick={() => onSelectMode('classic')}>
          <span className="menu-icon">⊞</span>
          <span className="menu-title">經典模式</span>
          <span className="menu-desc">3x3 棋盤，可調整 AI 難度</span>
        </button>

        <button className="menu-btn ultimate" onClick={() => onSelectMode('ultimate')}>
          <span className="menu-icon">⊞⊞⊞</span>
          <span className="menu-title">超級井字遊戲</span>
          <span className="menu-desc">9 個棋盤組成的策略遊戲</span>
        </button>
      </div>
    </div>
  )
}

// ==================== 主應用 ====================

function App() {
  const [gameMode, setGameMode] = useState(null) // null, 'classic', 'ultimate'
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 })

  if (!gameMode) {
    return <MainMenu onSelectMode={setGameMode} />
  }

  if (gameMode === 'classic') {
    return (
      <ClassicGame
        onBack={() => setGameMode(null)}
        scores={scores}
        setScores={setScores}
      />
    )
  }

  return (
    <UltimateGame
      onBack={() => setGameMode(null)}
      scores={scores}
      setScores={setScores}
    />
  )
}

export default App
