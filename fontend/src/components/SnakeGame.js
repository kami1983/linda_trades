import React, { useState, useEffect, useCallback } from 'react';
import './SnakeGame.css';

const BOARD_SIZE = 20;
const INITIAL_SNAKE = [{x: 10, y: 10}];
const INITIAL_DIRECTION = {x: 0, y: 0};
const INITIAL_FOOD = {x: 5, y: 5};

const SnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);

  const generateFood = () => {
    const newFood = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE)
    };
    setFood(newFood);
  };

  const moveSnake = useCallback(() => {
    if (!direction.x && !direction.y) return;

    const newSnake = [...snake];
    const head = { 
      x: newSnake[0].x + direction.x,
      y: newSnake[0].y + direction.y
    };

    // Check collision with walls or self
    if (head.x < 0 || head.x >= BOARD_SIZE || 
        head.y < 0 || head.y >= BOARD_SIZE ||
        newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
      setGameOver(true);
      return;
    }

    newSnake.unshift(head);
    
    // Check if snake eats food
    if (head.x === food.x && head.y === food.y) {
      generateFood();
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [snake, direction, food]);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(moveSnake, 100);
    return () => clearInterval(interval);
  }, [moveSnake, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({x: 0, y: -1});
          break;
        case 'ArrowDown':
          if (direction.y === 0) setDirection({x: 0, y: 1});
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({x: -1, y: 0});
          break;
        case 'ArrowRight':
          if (direction.x === 0) setDirection({x: 1, y: 0});
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  return (
    <div className="snake-game">
      <div className="game-board">
        {Array.from({length: BOARD_SIZE}).map((_, row) =>
          <div key={row} className="row">
            {Array.from({length: BOARD_SIZE}).map((_, col) => {
              const isSnake = snake.some(segment => segment.x === col && segment.y === row);
              const isFood = food.x === col && food.y === row;
              return (
                <div 
                  key={`${row}-${col}`}
                  className={`cell ${isSnake ? 'snake' : ''} ${isFood ? 'food' : ''}`}
                />
              );
            })}
          </div>
        )}
      </div>
      {gameOver && <div className="game-over">Game Over!</div>}
    </div>
  );
};

export default SnakeGame;
