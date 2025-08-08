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
    <div className="w-full max-w-5xl mx-auto bg-white/90 rounded-2xl shadow-2xl backdrop-blur p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="m-0 text-2xl sm:text-3xl font-bold text-gray-800">{title}</h1>
        <button
          onClick={onBack}
          className="inline-flex items-center px-3 py-2 rounded-xl bg-gray-900 text-white text-sm sm:text-base shadow-md hover:shadow-lg hover:bg-black/90 transition"
        >
          ← Back to Menu
        </button>
      </div>

      {/* Game Content */}
      <div className="flex flex-col items-center justify-center gap-4">
        {children}
      </div>
    </div>
  );
}
