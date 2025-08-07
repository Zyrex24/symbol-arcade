import React from "react";

interface GameContainerProps {
  title: string;
  children: React.ReactNode;
  onBack: () => void;
}

export default function GameContainer({
  title,
  children,
  onBack,
}: GameContainerProps) {
  return (
    <div className="game-container">
      {/* Header */}
      <div className="game-header">
        <h1 className="game-title">{title}</h1>
        <button onClick={onBack} className="back-button">
          ← Back to Menu
        </button>
      </div>

      {/* Game Content */}
      <div className="game-content">{children}</div>
    </div>
  );
}
