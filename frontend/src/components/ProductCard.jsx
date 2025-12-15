import React from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import frameicon from "../assets/Frame.png";

function OutlineIcon() {
  return (
    <img src={frameicon} className="w-14 h-14 mb-6" />
  );
}

export default function ProductCard({ item, onClick }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => onClick(item)}   
      className="rounded-3xl text-white p-6 flex flex-col gap-4 transition-transform duration-200 hover:-translate-y-1 cursor-pointer"
      style={{
        backgroundColor: item.bg,
        boxShadow: `0 18px 30px ${item.shadow}`,
      }}
    >
      <OutlineIcon />

      <div>
        <h3 className="text-xl font-semibold">{item.title}</h3>
        <p className="text-sm leading-relaxed opacity-90 mt-3">{item.text}</p>
      </div>

      <div className="mt-auto flex items-center justify-between text-base font-semibold">
        <span>{item.btn}</span>
        <span className="h-11 w-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
          <FiArrowUpRight size={20} />
        </span>
      </div>
    </div>
  );
}
